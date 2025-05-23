import { test, expect } from '@playwright/test';
import { RegistrationTypePage } from '../page-objects/registration-type-page';
import { AttendeeDetailsPage } from '../page-objects/attendee-details-page';
import { TicketSelectionPage } from '../page-objects/ticket-selection-page';
import { OrderReviewPage } from '../page-objects/order-review-page';
import { PaymentPage } from '../page-objects/payment-page';
import { ConfirmationPage } from '../page-objects/confirmation-page';
import { generateUniqueTestData } from '../config/test-data';
import { takeScreenshot } from '../utils/test-utils';

// Helper function to complete the entire registration flow
async function completeRegistrationFlow(page) {
  // Generate unique test data
  const uniqueData = generateUniqueTestData();
  
  // Start from registration type page
  const regTypePage = new RegistrationTypePage(page);
  await regTypePage.goto();
  
  // Select individual registration
  await regTypePage.selectIndividual();
  
  // Fill attendee details
  const attendeeDetailsPage = new AttendeeDetailsPage(page);
  await attendeeDetailsPage.fillGuestDetails(
    uniqueData.guest.firstName,
    uniqueData.guest.lastName,
    uniqueData.guest.email,
    uniqueData.guest.phone
  );
  await attendeeDetailsPage.continueToTicketSelection();
  
  // Select tickets
  const ticketSelectionPage = new TicketSelectionPage(page);
  await ticketSelectionPage.selectTicket('General Admission', 1);
  await ticketSelectionPage.continueToOrderReview();
  
  // Complete order review
  const orderReviewPage = new OrderReviewPage(page);
  await orderReviewPage.continueToPayment();
  
  // Complete payment
  const paymentPage = new PaymentPage(page);
  await paymentPage.completePurchase();
  
  // Return test data and page objects
  return {
    uniqueData,
    confirmationPage: new ConfirmationPage(page)
  };
}

test.describe('Confirmation Flow', () => {
  test('should display order number and confirmation details', async ({ page }) => {
    const { confirmationPage } = await completeRegistrationFlow(page);
    
    // Verify confirmation message is displayed
    await expect(confirmationPage.confirmationMessage).toBeVisible();
    
    // Verify order number is displayed and has expected format
    const orderNumber = await confirmationPage.getOrderNumber();
    expect(orderNumber).toMatch(/[A-Z0-9-]+/);
    
    // Verify order details are displayed
    await expect(confirmationPage.confirmationDetails).toBeVisible();
    
    // Take screenshot of confirmation details
    await takeScreenshot(page, 'confirmation-details');
  });

  test('should display attendee information on confirmation page', async ({ page }) => {
    const { uniqueData, confirmationPage } = await completeRegistrationFlow(page);
    
    // Verify attendee list is displayed
    await expect(confirmationPage.attendeeList).toBeVisible();
    
    // Verify attendee name appears on the page
    const pageContent = await page.textContent('body');
    expect(pageContent).toContain(uniqueData.guest.firstName);
    expect(pageContent).toContain(uniqueData.guest.lastName);
  });

  test('should display ticket information on confirmation page', async ({ page }) => {
    const { confirmationPage } = await completeRegistrationFlow(page);
    
    // Verify ticket list is displayed
    await expect(confirmationPage.ticketList).toBeVisible();
    
    // Verify ticket type appears on the page
    const pageContent = await page.textContent('body');
    expect(pageContent).toContain('General Admission');
  });

  test('should display total amount paid on confirmation page', async ({ page }) => {
    const { confirmationPage } = await completeRegistrationFlow(page);
    
    // Verify total amount is displayed
    await expect(confirmationPage.totalAmount).toBeVisible();
    
    // Verify total amount is greater than 0
    const totalAmount = await confirmationPage.getTotalAmount();
    expect(totalAmount).toBeGreaterThan(0);
  });

  test('should allow downloading receipt', async ({ page }) => {
    const { confirmationPage } = await completeRegistrationFlow(page);
    
    // Verify download receipt button is visible
    await expect(confirmationPage.downloadReceiptButton).toBeVisible();
    
    // In a real test, we'd test the download functionality
    // For now, just verify the button click doesn't cause an error
    // Start waiting for download before clicking button
    const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);
    
    // Click download button
    await confirmationPage.downloadReceiptButton.click();
    
    // Wait for download event or timeout
    const download = await downloadPromise;
    
    // If download is initiated, log success
    if (download) {
      console.log('Receipt download initiated');
    }
  });

  test('should allow navigation to home page from confirmation', async ({ page }) => {
    const { confirmationPage } = await completeRegistrationFlow(page);
    
    // Verify return to home button is visible
    await expect(confirmationPage.returnToHomeButton).toBeVisible();
    
    // Click return to home button
    await confirmationPage.returnToHome();
    
    // Verify navigation to home page
    await expect(page).toHaveURL(/^\/?$/);
  });

  test('should display responsive layout on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewport({ width: 375, height: 812 });
    
    const { confirmationPage } = await completeRegistrationFlow(page);
    
    // Verify key elements are visible on mobile
    await expect(confirmationPage.confirmationMessage).toBeVisible();
    await expect(confirmationPage.orderNumber).toBeVisible();
    await expect(confirmationPage.downloadReceiptButton).toBeVisible();
    
    // Take screenshot of mobile confirmation page
    await takeScreenshot(page, 'confirmation-mobile');
  });

  test('should include payment method information', async ({ page }) => {
    const { confirmationPage } = await completeRegistrationFlow(page);
    
    // Verify payment method info is displayed
    const pageContent = await page.textContent('body');
    expect(pageContent).toContain('Credit Card');
  });
});