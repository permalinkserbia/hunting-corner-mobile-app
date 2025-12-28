import Pusher from 'pusher-js';
import { getStoreSafely } from '../utils/pinia';

// Hardcoded configuration - update these values if backend changes
const API_BASE_URL = 'https://lovackikutak.rs/api';
const PUSHER_KEY = '66cdd20794488bcda4f4';
const PUSHER_CLUSTER = 'eu';

let pusher = null;
let channel = null;
const channels = new Map(); // Store multiple channels
const subscriptions = new Map();
let isInitializing = false; // Prevent concurrent initialization

async function initialize() {
  if (pusher) return;
  
  // Prevent concurrent initialization
  if (isInitializing) {
    // Wait for ongoing initialization to complete
    let waitCount = 0;
    while (isInitializing && waitCount < 50) {
      await new Promise(resolve => setTimeout(resolve, 100));
      waitCount++;
      if (pusher) return; // Initialization completed
    }
    if (isInitializing) {
      console.warn('WebSocket initialization timeout, proceeding anyway');
    }
  }
  
  isInitializing = true;

  try {
    const { useAuthStore } = await import('../stores/auth');
    const authStore = await getStoreSafely(() => useAuthStore(), 10, 50);
    
    if (!authStore || !authStore.isAuthenticated || !authStore.user) {
      console.warn('User not authenticated, cannot initialize WebSocket');
      return;
    }

    if (!PUSHER_KEY || PUSHER_KEY === '') {
      console.warn('PUSHER_KEY not configured. Please set VUE_APP_PUSHER_KEY in your .env file');
      console.warn('WebSocket/real-time features will not work without Pusher configuration');
      return;
    }

    // Verify token exists
    if (!authStore.accessToken) {
      console.error('No access token available for WebSocket authentication');
      return;
    }

    // Validate token by making a test API call to check if it's still valid
    // Only validate if user is authenticated (which checks isLoggingOut)
    if (authStore.isAuthenticated) {
      try {
        const apiService = await import('./api');
        const testResponse = await apiService.default.get('/me');
        
        // If we get here, token is valid
        if (!testResponse.data) {
          console.warn('Token validation returned no data');
          return;
        }
      } catch (validationError) {
        // If 401, try to refresh token
        if (validationError.response?.status === 401) {
          console.warn('Token is invalid, attempting to refresh...');
          try {
            const newToken = await authStore.refreshAccessToken();
            if (!newToken) {
              console.error('Failed to refresh token, cannot initialize WebSocket');
              return;
            }
            // Token refreshed, continue with initialization
          } catch (refreshError) {
            console.error('Token refresh failed, cannot initialize WebSocket:', refreshError);
            // Token is completely invalid, but don't logout here - let API interceptor handle it
            return;
          }
        } else {
          console.error('Token validation error:', validationError);
          // Don't initialize websocket if we can't validate the token
          return;
        }
      }
    } else {
      // Don't initialize if not authenticated or logging out
      console.warn('User not authenticated or logging out, skipping WebSocket initialization');
      return;
    }

    // Custom authorizer function to ensure token is sent correctly
    const authorizer = (channel, options) => {
      return {
        authorize: (socketId, callback) => {
          // Use fetch to send the auth request with proper headers
          const formData = new URLSearchParams();
          formData.append('socket_id', socketId);
          formData.append('channel_name', channel.name);
          
          fetch(`${API_BASE_URL}/broadcasting/auth`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${authStore.accessToken}`,
              'Content-Type': 'application/x-www-form-urlencoded',
              'Accept': 'application/json',
            },
            body: formData.toString(),
          })
          .then(async response => {
            if (!response.ok) {
              const err = await response.json();
              console.error('Pusher auth failed:', err);
              throw new Error(err.error || 'Authentication failed');
            }
            
            // Get response text first to handle potential double-encoding
            const responseText = await response.text();
            
            let data;
            try {
              // Try to parse as JSON
              data = JSON.parse(responseText);
              
              // Check if the result is still a string (double-encoded JSON)
              if (typeof data === 'string') {
                data = JSON.parse(data);
              }
            } catch (parseError) {
              console.error('Failed to parse auth response as JSON:', parseError);
              throw new Error('Invalid JSON response from server');
            }
            
            // Pusher expects the callback to receive (error, authData)
            // where authData should be an object with an 'auth' property for private channels
            if (data && typeof data === 'object' && !Array.isArray(data) && data.auth) {
              callback(null, data);
            } else {
              console.error('Invalid auth response format:', data);
              callback(new Error('Invalid auth response format'), null);
            }
          })
          .catch(error => {
            console.error('Pusher auth error:', error);
            callback(error, null);
          });
        },
      };
    };

    // Configure Pusher with custom authorizer
    pusher = new Pusher(PUSHER_KEY, {
      cluster: PUSHER_CLUSTER,
      encrypted: true,
      authorizer: authorizer,
      // Enable authorization for private channels
      enabledTransports: ['ws', 'wss'],
      // Ensure authorizer is used for all private/presence channels
      authEndpoint: undefined, // Don't use default auth endpoint
    });

    // Wait for connection to be established before subscribing
    const waitForConnection = () => {
      return new Promise((resolve) => {
        const currentState = pusher.connection.state;
        if (currentState === 'connected') {
          resolve();
          return;
        }
        
        // If already connecting, wait for it
        if (currentState === 'connecting' || currentState === 'unavailable') {
          const connectedHandler = () => {
            pusher.connection.unbind('connected', connectedHandler);
            resolve();
          };
          pusher.connection.bind('connected', connectedHandler);
        } else {
          // Connection might be in error state, resolve anyway and let it retry
          resolve();
        }
      });
    };

    // Wait for connection, then subscribe
    await waitForConnection();

    // Subscribe to user's private channel for notifications
    channel = pusher.subscribe(`private-user.${authStore.user.id}`);
    channels.set('user', channel);
    
    channel.bind('pusher:subscription_error', async (error) => {
      console.error('Failed to subscribe to user channel:', error);
      // Try to refresh token and reinitialize if it's an auth error
      if (error.status === 401 || error.status === 403 || error.error?.includes('auth')) {
        console.log('Auth error detected, attempting to refresh token...');
        disconnect(); // Disconnect first to prevent multiple retry attempts
        
        try {
          const newToken = await authStore.refreshAccessToken();
          if (newToken) {
            console.log('Token refreshed, reinitializing WebSocket...');
            // Wait a bit before reinitializing to ensure token is saved
            setTimeout(() => {
              initialize().catch(err => {
                console.error('Failed to reinitialize WebSocket after token refresh:', err);
              });
            }, 1000);
          } else {
            throw new Error('Token refresh returned no token');
          }
        } catch (refreshError) {
          console.error('Failed to refresh token:', refreshError);
          // If refresh fails, the token is completely invalid - user needs to log in again
          console.log('Token refresh failed, user needs to log in again.');
          
          // Don't call logout here as it might cause navigation issues
          // The API interceptor will handle the logout when it detects 401
        }
      }
    });
    
    // Also subscribe to timeline channel for real-time updates
    const timelineChannel = pusher.subscribe('timeline');
    channels.set('timeline', timelineChannel);
    
    // Subscribe to ads channel for new ad notifications
    const adsChannel = pusher.subscribe('ads');
    channels.set('ads', adsChannel);
    
    // Handle connection events
    pusher.connection.bind('error', (error) => {
      const errorCode = error?.error?.code || error?.code || error?.data?.code;
      const errorMessage = error?.error?.message || error?.message || error?.data?.message;
      
      // Only log non-critical errors
      if (errorCode) {
        // Error codes: 1006 = abnormal closure, 4001 = application error (often auth-related)
        if (errorCode === 1006) {
          // Network issue, usually temporary - don't log
          return;
        } else if (errorCode === 4001) {
          console.warn('Pusher application error (may be auth-related):', errorMessage);
        } else if (errorCode !== 1000) {
          // 1000 is normal closure, don't log
          console.error('Pusher connection error (code:', errorCode, '):', errorMessage);
        }
      } else if (error?.type === 'PusherError') {
        console.error('Pusher error:', errorMessage || error);
      }
    });
  } catch (error) {
    console.error('Failed to initialize WebSocket:', error);
    isInitializing = false;
    return;
  } finally {
    isInitializing = false;
  }
}

async function subscribe(event, callback, channelName = 'user') {
  // Wait for auth store to be ready before initializing
  if (!pusher) {
    // Wait for auth to be ready
    let retries = 0;
    const maxRetries = 15; // 3 seconds total (15 * 200ms)
    
    while (retries < maxRetries && !pusher) {
      try {
        const { useAuthStore } = await import('../stores/auth');
        const authStore = await getStoreSafely(() => useAuthStore(), 10, 50);
        
        if (authStore && authStore.isAuthenticated && authStore.user && authStore.accessToken) {
          // Auth is ready, try to initialize
          await initialize();
          if (pusher) {
            break; // Successfully initialized
          }
        } else if (authStore && !authStore.isAuthenticated) {
          // User is not authenticated, don't initialize websocket
          console.warn('User not authenticated, cannot subscribe to WebSocket events');
          return;
        }
      } catch (error) {
        // Auth store not ready yet, continue retrying
      }
      
      // Wait a bit before retrying
      if (!pusher && retries < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      retries++;
    }
  }

  if (!pusher) {
    console.warn('WebSocket not initialized - user may not be authenticated or token is invalid');
    return;
  }

  // Get or create channel
  let targetChannel = channels.get(channelName);
  if (!targetChannel) {
    if (channelName === 'user') {
      const { useAuthStore } = await import('../stores/auth');
      const authStore = await getStoreSafely(() => useAuthStore());
      if (authStore && authStore.user) {
        targetChannel = pusher.subscribe(`private-user.${authStore.user.id}`);
        channels.set('user', targetChannel);
        channel = targetChannel; // Keep backward compatibility
      }
    } else {
      targetChannel = pusher.subscribe(channelName);
      channels.set(channelName, targetChannel);
    }
  }

  if (!targetChannel) {
    console.warn(`Channel ${channelName} not available`);
    return;
  }

  const handler = (data) => {
    callback(data);
  };

  targetChannel.bind(event, handler);
  const key = `${channelName}:${event}`;
  subscriptions.set(key, { handler, channel: targetChannel });
}

function unsubscribe(event, channelName = 'user') {
  const key = `${channelName}:${event}`;
  const subscription = subscriptions.get(key);
  if (subscription) {
    subscription.channel.unbind(event, subscription.handler);
    subscriptions.delete(key);
  }
  
  // Backward compatibility
  if (channelName === 'user' && channel) {
    const oldKey = event;
    const oldSub = subscriptions.get(oldKey);
    if (oldSub) {
      channel.unbind(event, oldSub);
      subscriptions.delete(oldKey);
    }
  }
}

function disconnect() {
  if (pusher) {
    pusher.disconnect();
    pusher = null;
    channel = null;
    channels.clear();
    subscriptions.clear();
  }
}

// Reinitialize when auth state changes
export default {
  initialize,
  subscribe,
  unsubscribe,
  disconnect,
};

