<template>
  <q-page>
    <q-toolbar>
      <q-toolbar-title>Obaveštenja</q-toolbar-title>
      <q-btn
        flat
        label="Označi sve kao pročitano"
        @click="markAllRead"
        v-if="notificationsStore.unreadCount > 0"
      />
    </q-toolbar>

    <q-list>
      <q-item
        v-for="notification in notificationsStore.notifications"
        :key="notification.id"
        clickable
        :class="{ 'bg-blue-1': !notification.read_at }"
        @click="handleNotificationClick(notification)"
      >
        <q-item-section avatar>
          <q-icon :name="getNotificationIcon(notification.type)" color="primary" />
        </q-item-section>

        <q-item-section>
          <q-item-label>{{ notification.title }}</q-item-label>
          <q-item-label caption>{{ notification.message }}</q-item-label>
          <q-item-label caption>{{ formatRelativeTime(notification.created_at) }}</q-item-label>
        </q-item-section>

        <q-item-section side v-if="!notification.read_at">
          <q-badge color="primary" />
        </q-item-section>
      </q-item>
    </q-list>

    <div v-if="notificationsStore.notifications.length === 0" class="text-center q-pa-lg">
      <q-icon name="notifications_off" size="64px" color="grey" />
      <div class="text-grey q-mt-md">Nema obaveštenja</div>
    </div>
  </q-page>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useNotificationsStore } from '../stores/notifications';
import { formatRelativeTime } from '../utils/date';

const router = useRouter();
const notificationsStore = useNotificationsStore();

onMounted(async () => {
  await notificationsStore.fetchNotifications();
  notificationsStore.subscribeToRealtime();
});

onUnmounted(() => {
  notificationsStore.unsubscribeFromRealtime();
});

const getNotificationIcon = (type) => {
  const icons = {
    like: 'favorite',
    comment: 'comment',
    follow: 'person_add',
    message: 'message',
    default: 'notifications',
  };
  return icons[type] || icons.default;
};

const handleNotificationClick = async (notification) => {
  if (!notification.read_at) {
    await notificationsStore.markAsRead(notification.id);
  }

  // Deep link handling
  if (notification.data?.post_id) {
    router.push(`/timeline#post-${notification.data.post_id}`);
  } else if (notification.data?.user_id) {
    router.push(`/profile/${notification.data.user_id}`);
  } else if (notification.data?.chat_id) {
    router.push(`/chat/${notification.data.chat_id}`);
  }
};

const markAllRead = async () => {
  await notificationsStore.markAllAsRead();
};
</script>

