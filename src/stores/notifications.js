import { defineStore } from 'pinia';
import { ref } from 'vue';
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

    websocketService.subscribe('notification.created', (data) => {
      if (data.notification) {
        notifications.value.unshift(data.notification);
        if (!data.notification.read_at) {
          unreadCount.value++;
        }
      }
    });

    websocketSubscribed.value = true;
  }

  function unsubscribeFromRealtime() {
    if (!websocketSubscribed.value) return;
    websocketService.unsubscribe('notification.created');
    websocketSubscribed.value = false;
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

