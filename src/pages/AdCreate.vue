<template>
  <q-page class="q-pa-md">
    <q-form @submit="handleSubmit" class="q-gutter-md">
      <q-input
        v-model="title"
        label="Title"
        :rules="[validateRequired]"
        required
      />

      <q-input
        v-model="description"
        label="Description"
        type="textarea"
        rows="5"
        :rules="[validateRequired]"
        required
      />

      <q-select
        v-model="category"
        :options="categoryOptions"
        label="Category"
        :rules="[validateRequired]"
        required
      />

      <q-select
        v-model="region"
        :options="regionOptions"
        label="Region"
        :rules="[validateRequired]"
        required
      />

      <q-input
        v-model.number="price"
        label="Price (RSD)"
        type="number"
        :rules="[validateRequired]"
        required
      />

      <q-input
        v-model="contact"
        label="Contact (phone or email)"
        :rules="[validateRequired]"
        required
      />

      <q-file
        v-model="fileInput"
        label="Add photos"
        multiple
        accept="image/*"
        @update:model-value="handleFileSelect"
      />

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

      <q-btn
        label="Create Ad"
        type="submit"
        color="primary"
        class="full-width"
        :loading="submitting"
      />
    </q-form>
  </q-page>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useAdsStore } from '../stores/ads';
import uploadService from '../services/upload';
import { validateRequired } from '../utils/validators';

const router = useRouter();
const $q = useQuasar();
const adsStore = useAdsStore();

const title = ref('');
const description = ref('');
const category = ref(null);
const region = ref(null);
const price = ref(null);
const contact = ref('');
const mediaFiles = ref([]);
const fileInput = ref(null);
const submitting = ref(false);

const categoryOptions = ['Equipment', 'Clothing', 'Accessories', 'Other'];
const regionOptions = ['Belgrade', 'Novi Sad', 'Nis', 'Other'];

const handleFileSelect = (files) => {
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

  try {
    const mediaUrls = [];
    if (mediaFiles.value.length > 0) {
      const files = mediaFiles.value.map((m) => m.file);
      const urls = await uploadService.uploadMultiple(files);
      mediaUrls.push(...urls.map((url) => ({ url, type: 'image' })));
    }

    const result = await adsStore.createAd({
      title: title.value,
      description: description.value,
      category: category.value,
      region: region.value,
      price: price.value,
      contact: contact.value,
      images: mediaUrls,
    });

    if (result.success) {
      $q.notify({
        type: 'positive',
        message: 'Ad created successfully',
      });
      router.push('/ads');
    } else {
      $q.notify({
        type: 'negative',
        message: result.error || 'Failed to create ad',
      });
    }
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.message || 'Failed to create ad',
    });
  } finally {
    submitting.value = false;
  }
};
</script>

