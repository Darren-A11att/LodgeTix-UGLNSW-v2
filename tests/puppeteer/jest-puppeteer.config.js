const config = require('./config/puppeteer.config');

module.exports = {
  launch: {
    ...config.launchOptions,
    defaultViewport: {
      width: 1920,
      height: 1080
    }
  },
  browserContext: 'default',
  exitOnPageError: false
};