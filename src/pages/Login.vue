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
              :loading="authStore.loading"
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
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useQuasar } from 'quasar';
import { useAuthStore } from '../stores/auth';
import { validateEmail, validateRequired } from '../utils/validators';

const router = useRouter();
const route = useRoute();
const $q = useQuasar();
const authStore = useAuthStore();

const email = ref('');
const password = ref('');

const handleLogin = async () => {
  const result = await authStore.login({
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
};
</script>

