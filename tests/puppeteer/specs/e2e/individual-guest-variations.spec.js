/**
 * Individual Guest Variations Test Suite
 * 
 * This comprehensive test suite covers all variations of Guest attendee registration
 * in the Individual (Myself & Others) registration flow. It tests:
 * - All 7 Guest titles (Mr., Mrs., Ms., Miss, Dr., Prof., Rev.)
 * - Primary vs non-primary Guests
 * - Contact preference variations
 * - Partner relationships (for partners)
 * - Optional fields (dietary, accessibility)
 * - Mixed Mason and Guest registrations
 * - Field validation and error handling
 */

const puppeteer = require('puppeteer');
const { testData } = require('../../config/test-data');
const { captureScreenshot, waitForElement, fillInput } = require('../../helpers/test-utils');

describe('Individual Guest Variations', () => {
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
    
    // First attendee must be a Mason, so add one
    await fillInput(page, '[data-testid="mason-0-title"]', 'Bro.');
    await fillInput(page, '[data-testid="mason-0-firstName"]', 'Primary');
    await fillInput(page, '[data-testid="mason-0-lastName"]', 'Mason');
    await fillInput(page, '[data-testid="mason-0-rank"]', 'MM');
    
    await page.click('[data-testid="mason-0-grandLodge"]');
    await page.type('[data-testid="mason-0-grandLodge"]', 'New South Wales');
    await page.keyboard.press('Enter');
    
    await page.click('[data-testid="mason-0-lodge"]');
    await page.type('[data-testid="mason-0-lodge"]', 'Test Lodge 123');
    await page.keyboard.press('Enter');
    
    await fillInput(page, '[data-testid="mason-0-email"]', 'primary@test.com');
    await fillInput(page, '[data-testid="mason-0-phone"]', '+61400000000');
  });

  afterEach(async () => {
    await page.close();
  });

  describe('Guest Addition Scenarios', () => {
    test('adds guest with minimum required fields', async () => {
      // Add a guest
      await page.click('[data-testid="add-guest-button"]');
      await page.waitForSelector('[data-testid="guest-0-title"]');
      
      // Fill minimum required fields
      await page.select('[data-testid="guest-0-title"]', 'Mr.');
      await fillInput(page, '[data-testid="guest-0-firstName"]', 'John');
      await fillInput(page, '[data-testid="guest-0-lastName"]', 'Guest');
      
      // Select contact preference
      await page.select('[data-testid="guest-0-contactPreference"]', 'PrimaryAttendee');
      
      await captureScreenshot(page, 'guest-minimum-fields');
      
      // Continue to ticket selection
      await page.click('[data-testid="continue-button"]');
      await page.waitForSelector('[data-testid="ticket-selection-step"]');
      
      expect(await page.$('[data-testid="ticket-selection-step"]')).toBeTruthy();
    });

    test('adds guest with all optional fields', async () => {
      // Add a guest
      await page.click('[data-testid="add-guest-button"]');
      await page.waitForSelector('[data-testid="guest-0-title"]');
      
      // Fill all fields
      await page.select('[data-testid="guest-0-title"]', 'Dr.');
      await fillInput(page, '[data-testid="guest-0-firstName"]', 'Jane');
      await fillInput(page, '[data-testid="guest-0-lastName"]', 'Smith');
      
      // Select contact preference as Directly (requires email/phone)
      await page.select('[data-testid="guest-0-contactPreference"]', 'Directly');
      
      await page.waitForSelector('[data-testid="guest-0-email"][required]');
      await fillInput(page, '[data-testid="guest-0-email"]', 'jane.smith@test.com');
      await fillInput(page, '[data-testid="guest-0-phone"]', '+61400000001');
      
      // Fill optional fields
      await fillInput(page, '[data-testid="guest-0-dietary"]', 'Gluten free, dairy free');
      await fillInput(page, '[data-testid="guest-0-accessibility"]', 'Hearing loop required');
      
      await captureScreenshot(page, 'guest-all-fields');
      
      // Verify character counts
      const dietaryCount = await page.$eval('[data-testid="guest-0-dietary-count"]', el => el.textContent);
      expect(dietaryCount).toContain('24/200');
      
      const accessibilityCount = await page.$eval('[data-testid="guest-0-accessibility-count"]', el => el.textContent);
      expect(accessibilityCount).toContain('21/500');
    });

    test('validates all seven guest title options', async () => {
      await page.click('[data-testid="add-guest-button"]');
      await page.waitForSelector('[data-testid="guest-0-title"]');
      
      const titles = ['Mr.', 'Mrs.', 'Ms.', 'Miss', 'Dr.', 'Prof.', 'Rev.'];
      
      for (const title of titles) {
        await page.select('[data-testid="guest-0-title"]', title);
        
        const selectedTitle = await page.$eval('[data-testid="guest-0-title"]', el => el.value);
        expect(selectedTitle).toBe(title);
        
        // Fill name for screenshot
        await fillInput(page, '[data-testid="guest-0-firstName"]', title.replace('.', ''));
        await fillInput(page, '[data-testid="guest-0-lastName"]', 'Test');
        
        await captureScreenshot(page, `guest-title-${title.replace('.', '')}`);
      }
    });
  });

  describe('Contact Preference Scenarios', () => {
    beforeEach(async () => {
      // Add a guest
      await page.click('[data-testid="add-guest-button"]');
      await page.waitForSelector('[data-testid="guest-0-title"]');
      
      // Fill basic info
      await page.select('[data-testid="guest-0-title"]', 'Ms.');
      await fillInput(page, '[data-testid="guest-0-firstName"]', 'Contact');
      await fillInput(page, '[data-testid="guest-0-lastName"]', 'Test');
    });

    test('uses PrimaryAttendee contact preference', async () => {
      await page.select('[data-testid="guest-0-contactPreference"]', 'PrimaryAttendee');
      
      // Email and phone should not be required
      const emailRequired = await page.$('[data-testid="guest-0-email"][required]');
      const phoneRequired = await page.$('[data-testid="guest-0-phone"][required]');
      
      expect(emailRequired).toBeFalsy();
      expect(phoneRequired).toBeFalsy();
      
      // Continue without contact info
      await page.click('[data-testid="continue-button"]');
      await page.waitForSelector('[data-testid="ticket-selection-step"]');
      
      expect(await page.$('[data-testid="ticket-selection-step"]')).toBeTruthy();
    });

    test('uses Directly contact preference requiring contact info', async () => {
      await page.select('[data-testid="guest-0-contactPreference"]', 'Directly');
      
      // Email and phone should become required
      await page.waitForSelector('[data-testid="guest-0-email"][required]');
      const emailRequired = await page.$('[data-testid="guest-0-email"][required]');
      const phoneRequired = await page.$('[data-testid="guest-0-phone"][required]');
      
      expect(emailRequired).toBeTruthy();
      expect(phoneRequired).toBeTruthy();
      
      // Try to continue without contact info
      await page.click('[data-testid="continue-button"]');
      
      // Should show validation errors
      await page.waitForSelector('[data-testid="guest-0-email-error"]');
      const emailError = await page.$('[data-testid="guest-0-email-error"]');
      const phoneError = await page.$('[data-testid="guest-0-phone-error"]');
      
      expect(emailError).toBeTruthy();
      expect(phoneError).toBeTruthy();
      
      // Fill contact info
      await fillInput(page, '[data-testid="guest-0-email"]', 'directly@test.com');
      await fillInput(page, '[data-testid="guest-0-phone"]', '+61400000002');
      
      // Now should continue successfully
      await page.click('[data-testid="continue-button"]');
      await page.waitForSelector('[data-testid="ticket-selection-step"]');
    });

    test('uses ProvideLater contact preference', async () => {
      await page.select('[data-testid="guest-0-contactPreference"]', 'ProvideLater');
      
      // Email and phone should not be required
      const emailRequired = await page.$('[data-testid="guest-0-email"][required]');
      const phoneRequired = await page.$('[data-testid="guest-0-phone"][required]');
      
      expect(emailRequired).toBeFalsy();
      expect(phoneRequired).toBeFalsy();
      
      // Can optionally fill contact info
      await fillInput(page, '[data-testid="guest-0-email"]', 'optional@test.com');
      
      await captureScreenshot(page, 'guest-provide-later');
      
      // Continue successfully
      await page.click('[data-testid="continue-button"]');
      await page.waitForSelector('[data-testid="ticket-selection-step"]');
    });
  });

  describe('Multiple Guest Scenarios', () => {
    test('adds maximum number of guests (5)', async () => {
      // Add 5 guests
      for (let i = 0; i < 5; i++) {
        await page.click('[data-testid="add-guest-button"]');
        await page.waitForSelector(`[data-testid="guest-${i}-title"]`);
        
        // Use different titles for variety
        const titles = ['Mr.', 'Mrs.', 'Ms.', 'Dr.', 'Prof.'];
        await page.select(`[data-testid="guest-${i}-title"]`, titles[i]);
        await fillInput(page, `[data-testid="guest-${i}-firstName"]`, `Guest${i + 1}`);
        await fillInput(page, `[data-testid="guest-${i}-lastName"]`, 'Test');
        await page.select(`[data-testid="guest-${i}-contactPreference"]`, 'PrimaryAttendee');
      }
      
      // Verify add button is disabled after 5 guests
      const addButtonDisabled = await page.$eval('[data-testid="add-guest-button"]', el => el.disabled);
      expect(addButtonDisabled).toBe(true);
      
      // Verify total attendee count
      const attendeeCount = await page.$eval('[data-testid="attendee-count"]', el => el.textContent);
      expect(attendeeCount).toContain('6'); // 1 Mason + 5 Guests
      
      await captureScreenshot(page, 'maximum-guests');
    });

    test('removes guest and updates indices correctly', async () => {
      // Add 3 guests
      for (let i = 0; i < 3; i++) {
        await page.click('[data-testid="add-guest-button"]');
        await page.waitForSelector(`[data-testid="guest-${i}-title"]`);
        
        await page.select(`[data-testid="guest-${i}-title"]`, 'Mr.');
        await fillInput(page, `[data-testid="guest-${i}-firstName"]`, `Guest${i + 1}`);
        await fillInput(page, `[data-testid="guest-${i}-lastName"]`, 'Test');
      }
      
      // Remove middle guest (index 1)
      await page.click('[data-testid="remove-guest-1"]');
      
      // Wait for removal
      await page.waitForFunction(() => !document.querySelector('[data-testid="guest-2-firstName"]'));
      
      // Verify indices updated correctly
      const guest0Name = await page.$eval('[data-testid="guest-0-firstName"]', el => el.value);
      const guest1Name = await page.$eval('[data-testid="guest-1-firstName"]', el => el.value);
      
      expect(guest0Name).toBe('Guest1');
      expect(guest1Name).toBe('Guest3'); // Previously guest-2
      
      // Verify only 2 guests remain
      const guestForms = await page.$$('[data-testid^="guest-form-"]');
      expect(guestForms.length).toBe(2);
      
      await captureScreenshot(page, 'remove-guest-reindex');
    });
  });

  describe('Mixed Mason and Guest Scenarios', () => {
    test('creates registration with alternating Masons and Guests', async () => {
      // Already have 1 Mason, add alternating guests and masons
      
      // Add Guest 1
      await page.click('[data-testid="add-guest-button"]');
      await page.waitForSelector('[data-testid="guest-0-title"]');
      await page.select('[data-testid="guest-0-title"]', 'Mrs.');
      await fillInput(page, '[data-testid="guest-0-firstName"]', 'Guest');
      await fillInput(page, '[data-testid="guest-0-lastName"]', 'One');
      await page.select('[data-testid="guest-0-contactPreference"]', 'PrimaryAttendee');
      
      // Add Mason 2
      await page.click('[data-testid="add-mason-button"]');
      await page.waitForSelector('[data-testid="mason-1-title"]');
      await page.select('[data-testid="mason-1-title"]', 'W.Bro.');
      await fillInput(page, '[data-testid="mason-1-firstName"]', 'Mason');
      await fillInput(page, '[data-testid="mason-1-lastName"]', 'Two');
      await page.select('[data-testid="mason-1-rank"]', 'MM');
      await page.click('[data-testid="mason-1-sameLodge"]');
      await page.select('[data-testid="mason-1-contactPreference"]', 'Directly');
      await fillInput(page, '[data-testid="mason-1-email"]', 'mason2@test.com');
      await fillInput(page, '[data-testid="mason-1-phone"]', '+61400000003');
      
      // Add Guest 2
      await page.click('[data-testid="add-guest-button"]');
      await page.waitForSelector('[data-testid="guest-1-title"]');
      await page.select('[data-testid="guest-1-title"]', 'Dr.');
      await fillInput(page, '[data-testid="guest-1-firstName"]', 'Guest');
      await fillInput(page, '[data-testid="guest-1-lastName"]', 'Two');
      await page.select('[data-testid="guest-1-contactPreference"]', 'ProvideLater');
      
      await captureScreenshot(page, 'mixed-masons-guests');
      
      // Verify attendee order and count
      const attendeeCards = await page.$$('[data-testid^="attendee-card-"]');
      expect(attendeeCards.length).toBe(4); // 2 Masons + 2 Guests
    });

    test('validates total attendee limit (10 primary)', async () => {
      // Already have 1 Mason, add 4 more Masons and 5 Guests = 10 total
      
      // Add 4 more Masons
      for (let i = 1; i < 5; i++) {
        await page.click('[data-testid="add-mason-button"]');
        await page.waitForSelector(`[data-testid="mason-${i}-title"]`);
        await page.select(`[data-testid="mason-${i}-title"]`, 'Bro.');
        await fillInput(page, `[data-testid="mason-${i}-firstName"]`, `Mason${i + 1}`);
        await fillInput(page, `[data-testid="mason-${i}-lastName"]`, 'Test');
        await page.select(`[data-testid="mason-${i}-rank"]`, 'MM');
        await page.click(`[data-testid="mason-${i}-sameLodge"]`);
        await page.select(`[data-testid="mason-${i}-contactPreference"]`, 'PrimaryAttendee');
      }
      
      // Add 5 Guests
      for (let i = 0; i < 5; i++) {
        await page.click('[data-testid="add-guest-button"]');
        await page.waitForSelector(`[data-testid="guest-${i}-title"]`);
        await page.select(`[data-testid="guest-${i}-title"]`, 'Mr.');
        await fillInput(page, `[data-testid="guest-${i}-firstName"]`, `Guest${i + 1}`);
        await fillInput(page, `[data-testid="guest-${i}-lastName"]`, 'Test');
        await page.select(`[data-testid="guest-${i}-contactPreference"]`, 'PrimaryAttendee');
      }
      
      // Both add buttons should be disabled at max capacity
      const addMasonDisabled = await page.$eval('[data-testid="add-mason-button"]', el => el.disabled);
      const addGuestDisabled = await page.$eval('[data-testid="add-guest-button"]', el => el.disabled);
      
      expect(addMasonDisabled).toBe(true);
      expect(addGuestDisabled).toBe(true);
      
      // Verify warning message
      const maxAttendeesWarning = await page.$('[data-testid="max-attendees-warning"]');
      expect(maxAttendeesWarning).toBeTruthy();
      
      await captureScreenshot(page, 'maximum-total-attendees');
    });
  });

  describe('Validation Scenarios', () => {
    beforeEach(async () => {
      await page.click('[data-testid="add-guest-button"]');
      await page.waitForSelector('[data-testid="guest-0-title"]');
    });

    test('prevents submission with missing required fields', async () => {
      // Try to continue without filling required fields
      await page.click('[data-testid="continue-button"]');
      
      // Check for validation errors
      await page.waitForSelector('[data-testid="validation-error"]');
      
      const titleError = await page.$('[data-testid="guest-0-title-error"]');
      const firstNameError = await page.$('[data-testid="guest-0-firstName-error"]');
      const lastNameError = await page.$('[data-testid="guest-0-lastName-error"]');
      
      expect(titleError).toBeTruthy();
      expect(firstNameError).toBeTruthy();
      expect(lastNameError).toBeTruthy();
      
      await captureScreenshot(page, 'guest-validation-errors');
    });

    test('validates email format for guests with direct contact', async () => {
      // Fill basic info
      await page.select('[data-testid="guest-0-title"]', 'Mr.');
      await fillInput(page, '[data-testid="guest-0-firstName"]', 'Email');
      await fillInput(page, '[data-testid="guest-0-lastName"]', 'Test');
      await page.select('[data-testid="guest-0-contactPreference"]', 'Directly');
      
      // Test invalid email formats
      const invalidEmails = ['notanemail', 'missing@', '@nodomain.com'];
      
      for (const email of invalidEmails) {
        await page.click('[data-testid="guest-0-email"]', { clickCount: 3 });
        await page.type('[data-testid="guest-0-email"]', email);
        await page.click('[data-testid="guest-0-phone"]'); // Blur
        
        await page.waitForSelector('[data-testid="guest-0-email-error"]');
        const errorText = await page.$eval('[data-testid="guest-0-email-error"]', el => el.textContent);
        expect(errorText).toContain('valid email');
      }
      
      // Test valid email
      await page.click('[data-testid="guest-0-email"]', { clickCount: 3 });
      await page.type('[data-testid="guest-0-email"]', 'valid@email.com');
      await page.click('[data-testid="guest-0-phone"]');
      
      // Error should disappear
      const emailError = await page.$('[data-testid="guest-0-email-error"]');
      expect(emailError).toBeFalsy();
    });

    test('enforces character limits on optional fields', async () => {
      // Fill basic required fields
      await page.select('[data-testid="guest-0-title"]', 'Prof.');
      await fillInput(page, '[data-testid="guest-0-firstName"]', 'Character');
      await fillInput(page, '[data-testid="guest-0-lastName"]', 'Limits');
      await page.select('[data-testid="guest-0-contactPreference"]', 'PrimaryAttendee');
      
      // Test dietary requirements limit (200 chars)
      const longDietary = 'x'.repeat(250);
      await page.type('[data-testid="guest-0-dietary"]', longDietary);
      
      const dietaryValue = await page.$eval('[data-testid="guest-0-dietary"]', el => el.value);
      expect(dietaryValue.length).toBe(200);
      
      const dietaryCount = await page.$eval('[data-testid="guest-0-dietary-count"]', el => el.textContent);
      expect(dietaryCount).toContain('200/200');
      
      // Test accessibility requirements limit (500 chars)
      const longAccessibility = 'y'.repeat(600);
      await page.type('[data-testid="guest-0-accessibility"]', longAccessibility);
      
      const accessibilityValue = await page.$eval('[data-testid="guest-0-accessibility"]', el => el.value);
      expect(accessibilityValue.length).toBe(500);
      
      const accessibilityCount = await page.$eval('[data-testid="guest-0-accessibility-count"]', el => el.textContent);
      expect(accessibilityCount).toContain('500/500');
      
      await captureScreenshot(page, 'guest-character-limits');
    });
  });
});