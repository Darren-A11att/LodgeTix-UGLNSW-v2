# E2E Test Configuration Template

This template provides configuration files needed to run the E2E tests defined in Phase 8.

## 1. Jest Configuration (jest.config.e2e.js)

```javascript
module.exports = {
  preset: 'jest-puppeteer',
  testMatch: ['**/tests/e2e/**/*.test.ts'],
  testTimeout: 30000,
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/e2e/setup.ts'],
  reporters: [
    'default',
    ['jest-html-reporter', {
      pageTitle: 'E2E Test Report',
      outputPath: 'test-reports/e2e-report.html',
      includeFailureMsg: true,
      includeSuiteFailure: true
    }]
  ],
  collectCoverageFrom: [
    'app/**/*.{ts,tsx}',
    'components/**/*.{ts,tsx}',
    'lib/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  coverageReporters: ['text', 'lcov', 'html'],
  coverageDirectory: 'coverage/e2e',
};
```

## 2. Puppeteer Configuration (jest-puppeteer.config.js)

```javascript
module.exports = {
  launch: {
    headless: process.env.HEADLESS !== 'false',
    slowMo: process.env.SLOW_MO ? parseInt(process.env.SLOW_MO) : 0,
    devtools: process.env.DEVTOOLS === 'true',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-web-security',
      '--disable-features=IsolateOrigins',
      '--disable-site-isolation-trials'
    ]
  },
  browserContext: 'incognito',
  server: {
    command: 'npm run dev',
    port: 3000,
    launchTimeout: 30000,
    debug: true,
  },
};
```

## 3. Playwright Configuration (playwright.config.ts)

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
  ],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },
});
```

## 4. Test Setup File (tests/e2e/setup.ts)

```typescript
import { config } from 'dotenv';

// Load test environment variables
config({ path: '.env.test' });

// Global test setup
beforeAll(async () => {
  // Setup test database
  // Clear caches
  // Prepare test data
});

afterAll(async () => {
  // Cleanup test data
  // Close connections
});

// Add custom matchers
expect.extend({
  toBeValidEmail(received: string) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const pass = emailRegex.test(received);
    return {
      message: () => `expected ${received} to be a valid email`,
      pass,
    };
  },
});

// Global test utilities
global.testHelpers = {
  waitForNavigation: async (page: any, url: string) => {
    await page.waitForURL(url, { waitUntil: 'networkidle' });
  },
  
  clearTestData: async () => {
    // Implementation to clear test data from database
  },
};
```

## 5. Environment Variables (.env.test)

```bash
# Application URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# Test Database
DATABASE_URL=postgresql://test:test@localhost:5432/lodgetix_test
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=test-anon-key

# Test Payment Provider
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_test_xxxxx

# Test Configuration
TEST_TIMEOUT=30000
HEADLESS=true
SLOW_MO=0
PARALLEL_WORKERS=4

# Mock Services
MOCK_EMAIL_SERVICE=true
MOCK_SMS_SERVICE=true
```

## 6. Package.json Scripts

```json
{
  "scripts": {
    "test:e2e": "jest --config jest.config.e2e.js",
    "test:e2e:watch": "jest --config jest.config.e2e.js --watch",
    "test:e2e:headed": "HEADLESS=false npm run test:e2e",
    "test:e2e:debug": "HEADLESS=false DEVTOOLS=true SLOW_MO=250 npm run test:e2e",
    "test:e2e:ci": "npm run build && npm run test:e2e",
    "test:playwright": "playwright test",
    "test:playwright:ui": "playwright test --ui",
    "test:playwright:debug": "playwright test --debug",
    "test:playwright:report": "playwright show-report"
  }
}
```

## 7. GitHub Actions Workflow (.github/workflows/e2e-tests.yml)

```yaml
name: E2E Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        browser: [chromium, firefox, webkit]
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright Browsers
        run: npx playwright install --with-deps ${{ matrix.browser }}
      
      - name: Setup test environment
        run: |
          cp .env.test .env
          npm run db:test:setup
      
      - name: Run E2E tests
        run: npm run test:playwright -- --project=${{ matrix.browser }}
        env:
          CI: true
          STRIPE_SECRET_KEY: ${{ secrets.STRIPE_TEST_KEY }}
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: test-results-${{ matrix.browser }}
          path: |
            playwright-report/
            test-results/
            screenshots/
            videos/
```

## 8. VS Code Settings (.vscode/settings.json)

```json
{
  "jest.jestCommandLine": "npm run test:e2e --",
  "jest.rootPath": "${workspaceFolder}",
  "typescript.tsdk": "node_modules/typescript/lib",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "files.exclude": {
    "**/node_modules": true,
    "**/coverage": true,
    "**/playwright-report": true,
    "**/test-results": true
  }
}
```

## Usage Instructions

1. Copy all configuration files to your project
2. Install dependencies:
   ```bash
   npm install --save-dev @playwright/test jest jest-puppeteer ts-jest
   npm install --save-dev @types/jest @types/puppeteer
   npm install --save-dev jest-html-reporter
   ```
3. Create test directories:
   ```bash
   mkdir -p tests/e2e/registration
   mkdir -p tests/e2e/helpers
   ```
4. Set up environment variables:
   ```bash
   cp .env.test.example .env.test
   ```
5. Run tests:
   ```bash
   npm run test:e2e         # Run with Jest/Puppeteer
   npm run test:playwright  # Run with Playwright
   ```

## Troubleshooting

### Tests fail to start
- Check if port 3000 is available
- Verify all environment variables are set
- Ensure database is accessible

### Browser doesn't launch
- Install browser dependencies: `npx playwright install-deps`
- Check system requirements for Puppeteer/Playwright

### Flaky tests
- Increase timeouts in configuration
- Add explicit waits in tests
- Use more specific selectors

### CI failures
- Ensure CI environment has necessary dependencies
- Use headless mode
- Set appropriate memory limits