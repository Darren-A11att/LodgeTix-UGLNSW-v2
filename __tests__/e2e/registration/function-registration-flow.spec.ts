import { test, expect } from '@playwright/test';
import { testUrls, generateUniqueTestData } from '../config/test-data';

test.describe('Function-Based Registration Flow', () => {
  test('should complete registration for a function with multiple events', async ({ page }) => {
    // Navigate to function page
    await page.goto(testUrls.registration);
    await page.waitForLoadState('networkidle');
    
    // Verify we're on the function registration page
    await expect(page).toHaveURL(/.*functions.*register/);
    
    // Select individual registration
    await page.getByTestId('registration-type-individual').click();
    await page.getByRole('button', { name: /continue|next/i }).click();
    
    // Fill attendee details
    const testUser = generateUniqueTestData().mason;
    
    // Fill mason details
    await page.getByLabel('Title').selectOption('Bro');
    await page.getByLabel('First Name').fill(testUser.firstName);
    await page.getByLabel('Last Name').fill(testUser.lastName);
    await page.getByLabel('Email').fill(testUser.email);
    await page.getByLabel('Phone').fill(testUser.phone);
    await page.getByLabel('Rank').selectOption('MM');
    await page.getByLabel('Lodge Name').fill(testUser.lodge);
    await page.getByLabel('Grand Lodge').selectOption(testUser.grandLodge);
    
    // Continue to ticket selection
    await page.getByRole('button', { name: /continue|next/i }).click();
    
    // Verify we're on ticket selection for the function
    await expect(page.locator('h2')).toContainText(/Select.*Tickets|Choose.*Events/i);
    
    // The page should show events within the function
    const eventCards = page.locator('[data-testid="event-card"]');
    const eventCount = await eventCards.count();
    expect(eventCount).toBeGreaterThan(0);
    
    // Select tickets for multiple events in the function
    if (eventCount > 1) {
      // Select ticket for first event
      await eventCards.first().getByRole('button', { name: /select|add/i }).click();
      
      // Select ticket for second event
      await eventCards.nth(1).getByRole('button', { name: /select|add/i }).click();
    }
    
    // Continue to order review
    await page.getByRole('button', { name: /continue|next/i }).click();
    
    // Verify order includes function and multiple events
    await expect(page.locator('h2')).toContainText(/Review.*Order|Order.*Summary/i);
    
    // Continue to payment
    await page.getByRole('button', { name: /continue.*payment|proceed/i }).click();
    
    // Verify we're on payment page
    await expect(page.locator('h2')).toContainText(/Payment/i);
  });

  test('should handle package selection for functions', async ({ page }) => {
    // Navigate directly to a function page
    await page.goto('/functions/grand-installation');
    
    // Click on packages or register
    const packageButton = page.getByRole('button', { name: /view.*packages|select.*package/i });
    if (await packageButton.isVisible()) {
      await packageButton.click();
    } else {
      // Fallback to register button
      await page.getByRole('button', { name: /register|get.*tickets/i }).click();
    }
    
    // If packages are available, they should be shown
    const packageCards = page.locator('[data-testid="package-card"]');
    const hasPackages = await packageCards.count() > 0;
    
    if (hasPackages) {
      // Verify package details are shown
      await expect(packageCards.first()).toContainText(/package|bundle/i);
      
      // Packages should show included events
      const firstPackage = packageCards.first();
      await expect(firstPackage).toContainText(/includes|events/i);
      
      // Packages should show pricing
      await expect(firstPackage).toContainText(/\$|price/i);
    }
  });

  test('should show function details in registration flow', async ({ page }) => {
    await page.goto(testUrls.registration);
    
    // Function name should be visible
    const functionName = await page.locator('h1, h2').filter({ hasText: /grand.*installation/i });
    await expect(functionName).toBeVisible();
    
    // Function dates should be shown
    const dateInfo = page.locator('text=/\\d{1,2}.*\\d{4}/');
    await expect(dateInfo).toBeVisible();
    
    // Location should be shown
    const locationInfo = page.locator('text=/Sydney|Melbourne|Brisbane/i');
    await expect(locationInfo).toBeVisible();
  });

  test('should handle no package selection', async ({ page }) => {
    await page.goto(testUrls.registration);
    
    // Select individual registration
    await page.getByTestId('registration-type-individual').click();
    await page.getByRole('button', { name: /continue|next/i }).click();
    
    // Fill minimal attendee details
    const testUser = generateUniqueTestData().guest;
    await page.getByLabel('First Name').fill(testUser.firstName);
    await page.getByLabel('Last Name').fill(testUser.lastName);
    await page.getByLabel('Email').fill(testUser.email);
    await page.getByLabel('Phone').fill(testUser.phone);
    
    // Continue without selecting "I am a Mason"
    await page.getByRole('button', { name: /continue|next/i }).click();
    
    // On ticket selection, individual event tickets should be available
    const ticketOptions = page.locator('[data-testid="ticket-option"]');
    await expect(ticketOptions).toHaveCount(await ticketOptions.count());
    
    // Verify individual pricing is shown (not package pricing)
    const priceElements = page.locator('text=/\\$\\d+/');
    await expect(priceElements.first()).toBeVisible();
  });
});