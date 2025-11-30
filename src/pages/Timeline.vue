<template>
  <q-page>
    <q-pull-to-refresh @refresh="refresh">
      <q-infinite-scroll @load="loadMore" :offset="250" :disable="!postsStore.hasMore">
        <div v-if="postsStore.posts.length === 0 && !postsStore.loading" class="text-center q-pa-lg">
          <q-icon name="article" size="64px" color="grey" />
          <div class="text-grey q-mt-md">No posts yet</div>
        </div>

        <PostCard
          v-for="post in postsStore.posts"
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
import { onMounted, onUnmounted } from 'vue';
import { usePostsStore } from '../stores/posts';
import PostCard from '../components/PostCard.vue';

const postsStore = usePostsStore();

onMounted(async () => {
  await postsStore.fetchPosts(1);
  postsStore.subscribeToRealtime();
});

onUnmounted(() => {
  postsStore.unsubscribeFromRealtime();
});

const refresh = async (done) => {
  await postsStore.fetchPosts(1);
  done();
};

const loadMore = async (index, done) => {
  await postsStore.loadMore();
  done();
};

const handleLike = (postId) => {
  postsStore.likePost(postId);
};

const handleUnlike = (postId) => {
  postsStore.unlikePost(postId);
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

