import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import apiService from './api';

const pushService = {
  async initialize() {
    if (!Capacitor.isNativePlatform()) {
      // Web Push API fallback
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        return this.initializeWebPush();
      }
      return false;
    }

    // Request permission
    let permStatus = await PushNotifications.checkPermissions();
    if (permStatus.receive !== 'granted') {
      permStatus = await PushNotifications.requestPermissions();
    }

    if (permStatus.receive !== 'granted') {
      return false;
    }

    // Register for push
    await PushNotifications.register();

    // Listen for registration
    PushNotifications.addListener('registration', async (token) => {
      // Send token to backend
      try {
        await apiService.post('/notifications/register', {
          token: token.value,
          platform: Capacitor.getPlatform(),
        });
      } catch (error) {
        console.error('Failed to register push token:', error);
      }
    });

    // Listen for push notifications
    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('Push notification received:', notification);
      // Handle notification display
    });

    // Listen for notification actions
    PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      console.log('Push notification action:', action);
      // Handle deep links
    });

    return true;
  },

  async initializeWebPush() {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.VUE_APP_VAPID_PUBLIC_KEY, // TODO: Add VAPID key
      });

      await apiService.post('/notifications/register', {
        subscription: subscription.toJSON(),
        platform: 'web',
      });

      return true;
    } catch (error) {
      console.error('Web push initialization error:', error);
      return false;
    }
  },
};

export default pushService;

