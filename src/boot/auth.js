import { boot } from 'quasar/wrappers';
import { useAuthStore } from '../stores/auth';

export default boot(async ({ router }) => {
  // Initialize auth store to restore session from storage
  try {
    const authStore = useAuthStore();
    await authStore.initialize();
  } catch (error) {
    console.error('Failed to initialize auth in boot file:', error);
  }
});

