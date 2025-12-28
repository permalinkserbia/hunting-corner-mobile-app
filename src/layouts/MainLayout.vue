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
        <q-toolbar-title class="cursor-pointer" @click="$router.push('/timeline')">
          Lovački Kutak
        </q-toolbar-title>
        <q-btn flat dense icon="article" label="Članci" @click="$router.push('/articles')" />
        <q-btn flat dense round icon="search" @click="$router.push('/search')" />
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" bordered>
      <q-list>
        <q-item-label header> Meni </q-item-label>
        <q-item clickable v-ripple to="/timeline">
          <q-item-section avatar>
            <q-icon name="home" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Objave</q-item-label>
          </q-item-section>
        </q-item>
        <q-item clickable v-ripple to="/articles">
          <q-item-section avatar>
            <q-icon name="article" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Članci</q-item-label>
          </q-item-section>
        </q-item>
        <q-item clickable v-ripple to="/profile" v-if="isAuthenticated">
          <q-item-section avatar>
            <q-icon name="person" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Moj Profil</q-item-label>
          </q-item-section>
        </q-item>
        <q-item clickable v-ripple @click="handleLogout" v-if="isAuthenticated">
          <q-item-section avatar>
            <q-icon name="logout" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Odjavi se</q-item-label>
          </q-item-section>
        </q-item>
        <q-item clickable v-ripple to="/auth/login" v-if="!isAuthenticated">
          <q-item-section avatar>
            <q-icon name="login" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Prijavi se</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>

    <q-footer elevated>
      <q-tabs v-model="tab" class="text-white">
        <q-route-tab
          name="timeline"
          icon="home"
          label="Objave"
          to="/timeline"
          exact
        />
        <q-route-tab
          v-if="isAuthenticated"
          name="post"
          icon="add_circle"
          label="Objavi"
          to="/post/create"
          exact
        />
        <q-route-tab name="ads" icon="store" label="Oglasi" to="/ads" exact />
        <q-route-tab
          v-if="isAuthenticated"
          name="notifications"
          icon="notifications"
          label="Obaveštenja"
          to="/notifications"
          exact
        />
        <q-route-tab
          v-if="isAuthenticated"
          name="profile"
          icon="person"
          label="Profil"
          to="/profile"
          exact
        />
        <q-route-tab
          v-if="!isAuthenticated"
          name="login"
          icon="login"
          label="Prijavi se"
          to="/auth/login"
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
      Trenutno ste van mreže. Neke funkcije mogu biti ograničene.
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
    title: 'Potvrdi',
    message: 'Da li ste sigurni da želite da se odjavite?',
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    try {
      if (authStoreRef.value) {
        await authStoreRef.value.logout();
      }
      
      // Ensure we wait a bit for storage to clear
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Force navigation to login and clear any cached route data
      await router.push('/auth/login');
      
      // Force reload if still on a protected route
      if (router.currentRoute.value.meta?.requiresAuth) {
        window.location.href = '/#/auth/login';
      }
    } catch (error) {
      console.error('Logout navigation error:', error);
      // Force redirect as fallback
      window.location.href = '/#/auth/login';
    }
  });
};
</script>

