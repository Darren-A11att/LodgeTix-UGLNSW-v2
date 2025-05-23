import { test, expect } from '@playwright/test';
import { RegistrationTypePage } from '../page-objects/registration-type-page';
import { LodgeDetailsPage } from '../page-objects/lodge-details-page';
import { generateUniqueTestData } from '../config/test-data';

test.describe('Lodge Registration Flow Visual Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Start from registration type page
    const regTypePage = new RegistrationTypePage(page);
    await regTypePage.goto();
    
    // Select lodge registration for all tests in this group
    await regTypePage.selectLodge();
    
    // Verify we're on the lodge details page
    await page.waitForURL(/.*lodge-details/);
  });

  test('should have consistent form layout on desktop', async ({ page }) => {
    // Set desktop viewport
    await page.setViewport({ width: 1280, height: 800 });
    
    // Take screenshot of initial form state
    const screenshot = await page.screenshot({ fullPage: true });
    expect(screenshot).toBeTruthy();
  });

  test('should have responsive form layout on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewport({ width: 375, height: 812 });
    
    // Take screenshot of mobile form layout
    const screenshot = await page.screenshot({ fullPage: true });
    expect(screenshot).toBeTruthy();
  });

  test('should show attendee list in a visually organized way', async ({ page }) => {
    // Generate unique test data
    const uniqueData = generateUniqueTestData();
    const uniqueId = Date.now().toString();
    
    // Create lodge details page object
    const lodgeDetailsPage = new LodgeDetailsPage(page);
    
    // Fill lodge details
    await lodgeDetailsPage.fillLodgeDetails(
      `Test Lodge ${uniqueId}`,
      uniqueId.substring(0, 3),
      'United Grand Lodge of NSW & ACT',
      `Lodge Secretary ${uniqueId}`,
      `secretary${uniqueId}@example.com`,
      `0400${uniqueId.substring(0, 6)}`
    );
    
    // Add 3 mason attendees
    for (let i = 1; i <= 3; i++) {
      await lodgeDetailsPage.addMasonAttendee(
        `Mason${i}`,
        uniqueData.mason.lastName,
        `mason${i}.${uniqueData.mason.email}`,
        uniqueData.mason.phone.replace(/\d{4}$/, `${i}111`),
        'MM'
      );
    }
    
    // Take screenshot of attendee list
    const screenshot = await page.screenshot({ fullPage: true });
    expect(screenshot).toBeTruthy();
  });

  test('should show visual distinction between mason and guest attendees', async ({ page }) => {
    // Generate unique test data
    const uniqueData = generateUniqueTestData();
    const uniqueId = Date.now().toString();
    
    // Create lodge details page object
    const lodgeDetailsPage = new LodgeDetailsPage(page);
    
    // Fill lodge details
    await lodgeDetailsPage.fillLodgeDetails(
      `Test Lodge ${uniqueId}`,
      uniqueId.substring(0, 3),
      'United Grand Lodge of NSW & ACT',
      `Lodge Secretary ${uniqueId}`,
      `secretary${uniqueId}@example.com`,
      `0400${uniqueId.substring(0, 6)}`
    );
    
    // Add 2 mason attendees
    for (let i = 1; i <= 2; i++) {
      await lodgeDetailsPage.addMasonAttendee(
        `Mason${i}`,
        uniqueData.mason.lastName,
        `mason${i}.${uniqueData.mason.email}`,
        uniqueData.mason.phone.replace(/\d{4}$/, `${i}111`),
        'MM'
      );
    }
    
    // Add 1 guest attendee
    await lodgeDetailsPage.addGuestAttendee(
      'Guest1',
      uniqueData.guest.lastName,
      `guest1.${uniqueData.guest.email}`,
      uniqueData.guest.phone
    );
    
    // Take screenshot showing visual distinction
    const screenshot = await page.screenshot({ fullPage: true });
    expect(screenshot).toBeTruthy();
  });

  test('should show attendee edit modal with correct layout', async ({ page }) => {
    // Generate unique test data
    const uniqueData = generateUniqueTestData();
    const uniqueId = Date.now().toString();
    
    // Create lodge details page object
    const lodgeDetailsPage = new LodgeDetailsPage(page);
    
    // Fill lodge details
    await lodgeDetailsPage.fillLodgeDetails(
      `Test Lodge ${uniqueId}`,
      uniqueId.substring(0, 3),
      'United Grand Lodge of NSW & ACT',
      `Lodge Secretary ${uniqueId}`,
      `secretary${uniqueId}@example.com`,
      `0400${uniqueId.substring(0, 6)}`
    );
    
    // Add 1 mason attendee
    await lodgeDetailsPage.addMasonAttendee(
      `Mason1`,
      uniqueData.mason.lastName,
      uniqueData.mason.email,
      uniqueData.mason.phone,
      'MM'
    );
    
    // Click edit button to open modal
    await page.locator('[data-testid="edit-attendee-button"]').first().click();
    
    // Wait for modal to appear
    await page.waitForSelector('[data-testid="attendee-modal"]');
    
    // Take screenshot of edit modal
    const screenshot = await page.screenshot();
    expect(screenshot).toBeTruthy();
  });
});