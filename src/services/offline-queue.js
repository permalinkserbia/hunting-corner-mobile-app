import storageService from './storage';
import apiService from './api';

const QUEUE_KEY = 'offline_queue';

const offlineQueue = {
  async add(request) {
    const queue = await this.getQueue();
    queue.push({
      ...request,
      timestamp: Date.now(),
    });
    await storageService.set(QUEUE_KEY, JSON.stringify(queue));
  },

  async getQueue() {
    const data = await storageService.get(QUEUE_KEY);
    return data ? JSON.parse(data) : [];
  },

  async processQueue() {
    if (!navigator.onLine) return;

    const queue = await this.getQueue();
    if (queue.length === 0) return;

    const processed = [];
    const failed = [];

    for (const request of queue) {
      try {
        await apiService[request.method.toLowerCase()](
          request.url,
          request.data,
          request.config
        );
        processed.push(request);
      } catch (error) {
        failed.push(request);
      }
    }

    // Remove processed requests
    const remaining = queue.filter(
      (req) => !processed.some((p) => p.timestamp === req.timestamp)
    );
    await storageService.set(QUEUE_KEY, JSON.stringify(remaining));

    return { processed: processed.length, failed: failed.length };
  },

  async clear() {
    await storageService.remove(QUEUE_KEY);
  },
};

// Process queue when coming back online
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    offlineQueue.processQueue();
  });
}

export default offlineQueue;

