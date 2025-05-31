/**
 * E2E Test: Lodge Registration Complete Flow
 * Tests the full lodge registration workflow including member management
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

describe('Lodge Registration Flow', () => {
  let browser;
  let page;
  let testData;
  
  const screenshotDir = path.join(__dirname, '../../screenshots/lodge');
  
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
    testData = await TestDataManager.getLodgeTestData();
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
  
  test('completes full lodge registration flow', async () => {
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
    
    // Select lodge type
    await page.click('[data-testid="registration-type-lodge"]');
    await page.click('[data-testid="continue-button"]');
    
    // Step 2: Lodge Details
    await page.waitForSelector('[data-testid="attendee-details-step"]', { timeout: 10000 });
    await page.screenshot({ 
      path: path.join(screenshotDir, '03-lodge-details.png'),
      fullPage: true 
    });
    
    // Select Grand Lodge
    await page.click('[data-testid="grand-lodge-select"]');
    await page.type('[data-testid="grand-lodge-search"]', testData.grandLodge);
    await page.waitForSelector('[data-testid="grand-lodge-option"]');
    await page.click('[data-testid="grand-lodge-option"]');
    
    // Select Lodge
    await page.waitForSelector('[data-testid="lodge-select"]');
    await page.click('[data-testid="lodge-select"]');
    await page.type('[data-testid="lodge-search"]', testData.lodge.name);
    await page.waitForSelector('[data-testid="lodge-option"]');
    await page.click('[data-testid="lodge-option"]');
    
    // Fill booking contact details
    await page.type('[data-testid="booking-contact-firstname"]', testData.bookingContact.firstName);
    await page.type('[data-testid="booking-contact-lastname"]', testData.bookingContact.lastName);
    await page.type('[data-testid="booking-contact-email"]', testData.bookingContact.email);
    await page.type('[data-testid="booking-contact-phone"]', testData.bookingContact.phone);
    
    // Add lodge members
    for (let i = 0; i < testData.lodgeMembers.length; i++) {
      const member = testData.lodgeMembers[i];
      
      if (i > 0) {
        await page.click('[data-testid="add-member-button"]');
      }
      
      // Select title
      await page.click(`[data-testid="member-${i}-title"]`);
      await page.click(`[data-testid="title-${member.title}"]`);
      
      await page.type(`[data-testid="member-${i}-firstname"]`, member.firstName);
      await page.type(`[data-testid="member-${i}-lastname"]`, member.lastName);
      await page.type(`[data-testid="member-${i}-email"]`, member.email);
      await page.type(`[data-testid="member-${i}-phone"]`, member.phone);
      
      // Lodge role
      if (member.lodgeRole) {
        await page.click(`[data-testid="member-${i}-lodge-role"]`);
        await page.click(`[data-testid="role-${member.lodgeRole}"]`);
      }
      
      // Grand Lodge officer
      if (member.isGrandOfficer) {
        await page.click(`[data-testid="member-${i}-grand-officer"]`);
        await page.type(`[data-testid="member-${i}-grand-rank"]`, member.grandRank);
      }
      
      // Partner details
      if (member.hasPartner) {
        await page.click(`[data-testid="member-${i}-partner-toggle"]`);
        await page.type(`[data-testid="member-${i}-partner-firstname"]`, member.partner.firstName);
        await page.type(`[data-testid="member-${i}-partner-lastname"]`, member.partner.lastName);
        await page.click(`[data-testid="member-${i}-partner-relationship"]`);
        await page.click(`[data-testid="relationship-${member.partner.relationship}"]`);
      }
    }
    
    await page.screenshot({ 
      path: path.join(screenshotDir, '04-lodge-members-filled.png'),
      fullPage: true 
    });
    
    await page.click('[data-testid="continue-button"]');
    
    // Step 3: Ticket Selection
    await page.waitForSelector('[data-testid="ticket-selection-step"]', { timeout: 10000 });
    await page.screenshot({ 
      path: path.join(screenshotDir, '05-ticket-selection.png'),
      fullPage: true 
    });
    
    // Select tickets based on member types
    for (let i = 0; i < testData.lodgeMembers.length; i++) {
      const member = testData.lodgeMembers[i];
      
      // Select main attendee ticket
      await page.click(`[data-testid="member-${i}-ticket-select"]`);
      await page.click(`[data-testid="ticket-${member.ticketType}"]`);
      
      // Select partner ticket if applicable
      if (member.hasPartner) {
        await page.click(`[data-testid="partner-${i}-ticket-select"]`);
        await page.click(`[data-testid="ticket-${member.partner.ticketType}"]`);
      }
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
    
    // Verify lodge details
    const lodgeSummary = await page.$eval('[data-testid="lodge-summary"]', el => el.textContent);
    expect(lodgeSummary).toContain(testData.lodge.name);
    expect(lodgeSummary).toContain(testData.lodge.number);
    
    // Verify member count
    const memberCount = await page.$eval('[data-testid="member-count"]', el => el.textContent);
    const totalAttendees = testData.lodgeMembers.length + testData.lodgeMembers.filter(m => m.hasPartner).length;
    expect(memberCount).toContain(`${totalAttendees} attendees`);
    
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
    
    console.log(`✅ Lodge registration completed with confirmation: ${confirmationNumber}`);
  }, 120000); // 2 minute timeout for full flow
  
  test('enforces minimum member requirements', async () => {
    await page.goto(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/events/${testData.eventSlug}/register`);
    
    // Navigate to lodge details
    await page.waitForSelector('[data-testid="registration-type-lodge"]');
    await page.click('[data-testid="registration-type-lodge"]');
    await page.click('[data-testid="continue-button"]');
    
    // Select lodge but don't add enough members
    await page.waitForSelector('[data-testid="lodge-select"]');
    
    // Try to continue without minimum members
    await page.click('[data-testid="continue-button"]');
    
    // Check for minimum members alert
    const alert = await page.waitForSelector('[data-testid="minimum-members-alert"]');
    expect(alert).toBeTruthy();
    
    const alertText = await page.$eval('[data-testid="minimum-members-alert"]', el => el.textContent);
    expect(alertText).toContain('minimum');
    
    await page.screenshot({ 
      path: path.join(screenshotDir, 'minimum-members-alert.png'),
      fullPage: true 
    });
  });
  
  test('allows bulk member import', async () => {
    await page.goto(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/events/${testData.eventSlug}/register`);
    
    // Navigate to lodge details
    await page.waitForSelector('[data-testid="registration-type-lodge"]');
    await page.click('[data-testid="registration-type-lodge"]');
    await page.click('[data-testid="continue-button"]');
    
    await page.waitForSelector('[data-testid="attendee-details-step"]');
    
    // Click import members button
    await page.click('[data-testid="import-members-button"]');
    await page.waitForSelector('[data-testid="import-modal"]');
    
    // Upload CSV file
    const fileInput = await page.$('[data-testid="csv-file-input"]');
    const csvPath = path.join(__dirname, '../../fixtures/lodge-members.csv');
    await fileInput.uploadFile(csvPath);
    
    // Confirm import
    await page.click('[data-testid="confirm-import-button"]');
    
    // Verify members were imported
    await page.waitForSelector('[data-testid="member-0-firstname"]');
    const importedMembers = await page.$$('[data-testid^="member-"][data-testid$="-firstname"]');
    expect(importedMembers.length).toBeGreaterThan(0);
    
    await page.screenshot({ 
      path: path.join(screenshotDir, 'members-imported.png'),
      fullPage: true 
    });
  });
  
  test('handles member role assignments', async () => {
    await page.goto(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/events/${testData.eventSlug}/register`);
    
    // Navigate to lodge details
    await page.waitForSelector('[data-testid="registration-type-lodge"]');
    await page.click('[data-testid="registration-type-lodge"]');
    await page.click('[data-testid="continue-button"]');
    
    await page.waitForSelector('[data-testid="attendee-details-step"]');
    
    // Add member with specific lodge role
    await page.type('[data-testid="member-0-firstname"]', 'John');
    await page.type('[data-testid="member-0-lastname"]', 'Smith');
    
    // Assign as Worshipful Master
    await page.click('[data-testid="member-0-lodge-role"]');
    await page.click('[data-testid="role-WM"]');
    
    // Verify role badge appears
    const roleBadge = await page.waitForSelector('[data-testid="member-0-role-badge"]');
    const badgeText = await page.$eval('[data-testid="member-0-role-badge"]', el => el.textContent);
    expect(badgeText).toBe('WM');
    
    // Try to add another WM (should show warning)
    await page.click('[data-testid="add-member-button"]');
    await page.click('[data-testid="member-1-lodge-role"]');
    await page.click('[data-testid="role-WM"]');
    
    const warning = await page.waitForSelector('[data-testid="duplicate-role-warning"]');
    expect(warning).toBeTruthy();
    
    await page.screenshot({ 
      path: path.join(screenshotDir, 'lodge-roles.png'),
      fullPage: true 
    });
  });
});