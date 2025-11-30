<template>
  <router-view />
</template>

<script setup>
import { onMounted, nextTick } from 'vue';
import { Capacitor } from '@capacitor/core';
import { Network } from '@capacitor/network';
import { getStoreSafely } from './utils/pinia';

let authStore = null;
let networkStore = null;

onMounted(async () => {
  // Pinia is initialized via boot file, so it should be ready
  // Just wait for nextTick to ensure Vue is ready
  await nextTick();

  try {
    const { useAuthStore } = await import('./stores/auth');
    const { useNetworkStore } = await import('./stores/network');

    authStore = await getStoreSafely(() => useAuthStore());
    networkStore = await getStoreSafely(() => useNetworkStore());
  } catch (error) {
    console.error('Failed to initialize stores:', error);
    return;
  }

  // Initialize auth state
  if (authStore) {
    try {
      await authStore.initialize();
    } catch (error) {
      console.error('Failed to initialize auth:', error);
    }
  }

  // Monitor network status
  if (networkStore) {
    if (Capacitor.isNativePlatform()) {
      try {
        const status = await Network.getStatus();
        networkStore.setStatus(status.connected);

        Network.addListener('networkStatusChange', (status) => {
          networkStore.setStatus(status.connected);
        });
      } catch (error) {
        console.error('Failed to setup network monitoring:', error);
      }
    } else {
      // Browser fallback
      networkStore.setStatus(navigator.onLine);
      window.addEventListener('online', () => networkStore.setStatus(true));
      window.addEventListener('offline', () => networkStore.setStatus(false));
    }
  }
});
</script>

