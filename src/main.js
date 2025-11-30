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
import { createApp } from 'vue';

// Note: Pinia is initialized in boot/pinia.js via Quasar boot files
// This ensures it's ready before components mount

const app = createApp(App);

app.use(router);
app.use(Quasar, {
  plugins: {},
  lang: quasarLang,
});

app.mount('#q-app');

