import { Page } from '@playwright/test';

/**
 * Helper function to take a screenshot during tests
 */
export async function takeScreenshot(page: Page, name: string) {
  await page.screenshot({
    path: `__tests__/e2e/screenshots/${name}.png`,
    fullPage: true,
  });
}

/**
 * Helper function to wait for navigation to complete
 */
export async function waitForNavigation(page: Page) {
  await page.waitForNavigation({ waitUntil: 'networkidle' });
}

/**
 * Selectors for common elements
 */
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

/**
 * Helper function to fill a Mason form
 */
export async function fillMasonForm(page: Page, data: any) {
  await page.type(selectors.forms.firstName, data.firstName);
  await page.type(selectors.forms.lastName, data.lastName);
  await page.selectOption(selectors.forms.rank, data.rank);
  await page.type(selectors.forms.email, data.email);
  await page.type(selectors.forms.phone, data.phone);
}

/**
 * Helper function to fill a Guest form
 */
export async function fillGuestForm(page: Page, data: any) {
  await page.type(selectors.forms.firstName, data.firstName);
  await page.type(selectors.forms.lastName, data.lastName);
  await page.type(selectors.forms.email, data.email);
  await page.type(selectors.forms.phone, data.phone);
}

/**
 * Helper function to navigate to a specific step
 */
export async function navigateToStep(page: Page, stepName: string) {
  await page.click(`[data-testid="step-${stepName}"]`);
  await page.waitForSelector(`[data-testid="step-${stepName}-active"]`);
}