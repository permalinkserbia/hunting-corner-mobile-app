import localforage from 'localforage';

// Cache service using IndexedDB via localforage
const cache = localforage.createInstance({
  name: 'hunting-corner-cache',
  storeName: 'cache',
});

const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

const cacheService = {
  async get(key) {
    try {
      const item = await cache.getItem(key);
      if (!item) return null;

      const { data, timestamp } = item;
      const now = Date.now();

      if (now - timestamp > CACHE_TTL) {
        await cache.removeItem(key);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  },

  async set(key, data) {
    try {
      await cache.setItem(key, {
        data,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('Cache set error:', error);
    }
  },

  async remove(key) {
    try {
      await cache.removeItem(key);
    } catch (error) {
      console.error('Cache remove error:', error);
    }
  },

  async clear() {
    try {
      await cache.clear();
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  },
};

export default cacheService;

