import { mount } from '@vue/test-utils';
import { describe, it, expect } from '@jest/globals';
import PostCreate from '../../src/pages/PostCreate.vue';
import { Quasar } from 'quasar';

describe('PostCreate.vue', () => {
  const wrapper = mount(PostCreate, {
    global: {
      plugins: [Quasar],
      mocks: {
        $router: {
          push: jest.fn(),
          back: jest.fn(),
        },
        $q: {
          notify: jest.fn(),
        },
      },
    },
  });

  it('renders form elements', () => {
    expect(wrapper.find('textarea').exists()).toBe(true);
  });

  it('validates required content', async () => {
    const form = wrapper.find('form');
    await form.trigger('submit');
    // Form should not submit without content
    expect(wrapper.vm.content).toBe('');
  });
});

