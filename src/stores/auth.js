import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import apiService from '../services/api';
import storageService from '../services/storage';

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null);
  const accessToken = ref(null);
  const refreshToken = ref(null);
  const loading = ref(false);
  const isLoggingOut = ref(false);

  const isAuthenticated = computed(() => !!accessToken.value && !!user.value && !isLoggingOut.value);

  async function initialize() {
    // Don't initialize if we're in the process of logging out
    if (isLoggingOut.value) {
      return;
    }

    try {
      const storedToken = await storageService.get('access_token');
      const storedRefresh = await storageService.get('refresh_token');
      const storedUser = await storageService.get('user');

      if (storedToken && storedUser) {
        accessToken.value = storedToken;
        refreshToken.value = storedRefresh;
        user.value = JSON.parse(storedUser);
        apiService.setAuthToken(storedToken);

        // Initialize push notifications if user is already logged in
        if (typeof window !== 'undefined' && window.Capacitor?.isNativePlatform()) {
          try {
            const pushService = await import('../services/push-notifications');
            await pushService.default.initialize();
          } catch (error) {
            console.error('Failed to initialize push notifications:', error);
          }
        }
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
    }
  }

  async function login(credentials) {
    loading.value = true;
    try {
      const response = await apiService.post('/auth/login', credentials);
      const { access_token, refresh_token, user: userData } = response.data;

      accessToken.value = access_token;
      refreshToken.value = refresh_token;
      user.value = userData;

      await storageService.set('access_token', access_token);
      await storageService.set('refresh_token', refresh_token);
      await storageService.set('user', JSON.stringify(userData));

      apiService.setAuthToken(access_token);

      // Initialize push notifications after login
      if (typeof window !== 'undefined' && window.Capacitor?.isNativePlatform()) {
        try {
          const pushService = await import('../services/push-notifications');
          await pushService.default.initialize();
        } catch (error) {
          console.error('Failed to initialize push notifications after login:', error);
        }
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Login failed',
      };
    } finally {
      loading.value = false;
    }
  }

  async function register(userData) {
    loading.value = true;
    try {
      const response = await apiService.post('/auth/register', userData);
      const { access_token, refresh_token, user: newUser } = response.data;

      accessToken.value = access_token;
      refreshToken.value = refresh_token;
      user.value = newUser;

      await storageService.set('access_token', access_token);
      await storageService.set('refresh_token', refresh_token);
      await storageService.set('user', JSON.stringify(newUser));

      apiService.setAuthToken(access_token);

      // Initialize push notifications after registration
      if (typeof window !== 'undefined' && window.Capacitor?.isNativePlatform()) {
        try {
          const pushService = await import('../services/push-notifications');
          await pushService.default.initialize();
        } catch (error) {
          console.error('Failed to initialize push notifications after registration:', error);
        }
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Registration failed',
      };
    } finally {
      loading.value = false;
    }
  }

  async function logout() {
    // Set flag to prevent re-initialization
    isLoggingOut.value = true;

    try {
      // Disconnect websocket first
      try {
        const websocketService = await import('../services/websocket');
        websocketService.default.disconnect();
      } catch (error) {
        console.warn('Failed to disconnect websocket:', error);
      }

      // Call logout API
      try {
        await apiService.post('/auth/logout');
      } catch (error) {
        // Continue with logout even if API call fails
        console.error('Logout API error:', error);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear all auth state FIRST (before clearing storage)
      accessToken.value = null;
      refreshToken.value = null;
      user.value = null;

      // Clear API token
      apiService.setAuthToken(null);

      // Clear storage (ensure all keys are removed)
      await storageService.remove('access_token');
      await storageService.remove('refresh_token');
      await storageService.remove('user');

      // Force clear any cached data
      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          // Remove any other auth-related keys
          const keysToRemove = [];
          for (let i = 0; i < window.localStorage.length; i++) {
            const key = window.localStorage.key(i);
            if (key && (key.includes('auth') || key.includes('token') || key.includes('user'))) {
              keysToRemove.push(key);
            }
          }
          keysToRemove.forEach(key => window.localStorage.removeItem(key));
        } catch (error) {
          console.warn('Failed to clear localStorage:', error);
        }
      }

      // Clear localforage if on web
      if (typeof window !== 'undefined' && !window.Capacitor?.isNativePlatform()) {
        try {
          await storageService.clear();
        } catch (error) {
          console.warn('Failed to clear storage:', error);
        }
      }

      // Reset logout flag after a delay to allow navigation
      setTimeout(() => {
        isLoggingOut.value = false;
      }, 1000);
    }
  }

  async function refreshAccessToken() {
    if (!refreshToken.value) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await apiService.post('/auth/refresh', {
        refresh_token: refreshToken.value,
      });

      const { access_token } = response.data;
      accessToken.value = access_token;
      await storageService.set('access_token', access_token);
      apiService.setAuthToken(access_token);

      return access_token;
    } catch (error) {
      await logout();
      throw error;
    }
  }

  async function fetchCurrentUser() {
    try {
      const response = await apiService.get('/me');
      user.value = response.data;
      await storageService.set('user', JSON.stringify(response.data));
      return response.data;
    } catch (error) {
      console.error('Fetch user error:', error);
      throw error;
    }
  }

  return {
    user,
    accessToken,
    refreshToken,
    loading,
    isAuthenticated,
    initialize,
    login,
    register,
    logout,
    refreshAccessToken,
    fetchCurrentUser,
  };
});

