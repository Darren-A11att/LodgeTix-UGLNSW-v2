import { test, expect } from '@playwright/test';
import { RegistrationTypePage } from '../page-objects/registration-type-page';
import { AttendeeDetailsPage } from '../page-objects/attendee-details-page';
import { TicketSelectionPage } from '../page-objects/ticket-selection-page';
import { testData, generateUniqueTestData } from '../config/test-data';
import { takeScreenshot } from '../utils/test-utils';

test.describe('Individual Registration Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Start from registration type page
    const regTypePage = new RegistrationTypePage(page);
    await regTypePage.goto();
    
    // Select individual registration for all tests in this group
    await regTypePage.selectIndividual();
    
    // Verify we're on the attendee details page
    await page.waitForURL(/.*attendee-details/);
  });

  test('guest should be able to complete basic details', async ({ page }) => {
    // Generate unique test data
    const uniqueData = generateUniqueTestData();
    const guestData = uniqueData.guest;
    
    // Create attendee details page object
    const attendeeDetailsPage = new AttendeeDetailsPage(page);
    
    // Fill guest details
    await attendeeDetailsPage.fillGuestDetails(
      guestData.firstName,
      guestData.lastName,
      guestData.email,
      guestData.phone,
      'No nuts please',
      'None'
    );
    
    // Take screenshot of completed form
    await takeScreenshot(page, 'individual-guest-form-completed');
    
    // Continue to ticket selection
    await attendeeDetailsPage.continueToTicketSelection();
    
    // Verify navigation to ticket selection page
    await expect(page).toHaveURL(/.*ticket-selection/);
  });

  test('mason should be able to complete details with lodge information', async ({ page }) => {
    // Generate unique test data
    const uniqueData = generateUniqueTestData();
    const masonData = uniqueData.mason;
    
    // Create attendee details page object
    const attendeeDetailsPage = new AttendeeDetailsPage(page);
    
    // Fill mason details
    await attendeeDetailsPage.fillMasonDetails(
      masonData.firstName,
      masonData.lastName,
      masonData.email,
      masonData.phone,
      'MM', // Rank
      'United Grand Lodge of NSW & ACT', // Grand Lodge
      'Sydney Lodge No. 123', // Lodge
      'Vegetarian',
      'None'
    );
    
    // Take screenshot of completed form
    await takeScreenshot(page, 'individual-mason-form-completed');
    
    // Continue to ticket selection
    await attendeeDetailsPage.continueToTicketSelection();
    
    // Verify navigation to ticket selection page
    await expect(page).toHaveURL(/.*ticket-selection/);
  });

  test('guest should be able to add partner', async ({ page }) => {
    // Generate unique test data
    const uniqueData = generateUniqueTestData();
    const guestData = uniqueData.guest;
    const partnerData = {
      firstName: 'Partner',
      lastName: guestData.lastName,
      email: `partner.${guestData.email}`,
      phone: guestData.phone.replace(/\d{4}$/, '9999')
    };
    
    // Create attendee details page object
    const attendeeDetailsPage = new AttendeeDetailsPage(page);
    
    // Fill guest details
    await attendeeDetailsPage.fillGuestDetails(
      guestData.firstName,
      guestData.lastName,
      guestData.email,
      guestData.phone
    );
    
    // Add partner
    await attendeeDetailsPage.addPartner(
      partnerData.firstName,
      partnerData.lastName,
      partnerData.email,
      partnerData.phone,
      'Gluten free',
      'None'
    );
    
    // Take screenshot of form with partner
    await takeScreenshot(page, 'individual-guest-with-partner-completed');
    
    // Continue to ticket selection
    await attendeeDetailsPage.continueToTicketSelection();
    
    // Verify navigation to ticket selection page
    await expect(page).toHaveURL(/.*ticket-selection/);
  });

  test('should validate all required fields', async ({ page }) => {
    // Create attendee details page object
    const attendeeDetailsPage = new AttendeeDetailsPage(page);
    
    // Try to continue without filling required fields
    await attendeeDetailsPage.continueButton.click();
    
    // Check for error messages
    const formErrorMessages = await page.locator('[data-testid="form-error-message"]').count();
    expect(formErrorMessages).toBeGreaterThan(0);
    
    // Take screenshot of validation errors
    await takeScreenshot(page, 'individual-form-validation-errors');
  });

  test('should allow complete flow from guest details to ticket selection', async ({ page }) => {
    // Generate unique test data
    const uniqueData = generateUniqueTestData();
    const guestData = uniqueData.guest;
    
    // Create page objects
    const attendeeDetailsPage = new AttendeeDetailsPage(page);
    const ticketSelectionPage = new TicketSelectionPage(page);
    
    // Fill guest details
    await attendeeDetailsPage.fillGuestDetails(
      guestData.firstName,
      guestData.lastName,
      guestData.email,
      guestData.phone
    );
    
    // Continue to ticket selection
    await attendeeDetailsPage.continueToTicketSelection();
    
    // Verify we're on ticket selection page
    await expect(page).toHaveURL(/.*ticket-selection/);
    
    // Select tickets
    await ticketSelectionPage.selectTicket('General Admission', 1);
    
    // Verify total amount updates
    const totalAmount = await ticketSelectionPage.getTotalAmount();
    expect(totalAmount).toBeGreaterThan(0);
    
    // Continue to order review
    await ticketSelectionPage.continueToOrderReview();
    
    // Verify navigation to order review page
    await expect(page).toHaveURL(/.*order-review/);
  });
});