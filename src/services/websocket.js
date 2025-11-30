import Pusher from 'pusher-js';
import { useAuthStore } from '../stores/auth';

const WS_URL = process.env.VUE_APP_WS_URL || 'wss://api.lovackikutak.rs/ws';
const PUSHER_KEY = process.env.VUE_APP_PUSHER_KEY || '';

let pusher = null;
let channel = null;
const subscriptions = new Map();

function initialize() {
  if (pusher) return;

  const authStore = useAuthStore();
  if (!authStore.isAuthenticated) return;

  // TODO: Configure Pusher with proper auth endpoint
  // For now, using public channel (backend should handle auth)
  pusher = new Pusher(PUSHER_KEY || 'default-key', {
    cluster: process.env.VUE_APP_PUSHER_CLUSTER || 'eu',
    encrypted: true,
    // authEndpoint: `${API_BASE_URL}/broadcasting/auth`,
    // auth: {
    //   headers: {
    //     Authorization: `Bearer ${authStore.accessToken}`,
    //   },
    // },
  });

  // Subscribe to user's private channel
  channel = pusher.subscribe(`private-user.${authStore.user.id}`);
}

function subscribe(event, callback) {
  if (!channel) {
    initialize();
  }

  if (!channel) {
    console.warn('WebSocket not initialized');
    return;
  }

  const handler = (data) => {
    callback(data);
  };

  channel.bind(event, handler);
  subscriptions.set(event, handler);
}

function unsubscribe(event) {
  if (!channel) return;

  const handler = subscriptions.get(event);
  if (handler) {
    channel.unbind(event, handler);
    subscriptions.delete(event);
  }
}

function disconnect() {
  if (pusher) {
    pusher.disconnect();
    pusher = null;
    channel = null;
    subscriptions.clear();
  }
}

// Reinitialize when auth state changes
export default {
  initialize,
  subscribe,
  unsubscribe,
  disconnect,
};

