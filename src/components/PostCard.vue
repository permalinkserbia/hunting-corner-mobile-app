<template>
  <q-card 
    class="q-mb-md" 
    :class="{ 
      'cursor-pointer': clickable,
      'post-liked': post.liked 
    }" 
    @click="handleCardClick"
  >
    <q-card-section>
      <div class="row items-center q-mb-sm">
        <q-avatar>
          <LazyImage
            v-if="post.user?.avatar"
            :src="getImageUrl(post.user.avatar)"
            :width="40"
            :height="40"
            fit="cover"
            :show-spinner="false"
            @error="handleImageError"
          />
          <q-icon v-else name="person" />
        </q-avatar>
        <div class="q-ml-sm">
          <div class="text-weight-bold">{{ post.user?.name || 'Nepoznato' }}</div>
          <div class="text-caption text-grey">{{ formatRelativeTime(post.created_at) }}</div>
        </div>
        <q-space />
        <q-btn-dropdown
          flat
          round
          icon="more_vert"
          @click.stop
        >
          <q-list style="min-width: 150px">
            <q-item clickable v-close-popup @click="handleCopyLink">
              <q-item-section avatar>
                <q-icon name="content_copy" />
              </q-item-section>
              <q-item-section>Kopiraj link</q-item-section>
            </q-item>
            <q-item clickable v-close-popup @click="handleShare">
              <q-item-section avatar>
                <q-icon name="share" />
              </q-item-section>
              <q-item-section>Podeli</q-item-section>
            </q-item>
            <q-separator v-if="isOwnPost" />
            <q-item 
              v-if="isOwnPost" 
              clickable 
              v-close-popup 
              @click="handleDelete"
              class="text-negative"
            >
              <q-item-section avatar>
                <q-icon name="delete" color="negative" />
              </q-item-section>
              <q-item-section>Obriši objavu</q-item-section>
            </q-item>
            <q-separator v-if="!isOwnPost" />
            <q-item 
              v-if="!isOwnPost" 
              clickable 
              v-close-popup 
              @click="handleReport"
              class="text-negative"
            >
              <q-item-section avatar>
                <q-icon name="flag" color="negative" />
              </q-item-section>
              <q-item-section>Prijavi objavu</q-item-section>
            </q-item>
          </q-list>
        </q-btn-dropdown>
      </div>

      <div class="text-body1 q-mb-sm">{{ post.content }}</div>

      <div v-if="post.tags && post.tags.length > 0" class="q-mb-sm">
        <q-chip
          v-for="tag in post.tags"
          :key="tag"
          size="sm"
          color="primary"
          text-color="white"
        >
          {{ tag }}
        </q-chip>
      </div>

      <div v-if="post.location" class="text-caption text-grey q-mb-sm">
        <q-icon name="location_on" size="xs" />
        {{ post.location.address || `${post.location.lat}, ${post.location.lng}` }}
      </div>

      <q-carousel
        v-if="filteredMedia && filteredMedia.length > 0"
        v-model="slide"
        swipeable
        animated
        :arrows="filteredMedia.length > 1"
        :navigation="filteredMedia.length > 1"
        class="rounded-borders q-mb-sm post-carousel"
        style="height: 300px"
      >
        <q-carousel-slide
          v-for="(media, index) in filteredMedia"
          :key="index"
          :name="index"
          class="post-carousel-slide"
        >
          <LazyImage
            v-if="media.type === 'image'"
            :src="getImageUrl(media.url)"
            :width="'100%'"
            :height="300"
            fit="cover"
            error-text="Slika nije dostupna"
            @error="handleImageError"
          />
          <video v-else-if="media.type === 'video' && !isYouTubeUrl(media.url)" :src="getImageUrl(media.url)" controls class="full-width" />
        </q-carousel-slide>
      </q-carousel>

      <div v-if="youtubeEmbedUrl" class="q-mb-sm">
        <div class="youtube-embed">
          <iframe
            :src="youtubeEmbedUrl"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
            class="youtube-iframe"
          ></iframe>
        </div>
      </div>
      <div v-else-if="post.yt_link && !youtubeEmbedUrl" class="q-mb-sm">
        <q-card>
          <q-card-section>
            <div class="text-caption">YouTube Link</div>
            <a :href="post.yt_link" target="_blank" rel="noopener noreferrer">{{ post.yt_link }}</a>
          </q-card-section>
        </q-card>
      </div>
    </q-card-section>

    <q-card-actions @click.stop>
      <q-btn
        flat
        :icon="post.liked ? 'favorite' : 'favorite_border'"
        :color="post.liked ? 'red' : 'grey'"
        :label="post.likes_count || 0"
        :class="{ 'text-red': post.liked }"
        @click.stop="handleLike"
      >
        <q-tooltip v-if="post.liked">Već ste lajkovali ovu objavu</q-tooltip>
      </q-btn>
      <q-btn flat icon="comment" :label="post.comments_count || 0" @click.stop="handleComment" />
      <q-btn flat icon="share" @click.stop="$emit('share', post)" />
      <q-space />
    </q-card-actions>
  </q-card>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useAuthStore } from '../stores/auth';
import { formatRelativeTime } from '../utils/date';
import { getImageUrl } from '../utils/image';
import LazyImage from './LazyImage.vue';

const router = useRouter();
const $q = useQuasar();

// Get auth store - it should be initialized by boot file
// Use try-catch to ensure component works even if authStore isn't ready
let authStore = null;
try {
  authStore = useAuthStore();
} catch (error) {
  // Auth store not available, component will still work
  console.warn('Auth store not available in PostCard:', error);
}

const props = defineProps({
  post: {
    type: Object,
    required: true,
  },
  clickable: {
    type: Boolean,
    default: true,
  },
});

const emit = defineEmits(['like', 'unlike', 'comment', 'share', 'delete', 'report']);

const slide = ref(0);

// Check if this is the user's own post
const isOwnPost = computed(() => {
  try {
    if (!authStore || !authStore.user || !props.post.user) return false;
    return authStore.user.id === props.post.user.id;
  } catch (error) {
    console.warn('Error checking if own post:', error);
    return false;
  }
});

// Filter out YouTube URLs from media array
const filteredMedia = computed(() => {
  if (!props.post?.media || !Array.isArray(props.post.media)) {
    return [];
  }
  return props.post.media.filter(media => {
    // Exclude YouTube URLs from media carousel
    if (media.url && isYouTubeUrl(media.url)) {
      return false;
    }
    return true;
  });
});

// Check if URL is a YouTube URL
function isYouTubeUrl(url) {
  if (!url || typeof url !== 'string') {
    return false;
  }
  return /youtube\.com|youtu\.be/.test(url);
}

// Computed property for YouTube embed URL
const youtubeEmbedUrl = computed(() => {
  // Check post.yt_link first
  if (props.post?.yt_link) {
    const embedUrl = getYouTubeEmbedUrl(props.post.yt_link);
    if (embedUrl) return embedUrl;
  }
  
  // Also check if any media item is a YouTube URL
  if (props.post?.media && Array.isArray(props.post.media)) {
    for (const media of props.post.media) {
      if (media.url && isYouTubeUrl(media.url)) {
        const embedUrl = getYouTubeEmbedUrl(media.url);
        if (embedUrl) return embedUrl;
      }
    }
  }
  
  return null;
});

function handleImageError(event) {
  console.warn('Failed to load image:', event.target.src);
}

function getYouTubeEmbedUrl(url) {
  if (!url || typeof url !== 'string') {
    console.warn('Invalid YouTube URL:', url);
    return null;
  }
  
  // Extract video ID from various YouTube URL formats
  let videoId = '';
  
  // Handle different YouTube URL formats
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      videoId = match[1];
      break;
    }
  }
  
  if (!videoId) {
    // If no pattern matches, try to extract from the URL directly
    const urlParts = url.split(/[?&#]/);
    for (const part of urlParts) {
      if (part.startsWith('v=')) {
        videoId = part.substring(2);
        break;
      }
    }
  }
  
  // Also try to extract if the URL is just the video ID
  if (!videoId && url.length === 11 && /^[a-zA-Z0-9_-]{11}$/.test(url)) {
    videoId = url;
  }
  
  if (!videoId) {
    console.warn('Could not extract YouTube video ID from:', url);
    return null;
  }
  
  return `https://www.youtube.com/embed/${videoId}`;
}

const handleCardClick = () => {
  if (props.clickable) {
    router.push({ name: 'post-detail', params: { id: props.post.id } });
  }
};

const handleLike = () => {
  if (props.post.liked) {
    emit('unlike', props.post.id);
  } else {
    emit('like', props.post.id);
  }
};

const handleComment = () => {
  emit('comment', props.post.id);
  if (props.clickable) {
    router.push({ name: 'post-detail', params: { id: props.post.id } });
  }
};

const handleCopyLink = async () => {
  const postUrl = `${window.location.origin}/#/posts/${props.post.id}`;
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
        message: 'Neuspešno kopiranje linka',
        position: 'top',
      });
    } finally {
      document.body.removeChild(textArea);
    }
  }
};

const handleShare = () => {
  emit('share', props.post);
};

const handleDelete = () => {
  $q.dialog({
    title: 'Potvrdi brisanje',
    message: 'Da li ste sigurni da želite da obrišete ovu objavu?',
    cancel: true,
    persistent: true,
  }).onOk(() => {
    emit('delete', props.post.id);
  });
};

const handleReport = () => {
  $q.dialog({
    title: 'Prijavi objavu',
    message: 'Da li želite da prijavite ovu objavu?',
    cancel: true,
    persistent: true,
  }).onOk(() => {
    emit('report', props.post.id);
    $q.notify({
      type: 'positive',
      message: 'Objava je prijavljena',
      position: 'top',
    });
  });
};
</script>

<style scoped>
.youtube-embed {
  position: relative;
  width: 100%;
  padding-bottom: 56.25%; /* 16:9 aspect ratio */
  height: 0;
  overflow: hidden;
  border-radius: 4px;
}

.youtube-iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.post-liked {
  border-left: 3px solid #f44336;
}

/* Prevent carousel from interfering with vertical page scroll */
.post-carousel {
  /* Allow both horizontal (for carousel) and vertical (for page) scrolling */
  touch-action: pan-x pan-y pinch-zoom;
  /* Prevent any internal scrolling */
  overflow: hidden;
}

.post-carousel-slide {
  /* Ensure slides don't have scrollable content */
  overflow: hidden !important;
  touch-action: pan-x pan-y;
}

.post-carousel :deep(.q-carousel__slide) {
  overflow: hidden !important;
  /* Allow vertical scrolling to pass through */
  touch-action: pan-x pan-y;
  /* Prevent any scroll behavior on the slide itself */
  overscroll-behavior: contain;
}

.post-carousel :deep(.q-carousel__slide__content) {
  overflow: hidden !important;
  touch-action: pan-x pan-y;
  height: 100%;
  width: 100%;
}

.post-carousel :deep(img) {
  /* Prevent image drag/select but allow touch events for scrolling */
  touch-action: pan-x pan-y;
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
  pointer-events: auto;
  /* Prevent image from being draggable */
  -webkit-user-drag: none;
  -khtml-user-drag: none;
  -moz-user-drag: none;
  -o-user-drag: none;
  user-drag: none;
  /* Prevent image from having its own scroll */
  display: block;
  max-width: 100%;
  height: auto;
}

/* Ensure carousel track allows proper touch handling */
.post-carousel :deep(.q-carousel__track) {
  touch-action: pan-x pan-y;
}
</style>

