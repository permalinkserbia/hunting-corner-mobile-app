// Jest setup file
import { config } from '@vue/test-utils';

// Mock Quasar
config.global.mocks = {
  $q: {
    notify: jest.fn(),
    dialog: jest.fn(),
    loading: {
      show: jest.fn(),
      hide: jest.fn(),
    },
  },
};

