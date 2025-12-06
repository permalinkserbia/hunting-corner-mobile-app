import { defineStore } from 'pinia';
import { ref } from 'vue';
import { Notify } from 'quasar';
import apiService from '../services/api';
import websocketService from '../services/websocket';

export const useAdsStore = defineStore('ads', () => {
  const ads = ref([]);
  const currentAd = ref(null);
  const loading = ref(false);
  const filters = ref({
    category: null,
    region: null,
    price_min: null,
    price_max: null,
    search: '',
  });

  async function fetchAds(params = {}) {
    loading.value = true;
    try {
      const queryParams = { ...filters.value, ...params };
      const response = await apiService.get('/ads', { params: queryParams });
      ads.value = response.data.data || response.data;
      return response.data;
    } catch (error) {
      throw error;
    } finally {
      loading.value = false;
    }
  }

  async function fetchAd(id) {
    try {
      const response = await apiService.get(`/ads/${id}`);
      currentAd.value = response.data;
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async function createAd(adData) {
    try {
      const response = await apiService.post('/ads', adData);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to create ad',
      };
    }
  }

  async function favoriteAd(adId) {
    try {
      await apiService.post(`/ads/${adId}/favorite`);
      const ad = ads.value.find((a) => a.id === adId);
      if (ad) {
        ad.favorited = true;
      }
    } catch (error) {
      console.error('Favorite error:', error);
    }
  }

  async function unfavoriteAd(adId) {
    try {
      await apiService.delete(`/ads/${adId}/favorite`);
      const ad = ads.value.find((a) => a.id === adId);
      if (ad) {
        ad.favorited = false;
      }
    } catch (error) {
      console.error('Unfavorite error:', error);
    }
  }

  function setFilters(newFilters) {
    filters.value = { ...filters.value, ...newFilters };
  }

  function subscribeToRealtime() {
    // Listen for new ad created events on ads channel
    websocketService.subscribe('ad.created', (data) => {
      if (data.ad) {
        // Add new ad to the list
        ads.value.unshift(data.ad);
        
        // Show notification
        Notify.create({
          type: 'info',
          message: 'Novi oglas',
          caption: `${data.ad.user?.name || 'Korisnik'} je objavio novi oglas: ${data.ad.title}`,
          icon: 'campaign',
          position: 'top',
          timeout: 5000,
          actions: [{ icon: 'close', color: 'white' }],
        });
      }
    });
  }

  function unsubscribeFromRealtime() {
    websocketService.unsubscribe('ad.created', 'ads');
  }

  return {
    ads,
    currentAd,
    loading,
    filters,
    fetchAds,
    fetchAd,
    createAd,
    favoriteAd,
    unfavoriteAd,
    setFilters,
    subscribeToRealtime,
    unsubscribeFromRealtime,
  };
});

