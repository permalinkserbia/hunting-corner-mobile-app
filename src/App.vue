<template>
  <router-view />
</template>

<script setup>
import { onMounted } from 'vue';
import { getActivePinia } from 'pinia';
import { Capacitor } from '@capacitor/core';
import { Network } from '@capacitor/network';

onMounted(async () => {
  // Wait a tick to ensure Pinia is fully initialized
  await new Promise((resolve) => setTimeout(resolve, 0));
  
  const pinia = getActivePinia();
  if (!pinia) {
    console.warn('Pinia not available in App.vue onMounted');
    return;
  }

  // Import stores after Pinia is initialized
  const { useAuthStore } = await import('./stores/auth');
  const { useNetworkStore } = await import('./stores/network');
  
  const authStore = useAuthStore();
  const networkStore = useNetworkStore();

  // Initialize auth state
  await authStore.initialize();

  // Monitor network status
  if (Capacitor.isNativePlatform()) {
    const status = await Network.getStatus();
    networkStore.setStatus(status.connected);

    Network.addListener('networkStatusChange', (status) => {
      networkStore.setStatus(status.connected);
    });
  } else {
    // Browser fallback
    networkStore.setStatus(navigator.onLine);
    window.addEventListener('online', () => networkStore.setStatus(true));
    window.addEventListener('offline', () => networkStore.setStatus(false));
  }
});
</script>

