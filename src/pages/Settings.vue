<template>
  <q-page class="q-pa-md">
    <q-list>
      <q-item-label header>Profile</q-item-label>
      <q-item>
        <q-item-section avatar>
          <q-avatar>
            <img v-if="authStore.user?.avatar" :src="authStore.user.avatar" />
            <q-icon v-else name="person" />
          </q-avatar>
        </q-item-section>
        <q-item-section>
          <q-item-label>{{ authStore.user?.name }}</q-item-label>
          <q-item-label caption>{{ authStore.user?.email }}</q-item-label>
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
import { ref, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { useAuthStore } from '../stores/auth';
import apiService from '../services/api';
import uploadService from '../services/upload';

const $q = useQuasar();
const authStore = useAuthStore();

const darkMode = ref(false);
const language = ref('sr');
const pushEnabled = ref(false);
const showEditDialog = ref(false);
const editName = ref('');
const editBio = ref('');
const avatarFile = ref(null);

onMounted(() => {
  editName.value = authStore.user?.name || '';
  editBio.value = authStore.user?.bio || '';
  darkMode.value = $q.dark.isActive;
});

const toggleTheme = (value) => {
  $q.dark.set(value);
};

const changeLanguage = (lang) => {
  // TODO: Implement language change
  console.log('Change language to:', lang);
};

const saveProfile = async () => {
  try {
    let avatarUrl = authStore.user?.avatar;
    if (avatarFile.value) {
      avatarUrl = await uploadService.uploadFile(avatarFile.value);
    }

    await apiService.put('/me', {
      name: editName.value,
      bio: editBio.value,
      avatar: avatarUrl,
    });

    await authStore.fetchCurrentUser();
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

