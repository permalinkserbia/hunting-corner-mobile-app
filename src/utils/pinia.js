import { getActivePinia } from 'pinia';

/**
 * Wait for Pinia to be initialized
 * @returns {Promise<boolean>} True if Pinia is available
 */
export function waitForPinia(maxAttempts = 10, delay = 50) {
  return new Promise((resolve) => {
    let attempts = 0;
    
    const checkPinia = () => {
      const pinia = getActivePinia();
      if (pinia) {
        resolve(true);
        return;
      }
      
      attempts++;
      if (attempts >= maxAttempts) {
        resolve(false);
        return;
      }
      
      setTimeout(checkPinia, delay);
    };
    
    checkPinia();
  });
}

/**
 * Safely get a store, waiting for Pinia if needed
 * @param {Function} storeFactory - Function that returns the store (e.g., () => useAuthStore())
 * @returns {Promise<any>} The store instance
 */
export async function getStoreSafely(storeFactory) {
  const pinia = getActivePinia();
  if (pinia) {
    return storeFactory();
  }
  
  // Wait for Pinia
  const available = await waitForPinia();
  if (available) {
    return storeFactory();
  }
  
  throw new Error('Pinia not available after waiting');
}

