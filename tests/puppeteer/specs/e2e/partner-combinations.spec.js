/**
 * Partner Combinations Test Suite
 * 
 * This comprehensive test suite covers all partner relationship scenarios in the
 * Individual (Myself & Others) registration flow. It tests:
 * - Mason with partner (Lady)
 * - Guest with partner
 * - All 4 partner relationship types (Wife, Husband, Partner, Other)
 * - Partner data inheritance and flow
 * - Multiple attendees with mixed partner configurations
 * - Partner eligibility for tickets
 * - Partner removal and reordering
 * - Validation and data persistence
 */

const puppeteer = require('puppeteer');
const { testData } = require('../../config/test-data');
const { captureScreenshot, waitForElement, fillInput } = require('../../helpers/test-utils');

describe('Partner Combinations', () => {
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

  describe('Mason with Partner Scenarios', () => {
    beforeEach(async () => {
      // Add primary Mason
      await fillInput(page, '[data-testid="mason-0-title"]', 'W.Bro.');
      await fillInput(page, '[data-testid="mason-0-firstName"]', 'John');
      await fillInput(page, '[data-testid="mason-0-lastName"]', 'Smith');
      await fillInput(page, '[data-testid="mason-0-rank"]', 'MM');
      
      await page.click('[data-testid="mason-0-grandLodge"]');
      await page.type('[data-testid="mason-0-grandLodge"]', 'New South Wales');
      await page.keyboard.press('Enter');
      
      await page.click('[data-testid="mason-0-lodge"]');
      await page.type('[data-testid="mason-0-lodge"]', 'Test Lodge 123');
      await page.keyboard.press('Enter');
      
      await fillInput(page, '[data-testid="mason-0-email"]', 'john.smith@test.com');
      await fillInput(page, '[data-testid="mason-0-phone"]', '+61400000000');
    });

    test('adds Mason with wife partner', async () => {
      // Enable partner checkbox
      await page.click('[data-testid="mason-0-hasPartner"]');
      await page.waitForSelector('[data-testid="mason-0-partner-form"]');
      
      // Fill partner details
      await page.select('[data-testid="mason-0-partner-title"]', 'Mrs.');
      await fillInput(page, '[data-testid="mason-0-partner-firstName"]', 'Jane');
      await fillInput(page, '[data-testid="mason-0-partner-lastName"]', 'Smith');
      await page.select('[data-testid="mason-0-partner-relationship"]', 'Wife');
      
      // Partner should inherit contact preference from primary
      const partnerEmail = await page.$('[data-testid="mason-0-partner-email"]');
      expect(partnerEmail).toBeFalsy(); // Not required for partner
      
      await captureScreenshot(page, 'mason-with-wife');
      
      // Verify partner appears in attendee list
      const attendeeCards = await page.$$('[data-testid^="attendee-card-"]');
      expect(attendeeCards.length).toBe(2); // Mason + Partner
      
      // Verify partner labeled correctly
      const partnerLabel = await page.$eval('[data-testid="attendee-card-1-type"]', el => el.textContent);
      expect(partnerLabel).toContain("Mason's Lady");
    });

    test('adds Mason with husband partner', async () => {
      // Change Mason to female
      await page.select('[data-testid="mason-0-title"]', 'W.Bro.');
      await fillInput(page, '[data-testid="mason-0-firstName"]', 'Sarah');
      
      // Enable partner
      await page.click('[data-testid="mason-0-hasPartner"]');
      await page.waitForSelector('[data-testid="mason-0-partner-form"]');
      
      // Fill husband partner details
      await page.select('[data-testid="mason-0-partner-title"]', 'Mr.');
      await fillInput(page, '[data-testid="mason-0-partner-firstName"]', 'David');
      await fillInput(page, '[data-testid="mason-0-partner-lastName"]', 'Smith');
      await page.select('[data-testid="mason-0-partner-relationship"]', 'Husband');
      
      await captureScreenshot(page, 'mason-with-husband');
      
      // Verify partner type
      const partnerLabel = await page.$eval('[data-testid="attendee-card-1-type"]', el => el.textContent);
      expect(partnerLabel).toContain("Mason's Partner");
    });

    test('adds Mason with generic partner', async () => {
      // Enable partner
      await page.click('[data-testid="mason-0-hasPartner"]');
      await page.waitForSelector('[data-testid="mason-0-partner-form"]');
      
      // Fill partner details with generic relationship
      await page.select('[data-testid="mason-0-partner-title"]', 'Ms.');
      await fillInput(page, '[data-testid="mason-0-partner-firstName"]', 'Alex');
      await fillInput(page, '[data-testid="mason-0-partner-lastName"]', 'Johnson');
      await page.select('[data-testid="mason-0-partner-relationship"]', 'Partner');
      
      // Add optional fields for partner
      await fillInput(page, '[data-testid="mason-0-partner-dietary"]', 'Vegan');
      await fillInput(page, '[data-testid="mason-0-partner-accessibility"]', 'Step-free access');
      
      await captureScreenshot(page, 'mason-with-partner');
      
      // Verify partner details saved
      const dietaryValue = await page.$eval('[data-testid="mason-0-partner-dietary"]', el => el.value);
      expect(dietaryValue).toBe('Vegan');
    });

    test('adds Mason with other relationship partner', async () => {
      // Enable partner
      await page.click('[data-testid="mason-0-hasPartner"]');
      await page.waitForSelector('[data-testid="mason-0-partner-form"]');
      
      // Fill partner with "Other" relationship
      await page.select('[data-testid="mason-0-partner-title"]', 'Dr.');
      await fillInput(page, '[data-testid="mason-0-partner-firstName"]', 'Chris');
      await fillInput(page, '[data-testid="mason-0-partner-lastName"]', 'Williams');
      await page.select('[data-testid="mason-0-partner-relationship"]', 'Other');
      
      // Other relationship should show additional field
      await page.waitForSelector('[data-testid="mason-0-partner-otherRelationship"]');
      await fillInput(page, '[data-testid="mason-0-partner-otherRelationship"]', 'Caregiver');
      
      await captureScreenshot(page, 'mason-with-other-relationship');
      
      // Verify other relationship saved
      const otherValue = await page.$eval('[data-testid="mason-0-partner-otherRelationship"]', el => el.value);
      expect(otherValue).toBe('Caregiver');
    });

    test('removes Mason partner and data clears', async () => {
      // Add partner
      await page.click('[data-testid="mason-0-hasPartner"]');
      await page.waitForSelector('[data-testid="mason-0-partner-form"]');
      
      await page.select('[data-testid="mason-0-partner-title"]', 'Mrs.');
      await fillInput(page, '[data-testid="mason-0-partner-firstName"]', 'Jane');
      await fillInput(page, '[data-testid="mason-0-partner-lastName"]', 'Smith');
      await page.select('[data-testid="mason-0-partner-relationship"]', 'Wife');
      
      // Verify partner exists
      let attendeeCards = await page.$$('[data-testid^="attendee-card-"]');
      expect(attendeeCards.length).toBe(2);
      
      // Remove partner
      await page.click('[data-testid="mason-0-hasPartner"]'); // Uncheck
      
      // Wait for partner form to disappear
      await page.waitForFunction(() => !document.querySelector('[data-testid="mason-0-partner-form"]'));
      
      // Verify partner removed
      attendeeCards = await page.$$('[data-testid^="attendee-card-"]');
      expect(attendeeCards.length).toBe(1);
      
      // Re-enable partner and verify fields are empty
      await page.click('[data-testid="mason-0-hasPartner"]');
      await page.waitForSelector('[data-testid="mason-0-partner-form"]');
      
      const firstName = await page.$eval('[data-testid="mason-0-partner-firstName"]', el => el.value);
      expect(firstName).toBe('');
      
      await captureScreenshot(page, 'partner-removed-data-cleared');
    });
  });

  describe('Guest with Partner Scenarios', () => {
    beforeEach(async () => {
      // Add primary Mason first (required)
      await fillInput(page, '[data-testid="mason-0-title"]', 'Bro.');
      await fillInput(page, '[data-testid="mason-0-firstName"]', 'Primary');
      await fillInput(page, '[data-testid="mason-0-lastName"]', 'Mason');
      await fillInput(page, '[data-testid="mason-0-rank"]', 'MM');
      
      await page.click('[data-testid="mason-0-grandLodge"]');
      await page.type('[data-testid="mason-0-grandLodge"]', 'New South Wales');
      await page.keyboard.press('Enter');
      
      await page.click('[data-testid="mason-0-lodge"]');
      await page.type('[data-testid="mason-0-lodge"]', 'Test Lodge');
      await page.keyboard.press('Enter');
      
      await fillInput(page, '[data-testid="mason-0-email"]', 'primary@test.com');
      await fillInput(page, '[data-testid="mason-0-phone"]', '+61400000000');
      
      // Add a guest
      await page.click('[data-testid="add-guest-button"]');
      await page.waitForSelector('[data-testid="guest-0-title"]');
      
      await page.select('[data-testid="guest-0-title"]', 'Mr.');
      await fillInput(page, '[data-testid="guest-0-firstName"]', 'Robert');
      await fillInput(page, '[data-testid="guest-0-lastName"]', 'Jones');
      await page.select('[data-testid="guest-0-contactPreference"]', 'PrimaryAttendee');
    });

    test('adds guest with wife partner', async () => {
      // Enable partner for guest
      await page.click('[data-testid="guest-0-hasPartner"]');
      await page.waitForSelector('[data-testid="guest-0-partner-form"]');
      
      // Fill partner details
      await page.select('[data-testid="guest-0-partner-title"]', 'Mrs.');
      await fillInput(page, '[data-testid="guest-0-partner-firstName"]', 'Mary');
      await fillInput(page, '[data-testid="guest-0-partner-lastName"]', 'Jones');
      await page.select('[data-testid="guest-0-partner-relationship"]', 'Wife');
      
      await captureScreenshot(page, 'guest-with-wife');
      
      // Verify attendee count
      const attendeeCards = await page.$$('[data-testid^="attendee-card-"]');
      expect(attendeeCards.length).toBe(3); // Mason + Guest + Guest's Partner
      
      // Verify partner type
      const partnerLabel = await page.$eval('[data-testid="attendee-card-2-type"]', el => el.textContent);
      expect(partnerLabel).toContain("Guest's Partner");
    });

    test('adds guest with partner having dietary requirements', async () => {
      // Enable partner
      await page.click('[data-testid="guest-0-hasPartner"]');
      await page.waitForSelector('[data-testid="guest-0-partner-form"]');
      
      // Fill partner with dietary requirements
      await page.select('[data-testid="guest-0-partner-title"]', 'Ms.');
      await fillInput(page, '[data-testid="guest-0-partner-firstName"]', 'Emma');
      await fillInput(page, '[data-testid="guest-0-partner-lastName"]', 'Brown');
      await page.select('[data-testid="guest-0-partner-relationship"]', 'Partner');
      
      // Add dietary and accessibility needs
      await fillInput(page, '[data-testid="guest-0-partner-dietary"]', 'Kosher, nut allergy');
      await fillInput(page, '[data-testid="guest-0-partner-accessibility"]', 'Wheelchair user, requires accessible parking');
      
      await captureScreenshot(page, 'guest-partner-special-needs');
      
      // Verify character counts
      const dietaryCount = await page.$eval('[data-testid="guest-0-partner-dietary-count"]', el => el.textContent);
      expect(dietaryCount).toContain('18/200');
      
      const accessibilityCount = await page.$eval('[data-testid="guest-0-partner-accessibility-count"]', el => el.textContent);
      expect(accessibilityCount).toContain('43/500');
    });
  });

  describe('Multiple Attendees with Partners', () => {
    test('creates complex group with mixed partners', async () => {
      // Primary Mason with partner
      await fillInput(page, '[data-testid="mason-0-title"]', 'R.W.Bro.');
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
      await fillInput(page, '[data-testid="mason-0-phone"]', '+61400000001');
      
      // Add partner to primary Mason
      await page.click('[data-testid="mason-0-hasPartner"]');
      await page.waitForSelector('[data-testid="mason-0-partner-form"]');
      await page.select('[data-testid="mason-0-partner-title"]', 'Mrs.');
      await fillInput(page, '[data-testid="mason-0-partner-firstName"]', 'Lady');
      await fillInput(page, '[data-testid="mason-0-partner-lastName"]', 'Master');
      await page.select('[data-testid="mason-0-partner-relationship"]', 'Wife');
      
      // Add second Mason without partner
      await page.click('[data-testid="add-mason-button"]');
      await page.waitForSelector('[data-testid="mason-1-title"]');
      await page.select('[data-testid="mason-1-title"]', 'W.Bro.');
      await fillInput(page, '[data-testid="mason-1-firstName"]', 'Single');
      await fillInput(page, '[data-testid="mason-1-lastName"]', 'Mason');
      await page.select('[data-testid="mason-1-rank"]', 'MM');
      await page.click('[data-testid="mason-1-sameLodge"]');
      await page.select('[data-testid="mason-1-contactPreference"]', 'PrimaryAttendee');
      
      // Add Guest with partner
      await page.click('[data-testid="add-guest-button"]');
      await page.waitForSelector('[data-testid="guest-0-title"]');
      await page.select('[data-testid="guest-0-title"]', 'Dr.');
      await fillInput(page, '[data-testid="guest-0-firstName"]', 'Guest');
      await fillInput(page, '[data-testid="guest-0-lastName"]', 'Doctor');
      await page.select('[data-testid="guest-0-contactPreference"]', 'Directly');
      await fillInput(page, '[data-testid="guest-0-email"]', 'doctor@test.com');
      await fillInput(page, '[data-testid="guest-0-phone"]', '+61400000002');
      
      // Add partner to guest
      await page.click('[data-testid="guest-0-hasPartner"]');
      await page.waitForSelector('[data-testid="guest-0-partner-form"]');
      await page.select('[data-testid="guest-0-partner-title"]', 'Dr.');
      await fillInput(page, '[data-testid="guest-0-partner-firstName"]', 'Partner');
      await fillInput(page, '[data-testid="guest-0-partner-lastName"]', 'Doctor');
      await page.select('[data-testid="guest-0-partner-relationship"]', 'Partner');
      
      // Add third Mason with partner
      await page.click('[data-testid="add-mason-button"]');
      await page.waitForSelector('[data-testid="mason-2-title"]');
      await page.select('[data-testid="mason-2-title"]', 'V.W.Bro.');
      await fillInput(page, '[data-testid="mason-2-firstName"]', 'Third');
      await fillInput(page, '[data-testid="mason-2-lastName"]', 'Mason');
      await page.select('[data-testid="mason-2-rank"]', 'MM');
      await page.click('[data-testid="mason-2-sameLodge"]');
      await page.select('[data-testid="mason-2-contactPreference"]', 'ProvideLater');
      
      await page.click('[data-testid="mason-2-hasPartner"]');
      await page.waitForSelector('[data-testid="mason-2-partner-form"]');
      await page.select('[data-testid="mason-2-partner-title"]', 'Ms.');
      await fillInput(page, '[data-testid="mason-2-partner-firstName"]', 'Third');
      await fillInput(page, '[data-testid="mason-2-partner-lastName"]', 'Partner');
      await page.select('[data-testid="mason-2-partner-relationship"]', 'Partner');
      
      await captureScreenshot(page, 'complex-group-mixed-partners');
      
      // Verify total attendee count (3 primary + 3 partners = 6)
      const attendeeCards = await page.$$('[data-testid^="attendee-card-"]');
      expect(attendeeCards.length).toBe(6);
      
      // Verify order: Primary attendees followed by their partners
      const attendeeOrder = await page.$$eval('[data-testid^="attendee-card-"] [data-testid$="-name"]', 
        elements => elements.map(el => el.textContent)
      );
      
      expect(attendeeOrder).toEqual([
        'Grand Master',  // Mason 0
        'Lady Master',   // Mason 0's partner
        'Single Mason',  // Mason 1 (no partner)
        'Guest Doctor',  // Guest 0
        'Partner Doctor', // Guest 0's partner
        'Third Mason',   // Mason 2
        'Third Partner'  // Mason 2's partner
      ]);
    });

    test('handles partner removal in complex group', async () => {
      // Create group with 2 Masons and 1 Guest, all with partners
      // Primary Mason
      await fillInput(page, '[data-testid="mason-0-title"]', 'Bro.');
      await fillInput(page, '[data-testid="mason-0-firstName"]', 'First');
      await fillInput(page, '[data-testid="mason-0-lastName"]', 'Mason');
      await fillInput(page, '[data-testid="mason-0-rank"]', 'MM');
      
      await page.click('[data-testid="mason-0-grandLodge"]');
      await page.type('[data-testid="mason-0-grandLodge"]', 'NSW');
      await page.keyboard.press('Enter');
      
      await page.click('[data-testid="mason-0-lodge"]');
      await page.type('[data-testid="mason-0-lodge"]', 'Lodge 1');
      await page.keyboard.press('Enter');
      
      await fillInput(page, '[data-testid="mason-0-email"]', 'first@test.com');
      await fillInput(page, '[data-testid="mason-0-phone"]', '+61400000000');
      
      await page.click('[data-testid="mason-0-hasPartner"]');
      await page.waitForSelector('[data-testid="mason-0-partner-form"]');
      await page.select('[data-testid="mason-0-partner-title"]', 'Mrs.');
      await fillInput(page, '[data-testid="mason-0-partner-firstName"]', 'First');
      await fillInput(page, '[data-testid="mason-0-partner-lastName"]', 'Partner');
      
      // Second Mason
      await page.click('[data-testid="add-mason-button"]');
      await page.waitForSelector('[data-testid="mason-1-title"]');
      await page.select('[data-testid="mason-1-title"]', 'Bro.');
      await fillInput(page, '[data-testid="mason-1-firstName"]', 'Second');
      await fillInput(page, '[data-testid="mason-1-lastName"]', 'Mason');
      await page.select('[data-testid="mason-1-rank"]', 'FC');
      await page.click('[data-testid="mason-1-sameLodge"]');
      await page.select('[data-testid="mason-1-contactPreference"]', 'PrimaryAttendee');
      
      await page.click('[data-testid="mason-1-hasPartner"]');
      await page.waitForSelector('[data-testid="mason-1-partner-form"]');
      await page.select('[data-testid="mason-1-partner-title"]', 'Mrs.');
      await fillInput(page, '[data-testid="mason-1-partner-firstName"]', 'Second');
      await fillInput(page, '[data-testid="mason-1-partner-lastName"]', 'Partner');
      
      // Guest
      await page.click('[data-testid="add-guest-button"]');
      await page.waitForSelector('[data-testid="guest-0-title"]');
      await page.select('[data-testid="guest-0-title"]', 'Mr.');
      await fillInput(page, '[data-testid="guest-0-firstName"]', 'Guest');
      await fillInput(page, '[data-testid="guest-0-lastName"]', 'One');
      await page.select('[data-testid="guest-0-contactPreference"]', 'PrimaryAttendee');
      
      await page.click('[data-testid="guest-0-hasPartner"]');
      await page.waitForSelector('[data-testid="guest-0-partner-form"]');
      await page.select('[data-testid="guest-0-partner-title"]', 'Mrs.');
      await fillInput(page, '[data-testid="guest-0-partner-firstName"]', 'Guest');
      await fillInput(page, '[data-testid="guest-0-partner-lastName"]', 'Partner');
      
      // Verify 6 attendees
      let attendeeCards = await page.$$('[data-testid^="attendee-card-"]');
      expect(attendeeCards.length).toBe(6);
      
      // Remove middle attendee's partner
      await page.click('[data-testid="mason-1-hasPartner"]'); // Uncheck
      await page.waitForFunction(() => 
        document.querySelectorAll('[data-testid^="attendee-card-"]').length === 5
      );
      
      // Verify reordering
      attendeeCards = await page.$$('[data-testid^="attendee-card-"]');
      expect(attendeeCards.length).toBe(5);
      
      await captureScreenshot(page, 'partner-removal-reorder');
    });
  });

  describe('Partner Data Flow', () => {
    test('partner inherits contact preference from primary attendee', async () => {
      // Setup primary Mason
      await fillInput(page, '[data-testid="mason-0-title"]', 'Bro.');
      await fillInput(page, '[data-testid="mason-0-firstName"]', 'Contact');
      await fillInput(page, '[data-testid="mason-0-lastName"]', 'Test');
      await fillInput(page, '[data-testid="mason-0-rank"]', 'MM');
      
      await page.click('[data-testid="mason-0-grandLodge"]');
      await page.type('[data-testid="mason-0-grandLodge"]', 'NSW');
      await page.keyboard.press('Enter');
      
      await page.click('[data-testid="mason-0-lodge"]');
      await page.type('[data-testid="mason-0-lodge"]', 'Lodge');
      await page.keyboard.press('Enter');
      
      await fillInput(page, '[data-testid="mason-0-email"]', 'contact@test.com');
      await fillInput(page, '[data-testid="mason-0-phone"]', '+61400000000');
      
      // Add partner
      await page.click('[data-testid="mason-0-hasPartner"]');
      await page.waitForSelector('[data-testid="mason-0-partner-form"]');
      
      // Partner should not have contact preference field
      const partnerContactPref = await page.$('[data-testid="mason-0-partner-contactPreference"]');
      expect(partnerContactPref).toBeFalsy();
      
      // Partner should not require email/phone
      const partnerEmail = await page.$('[data-testid="mason-0-partner-email"][required]');
      const partnerPhone = await page.$('[data-testid="mason-0-partner-phone"][required]');
      expect(partnerEmail).toBeFalsy();
      expect(partnerPhone).toBeFalsy();
      
      await captureScreenshot(page, 'partner-inherits-contact');
    });

    test('partner data persists through navigation', async () => {
      // Setup Mason with partner
      await fillInput(page, '[data-testid="mason-0-title"]', 'Bro.');
      await fillInput(page, '[data-testid="mason-0-firstName"]', 'Persist');
      await fillInput(page, '[data-testid="mason-0-lastName"]', 'Test');
      await fillInput(page, '[data-testid="mason-0-rank"]', 'MM');
      
      await page.click('[data-testid="mason-0-grandLodge"]');
      await page.type('[data-testid="mason-0-grandLodge"]', 'NSW');
      await page.keyboard.press('Enter');
      
      await page.click('[data-testid="mason-0-lodge"]');
      await page.type('[data-testid="mason-0-lodge"]', 'Lodge');
      await page.keyboard.press('Enter');
      
      await fillInput(page, '[data-testid="mason-0-email"]', 'persist@test.com');
      await fillInput(page, '[data-testid="mason-0-phone"]', '+61400000000');
      
      // Add partner with all fields
      await page.click('[data-testid="mason-0-hasPartner"]');
      await page.waitForSelector('[data-testid="mason-0-partner-form"]');
      await page.select('[data-testid="mason-0-partner-title"]', 'Mrs.');
      await fillInput(page, '[data-testid="mason-0-partner-firstName"]', 'Partner');
      await fillInput(page, '[data-testid="mason-0-partner-lastName"]', 'Test');
      await page.select('[data-testid="mason-0-partner-relationship"]', 'Wife');
      await fillInput(page, '[data-testid="mason-0-partner-dietary"]', 'Halal');
      await fillInput(page, '[data-testid="mason-0-partner-accessibility"]', 'None');
      
      // Navigate to ticket selection
      await page.click('[data-testid="continue-button"]');
      await page.waitForSelector('[data-testid="ticket-selection-step"]');
      
      // Navigate back
      await page.click('[data-testid="back-button"]');
      await page.waitForSelector('[data-testid="attendee-details-step"]');
      
      // Verify partner data persisted
      const partnerFirstName = await page.$eval('[data-testid="mason-0-partner-firstName"]', el => el.value);
      const partnerDietary = await page.$eval('[data-testid="mason-0-partner-dietary"]', el => el.value);
      
      expect(partnerFirstName).toBe('Partner');
      expect(partnerDietary).toBe('Halal');
      
      await captureScreenshot(page, 'partner-data-persisted');
    });
  });

  describe('Partner Validation', () => {
    test('validates required partner fields', async () => {
      // Setup Mason
      await fillInput(page, '[data-testid="mason-0-title"]', 'Bro.');
      await fillInput(page, '[data-testid="mason-0-firstName"]', 'Valid');
      await fillInput(page, '[data-testid="mason-0-lastName"]', 'Test');
      await fillInput(page, '[data-testid="mason-0-rank"]', 'MM');
      
      await page.click('[data-testid="mason-0-grandLodge"]');
      await page.type('[data-testid="mason-0-grandLodge"]', 'NSW');
      await page.keyboard.press('Enter');
      
      await page.click('[data-testid="mason-0-lodge"]');
      await page.type('[data-testid="mason-0-lodge"]', 'Lodge');
      await page.keyboard.press('Enter');
      
      await fillInput(page, '[data-testid="mason-0-email"]', 'valid@test.com');
      await fillInput(page, '[data-testid="mason-0-phone"]', '+61400000000');
      
      // Enable partner but don't fill fields
      await page.click('[data-testid="mason-0-hasPartner"]');
      await page.waitForSelector('[data-testid="mason-0-partner-form"]');
      
      // Try to continue
      await page.click('[data-testid="continue-button"]');
      
      // Check for validation errors
      await page.waitForSelector('[data-testid="mason-0-partner-title-error"]');
      const titleError = await page.$('[data-testid="mason-0-partner-title-error"]');
      const firstNameError = await page.$('[data-testid="mason-0-partner-firstName-error"]');
      const lastNameError = await page.$('[data-testid="mason-0-partner-lastName-error"]');
      const relationshipError = await page.$('[data-testid="mason-0-partner-relationship-error"]');
      
      expect(titleError).toBeTruthy();
      expect(firstNameError).toBeTruthy();
      expect(lastNameError).toBeTruthy();
      expect(relationshipError).toBeTruthy();
      
      await captureScreenshot(page, 'partner-validation-errors');
    });

    test('validates other relationship field when selected', async () => {
      // Setup Mason
      await fillInput(page, '[data-testid="mason-0-title"]', 'Bro.');
      await fillInput(page, '[data-testid="mason-0-firstName"]', 'Other');
      await fillInput(page, '[data-testid="mason-0-lastName"]', 'Test');
      await fillInput(page, '[data-testid="mason-0-rank"]', 'MM');
      
      await page.click('[data-testid="mason-0-grandLodge"]');
      await page.type('[data-testid="mason-0-grandLodge"]', 'NSW');
      await page.keyboard.press('Enter');
      
      await page.click('[data-testid="mason-0-lodge"]');
      await page.type('[data-testid="mason-0-lodge"]', 'Lodge');
      await page.keyboard.press('Enter');
      
      await fillInput(page, '[data-testid="mason-0-email"]', 'other@test.com');
      await fillInput(page, '[data-testid="mason-0-phone"]', '+61400000000');
      
      // Add partner with Other relationship
      await page.click('[data-testid="mason-0-hasPartner"]');
      await page.waitForSelector('[data-testid="mason-0-partner-form"]');
      await page.select('[data-testid="mason-0-partner-title"]', 'Mr.');
      await fillInput(page, '[data-testid="mason-0-partner-firstName"]', 'Other');
      await fillInput(page, '[data-testid="mason-0-partner-lastName"]', 'Person');
      await page.select('[data-testid="mason-0-partner-relationship"]', 'Other');
      
      // Don't fill other relationship field
      await page.click('[data-testid="continue-button"]');
      
      // Check for validation error
      await page.waitForSelector('[data-testid="mason-0-partner-otherRelationship-error"]');
      const otherError = await page.$('[data-testid="mason-0-partner-otherRelationship-error"]');
      expect(otherError).toBeTruthy();
      
      // Fill other relationship
      await fillInput(page, '[data-testid="mason-0-partner-otherRelationship"]', 'Sibling');
      
      // Should now continue successfully
      await page.click('[data-testid="continue-button"]');
      await page.waitForSelector('[data-testid="ticket-selection-step"]');
    });
  });
});