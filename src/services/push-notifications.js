import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { Notify } from 'quasar';
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
      console.log('Push notification token registered:', token.value);
      
      // Send token to backend
      try {
        const response = await apiService.post('/notifications/register', {
          token: token.value,
          platform: Capacitor.getPlatform(),
        });
        console.log('Push token registered with backend:', response.data);
      } catch (error) {
        console.error('Failed to register push token:', error);
      }
    });

    // Listen for registration errors
    PushNotifications.addListener('registrationError', (error) => {
      console.error('Push notification registration error:', error);
    });

    // Listen for push notifications (when app is in foreground)
    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('Push notification received:', notification);
      
      // Show in-app notification using Quasar
      try {
        Notify.create({
          type: 'info',
          message: notification.title || 'Nova obaveštenja',
          caption: notification.body || '',
          icon: 'notifications',
          position: 'top',
          timeout: 5000,
          actions: [{ icon: 'close', color: 'white' }],
        });
      } catch (error) {
        console.error('Failed to show notification:', error);
      }
    });

    // Listen for notification actions (when user taps notification)
    PushNotifications.addListener('pushNotificationActionPerformed', async (action) => {
      console.log('Push notification action:', action);
      
      const data = action.notification.data || {};
      
      // Handle deep links based on notification type
      // Using hash routing since we're using createWebHashHistory
      try {
        if (data.post_id) {
          window.location.hash = `#/posts/${data.post_id}`;
          // Also try to trigger router navigation if available
          if (window.$router) {
            window.$router.push({ name: 'post-detail', params: { id: data.post_id } });
          }
        } else if (data.ad_id) {
          window.location.hash = `#/ads/${data.ad_id}`;
          if (window.$router) {
            window.$router.push({ name: 'ad-detail', params: { id: data.ad_id } });
          }
        } else if (data.notification_id) {
          window.location.hash = '#/notifications';
          if (window.$router) {
            window.$router.push({ name: 'notifications' });
          }
        }
      } catch (error) {
        console.error('Failed to handle notification action:', error);
      }
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

