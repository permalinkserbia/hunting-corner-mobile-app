import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useNetworkStore = defineStore('network', () => {
  const isOnline = ref(true);

  function setStatus(status) {
    isOnline.value = status;
  }

  return {
    isOnline,
    setStatus,
  };
});

