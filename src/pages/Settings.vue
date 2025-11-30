<template>
  <q-page class="q-pa-md">
    <q-list>
      <q-item-label header>Profil</q-item-label>
      <q-item>
        <q-item-section avatar>
          <q-avatar>
            <img v-if="authStore?.user?.avatar" :src="getImageUrl(authStore?.user?.avatar)" @error="handleImageError" />
            <q-icon v-else name="person" />
          </q-avatar>
        </q-item-section>
        <q-item-section>
          <q-item-label>{{ authStore?.user?.name || 'Loading...' }}</q-item-label>
          <q-item-label caption>{{ authStore?.user?.email || '' }}</q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-btn flat label="Izmeni" @click="showEditDialog = true" />
        </q-item-section>
      </q-item>

      <q-separator />

      <q-item-label header>Podešavanja</q-item-label>
      <q-item>
        <q-item-section>
          <q-item-label>Tema</q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-toggle v-model="darkMode" @update:model-value="toggleTheme" />
        </q-item-section>
      </q-item>

      <q-item>
        <q-item-section>
          <q-item-label>Jezik</q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-select
            v-model="language"
            :options="['sr', 'en']"
            @update:model-value="changeLanguage"
          />
        </q-item-section>
      </q-item>

      <q-separator />

      <q-item-label header>Obaveštenja</q-item-label>
      <q-item>
        <q-item-section>
          <q-item-label>Push Obaveštenja</q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-toggle v-model="pushEnabled" />
        </q-item-section>
      </q-item>

      <q-separator />

      <q-item-label header>Privatnost</q-item-label>
      <q-item clickable @click="$router.push('/settings/privacy')">
        <q-item-section>
          <q-item-label>Podešavanja Privatnosti</q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-icon name="chevron_right" />
        </q-item-section>
      </q-item>
    </q-list>

    <q-dialog v-model="showEditDialog">
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">Izmeni Profil</div>
        </q-card-section>

        <q-card-section class="q-gutter-md">
          <q-input v-model="editName" label="Ime" />
          <q-input v-model="editBio" label="Biografija" type="textarea" />
          <q-file v-model="avatarFile" label="Avatar" accept="image/*" />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Otkaži" v-close-popup />
          <q-btn flat label="Sačuvaj" color="primary" @click="saveProfile" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue';
import { useQuasar } from 'quasar';
import apiService from '../services/api';
import uploadService from '../services/upload';
import { getStoreSafely } from '../utils/pinia';
import { getImageUrl } from '../utils/image';

const $q = useQuasar();
const authStoreRef = ref(null);

const authStore = computed(() => authStoreRef.value);

function handleImageError(event) {
  console.warn('Failed to load image:', event.target.src);
}

const darkMode = ref(false);
const language = ref('sr');
const pushEnabled = ref(false);
const showEditDialog = ref(false);
const editName = ref('');
const editBio = ref('');
const avatarFile = ref(null);

onMounted(async () => {
  // Pinia is initialized via boot file, so it should be ready
  await nextTick();
  
  try {
    const { useAuthStore } = await import('../stores/auth');
    authStoreRef.value = await getStoreSafely(() => useAuthStore());
    
    if (authStoreRef.value?.user) {
      editName.value = authStoreRef.value.user.name || '';
      editBio.value = authStoreRef.value.user.bio || '';
    }
    darkMode.value = $q.dark.isActive;
  } catch (error) {
    console.error('Failed to initialize auth store:', error);
  }
});

const toggleTheme = (value) => {
  $q.dark.set(value);
};

const changeLanguage = (lang) => {
  // TODO: Implement language change
  console.log('Change language to:', lang);
};

const saveProfile = async () => {
  if (!authStoreRef.value) return;
  
  try {
    let avatarUrl = authStore.value?.user?.avatar;
    if (avatarFile.value) {
      avatarUrl = await uploadService.uploadFile(avatarFile.value);
    }

    await apiService.put('/me', {
      name: editName.value,
      bio: editBio.value,
      avatar: avatarUrl,
    });

    await authStoreRef.value.fetchCurrentUser();
    $q.notify({
      type: 'positive',
      message: 'Profil ažuriran',
    });
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: 'Neuspešno ažuriranje profila',
    });
  }
};
</script>

