import { defineStore } from 'pinia';
import { ref } from 'vue';
import apiService from '../services/api';
import websocketService from '../services/websocket';
import cacheService from '../services/cache';

export const usePostsStore = defineStore('posts', () => {
  const posts = ref([]);
  const loading = ref(false);
  const hasMore = ref(true);
  const currentPage = ref(1);
  const websocketSubscribed = ref(false);

  async function fetchPosts(page = 1, append = false) {
    loading.value = true;
    try {
      const response = await apiService.get('/posts', {
        params: { page },
      });

      if (append) {
        posts.value = [...posts.value, ...response.data.data];
      } else {
        posts.value = response.data.data;
      }

      currentPage.value = page;
      hasMore.value = page < response.data.meta.last_page;

      // Cache posts
      await cacheService.set('timeline_posts', posts.value);

      return response.data;
    } catch (error) {
      // Try to load from cache if offline
      if (!navigator.onLine) {
        const cached = await cacheService.get('timeline_posts');
        if (cached) {
          posts.value = cached;
        }
      }
      throw error;
    } finally {
      loading.value = false;
    }
  }

  async function loadMore() {
    if (!hasMore.value || loading.value) return;
    await fetchPosts(currentPage.value + 1, true);
  }

  async function createPost(postData) {
    try {
      const response = await apiService.post('/posts', postData);
      posts.value.unshift(response.data);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to create post',
      };
    }
  }

  async function likePost(postId) {
    try {
      await apiService.post(`/posts/${postId}/like`);
      const post = posts.value.find((p) => p.id === postId);
      if (post) {
        post.likes_count = (post.likes_count || 0) + 1;
        post.liked = true;
      }
    } catch (error) {
      console.error('Like error:', error);
    }
  }

  async function unlikePost(postId) {
    try {
      await apiService.delete(`/posts/${postId}/like`);
      const post = posts.value.find((p) => p.id === postId);
      if (post) {
        post.likes_count = Math.max((post.likes_count || 0) - 1, 0);
        post.liked = false;
      }
    } catch (error) {
      console.error('Unlike error:', error);
    }
  }

  async function subscribeToRealtime() {
    if (websocketSubscribed.value) return;

    try {
      await websocketService.subscribe('post.created', (data) => {
        // Prepend new post to timeline
        if (data.post) {
          posts.value.unshift(data.post);
        }
      });
      websocketSubscribed.value = true;
    } catch (error) {
      console.warn('Failed to subscribe to realtime updates:', error);
    }
  }

  function unsubscribeFromRealtime() {
    if (!websocketSubscribed.value) return;
    websocketService.unsubscribe('post.created');
    websocketSubscribed.value = false;
  }

  async function fetchPost(postId) {
    try {
      const response = await apiService.get(`/posts/${postId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async function addComment(postId, content) {
    try {
      const response = await apiService.post(`/posts/${postId}/comments`, {
        content,
      });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to add comment',
      };
    }
  }

  return {
    posts,
    loading,
    hasMore,
    currentPage,
    fetchPosts,
    loadMore,
    createPost,
    likePost,
    unlikePost,
    fetchPost,
    addComment,
    subscribeToRealtime,
    unsubscribeFromRealtime,
  };
});

