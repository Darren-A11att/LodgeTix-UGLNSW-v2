/**
 * E2E Test: Delegation Registration Complete Flow
 * Tests the full delegation registration workflow from start to confirmation
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

describe('Delegation Registration Flow', () => {
  let browser;
  let page;
  let testData;
  
  const screenshotDir = path.join(__dirname, '../../screenshots/delegation');
  
  beforeAll(async () => {
    // Create screenshot directory
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }
    
    browser = await puppeteer.launch({
      headless: process.env.PUPPETEER_HEADLESS !== 'false',
      slowMo: process.env.CI ? 0 : 50,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    // Load test data
    const TestDataManager = require('../../helpers/test-data-manager');
    testData = await TestDataManager.getDelegationTestData();
  });
  
  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
  });
  
  beforeEach(async () => {
    page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
  });
  
  afterEach(async () => {
    if (page) {
      await page.close();
    }
  });
  
  test('completes full delegation registration flow', async () => {
    // Navigate to event page
    await page.goto(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/events/${testData.eventSlug}`);
    
    // Take screenshot of event page
    await page.screenshot({ 
      path: path.join(screenshotDir, '01-event-page.png'),
      fullPage: true 
    });
    
    // Click Register button
    await page.waitForSelector('[data-testid="register-button"]', { timeout: 10000 });
    await page.click('[data-testid="register-button"]');
    
    // Step 1: Registration Type Selection
    await page.waitForSelector('[data-testid="registration-type-step"]', { timeout: 10000 });
    await page.screenshot({ 
      path: path.join(screenshotDir, '02-registration-type.png'),
      fullPage: true 
    });
    
    // Select delegation type
    await page.click('[data-testid="registration-type-delegation"]');
    await page.click('[data-testid="continue-button"]');
    
    // Step 2: Delegation Details
    await page.waitForSelector('[data-testid="attendee-details-step"]', { timeout: 10000 });
    await page.screenshot({ 
      path: path.join(screenshotDir, '03-delegation-details.png'),
      fullPage: true 
    });
    
    // Select delegation type
    await page.waitForSelector('[data-testid="delegation-type-modal"]');
    await page.click('[data-testid="delegation-type-official"]');
    
    // Fill Grand Lodge selection
    await page.type('[data-testid="grand-lodge-search"]', testData.grandLodge);
    await page.waitForSelector('[data-testid="grand-lodge-option"]');
    await page.click('[data-testid="grand-lodge-option"]');
    
    // Fill booking contact details
    await page.type('[data-testid="booking-contact-firstname"]', testData.bookingContact.firstName);
    await page.type('[data-testid="booking-contact-lastname"]', testData.bookingContact.lastName);
    await page.type('[data-testid="booking-contact-email"]', testData.bookingContact.email);
    await page.type('[data-testid="booking-contact-phone"]', testData.bookingContact.phone);
    
    // Add delegation members
    for (let i = 0; i < testData.delegationMembers.length; i++) {
      const member = testData.delegationMembers[i];
      
      if (i > 0) {
        await page.click('[data-testid="add-member-button"]');
      }
      
      await page.type(`[data-testid="member-${i}-firstname"]`, member.firstName);
      await page.type(`[data-testid="member-${i}-lastname"]`, member.lastName);
      await page.type(`[data-testid="member-${i}-email"]`, member.email);
      
      if (member.isGrandOfficer) {
        await page.click(`[data-testid="member-${i}-grand-officer"]`);
        await page.type(`[data-testid="member-${i}-grand-rank"]`, member.grandRank);
      }
      
      if (member.hasPartner) {
        await page.click(`[data-testid="member-${i}-partner-toggle"]`);
        await page.type(`[data-testid="member-${i}-partner-firstname"]`, member.partner.firstName);
        await page.type(`[data-testid="member-${i}-partner-lastname"]`, member.partner.lastName);
      }
    }
    
    await page.screenshot({ 
      path: path.join(screenshotDir, '04-delegation-filled.png'),
      fullPage: true 
    });
    
    await page.click('[data-testid="continue-button"]');
    
    // Step 3: Ticket Selection
    await page.waitForSelector('[data-testid="ticket-selection-step"]', { timeout: 10000 });
    await page.screenshot({ 
      path: path.join(screenshotDir, '05-ticket-selection.png'),
      fullPage: true 
    });
    
    // Select tickets for delegation members
    const ticketButtons = await page.$$('[data-testid^="ticket-select-"]');
    for (let i = 0; i < Math.min(ticketButtons.length, testData.delegationMembers.length); i++) {
      await ticketButtons[i].click();
    }
    
    await page.waitForTimeout(1000); // Wait for order summary to update
    await page.screenshot({ 
      path: path.join(screenshotDir, '06-tickets-selected.png'),
      fullPage: true 
    });
    
    await page.click('[data-testid="continue-button"]');
    
    // Step 4: Order Review
    await page.waitForSelector('[data-testid="order-review-step"]', { timeout: 10000 });
    await page.screenshot({ 
      path: path.join(screenshotDir, '07-order-review.png'),
      fullPage: true 
    });
    
    // Verify delegation details
    const delegationSummary = await page.$eval('[data-testid="delegation-summary"]', el => el.textContent);
    expect(delegationSummary).toContain(testData.grandLodge);
    expect(delegationSummary).toContain(`${testData.delegationMembers.length} members`);
    
    // Verify order total
    const orderTotal = await page.$eval('[data-testid="order-total"]', el => el.textContent);
    expect(orderTotal).toMatch(/\$[\d,]+\.\d{2}/);
    
    await page.click('[data-testid="continue-button"]');
    
    // Step 5: Payment
    await page.waitForSelector('[data-testid="payment-step"]', { timeout: 10000 });
    await page.screenshot({ 
      path: path.join(screenshotDir, '08-payment.png'),
      fullPage: true 
    });
    
    // Fill billing details
    await page.type('[data-testid="billing-name"]', testData.billing.name);
    await page.type('[data-testid="billing-address"]', testData.billing.address);
    await page.type('[data-testid="billing-city"]', testData.billing.city);
    await page.type('[data-testid="billing-postcode"]', testData.billing.postcode);
    
    // Select country and state
    await page.click('[data-testid="billing-country"]');
    await page.click('[data-testid="country-AU"]');
    await page.click('[data-testid="billing-state"]');
    await page.click('[data-testid="state-NSW"]');
    
    // Wait for Stripe to load
    await page.waitForSelector('iframe[name^="__privateStripeFrame"]', { timeout: 20000 });
    
    // Fill card details in Stripe iframe
    const stripeFrame = await page.waitForSelector('iframe[name^="__privateStripeFrame"]');
    const frame = await stripeFrame.contentFrame();
    
    await frame.type('[name="cardnumber"]', '4242424242424242');
    await frame.type('[name="exp-date"]', '12/28');
    await frame.type('[name="cvc"]', '123');
    
    await page.screenshot({ 
      path: path.join(screenshotDir, '09-payment-filled.png'),
      fullPage: true 
    });
    
    // Submit payment
    await page.click('[data-testid="submit-payment-button"]');
    
    // Wait for confirmation
    await page.waitForSelector('[data-testid="confirmation-step"]', { timeout: 30000 });
    await page.screenshot({ 
      path: path.join(screenshotDir, '10-confirmation.png'),
      fullPage: true 
    });
    
    // Verify confirmation details
    const confirmationNumber = await page.$eval('[data-testid="confirmation-number"]', el => el.textContent);
    expect(confirmationNumber).toMatch(/^CONF-[A-Z0-9]+$/);
    
    const confirmationEmail = await page.$eval('[data-testid="confirmation-email"]', el => el.textContent);
    expect(confirmationEmail).toContain(testData.bookingContact.email);
    
    console.log(`✅ Delegation registration completed with confirmation: ${confirmationNumber}`);
  }, 120000); // 2 minute timeout for full flow
  
  test('handles delegation member validation', async () => {
    await page.goto(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/events/${testData.eventSlug}/register`);
    
    // Navigate to delegation details
    await page.waitForSelector('[data-testid="registration-type-delegation"]');
    await page.click('[data-testid="registration-type-delegation"]');
    await page.click('[data-testid="continue-button"]');
    
    // Try to continue without required fields
    await page.waitForSelector('[data-testid="attendee-details-step"]');
    await page.click('[data-testid="continue-button"]');
    
    // Check for validation errors
    const errors = await page.$$('[data-testid^="field-error-"]');
    expect(errors.length).toBeGreaterThan(0);
    
    await page.screenshot({ 
      path: path.join(screenshotDir, 'validation-errors.png'),
      fullPage: true 
    });
  });
  
  test('allows editing delegation members', async () => {
    await page.goto(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/events/${testData.eventSlug}/register`);
    
    // Navigate to delegation details and add members
    await page.waitForSelector('[data-testid="registration-type-delegation"]');
    await page.click('[data-testid="registration-type-delegation"]');
    await page.click('[data-testid="continue-button"]');
    
    await page.waitForSelector('[data-testid="delegation-type-modal"]');
    await page.click('[data-testid="delegation-type-official"]');
    
    // Add a member
    await page.type('[data-testid="member-0-firstname"]', 'Test');
    await page.type('[data-testid="member-0-lastname"]', 'Member');
    await page.type('[data-testid="member-0-email"]', 'test@example.com');
    
    // Edit the member
    await page.click('[data-testid="edit-member-0"]');
    await page.waitForSelector('[data-testid="edit-member-modal"]');
    
    // Clear and update name
    await page.evaluate(() => {
      document.querySelector('[data-testid="edit-firstname"]').value = '';
    });
    await page.type('[data-testid="edit-firstname"]', 'Updated');
    
    await page.click('[data-testid="save-member-button"]');
    
    // Verify update
    const updatedName = await page.$eval('[data-testid="member-0-firstname"]', el => el.value);
    expect(updatedName).toBe('Updated');
    
    await page.screenshot({ 
      path: path.join(screenshotDir, 'member-edited.png'),
      fullPage: true 
    });
  });
});