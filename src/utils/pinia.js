/**
 * Safely get a store with retry logic
 * For Pinia errors, retries indefinitely until ready
 * @param {Function} storeFactory - Function that returns the store (e.g., () => useAuthStore())
 * @param {number} maxAttempts - Maximum number of attempts for non-Pinia errors (default: 1000, effectively infinite for Pinia)
 * @param {number} delay - Delay between attempts in ms (default: 100)
 * @returns {Promise<*>} - The store instance
 */
export async function getStoreSafely(storeFactory, maxAttempts = 1000, delay = 100) {
  // First, wait for Pinia instance to exist
  if (typeof window !== 'undefined' && window.__PINIA_INSTANCE__) {
    // Give it a moment to be injected
    await new Promise((resolve) => setTimeout(resolve, 50));
  } else {
    // Wait for instance to be set
    for (let i = 0; i < 20; i++) {
      if (window.__PINIA_INSTANCE__) {
        await new Promise((resolve) => setTimeout(resolve, 50));
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }
  
  // Now try to get the store - retry indefinitely for Pinia errors
  let attempt = 0;
  while (attempt < maxAttempts) {
    try {
      return storeFactory();
    } catch (error) {
      const errorMessage = error?.message || '';
      const errorString = String(error);
      
      // Check for Pinia-related errors
      const isPiniaError = 
        errorMessage.includes('getActivePinia') ||
        errorMessage.includes('no active Pinia') ||
        errorMessage.includes('Pinia') ||
        errorString.includes('getActivePinia') ||
        errorString.includes('no active Pinia');
      
      if (isPiniaError) {
        // Pinia not ready yet, wait and retry indefinitely
        // Use exponential backoff for later attempts
        const waitTime = attempt < 10 ? delay : (attempt < 50 ? delay * 2 : delay * 3);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        attempt++;
        continue; // Keep retrying for Pinia errors
      } else {
        // Different error, rethrow it immediately
        throw error;
      }
    }
  }
  
  // Should never reach here for Pinia errors, but just in case
  throw new Error('Failed to get store after maximum attempts');
}
