<template>
  <q-page class="flex flex-center">
    <q-card class="q-pa-md" style="min-width: 350px">
      <q-card-section>
        <div class="text-h6 text-center">Register</div>
      </q-card-section>

      <q-card-section>
        <q-form @submit="handleRegister" class="q-gutter-md">
          <q-input
            v-model="name"
            label="Name"
            :rules="[validateRequired]"
            required
          />

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
            :rules="[validatePassword]"
            required
          />

          <q-input
            v-model="passwordConfirm"
            label="Confirm Password"
            type="password"
            :rules="[(val) => val === password || 'Passwords do not match']"
            required
          />

          <div>
          <q-btn
            label="Register"
            type="submit"
            color="primary"
            class="full-width"
            :loading="loading || authStoreRef?.loading || false"
          />
          </div>

          <div class="text-center">
            <q-btn
              flat
              label="Already have an account? Login"
              @click="$router.push('/auth/login')"
            />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { validateEmail, validateRequired, validatePassword } from '../utils/validators';
import { getStoreSafely } from '../utils/pinia';

const router = useRouter();
const $q = useQuasar();

const name = ref('');
const email = ref('');
const password = ref('');
const passwordConfirm = ref('');
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
    await new Promise((resolve) => setTimeout(resolve, 300));
    const { useAuthStore } = await import('../stores/auth');
    authStoreRef.value = useAuthStore();
  }
});

const handleRegister = async () => {
  if (!authStoreRef.value) {
    try {
      const { useAuthStore } = await import('../stores/auth');
      authStoreRef.value = await getStoreSafely(() => useAuthStore(), 20, 50);
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
    const result = await authStoreRef.value.register({
      name: name.value,
      email: email.value,
      password: password.value,
    });

    if (result.success) {
      $q.notify({
        type: 'positive',
        message: 'Registration successful',
      });
      router.push('/timeline');
    } else {
      $q.notify({
        type: 'negative',
        message: result.error || 'Registration failed',
      });
    }
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: 'An error occurred. Please try again.',
    });
    console.error('Registration error:', error);
  } finally {
    loading.value = false;
  }
};
</script>

