import { test, expect } from '@playwright/test';
import { RegistrationTypePage } from '../page-objects/registration-type-page';
import { LodgeDetailsPage } from '../page-objects/lodge-details-page';
import { TicketSelectionPage } from '../page-objects/ticket-selection-page';
import { generateUniqueTestData } from '../config/test-data';
import { takeScreenshot } from '../utils/test-utils';

test.describe('Lodge Registration Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Start from registration type page
    const regTypePage = new RegistrationTypePage(page);
    await regTypePage.goto();
    
    // Select lodge registration for all tests in this group
    await regTypePage.selectLodge();
    
    // Verify we're on the lodge details page
    await page.waitForURL(/.*lodge-details/);
  });

  test('should allow filling lodge details', async ({ page }) => {
    // Generate unique test data
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
    
    // Take screenshot of completed form
    await takeScreenshot(page, 'lodge-details-completed');
  });

  test('should enforce minimum 3 members for lodge registration', async ({ page }) => {
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
    
    // Add only 2 members
    await lodgeDetailsPage.addMasonAttendee(
      uniqueData.mason.firstName + '1',
      uniqueData.mason.lastName,
      `mason1.${uniqueData.mason.email}`,
      uniqueData.mason.phone,
      'MM'
    );
    
    await lodgeDetailsPage.addMasonAttendee(
      uniqueData.mason.firstName + '2',
      uniqueData.mason.lastName,
      `mason2.${uniqueData.mason.email}`,
      uniqueData.mason.phone.replace(/\d{4}$/, '1111'),
      'MM'
    );
    
    // Verify continue button is disabled
    const isEnabled = await lodgeDetailsPage.continueButton.isEnabled();
    expect(isEnabled).toBe(false);
    
    // Check error message is displayed
    const errorMessage = await page.getByText(/minimum 3 members required/i).isVisible();
    expect(errorMessage).toBe(true);
    
    // Add a third member
    await lodgeDetailsPage.addMasonAttendee(
      uniqueData.mason.firstName + '3',
      uniqueData.mason.lastName,
      `mason3.${uniqueData.mason.email}`,
      uniqueData.mason.phone.replace(/\d{4}$/, '2222'),
      'MM'
    );
    
    // Verify continue button is now enabled
    const isNowEnabled = await lodgeDetailsPage.continueButton.isEnabled();
    expect(isNowEnabled).toBe(true);
  });

  test('should allow adding mixed mason and guest attendees', async ({ page }) => {
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
    
    // Add 2 guest attendees
    for (let i = 1; i <= 2; i++) {
      await lodgeDetailsPage.addGuestAttendee(
        `Guest${i}`,
        uniqueData.guest.lastName,
        `guest${i}.${uniqueData.guest.email}`,
        uniqueData.guest.phone.replace(/\d{4}$/, `${i}999`)
      );
    }
    
    // Verify attendee count
    const attendeeCount = await lodgeDetailsPage.getAttendeeCount();
    expect(attendeeCount).toBe(5); // 3 masons + 2 guests
    
    // Take screenshot of attendee list
    await takeScreenshot(page, 'lodge-mixed-attendees');
  });

  test('should allow editing attendees', async ({ page }) => {
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
    
    // Edit the first attendee
    const updatedFirstName = `UpdatedMason1`;
    await lodgeDetailsPage.editAttendee(0, {
      firstName: updatedFirstName,
      email: `updated.mason1.${uniqueData.mason.email}`
    });
    
    // Verify the edit was successful by checking if the name appears in the attendee list
    const attendeeList = await page.locator('[data-testid="attendee-list"]').textContent();
    expect(attendeeList).toContain(updatedFirstName);
  });

  test('should allow removing attendees', async ({ page }) => {
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
    
    // Add 4 mason attendees
    for (let i = 1; i <= 4; i++) {
      await lodgeDetailsPage.addMasonAttendee(
        `Mason${i}`,
        uniqueData.mason.lastName,
        `mason${i}.${uniqueData.mason.email}`,
        uniqueData.mason.phone.replace(/\d{4}$/, `${i}111`),
        'MM'
      );
    }
    
    // Get initial attendee count
    const initialCount = await lodgeDetailsPage.getAttendeeCount();
    
    // Remove one attendee
    await lodgeDetailsPage.removeAttendee(1); // Remove the second attendee (index 1)
    
    // Verify attendee count decreased
    const newCount = await lodgeDetailsPage.getAttendeeCount();
    expect(newCount).toBe(initialCount - 1);
  });

  test('should complete full lodge registration flow', async ({ page }) => {
    // Generate unique test data
    const uniqueData = generateUniqueTestData();
    const uniqueId = Date.now().toString();
    
    // Create page objects
    const lodgeDetailsPage = new LodgeDetailsPage(page);
    const ticketSelectionPage = new TicketSelectionPage(page);
    
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
    
    // Continue to ticket selection
    await lodgeDetailsPage.continueToTicketSelection();
    
    // Verify we're on ticket selection page
    await expect(page).toHaveURL(/.*ticket-selection/);
    
    // Select tickets
    await ticketSelectionPage.selectTicket('General Admission', 3);
    
    // Verify total amount updates (should have 3 tickets)
    const singleTicketPrice = await ticketSelectionPage.getTicketPrice('General Admission');
    const totalAmount = await ticketSelectionPage.getTotalAmount();
    expect(totalAmount).toBeCloseTo(singleTicketPrice * 3, 1); // Allow for rounding
    
    // Continue to order review
    await ticketSelectionPage.continueToOrderReview();
    
    // Verify navigation to order review page
    await expect(page).toHaveURL(/.*order-review/);
  });
});