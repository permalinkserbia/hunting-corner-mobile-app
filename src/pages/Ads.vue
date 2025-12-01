<template>
  <q-page>
    <q-toolbar>
      <q-input
        v-model="searchQuery"
        placeholder="Search ads..."
        dense
        outlined
        debounce="500"
        @update:model-value="handleSearch"
        class="full-width"
      >
        <template v-slot:prepend>
          <q-icon name="search" />
        </template>
      </q-input>
    </q-toolbar>

    <q-toolbar>
      <q-btn flat label="Filters" icon="filter_list" @click="showFilters = true" />
    </q-toolbar>

    <q-list>
      <q-item
        v-for="ad in adsStore.ads"
        :key="ad.id"
        clickable
        @click="$router.push(`/ads/${ad.id}`)"
      >
        <q-item-section avatar>
          <LazyImage
            v-if="ad.images && ad.images[0]"
            :src="ad.images[0].url"
            :width="80"
            :height="80"
            fit="cover"
            :show-spinner="false"
            class="rounded-borders"
          />
          <q-icon v-else name="image" size="80px" color="grey" />
        </q-item-section>

        <q-item-section>
          <q-item-label>{{ ad.title }}</q-item-label>
          <q-item-label caption>{{ ad.category }} • {{ ad.region }}</q-item-label>
          <q-item-label class="text-primary text-weight-bold">
            {{ formatPrice(ad.price) }}
          </q-item-label>
        </q-item-section>
      </q-item>
    </q-list>

    <q-dialog v-model="showFilters">
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">Filters</div>
        </q-card-section>

        <q-card-section class="q-gutter-md">
          <q-select
            v-model="filters.category"
            :options="categoryOptions"
            label="Category"
            clearable
          />
          <q-select
            v-model="filters.region"
            :options="regionOptions"
            label="Region"
            clearable
          />
          <q-input
            v-model.number="filters.price_min"
            label="Min Price"
            type="number"
          />
          <q-input
            v-model.number="filters.price_max"
            label="Max Price"
            type="number"
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn flat label="Apply" color="primary" @click="applyFilters" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useAdsStore } from '../stores/ads';
import { debounce } from 'lodash-es';
import LazyImage from '../components/LazyImage.vue';

const adsStore = useAdsStore();
const searchQuery = ref('');
const showFilters = ref(false);
const filters = ref({
  category: null,
  region: null,
  price_min: null,
  price_max: null,
});

const categoryOptions = ['Equipment', 'Clothing', 'Accessories', 'Other'];
const regionOptions = ['Belgrade', 'Novi Sad', 'Nis', 'Other'];

onMounted(async () => {
  await adsStore.fetchAds();
});

const handleSearch = debounce(async () => {
  adsStore.setFilters({ search: searchQuery.value });
  await adsStore.fetchAds();
}, 500);

const applyFilters = async () => {
  adsStore.setFilters(filters.value);
  await adsStore.fetchAds();
};

const formatPrice = (price) => {
  return new Intl.NumberFormat('sr-RS', {
    style: 'currency',
    currency: 'RSD',
  }).format(price);
};
</script>

