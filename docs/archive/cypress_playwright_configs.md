# Cypress/Playwright Configurations

## Current Testing Framework

**The project uses Playwright for E2E testing.** There is no Cypress configuration in the codebase.

## Playwright Configuration Details

### Main Configuration File: `playwright.config.ts`

```typescript
import { defineConfig, devices } from '@playwright/test';
import path from 'path';
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

export default defineConfig({
  testDir: './__tests__/e2e',
  timeout: 60000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['list']
  ],
  use: {
    baseURL: process.env.TEST_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
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
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
```

## Key Configuration Settings

### 1. Test Directory Structure
```
__tests__/
└── e2e/
    ├── config/           # Test configuration and data
    ├── page-objects/     # Page Object Model classes
    ├── registration/     # Registration flow tests
    ├── utils/            # Test utilities
    ├── global-setup.ts   # Global test setup
    └── smoke.spec.ts     # Smoke tests
```

### 2. Timeouts
- **Test Timeout**: 60 seconds per test
- **Web Server Timeout**: 120 seconds for startup
- **Navigation Timeout**: Default (30 seconds)
- **Action Timeout**: Default (no explicit timeout)

### 3. Execution Modes

#### Local Development
```javascript
{
  fullyParallel: true,          // Run tests in parallel
  retries: 0,                   // No retries locally
  workers: undefined,           // Use all available cores
  reuseExistingServer: true,    // Use running dev server
}
```

#### CI Environment
```javascript
{
  fullyParallel: true,          // Still parallel
  retries: 2,                   // Retry failed tests twice
  workers: 1,                   // Single worker to reduce flakiness
  reuseExistingServer: false,   // Start fresh server
  forbidOnly: true,             // Prevent .only() in CI
}
```

### 4. Evidence Collection

#### Screenshots
- **Trigger**: Only on test failure
- **Storage**: `test-results/` directory
- **Naming**: Automatic based on test name

#### Videos
- **Trigger**: On first retry only
- **Format**: WebM
- **Storage**: `test-results/` directory

#### Traces
- **Trigger**: On first retry
- **Content**: Network activity, console logs, DOM snapshots
- **Viewer**: `npx playwright show-trace trace.zip`

### 5. Browser Coverage

#### Desktop Browsers
1. **Chromium (Desktop Chrome)**
   - Latest stable version
   - Default viewport: 1280x720

2. **WebKit (Desktop Safari)**
   - Safari Technology Preview equivalent
   - macOS user agent

#### Mobile Browsers
1. **Mobile Chrome (Pixel 5)**
   - Android Chrome emulation
   - Viewport: 393x851
   - Device scale factor: 2.75

2. **Mobile Safari (iPhone 12)**
   - iOS Safari emulation
   - Viewport: 390x844
   - Device scale factor: 3

### 6. Reporters

#### HTML Reporter
- **Output**: `playwright-report/`
- **Features**: Interactive test results, screenshots, videos
- **Command**: `npx playwright show-report`

#### List Reporter
- **Output**: Console
- **Features**: Real-time test progress
- **Format**: Simple list of pass/fail

### 7. Environment Variables

#### Test Environment File: `.env.test`
```bash
# Base URL for tests
TEST_BASE_URL=http://localhost:3000

# Test user credentials (if needed)
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=testpassword

# API endpoints
TEST_API_URL=http://localhost:3000/api

# Feature flags
ENABLE_TEST_MODE=true
```

### 8. Global Setup

#### File: `global-setup.ts`
```typescript
async function globalSetup() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Mock Stripe.js for payment tests
  await page.addInitScript(() => {
    window.Stripe = function(key) {
      return {
        elements: () => ({
          create: () => ({
            mount: () => {},
            on: () => {},
            unmount: () => {},
          }),
        }),
        confirmCardPayment: async () => ({
          paymentIntent: { status: 'succeeded' },
        }),
      };
    };
  });

  await browser.close();
}
```

### 9. Test Organization

#### Page Object Model
Each page has a dedicated class:
- Constructor accepts Playwright `Page` object
- Methods represent user actions
- Locators are defined as properties
- Encapsulates page-specific logic

#### Test Structure
```typescript
test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup before each test
  });

  test('should do something', async ({ page }) => {
    // Test implementation
  });
});
```

### 10. Custom Test Commands

#### Package.json Scripts
```json
{
  "test:e2e": "playwright test",
  "test:e2e:ui": "playwright test --ui",
  "test:e2e:debug": "playwright test --debug",
  "test:e2e:headful": "playwright test --headed",
  "test:e2e:record": "playwright test --trace on",
  "test:e2e:report": "playwright show-report"
}
```

## Best Practices

### 1. Test Isolation
- Each test runs in a fresh browser context
- No shared state between tests
- Clean up after test completion

### 2. Selector Strategy
- Prefer test IDs: `data-testid`
- Use semantic selectors: roles, labels
- Avoid brittle CSS selectors
- Document custom selectors

### 3. Waiting Strategies
```typescript
// Good: Wait for specific conditions
await page.waitForSelector('[data-testid="loaded"]');
await page.waitForLoadState('networkidle');

// Avoid: Fixed timeouts
await page.waitForTimeout(5000);
```

### 4. Error Handling
```typescript
// Use try-catch for expected failures
try {
  await page.click('button');
} catch (error) {
  // Handle gracefully
}

// Use test.fail() for known issues
test('known failing test', async ({ page }) => {
  test.fail();
  // Test implementation
});
```

### 5. Performance
- Run tests in parallel locally
- Use single worker in CI
- Minimize test interdependencies
- Cache test data where possible

## Debugging Tools

### 1. UI Mode
```bash
npm run test:e2e:ui
```
- Visual test runner
- Step through tests
- Inspect DOM
- Time travel debugging

### 2. Debug Mode
```bash
npm run test:e2e:debug
```
- Launches headed browser
- Pauses on test start
- Step through with debugger

### 3. Trace Viewer
```bash
npx playwright show-trace trace.zip
```
- Network requests
- Console logs
- DOM snapshots
- Action timeline

## Comparison with Cypress

While this project uses Playwright, here's how it compares to Cypress:

### Advantages of Current Playwright Setup
1. **Multi-browser Support**: Tests run on Chrome, Safari, Firefox
2. **Mobile Testing**: Built-in mobile emulation
3. **Parallel Execution**: True parallel test execution
4. **Network Interception**: Full network control
5. **Multiple Contexts**: Test multiple users/sessions

### Cypress Equivalent Features
If migrating to Cypress, these Playwright features would map to:
- `playwright.config.ts` → `cypress.config.js`
- Page Objects → Same pattern works
- `test()` → `it()`
- `test.describe()` → `describe()`
- `page.goto()` → `cy.visit()`
- `page.click()` → `cy.click()`

## Future Enhancements

1. **Visual Regression Testing**
   - Add screenshot comparison
   - Implement visual diff reporting

2. **API Testing Integration**
   - Add API request validation
   - Mock server responses

3. **Performance Testing**
   - Measure page load times
   - Track bundle sizes
   - Monitor memory usage

4. **Accessibility Testing**
   - Integrate axe-core
   - Add WCAG compliance checks

5. **Test Data Management**
   - Implement test data factories
   - Add database seeding
   - Create data cleanup routines