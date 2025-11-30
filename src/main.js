import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { Quasar } from 'quasar';
import quasarLang from 'quasar/lang/sr-Latn';

// Import icon libraries
import '@quasar/extras/material-icons/material-icons.css';
import '@quasar/extras/fontawesome-v6/fontawesome-v6.css';

// Import Quasar css
import 'quasar/src/css/index.sass';

// Assumes your root component is App.vue
// and placed in same folder as main.js
import App from './App.vue';
import router from './router';

// Create Pinia instance first
const pinia = createPinia();

// Export pinia instance for direct access
window.__PINIA_INSTANCE__ = pinia;

const app = createApp(App);

// Initialize Pinia BEFORE router and Quasar
app.use(pinia);
app.use(router);
app.use(Quasar, {
  plugins: {},
  lang: quasarLang,
});

app.mount('#q-app');

