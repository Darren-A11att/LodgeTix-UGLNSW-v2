# Task 141: Setup E2E Testing Infrastructure

## Objective
Set up the end-to-end testing infrastructure using Jest and Puppeteer for comprehensive testing of the registration flows.

## Dependencies
- All previous phases completed
- Node.js environment
- Chrome/Chromium browser

## Steps

1. Install required packages:
```bash
npm install --save-dev puppeteer jest @jest/types
npm install --save-dev @types/puppeteer jest-puppeteer
npm install --save-dev puppeteer-screen-recorder expect-puppeteer
```

2. Create Jest configuration for E2E tests:
```javascript
// jest.e2e.config.js
module.exports = {
  preset: 'jest-puppeteer',
  testMatch: ['**/__tests__/e2e/**/*.test.ts'],
  testTimeout: 30000,
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  testEnvironment: 'jest-environment-puppeteer',
  setupFilesAfterEnv: ['<rootDir>/jest-e2e-setup.ts'],
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.jest.json',
    },
  },
};
```

3. Create Puppeteer configuration:
```javascript
// jest-puppeteer.config.js
module.exports = {
  launch: {
    headless: process.env.HEADLESS !== 'false',
    slowMo: process.env.SLOWMO ? Number(process.env.SLOWMO) : 0,
    devtools: process.env.DEVTOOLS === 'true',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu',
    ],
  },
  browser: 'chromium',
  browserContext: 'default',
};
```

4. Create E2E test setup file:
```typescript
// jest-e2e-setup.ts
import { setDefaultOptions } from 'expect-puppeteer';
import { Browser, Page } from 'puppeteer';

declare global {
  namespace NodeJS {
    interface Global {
      browser: Browser;
      page: Page;
      baseUrl: string;
    }
  }
}

// Set default timeout for expect-puppeteer
setDefaultOptions({ timeout: 10000 });

// Setup global variables
global.baseUrl = process.env.BASE_URL || 'http://localhost:3000';

// Add custom matchers if needed
expect.extend({
  async toHaveText(received: Page, selector: string, expectedText: string) {
    const actualText = await received.$eval(selector, el => el.textContent);
    const pass = actualText === expectedText;
    
    return {
      pass,
      message: () =>
        `expected ${selector} to have text "${expectedText}", but got "${actualText}"`,
    };
  },
});

// Setup before all tests
beforeAll(async () => {
  // Any global setup needed
  console.log('Starting E2E tests...');
});

// Setup before each test
beforeEach(async () => {
  // Reset to home page before each test
  await page.goto(global.baseUrl, { waitUntil: 'networkidle2' });
});

// Cleanup after all tests
afterAll(async () => {
  // Any global cleanup needed
  console.log('E2E tests completed.');
});
```

5. Create utility functions for E2E tests:
```typescript
// __tests__/e2e/utils/helpers.ts
import { Page } from 'puppeteer';

export const selectors = {
  // Registration type selection
  registrationType: {
    individual: '[data-testid="registration-type-individual"]',
    lodge: '[data-testid="registration-type-lodge"]',
    delegation: '[data-testid="registration-type-delegation"]',
  },
  
  // Form fields
  forms: {
    firstName: '[name="firstName"]',
    lastName: '[name="lastName"]',
    email: '[name="primaryEmail"]',
    phone: '[name="primaryPhone"]',
    rank: '[name="rank"]',
    lodge: '[name="lodge"]',
  },
  
  // Navigation
  navigation: {
    nextButton: '[data-testid="next-button"]',
    backButton: '[data-testid="back-button"]',
    submitButton: '[data-testid="submit-button"]',
  },
};

export async function fillMasonForm(page: Page, data: any) {
  await page.type(selectors.forms.firstName, data.firstName);
  await page.type(selectors.forms.lastName, data.lastName);
  await page.select(selectors.forms.rank, data.rank);
  await page.type(selectors.forms.email, data.email);
  await page.type(selectors.forms.phone, data.phone);
}

export async function navigateToStep(page: Page, stepName: string) {
  await page.waitForSelector(`[data-testid="step-${stepName}"]`);
  await page.click(`[data-testid="step-${stepName}"]`);
}

export async function takeScreenshot(page: Page, name: string) {
  await page.screenshot({
    path: `__tests__/e2e/screenshots/${name}.png`,
    fullPage: true,
  });
}

export async function waitForNavigation(page: Page) {
  await page.waitForNavigation({ waitUntil: 'networkidle2' });
}
```

6. Create E2E test environment configuration:
```typescript
// __tests__/e2e/config/test-data.ts
export const testData = {
  mason: {
    firstName: 'John',
    lastName: 'Smith',
    rank: 'MM',
    email: 'john.smith@test.com',
    phone: '0400000000',
    lodge: 'Test Lodge No. 123',
    grandLodge: 'United Grand Lodge of NSW & ACT',
  },
  
  guest: {
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'jane.doe@test.com',
    phone: '0411111111',
  },
  
  creditCard: {
    number: '4242424242424242',
    expiry: '12/25',
    cvc: '123',
    zip: '2000',
  },
};

export const testUrls = {
  registration: '/events/test-event/register',
  individualRegistration: '/events/test-event/register/individual',
  lodgeRegistration: '/events/test-event/register/lodge',
  delegationRegistration: '/events/test-event/register/delegation',
};
```

7. Add E2E testing scripts to package.json:
```json
{
  "scripts": {
    "test:e2e": "jest -c jest.e2e.config.js",
    "test:e2e:watch": "jest -c jest.e2e.config.js --watch",
    "test:e2e:headful": "HEADLESS=false jest -c jest.e2e.config.js",
    "test:e2e:debug": "HEADLESS=false DEVTOOLS=true SLOWMO=250 jest -c jest.e2e.config.js",
    "test:e2e:ci": "jest -c jest.e2e.config.js --ci",
    "test:e2e:record": "RECORD=true jest -c jest.e2e.config.js"
  }
}
```

8. Create directory structure for E2E tests:
```bash
mkdir -p __tests__/e2e/registration
mkdir -p __tests__/e2e/screenshots
mkdir -p __tests__/e2e/videos
mkdir -p __tests__/e2e/utils
mkdir -p __tests__/e2e/config
```

## Deliverables
- Jest configuration for E2E tests
- Puppeteer configuration
- Test utilities and helpers
- Test data configuration
- Directory structure for tests
- NPM scripts for running tests

## Success Criteria
- Puppeteer can launch browser successfully
- Jest can run E2E tests
- Screenshot capability works
- Test utilities are accessible
- Environment is properly configured

## Compliance Analysis with CLAUDE.md

### Architecture Alignment:

This task sets up testing infrastructure which is not explicitly covered in CLAUDE.md but follows standard testing practices for the tech stack:
- Jest for testing (mentioned in Tech Stack)
- Puppeteer for browser automation
- Proper test organization

### Good Practices:

1. **Test Organization**: Creates proper directory structure for E2E tests
2. **Configuration**: Separates E2E config from unit test config
3. **Utilities**: Provides helper functions and selectors
4. **Data Management**: Centralizes test data
5. **Scripts**: Adds convenient npm scripts for different test modes

### Considerations:

1. **Test IDs**: References data-testid attributes that need to be added to components
2. **Environment**: Assumes localhost:3000 for testing
3. **Browser**: Uses Chromium which is standard for Puppeteer
4. **Timeouts**: Reasonable timeout values for E2E tests

### Missing from CLAUDE.md:

- No testing specifications in CLAUDE.md
- No mention of E2E testing approach
- No test ID conventions defined

### Alignment Score: N/A

This task extends beyond CLAUDE.md scope but follows industry best practices for E2E testing with the specified tech stack. The implementation is well-structured and appropriate for the project.