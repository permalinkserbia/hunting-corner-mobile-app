import apiService from './api';
import { compressImage } from '../utils/image';

const uploadService = {
  async getSignedUrl(filename, contentType) {
    try {
      const response = await apiService.post('/uploads/sign', {
        filename,
        content_type: contentType,
      });
      return response.data;
    } catch (error) {
      throw new Error('Failed to get upload URL');
    }
  },

  async uploadFile(file, onProgress) {
    try {
      // Compress image if it's an image
      let fileToUpload = file;
      if (file.type.startsWith('image/')) {
        fileToUpload = await compressImage(file);
      }

      // Get upload info (Laravel direct-upload endpoint + storage path)
      const { upload_url, public_url } = await this.getSignedUrl(
        fileToUpload.name,
        fileToUpload.type
      );

      // Upload to Laravel, which will then store the file on S3-compatible storage
      const formData = new FormData();
      formData.append('file', fileToUpload);

      await fetch(upload_url, {
        method: 'POST',
        body: formData,
      });

      // Backend returns a relative storage path (e.g. uploads/2025/12/uuid.jpg)
      // API that creates posts will turn this into an absolute URL using media_url
      return public_url;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  },

  async uploadMultiple(files, onProgress) {
    const uploads = files.map((file, index) =>
      this.uploadFile(file, (progress) => {
        if (onProgress) {
          onProgress((index / files.length) * 100 + (progress / files.length));
        }
      })
    );

    return Promise.all(uploads);
  },
};

export default uploadService;

