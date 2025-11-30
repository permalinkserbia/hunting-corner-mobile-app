<template>
  <router-view />
</template>

<script setup>
import { onMounted, nextTick } from 'vue';
import { Capacitor } from '@capacitor/core';
import { Network } from '@capacitor/network';

let authStore = null;
let networkStore = null;

// Helper function to get store with infinite retries
async function getStoreWithRetry(storeFactory, delay = 100) {
  while (true) {
    try {
      return storeFactory();
    } catch (error) {
      const errorMessage = error?.message || '';
      const errorString = String(error);
      
      if (
        errorMessage.includes('getActivePinia') ||
        errorMessage.includes('no active Pinia') ||
        errorMessage.includes('Pinia') ||
        errorString.includes('getActivePinia') ||
        errorString.includes('no active Pinia')
      ) {
        // Pinia not ready, wait and retry
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      } else {
        // Different error, rethrow
        throw error;
      }
    }
  }
}

onMounted(async () => {
  // Wait for Vue to be ready and DOM to be rendered
  await nextTick();
  await nextTick();
  await new Promise((resolve) => requestAnimationFrame(resolve));
  await new Promise((resolve) => setTimeout(resolve, 200)); // Longer initial delay
  
  // Get stores with infinite retry (will keep trying until Pinia is ready)
  try {
    const { useAuthStore } = await import('./stores/auth');
    const { useNetworkStore } = await import('./stores/network');
    
    // These will keep retrying until Pinia is ready
    authStore = await getStoreWithRetry(() => useAuthStore(), 100);
    networkStore = await getStoreWithRetry(() => useNetworkStore(), 100);
  } catch (error) {
    console.error('Failed to initialize stores (non-Pinia error):', error);
    // If it's not a Pinia error, something else is wrong
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

