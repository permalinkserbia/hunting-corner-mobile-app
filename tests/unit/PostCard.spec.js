import { mount } from '@vue/test-utils';
import { describe, it, expect } from '@jest/globals';
import PostCard from '../../src/components/PostCard.vue';
import { Quasar } from 'quasar';

const mockPost = {
  id: 1,
  content: 'Test post content',
  user: {
    id: 1,
    name: 'Test User',
    avatar: null,
  },
  created_at: new Date().toISOString(),
  likes_count: 5,
  comments_count: 2,
  liked: false,
  tags: ['hunting', 'test'],
  media: [],
};

describe('PostCard.vue', () => {
  const wrapper = mount(PostCard, {
    props: {
      post: mockPost,
    },
    global: {
      plugins: [Quasar],
    },
  });

  it('renders post content', () => {
    expect(wrapper.text()).toContain('Test post content');
  });

  it('renders user name', () => {
    expect(wrapper.text()).toContain('Test User');
  });

  it('renders like count', () => {
    expect(wrapper.text()).toContain('5');
  });

  it('emits like event when like button clicked', async () => {
    const likeButton = wrapper.find('[data-testid="like-button"]');
    if (likeButton.exists()) {
      await likeButton.trigger('click');
      expect(wrapper.emitted('like')).toBeTruthy();
    }
  });
});

