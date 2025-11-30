<template>
  <q-page class="q-pa-md">
    <q-list>
      <q-item-label header>Profile</q-item-label>
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
          <q-btn flat label="Edit" @click="showEditDialog = true" />
        </q-item-section>
      </q-item>

      <q-separator />

      <q-item-label header>Preferences</q-item-label>
      <q-item>
        <q-item-section>
          <q-item-label>Theme</q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-toggle v-model="darkMode" @update:model-value="toggleTheme" />
        </q-item-section>
      </q-item>

      <q-item>
        <q-item-section>
          <q-item-label>Language</q-item-label>
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

      <q-item-label header>Notifications</q-item-label>
      <q-item>
        <q-item-section>
          <q-item-label>Push Notifications</q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-toggle v-model="pushEnabled" />
        </q-item-section>
      </q-item>

      <q-separator />

      <q-item-label header>Privacy</q-item-label>
      <q-item clickable @click="$router.push('/settings/privacy')">
        <q-item-section>
          <q-item-label>Privacy Settings</q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-icon name="chevron_right" />
        </q-item-section>
      </q-item>
    </q-list>

    <q-dialog v-model="showEditDialog">
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">Edit Profile</div>
        </q-card-section>

        <q-card-section class="q-gutter-md">
          <q-input v-model="editName" label="Name" />
          <q-input v-model="editBio" label="Bio" type="textarea" />
          <q-file v-model="avatarFile" label="Avatar" accept="image/*" />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn flat label="Save" color="primary" @click="saveProfile" v-close-popup />
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
      message: 'Profile updated',
    });
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: 'Failed to update profile',
    });
  }
};
</script>

