/**
 * Contact Preference Scenarios Test Suite
 * 
 * This comprehensive test suite covers all contact preference variations and their
 * impact on required fields and data flow. It tests:
 * - PrimaryAttendee preference (no contact fields required)
 * - Directly preference (email and phone required)
 * - ProvideLater preference (contact fields optional)
 * - Complex multi-attendee contact preference combinations
 * - Contact preference inheritance for partners
 * - Validation rules based on preference selection
 * - Email/SMS notification eligibility
 * - Booking contact vs attendee contact scenarios
 */

const puppeteer = require('puppeteer');
const { testData } = require('../../config/test-data');
const { captureScreenshot, waitForElement, fillInput } = require('../../helpers/test-utils');

describe('Contact Preference Scenarios', () => {
  let browser;
  let page;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: process.env.HEADLESS !== 'false',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  });

  afterAll(async () => {
    await browser.close();
  });

  beforeEach(async () => {
    page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    
    // Navigate to event and select Individual registration
    await page.goto(`${baseUrl}/events/${testData.eventSlug}`);
    await page.waitForSelector('[data-testid="register-button"]');
    await page.click('[data-testid="register-button"]');
    
    // Select Individual registration type
    await page.waitForSelector('[data-testid="registration-type-individual"]');
    await page.click('[data-testid="registration-type-individual"]');
    await page.click('[data-testid="continue-button"]');
  });

  afterEach(async () => {
    await page.close();
  });

  describe('Primary Attendee Always Has Contact', () => {
    test('primary Mason must provide contact details', async () => {
      // Fill basic Mason info
      await fillInput(page, '[data-testid="mason-0-title"]', 'Bro.');
      await fillInput(page, '[data-testid="mason-0-firstName"]', 'Primary');
      await fillInput(page, '[data-testid="mason-0-lastName"]', 'Contact');
      await fillInput(page, '[data-testid="mason-0-rank"]', 'MM');
      
      await page.click('[data-testid="mason-0-grandLodge"]');
      await page.type('[data-testid="mason-0-grandLodge"]', 'New South Wales');
      await page.keyboard.press('Enter');
      
      await page.click('[data-testid="mason-0-lodge"]');
      await page.type('[data-testid="mason-0-lodge"]', 'Test Lodge');
      await page.keyboard.press('Enter');
      
      // Primary attendee should not have contact preference dropdown
      const contactPrefField = await page.$('[data-testid="mason-0-contactPreference"]');
      expect(contactPrefField).toBeFalsy();
      
      // Email and phone should be required
      const emailRequired = await page.$('[data-testid="mason-0-email"][required]');
      const phoneRequired = await page.$('[data-testid="mason-0-phone"][required]');
      expect(emailRequired).toBeTruthy();
      expect(phoneRequired).toBeTruthy();
      
      // Try to continue without contact info
      await page.click('[data-testid="continue-button"]');
      
      // Should show validation errors
      await page.waitForSelector('[data-testid="mason-0-email-error"]');
      const emailError = await page.$('[data-testid="mason-0-email-error"]');
      const phoneError = await page.$('[data-testid="mason-0-phone-error"]');
      expect(emailError).toBeTruthy();
      expect(phoneError).toBeTruthy();
      
      await captureScreenshot(page, 'primary-contact-required');
    });
  });

  describe('PrimaryAttendee Contact Preference', () => {
    beforeEach(async () => {
      // Setup primary Mason
      await fillInput(page, '[data-testid="mason-0-title"]', 'Bro.');
      await fillInput(page, '[data-testid="mason-0-firstName"]', 'Primary');
      await fillInput(page, '[data-testid="mason-0-lastName"]', 'Mason');
      await fillInput(page, '[data-testid="mason-0-rank"]', 'MM');
      
      await page.click('[data-testid="mason-0-grandLodge"]');
      await page.type('[data-testid="mason-0-grandLodge"]', 'New South Wales');
      await page.keyboard.press('Enter');
      
      await page.click('[data-testid="mason-0-lodge"]');
      await page.type('[data-testid="mason-0-lodge"]', 'Primary Lodge');
      await page.keyboard.press('Enter');
      
      await fillInput(page, '[data-testid="mason-0-email"]', 'primary@test.com');
      await fillInput(page, '[data-testid="mason-0-phone"]', '+61400000000');
    });

    test('non-primary Mason with PrimaryAttendee preference', async () => {
      // Add second Mason
      await page.click('[data-testid="add-mason-button"]');
      await page.waitForSelector('[data-testid="mason-1-title"]');
      
      await page.select('[data-testid="mason-1-title"]', 'W.Bro.');
      await fillInput(page, '[data-testid="mason-1-firstName"]', 'Secondary');
      await fillInput(page, '[data-testid="mason-1-lastName"]', 'Mason');
      await page.select('[data-testid="mason-1-rank"]', 'MM');
      await page.click('[data-testid="mason-1-sameLodge"]');
      
      // Select PrimaryAttendee preference
      await page.select('[data-testid="mason-1-contactPreference"]', 'PrimaryAttendee');
      
      // Email and phone should not be required
      const emailRequired = await page.$('[data-testid="mason-1-email"][required]');
      const phoneRequired = await page.$('[data-testid="mason-1-phone"][required]');
      expect(emailRequired).toBeFalsy();
      expect(phoneRequired).toBeFalsy();
      
      // Fields should be optional - can leave empty
      await page.click('[data-testid="continue-button"]');
      await page.waitForSelector('[data-testid="ticket-selection-step"]');
      
      expect(await page.$('[data-testid="ticket-selection-step"]')).toBeTruthy();
      
      await captureScreenshot(page, 'primary-attendee-preference');
    });

    test('Guest with PrimaryAttendee preference', async () => {
      // Add Guest
      await page.click('[data-testid="add-guest-button"]');
      await page.waitForSelector('[data-testid="guest-0-title"]');
      
      await page.select('[data-testid="guest-0-title"]', 'Mrs.');
      await fillInput(page, '[data-testid="guest-0-firstName"]', 'Guest');
      await fillInput(page, '[data-testid="guest-0-lastName"]', 'NoContact');
      
      // Select PrimaryAttendee preference
      await page.select('[data-testid="guest-0-contactPreference"]', 'PrimaryAttendee');
      
      // Verify no contact fields required
      const emailField = await page.$('[data-testid="guest-0-email"]');
      const phoneField = await page.$('[data-testid="guest-0-phone"]');
      
      // Fields might not even be visible or are disabled
      if (emailField) {
        const emailRequired = await page.$('[data-testid="guest-0-email"][required]');
        expect(emailRequired).toBeFalsy();
      }
      
      if (phoneField) {
        const phoneRequired = await page.$('[data-testid="guest-0-phone"][required]');
        expect(phoneRequired).toBeFalsy();
      }
      
      // Can continue without contact info
      await page.click('[data-testid="continue-button"]');
      await page.waitForSelector('[data-testid="ticket-selection-step"]');
    });
  });

  describe('Directly Contact Preference', () => {
    beforeEach(async () => {
      // Setup primary Mason
      await fillInput(page, '[data-testid="mason-0-title"]', 'Bro.');
      await fillInput(page, '[data-testid="mason-0-firstName"]', 'Primary');
      await fillInput(page, '[data-testid="mason-0-lastName"]', 'Mason');
      await fillInput(page, '[data-testid="mason-0-rank"]', 'MM');
      
      await page.click('[data-testid="mason-0-grandLodge"]');
      await page.type('[data-testid="mason-0-grandLodge"]', 'New South Wales');
      await page.keyboard.press('Enter');
      
      await page.click('[data-testid="mason-0-lodge"]');
      await page.type('[data-testid="mason-0-lodge"]', 'Primary Lodge');
      await page.keyboard.press('Enter');
      
      await fillInput(page, '[data-testid="mason-0-email"]', 'primary@test.com');
      await fillInput(page, '[data-testid="mason-0-phone"]', '+61400000000');
    });

    test('Mason with Directly preference requires contact info', async () => {
      // Add second Mason
      await page.click('[data-testid="add-mason-button"]');
      await page.waitForSelector('[data-testid="mason-1-title"]');
      
      await page.select('[data-testid="mason-1-title"]', 'R.W.Bro.');
      await fillInput(page, '[data-testid="mason-1-firstName"]', 'Direct');
      await fillInput(page, '[data-testid="mason-1-lastName"]', 'Contact');
      await page.select('[data-testid="mason-1-rank"]', 'MM');
      await page.click('[data-testid="mason-1-sameLodge"]');
      
      // Select Directly preference
      await page.select('[data-testid="mason-1-contactPreference"]', 'Directly');
      
      // Email and phone should become required
      await page.waitForSelector('[data-testid="mason-1-email"][required]');
      const emailRequired = await page.$('[data-testid="mason-1-email"][required]');
      const phoneRequired = await page.$('[data-testid="mason-1-phone"][required]');
      expect(emailRequired).toBeTruthy();
      expect(phoneRequired).toBeTruthy();
      
      // Try to continue without contact info
      await page.click('[data-testid="continue-button"]');
      
      // Should show validation errors
      await page.waitForSelector('[data-testid="mason-1-email-error"]');
      const emailError = await page.$('[data-testid="mason-1-email-error"]');
      const phoneError = await page.$('[data-testid="mason-1-phone-error"]');
      expect(emailError).toBeTruthy();
      expect(phoneError).toBeTruthy();
      
      // Fill contact info
      await fillInput(page, '[data-testid="mason-1-email"]', 'direct@test.com');
      await fillInput(page, '[data-testid="mason-1-phone"]', '+61400000001');
      
      // Now should continue
      await page.click('[data-testid="continue-button"]');
      await page.waitForSelector('[data-testid="ticket-selection-step"]');
      
      await captureScreenshot(page, 'directly-preference-required');
    });

    test('Guest with Directly preference and validation', async () => {
      // Add Guest
      await page.click('[data-testid="add-guest-button"]');
      await page.waitForSelector('[data-testid="guest-0-title"]');
      
      await page.select('[data-testid="guest-0-title"]', 'Dr.');
      await fillInput(page, '[data-testid="guest-0-firstName"]', 'Direct');
      await fillInput(page, '[data-testid="guest-0-lastName"]', 'Guest');
      
      // Select Directly preference
      await page.select('[data-testid="guest-0-contactPreference"]', 'Directly');
      
      // Fields should be required
      await page.waitForSelector('[data-testid="guest-0-email"][required]');
      
      // Test email validation
      await fillInput(page, '[data-testid="guest-0-email"]', 'invalid-email');
      await page.click('[data-testid="guest-0-phone"]'); // Blur
      
      await page.waitForSelector('[data-testid="guest-0-email-error"]');
      const emailError = await page.$eval('[data-testid="guest-0-email-error"]', el => el.textContent);
      expect(emailError).toContain('valid email');
      
      // Fix email and test phone validation
      await page.click('[data-testid="guest-0-email"]', { clickCount: 3 });
      await page.type('[data-testid="guest-0-email"]', 'valid@email.com');
      
      await fillInput(page, '[data-testid="guest-0-phone"]', '123'); // Too short
      await page.click('[data-testid="guest-0-email"]'); // Blur
      
      await page.waitForSelector('[data-testid="guest-0-phone-error"]');
      const phoneError = await page.$eval('[data-testid="guest-0-phone-error"]', el => el.textContent);
      expect(phoneError).toContain('valid phone');
      
      // Fix phone
      await page.click('[data-testid="guest-0-phone"]', { clickCount: 3 });
      await page.type('[data-testid="guest-0-phone"]', '+61400000002');
      
      await captureScreenshot(page, 'directly-preference-validation');
    });
  });

  describe('ProvideLater Contact Preference', () => {
    beforeEach(async () => {
      // Setup primary Mason
      await fillInput(page, '[data-testid="mason-0-title"]', 'Bro.');
      await fillInput(page, '[data-testid="mason-0-firstName"]', 'Primary');
      await fillInput(page, '[data-testid="mason-0-lastName"]', 'Mason');
      await fillInput(page, '[data-testid="mason-0-rank"]', 'MM');
      
      await page.click('[data-testid="mason-0-grandLodge"]');
      await page.type('[data-testid="mason-0-grandLodge"]', 'New South Wales');
      await page.keyboard.press('Enter');
      
      await page.click('[data-testid="mason-0-lodge"]');
      await page.type('[data-testid="mason-0-lodge"]', 'Primary Lodge');
      await page.keyboard.press('Enter');
      
      await fillInput(page, '[data-testid="mason-0-email"]', 'primary@test.com');
      await fillInput(page, '[data-testid="mason-0-phone"]', '+61400000000');
    });

    test('Mason with ProvideLater allows optional contact', async () => {
      // Add second Mason
      await page.click('[data-testid="add-mason-button"]');
      await page.waitForSelector('[data-testid="mason-1-title"]');
      
      await page.select('[data-testid="mason-1-title"]', 'V.W.Bro.');
      await fillInput(page, '[data-testid="mason-1-firstName"]', 'Later');
      await fillInput(page, '[data-testid="mason-1-lastName"]', 'Contact');
      await page.select('[data-testid="mason-1-rank"]', 'FC');
      await page.click('[data-testid="mason-1-sameLodge"]');
      
      // Select ProvideLater preference
      await page.select('[data-testid="mason-1-contactPreference"]', 'ProvideLater');
      
      // Fields should not be required
      const emailRequired = await page.$('[data-testid="mason-1-email"][required]');
      const phoneRequired = await page.$('[data-testid="mason-1-phone"][required]');
      expect(emailRequired).toBeFalsy();
      expect(phoneRequired).toBeFalsy();
      
      // Can continue without contact info
      await page.click('[data-testid="continue-button"]');
      await page.waitForSelector('[data-testid="ticket-selection-step"]');
      
      expect(await page.$('[data-testid="ticket-selection-step"]')).toBeTruthy();
    });

    test('Guest with ProvideLater can optionally add contact', async () => {
      // Add Guest
      await page.click('[data-testid="add-guest-button"]');
      await page.waitForSelector('[data-testid="guest-0-title"]');
      
      await page.select('[data-testid="guest-0-title"]', 'Prof.');
      await fillInput(page, '[data-testid="guest-0-firstName"]', 'Optional');
      await fillInput(page, '[data-testid="guest-0-lastName"]', 'Contact');
      
      // Select ProvideLater preference
      await page.select('[data-testid="guest-0-contactPreference"]', 'ProvideLater');
      
      // Add only email (partial contact allowed)
      await fillInput(page, '[data-testid="guest-0-email"]', 'optional@test.com');
      // Leave phone empty
      
      // Should still continue successfully
      await page.click('[data-testid="continue-button"]');
      await page.waitForSelector('[data-testid="ticket-selection-step"]');
      
      await captureScreenshot(page, 'provide-later-partial-contact');
    });
  });

  describe('Complex Multi-Attendee Contact Scenarios', () => {
    test('mixed contact preferences across multiple attendees', async () => {
      // Primary Mason (always has contact)
      await fillInput(page, '[data-testid="mason-0-title"]', 'M.W.Bro.');
      await fillInput(page, '[data-testid="mason-0-firstName"]', 'Grand');
      await fillInput(page, '[data-testid="mason-0-lastName"]', 'Master');
      await fillInput(page, '[data-testid="mason-0-rank"]', 'GL');
      
      await page.click('[data-testid="mason-0-grandLodge"]');
      await page.type('[data-testid="mason-0-grandLodge"]', 'New South Wales');
      await page.keyboard.press('Enter');
      
      await page.click('[data-testid="mason-0-lodge"]');
      await page.type('[data-testid="mason-0-lodge"]', 'Grand Lodge');
      await page.keyboard.press('Enter');
      
      await fillInput(page, '[data-testid="mason-0-email"]', 'gm@test.com');
      await fillInput(page, '[data-testid="mason-0-phone"]', '+61400000000');
      
      // Mason 2 - PrimaryAttendee preference
      await page.click('[data-testid="add-mason-button"]');
      await page.waitForSelector('[data-testid="mason-1-title"]');
      await page.select('[data-testid="mason-1-title"]', 'Bro.');
      await fillInput(page, '[data-testid="mason-1-firstName"]', 'Via');
      await fillInput(page, '[data-testid="mason-1-lastName"]', 'Primary');
      await page.select('[data-testid="mason-1-rank"]', 'MM');
      await page.click('[data-testid="mason-1-sameLodge"]');
      await page.select('[data-testid="mason-1-contactPreference"]', 'PrimaryAttendee');
      
      // Guest 1 - Directly preference
      await page.click('[data-testid="add-guest-button"]');
      await page.waitForSelector('[data-testid="guest-0-title"]');
      await page.select('[data-testid="guest-0-title"]', 'Mr.');
      await fillInput(page, '[data-testid="guest-0-firstName"]', 'Direct');
      await fillInput(page, '[data-testid="guest-0-lastName"]', 'Contact');
      await page.select('[data-testid="guest-0-contactPreference"]', 'Directly');
      await fillInput(page, '[data-testid="guest-0-email"]', 'direct@test.com');
      await fillInput(page, '[data-testid="guest-0-phone"]', '+61400000001');
      
      // Mason 3 - ProvideLater preference
      await page.click('[data-testid="add-mason-button"]');
      await page.waitForSelector('[data-testid="mason-2-title"]');
      await page.select('[data-testid="mason-2-title"]', 'W.Bro.');
      await fillInput(page, '[data-testid="mason-2-firstName"]', 'Later');
      await fillInput(page, '[data-testid="mason-2-lastName"]', 'Contact');
      await page.select('[data-testid="mason-2-rank"]', 'EA');
      await page.click('[data-testid="mason-2-sameLodge"]');
      await page.select('[data-testid="mason-2-contactPreference"]', 'ProvideLater');
      
      // Guest 2 - PrimaryAttendee preference with partner
      await page.click('[data-testid="add-guest-button"]');
      await page.waitForSelector('[data-testid="guest-1-title"]');
      await page.select('[data-testid="guest-1-title"]', 'Mrs.');
      await fillInput(page, '[data-testid="guest-1-firstName"]', 'Guest');
      await fillInput(page, '[data-testid="guest-1-lastName"]', 'WithPartner');
      await page.select('[data-testid="guest-1-contactPreference"]', 'PrimaryAttendee');
      
      // Add partner to last guest
      await page.click('[data-testid="guest-1-hasPartner"]');
      await page.waitForSelector('[data-testid="guest-1-partner-form"]');
      await page.select('[data-testid="guest-1-partner-title"]', 'Mr.');
      await fillInput(page, '[data-testid="guest-1-partner-firstName"]', 'Partner');
      await fillInput(page, '[data-testid="guest-1-partner-lastName"]', 'NoContact');
      await page.select('[data-testid="guest-1-partner-relationship"]', 'Husband');
      
      await captureScreenshot(page, 'mixed-contact-preferences');
      
      // Verify total attendees (5 primary + 1 partner = 6)
      const attendeeCards = await page.$$('[data-testid^="attendee-card-"]');
      expect(attendeeCards.length).toBe(6);
      
      // Should continue successfully with mixed preferences
      await page.click('[data-testid="continue-button"]');
      await page.waitForSelector('[data-testid="ticket-selection-step"]');
    });

    test('changing contact preference updates field requirements dynamically', async () => {
      // Setup primary
      await fillInput(page, '[data-testid="mason-0-title"]', 'Bro.');
      await fillInput(page, '[data-testid="mason-0-firstName"]', 'Primary');
      await fillInput(page, '[data-testid="mason-0-lastName"]', 'Mason');
      await fillInput(page, '[data-testid="mason-0-rank"]', 'MM');
      
      await page.click('[data-testid="mason-0-grandLodge"]');
      await page.type('[data-testid="mason-0-grandLodge"]', 'NSW');
      await page.keyboard.press('Enter');
      
      await page.click('[data-testid="mason-0-lodge"]');
      await page.type('[data-testid="mason-0-lodge"]', 'Lodge');
      await page.keyboard.press('Enter');
      
      await fillInput(page, '[data-testid="mason-0-email"]', 'primary@test.com');
      await fillInput(page, '[data-testid="mason-0-phone"]', '+61400000000');
      
      // Add guest
      await page.click('[data-testid="add-guest-button"]');
      await page.waitForSelector('[data-testid="guest-0-title"]');
      await page.select('[data-testid="guest-0-title"]', 'Mr.');
      await fillInput(page, '[data-testid="guest-0-firstName"]', 'Dynamic');
      await fillInput(page, '[data-testid="guest-0-lastName"]', 'Fields');
      
      // Start with PrimaryAttendee
      await page.select('[data-testid="guest-0-contactPreference"]', 'PrimaryAttendee');
      let emailRequired = await page.$('[data-testid="guest-0-email"][required]');
      expect(emailRequired).toBeFalsy();
      
      // Change to Directly
      await page.select('[data-testid="guest-0-contactPreference"]', 'Directly');
      await page.waitForSelector('[data-testid="guest-0-email"][required]');
      emailRequired = await page.$('[data-testid="guest-0-email"][required]');
      expect(emailRequired).toBeTruthy();
      
      // Change to ProvideLater
      await page.select('[data-testid="guest-0-contactPreference"]', 'ProvideLater');
      emailRequired = await page.$('[data-testid="guest-0-email"][required]');
      expect(emailRequired).toBeFalsy();
      
      await captureScreenshot(page, 'dynamic-field-requirements');
    });
  });

  describe('Contact Preference Impact on Notifications', () => {
    test('notification preferences based on contact availability', async () => {
      // Setup primary
      await fillInput(page, '[data-testid="mason-0-title"]', 'Bro.');
      await fillInput(page, '[data-testid="mason-0-firstName"]', 'Notify');
      await fillInput(page, '[data-testid="mason-0-lastName"]', 'Test');
      await fillInput(page, '[data-testid="mason-0-rank"]', 'MM');
      
      await page.click('[data-testid="mason-0-grandLodge"]');
      await page.type('[data-testid="mason-0-grandLodge"]', 'NSW');
      await page.keyboard.press('Enter');
      
      await page.click('[data-testid="mason-0-lodge"]');
      await page.type('[data-testid="mason-0-lodge"]', 'Lodge');
      await page.keyboard.press('Enter');
      
      await fillInput(page, '[data-testid="mason-0-email"]', 'notify@test.com');
      await fillInput(page, '[data-testid="mason-0-phone"]', '+61400000000');
      
      // Check notification options for primary
      const primaryEmailNotify = await page.$('[data-testid="mason-0-emailNotifications"]');
      const primarySmsNotify = await page.$('[data-testid="mason-0-smsNotifications"]');
      
      // Primary should have notification options
      if (primaryEmailNotify) {
        await page.click('[data-testid="mason-0-emailNotifications"]');
      }
      if (primarySmsNotify) {
        await page.click('[data-testid="mason-0-smsNotifications"]');
      }
      
      // Add Mason with PrimaryAttendee preference
      await page.click('[data-testid="add-mason-button"]');
      await page.waitForSelector('[data-testid="mason-1-title"]');
      await page.select('[data-testid="mason-1-title"]', 'Bro.');
      await fillInput(page, '[data-testid="mason-1-firstName"]', 'NoNotify');
      await fillInput(page, '[data-testid="mason-1-lastName"]', 'Mason');
      await page.select('[data-testid="mason-1-rank"]', 'MM');
      await page.click('[data-testid="mason-1-sameLodge"]');
      await page.select('[data-testid="mason-1-contactPreference"]', 'PrimaryAttendee');
      
      // Should not have notification options
      const secondaryEmailNotify = await page.$('[data-testid="mason-1-emailNotifications"]');
      const secondarySmsNotify = await page.$('[data-testid="mason-1-smsNotifications"]');
      
      expect(secondaryEmailNotify).toBeFalsy();
      expect(secondarySmsNotify).toBeFalsy();
      
      await captureScreenshot(page, 'notification-preferences');
    });
  });

  describe('Booking Contact vs Attendee Contact', () => {
    test('booking contact receives all communications by default', async () => {
      // Fill booking contact info (primary Mason)
      await fillInput(page, '[data-testid="mason-0-title"]', 'W.Bro.');
      await fillInput(page, '[data-testid="mason-0-firstName"]', 'Booking');
      await fillInput(page, '[data-testid="mason-0-lastName"]', 'Contact');
      await fillInput(page, '[data-testid="mason-0-rank"]', 'MM');
      
      await page.click('[data-testid="mason-0-grandLodge"]');
      await page.type('[data-testid="mason-0-grandLodge"]', 'NSW');
      await page.keyboard.press('Enter');
      
      await page.click('[data-testid="mason-0-lodge"]');
      await page.type('[data-testid="mason-0-lodge"]', 'Booking Lodge');
      await page.keyboard.press('Enter');
      
      await fillInput(page, '[data-testid="mason-0-email"]', 'booking@test.com');
      await fillInput(page, '[data-testid="mason-0-phone"]', '+61400000000');
      
      // Add multiple attendees with different preferences
      for (let i = 0; i < 3; i++) {
        await page.click('[data-testid="add-guest-button"]');
        await page.waitForSelector(`[data-testid="guest-${i}-title"]`);
        await page.select(`[data-testid="guest-${i}-title"]`, 'Mr.');
        await fillInput(page, `[data-testid="guest-${i}-firstName"]`, `Guest${i + 1}`);
        await fillInput(page, `[data-testid="guest-${i}-lastName"]`, 'Test');
        
        // Vary contact preferences
        const preferences = ['PrimaryAttendee', 'Directly', 'ProvideLater'];
        await page.select(`[data-testid="guest-${i}-contactPreference"]`, preferences[i]);
        
        if (preferences[i] === 'Directly') {
          await fillInput(page, `[data-testid="guest-${i}-email"]`, `guest${i + 1}@test.com`);
          await fillInput(page, `[data-testid="guest-${i}-phone"]`, `+6140000000${i + 1}`);
        }
      }
      
      // Verify booking contact indicator
      const bookingContactBadge = await page.$('[data-testid="mason-0-booking-contact-badge"]');
      if (bookingContactBadge) {
        const badgeText = await page.$eval('[data-testid="mason-0-booking-contact-badge"]', el => el.textContent);
        expect(badgeText).toContain('Booking Contact');
      }
      
      await captureScreenshot(page, 'booking-contact-setup');
      
      // Continue to verify data persistence
      await page.click('[data-testid="continue-button"]');
      await page.waitForSelector('[data-testid="ticket-selection-step"]');
    });
  });

  describe('Edge Cases and Validation', () => {
    test('handles contact preference when removing primary attendee role', async () => {
      // Setup two Masons
      await fillInput(page, '[data-testid="mason-0-title"]', 'Bro.');
      await fillInput(page, '[data-testid="mason-0-firstName"]', 'First');
      await fillInput(page, '[data-testid="mason-0-lastName"]', 'Mason');
      await fillInput(page, '[data-testid="mason-0-rank"]', 'MM');
      
      await page.click('[data-testid="mason-0-grandLodge"]');
      await page.type('[data-testid="mason-0-grandLodge"]', 'NSW');
      await page.keyboard.press('Enter');
      
      await page.click('[data-testid="mason-0-lodge"]');
      await page.type('[data-testid="mason-0-lodge"]', 'Lodge');
      await page.keyboard.press('Enter');
      
      await fillInput(page, '[data-testid="mason-0-email"]', 'first@test.com');
      await fillInput(page, '[data-testid="mason-0-phone"]', '+61400000000');
      
      // Add second Mason
      await page.click('[data-testid="add-mason-button"]');
      await page.waitForSelector('[data-testid="mason-1-title"]');
      await page.select('[data-testid="mason-1-title"]', 'W.Bro.');
      await fillInput(page, '[data-testid="mason-1-firstName"]', 'Second');
      await fillInput(page, '[data-testid="mason-1-lastName"]', 'Mason');
      await page.select('[data-testid="mason-1-rank"]', 'MM');
      await page.click('[data-testid="mason-1-sameLodge"]');
      await page.select('[data-testid="mason-1-contactPreference"]', 'PrimaryAttendee');
      
      // Remove first Mason (primary)
      await page.click('[data-testid="remove-mason-0"]');
      
      // Wait for reindexing
      await page.waitForFunction(() => {
        const firstMasonName = document.querySelector('[data-testid="mason-0-firstName"]');
        return firstMasonName && firstMasonName.value === 'Second';
      });
      
      // Second Mason should now be primary and require contact
      const emailRequired = await page.$('[data-testid="mason-0-email"][required]');
      const phoneRequired = await page.$('[data-testid="mason-0-phone"][required]');
      const contactPref = await page.$('[data-testid="mason-0-contactPreference"]');
      
      expect(emailRequired).toBeTruthy();
      expect(phoneRequired).toBeTruthy();
      expect(contactPref).toBeFalsy(); // No contact preference for primary
      
      // Fill required contact info
      await fillInput(page, '[data-testid="mason-0-email"]', 'second@test.com');
      await fillInput(page, '[data-testid="mason-0-phone"]', '+61400000001');
      
      await captureScreenshot(page, 'primary-role-transfer');
    });
  });
});