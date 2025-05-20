# Task 142: Create Registration Type Tests

## Objective
Create end-to-end tests for the registration type selection step, ensuring all registration types can be selected and navigation works correctly.

## Dependencies
- Task 141 (E2E infrastructure setup)
- Registration type components

## Steps

1. Create registration type selection tests:
```typescript
// __tests__/e2e/registration/registration-type.test.ts
import { Page } from 'puppeteer';
import { selectors, navigateToStep, takeScreenshot } from '../utils/helpers';
import { testUrls } from '../config/test-data';

describe('Registration Type Selection', () => {
  let page: Page;

  beforeEach(async () => {
    page = await browser.newPage();
    await page.goto(`${global.baseUrl}${testUrls.registration}`);
  });

  afterEach(async () => {
    await page.close();
  });

  describe('Page Load', () => {
    it('should display registration type selection page', async () => {
      // Wait for page to load
      await page.waitForSelector('h2');
      
      // Check page title
      const title = await page.$eval('h2', el => el.textContent);
      expect(title).toBe('Choose Registration Type');
      
      // Take screenshot for visual regression
      await takeScreenshot(page, 'registration-type-initial');
    });

    it('should show all three registration types', async () => {
      // Check individual registration option
      await expect(page).toMatchElement(
        selectors.registrationType.individual,
        { text: 'Individual Registration' }
      );
      
      // Check lodge registration option
      await expect(page).toMatchElement(
        selectors.registrationType.lodge,
        { text: 'Lodge Registration' }
      );
      
      // Check delegation registration option
      await expect(page).toMatchElement(
        selectors.registrationType.delegation,
        { text: 'Official Delegation' }
      );
    });
  });

  describe('Individual Registration Selection', () => {
    it('should select individual registration and proceed', async () => {
      // Click individual registration
      await page.click(selectors.registrationType.individual);
      
      // Verify selection
      await page.waitForSelector(
        `${selectors.registrationType.individual}[data-selected="true"]`
      );
      
      // Click continue
      await page.click(selectors.navigation.nextButton);
      
      // Wait for navigation
      await page.waitForNavigation();
      
      // Verify we're on attendee details page
      const heading = await page.$eval('h2', el => el.textContent);
      expect(heading).toBe('Attendee Details');
      
      // Verify individual form is shown
      await expect(page).toMatchElement('[data-testid="individuals-form"]');
    });

    it('should show individual registration features', async () => {
      await page.click(selectors.registrationType.individual);
      
      // Check feature list
      const features = await page.$$eval(
        `${selectors.registrationType.individual} li`,
        elements => elements.map(el => el.textContent)
      );
      
      expect(features).toContain('Register yourself as primary attendee');
      expect(features).toContain('Add additional attendees if needed');
      expect(features).toContain('Include partners for any attendee');
    });
  });

  describe('Lodge Registration Selection', () => {
    it('should select lodge registration and proceed', async () => {
      // Click lodge registration
      await page.click(selectors.registrationType.lodge);
      
      // Verify selection
      await page.waitForSelector(
        `${selectors.registrationType.lodge}[data-selected="true"]`
      );
      
      // Click continue
      await page.click(selectors.navigation.nextButton);
      
      // Wait for navigation
      await page.waitForNavigation();
      
      // Verify we're on attendee details page
      const heading = await page.$eval('h2', el => el.textContent);
      expect(heading).toBe('Attendee Details');
      
      // Verify lodge form is shown
      await expect(page).toMatchElement('[data-testid="lodges-form"]');
      
      // Verify minimum member requirement
      await expect(page).toMatchElement(
        '[data-testid="member-count"]',
        { text: '3 of 3 minimum' }
      );
    });

    it('should show lodge registration requirements', async () => {
      await page.click(selectors.registrationType.lodge);
      
      const features = await page.$$eval(
        `${selectors.registrationType.lodge} li`,
        elements => elements.map(el => el.textContent)
      );
      
      expect(features).toContain('Minimum 3 lodge members required');
      expect(features).toContain('Shared lodge details for all members');
    });
  });

  describe('Delegation Registration Selection', () => {
    it('should select delegation registration and proceed', async () => {
      // Click delegation registration
      await page.click(selectors.registrationType.delegation);
      
      // Verify selection
      await page.waitForSelector(
        `${selectors.registrationType.delegation}[data-selected="true"]`
      );
      
      // Click continue
      await page.click(selectors.navigation.nextButton);
      
      // Wait for navigation
      await page.waitForNavigation();
      
      // Verify delegation form is shown
      await expect(page).toMatchElement('[data-testid="delegations-form"]');
      
      // Verify delegation type selector
      await expect(page).toMatchElement(
        '[data-testid="delegation-type-select"]'
      );
    });
  });

  describe('Navigation', () => {
    it('should prevent navigation without selection', async () => {
      // Try to continue without selection
      const nextButton = await page.$(selectors.navigation.nextButton);
      const isDisabled = await page.evaluate(
        button => button.disabled,
        nextButton
      );
      
      expect(isDisabled).toBe(true);
    });

    it('should enable continue button after selection', async () => {
      // Select a registration type
      await page.click(selectors.registrationType.individual);
      
      // Check button is enabled
      const nextButton = await page.$(selectors.navigation.nextButton);
      const isDisabled = await page.evaluate(
        button => button.disabled,
        nextButton
      );
      
      expect(isDisabled).toBe(false);
    });
  });

  describe('Responsive Design', () => {
    it('should work on mobile viewport', async () => {
      // Set mobile viewport
      await page.setViewport({ width: 375, height: 812 });
      
      // Check that all options are still visible
      await expect(page).toMatchElement(selectors.registrationType.individual);
      await expect(page).toMatchElement(selectors.registrationType.lodge);
      await expect(page).toMatchElement(selectors.registrationType.delegation);
      
      // Take mobile screenshot
      await takeScreenshot(page, 'registration-type-mobile');
    });

    it('should work on tablet viewport', async () => {
      // Set tablet viewport
      await page.setViewport({ width: 768, height: 1024 });
      
      // Select and proceed
      await page.click(selectors.registrationType.individual);
      await page.click(selectors.navigation.nextButton);
      
      // Verify navigation works
      await page.waitForNavigation();
      const heading = await page.$eval('h2', el => el.textContent);
      expect(heading).toBe('Attendee Details');
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      // Simulate offline mode
      await page.setOfflineMode(true);
      
      // Try to proceed
      await page.click(selectors.registrationType.individual);
      await page.click(selectors.navigation.nextButton);
      
      // Should show error message
      await expect(page).toMatchElement(
        '[data-testid="error-message"]',
        { text: 'Network error', timeout: 5000 }
      );
      
      // Re-enable network
      await page.setOfflineMode(false);
    });
  });
});
```

2. Create visual regression tests:
```typescript
// __tests__/e2e/registration/registration-type-visual.test.ts
import { toMatchImageSnapshot } from 'jest-image-snapshot';
import { Page } from 'puppeteer';
import { testUrls } from '../config/test-data';

expect.extend({ toMatchImageSnapshot });

describe('Registration Type Visual Regression', () => {
  let page: Page;

  beforeEach(async () => {
    page = await browser.newPage();
    await page.goto(`${global.baseUrl}${testUrls.registration}`);
  });

  afterEach(async () => {
    await page.close();
  });

  it('should match desktop layout snapshot', async () => {
    await page.setViewport({ width: 1200, height: 800 });
    await page.waitForSelector('[data-testid="registration-type-container"]');
    
    const screenshot = await page.screenshot({ fullPage: true });
    expect(screenshot).toMatchImageSnapshot({
      customSnapshotIdentifier: 'registration-type-desktop',
      failureThreshold: 0.01,
      failureThresholdType: 'percent',
    });
  });

  it('should match selected state snapshot', async () => {
    await page.click(selectors.registrationType.individual);
    await page.waitForSelector(
      `${selectors.registrationType.individual}[data-selected="true"]`
    );
    
    const screenshot = await page.screenshot({ fullPage: true });
    expect(screenshot).toMatchImageSnapshot({
      customSnapshotIdentifier: 'registration-type-selected',
      failureThreshold: 0.01,
      failureThresholdType: 'percent',
    });
  });
});
```

3. Create accessibility tests:
```typescript
// __tests__/e2e/registration/registration-type-a11y.test.ts
import { Page } from 'puppeteer';
import { testUrls } from '../config/test-data';
import AxeBuilder from '@axe-core/playwright';

describe('Registration Type Accessibility', () => {
  let page: Page;

  beforeEach(async () => {
    page = await browser.newPage();
    await page.goto(`${global.baseUrl}${testUrls.registration}`);
  });

  afterEach(async () => {
    await page.close();
  });

  it('should have no accessibility violations', async () => {
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    
    expect(results.violations).toHaveLength(0);
  });

  it('should be keyboard navigable', async () => {
    // Tab to first option
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Should focus individual registration
    const focusedElement = await page.evaluate(() => 
      document.activeElement?.getAttribute('data-testid')
    );
    expect(focusedElement).toBe('registration-type-individual');
    
    // Use arrow keys to navigate
    await page.keyboard.press('ArrowDown');
    const newFocusedElement = await page.evaluate(() => 
      document.activeElement?.getAttribute('data-testid')
    );
    expect(newFocusedElement).toBe('registration-type-lodge');
  });

  it('should announce selection to screen readers', async () => {
    // Enable screen reader simulation
    await page.emulateVisionDeficiency('deuteranopia');
    
    // Select an option
    await page.click(selectors.registrationType.individual);
    
    // Check for aria-selected attribute
    const ariaSelected = await page.$eval(
      selectors.registrationType.individual,
      el => el.getAttribute('aria-selected')
    );
    expect(ariaSelected).toBe('true');
  });
});
```

## Deliverables
- Registration type selection tests
- Visual regression tests
- Accessibility tests
- Mobile/tablet viewport tests
- Error handling tests

## Success Criteria
- All registration types can be selected
- Navigation works correctly
- Visual appearance is consistent
- Accessibility standards are met
- Mobile experience is tested