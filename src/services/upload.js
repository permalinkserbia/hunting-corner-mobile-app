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

      // Get signed URL
      const { upload_url, public_url, fields } = await this.getSignedUrl(
        fileToUpload.name,
        fileToUpload.type
      );

      // Upload to S3-compatible storage
      const formData = new FormData();
      if (fields) {
        Object.keys(fields).forEach((key) => {
          formData.append(key, fields[key]);
        });
      }
      formData.append('file', fileToUpload);

      await fetch(upload_url, {
        method: 'POST',
        body: formData,
        // Note: Progress tracking requires XMLHttpRequest
      });

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

