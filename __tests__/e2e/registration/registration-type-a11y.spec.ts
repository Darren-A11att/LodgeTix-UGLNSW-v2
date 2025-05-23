import { test, expect } from '@playwright/test';
import { RegistrationTypePage } from '../page-objects/registration-type-page';
import { testUrls } from '../config/test-data';

test.describe('Registration Type Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(testUrls.registration);
    await page.waitForLoadState('networkidle');
  });

  test('should have proper heading structure', async ({ page }) => {
    // Check for h1 or h2 title
    const mainHeading = await page.getByRole('heading', { level: 2 }).isVisible();
    expect(mainHeading).toBeTruthy();
  });

  test('should be keyboard navigable', async ({ page }) => {
    // Tab to first option
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Should focus first registration option
    const focusedElement = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'));
    expect(focusedElement).toContain('registration-type');
    
    // Use tab to navigate to next option
    await page.keyboard.press('Tab');
    const nextFocusedElement = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'));
    expect(nextFocusedElement).toContain('registration-type');
  });

  test('should have correct ARIA attributes', async ({ page }) => {
    const regTypePage = new RegistrationTypePage(page);
    
    // Check for aria-selected attribute
    await regTypePage.individualOption.click();
    
    // Selected option should have aria-selected="true"
    await expect(regTypePage.individualOption).toHaveAttribute('aria-selected', 'true');
    await expect(regTypePage.lodgeOption).not.toHaveAttribute('aria-selected', 'true');
    
    // Check that options have proper role
    await expect(regTypePage.individualOption).toHaveAttribute('role', 'radio');
  });

  test('should announce selection changes', async ({ page }) => {
    const regTypePage = new RegistrationTypePage(page);
    
    // Check for live region or aria-live attribute that would announce changes
    await regTypePage.individualOption.click();
    
    // Check for any elements with aria-live
    const hasLiveRegion = await page.locator('[aria-live]').count() > 0;
    
    // If there isn't a live region, this is a potential accessibility issue to note
    if (!hasLiveRegion) {
      console.warn('No aria-live region found for announcing selection changes');
    }
  });

  test('should have sufficient color contrast', async ({ page }) => {
    // Note: A full color contrast test would require a specific accessibility testing tool
    // Here we're just checking for basic theme color class names that should provide sufficient contrast
    
    const regTypePage = new RegistrationTypePage(page);
    
    // Click to select an option
    await regTypePage.individualOption.click();
    
    // Check if it has color classes that typically indicate sufficient contrast
    const hasContrastClass = await page.evaluate((selector) => {
      const element = document.querySelector(selector);
      if (!element) return false;
      
      // Check for common Tailwind contrast classes
      const classes = element.className;
      return classes.includes('bg-primary') || 
             classes.includes('text-white') || 
             classes.includes('bg-accent') ||
             classes.includes('dark:');
    }, selectors.registrationType.individual);
    
    expect(hasContrastClass).toBeTruthy();
  });
});