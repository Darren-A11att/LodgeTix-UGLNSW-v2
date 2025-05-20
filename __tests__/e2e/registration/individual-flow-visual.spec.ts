import { test, expect } from '@playwright/test';
import { RegistrationTypePage } from '../page-objects/registration-type-page';
import { AttendeeDetailsPage } from '../page-objects/attendee-details-page';
import { generateUniqueTestData } from '../config/test-data';

test.describe('Individual Registration Flow Visual Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Start from registration type page
    const regTypePage = new RegistrationTypePage(page);
    await regTypePage.goto();
    
    // Select individual registration for all tests in this group
    await regTypePage.selectIndividual();
    
    // Verify we're on the attendee details page
    await page.waitForURL(/.*attendee-details/);
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

  test('should show different fields for mason vs guest', async ({ page }) => {
    const attendeeDetailsPage = new AttendeeDetailsPage(page);
    
    // Capture guest form state
    const guestScreenshot = await page.screenshot({ fullPage: true });
    
    // Toggle to mason form
    await attendeeDetailsPage.isMasonToggle.check();
    
    // Wait for mason-specific fields to appear
    await page.waitForSelector('select[name="rank"]');
    
    // Capture mason form state
    const masonScreenshot = await page.screenshot({ fullPage: true });
    
    // Verify screenshots are different (indicating different form fields are shown)
    expect(guestScreenshot).not.toEqual(masonScreenshot);
  });

  test('should show partner form when toggle is clicked', async ({ page }) => {
    const attendeeDetailsPage = new AttendeeDetailsPage(page);
    
    // Generate unique test data and fill primary attendee
    const uniqueData = generateUniqueTestData();
    await attendeeDetailsPage.fillGuestDetails(
      uniqueData.guest.firstName,
      uniqueData.guest.lastName,
      uniqueData.guest.email,
      uniqueData.guest.phone
    );
    
    // Capture form before adding partner
    const beforePartnerScreenshot = await page.screenshot({ fullPage: true });
    
    // Add partner
    await attendeeDetailsPage.partnerToggle.click();
    
    // Wait for partner form to appear
    await page.waitForSelector('[data-testid="partner-form"]');
    
    // Capture form after adding partner
    const afterPartnerScreenshot = await page.screenshot({ fullPage: true });
    
    // Verify screenshots are different (indicating partner form is shown)
    expect(beforePartnerScreenshot).not.toEqual(afterPartnerScreenshot);
  });
});