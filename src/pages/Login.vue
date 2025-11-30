<template>
  <q-page class="flex flex-center">
    <q-card class="q-pa-md" style="min-width: 350px">
      <q-card-section>
        <div class="text-h6 text-center">Prijava</div>
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
            label="Lozinka"
            type="password"
            :rules="[validateRequired]"
            required
          />

          <div>
          <q-btn
            label="Prijavi se"
            type="submit"
            color="primary"
            class="full-width"
            :loading="loading || authStoreRef?.loading || false"
          />
          </div>

          <div class="text-center">
            <q-btn
              flat
              label="Nemate nalog? Registrujte se"
              @click="$router.push('/auth/register')"
            />
          </div>

          <!-- Social login placeholders -->
          <q-separator />
          <div class="text-center text-caption text-grey">
            Društvene mreže uskoro
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
  // Pinia is initialized via boot file, so it should be ready
  // Just wait for nextTick to ensure Vue is ready
  await nextTick();
  
  try {
    const { useAuthStore } = await import('../stores/auth');
    authStoreRef.value = await getStoreSafely(() => useAuthStore());
  } catch (error) {
    console.error('Failed to initialize auth store:', error);
  }
});

const handleLogin = async () => {
  if (!authStoreRef.value) {
    try {
      const { useAuthStore } = await import('../stores/auth');
      // Use default parameters (1000 attempts, effectively infinite for Pinia errors)
      authStoreRef.value = await getStoreSafely(() => useAuthStore());
    } catch (error) {
      // This should only catch non-Pinia errors
      console.error('Failed to get auth store (non-Pinia error):', error);
      $q.notify({
        type: 'negative',
        message: 'Došlo je do greške. Molimo pokušajte ponovo.',
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
        message: 'Uspešna prijava',
      });
      const redirect = route.query.redirect || '/timeline';
      router.push(redirect);
    } else {
      $q.notify({
        type: 'negative',
        message: result.error || 'Prijava neuspešna',
      });
    }
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: 'Došlo je do greške. Molimo pokušajte ponovo.',
    });
    console.error('Login error:', error);
  } finally {
    loading.value = false;
  }
};
</script>

