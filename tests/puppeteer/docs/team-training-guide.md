# LodgeTix E2E Testing with Claude Code + Puppeteer
## Team Training Guide

### Table of Contents
1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Writing Tests](#writing-tests)
4. [Using Claude Code](#using-claude-code)
5. [Self-Healing Features](#self-healing-features)
6. [Best Practices](#best-practices)
7. [Troubleshooting](#troubleshooting)
8. [Resources](#resources)

---

## Introduction

Welcome to the LodgeTix E2E testing guide! This document will help you understand and use our new Claude Code + Puppeteer testing infrastructure alongside our existing Playwright tests.

### Why Puppeteer + Claude Code?

- **AI-Powered Test Generation**: Claude Code can analyze code changes and automatically generate tests
- **Self-Healing Tests**: Tests automatically adapt to UI changes
- **Better Debugging**: Enhanced error messages and healing reports
- **Parallel Execution**: Run alongside existing Playwright tests

### Architecture Overview

```
┌─────────────────┐     ┌──────────────────┐
│   Playwright    │     │    Puppeteer     │
│     Tests       │     │     Tests        │
└────────┬────────┘     └────────┬─────────┘
         │                       │
         └───────────┬───────────┘
                     │
              ┌──────┴──────┐
              │  Test Runner │
              │  (Jest)      │
              └──────┬──────┘
                     │
              ┌──────┴──────┐
              │   CI/CD     │
              │   GitHub    │
              │   Actions   │
              └─────────────┘
```

---

## Getting Started

### Prerequisites

1. **Node.js 20+** installed
2. **Git** access to the repository
3. **VS Code** with Claude Code extension (optional but recommended)

### Initial Setup

```bash
# Clone the repository
git clone https://github.com/your-org/lodgetix.git
cd lodgetix

# Install main dependencies
npm install

# Install Puppeteer test dependencies
cd tests/puppeteer
npm install

# Return to root
cd ../..
```

### Running Your First Test

```bash
# Run all Puppeteer tests
cd tests/puppeteer
npm test

# Run specific test suite
npm run test:smoke
npm run test:critical
npm run test:functional

# Run in headed mode (see browser)
npm run test:headed

# Run with debugging
npm run test:debug
```

### Project Structure

```
tests/puppeteer/
├── config/              # Configuration files
│   ├── puppeteer.config.js
│   └── jest.setup.js
├── helpers/             # Utility functions
│   ├── self-healing.js
│   ├── playwright-bridge.js
│   └── test-generator.js
├── specs/               # Test specifications
│   ├── smoke/          # Quick smoke tests
│   ├── critical/       # Critical path tests
│   ├── functional/     # Feature tests
│   └── e2e/           # Full workflow tests
└── reports/            # Test results
```

---

## Writing Tests

### Basic Test Structure

```javascript
const config = require('../../config/puppeteer.config');

describe('Feature Name', () => {
  let browser;
  let page;

  beforeAll(async () => {
    browser = global.__BROWSER__;
  });

  beforeEach(async () => {
    page = await browser.newPage();
    await global.setupPage(page);
  });

  afterEach(async () => {
    if (page) await page.close();
  });

  test('should do something', async () => {
    // Navigate to page
    await page.goto(config.baseUrl + '/path');
    
    // Interact with elements
    await page.clickTestId('button-id');
    
    // Make assertions
    expect(await page.title()).toContain('Expected Title');
  });
});
```

### Common Patterns

#### 1. Form Filling
```javascript
// Using helper methods
await page.fillTestId('first-name', 'John');
await page.fillTestId('last-name', 'Smith');
await page.fillTestId('email', 'john@example.com');

// Using native Puppeteer
await page.type('#firstName', 'John');
```

#### 2. Waiting for Elements
```javascript
// Wait for specific element
await page.waitForTestId('confirmation-message');

// Wait for navigation
await page.waitForNavigation();

// Wait for network idle
await page.waitForLoadState('networkidle');
```

#### 3. Taking Screenshots
```javascript
// Automatic screenshot with timestamp
await page.takeScreenshot('step-name');

// Manual screenshot
await page.screenshot({ 
  path: 'screenshot.png',
  fullPage: true 
});
```

#### 4. Handling Dropdowns
```javascript
// Select by value
await page.select('[name="lodge"]', 'lodge-123');

// Click dropdown and option
await page.click('[data-testid="lodge-dropdown"]');
await page.click('[data-testid="lodge-option-123"]');
```

---

## Using Claude Code

### Installation

1. Install Claude Code globally:
```bash
npm install -g @anthropic/claude-code
```

2. Start Claude Code in the project:
```bash
claude
```

### Generating Tests

Ask Claude to generate tests based on your code:

```
claude > analyze the registration flow and generate Puppeteer tests
claude > create tests for the new payment feature in components/payment
claude > update tests for the ticket selection changes
```

### Test Analysis

Use Claude to analyze existing tests:

```
claude > which tests cover the checkout process?
claude > find gaps in our E2E test coverage
claude > suggest improvements for the registration tests
```

### Debugging Help

Get help debugging failed tests:

```
claude > this test is failing with "element not found", help me fix it
claude > why would the payment test timeout on CI but pass locally?
claude > optimize this test that takes too long to run
```

---

## Self-Healing Features

### How It Works

Our tests automatically adapt to UI changes using multiple strategies:

1. **Data-TestId Matching**: Preferred stable selectors
2. **CSS Fallbacks**: Alternative selectors when primary fails
3. **Text Matching**: Find elements by content
4. **Visual Similarity**: ML-based element matching (future)

### Using Self-Healing in Tests

```javascript
const SelfHealingFramework = require('../../helpers/self-healing');

test('self-healing example', async () => {
  const healer = new SelfHealingFramework(page);
  
  // Automatically heals if selector changes
  await healer.click('[data-testid="submit-button"]');
  
  // Type with healing
  await healer.type('#email', 'test@example.com');
  
  // Wait with healing
  await healer.waitForSelector('.confirmation');
});
```

### Viewing Healing Reports

```bash
# Generate healing report
node tests/puppeteer/helpers/generate-report.js

# View in dashboard
cd tests/puppeteer/dashboard
npm start
# Open http://localhost:3001
```

---

## Best Practices

### 1. Use Data-TestId Attributes

**Good:**
```javascript
await page.click('[data-testid="submit-button"]');
```

**Avoid:**
```javascript
await page.click('.btn.btn-primary.submit'); // Too fragile
```

### 2. Write Descriptive Test Names

**Good:**
```javascript
test('should display error when email is invalid', async () => {
```

**Avoid:**
```javascript
test('email test', async () => {
```

### 3. Use Page Objects for Complex Pages

Create reusable page objects:

```javascript
class RegistrationPage {
  constructor(page) {
    this.page = page;
  }

  async selectRegistrationType(type) {
    await this.page.clickTestId(`registration-type-${type}`);
  }

  async fillAttendeeDetails(data) {
    await this.page.fillTestId('first-name', data.firstName);
    await this.page.fillTestId('last-name', data.lastName);
    // ... more fields
  }
}
```

### 4. Handle Async Operations Properly

Always await async operations:

```javascript
// Good
await page.goto(url);
await page.waitForSelector('.loaded');

// Bad - might cause race conditions
page.goto(url);
page.waitForSelector('.loaded');
```

### 5. Clean Up Test Data

Use the test data manager:

```javascript
const TestDataManager = require('../../helpers/test-data-manager');

describe('Feature', () => {
  const dataManager = new TestDataManager();

  afterAll(async () => {
    await dataManager.cleanup();
  });

  test('create test data', async () => {
    const event = await dataManager.createTestEvent();
    // ... use event in test
  });
});
```

---

## Troubleshooting

### Common Issues

#### 1. Test Timeouts

**Problem**: Test exceeds default timeout
```
Timeout - Async callback was not invoked within 5000ms
```

**Solution**: Increase timeout for slow operations
```javascript
test('slow test', async () => {
  await page.goto(url, { timeout: 60000 }); // 60 seconds
}, 90000); // 90 second test timeout
```

#### 2. Element Not Found

**Problem**: Cannot find element
```
Error: No element found for selector: [data-testid="button"]
```

**Solutions**:
- Verify element exists: `await page.waitForSelector(selector)`
- Use self-healing: `await healer.click(selector)`
- Check if element is in iframe
- Ensure page is loaded: `await page.waitForLoadState('networkidle')`

#### 3. Flaky Tests

**Problem**: Test passes sometimes, fails others

**Solutions**:
- Add explicit waits: `await page.waitForSelector()`
- Use network idle: `await page.waitForLoadState('networkidle')`
- Increase stability with retries
- Use self-healing framework

#### 4. Different Behavior on CI

**Problem**: Tests pass locally but fail on CI

**Solutions**:
- Check environment variables
- Verify headless vs headed mode
- Look for timing issues
- Compare viewport sizes

### Debug Commands

```bash
# Run single test with logs
DEBUG=puppeteer:* npm test -- --testNamePattern="test name"

# Save screenshots on failure
PUPPETEER_SCREENSHOTS=true npm test

# Run in slow motion
PUPPETEER_SLOW_MO=100 npm test

# Keep browser open
PUPPETEER_HEADLESS=false npm test
```

---

## Resources

### Internal Documentation

- [Migration Strategy](../migration-strategy.md)
- [API Documentation](../helpers/README.md)
- [Self-Healing Guide](./self-healing-guide.md)

### External Resources

- [Puppeteer Documentation](https://pptr.dev)
- [Jest Documentation](https://jestjs.io)
- [Claude Code Guide](https://docs.anthropic.com/claude-code)

### Getting Help

- **Slack**: #testing-automation
- **Wiki**: /Testing/E2E/Puppeteer
- **Dashboard**: http://localhost:3001
- **Office Hours**: Tuesdays 2-3 PM

### Video Tutorials

1. [Getting Started with Puppeteer Tests](https://internal.video/1) (15 min)
2. [Writing Your First Test](https://internal.video/2) (20 min)
3. [Using Claude Code for Test Generation](https://internal.video/3) (25 min)
4. [Debugging Failed Tests](https://internal.video/4) (30 min)
5. [Self-Healing Deep Dive](https://internal.video/5) (45 min)

---

## Quick Reference

### Useful Commands

```bash
# Run tests
npm test                    # All tests
npm run test:smoke         # Smoke tests only
npm run test:critical      # Critical tests only
npm run test:headed        # With browser visible
npm run test:debug         # With debugger

# Generate reports
npm run report:generate    # Create test report
npm run report:open        # View test report

# Manage test data
npm run test:cleanup       # Clean test data
npm run test:seed          # Seed test data
```

### Helper Methods

```javascript
// Page helpers (available globally)
await page.clickTestId('id');
await page.fillTestId('id', 'value');
await page.waitForTestId('id');
await page.takeScreenshot('name');
await page.waitForNetworkIdle();

// Test data helpers
const user = global.testData.generateMason();
const guest = global.testData.generateGuest();
const card = global.testData.generateCreditCard();

// Self-healing helpers
await healer.click(selector);
await healer.type(selector, text);
await healer.waitForSelector(selector);
```

---

**Happy Testing! 🎭**

*Last Updated: January 31, 2025*