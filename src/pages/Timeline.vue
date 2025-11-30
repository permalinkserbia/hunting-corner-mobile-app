<template>
  <q-page>
    <q-pull-to-refresh @refresh="refresh">
      <q-infinite-scroll @load="loadMore" :offset="250" :disable="!postsStoreRef || !postsStoreRef.hasMore">
        <div v-if="postsStoreRef && postsStoreRef.posts.length === 0 && !postsStoreRef.loading" class="text-center q-pa-lg">
          <q-icon name="article" size="64px" color="grey" />
          <div class="text-grey q-mt-md">No posts yet</div>
        </div>

        <PostCard
          v-for="post in (postsStoreRef?.posts || [])"
          :key="post.id"
          :post="post"
          @like="handleLike"
          @unlike="handleUnlike"
          @comment="handleComment"
          @share="handleShare"
        />

        <template v-slot:loading>
          <div class="row justify-center q-my-md">
            <q-spinner-dots color="primary" size="40px" />
          </div>
        </template>
      </q-infinite-scroll>
    </q-pull-to-refresh>
  </q-page>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue';
import PostCard from '../components/PostCard.vue';
import { getStoreSafely } from '../utils/pinia';

const postsStoreRef = ref(null);

onMounted(async () => {
  // Pinia is initialized via boot file, so it should be ready
  await nextTick();
  
  try {
    const { usePostsStore } = await import('../stores/posts');
    postsStoreRef.value = await getStoreSafely(() => usePostsStore());
    
    if (postsStoreRef.value) {
      await postsStoreRef.value.fetchPosts(1);
      await postsStoreRef.value.subscribeToRealtime();
    }
  } catch (error) {
    console.error('Failed to initialize posts store:', error);
  }
});

onUnmounted(() => {
  if (postsStoreRef.value) {
    postsStoreRef.value.unsubscribeFromRealtime();
  }
});

const refresh = async (done) => {
  if (postsStoreRef.value) {
    await postsStoreRef.value.fetchPosts(1);
  }
  done();
};

const loadMore = async (index, done) => {
  if (postsStoreRef.value) {
    await postsStoreRef.value.loadMore();
  }
  done();
};

const handleLike = (postId) => {
  if (postsStoreRef.value) {
    postsStoreRef.value.likePost(postId);
  }
};

const handleUnlike = (postId) => {
  if (postsStoreRef.value) {
    postsStoreRef.value.unlikePost(postId);
  }
};

const handleComment = (postId) => {
  // TODO: Navigate to comments
  console.log('Comment on post:', postId);
};

const handleShare = (post) => {
  // TODO: Implement share functionality
  console.log('Share post:', post);
};
</script>

