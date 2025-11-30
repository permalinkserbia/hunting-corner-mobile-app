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
      // Serialize data to plain JSON to avoid DataCloneError with Vue refs/reactive objects
      // Use JSON.parse(JSON.stringify()) to deep clone and remove reactivity
      const serializedData = JSON.parse(JSON.stringify(data));
      
      await cache.setItem(key, {
        data: serializedData,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('Cache set error:', error);
      // If serialization fails, try storing as-is (might work for simple data)
      try {
        await cache.setItem(key, {
          data,
          timestamp: Date.now(),
        });
      } catch (fallbackError) {
        console.error('Cache set fallback error:', fallbackError);
      }
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

