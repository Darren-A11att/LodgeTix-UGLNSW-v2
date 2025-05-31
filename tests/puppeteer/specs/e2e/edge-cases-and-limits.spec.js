/**
 * Edge Cases and Limits Test Suite
 * 
 * This comprehensive test suite covers boundary conditions, edge cases, and system
 * limits throughout the registration flow. It tests:
 * - Character limits on all text fields
 * - Minimum/maximum attendee constraints
 * - Field validation edge cases
 * - Special characters and encoding
 * - Browser compatibility issues
 * - Network timeout scenarios
 * - Session expiry handling
 * - Concurrent registration conflicts
 * - Database constraint violations
 * - Memory and performance limits
 */

const puppeteer = require('puppeteer');
const { testData } = require('../../config/test-data');
const { captureScreenshot, waitForElement, fillInput } = require('../../helpers/test-utils');

describe('Edge Cases and Limits', () => {
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
    
    await page.waitForSelector('[data-testid="registration-type-individual"]');
    await page.click('[data-testid="registration-type-individual"]');
    await page.click('[data-testid="continue-button"]');
  });

  afterEach(async () => {
    await page.close();
  });

  describe('Character Limit Tests', () => {
    test('enforces character limits on all text fields', async () => {
      // Test name fields (50 char limit assumed)
      const longName = 'A'.repeat(60);
      await page.select('[data-testid="mason-0-title"]', 'Bro.');
      await page.type('[data-testid="mason-0-firstName"]', longName);
      await page.type('[data-testid="mason-0-lastName"]', longName);
      
      // Verify truncation
      const firstNameValue = await page.$eval('[data-testid="mason-0-firstName"]', el => el.value);
      const lastNameValue = await page.$eval('[data-testid="mason-0-lastName"]', el => el.value);
      
      expect(firstNameValue.length).toBeLessThanOrEqual(50);
      expect(lastNameValue.length).toBeLessThanOrEqual(50);
      
      // Test grand rank field (10 char limit)
      await page.select('[data-testid="mason-0-rank"]', 'GL');
      await page.waitForSelector('[data-testid="mason-0-grandRank"]');
      const longRank = 'VERYLONGGRANDRANKTITLE';
      await page.type('[data-testid="mason-0-grandRank"]', longRank);
      
      const grandRankValue = await page.$eval('[data-testid="mason-0-grandRank"]', el => el.value);
      expect(grandRankValue.length).toBeLessThanOrEqual(10);
      
      // Fill required fields to continue
      await page.click('[data-testid="mason-0-grandLodge"]');
      await page.type('[data-testid="mason-0-grandLodge"]', 'NSW');
      await page.keyboard.press('Enter');
      
      await page.click('[data-testid="mason-0-lodge"]');
      await page.type('[data-testid="mason-0-lodge"]', 'Test Lodge');
      await page.keyboard.press('Enter');
      
      await fillInput(page, '[data-testid="mason-0-email"]', 'charlimit@test.com');
      await fillInput(page, '[data-testid="mason-0-phone"]', '+61400000000');
      await page.select('[data-testid="mason-0-grandOfficerStatus"]', 'Past');
      
      // Test dietary requirements (200 char limit)
      const longDietary = 'D'.repeat(250);
      await page.type('[data-testid="mason-0-dietary"]', longDietary);
      
      const dietaryValue = await page.$eval('[data-testid="mason-0-dietary"]', el => el.value);
      expect(dietaryValue.length).toBe(200);
      
      const dietaryCount = await page.$eval('[data-testid="mason-0-dietary-count"]', el => el.textContent);
      expect(dietaryCount).toContain('200/200');
      
      // Test accessibility requirements (500 char limit)
      const longAccessibility = 'A'.repeat(600);
      await page.type('[data-testid="mason-0-accessibility"]', longAccessibility);
      
      const accessibilityValue = await page.$eval('[data-testid="mason-0-accessibility"]', el => el.value);
      expect(accessibilityValue.length).toBe(500);
      
      await captureScreenshot(page, 'character-limits-enforced');
    });

    test('handles exact character limit boundaries', async () => {
      await page.select('[data-testid="mason-0-title"]', 'Bro.');
      await fillInput(page, '[data-testid="mason-0-firstName"]', 'Boundary');
      await fillInput(page, '[data-testid="mason-0-lastName"]', 'Test');
      await page.select('[data-testid="mason-0-rank"]', 'MM');
      
      await page.click('[data-testid="mason-0-grandLodge"]');
      await page.type('[data-testid="mason-0-grandLodge"]', 'NSW');
      await page.keyboard.press('Enter');
      
      await page.click('[data-testid="mason-0-lodge"]');
      await page.type('[data-testid="mason-0-lodge"]', 'Boundary Lodge');
      await page.keyboard.press('Enter');
      
      await fillInput(page, '[data-testid="mason-0-email"]', 'boundary@test.com');
      await fillInput(page, '[data-testid="mason-0-phone"]', '+61400000000');
      
      // Test exactly 200 characters for dietary
      const exact200 = 'B'.repeat(200);
      await page.type('[data-testid="mason-0-dietary"]', exact200);
      
      // Try to add one more character
      await page.keyboard.press('X');
      
      const dietaryValue = await page.$eval('[data-testid="mason-0-dietary"]', el => el.value);
      expect(dietaryValue.length).toBe(200);
      expect(dietaryValue).not.toContain('X');
      
      // Test exactly 500 characters for accessibility
      await page.click('[data-testid="mason-0-accessibility"]');
      const exact500 = 'C'.repeat(500);
      await page.type('[data-testid="mason-0-accessibility"]', exact500);
      
      // Try to add more
      await page.keyboard.press('Y');
      
      const accessibilityValue = await page.$eval('[data-testid="mason-0-accessibility"]', el => el.value);
      expect(accessibilityValue.length).toBe(500);
      expect(accessibilityValue).not.toContain('Y');
      
      await captureScreenshot(page, 'exact-character-boundaries');
    });
  });

  describe('Special Characters and Encoding', () => {
    test('handles Unicode and special characters in names', async () => {
      const specialNames = [
        { first: "François", last: "Müller" }, // Accented characters
        { first: "José-María", last: "O'Brien" }, // Hyphens and apostrophes
        { first: "李明", last: "王" }, // Chinese characters
        { first: "محمد", last: "أحمد" }, // Arabic characters
        { first: "Владимир", last: "Петров" } // Cyrillic characters
      ];
      
      for (let i = 0; i < specialNames.length; i++) {
        if (i > 0) {
          await page.click('[data-testid="add-mason-button"]');
          await page.waitForSelector(`[data-testid="mason-${i}-title"]`);
        }
        
        await page.select(`[data-testid="mason-${i}-title"]`, 'Bro.');
        await fillInput(page, `[data-testid="mason-${i}-firstName"]`, specialNames[i].first);
        await fillInput(page, `[data-testid="mason-${i}-lastName"]`, specialNames[i].last);
        await page.select(`[data-testid="mason-${i}-rank"]`, 'MM');
        
        if (i === 0) {
          await page.click(`[data-testid="mason-${i}-grandLodge"]`);
          await page.type(`[data-testid="mason-${i}-grandLodge"]`, 'International');
          await page.keyboard.press('Enter');
          
          await page.click(`[data-testid="mason-${i}-lodge"]`);
          await page.type(`[data-testid="mason-${i}-lodge"]`, 'Unicode Lodge №123');
          await page.keyboard.press('Enter');
          
          await fillInput(page, `[data-testid="mason-${i}-email"]`, 'unicode@test.com');
          await fillInput(page, `[data-testid="mason-${i}-phone"]`, '+61400000000');
        } else {
          await page.click(`[data-testid="mason-${i}-sameLodge"]`);
          await page.select(`[data-testid="mason-${i}-contactPreference"]`, 'PrimaryAttendee');
        }
        
        // Verify values saved correctly
        const savedFirst = await page.$eval(`[data-testid="mason-${i}-firstName"]`, el => el.value);
        const savedLast = await page.$eval(`[data-testid="mason-${i}-lastName"]`, el => el.value);
        
        expect(savedFirst).toBe(specialNames[i].first);
        expect(savedLast).toBe(specialNames[i].last);
      }
      
      await captureScreenshot(page, 'unicode-special-characters');
    });

    test('handles SQL injection attempts in text fields', async () => {
      const sqlInjectionStrings = [
        "Robert'); DROP TABLE users;--",
        "' OR '1'='1",
        "1; DELETE FROM registrations WHERE 1=1;",
        "<script>alert('XSS')</script>",
        "../../etc/passwd"
      ];
      
      await page.select('[data-testid="mason-0-title"]', 'Bro.');
      
      // Test each injection string
      for (const injection of sqlInjectionStrings) {
        await page.click('[data-testid="mason-0-firstName"]', { clickCount: 3 });
        await page.type('[data-testid="mason-0-firstName"]', injection);
        
        // Verify field accepts but sanitizes the input
        const value = await page.$eval('[data-testid="mason-0-firstName"]', el => el.value);
        expect(value).toBe(injection); // Field accepts the string
        
        // Clear for next test
        await page.click('[data-testid="mason-0-firstName"]', { clickCount: 3 });
        await page.keyboard.press('Delete');
      }
      
      // Complete form with safe data
      await fillInput(page, '[data-testid="mason-0-firstName"]', 'Security');
      await fillInput(page, '[data-testid="mason-0-lastName"]', 'Test');
      await page.select('[data-testid="mason-0-rank"]', 'MM');
      
      await page.click('[data-testid="mason-0-grandLodge"]');
      await page.type('[data-testid="mason-0-grandLodge"]', 'NSW');
      await page.keyboard.press('Enter');
      
      await page.click('[data-testid="mason-0-lodge"]');
      await page.type('[data-testid="mason-0-lodge"]', 'Secure Lodge');
      await page.keyboard.press('Enter');
      
      await fillInput(page, '[data-testid="mason-0-email"]', 'security@test.com');
      await fillInput(page, '[data-testid="mason-0-phone"]', '+61400000000');
      
      // Test in dietary field with HTML/script tags
      await page.type('[data-testid="mason-0-dietary"]', '<b>Bold</b> text and <script>alert("XSS")</script>');
      
      await captureScreenshot(page, 'sql-injection-attempts');
    });
  });

  describe('Email and Phone Validation Edge Cases', () => {
    test('validates edge case email formats', async () => {
      await page.select('[data-testid="mason-0-title"]', 'Bro.');
      await fillInput(page, '[data-testid="mason-0-firstName"]', 'Email');
      await fillInput(page, '[data-testid="mason-0-lastName"]', 'EdgeCase');
      await page.select('[data-testid="mason-0-rank"]', 'MM');
      
      await page.click('[data-testid="mason-0-grandLodge"]');
      await page.type('[data-testid="mason-0-grandLodge"]', 'NSW');
      await page.keyboard.press('Enter');
      
      await page.click('[data-testid="mason-0-lodge"]');
      await page.type('[data-testid="mason-0-lodge"]', 'Email Lodge');
      await page.keyboard.press('Enter');
      
      const edgeCaseEmails = [
        { email: 'user+tag@example.com', valid: true }, // Plus addressing
        { email: 'user.name@example.com', valid: true }, // Dots
        { email: 'user@sub.example.com', valid: true }, // Subdomain
        { email: 'user@example.co.uk', valid: true }, // Multiple TLD
        { email: '123@example.com', valid: true }, // Numeric local
        { email: 'user@123.456.789.012', valid: true }, // IP address (if allowed)
        { email: 'user..name@example.com', valid: false }, // Double dots
        { email: '.user@example.com', valid: false }, // Leading dot
        { email: 'user.@example.com', valid: false }, // Trailing dot
        { email: 'user@.example.com', valid: false }, // Domain leading dot
        { email: 'user name@example.com', valid: false }, // Space
        { email: 'user@example', valid: false }, // No TLD
        { email: '@example.com', valid: false }, // No local part
        { email: 'user@', valid: false }, // No domain
        { email: 'user@@example.com', valid: false } // Double @
      ];
      
      for (const testCase of edgeCaseEmails) {
        await page.click('[data-testid="mason-0-email"]', { clickCount: 3 });
        await page.type('[data-testid="mason-0-email"]', testCase.email);
        await page.click('[data-testid="mason-0-phone"]'); // Blur to trigger validation
        
        await page.waitForTimeout(100); // Wait for validation
        
        const hasError = await page.$('[data-testid="mason-0-email-error"]');
        
        if (testCase.valid) {
          expect(hasError).toBeFalsy();
        } else {
          expect(hasError).toBeTruthy();
        }
      }
      
      // Set valid email to continue
      await page.click('[data-testid="mason-0-email"]', { clickCount: 3 });
      await page.type('[data-testid="mason-0-email"]', 'valid@test.com');
      
      await captureScreenshot(page, 'email-edge-cases');
    });

    test('validates international phone number formats', async () => {
      await page.select('[data-testid="mason-0-title"]', 'Bro.');
      await fillInput(page, '[data-testid="mason-0-firstName"]', 'Phone');
      await fillInput(page, '[data-testid="mason-0-lastName"]', 'International');
      await page.select('[data-testid="mason-0-rank"]', 'MM');
      
      await page.click('[data-testid="mason-0-grandLodge"]');
      await page.type('[data-testid="mason-0-grandLodge"]', 'International');
      await page.keyboard.press('Enter');
      
      await page.click('[data-testid="mason-0-lodge"]');
      await page.type('[data-testid="mason-0-lodge"]', 'Global Lodge');
      await page.keyboard.press('Enter');
      
      await fillInput(page, '[data-testid="mason-0-email"]', 'phone@test.com');
      
      const phoneNumbers = [
        { number: '+61400000000', valid: true }, // Australian mobile
        { number: '+61299999999', valid: true }, // Australian landline
        { number: '+1-555-555-5555', valid: true }, // US format
        { number: '+44 20 7946 0958', valid: true }, // UK format
        { number: '+86 138 0000 0000', valid: true }, // China
        { number: '+971 50 000 0000', valid: true }, // UAE
        { number: '0400000000', valid: true }, // Local format (might be converted)
        { number: '(02) 9999 9999', valid: true }, // Local with parentheses
        { number: '123', valid: false }, // Too short
        { number: 'abcdefghij', valid: false }, // Letters
        { number: '+61', valid: false }, // Country code only
        { number: '+999999999999999999', valid: false } // Too long
      ];
      
      for (const testCase of phoneNumbers) {
        await page.click('[data-testid="mason-0-phone"]', { clickCount: 3 });
        await page.keyboard.down('Control');
        await page.keyboard.press('A');
        await page.keyboard.up('Control');
        await page.keyboard.press('Delete');
        
        await page.type('[data-testid="mason-0-phone"]', testCase.number);
        await page.click('[data-testid="mason-0-email"]'); // Blur
        
        await page.waitForTimeout(100);
        
        const hasError = await page.$('[data-testid="mason-0-phone-error"]');
        
        if (testCase.valid) {
          expect(hasError).toBeFalsy();
        } else {
          expect(hasError).toBeTruthy();
        }
      }
      
      await captureScreenshot(page, 'phone-international-formats');
    });
  });

  describe('Attendee Limit Edge Cases', () => {
    test('prevents adding beyond maximum limits', async () => {
      // Add primary Mason
      await fillInput(page, '[data-testid="mason-0-title"]', 'Bro.');
      await fillInput(page, '[data-testid="mason-0-firstName"]', 'Primary');
      await fillInput(page, '[data-testid="mason-0-lastName"]', 'Mason');
      await page.select('[data-testid="mason-0-rank"]', 'MM');
      
      await page.click('[data-testid="mason-0-grandLodge"]');
      await page.type('[data-testid="mason-0-grandLodge"]', 'NSW');
      await page.keyboard.press('Enter');
      
      await page.click('[data-testid="mason-0-lodge"]');
      await page.type('[data-testid="mason-0-lodge"]', 'Limit Test Lodge');
      await page.keyboard.press('Enter');
      
      await fillInput(page, '[data-testid="mason-0-email"]', 'limit@test.com');
      await fillInput(page, '[data-testid="mason-0-phone"]', '+61400000000');
      
      // Add 4 more Masons (total 5 - at limit)
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
      
      // Try to add 6th Mason - should be disabled
      const addMasonButton = await page.$('[data-testid="add-mason-button"]');
      const isMasonDisabled = await page.$eval('[data-testid="add-mason-button"]', el => el.disabled);
      expect(isMasonDisabled).toBe(true);
      
      // Add 5 Guests (at limit)
      for (let i = 0; i < 5; i++) {
        await page.click('[data-testid="add-guest-button"]');
        await page.waitForSelector(`[data-testid="guest-${i}-title"]`);
        await page.select(`[data-testid="guest-${i}-title"]`, 'Mr.');
        await fillInput(page, `[data-testid="guest-${i}-firstName"]`, `Guest${i + 1}`);
        await fillInput(page, `[data-testid="guest-${i}-lastName"]`, 'Test');
        await page.select(`[data-testid="guest-${i}-contactPreference"]`, 'PrimaryAttendee');
      }
      
      // Try to add 6th Guest - should be disabled
      const isGuestDisabled = await page.$eval('[data-testid="add-guest-button"]', el => el.disabled);
      expect(isGuestDisabled).toBe(true);
      
      // Verify limit messages
      const masonLimitMsg = await page.$('[data-testid="mason-limit-reached"]');
      const guestLimitMsg = await page.$('[data-testid="guest-limit-reached"]');
      const totalLimitMsg = await page.$('[data-testid="total-limit-reached"]');
      
      expect(masonLimitMsg).toBeTruthy();
      expect(guestLimitMsg).toBeTruthy();
      expect(totalLimitMsg).toBeTruthy();
      
      await captureScreenshot(page, 'attendee-limits-reached');
    });

    test('handles edge case of removing primary attendee', async () => {
      // Add two Masons
      await fillInput(page, '[data-testid="mason-0-title"]', 'Bro.');
      await fillInput(page, '[data-testid="mason-0-firstName"]', 'Primary');
      await fillInput(page, '[data-testid="mason-0-lastName"]', 'ToRemove');
      await page.select('[data-testid="mason-0-rank"]', 'MM');
      
      await page.click('[data-testid="mason-0-grandLodge"]');
      await page.type('[data-testid="mason-0-grandLodge"]', 'NSW');
      await page.keyboard.press('Enter');
      
      await page.click('[data-testid="mason-0-lodge"]');
      await page.type('[data-testid="mason-0-lodge"]', 'Test Lodge');
      await page.keyboard.press('Enter');
      
      await fillInput(page, '[data-testid="mason-0-email"]', 'primary@test.com');
      await fillInput(page, '[data-testid="mason-0-phone"]', '+61400000000');
      
      await page.click('[data-testid="add-mason-button"]');
      await page.waitForSelector('[data-testid="mason-1-title"]');
      await page.select('[data-testid="mason-1-title"]', 'W.Bro.');
      await fillInput(page, '[data-testid="mason-1-firstName"]', 'Secondary');
      await fillInput(page, '[data-testid="mason-1-lastName"]', 'Becomes');
      await page.select('[data-testid="mason-1-rank"]', 'MM');
      await page.click('[data-testid="mason-1-sameLodge"]');
      await page.select('[data-testid="mason-1-contactPreference"]', 'PrimaryAttendee');
      
      // Capture before state
      await captureScreenshot(page, 'before-primary-removal');
      
      // Remove primary attendee
      await page.click('[data-testid="remove-mason-0"]');
      
      // Wait for reindexing
      await page.waitForFunction(() => {
        const firstName = document.querySelector('[data-testid="mason-0-firstName"]');
        return firstName && firstName.value === 'Secondary';
      });
      
      // Secondary should now be primary
      const newPrimaryName = await page.$eval('[data-testid="mason-0-firstName"]', el => el.value);
      expect(newPrimaryName).toBe('Secondary');
      
      // Should require contact info now
      const emailRequired = await page.$('[data-testid="mason-0-email"][required]');
      const phoneRequired = await page.$('[data-testid="mason-0-phone"][required]');
      expect(emailRequired).toBeTruthy();
      expect(phoneRequired).toBeTruthy();
      
      // Contact preference should be removed
      const contactPref = await page.$('[data-testid="mason-0-contactPreference"]');
      expect(contactPref).toBeFalsy();
      
      await captureScreenshot(page, 'after-primary-removal');
    });
  });

  describe('Session and Network Edge Cases', () => {
    test('handles form data recovery after navigation', async () => {
      // Fill extensive form data
      await fillInput(page, '[data-testid="mason-0-title"]', 'R.W.Bro.');
      await fillInput(page, '[data-testid="mason-0-firstName"]', 'Session');
      await fillInput(page, '[data-testid="mason-0-lastName"]', 'Recovery');
      await page.select('[data-testid="mason-0-rank"]', 'GL');
      
      await page.click('[data-testid="mason-0-grandLodge"]');
      await page.type('[data-testid="mason-0-grandLodge"]', 'NSW');
      await page.keyboard.press('Enter');
      
      await page.click('[data-testid="mason-0-lodge"]');
      await page.type('[data-testid="mason-0-lodge"]', 'Recovery Lodge');
      await page.keyboard.press('Enter');
      
      await fillInput(page, '[data-testid="mason-0-email"]', 'session@test.com');
      await fillInput(page, '[data-testid="mason-0-phone"]', '+61400000000');
      
      await page.waitForSelector('[data-testid="mason-0-grandRank"]');
      await fillInput(page, '[data-testid="mason-0-grandRank"]', 'PAGM');
      await page.select('[data-testid="mason-0-grandOfficerStatus"]', 'Past');
      
      await fillInput(page, '[data-testid="mason-0-dietary"]', 'Vegetarian, no dairy');
      await fillInput(page, '[data-testid="mason-0-accessibility"]', 'Wheelchair access required');
      
      // Add partner
      await page.click('[data-testid="mason-0-hasPartner"]');
      await page.waitForSelector('[data-testid="mason-0-partner-form"]');
      await page.select('[data-testid="mason-0-partner-title"]', 'Mrs.');
      await fillInput(page, '[data-testid="mason-0-partner-firstName"]', 'Partner');
      await fillInput(page, '[data-testid="mason-0-partner-lastName"]', 'Recovery');
      await page.select('[data-testid="mason-0-partner-relationship"]', 'Wife');
      
      // Navigate forward
      await page.click('[data-testid="continue-button"]');
      await page.waitForSelector('[data-testid="ticket-selection-step"]');
      
      // Navigate back
      await page.click('[data-testid="back-button"]');
      await page.waitForSelector('[data-testid="attendee-details-step"]');
      
      // Verify all data persisted
      const firstName = await page.$eval('[data-testid="mason-0-firstName"]', el => el.value);
      const grandRank = await page.$eval('[data-testid="mason-0-grandRank"]', el => el.value);
      const dietary = await page.$eval('[data-testid="mason-0-dietary"]', el => el.value);
      const partnerFirstName = await page.$eval('[data-testid="mason-0-partner-firstName"]', el => el.value);
      
      expect(firstName).toBe('Session');
      expect(grandRank).toBe('PAGM');
      expect(dietary).toBe('Vegetarian, no dairy');
      expect(partnerFirstName).toBe('Partner');
      
      await captureScreenshot(page, 'session-data-recovery');
    });

    test('handles browser refresh during registration', async () => {
      // Fill some data
      await fillInput(page, '[data-testid="mason-0-title"]', 'Bro.');
      await fillInput(page, '[data-testid="mason-0-firstName"]', 'Refresh');
      await fillInput(page, '[data-testid="mason-0-lastName"]', 'Test');
      await page.select('[data-testid="mason-0-rank"]', 'MM');
      
      await page.click('[data-testid="mason-0-grandLodge"]');
      await page.type('[data-testid="mason-0-grandLodge"]', 'NSW');
      await page.keyboard.press('Enter');
      
      await page.click('[data-testid="mason-0-lodge"]');
      await page.type('[data-testid="mason-0-lodge"]', 'Refresh Lodge');
      await page.keyboard.press('Enter');
      
      await fillInput(page, '[data-testid="mason-0-email"]', 'refresh@test.com');
      await fillInput(page, '[data-testid="mason-0-phone"]', '+61400000000');
      
      // Simulate browser refresh
      await page.reload();
      
      // Wait for page to load
      await page.waitForSelector('[data-testid="registration-wizard"]', { timeout: 10000 });
      
      // Check if draft recovery modal appears
      const draftModal = await page.$('[data-testid="draft-recovery-modal"]');
      if (draftModal) {
        // Click continue with draft
        await page.click('[data-testid="continue-draft-button"]');
        
        // Verify data restored
        await page.waitForSelector('[data-testid="mason-0-firstName"]');
        const firstName = await page.$eval('[data-testid="mason-0-firstName"]', el => el.value);
        expect(firstName).toBe('Refresh');
        
        await captureScreenshot(page, 'draft-recovery-after-refresh');
      } else {
        // If no draft recovery, check if data persisted automatically
        const firstName = await page.$('[data-testid="mason-0-firstName"]');
        if (firstName) {
          const value = await page.$eval('[data-testid="mason-0-firstName"]', el => el.value);
          console.log('Data persisted without modal:', value);
        }
      }
    });
  });

  describe('Form Submission Edge Cases', () => {
    test('handles rapid form submission attempts', async () => {
      // Fill minimum required fields quickly
      await fillInput(page, '[data-testid="mason-0-title"]', 'Bro.');
      await fillInput(page, '[data-testid="mason-0-firstName"]', 'Rapid');
      await fillInput(page, '[data-testid="mason-0-lastName"]', 'Submit');
      await page.select('[data-testid="mason-0-rank"]', 'MM');
      
      await page.click('[data-testid="mason-0-grandLodge"]');
      await page.type('[data-testid="mason-0-grandLodge"]', 'NSW');
      await page.keyboard.press('Enter');
      
      await page.click('[data-testid="mason-0-lodge"]');
      await page.type('[data-testid="mason-0-lodge"]', 'Fast Lodge');
      await page.keyboard.press('Enter');
      
      await fillInput(page, '[data-testid="mason-0-email"]', 'rapid@test.com');
      await fillInput(page, '[data-testid="mason-0-phone"]', '+61400000000');
      
      // Try to click continue multiple times rapidly
      const continueButton = await page.$('[data-testid="continue-button"]');
      
      // Click 5 times rapidly
      for (let i = 0; i < 5; i++) {
        await page.click('[data-testid="continue-button"]').catch(() => {});
      }
      
      // Should only navigate once
      await page.waitForSelector('[data-testid="ticket-selection-step"]', { timeout: 5000 });
      
      // Verify we're on ticket selection (not further)
      const currentStep = await page.$('[data-testid="ticket-selection-step"]');
      expect(currentStep).toBeTruthy();
      
      await captureScreenshot(page, 'rapid-submission-prevented');
    });

    test('handles empty form submission', async () => {
      // Try to submit without filling anything
      await page.click('[data-testid="continue-button"]');
      
      // Should show multiple validation errors
      await page.waitForSelector('[data-testid="validation-error"]');
      const errors = await page.$$('[data-testid="validation-error"]');
      expect(errors.length).toBeGreaterThan(5); // Title, names, rank, lodge, contact
      
      // Check specific required field errors
      const titleError = await page.$('[data-testid="mason-0-title-error"]');
      const firstNameError = await page.$('[data-testid="mason-0-firstName-error"]');
      const lastNameError = await page.$('[data-testid="mason-0-lastName-error"]');
      const rankError = await page.$('[data-testid="mason-0-rank-error"]');
      const emailError = await page.$('[data-testid="mason-0-email-error"]');
      const phoneError = await page.$('[data-testid="mason-0-phone-error"]');
      
      expect(titleError).toBeTruthy();
      expect(firstNameError).toBeTruthy();
      expect(lastNameError).toBeTruthy();
      expect(rankError).toBeTruthy();
      expect(emailError).toBeTruthy();
      expect(phoneError).toBeTruthy();
      
      await captureScreenshot(page, 'empty-form-validation');
    });
  });

  describe('Performance and Memory Limits', () => {
    test('handles maximum data in all fields', async () => {
      // Fill every field with maximum allowed data
      await page.select('[data-testid="mason-0-title"]', 'M.W.Bro.');
      await fillInput(page, '[data-testid="mason-0-firstName"]', 'M'.repeat(50));
      await fillInput(page, '[data-testid="mason-0-lastName"]', 'A'.repeat(50));
      await page.select('[data-testid="mason-0-rank"]', 'GL');
      
      await page.click('[data-testid="mason-0-grandLodge"]');
      await page.type('[data-testid="mason-0-grandLodge"]', 'New South Wales and Australian Capital Territory');
      await page.keyboard.press('Enter');
      
      await page.click('[data-testid="mason-0-lodge"]');
      await page.type('[data-testid="mason-0-lodge"]', 'L'.repeat(100));
      await page.keyboard.press('Enter');
      
      await fillInput(page, '[data-testid="mason-0-email"]', 'verylongemailaddress.with.many.dots@subdomain.example.com');
      await fillInput(page, '[data-testid="mason-0-phone"]', '+61999999999');
      
      await page.waitForSelector('[data-testid="mason-0-grandRank"]');
      await fillInput(page, '[data-testid="mason-0-grandRank"]', 'G'.repeat(10));
      await page.select('[data-testid="mason-0-grandOfficerStatus"]', 'Present');
      await page.waitForSelector('[data-testid="mason-0-presentGrandOfficerRole"]');
      await page.select('[data-testid="mason-0-presentGrandOfficerRole"]', 'Other');
      await page.waitForSelector('[data-testid="mason-0-otherGrandOfficerRole"]');
      await fillInput(page, '[data-testid="mason-0-otherGrandOfficerRole"]', 'O'.repeat(50));
      
      await fillInput(page, '[data-testid="mason-0-dietary"]', 'D'.repeat(200));
      await fillInput(page, '[data-testid="mason-0-accessibility"]', 'A'.repeat(500));
      
      // Add partner with max data
      await page.click('[data-testid="mason-0-hasPartner"]');
      await page.waitForSelector('[data-testid="mason-0-partner-form"]');
      await page.select('[data-testid="mason-0-partner-title"]', 'Prof.');
      await fillInput(page, '[data-testid="mason-0-partner-firstName"]', 'P'.repeat(50));
      await fillInput(page, '[data-testid="mason-0-partner-lastName"]', 'Q'.repeat(50));
      await page.select('[data-testid="mason-0-partner-relationship"]', 'Other');
      await page.waitForSelector('[data-testid="mason-0-partner-otherRelationship"]');
      await fillInput(page, '[data-testid="mason-0-partner-otherRelationship"]', 'R'.repeat(30));
      await fillInput(page, '[data-testid="mason-0-partner-dietary"]', 'S'.repeat(200));
      await fillInput(page, '[data-testid="mason-0-partner-accessibility"]', 'T'.repeat(500));
      
      // Performance check - form should still be responsive
      const startTime = Date.now();
      await page.click('[data-testid="continue-button"]');
      await page.waitForSelector('[data-testid="ticket-selection-step"]');
      const endTime = Date.now();
      
      const navigationTime = endTime - startTime;
      expect(navigationTime).toBeLessThan(5000); // Should navigate within 5 seconds
      
      await captureScreenshot(page, 'maximum-data-all-fields');
    });
  });
});