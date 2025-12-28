<template>
  <q-page>
    <div v-if="!authStore || !authStore.isAuthenticated" class="flex flex-center q-pa-lg">
      <div class="text-center">
        <q-icon name="lock" size="64px" color="grey" />
        <div class="text-h6 q-mt-md">Potrebna je prijava</div>
        <q-btn
          label="Prijavi se"
          color="primary"
          @click="$router.push('/auth/login')"
          class="q-mt-md"
        />
      </div>
    </div>
    <q-card v-else-if="authStore?.user">
      <q-card-section class="text-center">
        <q-avatar size="120px">
          <LazyImage
            v-if="authStore?.user?.avatar"
            :src="getImageUrl(authStore?.user?.avatar)"
            :width="120"
            :height="120"
            fit="cover"
            :show-spinner="false"
            @error="handleImageError"
          />
          <q-icon v-else name="person" size="80px" />
        </q-avatar>
        <div class="text-h6 q-mt-md">{{ authStore?.user?.name }}</div>
        <div class="text-caption text-grey">{{ authStore?.user?.email }}</div>
      </q-card-section>

      <q-card-section>
        <q-tabs v-model="tab">
          <q-tab name="posts" label="Objave" />
          <q-tab name="ads" label="Oglasi" />
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
        <q-btn flat label="Izmeni Profil" @click="$router.push('/settings')" />
      </q-card-actions>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue';
import apiService from '../services/api';
import PostCard from '../components/PostCard.vue';
import LazyImage from '../components/LazyImage.vue';
import { getStoreSafely } from '../utils/pinia';
import { getImageUrl } from '../utils/image';

const authStoreRef = ref(null);
const tab = ref('posts');
const userPosts = ref([]);
const userAds = ref([]);

const authStore = computed(() => authStoreRef.value);

function handleImageError(event) {
  console.warn('Failed to load image:', event.target.src);
}

onMounted(async () => {
  await nextTick();
  await nextTick();
  await new Promise((resolve) => requestAnimationFrame(resolve));
  await new Promise((resolve) => setTimeout(resolve, 100));
  
  try {
    const { useAuthStore } = await import('../stores/auth');
    authStoreRef.value = await getStoreSafely(() => useAuthStore(), 20, 50);
    await loadUserData();
  } catch (error) {
    console.error('Failed to initialize auth store:', error);
    await new Promise((resolve) => setTimeout(resolve, 300));
    const { useAuthStore } = await import('../stores/auth');
    authStoreRef.value = useAuthStore();
    await loadUserData();
  }
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

