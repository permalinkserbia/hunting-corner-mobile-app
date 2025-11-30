<template>
  <div :class="['q-bubble', { 'q-bubble--sent': sent }]">
    <slot />
  </div>
</template>

<script setup>
defineProps({
  sent: {
    type: Boolean,
    default: false,
  },
});
</script>

<style scoped>
.q-bubble {
  display: inline-block;
  padding: 8px 12px;
  border-radius: 18px;
  background-color: #e0e0e0;
  max-width: 70%;
  word-wrap: break-word;
}

.q-bubble--sent {
  background-color: #1976d2;
  color: white;
  margin-left: auto;
}
</style>

