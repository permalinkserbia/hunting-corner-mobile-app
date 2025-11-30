<template>
  <q-page v-if="user">
    <q-card>
      <q-card-section class="text-center">
        <q-avatar size="120px">
          <img v-if="user.avatar" :src="user.avatar" />
          <q-icon v-else name="person" size="80px" />
        </q-avatar>
        <div class="text-h6 q-mt-md">{{ user.name }}</div>
        <div class="text-caption text-grey" v-if="user.bio">{{ user.bio }}</div>
      </q-card-section>

      <q-card-actions>
        <q-btn
          :label="isFollowing ? 'Unfollow' : 'Follow'"
          :color="isFollowing ? 'grey' : 'primary'"
          @click="toggleFollow"
        />
        <q-space />
        <q-btn flat label="Message" @click="sendMessage" />
      </q-card-actions>
    </q-card>

    <q-tabs v-model="tab">
      <q-tab name="posts" label="Posts" />
      <q-tab name="ads" label="Ads" />
    </q-tabs>

    <q-tab-panels v-model="tab" animated>
      <q-tab-panel name="posts">
        <PostCard v-for="post in userPosts" :key="post.id" :post="post" />
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
            </q-item-section>
          </q-item>
        </q-list>
      </q-tab-panel>
    </q-tab-panels>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import apiService from '../services/api';
import PostCard from '../components/PostCard.vue';

const route = useRoute();
const router = useRouter();
const user = ref(null);
const isFollowing = ref(false);
const tab = ref('posts');
const userPosts = ref([]);
const userAds = ref([]);

onMounted(async () => {
  await loadUser();
});

const loadUser = async () => {
  try {
    const response = await apiService.get(`/users/${route.params.id}`);
    user.value = response.data;
    // TODO: Load user posts and ads
  } catch (error) {
    console.error('Load user error:', error);
  }
};

const toggleFollow = async () => {
  try {
    if (isFollowing.value) {
      await apiService.delete(`/users/${user.value.id}/follow`);
    } else {
      await apiService.post(`/users/${user.value.id}/follow`);
    }
    isFollowing.value = !isFollowing.value;
  } catch (error) {
    console.error('Follow error:', error);
  }
};

const sendMessage = () => {
  router.push(`/chat/${user.value.id}`);
};
</script>

