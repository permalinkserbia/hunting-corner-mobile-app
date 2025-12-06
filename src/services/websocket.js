import Pusher from 'pusher-js';
import { getStoreSafely } from '../utils/pinia';

const API_BASE_URL = process.env.VUE_APP_API_BASE_URL || 'https://lovackikutak.rs/api';
const PUSHER_KEY = process.env.VUE_APP_PUSHER_KEY || '';
const PUSHER_CLUSTER = process.env.VUE_APP_PUSHER_CLUSTER || 'eu';

let pusher = null;
let channel = null;
const channels = new Map(); // Store multiple channels
const subscriptions = new Map();

async function initialize() {
  if (pusher) return;

  try {
    const { useAuthStore } = await import('../stores/auth');
    const authStore = await getStoreSafely(() => useAuthStore(), 10, 50);
    
    if (!authStore || !authStore.isAuthenticated || !authStore.user) {
      console.warn('User not authenticated, cannot initialize WebSocket');
      return;
    }

    if (!PUSHER_KEY) {
      console.error('PUSHER_KEY not configured. Please set VUE_APP_PUSHER_KEY in your .env file');
      return;
    }

    // Configure Pusher with proper auth endpoint
    pusher = new Pusher(PUSHER_KEY, {
      cluster: PUSHER_CLUSTER,
      encrypted: true,
      authEndpoint: `${API_BASE_URL}/broadcasting/auth`,
      auth: {
        headers: {
          Authorization: `Bearer ${authStore.accessToken}`,
          'Content-Type': 'application/json',
        },
      },
    });

    // Subscribe to user's private channel for notifications
    channel = pusher.subscribe(`private-user.${authStore.user.id}`);
    channels.set('user', channel);
    
    // Handle subscription events
    channel.bind('pusher:subscription_succeeded', () => {
      console.log('Successfully subscribed to user channel:', authStore.user.id);
    });
    
    channel.bind('pusher:subscription_error', (error) => {
      console.error('Failed to subscribe to user channel:', error);
    });
    
    // Also subscribe to timeline channel for real-time updates
    const timelineChannel = pusher.subscribe('timeline');
    channels.set('timeline', timelineChannel);
    
    // Subscribe to ads channel for new ad notifications
    const adsChannel = pusher.subscribe('ads');
    channels.set('ads', adsChannel);
    
    // Handle connection events
    pusher.connection.bind('connected', () => {
      console.log('Pusher connected');
    });
    
    pusher.connection.bind('error', (error) => {
      console.error('Pusher connection error:', error);
    });
    
    pusher.connection.bind('disconnected', () => {
      console.warn('Pusher disconnected');
    });
  } catch (error) {
    console.error('Failed to initialize WebSocket:', error);
    return;
  }
}

async function subscribe(event, callback, channelName = 'user') {
  if (!pusher) {
    await initialize();
  }

  if (!pusher) {
    console.warn('WebSocket not initialized');
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

