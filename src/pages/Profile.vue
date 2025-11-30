<template>
  <q-page>
    <q-card v-if="authStore.user">
      <q-card-section class="text-center">
        <q-avatar size="120px">
          <img v-if="authStore.user.avatar" :src="authStore.user.avatar" />
          <q-icon v-else name="person" size="80px" />
        </q-avatar>
        <div class="text-h6 q-mt-md">{{ authStore.user.name }}</div>
        <div class="text-caption text-grey">{{ authStore.user.email }}</div>
      </q-card-section>

      <q-card-section>
        <q-tabs v-model="tab">
          <q-tab name="posts" label="Posts" />
          <q-tab name="ads" label="Ads" />
        </q-tabs>

        <q-tab-panels v-model="tab" animated>
          <q-tab-panel name="posts">
            <PostCard
              v-for="post in userPosts"
              :key="post.id"
              :post="post"
            />
          </q-tab-panel>

          <q-tab-panel name="ads">
            <q-list>
              <q-item
                v-for="ad in userAds"
                :key="ad.id"
                clickable
                @click="$router.push(`/ads/${ad.id}`)"
              >
                <q-item-section>
                  <q-item-label>{{ ad.title }}</q-item-label>
                  <q-item-label caption>{{ formatPrice(ad.price) }}</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-tab-panel>
        </q-tab-panels>
      </q-card-section>

      <q-card-actions>
        <q-btn flat label="Edit Profile" @click="$router.push('/settings')" />
      </q-card-actions>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useAuthStore } from '../stores/auth';
import apiService from '../services/api';
import PostCard from '../components/PostCard.vue';

const authStore = useAuthStore();
const tab = ref('posts');
const userPosts = ref([]);
const userAds = ref([]);

onMounted(async () => {
  await loadUserData();
});

const loadUserData = async () => {
  try {
    // TODO: Replace with actual API endpoints
    // const postsResponse = await apiService.get(`/users/${authStore.user.id}/posts`);
    // userPosts.value = postsResponse.data.data;
    // const adsResponse = await apiService.get(`/users/${authStore.user.id}/ads`);
    // userAds.value = adsResponse.data.data;
  } catch (error) {
    console.error('Load user data error:', error);
  }
};

const formatPrice = (price) => {
  return new Intl.NumberFormat('sr-RS', {
    style: 'currency',
    currency: 'RSD',
  }).format(price);
};
</script>

