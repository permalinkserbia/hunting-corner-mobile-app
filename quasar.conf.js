/* eslint-env node */

/*
 * This file runs in a Node context (it's NOT transpiled by Babel), so use only
 * the ES6 features that are supported by your Node version. https://node.green/
 */

// Configuration for your app
// https://v2.quasar.dev/quasar-cli-vite/quasar-config-js

const { configure } = require('quasar/wrappers');

module.exports = configure(function (ctx) {
  return {
    // https://v2.quasar.dev/quasar-cli-vite/prefetch-feature
    // preFetch: true,

    // https://v2.quasar.dev/quasar-cli-vite/quasar-config-js#css
    css: ['app.scss'],

    // https://github.com/quasarframework/quasar/tree/dev/extras
    extras: [
      'fontawesome-v6',
      'roboto-font',
      'material-icons',
    ],

    // Full list of options: https://v2.quasar.dev/quasar-cli-vite/quasar-config-js#build
    build: {
      target: {
        browser: ['es2019', 'edge88', 'firefox78', 'chrome87', 'safari13.1'],
        node: 'node20',
      },

      vueRouterMode: 'hash',
    },

    // Full list of options: https://v2.quasar.dev/quasar-cli-vite/quasar-config-js#devServer
    devServer: {
      open: true,
    },

    // https://v2.quasar.dev/quasar-cli-vite/quasar-config-js#framework
    framework: {
      config: {
        brand: {
          primary: '#37aa43',
          secondary: '#2d8a37',
          accent: '#256d2c',
          dark: '#1e5622',
          positive: '#37aa43',
          negative: '#dc3545',
          info: '#17a2b8',
          warning: '#ffc107',
        },
      },
      plugins: ['Notify', 'Loading', 'Dialog', 'BottomSheet'],
    },

    animations: [],

    // https://v2.quasar.dev/quasar-cli-vite/quasar-config-js#bootfiles
    boot: ['axios', 'capacitor'],

    // Full list of options: https://v2.quasar.dev/quasar-cli-vite/developing-mobile-apps/configuring-capacitor
    capacitor: {
      hideSplashscreen: true,
    },
  };
});

