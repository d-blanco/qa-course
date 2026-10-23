const { defineConfig } = require('cypress');
const { configureVisualRegression } = require('cypress-visual-regression');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    video: false,
    screenshotsFolder: './cypress/snapshots/actual',
    expose: {
      visualRegressionType: 'regression'
    },
    setupNodeEvents(on) {
      configureVisualRegression(on);
      on('task', {
        log(message) {
          console.log(message);
          return null;
        },
        table(rows) {
          console.table(rows);
          return null;
        }
      });
    }
  }
});
