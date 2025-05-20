# Task 146: Create Payment and Confirmation Flow Tests

## Description
Create comprehensive E2E tests for the payment processing and confirmation flow across all registration types.

## Dependencies
- Complete Task 141 (Setup E2E Testing Infrastructure)
- Complete Task 142-145 (All registration type tests)

## Test File Requirements

### 1. Create /tests/e2e/registration/payment-flow.test.ts
```typescript
import { test, expect } from '@playwright/test';
import { generateUniqueTestData } from '../../helpers/test-data';

describe('Payment and Confirmation Flow', () => {
  let testData: any;

  beforeEach(async ({ page }) => {
    testData = generateUniqueTestData();
  });

  test('should complete Individual payment flow', async ({ page }) => {
    // Complete Individual registration
    await completeIndividualRegistration(page, testData);
    
    // Select tickets
    await page.click('[data-testid="ticket-gala-dinner"]');
    await page.click('[data-testid="ticket-installation"]');
    
    // Verify order summary
    await expect(page.locator('[data-testid="order-total"]')).toBeVisible();
    
    await page.click('[data-testid="continue-to-payment"]');
    
    // Payment page
    await expect(page.locator('h2')).toContainText('Payment Details');
    
    // Fill payment information
    await fillPaymentDetails(page, testData);
    
    // Process payment
    await page.click('[data-testid="submit-payment"]');
    
    // Wait for confirmation
    await page.waitForSelector('[data-testid="payment-success"]', { timeout: 10000 });
    
    // Verify confirmation page
    await expect(page.locator('h2')).toContainText('Registration Confirmed');
    await expect(page.locator('[data-testid="confirmation-number"]')).toBeVisible();
    await expect(page.locator('[data-testid="receipt-email"]')).toContainText(testData.email);
  });

  test('should handle payment failure gracefully', async ({ page }) => {
    // Complete registration
    await completeIndividualRegistration(page, testData);
    
    // Select tickets and continue to payment
    await page.click('[data-testid="ticket-installation"]');
    await page.click('[data-testid="continue-to-payment"]');
    
    // Use card that will be declined
    await fillPaymentDetails(page, {
      ...testData,
      cardNumber: '4000000000000002' // Stripe test card for decline
    });
    
    await page.click('[data-testid="submit-payment"]');
    
    // Expect error message
    await expect(page.locator('[data-testid="payment-error"]')).toContainText('Your card was declined');
    
    // Should allow retry
    await expect(page.locator('[data-testid="retry-payment"]')).toBeVisible();
  });

  test('should validate payment form fields', async ({ page }) => {
    // Complete registration
    await completeIndividualRegistration(page, testData);
    
    // Select tickets
    await page.click('[data-testid="ticket-installation"]');
    await page.click('[data-testid="continue-to-payment"]');
    
    // Try to submit empty form
    await page.click('[data-testid="submit-payment"]');
    
    // Expect validation errors
    await expect(page.locator('[data-testid="error-card-number"]')).toContainText('Card number is required');
    await expect(page.locator('[data-testid="error-card-expiry"]')).toContainText('Expiry date is required');
    await expect(page.locator('[data-testid="error-card-cvc"]')).toContainText('CVC is required');
    
    // Fill partial data
    await page.fill('[data-testid="card-number"]', '4111');
    await page.click('[data-testid="submit-payment"]');
    
    // Expect format error
    await expect(page.locator('[data-testid="error-card-number"]')).toContainText('Invalid card number');
  });

  test('should handle 3D Secure authentication', async ({ page }) => {
    // Complete registration
    await completeIndividualRegistration(page, testData);
    
    // Select tickets
    await page.click('[data-testid="ticket-installation"]');
    await page.click('[data-testid="continue-to-payment"]');
    
    // Use card requiring 3DS
    await fillPaymentDetails(page, {
      ...testData,
      cardNumber: '4000002500003155' // Stripe test card for 3DS
    });
    
    await page.click('[data-testid="submit-payment"]');
    
    // Handle 3DS modal
    await page.waitForSelector('[data-testid="3ds-iframe"]');
    const iframe = page.frameLocator('[data-testid="3ds-iframe"]');
    await iframe.locator('[data-testid="authenticate-button"]').click();
    
    // Wait for success
    await page.waitForSelector('[data-testid="payment-success"]');
  });

  test('should save payment receipt', async ({ page }) => {
    // Complete full flow
    await completeIndividualRegistration(page, testData);
    
    // Select tickets
    await page.click('[data-testid="ticket-installation"]');
    await page.click('[data-testid="continue-to-payment"]');
    
    // Complete payment
    await fillPaymentDetails(page, testData);
    await page.click('[data-testid="submit-payment"]');
    
    // Wait for confirmation
    await page.waitForSelector('[data-testid="payment-success"]');
    
    // Download receipt
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('[data-testid="download-receipt"]')
    ]);
    
    // Verify download
    expect(download.suggestedFilename()).toMatch(/receipt.*\.pdf/);
  });

  test('should handle Lodge bulk payment', async ({ page }) => {
    // Complete Lodge registration with multiple attendees
    await completeLodgeRegistration(page, testData, 5);
    
    // Select tickets for all attendees
    await page.click('[data-testid="select-all-installation"]');
    await page.click('[data-testid="select-all-gala-dinner"]');
    
    // Verify bulk pricing
    await expect(page.locator('[data-testid="volume-discount"]')).toContainText('Lodge discount applied');
    const total = await page.locator('[data-testid="order-total"]').textContent();
    
    await page.click('[data-testid="continue-to-payment"]');
    
    // Fill billing details
    await fillBillingDetails(page, {
      ...testData,
      companyName: testData.lodgeName,
      abn: testData.lodgeABN
    });
    
    // Complete payment
    await fillPaymentDetails(page, testData);
    await page.click('[data-testid="submit-payment"]');
    
    // Wait for confirmation
    await page.waitForSelector('[data-testid="payment-success"]');
    
    // Verify all attendees are confirmed
    await expect(page.locator('[data-testid="confirmed-attendees"]')).toContainText('5 attendees confirmed');
  });

  test('should handle payment session expiry', async ({ page }) => {
    // Complete registration
    await completeIndividualRegistration(page, testData);
    
    // Select tickets
    await page.click('[data-testid="ticket-installation"]');
    await page.click('[data-testid="continue-to-payment"]');
    
    // Wait for session to expire (mock)
    await page.evaluate(() => {
      // Simulate session expiry
      window.localStorage.removeItem('payment-session');
    });
    
    // Try to submit payment
    await fillPaymentDetails(page, testData);
    await page.click('[data-testid="submit-payment"]');
    
    // Should show session expired message
    await expect(page.locator('[data-testid="session-expired"]')).toBeVisible();
    await expect(page.locator('[data-testid="restart-registration"]')).toBeVisible();
  });

  test('should send confirmation emails', async ({ page }) => {
    // Complete registration and payment
    await completeIndividualRegistration(page, testData);
    await page.click('[data-testid="ticket-installation"]');
    await page.click('[data-testid="continue-to-payment"]');
    await fillPaymentDetails(page, testData);
    await page.click('[data-testid="submit-payment"]');
    
    // Wait for confirmation
    await page.waitForSelector('[data-testid="payment-success"]');
    
    // Verify email confirmation message
    await expect(page.locator('[data-testid="email-sent-message"]')).toContainText(
      `Confirmation email sent to ${testData.email}`
    );
    
    // For Lodge registration, verify multiple emails
    if (testData.registrationType === 'lodge') {
      await expect(page.locator('[data-testid="attendee-emails-sent"]')).toContainText(
        'Individual confirmation emails sent to all attendees'
      );
    }
  });
});

// Helper functions
async function fillPaymentDetails(page: any, data: any) {
  // Card details
  await page.fill('[data-testid="card-number"]', data.cardNumber || '4242424242424242');
  await page.fill('[data-testid="card-expiry"]', '12/25');
  await page.fill('[data-testid="card-cvc"]', '123');
  await page.fill('[data-testid="card-name"]', `${data.firstName} ${data.lastName}`);
  
  // Billing address
  await page.fill('[data-testid="billing-address-1"]', data.address1);
  await page.fill('[data-testid="billing-city"]', data.city);
  await page.fill('[data-testid="billing-state"]', data.state);
  await page.fill('[data-testid="billing-postcode"]', data.postCode);
  await page.selectOption('[data-testid="billing-country"]', 'AU');
}

async function fillBillingDetails(page: any, data: any) {
  await page.fill('[data-testid="company-name"]', data.companyName);
  await page.fill('[data-testid="abn"]', data.abn);
  await page.fill('[data-testid="billing-contact-name"]', data.contactName);
  await page.fill('[data-testid="billing-contact-email"]', data.contactEmail);
  await page.fill('[data-testid="billing-contact-phone"]', data.contactPhone);
}

async function completeIndividualRegistration(page: any, data: any) {
  await page.goto('/events/grand-installation/register');
  await page.click('[data-testid="registration-type-individual"]');
  await page.click('[data-testid="continue-button"]');
  
  // Fill forms (simplified for testing)
  await page.fill('#first_name', data.firstName);
  await page.fill('#last_name', data.lastName);
  await page.fill('#email', data.email);
  await page.click('[data-testid="continue-button"]');
}

async function completeLodgeRegistration(page: any, data: any, attendeeCount: number) {
  await page.goto('/events/grand-installation/register');
  await page.click('[data-testid="registration-type-lodge"]');
  await page.click('[data-testid="continue-button"]');
  
  // Fill Lodge details
  await page.fill('#lodge_name', data.lodgeName);
  await page.fill('#lodge_number', data.lodgeNumber);
  await page.click('[data-testid="continue-button"]');
  
  // Add attendees (simplified)
  for (let i = 1; i <= attendeeCount; i++) {
    await page.click('[data-testid="add-mason-button"]');
    await page.fill(`#first_name-${i}`, `Attendee${i}`);
    await page.fill(`#last_name-${i}`, `Test${i}`);
    await page.fill(`#email-${i}`, `attendee${i}@test.com`);
    await page.click(`[data-testid="save-attendee-${i}"]`);
  }
  
  await page.click('[data-testid="continue-button"]');
}
```

### 2. Create payment edge case tests
```typescript
describe('Payment Edge Cases', () => {
  test('should handle network interruption during payment', async ({ page }) => {
    // Complete registration
    await completeIndividualRegistration(page, generateUniqueTestData());
    await page.click('[data-testid="ticket-installation"]');
    await page.click('[data-testid="continue-to-payment"]');
    
    // Fill payment details
    await fillPaymentDetails(page, generateUniqueTestData());
    
    // Simulate network interruption
    await page.route('**/api/stripe/**', route => route.abort());
    
    await page.click('[data-testid="submit-payment"]');
    
    // Expect network error handling
    await expect(page.locator('[data-testid="network-error"]')).toContainText(
      'Network error. Please check your connection and try again.'
    );
    
    // Re-enable network
    await page.unroute('**/api/stripe/**');
    
    // Should allow retry
    await page.click('[data-testid="retry-payment"]');
    await expect(page.locator('[data-testid="payment-processing"]')).toBeVisible();
  });

  test('should prevent double payment submission', async ({ page }) => {
    // Complete registration
    await completeIndividualRegistration(page, generateUniqueTestData());
    await page.click('[data-testid="ticket-installation"]');
    await page.click('[data-testid="continue-to-payment"]');
    
    // Fill payment details
    await fillPaymentDetails(page, generateUniqueTestData());
    
    // Double click submit
    await page.click('[data-testid="submit-payment"]');
    await page.click('[data-testid="submit-payment"]');
    
    // Should disable button after first click
    await expect(page.locator('[data-testid="submit-payment"]')).toBeDisabled();
    
    // Should show processing indicator
    await expect(page.locator('[data-testid="payment-processing"]')).toBeVisible();
  });

  test('should handle Stripe webhook failures', async ({ page }) => {
    // Complete payment flow
    const data = generateUniqueTestData();
    await completeIndividualRegistration(page, data);
    await page.click('[data-testid="ticket-installation"]');
    await page.click('[data-testid="continue-to-payment"]');
    await fillPaymentDetails(page, data);
    
    // Mock webhook failure
    await page.route('**/api/stripe/webhook', route => 
      route.fulfill({ status: 500 })
    );
    
    await page.click('[data-testid="submit-payment"]');
    
    // Payment should succeed but show warning
    await page.waitForSelector('[data-testid="payment-success"]');
    await expect(page.locator('[data-testid="webhook-warning"]')).toContainText(
      'Payment successful. You will receive confirmation email shortly.'
    );
  });
});
```

## Expected Outcomes
1. Complete payment flow testing for all registration types
2. Error handling and edge case coverage
3. 3D Secure authentication handling
4. Receipt download functionality
5. Confirmation email verification
6. Session management and timeout handling

## Verification Steps
1. Run payment tests: `npm run test:e2e -- payment-flow.test.ts`
2. Verify Stripe integration works correctly
3. Check error handling for various failure scenarios
4. Validate confirmation flow and email sending
5. Test receipt generation and download
6. Ensure security measures (double submission, session expiry) work