import { createRouter, createWebHashHistory } from 'vue-router';
import { getStoreSafely } from '../utils/pinia';

const routes = [
  {
    path: '/',
    component: () => import('src/layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        redirect: '/timeline',
      },
      {
        path: 'timeline',
        name: 'timeline',
        component: () => import('src/pages/Timeline.vue'),
      },
      {
        path: 'posts/:id',
        name: 'post-detail',
        component: () => import('src/pages/PostDetail.vue'),
      },
      {
        path: 'post/create',
        name: 'post-create',
        component: () => import('src/pages/PostCreate.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'ads',
        name: 'ads',
        component: () => import('src/pages/Ads.vue'),
      },
      {
        path: 'ads/create',
        name: 'ad-create',
        component: () => import('src/pages/AdCreate.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'ads/:id',
        name: 'ad-detail',
        component: () => import('src/pages/AdDetail.vue'),
      },
      {
        path: 'notifications',
        name: 'notifications',
        component: () => import('src/pages/Notifications.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'profile',
        name: 'profile',
        component: () => import('src/pages/Profile.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'profile/:id',
        name: 'user-profile',
        component: () => import('src/pages/UserProfile.vue'),
      },
      {
        path: 'search',
        name: 'search',
        component: () => import('src/pages/Search.vue'),
      },
      {
        path: 'chat',
        name: 'chat',
        component: () => import('src/pages/ChatList.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'chat/:id',
        name: 'chat-detail',
        component: () => import('src/pages/ChatDetail.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'settings',
        name: 'settings',
        component: () => import('src/pages/Settings.vue'),
        meta: { requiresAuth: true },
      },
    ],
  },
  {
    path: '/auth',
    component: () => import('src/layouts/AuthLayout.vue'),
    children: [
      {
        path: 'login',
        name: 'login',
        component: () => import('src/pages/Login.vue'),
      },
      {
        path: 'register',
        name: 'register',
        component: () => import('src/pages/Register.vue'),
      },
    ],
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

router.beforeEach(async (to, from, next) => {
  // Only check auth for protected routes
  if (!to.meta.requiresAuth) {
    next();
    return;
  }

  try {
    const { useAuthStore } = await import('../stores/auth');
    const authStore = await getStoreSafely(() => useAuthStore(), 20, 50);

    // Auth should be initialized by boot file, but ensure it's done
    if (!authStore.user && !authStore.accessToken) {
      await authStore.initialize();
    }

    if (!authStore.isAuthenticated) {
      next({ name: 'login', query: { redirect: to.fullPath } });
    } else {
      next();
    }
  } catch (error) {
    // If store access fails, allow navigation (components will handle auth)
    console.warn('Auth check failed, allowing navigation:', error);
    next();
  }
});

export default router;

