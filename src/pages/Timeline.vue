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
          :clickable="true"
          @like="handleLike"
          @unlike="handleUnlike"
          @comment="handleComment"
          @share="handleShare"
          @delete="handleDelete"
          @report="handleReport"
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
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import PostCard from '../components/PostCard.vue';
import { getStoreSafely } from '../utils/pinia';

const router = useRouter();
const $q = useQuasar();

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
  // Navigate to post detail page
  router.push({ name: 'post-detail', params: { id: postId } });
};

const handleShare = async (post) => {
  const postUrl = `${window.location.origin}/#/posts/${post.id}`;
  const shareText = post.content 
    ? `${post.content.substring(0, 100)}${post.content.length > 100 ? '...' : ''}`
    : 'Pogledajte ovu objavu na Lovački Kutak';
  const shareTitle = `Objava od ${post.user?.name || 'korisnika'}`;

  // Try Web Share API first (works on mobile devices)
  if (navigator.share) {
    try {
      await navigator.share({
        title: shareTitle,
        text: shareText,
        url: postUrl,
      });
      $q.notify({
        type: 'positive',
        message: 'Objava podeljena',
        position: 'top',
      });
      return;
    } catch (error) {
      // User cancelled or error occurred
      if (error.name !== 'AbortError') {
        console.error('Share error:', error);
      }
      // Fall through to clipboard method
    }
  }

  // Fallback: Copy to clipboard
  try {
    await navigator.clipboard.writeText(postUrl);
    $q.notify({
      type: 'positive',
      message: 'Link kopiran u clipboard',
      position: 'top',
      icon: 'content_copy',
    });
  } catch (error) {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = postUrl;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      $q.notify({
        type: 'positive',
        message: 'Link kopiran u clipboard',
        position: 'top',
        icon: 'content_copy',
      });
    } catch (err) {
      $q.notify({
        type: 'negative',
        message: 'Neuspešno deljenje. Molimo kopirajte link ručno.',
        position: 'top',
      });
    } finally {
      document.body.removeChild(textArea);
    }
  }
};

const handleDelete = async (postId) => {
  if (!postsStoreRef.value) return;
  
  try {
    // TODO: Call API to delete post
    // await apiService.delete(`/posts/${postId}`);
    
    // Remove from local list
    const index = postsStoreRef.value.posts.findIndex(p => p.id === postId);
    if (index !== -1) {
      postsStoreRef.value.posts.splice(index, 1);
    }
    
    $q.notify({
      type: 'positive',
      message: 'Objava obrisana',
      position: 'top',
    });
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: 'Neuspešno brisanje objave',
      position: 'top',
    });
  }
};

const handleReport = async (postId) => {
  // TODO: Implement report functionality
  console.log('Report post:', postId);
};
</script>

