const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:9000',
    viewportWidth: 375,
    viewportHeight: 667,
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
});

