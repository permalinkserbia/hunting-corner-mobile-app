import axios from 'axios';
import { useAuthStore } from '../stores/auth';

const API_BASE_URL = process.env.VUE_APP_API_BASE_URL || 'https://lovackikutak.rs/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

let authToken = null;

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    if (authToken) {
      config.headers.Authorization = `Bearer ${authToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const authStore = useAuthStore();
        const newToken = await authStore.refreshAccessToken();
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        const authStore = useAuthStore();
        await authStore.logout();
        window.location.href = '/#/auth/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

const apiService = {
  setAuthToken(token) {
    authToken = token;
  },

  get(url, config = {}) {
    return apiClient.get(url, config);
  },

  post(url, data, config = {}) {
    return apiClient.post(url, data, config);
  },

  put(url, data, config = {}) {
    return apiClient.put(url, data, config);
  },

  delete(url, config = {}) {
    return apiClient.delete(url, config);
  },

  patch(url, data, config = {}) {
    return apiClient.patch(url, data, config);
  },
};

export default apiService;

