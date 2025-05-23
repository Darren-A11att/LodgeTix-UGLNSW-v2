import { test, expect } from '@playwright/test';
import { RegistrationTypePage } from '../page-objects/registration-type-page';
import { selectors, takeScreenshot } from '../utils/test-utils';
import { testUrls } from '../config/test-data';

test.describe('Registration Type Selection', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to registration start page before each test
    await page.goto(testUrls.registration);
    await page.waitForLoadState('networkidle');
  });

  test('should display registration type selection page', async ({ page }) => {
    // Check page title
    const title = await page.getByRole('heading', { level: 2 }).textContent();
    expect(title).toContain('Choose Registration Type');
    
    // Take screenshot for visual reference
    await takeScreenshot(page, 'registration-type-initial');
  });

  test('should show all three registration types', async ({ page }) => {
    // Check individual registration option
    const individualOption = page.locator(selectors.registrationType.individual);
    await expect(individualOption).toBeVisible();
    
    // Check lodge registration option
    const lodgeOption = page.locator(selectors.registrationType.lodge);
    await expect(lodgeOption).toBeVisible();
    
    // Check delegation registration option
    const delegationOption = page.locator(selectors.registrationType.delegation);
    await expect(delegationOption).toBeVisible();
  });

  test('should select individual registration and proceed', async ({ page }) => {
    const regTypePage = new RegistrationTypePage(page);
    
    // Select individual registration
    await regTypePage.selectIndividual();
    
    // Verify navigation to attendee details page
    await expect(page).toHaveURL(/.*attendee-details/);
  });

  test('should select lodge registration and proceed', async ({ page }) => {
    const regTypePage = new RegistrationTypePage(page);
    
    // Select lodge registration
    await regTypePage.selectLodge();
    
    // Verify navigation to lodge details page
    await expect(page).toHaveURL(/.*lodge-details/);
  });

  test('should select delegation registration and proceed', async ({ page }) => {
    const regTypePage = new RegistrationTypePage(page);
    
    // Select delegation registration
    await regTypePage.selectDelegation();
    
    // Verify navigation to delegation details page
    await expect(page).toHaveURL(/.*delegation-details/);
  });

  test('should prevent navigation without selection', async ({ page }) => {
    const regTypePage = new RegistrationTypePage(page);
    
    // Check if continue button is disabled initially
    const isEnabled = await regTypePage.isButtonEnabled();
    expect(isEnabled).toBe(false);
  });

  test('should enable continue button after selection', async ({ page }) => {
    const regTypePage = new RegistrationTypePage(page);
    
    // Click individual registration option
    await regTypePage.individualOption.click();
    
    // Check that continue button is now enabled
    const isEnabled = await regTypePage.isButtonEnabled();
    expect(isEnabled).toBe(true);
  });

  test('should work on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewport({ width: 375, height: 812 });
    
    // Check that all options are still visible
    await expect(page.locator(selectors.registrationType.individual)).toBeVisible();
    await expect(page.locator(selectors.registrationType.lodge)).toBeVisible();
    await expect(page.locator(selectors.registrationType.delegation)).toBeVisible();
    
    // Take mobile screenshot
    await takeScreenshot(page, 'registration-type-mobile');
  });

  test('should have accessible names and roles', async ({ page }) => {
    // Test that elements have proper aria labels
    const individualOption = page.locator(selectors.registrationType.individual);
    await expect(individualOption).toHaveAttribute('aria-label', /individual registration/i);
    
    const lodgeOption = page.locator(selectors.registrationType.lodge);
    await expect(lodgeOption).toHaveAttribute('aria-label', /lodge registration/i);
    
    const delegationOption = page.locator(selectors.registrationType.delegation);
    await expect(delegationOption).toHaveAttribute('aria-label', /delegation registration/i);
  });
});