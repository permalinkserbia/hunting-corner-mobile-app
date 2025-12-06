<template>
  <q-page>
    <q-pull-to-refresh @refresh="refresh">
      <div v-if="loading" class="text-center q-pa-lg">
        <q-spinner-dots color="primary" size="40px" />
      </div>

      <div v-else-if="post">
        <!-- Post Card -->
        <PostCard
          :post="post"
          :clickable="false"
          @like="handleLike"
          @unlike="handleUnlike"
          @comment="scrollToComments"
          @share="handleShare"
        />

        <!-- Comments Section -->
        <q-card class="q-mt-md">
          <q-card-section>
            <div class="text-h6 q-mb-md">Komentari ({{ post.comments_count || 0 }})</div>

            <!-- Add Comment Form -->
            <q-form @submit="handleAddComment" class="q-mb-md">
              <q-input
                v-model="newComment"
                label="Dodaj komentar..."
                type="textarea"
                rows="3"
                :rules="[validateRequired]"
                :disable="submittingComment"
              />
              <q-btn
                type="submit"
                label="Objavi"
                color="primary"
                class="q-mt-sm"
                :loading="submittingComment"
                :disable="!newComment.trim()"
              />
            </q-form>

            <!-- Comments List -->
            <div v-if="post.comments && post.comments.length > 0" class="q-gutter-md">
              <q-item
                v-for="comment in post.comments"
                :key="comment.id"
                class="q-pa-md"
              >
                <q-item-section avatar>
                  <q-avatar>
                    <LazyImage
                      v-if="comment.user?.avatar"
                      :src="getImageUrl(comment.user.avatar)"
                      :width="40"
                      :height="40"
                      fit="cover"
                      :show-spinner="false"
                      @error="handleImageError"
                    />
                    <q-icon v-else name="person" />
                  </q-avatar>
                </q-item-section>

                <q-item-section>
                  <q-item-label class="text-weight-bold">
                    {{ comment.user?.name || 'Nepoznato' }}
                  </q-item-label>
                  <q-item-label caption>
                    {{ formatRelativeTime(comment.created_at) }}
                  </q-item-label>
                  <q-item-label class="q-mt-sm">
                    {{ comment.content }}
                  </q-item-label>
                </q-item-section>
              </q-item>
            </div>

            <div v-else class="text-center q-pa-lg text-grey">
              <q-icon name="comment" size="48px" />
              <div class="q-mt-sm">Nema komentara. Budite prvi!</div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div v-else class="text-center q-pa-lg">
        <q-icon name="error" size="64px" color="negative" />
        <div class="text-h6 q-mt-md">Objava nije pronađena</div>
        <q-btn
          label="Nazad"
          color="primary"
          class="q-mt-md"
          @click="$router.back()"
        />
      </div>
    </q-pull-to-refresh>
  </q-page>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import PostCard from '../components/PostCard.vue';
import LazyImage from '../components/LazyImage.vue';
import { getStoreSafely } from '../utils/pinia';
import { formatRelativeTime } from '../utils/date';
import { getImageUrl } from '../utils/image';
import { validateRequired } from '../utils/validators';

const route = useRoute();
const router = useRouter();
const $q = useQuasar();

const postsStoreRef = ref(null);
const post = ref(null);
const loading = ref(true);
const newComment = ref('');
const submittingComment = ref(false);

onMounted(async () => {
  await nextTick();

  try {
    const { usePostsStore } = await import('../stores/posts');
    postsStoreRef.value = await getStoreSafely(() => usePostsStore());

    if (postsStoreRef.value) {
      await loadPost();
    }
  } catch (error) {
    console.error('Failed to initialize posts store:', error);
    loading.value = false;
  }
});

const loadPost = async () => {
  const postId = route.params.id;
  if (!postId) {
    loading.value = false;
    return;
  }

  loading.value = true;
  try {
    const postData = await postsStoreRef.value.fetchPost(postId);
    post.value = postData;
  } catch (error) {
    console.error('Failed to load post:', error);
    $q.notify({
      type: 'negative',
      message: 'Neuspešno učitavanje objave',
    });
  } finally {
    loading.value = false;
  }
};

const refresh = async (done) => {
  await loadPost();
  done();
};

const handleLike = async () => {
  if (!postsStoreRef.value || !post.value) return;
  await postsStoreRef.value.likePost(post.value.id);
  post.value.liked = true;
  post.value.likes_count = (post.value.likes_count || 0) + 1;
};

const handleUnlike = async () => {
  if (!postsStoreRef.value || !post.value) return;
  await postsStoreRef.value.unlikePost(post.value.id);
  post.value.liked = false;
  post.value.likes_count = Math.max((post.value.likes_count || 0) - 1, 0);
};

const handleAddComment = async () => {
  if (!postsStoreRef.value || !post.value || !newComment.value.trim()) return;

  submittingComment.value = true;
  try {
    const result = await postsStoreRef.value.addComment(post.value.id, newComment.value);

    if (result.success) {
      // Add comment to post
      if (!post.value.comments) {
        post.value.comments = [];
      }
      // Add the new comment to the array
      post.value.comments.push(result.data);
      // Ensure comments are sorted by created_at (ascending - oldest first)
      post.value.comments.sort((a, b) => {
        return new Date(a.created_at) - new Date(b.created_at);
      });
      // Update comment count
      post.value.comments_count = (post.value.comments_count || 0) + 1;
      // Clear the form to allow adding another comment
      newComment.value = '';

      $q.notify({
        type: 'positive',
        message: 'Komentar dodat',
        timeout: 2000,
      });

      // Scroll to the newly added comment after a short delay
      await nextTick();
      setTimeout(() => {
        const commentsSection = document.querySelector('.q-card');
        if (commentsSection) {
          commentsSection.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
      }, 100);
    } else {
      $q.notify({
        type: 'negative',
        message: result.error || 'Neuspešno dodavanje komentara',
      });
    }
  } catch (error) {
    console.error('Error adding comment:', error);
    $q.notify({
      type: 'negative',
      message: 'Došlo je do greške',
    });
  } finally {
    submittingComment.value = false;
  }
};

const scrollToComments = () => {
  // Scroll to comments section
  nextTick(() => {
    const commentsSection = document.querySelector('.q-card');
    if (commentsSection) {
      commentsSection.scrollIntoView({ behavior: 'smooth' });
    }
  });
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

const handleImageError = (event) => {
  console.warn('Failed to load image:', event.target.src);
};
</script>

<style scoped>
.q-item {
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.q-item:last-child {
  border-bottom: none;
}
</style>

