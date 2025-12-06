<template>
  <div ref="containerRef" class="lazy-image-container" :style="containerStyle">
    <!-- Placeholder while loading -->
    <div v-if="!loaded && !error && shouldLoad" class="lazy-image-placeholder" :style="placeholderStyle">
      <q-spinner v-if="showSpinner" :size="spinnerSize" :color="spinnerColor" />
    </div>
    
    <!-- Actual image -->
    <img
      v-if="shouldLoad"
      v-show="loaded && !error"
      :src="src"
      :alt="alt"
      :class="imageClass"
      :style="imageStyle"
      @load="handleLoad"
      @error="handleError"
    />
    
    <!-- Error state -->
    <div v-if="error" class="lazy-image-error" :style="errorStyle">
      <q-icon name="broken_image" :size="errorIconSize" :color="errorIconColor" />
      <div v-if="errorText" class="text-caption q-mt-xs">{{ errorText }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';

const props = defineProps({
  src: {
    type: String,
    required: true,
  },
  alt: {
    type: String,
    default: '',
  },
  width: {
    type: [String, Number],
    default: null,
  },
  height: {
    type: [String, Number],
    default: null,
  },
  fit: {
    type: String,
    default: 'cover', // cover, contain, fill, none, scale-down
  },
  placeholder: {
    type: String,
    default: null, // URL for placeholder image
  },
  showSpinner: {
    type: Boolean,
    default: true,
  },
  spinnerSize: {
    type: String,
    default: '24px',
  },
  spinnerColor: {
    type: String,
    default: 'grey-6',
  },
  errorText: {
    type: String,
    default: null,
  },
  errorIconSize: {
    type: String,
    default: '48px',
  },
  errorIconColor: {
    type: String,
    default: 'grey-6',
  },
  rootMargin: {
    type: String,
    default: '50px', // Start loading 50px before image enters viewport
  },
  threshold: {
    type: Number,
    default: 0.01,
  },
});

const emit = defineEmits(['load', 'error']);

const loaded = ref(false);
const error = ref(false);
const shouldLoad = ref(false);
const observer = ref(null);
const imageRef = ref(null);
const containerRef = ref(null);

const containerStyle = computed(() => {
  const style = {
    position: 'relative',
    overflow: 'hidden',
  };
  
  if (props.width) {
    style.width = typeof props.width === 'number' ? `${props.width}px` : props.width;
  }
  
  if (props.height) {
    style.height = typeof props.height === 'number' ? `${props.height}px` : props.height;
  }
  
  return style;
});

const placeholderStyle = computed(() => {
  const style = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    backgroundImage: props.placeholder ? `url(${props.placeholder})` : null,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  };
  
  return style;
});

const imageStyle = computed(() => {
  const style = {
    width: '100%',
    height: '100%',
    objectFit: props.fit,
    transition: 'opacity 0.3s ease-in-out',
    // Prevent image from interfering with scroll
    touchAction: 'pan-x pan-y',
    userSelect: 'none',
    WebkitUserSelect: 'none',
    WebkitTouchCallout: 'none',
    pointerEvents: 'auto',
  };
  
  return style;
});

const imageClass = computed(() => {
  return {
    'lazy-image': true,
    'lazy-image-loaded': loaded.value,
  };
});

const errorStyle = computed(() => {
  return {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    color: '#999',
  };
});

const handleLoad = () => {
  loaded.value = true;
  emit('load');
};

const handleError = (event) => {
  error.value = true;
  emit('error', event);
};

const loadImage = () => {
  if (shouldLoad.value || loaded.value || error.value) return;
  
  // Mark that we should start loading
  shouldLoad.value = true;
  
  // The img element will now be rendered and will load naturally
  // The @load and @error handlers will be triggered
};

onMounted(() => {
  // Check if Intersection Observer is supported
  if ('IntersectionObserver' in window) {
    observer.value = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            loadImage();
            if (observer.value && containerRef.value) {
              observer.value.unobserve(containerRef.value);
            }
          }
        });
      },
      {
        rootMargin: props.rootMargin,
        threshold: props.threshold,
      }
    );
    
    // Observe the container
    if (containerRef.value) {
      observer.value.observe(containerRef.value);
    }
  } else {
    // Fallback: load immediately if Intersection Observer is not supported
    loadImage();
  }
});

onUnmounted(() => {
  if (observer.value && containerRef.value) {
    observer.value.unobserve(containerRef.value);
    observer.value.disconnect();
  }
});
</script>

<style scoped>
.lazy-image-container {
  position: relative;
  overflow: hidden;
  /* Allow both horizontal and vertical panning for proper touch handling */
  touch-action: pan-x pan-y;
  -webkit-overflow-scrolling: touch;
}

.lazy-image {
  opacity: 0;
  transition: opacity 0.3s ease-in-out;
  /* Allow pan gestures but prevent unwanted scroll behavior */
  touch-action: pan-x pan-y;
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
  pointer-events: auto;
  /* Prevent image dragging */
  -webkit-user-drag: none;
  -khtml-user-drag: none;
  -moz-user-drag: none;
  -o-user-drag: none;
  user-drag: none;
}

.lazy-image-loaded {
  opacity: 1;
}

.lazy-image-placeholder {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f5f5;
  touch-action: pan-x pan-y;
}

.lazy-image-error {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #f5f5f5;
  color: #999;
  touch-action: pan-x pan-y;
}
</style>

