<template>
  <q-page class="q-pa-md">
    <q-form @submit="handleSubmit" class="q-gutter-md">
      <q-input
        v-model="content"
        label="What's on your mind?"
        type="textarea"
        rows="5"
        :rules="[validateRequired]"
        @input="saveDraft"
      />

      <!-- Tags -->
      <q-input
        v-model="tagInput"
        label="Tags"
        hint="Type and press enter to add tags"
        @keyup.enter="addTag"
        @input="loadTagSuggestions"
      >
        <template v-slot:append>
          <q-btn icon="add" flat dense @click="addTag" />
        </template>
        <template v-if="tagSuggestions.length > 0" v-slot:hint>
          <div class="q-gutter-xs">
            <q-chip
              v-for="suggestion in tagSuggestions"
              :key="suggestion"
              size="sm"
              clickable
              @click="selectTagSuggestion(suggestion)"
            >
              {{ suggestion }}
            </q-chip>
          </div>
        </template>
      </q-input>

      <div v-if="tags.length > 0" class="q-gutter-xs">
        <q-chip
          v-for="tag in tags"
          :key="tag"
          removable
          @remove="removeTag(tag)"
          color="primary"
          text-color="white"
        >
          {{ tag }}
        </q-chip>
      </div>

      <!-- Media preview -->
      <div v-if="mediaFiles.length > 0" class="row q-gutter-sm">
        <div v-for="(file, index) in mediaFiles" :key="index" class="relative-position">
          <q-img
            v-if="file.preview"
            :src="file.preview"
            style="width: 100px; height: 100px"
            class="rounded-borders"
          />
          <q-btn
            icon="close"
            round
            dense
            size="sm"
            class="absolute-top-right"
            @click="removeMedia(index)"
          />
        </div>
      </div>

      <!-- Media upload -->
      <q-file
        v-model="fileInput"
        label="Add photos/videos"
        multiple
        accept="image/*,video/*"
        @update:model-value="handleFileSelect"
      >
        <template v-slot:prepend>
          <q-icon name="attach_file" />
        </template>
      </q-file>

      <!-- YouTube link -->
      <q-input
        v-model="ytLink"
        label="YouTube link (optional)"
        @input="saveDraft"
      />

      <q-linear-progress
        v-if="uploadProgress > 0 && uploadProgress < 100"
        :value="uploadProgress / 100"
        color="primary"
        class="q-mt-sm"
      />

      <div class="row q-gutter-md">
        <q-btn
          label="Cancel"
          flat
          @click="$router.back()"
        />
        <q-btn
          label="Publish"
          type="submit"
          color="primary"
          :loading="submitting"
          :disable="!content.trim()"
        />
      </div>
    </q-form>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { usePostsStore } from '../stores/posts';
import uploadService from '../services/upload';
import storageService from '../services/storage';
import { validateRequired } from '../utils/validators';
import apiService from '../services/api';
import { debouncedGetTagSuggestions } from '../utils/tags';

const router = useRouter();
const $q = useQuasar();
const postsStore = usePostsStore();

const content = ref('');
const tags = ref([]);
const tagInput = ref('');
const mediaFiles = ref([]);
const fileInput = ref(null);
const ytLink = ref('');
const uploadProgress = ref(0);
const submitting = ref(false);
const tagSuggestions = ref([]);

const DRAFT_KEY = 'post_draft';

onMounted(async () => {
  // Load draft
  const draft = await storageService.get(DRAFT_KEY);
  if (draft) {
    const parsed = JSON.parse(draft);
    content.value = parsed.content || '';
    tags.value = parsed.tags || [];
    ytLink.value = parsed.ytLink || '';
  }
});

const saveDraft = async () => {
  const draft = {
    content: content.value,
    tags: tags.value,
    ytLink: ytLink.value,
  };
  await storageService.set(DRAFT_KEY, JSON.stringify(draft));
};

const addTag = async () => {
  const tag = tagInput.value.trim();
  if (tag && !tags.value.includes(tag)) {
    tags.value.push(tag);
    tagInput.value = '';
    await saveDraft();
  }
};

const removeTag = async (tag) => {
  tags.value = tags.value.filter((t) => t !== tag);
  await saveDraft();
};

const loadTagSuggestions = async () => {
  if (tagInput.value.length < 2) {
    tagSuggestions.value = [];
    return;
  }
  const suggestions = await debouncedGetTagSuggestions(tagInput.value);
  tagSuggestions.value = suggestions.filter((s) => !tags.value.includes(s));
};

const selectTagSuggestion = async (tag) => {
  tagInput.value = tag;
  await addTag();
  tagSuggestions.value = [];
};

const handleFileSelect = async (files) => {
  if (!files) return;

  const fileArray = Array.isArray(files) ? files : [files];
  for (const file of fileArray) {
    const preview = URL.createObjectURL(file);
    mediaFiles.value.push({ file, preview });
  }
};

const removeMedia = (index) => {
  URL.revokeObjectURL(mediaFiles.value[index].preview);
  mediaFiles.value.splice(index, 1);
};

const handleSubmit = async () => {
  submitting.value = true;
  uploadProgress.value = 0;

  try {
    // Upload media files
    const mediaUrls = [];
    if (mediaFiles.value.length > 0) {
      const files = mediaFiles.value.map((m) => m.file);
      const urls = await uploadService.uploadMultiple(files, (progress) => {
        uploadProgress.value = progress;
      });
      mediaUrls.push(...urls.map((url, index) => ({
        url,
        type: files[index].type.startsWith('video/') ? 'video' : 'image',
      })));
    }

    // Check moderation if enabled
    // TODO: Call /api/moderation/check before publishing
    // const moderationResult = await apiService.post('/moderation/check', { content: content.value });
    // if (moderationResult.data.flagged) {
    //   $q.dialog({
    //     title: 'Content Warning',
    //     message: 'Your content may violate community guidelines. Continue?',
    //     cancel: true,
    //   }).onOk(() => publishPost(mediaUrls));
    // } else {
    //   publishPost(mediaUrls);
    // }

    await publishPost(mediaUrls);
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.message || 'Failed to create post',
    });
  } finally {
    submitting.value = false;
    uploadProgress.value = 0;
  }
};

const publishPost = async (mediaUrls) => {
  const postData = {
    content: content.value,
    media: mediaUrls,
    tags: tags.value,
    yt_link: ytLink.value || null,
  };

  const result = await postsStore.createPost(postData);

  if (result.success) {
    // Clear draft
    await storageService.remove(DRAFT_KEY);
    $q.notify({
      type: 'positive',
      message: 'Post created successfully',
    });
    router.push('/timeline');
  } else {
    $q.notify({
      type: 'negative',
      message: result.error || 'Failed to create post',
    });
  }
};
</script>

