const puppeteer = require('puppeteer');
const config = require('./puppeteer.config');
const LodgeTixIntegration = require('./integration.config');

// Global setup for all tests
global.lodgeTixIntegration = new LodgeTixIntegration();

// Configure Jest timeout
jest.setTimeout(config.timeouts.navigation);

// Setup Puppeteer page helpers
global.setupPage = async (page) => {
  // Set viewport
  await page.setViewport(config.viewport);
  
  // Set default navigation timeout
  page.setDefaultNavigationTimeout(config.timeouts.navigation);
  page.setDefaultTimeout(config.timeouts.waitForSelector);
  
  // Add custom helper methods
  page.waitForTestId = async (testId, options = {}) => {
    return page.waitForSelector(`[data-testid="${testId}"]`, options);
  };
  
  page.clickTestId = async (testId, options = {}) => {
    await page.waitForTestId(testId);
    return page.click(`[data-testid="${testId}"]`, options);
  };
  
  page.fillTestId = async (testId, value, options = {}) => {
    await page.waitForTestId(testId);
    await page.click(`[data-testid="${testId}"]`);
    await page.keyboard.down('Control');
    await page.keyboard.press('A');
    await page.keyboard.up('Control');
    await page.keyboard.press('Backspace');
    return page.type(`[data-testid="${testId}"]`, value, options);
  };
  
  // Screenshot helper
  page.takeScreenshot = async (name) => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${name}-${timestamp}.png`;
    return page.screenshot({
      path: `${config.paths.screenshots}/${filename}`,
      fullPage: true
    });
  };
  
  // Wait for network idle
  page.waitForNetworkIdle = async (options = {}) => {
    return page.waitForLoadState('networkidle', options);
  };
  
  return page;
};

// Setup test data helpers
global.testData = {
  generateMason: () => ({
    firstName: 'Test',
    lastName: `Mason${Date.now()}`,
    email: `test.mason${Date.now()}@example.com`,
    phone: '0400000000',
    lodgeNumber: '1234',
    lodgeName: 'Test Lodge',
    rank: 'Master Mason'
  }),
  
  generateGuest: () => ({
    firstName: 'Test',
    lastName: `Guest${Date.now()}`,
    email: `test.guest${Date.now()}@example.com`,
    phone: '0400000000'
  }),
  
  generateCreditCard: () => ({
    number: config.testData.stripe.testCard,
    expiry: config.testData.stripe.testCardExpiry,
    cvc: config.testData.stripe.testCardCVC,
    name: 'Test User'
  })
};

// Add self-healing capabilities
global.withSelfHealing = async (page, action, selector) => {
  const strategies = config.selfHealing.strategies;
  let lastError;
  
  for (let i = 0; i < config.selfHealing.maxRetries; i++) {
    try {
      return await action();
    } catch (error) {
      lastError = error;
      console.log(`Attempt ${i + 1} failed for selector: ${selector}`);
      
      if (config.selfHealing.screenshotOnFailure) {
        await page.takeScreenshot(`self-healing-failure-${i}`);
      }
      
      // Try alternative strategies
      if (i < config.selfHealing.maxRetries - 1) {
        await page.waitForTimeout(1000);
      }
    }
  }
  
  throw lastError;
};

// Environment setup
beforeAll(async () => {
  // Ensure directories exist
  const fs = require('fs').promises;
  const dirs = Object.values(config.paths);
  
  for (const dir of dirs) {
    await fs.mkdir(dir, { recursive: true }).catch(() => {});
  }
  
  // Setup global browser for tests
  if (!global.__BROWSER__) {
    global.__BROWSER__ = await puppeteer.launch(config.launchOptions);
  }
});

// Cleanup after tests
afterAll(async () => {
  // Close browser
  if (global.__BROWSER__) {
    await global.__BROWSER__.close();
  }
  
  // Cleanup any test data if needed
  console.log('Test suite completed');
});