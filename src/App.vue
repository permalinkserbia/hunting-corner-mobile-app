<template>
  <router-view />
</template>

<script setup>
import { onMounted } from 'vue';
import { useAuthStore } from './stores/auth';
import { useNetworkStore } from './stores/network';
import { Capacitor } from '@capacitor/core';
import { Network } from '@capacitor/network';

const authStore = useAuthStore();
const networkStore = useNetworkStore();

onMounted(async () => {
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

