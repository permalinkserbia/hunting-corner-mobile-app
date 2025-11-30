// Image compression utility using canvas

const API_BASE_URL = process.env.VUE_APP_API_BASE_URL || 'https://lovackikutak.rs';

/**
 * Get full image URL from relative path
 * Backend should return full URLs, but this is a fallback for relative paths
 * @param {string} url - Image URL (can be relative or absolute)
 * @returns {string} - Full image URL
 */
export function getImageUrl(url) {
  if (!url) return '';
  
  // If URL is already absolute, return as-is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // If URL starts with /storage/, it's already a proper path
  if (url.startsWith('/storage/')) {
    return `${API_BASE_URL}${url}`;
  }
  
  // If URL starts with /, it's a relative path from domain root
  if (url.startsWith('/')) {
    return `${API_BASE_URL}${url}`;
  }
  
  // Otherwise, assume it's a storage path and prepend /storage/
  return `${API_BASE_URL}/storage/${url}`;
}

export function compressImage(file, maxWidth = 1920, maxHeight = 1920, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              reject(new Error('Compression failed'));
            }
          },
          file.type,
          quality
        );
      };

      img.onerror = reject;
      img.src = e.target.result;
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

