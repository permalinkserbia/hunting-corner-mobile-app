<template>
  <q-page class="flex flex-center">
    <q-card class="q-pa-md" style="min-width: 350px">
      <q-card-section>
        <div class="text-h6 text-center">Login</div>
      </q-card-section>

      <q-card-section>
        <q-form @submit="handleLogin" class="q-gutter-md">
          <q-input
            v-model="email"
            label="Email"
            type="email"
            :rules="[validateEmail]"
            required
          />

          <q-input
            v-model="password"
            label="Password"
            type="password"
            :rules="[validateRequired]"
            required
          />

          <div>
          <q-btn
            label="Login"
            type="submit"
            color="primary"
            class="full-width"
            :loading="loading || authStoreRef?.loading || false"
          />
          </div>

          <div class="text-center">
            <q-btn
              flat
              label="Don't have an account? Register"
              @click="$router.push('/auth/register')"
            />
          </div>

          <!-- Social login placeholders -->
          <q-separator />
          <div class="text-center text-caption text-grey">
            Social login coming soon
          </div>
          <!-- TODO: Implement Google login -->
          <!-- TODO: Implement Facebook login -->
        </q-form>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useQuasar } from 'quasar';
import { waitForPinia } from '../utils/pinia';
import { validateEmail, validateRequired } from '../utils/validators';

const router = useRouter();
const route = useRoute();
const $q = useQuasar();

const email = ref('');
const password = ref('');
const authStoreRef = ref(null);
const loading = ref(false);

onMounted(async () => {
  // Wait for Pinia to be ready
  const piniaAvailable = await waitForPinia(20, 50);
  if (piniaAvailable) {
    const { useAuthStore } = await import('../stores/auth');
    authStoreRef.value = useAuthStore();
  } else {
    console.error('Pinia not available after waiting');
  }
});

const handleLogin = async () => {
  // Wait for store if not ready
  if (!authStoreRef.value) {
    const piniaAvailable = await waitForPinia(10, 50);
    if (piniaAvailable) {
      const { useAuthStore } = await import('../stores/auth');
      authStoreRef.value = useAuthStore();
    } else {
      $q.notify({
        type: 'negative',
        message: 'Application is still loading. Please wait a moment and try again.',
      });
      return;
    }
  }

  loading.value = true;
  try {
    const result = await authStoreRef.value.login({
      email: email.value,
      password: password.value,
    });

    if (result.success) {
      $q.notify({
        type: 'positive',
        message: 'Login successful',
      });
      const redirect = route.query.redirect || '/timeline';
      router.push(redirect);
    } else {
      $q.notify({
        type: 'negative',
        message: result.error || 'Login failed',
      });
    }
  } finally {
    loading.value = false;
  }
};
</script>

