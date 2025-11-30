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
import { ref, onMounted, nextTick } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useQuasar } from 'quasar';
import { validateEmail, validateRequired } from '../utils/validators';
import { getStoreSafely } from '../utils/pinia';

const router = useRouter();
const route = useRoute();
const $q = useQuasar();

const email = ref('');
const password = ref('');
const authStoreRef = ref(null);
const loading = ref(false);

onMounted(async () => {
  await nextTick();
  await nextTick();
  await new Promise((resolve) => requestAnimationFrame(resolve));
  await new Promise((resolve) => setTimeout(resolve, 100));
  
  try {
    const { useAuthStore } = await import('../stores/auth');
    authStoreRef.value = await getStoreSafely(() => useAuthStore(), 20, 50);
  } catch (error) {
    console.error('Failed to initialize auth store:', error);
    // Retry after delay
    await new Promise((resolve) => setTimeout(resolve, 300));
    const { useAuthStore } = await import('../stores/auth');
    authStoreRef.value = useAuthStore();
  }
});

const handleLogin = async () => {
  if (!authStoreRef.value) {
    try {
      const { useAuthStore } = await import('../stores/auth');
      authStoreRef.value = await getStoreSafely(() => useAuthStore());
    } catch (error) {
      console.error('Failed to get auth store:', error);
      $q.notify({
        type: 'negative',
        message: 'Application is still loading. Please try again.',
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
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: 'An error occurred. Please try again.',
    });
    console.error('Login error:', error);
  } finally {
    loading.value = false;
  }
};
</script>

