import localforage from 'localforage';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

// Use Capacitor Storage on native, localforage on web
const isNative = Capacitor.isNativePlatform();

const storageService = {
  async get(key) {
    if (isNative) {
      const { value } = await Preferences.get({ key });
      return value;
    } else {
      return await localforage.getItem(key);
    }
  },

  async set(key, value) {
    if (isNative) {
      await Preferences.set({ key, value: String(value) });
    } else {
      await localforage.setItem(key, value);
    }
  },

  async remove(key) {
    if (isNative) {
      await Preferences.remove({ key });
    } else {
      await localforage.removeItem(key);
    }
  },

  async clear() {
    if (isNative) {
      await Preferences.clear();
    } else {
      await localforage.clear();
    }
  },
};

export default storageService;

