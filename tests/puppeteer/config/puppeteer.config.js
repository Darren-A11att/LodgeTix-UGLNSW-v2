const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env.local') });

module.exports = {
  // Base configuration inherited from existing project
  baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
  
  // Puppeteer launch options
  launchOptions: {
    headless: process.env.PUPPETEER_HEADLESS !== 'false',
    slowMo: process.env.PUPPETEER_SLOW_MO ? parseInt(process.env.PUPPETEER_SLOW_MO) : 0,
    devtools: process.env.PUPPETEER_DEVTOOLS === 'true',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu',
      '--window-size=1920,1080'
    ]
  },

  // Viewport settings
  viewport: {
    width: 1920,
    height: 1080
  },

  // Timeouts
  timeouts: {
    navigation: parseInt(process.env.PUPPETEER_TIMEOUT || '30000'),
    waitForSelector: 10000,
    waitForFunction: 5000
  },

  // Test data configuration (inherited from existing tests)
  testData: {
    users: {
      mason: {
        email: process.env.TEST_MASON_EMAIL || 'test.mason@example.com',
        password: process.env.TEST_MASON_PASSWORD || 'TestPassword123!'
      },
      guest: {
        email: process.env.TEST_GUEST_EMAIL || 'test.guest@example.com',
        password: process.env.TEST_GUEST_PASSWORD || 'TestPassword123!'
      }
    },
    stripe: {
      testCard: '4242424242424242',
      testCardExpiry: '12/30',
      testCardCVC: '123'
    }
  },

  // Paths
  paths: {
    screenshots: path.join(__dirname, '../reports/screenshots'),
    videos: path.join(__dirname, '../reports/videos'),
    downloads: path.join(__dirname, '../reports/downloads')
  },

  // Existing Playwright compatibility layer
  playwrightCompat: {
    selectorMapping: {
      // Map Playwright selectors to Puppeteer equivalents
      'data-testid': '[data-testid="%s"]',
      'role': '[role="%s"]',
      'text': ':contains("%s")'
    }
  },

  // Self-healing configuration
  selfHealing: {
    enabled: true,
    maxRetries: 3,
    screenshotOnFailure: true,
    logLevel: 'info',
    strategies: ['id', 'data-testid', 'css', 'xpath', 'text']
  },

  // Supabase test configuration
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY
  },

  // Stripe test configuration
  stripe: {
    publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    secretKey: process.env.STRIPE_SECRET_KEY
  }
};