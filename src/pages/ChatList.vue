<template>
  <q-page>
    <q-list>
      <q-item
        v-for="chat in chats"
        :key="chat.id"
        clickable
        @click="$router.push(`/chat/${chat.id}`)"
      >
        <q-item-section avatar>
          <q-avatar>
            <img v-if="chat.other_user?.avatar" :src="chat.other_user.avatar" />
            <q-icon v-else name="person" />
          </q-avatar>
        </q-item-section>

        <q-item-section>
          <q-item-label>{{ chat.other_user?.name || 'Unknown' }}</q-item-label>
          <q-item-label caption>{{ chat.last_message?.content }}</q-item-label>
        </q-item-section>

        <q-item-section side>
          <q-item-label caption>{{ formatRelativeTime(chat.last_message?.created_at) }}</q-item-label>
          <q-badge v-if="chat.unread_count > 0" color="primary" :label="chat.unread_count" />
        </q-item-section>
      </q-item>
    </q-list>

    <div v-if="chats.length === 0" class="text-center q-pa-lg">
      <q-icon name="chat_bubble_outline" size="64px" color="grey" />
      <div class="text-grey q-mt-md">No conversations yet</div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import apiService from '../services/api';
import { formatRelativeTime } from '../utils/date';

const chats = ref([]);

onMounted(async () => {
  await loadChats();
});

const loadChats = async () => {
  try {
    const response = await apiService.get('/chats');
    chats.value = response.data.data || response.data;
  } catch (error) {
    console.error('Load chats error:', error);
  }
};
</script>

