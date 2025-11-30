<template>
  <q-card class="q-mb-md" :class="{ 'cursor-pointer': clickable }" @click="handleCardClick">
    <q-card-section>
      <div class="row items-center q-mb-sm">
        <q-avatar>
          <img v-if="post.user?.avatar" :src="getImageUrl(post.user.avatar)" @error="handleImageError" />
          <q-icon v-else name="person" />
        </q-avatar>
        <div class="q-ml-sm">
          <div class="text-weight-bold">{{ post.user?.name || 'Nepoznato' }}</div>
          <div class="text-caption text-grey">{{ formatRelativeTime(post.created_at) }}</div>
        </div>
        <q-space />
        <q-btn flat round icon="more_vert" />
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
        v-if="post.media && post.media.length > 0"
        v-model="slide"
        swipeable
        animated
        :arrows="post.media.length > 1"
        :navigation="post.media.length > 1"
        class="rounded-borders q-mb-sm"
        style="height: 300px"
      >
        <q-carousel-slide
          v-for="(media, index) in post.media"
          :key="index"
          :name="index"
        >
          <q-img
            v-if="media.type === 'image'"
            :src="getImageUrl(media.url)"
            fit="cover"
            @error="handleImageError"
            loading="lazy"
          >
            <template v-slot:error>
              <div class="absolute-full flex flex-center bg-grey-3 text-grey-8">
                <div class="text-center">
                  <q-icon name="broken_image" size="48px" />
                  <div class="text-caption q-mt-sm">Slika nije dostupna</div>
                </div>
              </div>
            </template>
          </q-img>
          <video v-else-if="media.type === 'video'" :src="getImageUrl(media.url)" controls class="full-width" />
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
      <div v-else-if="post.yt_link" class="q-mb-sm">
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
        @click.stop="handleLike"
      />
      <q-btn flat icon="comment" :label="post.comments_count || 0" @click.stop="handleComment" />
      <q-btn flat icon="share" @click.stop="$emit('share', post)" />
      <q-space />
      <q-btn flat icon="bookmark_border" @click.stop />
    </q-card-actions>
  </q-card>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { formatRelativeTime } from '../utils/date';
import { getImageUrl } from '../utils/image';

const router = useRouter();

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

const emit = defineEmits(['like', 'unlike', 'comment', 'share']);

const slide = ref(0);

// Computed property for YouTube embed URL
const youtubeEmbedUrl = computed(() => {
  if (!props.post?.yt_link) {
    return null;
  }
  return getYouTubeEmbedUrl(props.post.yt_link);
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
</style>

