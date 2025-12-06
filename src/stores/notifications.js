import { defineStore } from 'pinia';
import { ref } from 'vue';
import { Notify } from 'quasar';
import apiService from '../services/api';
import websocketService from '../services/websocket';

export const useNotificationsStore = defineStore('notifications', () => {
  const notifications = ref([]);
  const unreadCount = ref(0);
  const loading = ref(false);
  const websocketSubscribed = ref(false);

  async function fetchNotifications() {
    loading.value = true;
    try {
      const response = await apiService.get('/notifications');
      notifications.value = response.data.data || response.data;
      unreadCount.value = notifications.value.filter((n) => !n.read_at).length;
      return notifications.value;
    } catch (error) {
      throw error;
    } finally {
      loading.value = false;
    }
  }

  async function markAsRead(id) {
    try {
      await apiService.put(`/notifications/${id}/read`);
      const notification = notifications.value.find((n) => n.id === id);
      if (notification && !notification.read_at) {
        notification.read_at = new Date().toISOString();
        unreadCount.value = Math.max(unreadCount.value - 1, 0);
      }
    } catch (error) {
      console.error('Mark as read error:', error);
    }
  }

  async function markAllAsRead() {
    try {
      await apiService.post('/notifications/read-all');
      notifications.value.forEach((n) => {
        if (!n.read_at) {
          n.read_at = new Date().toISOString();
        }
      });
      unreadCount.value = 0;
    } catch (error) {
      console.error('Mark all as read error:', error);
    }
  }

  function subscribeToRealtime() {
    if (websocketSubscribed.value) return;

    // Listen for general notification.created events
    websocketService.subscribe('notification.created', (data) => {
      if (data.notification) {
        notifications.value.unshift(data.notification);
        if (!data.notification.read_at) {
          unreadCount.value++;
        }
      }
    });

    // Listen for post comment notifications
    websocketService.subscribe('post.comment.created', (data) => {
      if (data.notification) {
        notifications.value.unshift(data.notification);
        if (!data.notification.read_at) {
          unreadCount.value++;
        }
        // Show push notification
        showNotification(data.notification);
      }
    });

    // Listen for post like notifications
    websocketService.subscribe('post.liked', (data) => {
      if (data.notification) {
        notifications.value.unshift(data.notification);
        if (!data.notification.read_at) {
          unreadCount.value++;
        }
        // Show push notification
        showNotification(data.notification);
      }
    });

    // Listen for new ad created events
    websocketService.subscribe('ad.created', (data) => {
      // For ads, we can show a notification to all users viewing the ads page
      // The notification will be handled by the ads store or component
      console.log('New ad created:', data.ad);
    });

    websocketSubscribed.value = true;
  }

  function unsubscribeFromRealtime() {
    if (!websocketSubscribed.value) return;
    websocketService.unsubscribe('notification.created');
    websocketService.unsubscribe('post.comment.created');
    websocketService.unsubscribe('post.liked');
    websocketService.unsubscribe('ad.created');
    websocketSubscribed.value = false;
  }

  function showNotification(notification) {
    try {
      Notify.create({
        type: 'info',
        message: notification.title,
        caption: notification.message,
        icon: getNotificationIcon(notification.type),
        position: 'top',
        timeout: 5000,
        actions: [{ icon: 'close', color: 'white' }],
      });
    } catch (e) {
      // Fallback to console if Quasar not available
      console.log('Notification:', notification.title, notification.message);
    }
  }

  function getNotificationIcon(type) {
    const icons = {
      comment: 'comment',
      like: 'favorite',
      ad_created: 'campaign',
      default: 'notifications',
    };
    return icons[type] || icons.default;
  }

  return {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    subscribeToRealtime,
    unsubscribeFromRealtime,
  };
});

