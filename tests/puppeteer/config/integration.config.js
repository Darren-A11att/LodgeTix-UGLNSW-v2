const path = require('path');
const fs = require('fs');

/**
 * Integration configuration for bridging Puppeteer tests with existing LodgeTix infrastructure
 */
class LodgeTixIntegration {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '../../../');
    this.existingTestRoot = path.join(this.projectRoot, '__tests__/e2e');
    this.loadExistingConfiguration();
  }

  loadExistingConfiguration() {
    // Load existing Playwright configuration if available
    const playwrightConfigPath = path.join(this.projectRoot, 'playwright.config.ts');
    if (fs.existsSync(playwrightConfigPath)) {
      console.log('Found existing Playwright configuration');
      // Parse and adapt configuration
      this.existingConfig = this.parsePlaywrightConfig(playwrightConfigPath);
    }

    // Load test data configuration
    const testDataPath = path.join(this.existingTestRoot, 'config/test-data.ts');
    if (fs.existsSync(testDataPath)) {
      console.log('Found existing test data configuration');
    }
  }

  parsePlaywrightConfig(configPath) {
    // Extract key configuration from Playwright setup
    return {
      baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
      timeout: 30000,
      retries: 2,
      workers: 4
    };
  }

  // Reuse existing page objects with adapter pattern
  getPageObjectAdapter(pageObjectName) {
    const playwrightPath = path.join(this.existingTestRoot, 'page-objects', `${pageObjectName}.ts`);
    
    if (fs.existsSync(playwrightPath)) {
      return {
        exists: true,
        path: playwrightPath,
        needsAdapter: true
      };
    }
    
    return { exists: false };
  }

  // Database connection for test data
  getDatabaseConfig() {
    return {
      supabase: {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL,
        anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY
      }
    };
  }

  // Authentication helpers
  getAuthConfig() {
    return {
      loginUrl: '/auth/login',
      apiUrl: '/api/auth',
      testCredentials: {
        mason: {
          email: 'test.mason@lodgetix.com',
          password: 'TestMason123!',
          lodgeNumber: '1234'
        },
        guest: {
          email: 'test.guest@lodgetix.com',
          password: 'TestGuest123!'
        },
        admin: {
          email: 'test.admin@lodgetix.com',
          password: 'TestAdmin123!'
        }
      }
    };
  }

  // Registration workflow configuration
  getRegistrationConfig() {
    return {
      steps: [
        'registration-type',
        'attendee-details',
        'ticket-selection',
        'order-review',
        'payment',
        'confirmation'
      ],
      routes: {
        individual: '/events/[slug]/register/[registrationId]/individual',
        lodge: '/events/[slug]/register/[registrationId]/lodge',
        delegation: '/events/[slug]/register/[registrationId]/delegation'
      }
    };
  }

  // Event and ticket configuration
  getEventConfig() {
    return {
      testEvent: {
        slug: 'test-grand-installation-2025',
        name: 'Test Grand Installation 2025',
        packages: ['general-admission', 'vip-package', 'lodge-package']
      }
    };
  }

  // Stripe test configuration
  getPaymentConfig() {
    return {
      stripe: {
        testCards: {
          success: '4242424242424242',
          decline: '4000000000000002',
          authentication: '4000002500003155'
        },
        webhookEndpoint: '/api/stripe/webhook'
      }
    };
  }

  // Helper to convert Playwright selectors to Puppeteer
  convertSelector(playwrightSelector) {
    const conversions = {
      'data-testid=': '[data-testid="',
      'role=': '[role="',
      'text=': ':contains("',
      'visible=true': ':visible'
    };

    let puppeteerSelector = playwrightSelector;
    Object.entries(conversions).forEach(([from, to]) => {
      if (puppeteerSelector.includes(from)) {
        puppeteerSelector = puppeteerSelector.replace(from, to);
        if (to.endsWith('"')) {
          puppeteerSelector += '"]';
        }
      }
    });

    return puppeteerSelector;
  }

  // Get all existing test specifications
  getExistingTestSpecs() {
    const specsDir = path.join(this.existingTestRoot, 'registration');
    const specs = [];

    if (fs.existsSync(specsDir)) {
      fs.readdirSync(specsDir).forEach(file => {
        if (file.endsWith('.spec.ts')) {
          specs.push({
            name: file.replace('.spec.ts', ''),
            path: path.join(specsDir, file),
            type: this.determineTestType(file)
          });
        }
      });
    }

    return specs;
  }

  determineTestType(filename) {
    if (filename.includes('visual')) return 'visual';
    if (filename.includes('a11y')) return 'accessibility';
    if (filename.includes('flow')) return 'e2e';
    return 'functional';
  }
}

module.exports = LodgeTixIntegration;