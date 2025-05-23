import { test, expect } from '@playwright/test';
import { RegistrationTypePage } from '../page-objects/registration-type-page';
import { AttendeeDetailsPage } from '../page-objects/attendee-details-page';
import { TicketSelectionPage } from '../page-objects/ticket-selection-page';
import { OrderReviewPage } from '../page-objects/order-review-page';
import { PaymentPage } from '../page-objects/payment-page';
import { ConfirmationPage } from '../page-objects/confirmation-page';
import { generateUniqueTestData } from '../config/test-data';
import { takeScreenshot } from '../utils/test-utils';

// Helper function to complete the registration flow up to the payment page
async function setupPaymentTest(page) {
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
  
  // Return the test data and page objects
  return {
    uniqueData,
    orderReviewPage,
    paymentPage: new PaymentPage(page),
    confirmationPage: new ConfirmationPage(page)
  };
}

test.describe('Payment and Confirmation Flow', () => {
  test('should display billing form with all required fields', async ({ page }) => {
    const { paymentPage } = await setupPaymentTest(page);
    
    // Verify all required billing fields are visible
    await expect(paymentPage.nameOnCardInput).toBeVisible();
    await expect(paymentPage.emailInput).toBeVisible();
    await expect(paymentPage.phoneInput).toBeVisible();
    await expect(paymentPage.addressLine1Input).toBeVisible();
    await expect(paymentPage.suburbInput).toBeVisible();
    await expect(paymentPage.stateSelect).toBeVisible();
    await expect(paymentPage.postcodeInput).toBeVisible();
    
    // Take screenshot of billing form
    await takeScreenshot(page, 'payment-billing-form');
  });

  test('should display order summary on payment page', async ({ page }) => {
    const { paymentPage } = await setupPaymentTest(page);
    
    // Verify order summary is visible
    await expect(paymentPage.orderSummary).toBeVisible();
    
    // Verify total amount is visible and greater than 0
    const totalAmountText = await paymentPage.totalAmount.textContent();
    expect(totalAmountText).toMatch(/\$/);
  });

  test('should validate required billing fields', async ({ page }) => {
    const { paymentPage } = await setupPaymentTest(page);
    
    // Try to submit without filling required fields
    await paymentPage.payButton.click();
    
    // Wait for validation errors
    await page.waitForSelector('[data-testid="form-error"]');
    
    // Verify at least one error message is displayed
    const errorCount = await page.locator('[data-testid="form-error"]').count();
    expect(errorCount).toBeGreaterThan(0);
    
    // Take screenshot of validation errors
    await takeScreenshot(page, 'payment-validation-errors');
  });

  test('should display card element for payment', async ({ page }) => {
    const { paymentPage } = await setupPaymentTest(page);
    
    // Verify card element is visible
    await expect(paymentPage.cardElement).toBeVisible();
  });

  test('should complete payment and navigate to confirmation page', async ({ page }) => {
    const { paymentPage, confirmationPage } = await setupPaymentTest(page);
    
    // Complete the purchase
    await paymentPage.completePurchase();
    
    // Verify we're on confirmation page
    await expect(page).toHaveURL(/.*confirmation/);
    
    // Verify confirmation message is displayed
    await expect(confirmationPage.confirmationMessage).toBeVisible();
    
    // Verify order number is displayed
    await expect(confirmationPage.orderNumber).toBeVisible();
    
    // Take screenshot of confirmation page
    await takeScreenshot(page, 'payment-confirmation');
  });

  test('should display receipt download button on confirmation page', async ({ page }) => {
    const { paymentPage, confirmationPage } = await setupPaymentTest(page);
    
    // Complete the purchase
    await paymentPage.completePurchase();
    
    // Verify receipt download button is visible
    await expect(confirmationPage.downloadReceiptButton).toBeVisible();
  });

  test('should allow navigation back from payment to order review', async ({ page }) => {
    const { paymentPage } = await setupPaymentTest(page);
    
    // Go back to order review
    await paymentPage.goBack();
    
    // Verify we're back on order review page
    await expect(page).toHaveURL(/.*order-review/);
  });

  test('should maintain order details throughout payment flow', async ({ page }) => {
    // Setup payment test
    const { orderReviewPage, paymentPage, confirmationPage } = await setupPaymentTest(page);
    
    // Get total amount on order review page
    const orderReviewTotal = await orderReviewPage.getTotalAmount();
    
    // Continue to payment page
    await orderReviewPage.continueToPayment();
    
    // Get total amount on payment page
    const paymentPageTotal = parseFloat((await paymentPage.totalAmount.textContent())
      ?.replace(/[^0-9.]/g, '') || '0');
    
    // Verify total amount is consistent
    expect(paymentPageTotal).toBeCloseTo(orderReviewTotal, 2);
    
    // Complete the purchase
    await paymentPage.completePurchase();
    
    // Get total amount on confirmation page
    const confirmationTotal = await confirmationPage.getTotalAmount();
    
    // Verify total amount is consistent across all pages
    expect(confirmationTotal).toBeCloseTo(orderReviewTotal, 2);
  });

  test('should display all purchased tickets on confirmation page', async ({ page }) => {
    // Start from registration type page
    const regTypePage = new RegistrationTypePage(page);
    await regTypePage.goto();
    
    // Select individual registration
    await regTypePage.selectIndividual();
    
    // Generate unique test data
    const uniqueData = generateUniqueTestData();
    
    // Fill attendee details with partner
    const attendeeDetailsPage = new AttendeeDetailsPage(page);
    await attendeeDetailsPage.fillGuestDetails(
      uniqueData.guest.firstName,
      uniqueData.guest.lastName,
      uniqueData.guest.email,
      uniqueData.guest.phone
    );
    
    // Add partner
    await attendeeDetailsPage.addPartner(
      'Partner',
      uniqueData.guest.lastName,
      `partner.${uniqueData.guest.email}`,
      uniqueData.guest.phone.replace(/\d{4}$/, '9999')
    );
    
    await attendeeDetailsPage.continueToTicketSelection();
    
    // Select tickets for both attendees
    const ticketSelectionPage = new TicketSelectionPage(page);
    await ticketSelectionPage.selectTicket('General Admission', 2);
    await ticketSelectionPage.continueToOrderReview();
    
    // Continue to payment
    const orderReviewPage = new OrderReviewPage(page);
    await orderReviewPage.continueToPayment();
    
    // Complete purchase
    const paymentPage = new PaymentPage(page);
    await paymentPage.completePurchase();
    
    // Verify confirmation page
    const confirmationPage = new ConfirmationPage(page);
    
    // Verify both attendees are displayed
    const attendeeCount = await confirmationPage.getAttendeeCount();
    expect(attendeeCount).toBe(2);
    
    // Take screenshot of confirmation with multiple attendees
    await takeScreenshot(page, 'confirmation-multiple-attendees');
  });
});