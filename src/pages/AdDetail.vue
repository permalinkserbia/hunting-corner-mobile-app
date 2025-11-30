<template>
  <q-page v-if="adsStore.currentAd" class="q-pa-md">
    <q-card>
      <q-card-section>
        <div class="text-h5">{{ adsStore.currentAd.title }}</div>
        <div class="text-caption text-grey">
          {{ adsStore.currentAd.category }} • {{ adsStore.currentAd.region }}
        </div>
        <div class="text-h6 text-primary q-mt-sm">
          {{ formatPrice(adsStore.currentAd.price) }}
        </div>
      </q-card-section>

      <q-card-section v-if="adsStore.currentAd.images">
        <q-carousel
          v-model="slide"
          swipeable
          animated
          :arrows="adsStore.currentAd.images.length > 1"
          :navigation="adsStore.currentAd.images.length > 1"
          class="rounded-borders"
        >
          <q-carousel-slide
            v-for="(image, index) in adsStore.currentAd.images"
            :key="index"
            :name="index"
            :img-src="image.url"
          />
        </q-carousel>
      </q-card-section>

      <q-card-section>
        <div class="text-body1">{{ adsStore.currentAd.description }}</div>
      </q-card-section>

      <q-card-actions>
        <q-btn
          flat
          :icon="adsStore.currentAd.favorited ? 'favorite' : 'favorite_border'"
          :color="adsStore.currentAd.favorited ? 'red' : 'grey'"
          label="Favorite"
          @click="toggleFavorite"
        />
        <q-space />
        <q-btn
          color="primary"
          label="Contact Owner"
          @click="showContactDialog = true"
        />
      </q-card-actions>
    </q-card>

    <q-dialog v-model="showContactDialog">
      <q-card>
        <q-card-section>
          <div class="text-h6">Contact Information</div>
        </q-card-section>

        <q-card-section>
          <div class="q-gutter-md">
            <q-btn
              v-if="adsStore.currentAd.contact_phone"
              icon="phone"
              :label="adsStore.currentAd.contact_phone"
              color="primary"
              @click="callOwner"
              class="full-width"
            />
            <q-btn
              v-if="adsStore.currentAd.contact_email"
              icon="email"
              :label="adsStore.currentAd.contact_email"
              color="primary"
              @click="emailOwner"
              class="full-width"
            />
            <q-btn
              icon="message"
              label="Send Message"
              color="secondary"
              @click="sendMessage"
              class="full-width"
            />
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useAdsStore } from '../stores/ads';

const route = useRoute();
const router = useRouter();
const $q = useQuasar();
const adsStore = useAdsStore();

const slide = ref(0);
const showContactDialog = ref(false);

onMounted(async () => {
  await adsStore.fetchAd(route.params.id);
});

const formatPrice = (price) => {
  return new Intl.NumberFormat('sr-RS', {
    style: 'currency',
    currency: 'RSD',
  }).format(price);
};

const toggleFavorite = async () => {
  if (adsStore.currentAd.favorited) {
    await adsStore.unfavoriteAd(adsStore.currentAd.id);
  } else {
    await adsStore.favoriteAd(adsStore.currentAd.id);
  }
};

const callOwner = () => {
  window.location.href = `tel:${adsStore.currentAd.contact_phone}`;
};

const emailOwner = () => {
  window.location.href = `mailto:${adsStore.currentAd.contact_email}`;
};

const sendMessage = () => {
  // TODO: Navigate to chat with owner
  router.push(`/chat/${adsStore.currentAd.user_id}`);
};
</script>

