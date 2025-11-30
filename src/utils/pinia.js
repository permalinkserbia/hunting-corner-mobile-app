/**
 * Safely get a store - with Pinia boot file, stores should be ready
 * This is a simple wrapper that handles any edge cases
 * @param {Function} storeFactory - Function that returns the store (e.g., () => useAuthStore())
 * @returns {Promise<*>} - The store instance
 */
export async function getStoreSafely(storeFactory) {
  // With Quasar boot files, Pinia is initialized before components mount
  // So stores should be available immediately. But we'll add a simple retry
  // just in case there are any timing issues.
  
  let attempt = 0;
  const maxAttempts = 10;
  const delay = 50;
  
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
      
      if (isPiniaError && attempt < maxAttempts - 1) {
        // Pinia not ready yet, wait a bit and retry
        await new Promise((resolve) => setTimeout(resolve, delay));
        attempt++;
        continue;
      } else {
        // Either not a Pinia error, or we've exhausted retries
        throw error;
      }
    }
  }
  
  // Should never reach here, but just in case
  throw new Error('Failed to get store');
}
