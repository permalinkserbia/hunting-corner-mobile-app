<template>
  <q-page class="q-pa-md">
    <q-form @submit="handleSubmit" class="q-gutter-md">
      <q-input
        v-model="content"
        label="Šta vam je na umu?"
        type="textarea"
        rows="5"
        :rules="[validateRequired]"
        @input="saveDraft"
      />

      <!-- Media preview -->
      <div v-if="mediaFiles.length > 0" class="row q-gutter-sm">
        <div v-for="(file, index) in mediaFiles" :key="index" class="relative-position">
          <q-img
            v-if="file.preview && file.type === 'image'"
            :src="file.preview"
            style="width: 100px; height: 100px"
            class="rounded-borders"
            @error="handlePreviewError(index)"
          />
          <div
            v-else
            class="flex flex-center rounded-borders bg-grey-3"
            style="width: 100px; height: 100px"
          >
            <q-icon
              :name="file.type === 'video' ? 'videocam' : 'image'"
              size="32px"
              color="grey-6"
            />
            <div class="text-caption text-grey-6 q-mt-xs text-center" style="font-size: 10px">
              {{ file.file?.name || 'File' }}
            </div>
          </div>
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
        label="Dodaj fotografije/video"
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
        label="YouTube link (opciono)"
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
          label="Otkaži"
          flat
          @click="$router.back()"
        />
        <q-btn
          label="Objavi"
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
import { ref, onMounted, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import uploadService from '../services/upload';
import storageService from '../services/storage';
import { validateRequired } from '../utils/validators';
import { getStoreSafely } from '../utils/pinia';

const router = useRouter();
const $q = useQuasar();
const postsStoreRef = ref(null);

const content = ref('');
const mediaFiles = ref([]);
const fileInput = ref(null);
const ytLink = ref('');
const uploadProgress = ref(0);
const submitting = ref(false);

const DRAFT_KEY = 'post_draft';

onMounted(async () => {
  await nextTick();
  await nextTick();
  await new Promise((resolve) => requestAnimationFrame(resolve));
  await new Promise((resolve) => setTimeout(resolve, 100));

  try {
    const { usePostsStore } = await import('../stores/posts');
    postsStoreRef.value = await getStoreSafely(() => usePostsStore(), 20, 50);
  } catch (error) {
    console.error('Failed to initialize posts store:', error);
    await new Promise((resolve) => setTimeout(resolve, 300));
    const { usePostsStore } = await import('../stores/posts');
    postsStoreRef.value = usePostsStore();
  }

  // Load draft
  const draft = await storageService.get(DRAFT_KEY);
  if (draft) {
    const parsed = JSON.parse(draft);
    content.value = parsed.content || '';
    ytLink.value = parsed.ytLink || '';
  }
});

const saveDraft = async () => {
  const draft = {
    content: content.value,
    ytLink: ytLink.value,
  };
  await storageService.set(DRAFT_KEY, JSON.stringify(draft));
};

const handleFileSelect = async (files) => {
  if (!files) return;

  const fileArray = Array.isArray(files) ? files : [files];
  for (const file of fileArray) {
    try {
      const fileType = file.type.startsWith('video/') ? 'video' : 'image';
      let preview = null;

      // Try to create preview for images (may fail for HEIC and other unsupported formats)
      if (fileType === 'image') {
        try {
          preview = URL.createObjectURL(file);
        } catch (error) {
          console.warn('Failed to create preview for file:', file.name, error);
          // Preview will be null, fallback UI will be shown
        }
      }

      mediaFiles.value.push({
        file,
        preview,
        type: fileType,
        name: file.name
      });
    } catch (error) {
      console.error('Error processing file:', file.name, error);
      $q.notify({
        type: 'warning',
        message: `Greška pri obradi fajla: ${file.name}`,
        position: 'top',
      });
    }
  }
};

const removeMedia = (index) => {
  if (mediaFiles.value[index]?.preview) {
    URL.revokeObjectURL(mediaFiles.value[index].preview);
  }
  mediaFiles.value.splice(index, 1);
};

const handlePreviewError = (index) => {
  // If preview fails to load, remove the preview URL and show fallback
  if (mediaFiles.value[index]?.preview) {
    URL.revokeObjectURL(mediaFiles.value[index].preview);
    mediaFiles.value[index].preview = null;
  }
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
      message: error.message || 'Neuspešno kreiranje objave',
    });
  } finally {
    submitting.value = false;
    uploadProgress.value = 0;
  }
};

const publishPost = async (mediaUrls) => {
  if (!postsStoreRef.value) {
    throw new Error('Posts store not available');
  }

  const postData = {
    content: content.value,
    media: mediaUrls,
    yt_link: ytLink.value || null,
  };

  const result = await postsStoreRef.value.createPost(postData);

  if (result.success) {
    // Clear draft
    await storageService.remove(DRAFT_KEY);
    $q.notify({
      type: 'positive',
      message: 'Objava uspešno kreirana',
    });
    router.push('/timeline');
  } else {
    $q.notify({
      type: 'negative',
      message: result.error || 'Neuspešno kreiranje objave',
    });
  }
};
</script>

