<template>
  <q-layout view="hHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          @click="leftDrawerOpen = !leftDrawerOpen"
        />
        <q-toolbar-title> Hunting Corner </q-toolbar-title>
        <q-btn flat dense round icon="search" @click="$router.push('/search')" />
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" show-if-above bordered>
      <q-list>
        <q-item-label header> Menu </q-item-label>
        <q-item clickable v-ripple to="/settings">
          <q-item-section avatar>
            <q-icon name="settings" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Settings</q-item-label>
          </q-item-section>
        </q-item>
        <q-item clickable v-ripple to="/profile" v-if="isAuthenticated">
          <q-item-section avatar>
            <q-icon name="person" />
          </q-item-section>
          <q-item-section>
            <q-item-label>My Profile</q-item-label>
          </q-item-section>
        </q-item>
        <q-item clickable v-ripple @click="handleLogout" v-if="isAuthenticated">
          <q-item-section avatar>
            <q-icon name="logout" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Logout</q-item-label>
          </q-item-section>
        </q-item>
        <q-item clickable v-ripple to="/auth/login" v-if="!isAuthenticated">
          <q-item-section avatar>
            <q-icon name="login" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Login</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>

    <q-footer elevated v-if="isAuthenticated">
      <q-tabs v-model="tab" class="text-white">
        <q-route-tab
          name="timeline"
          icon="home"
          label="Timeline"
          to="/timeline"
          exact
        />
        <q-route-tab
          name="post"
          icon="add_circle"
          label="Post"
          to="/post/create"
          exact
        />
        <q-route-tab name="ads" icon="store" label="Ads" to="/ads" exact />
        <q-route-tab
          name="notifications"
          icon="notifications"
          label="Notifications"
          to="/notifications"
          exact
        />
        <q-route-tab
          name="profile"
          icon="person"
          label="Profile"
          to="/profile"
          exact
        />
      </q-tabs>
    </q-footer>

    <q-banner
      v-if="!isOnline"
      class="bg-negative text-white fixed-top"
      style="z-index: 6000; margin-top: 50px"
    >
      <template v-slot:avatar>
        <q-icon name="wifi_off" />
      </template>
      You are currently offline. Some features may be limited.
    </q-banner>
  </q-layout>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { getStoreSafely } from '../utils/pinia';

const router = useRouter();
const $q = useQuasar();
const leftDrawerOpen = ref(false);
const tab = ref('timeline');

// Store references
const authStoreRef = ref(null);
const networkStoreRef = ref(null);

// Computed properties
const isAuthenticated = computed(() => {
  return authStoreRef.value?.isAuthenticated ?? false;
});

const isOnline = computed(() => {
  return networkStoreRef.value?.isOnline ?? true;
});

onMounted(async () => {
  // Pinia is initialized via boot file, so it should be ready
  await nextTick();
  
  try {
    const { useAuthStore } = await import('../stores/auth');
    const { useNetworkStore } = await import('../stores/network');
    
    authStoreRef.value = await getStoreSafely(() => useAuthStore());
    networkStoreRef.value = await getStoreSafely(() => useNetworkStore());
  } catch (error) {
    console.error('Failed to initialize stores:', error);
  }
});

const handleLogout = async () => {
  $q.dialog({
    title: 'Confirm',
    message: 'Are you sure you want to logout?',
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    if (authStoreRef.value) {
      await authStoreRef.value.logout();
    }
    router.push('/auth/login');
  });
};
</script>

