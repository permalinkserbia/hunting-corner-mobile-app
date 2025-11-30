<template>
  <q-page>
    <div v-if="loading" class="text-center q-pa-lg">
      <q-spinner-dots color="primary" size="40px" />
    </div>

    <div v-else-if="article">
      <!-- Featured Image -->
      <q-img
        v-if="article.featured_image"
        :src="article.featured_image"
        style="height: 250px"
        loading="lazy"
      >
        <template v-slot:error>
          <div class="absolute-full flex flex-center bg-grey-3">
            <q-icon name="image" size="48px" color="grey" />
          </div>
        </template>
      </q-img>

      <q-card>
        <q-card-section>
          <!-- Category -->
          <q-chip
            v-if="article.category"
            size="sm"
            color="primary"
            text-color="white"
            :label="article.category.name"
            @click="$router.push({ name: 'articles', query: { category: article.category.slug } })"
            clickable
          />

          <!-- Title -->
          <div class="text-h5 q-mt-md q-mb-sm">{{ article.title }}</div>

          <!-- Meta Info -->
          <div class="row items-center q-gutter-sm q-mb-md text-caption text-grey">
            <div class="row items-center">
              <q-avatar size="24px">
                <img
                  v-if="article.author?.avatar"
                  :src="article.author.avatar"
                  @error="handleImageError"
                />
                <q-icon v-else name="person" size="16px" />
              </q-avatar>
              <span class="q-ml-xs">{{ article.author?.name }}</span>
            </div>
            <span>•</span>
            <span>{{ formatDate(article.published_at) }}</span>
            <span>•</span>
            <span>{{ article.views_count }} pregleda</span>
          </div>

          <!-- Tags -->
          <div v-if="article.tags && article.tags.length > 0" class="q-mb-md">
            <q-chip
              v-for="tag in article.tags"
              :key="tag.id"
              size="sm"
              color="secondary"
              text-color="white"
              :label="tag.name"
              class="q-mr-xs q-mb-xs"
            />
          </div>

          <!-- Content -->
          <div class="article-content q-mb-md" v-html="article.content"></div>

          <!-- Gallery -->
          <div v-if="article.gallery && article.gallery.length > 0" class="q-mb-md">
            <q-carousel swipeable animated arrows navigation class="rounded-borders">
              <q-carousel-slide
                v-for="(image, index) in article.gallery"
                :key="index"
                :name="index"
              >
                <q-img :src="image" fit="contain" loading="lazy" />
              </q-carousel-slide>
            </q-carousel>
          </div>

          <!-- Video -->
          <div v-if="article.video_url" class="q-mb-md">
            <div class="video-container" v-html="article.video_url"></div>
          </div>
        </q-card-section>
      </q-card>

      <!-- Comments Section -->
      <q-card class="q-mt-md">
        <q-card-section>
          <div class="text-h6 q-mb-md">Komentari ({{ article.comments_count || 0 }})</div>

          <div v-if="article.comments && article.comments.length > 0" class="q-gutter-md">
            <q-item
              v-for="comment in article.comments"
              :key="comment.id"
              class="q-pa-md"
            >
              <q-item-section avatar>
                <q-avatar>
                  <img
                    v-if="comment.user?.avatar"
                    :src="comment.user.avatar"
                    @error="handleImageError"
                  />
                  <q-icon v-else name="person" />
                </q-avatar>
              </q-item-section>

              <q-item-section>
                <q-item-label class="text-weight-bold">
                  {{ comment.user?.name || 'Anoniman' }}
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

      <!-- Related Articles -->
      <q-card v-if="article.related_articles && article.related_articles.length > 0" class="q-mt-md">
        <q-card-section>
          <div class="text-h6 q-mb-md">Povezani članci</div>
          <q-list>
            <q-item
              v-for="related in article.related_articles"
              :key="related.id"
              clickable
              v-ripple
              @click="$router.push({ name: 'article-detail', params: { slug: related.slug } })"
            >
              <q-item-section avatar>
                <q-img
                  :src="related.featured_image"
                  style="width: 80px; height: 80px"
                  class="rounded-borders"
                  loading="lazy"
                />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ related.title }}</q-item-label>
                <q-item-label caption lines="2">{{ related.excerpt }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>
      </q-card>
    </div>

    <div v-else class="text-center q-pa-lg">
      <q-icon name="error" size="64px" color="negative" />
      <div class="text-h6 q-mt-md">Članak nije pronađen</div>
      <q-btn
        label="Nazad"
        color="primary"
        class="q-mt-md"
        @click="$router.back()"
      />
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import apiService from '../services/api';
import { formatRelativeTime } from '../utils/date';

const route = useRoute();
const article = ref(null);
const loading = ref(true);

onMounted(async () => {
  await nextTick();
  await loadArticle();
});

const loadArticle = async () => {
  const slug = route.params.slug;
  if (!slug) {
    loading.value = false;
    return;
  }

  loading.value = true;
  try {
    const response = await apiService.get(`/articles/${slug}`);
    article.value = response.data;
  } catch (error) {
    console.error('Failed to load article:', error);
  } finally {
    loading.value = false;
  }
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('sr-RS', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const handleImageError = (event) => {
  console.warn('Failed to load image:', event.target.src);
};
</script>

<style scoped>
.article-content {
  line-height: 1.6;
}

.article-content :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
  margin: 1rem 0;
}

.article-content :deep(p) {
  margin-bottom: 1rem;
}

.article-content :deep(h1),
.article-content :deep(h2),
.article-content :deep(h3) {
  margin-top: 1.5rem;
  margin-bottom: 1rem;
  font-weight: bold;
}

.video-container {
  position: relative;
  width: 100%;
  padding-bottom: 56.25%; /* 16:9 aspect ratio */
  height: 0;
  overflow: hidden;
}

.video-container :deep(iframe) {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
</style>

