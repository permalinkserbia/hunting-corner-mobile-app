<template>
  <q-page>
    <q-pull-to-refresh @refresh="refresh">
      <q-infinite-scroll @load="loadMore" :offset="250" :disable="!hasMore || loading">
        <div v-if="articles.length === 0 && !loading" class="text-center q-pa-lg">
          <q-icon name="article" size="64px" color="grey" />
          <div class="text-grey q-mt-md">Nema članaka</div>
        </div>

        <q-list>
          <q-item
            v-for="article in articles"
            :key="article.id"
            clickable
            v-ripple
            @click="$router.push({ name: 'article-detail', params: { slug: article.slug } })"
            class="q-pa-md"
          >
            <q-item-section avatar>
              <LazyImage
                :src="article.featured_image"
                :width="100"
                :height="100"
                fit="cover"
                :show-spinner="false"
                class="rounded-borders"
              />
            </q-item-section>

            <q-item-section>
              <q-item-label class="text-weight-bold">{{ article.title }}</q-item-label>
              <q-item-label caption lines="2">
                {{ article.excerpt || article.content?.substring(0, 100) + '...' }}
              </q-item-label>
              <q-item-label caption class="q-mt-xs">
                <q-chip
                  v-if="article.category"
                  size="sm"
                  color="primary"
                  text-color="white"
                  :label="article.category.name"
                />
                <span class="q-ml-sm">{{ formatDate(article.published_at) }}</span>
                <span class="q-ml-sm">•</span>
                <span class="q-ml-sm">{{ article.views_count }} pregleda</span>
              </q-item-label>
            </q-item-section>

            <q-item-section side>
              <q-icon name="chevron_right" color="grey" />
            </q-item-section>
          </q-item>
        </q-list>

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
import { ref, onMounted, nextTick } from 'vue';
import apiService from '../services/api';
import { formatRelativeTime } from '../utils/date';
import LazyImage from '../components/LazyImage.vue';

const articles = ref([]);
const loading = ref(false);
const hasMore = ref(true);
const currentPage = ref(1);

onMounted(async () => {
  await nextTick();
  await fetchArticles(1);
});

const fetchArticles = async (page = 1) => {
  loading.value = true;
  try {
    const response = await apiService.get('/articles', {
      params: { page },
    });

    if (page === 1) {
      articles.value = response.data.data;
    } else {
      articles.value = [...articles.value, ...response.data.data];
    }

    currentPage.value = page;
    hasMore.value = page < response.data.meta.last_page;
  } catch (error) {
    console.error('Failed to fetch articles:', error);
  } finally {
    loading.value = false;
  }
};

const loadMore = async (index, done) => {
  if (!hasMore.value || loading.value) {
    done();
    return;
  }
  await fetchArticles(currentPage.value + 1);
  done();
};

const refresh = async (done) => {
  await fetchArticles(1);
  done();
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
</script>

