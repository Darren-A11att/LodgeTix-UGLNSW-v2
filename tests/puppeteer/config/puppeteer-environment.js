const NodeEnvironment = require('jest-environment-node').default || require('jest-environment-node');
const puppeteer = require('puppeteer');
const config = require('./puppeteer.config');

class PuppeteerEnvironment extends NodeEnvironment {
  constructor(config) {
    super(config);
  }

  async setup() {
    await super.setup();
    
    // Launch browser
    this.global.__BROWSER__ = await puppeteer.launch(config.launchOptions);
    
    // Make config available globally
    this.global.__CONFIG__ = config;
  }

  async teardown() {
    // Close browser
    if (this.global.__BROWSER__) {
      await this.global.__BROWSER__.close();
    }
    
    await super.teardown();
  }

  getVmContext() {
    return super.getVmContext();
  }
}

module.exports = PuppeteerEnvironment;