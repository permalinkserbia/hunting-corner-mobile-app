<template>
  <router-view />
</template>

<script setup>
import { onMounted, nextTick } from 'vue';
import { Capacitor } from '@capacitor/core';
import { Network } from '@capacitor/network';
import { getStoreSafely } from './utils/pinia';
import pushService from './services/push-notifications';

let networkStore = null;

onMounted(async () => {
  // Pinia is initialized via boot file, so it should be ready
  // Auth is also initialized via boot file
  await nextTick();

  try {
    const { useNetworkStore } = await import('./stores/network');
    networkStore = await getStoreSafely(() => useNetworkStore());
  } catch (error) {
    console.error('Failed to initialize network store:', error);
    return;
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

  // Initialize push notifications after a short delay to ensure auth is ready
  if (Capacitor.isNativePlatform()) {
    setTimeout(async () => {
      try {
        const { useAuthStore } = await import('./stores/auth');
        const authStore = await getStoreSafely(() => useAuthStore(), 10, 50);
        
        if (authStore && authStore.isAuthenticated) {
          await pushService.initialize();
        }
      } catch (error) {
        console.error('Failed to initialize push notifications:', error);
      }
    }, 1000);
  }
});
</script>

