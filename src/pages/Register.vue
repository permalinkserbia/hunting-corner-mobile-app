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
              :loading="authStore.loading"
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
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useAuthStore } from '../stores/auth';
import { validateEmail, validateRequired, validatePassword } from '../utils/validators';

const router = useRouter();
const $q = useQuasar();
const authStore = useAuthStore();

const name = ref('');
const email = ref('');
const password = ref('');
const passwordConfirm = ref('');

const handleRegister = async () => {
  const result = await authStore.register({
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
};
</script>

