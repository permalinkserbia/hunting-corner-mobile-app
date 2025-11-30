<template>
  <q-card class="q-mb-md">
    <q-card-section>
      <div class="row items-center q-mb-sm">
        <q-avatar>
          <img v-if="post.user?.avatar" :src="post.user.avatar" />
          <q-icon v-else name="person" />
        </q-avatar>
        <div class="q-ml-sm">
          <div class="text-weight-bold">{{ post.user?.name || 'Unknown' }}</div>
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
          <q-img v-if="media.type === 'image'" :src="media.url" fit="cover" />
          <video v-else-if="media.type === 'video'" :src="media.url" controls class="full-width" />
        </q-carousel-slide>
      </q-carousel>

      <div v-if="post.yt_link" class="q-mb-sm">
        <q-card>
          <q-card-section>
            <div class="text-caption">YouTube Link</div>
            <a :href="post.yt_link" target="_blank">{{ post.yt_link }}</a>
          </q-card-section>
        </q-card>
      </div>
    </q-card-section>

    <q-card-actions>
      <q-btn
        flat
        :icon="post.liked ? 'favorite' : 'favorite_border'"
        :color="post.liked ? 'red' : 'grey'"
        :label="post.likes_count || 0"
        @click="handleLike"
      />
      <q-btn flat icon="comment" :label="post.comments_count || 0" @click="$emit('comment', post.id)" />
      <q-btn flat icon="share" @click="$emit('share', post)" />
      <q-space />
      <q-btn flat icon="bookmark_border" />
    </q-card-actions>
  </q-card>
</template>

<script setup>
import { ref } from 'vue';
import { formatRelativeTime } from '../utils/date';

const props = defineProps({
  post: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(['like', 'unlike', 'comment', 'share']);

const slide = ref(0);

const handleLike = () => {
  if (props.post.liked) {
    emit('unlike', props.post.id);
  } else {
    emit('like', props.post.id);
  }
};
</script>

