<template>
  <q-page>
    <q-input
      v-model="query"
      placeholder="Search posts, users, ads..."
      debounce="500"
      @update:model-value="handleSearch"
      class="q-pa-md"
    >
      <template v-slot:prepend>
        <q-icon name="search" />
      </template>
    </q-input>

    <q-tabs v-model="activeTab">
      <q-tab name="all" label="All" />
      <q-tab name="posts" label="Posts" />
      <q-tab name="users" label="Users" />
      <q-tab name="ads" label="Ads" />
    </q-tabs>

    <q-tab-panels v-model="activeTab" animated>
      <q-tab-panel name="all">
        <div v-if="results.posts.length > 0">
          <div class="text-h6 q-pa-md">Posts</div>
          <PostCard v-for="post in results.posts" :key="post.id" :post="post" />
        </div>
        <div v-if="results.users.length > 0">
          <div class="text-h6 q-pa-md">Users</div>
          <q-list>
            <q-item
              v-for="user in results.users"
              :key="user.id"
              clickable
              @click="$router.push(`/profile/${user.id}`)"
            >
              <q-item-section avatar>
                <q-avatar>
                  <img v-if="user.avatar" :src="user.avatar" />
                  <q-icon v-else name="person" />
                </q-avatar>
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ user.name }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </div>
        <div v-if="results.ads.length > 0">
          <div class="text-h6 q-pa-md">Ads</div>
          <q-list>
            <q-item
              v-for="ad in results.ads"
              :key="ad.id"
              clickable
              @click="$router.push(`/ads/${ad.id}`)"
            >
              <q-item-section>
                <q-item-label>{{ ad.title }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </div>
      </q-tab-panel>

      <q-tab-panel name="posts">
        <PostCard v-for="post in results.posts" :key="post.id" :post="post" />
      </q-tab-panel>

      <q-tab-panel name="users">
        <q-list>
          <q-item
            v-for="user in results.users"
            :key="user.id"
            clickable
            @click="$router.push(`/profile/${user.id}`)"
          >
            <q-item-section avatar>
              <q-avatar>
                <img v-if="user.avatar" :src="user.avatar" />
                <q-icon v-else name="person" />
              </q-avatar>
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ user.name }}</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-tab-panel>

      <q-tab-panel name="ads">
        <q-list>
          <q-item
            v-for="ad in results.ads"
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
import { ref } from 'vue';
import { debounce } from 'lodash-es';
import apiService from '../services/api';
import PostCard from '../components/PostCard.vue';

const query = ref('');
const activeTab = ref('all');
const results = ref({
  posts: [],
  users: [],
  ads: [],
});

const handleSearch = debounce(async () => {
  if (!query.value.trim()) {
    results.value = { posts: [], users: [], ads: [] };
    return;
  }

  try {
    const response = await apiService.get('/search', {
      params: { q: query.value },
    });

    // TODO: Adjust based on actual API response structure
    results.value = {
      posts: response.data.posts || [],
      users: response.data.users || [],
      ads: response.data.ads || [],
    };
  } catch (error) {
    console.error('Search error:', error);
  }
}, 500);
</script>

