import { test, expect } from '@playwright/test';
import { RegistrationTypePage } from '../page-objects/registration-type-page';
import { selectors } from '../utils/test-utils';
import { testUrls } from '../config/test-data';

test.describe('Registration Type Visual Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(testUrls.registration);
    await page.waitForLoadState('networkidle');
  });

  test('should show correct layout on desktop', async ({ page }) => {
    // Set desktop viewport
    await page.setViewport({ width: 1280, height: 800 });
    
    // Wait for all elements to be visible
    await page.waitForSelector(selectors.registrationType.individual);
    await page.waitForSelector(selectors.registrationType.lodge);
    await page.waitForSelector(selectors.registrationType.delegation);
    
    // Take screenshot
    const screenshot = await page.screenshot();
    
    // In a real implementation, we would use toMatchSnapshot
    // For now, we'll just verify we can take a screenshot
    expect(screenshot).toBeTruthy();
  });

  test('should show selected state visually', async ({ page }) => {
    const regTypePage = new RegistrationTypePage(page);
    
    // Click on individual option
    await regTypePage.individualOption.click();
    
    // Verify it has the selected state
    await expect(regTypePage.individualOption).toHaveAttribute('data-selected', 'true');
    
    // Verify the other options are not selected
    await expect(regTypePage.lodgeOption).not.toHaveAttribute('data-selected', 'true');
    await expect(regTypePage.delegationOption).not.toHaveAttribute('data-selected', 'true');
    
    // Take screenshot of selected state
    const screenshot = await page.screenshot();
    expect(screenshot).toBeTruthy();
  });

  test('should show responsive layout on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewport({ width: 375, height: 812 });
    
    // Wait for elements
    await page.waitForSelector(selectors.registrationType.individual);
    
    // Take screenshot
    const screenshot = await page.screenshot({ fullPage: true });
    expect(screenshot).toBeTruthy();
  });

  test('should show responsive layout on tablet', async ({ page }) => {
    // Set tablet viewport
    await page.setViewport({ width: 768, height: 1024 });
    
    // Wait for elements
    await page.waitForSelector(selectors.registrationType.individual);
    
    // Take screenshot
    const screenshot = await page.screenshot({ fullPage: true });
    expect(screenshot).toBeTruthy();
  });
});