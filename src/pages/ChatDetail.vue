<template>
  <q-page class="column" style="height: calc(100vh - 100px)">
    <q-scroll-area class="col q-pa-md">
      <div v-for="message in messages" :key="message.id" class="q-mb-md">
        <div :class="message.user_id === currentUserId ? 'text-right' : 'text-left'">
          <q-bubble :sent="message.user_id === currentUserId">
            {{ message.content }}
          </q-bubble>
          <div class="text-caption text-grey q-mt-xs">
            {{ formatRelativeTime(message.created_at) }}
          </div>
        </div>
      </div>
    </q-scroll-area>

    <q-footer>
      <q-toolbar>
        <q-input
          v-model="newMessage"
          placeholder="Type a message..."
          dense
          @keyup.enter="sendMessage"
        />
        <q-btn icon="send" @click="sendMessage" />
      </q-toolbar>
    </q-footer>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import apiService from '../services/api';
import websocketService from '../services/websocket';
import { formatRelativeTime } from '../utils/date';
import { getStoreSafely } from '../utils/pinia';

const route = useRoute();
const authStoreRef = ref(null);
const messages = ref([]);
const newMessage = ref('');

const currentUserId = computed(() => authStoreRef.value?.user?.id);

onMounted(async () => {
  await nextTick();
  await nextTick();
  await new Promise((resolve) => requestAnimationFrame(resolve));
  await new Promise((resolve) => setTimeout(resolve, 100));
  
  try {
    const { useAuthStore } = await import('../stores/auth');
    authStoreRef.value = await getStoreSafely(() => useAuthStore(), 20, 50);
    await loadMessages();
    subscribeToMessages();
  } catch (error) {
    console.error('Failed to initialize auth store:', error);
    await new Promise((resolve) => setTimeout(resolve, 300));
    const { useAuthStore } = await import('../stores/auth');
    authStoreRef.value = useAuthStore();
    await loadMessages();
    subscribeToMessages();
  }
});

const loadMessages = async () => {
  try {
    const response = await apiService.get(`/chats/${route.params.id}/messages`);
    messages.value = response.data.data || response.data;
  } catch (error) {
    console.error('Load messages error:', error);
  }
};

const subscribeToMessages = () => {
  websocketService.subscribe(`chat.${route.params.id}.message`, (data) => {
    if (data.message) {
      messages.value.push(data.message);
    }
  });
};

const sendMessage = async () => {
  if (!newMessage.value.trim()) return;

  try {
    await apiService.post(`/chats/${route.params.id}/messages`, {
      content: newMessage.value,
    });
    newMessage.value = '';
  } catch (error) {
    console.error('Send message error:', error);
  }
};
</script>

