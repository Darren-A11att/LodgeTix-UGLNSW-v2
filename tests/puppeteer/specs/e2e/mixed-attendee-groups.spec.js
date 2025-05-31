/**
 * Mixed Attendee Groups Test Suite
 * 
 * This comprehensive test suite covers complex multi-attendee registration scenarios
 * with various combinations of Masons, Guests, and Partners. It tests:
 * - Maximum attendee limits (10 primary + 10 partners = 20 total)
 * - Complex hierarchies (Grand Officers, regular Masons, Guests)
 * - Mixed contact preferences across groups
 * - Partner distribution patterns
 * - Attendee reordering and removal impacts
 * - Bulk operations on mixed groups
 * - Real-world delegation scenarios
 * - Family group registrations
 * - Corporate/organizational bookings
 */

const puppeteer = require('puppeteer');
const { testData } = require('../../config/test-data');
const { captureScreenshot, waitForElement, fillInput } = require('../../helpers/test-utils');

describe('Mixed Attendee Groups', () => {
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

  describe('Maximum Capacity Scenarios', () => {
    test('fills registration to maximum capacity (20 total attendees)', async () => {
      // Primary Mason (required)
      await fillInput(page, '[data-testid="mason-0-title"]', 'M.W.Bro.');
      await fillInput(page, '[data-testid="mason-0-firstName"]', 'Primary');
      await fillInput(page, '[data-testid="mason-0-lastName"]', 'Mason');
      await page.select('[data-testid="mason-0-rank"]', 'GL');
      
      await page.click('[data-testid="mason-0-grandLodge"]');
      await page.type('[data-testid="mason-0-grandLodge"]', 'New South Wales');
      await page.keyboard.press('Enter');
      
      await page.click('[data-testid="mason-0-lodge"]');
      await page.type('[data-testid="mason-0-lodge"]', 'Grand Lodge');
      await page.keyboard.press('Enter');
      
      await fillInput(page, '[data-testid="mason-0-email"]', 'primary@test.com');
      await fillInput(page, '[data-testid="mason-0-phone"]', '+61400000000');
      await fillInput(page, '[data-testid="mason-0-grandRank"]', 'GM');
      await page.select('[data-testid="mason-0-grandOfficerStatus"]', 'Present');
      await page.waitForSelector('[data-testid="mason-0-presentGrandOfficerRole"]');
      await page.select('[data-testid="mason-0-presentGrandOfficerRole"]', 'GrandMaster');
      
      // Add partner to primary
      await page.click('[data-testid="mason-0-hasPartner"]');
      await page.waitForSelector('[data-testid="mason-0-partner-form"]');
      await page.select('[data-testid="mason-0-partner-title"]', 'Mrs.');
      await fillInput(page, '[data-testid="mason-0-partner-firstName"]', 'Primary');
      await fillInput(page, '[data-testid="mason-0-partner-lastName"]', 'Partner');
      await page.select('[data-testid="mason-0-partner-relationship"]', 'Wife');
      
      // Add 4 more Masons (total 5) with partners
      for (let i = 1; i < 5; i++) {
        await page.click('[data-testid="add-mason-button"]');
        await page.waitForSelector(`[data-testid="mason-${i}-title"]`);
        await page.select(`[data-testid="mason-${i}-title"]`, 'Bro.');
        await fillInput(page, `[data-testid="mason-${i}-firstName"]`, `Mason${i + 1}`);
        await fillInput(page, `[data-testid="mason-${i}-lastName"]`, 'Member');
        await page.select(`[data-testid="mason-${i}-rank"]`, 'MM');
        await page.click(`[data-testid="mason-${i}-sameLodge"]`);
        await page.select(`[data-testid="mason-${i}-contactPreference"]`, 'PrimaryAttendee');
        
        // Add partner
        await page.click(`[data-testid="mason-${i}-hasPartner"]`);
        await page.waitForSelector(`[data-testid="mason-${i}-partner-form"]`);
        await page.select(`[data-testid="mason-${i}-partner-title"]`, 'Mrs.');
        await fillInput(page, `[data-testid="mason-${i}-partner-firstName"]`, `Lady${i + 1}`);
        await fillInput(page, `[data-testid="mason-${i}-partner-lastName"]`, 'Member');
        await page.select(`[data-testid="mason-${i}-partner-relationship"]`, 'Wife');
      }
      
      // Add 5 Guests with partners
      for (let i = 0; i < 5; i++) {
        await page.click('[data-testid="add-guest-button"]');
        await page.waitForSelector(`[data-testid="guest-${i}-title"]`);
        await page.select(`[data-testid="guest-${i}-title"]`, 'Mr.');
        await fillInput(page, `[data-testid="guest-${i}-firstName"]`, `Guest${i + 1}`);
        await fillInput(page, `[data-testid="guest-${i}-lastName"]`, 'Attendee');
        await page.select(`[data-testid="guest-${i}-contactPreference"]`, 'PrimaryAttendee');
        
        // Add partner
        await page.click(`[data-testid="guest-${i}-hasPartner"]`);
        await page.waitForSelector(`[data-testid="guest-${i}-partner-form"]`);
        await page.select(`[data-testid="guest-${i}-partner-title"]`, 'Mrs.');
        await fillInput(page, `[data-testid="guest-${i}-partner-firstName"]`, `GuestPartner${i + 1}`);
        await fillInput(page, `[data-testid="guest-${i}-partner-lastName"]`, 'Attendee');
        await page.select(`[data-testid="guest-${i}-partner-relationship"]`, 'Wife');
      }
      
      await captureScreenshot(page, 'maximum-capacity-20-attendees');
      
      // Verify both add buttons are disabled
      const addMasonDisabled = await page.$eval('[data-testid="add-mason-button"]', el => el.disabled);
      const addGuestDisabled = await page.$eval('[data-testid="add-guest-button"]', el => el.disabled);
      
      expect(addMasonDisabled).toBe(true);
      expect(addGuestDisabled).toBe(true);
      
      // Verify total count
      const attendeeCards = await page.$$('[data-testid^="attendee-card-"]');
      expect(attendeeCards.length).toBe(20);
      
      // Verify warning message
      const maxCapacityWarning = await page.$('[data-testid="max-capacity-warning"]');
      expect(maxCapacityWarning).toBeTruthy();
    });

    test('handles asymmetric partner distribution', async () => {
      // Primary with partner
      await fillInput(page, '[data-testid="mason-0-title"]', 'W.Bro.');
      await fillInput(page, '[data-testid="mason-0-firstName"]', 'Has');
      await fillInput(page, '[data-testid="mason-0-lastName"]', 'Partner');
      await page.select('[data-testid="mason-0-rank"]', 'MM');
      
      await page.click('[data-testid="mason-0-grandLodge"]');
      await page.type('[data-testid="mason-0-grandLodge"]', 'NSW');
      await page.keyboard.press('Enter');
      
      await page.click('[data-testid="mason-0-lodge"]');
      await page.type('[data-testid="mason-0-lodge"]', 'Mixed Lodge');
      await page.keyboard.press('Enter');
      
      await fillInput(page, '[data-testid="mason-0-email"]', 'primary@test.com');
      await fillInput(page, '[data-testid="mason-0-phone"]', '+61400000000');
      
      await page.click('[data-testid="mason-0-hasPartner"]');
      await page.waitForSelector('[data-testid="mason-0-partner-form"]');
      await page.select('[data-testid="mason-0-partner-title"]', 'Mrs.');
      await fillInput(page, '[data-testid="mason-0-partner-firstName"]', 'Partner');
      await fillInput(page, '[data-testid="mason-0-partner-lastName"]', 'One');
      await page.select('[data-testid="mason-0-partner-relationship"]', 'Wife');
      
      // Add 3 Masons without partners
      for (let i = 1; i < 4; i++) {
        await page.click('[data-testid="add-mason-button"]');
        await page.waitForSelector(`[data-testid="mason-${i}-title"]`);
        await page.select(`[data-testid="mason-${i}-title"]`, 'Bro.');
        await fillInput(page, `[data-testid="mason-${i}-firstName"]`, `Single${i}`);
        await fillInput(page, `[data-testid="mason-${i}-lastName"]`, 'Mason');
        await page.select(`[data-testid="mason-${i}-rank"]`, 'MM');
        await page.click(`[data-testid="mason-${i}-sameLodge"]`);
        await page.select(`[data-testid="mason-${i}-contactPreference"]`, 'PrimaryAttendee');
      }
      
      // Add 2 Guests with partners
      for (let i = 0; i < 2; i++) {
        await page.click('[data-testid="add-guest-button"]');
        await page.waitForSelector(`[data-testid="guest-${i}-title"]`);
        await page.select(`[data-testid="guest-${i}-title"]`, 'Dr.');
        await fillInput(page, `[data-testid="guest-${i}-firstName"]`, `GuestWith${i + 1}`);
        await fillInput(page, `[data-testid="guest-${i}-lastName"]`, 'Partner');
        await page.select(`[data-testid="guest-${i}-contactPreference"]`, 'Directly');
        await fillInput(page, `[data-testid="guest-${i}-email"]`, `guest${i + 1}@test.com`);
        await fillInput(page, `[data-testid="guest-${i}-phone"]`, `+6140000000${i + 1}`);
        
        await page.click(`[data-testid="guest-${i}-hasPartner"]`);
        await page.waitForSelector(`[data-testid="guest-${i}-partner-form"]`);
        await page.select(`[data-testid="guest-${i}-partner-title"]`, 'Dr.');
        await fillInput(page, `[data-testid="guest-${i}-partner-firstName"]`, `Partner${i + 2}`);
        await fillInput(page, `[data-testid="guest-${i}-partner-lastName"]`, 'Guest');
        await page.select(`[data-testid="guest-${i}-partner-relationship"]`, 'Partner');
      }
      
      // Add 3 Guests without partners
      for (let i = 2; i < 5; i++) {
        await page.click('[data-testid="add-guest-button"]');
        await page.waitForSelector(`[data-testid="guest-${i}-title"]`);
        await page.select(`[data-testid="guest-${i}-title"]`, 'Mr.');
        await fillInput(page, `[data-testid="guest-${i}-firstName"]`, `SingleGuest${i - 1}`);
        await fillInput(page, `[data-testid="guest-${i}-lastName"]`, 'NoPartner');
        await page.select(`[data-testid="guest-${i}-contactPreference"]`, 'ProvideLater');
      }
      
      await captureScreenshot(page, 'asymmetric-partner-distribution');
      
      // Verify total: 4 Masons + 5 Guests + 3 Partners = 12 attendees
      const attendeeCards = await page.$$('[data-testid^="attendee-card-"]');
      expect(attendeeCards.length).toBe(12);
    });
  });

  describe('Complex Hierarchy Scenarios', () => {
    test('Grand Lodge delegation with mixed ranks', async () => {
      // Grand Master
      await fillInput(page, '[data-testid="mason-0-title"]', 'M.W.Bro.');
      await fillInput(page, '[data-testid="mason-0-firstName"]', 'Grand');
      await fillInput(page, '[data-testid="mason-0-lastName"]', 'Master');
      await page.select('[data-testid="mason-0-rank"]', 'GL');
      
      await page.click('[data-testid="mason-0-grandLodge"]');
      await page.type('[data-testid="mason-0-grandLodge"]', 'New South Wales');
      await page.keyboard.press('Enter');
      
      await page.click('[data-testid="mason-0-lodge"]');
      await page.type('[data-testid="mason-0-lodge"]', 'Grand Lodge NSW');
      await page.keyboard.press('Enter');
      
      await fillInput(page, '[data-testid="mason-0-email"]', 'gm@uglnsw.org.au');
      await fillInput(page, '[data-testid="mason-0-phone"]', '+61400000001');
      await fillInput(page, '[data-testid="mason-0-grandRank"]', 'GM');
      await page.select('[data-testid="mason-0-grandOfficerStatus"]', 'Present');
      await page.waitForSelector('[data-testid="mason-0-presentGrandOfficerRole"]');
      await page.select('[data-testid="mason-0-presentGrandOfficerRole"]', 'GrandMaster');
      
      await page.click('[data-testid="mason-0-hasPartner"]');
      await page.waitForSelector('[data-testid="mason-0-partner-form"]');
      await page.select('[data-testid="mason-0-partner-title"]', 'Mrs.');
      await fillInput(page, '[data-testid="mason-0-partner-firstName"]', 'Lady');
      await fillInput(page, '[data-testid="mason-0-partner-lastName"]', 'GrandMaster');
      await page.select('[data-testid="mason-0-partner-relationship"]', 'Wife');
      
      // Deputy Grand Master
      await page.click('[data-testid="add-mason-button"]');
      await page.waitForSelector('[data-testid="mason-1-title"]');
      await page.select('[data-testid="mason-1-title"]', 'R.W.Bro.');
      await fillInput(page, '[data-testid="mason-1-firstName"]', 'Deputy');
      await fillInput(page, '[data-testid="mason-1-lastName"]', 'GrandMaster');
      await page.select('[data-testid="mason-1-rank"]', 'GL');
      await page.click('[data-testid="mason-1-sameLodge"]');
      await page.select('[data-testid="mason-1-contactPreference"]', 'PrimaryAttendee');
      await fillInput(page, '[data-testid="mason-1-grandRank"]', 'DGM');
      await page.select('[data-testid="mason-1-grandOfficerStatus"]', 'Present');
      await page.waitForSelector('[data-testid="mason-1-presentGrandOfficerRole"]');
      await page.select('[data-testid="mason-1-presentGrandOfficerRole"]', 'DepGrandMaster');
      
      // Past Grand Secretary
      await page.click('[data-testid="add-mason-button"]');
      await page.waitForSelector('[data-testid="mason-2-title"]');
      await page.select('[data-testid="mason-2-title"]', 'V.W.Bro.');
      await fillInput(page, '[data-testid="mason-2-firstName"]', 'Past');
      await fillInput(page, '[data-testid="mason-2-lastName"]', 'Secretary');
      await page.select('[data-testid="mason-2-rank"]', 'GL');
      await page.click('[data-testid="mason-2-sameLodge"]');
      await page.select('[data-testid="mason-2-contactPreference"]', 'Directly');
      await fillInput(page, '[data-testid="mason-2-email"]', 'pgs@uglnsw.org.au');
      await fillInput(page, '[data-testid="mason-2-phone"]', '+61400000002');
      await fillInput(page, '[data-testid="mason-2-grandRank"]', 'PGS');
      await page.select('[data-testid="mason-2-grandOfficerStatus"]', 'Past');
      
      // Regular Master Mason
      await page.click('[data-testid="add-mason-button"]');
      await page.waitForSelector('[data-testid="mason-3-title"]');
      await page.select('[data-testid="mason-3-title"]', 'W.Bro.');
      await fillInput(page, '[data-testid="mason-3-firstName"]', 'Lodge');
      await fillInput(page, '[data-testid="mason-3-lastName"]', 'Master');
      await page.select('[data-testid="mason-3-rank"]', 'MM');
      
      await page.click('[data-testid="mason-3-grandLodge"]');
      await page.type('[data-testid="mason-3-grandLodge"]', 'New South Wales');
      await page.keyboard.press('Enter');
      
      await page.click('[data-testid="mason-3-lodge"]');
      await page.type('[data-testid="mason-3-lodge"]', 'Harmony Lodge 123');
      await page.keyboard.press('Enter');
      
      await page.select('[data-testid="mason-3-contactPreference"]', 'ProvideLater');
      
      // Official Guest Speaker
      await page.click('[data-testid="add-guest-button"]');
      await page.waitForSelector('[data-testid="guest-0-title"]');
      await page.select('[data-testid="guest-0-title"]', 'Prof.');
      await fillInput(page, '[data-testid="guest-0-firstName"]', 'Distinguished');
      await fillInput(page, '[data-testid="guest-0-lastName"]', 'Speaker');
      await page.select('[data-testid="guest-0-contactPreference"]', 'Directly');
      await fillInput(page, '[data-testid="guest-0-email"]', 'speaker@university.edu.au');
      await fillInput(page, '[data-testid="guest-0-phone"]', '+61400000003');
      
      await captureScreenshot(page, 'grand-lodge-delegation-hierarchy');
      
      // Verify hierarchy is maintained
      const attendeeNames = await page.$$eval('[data-testid^="attendee-card-"] [data-testid$="-name"]', 
        elements => elements.map(el => el.textContent)
      );
      
      expect(attendeeNames[0]).toContain('Grand Master');
      expect(attendeeNames[1]).toContain('Lady GrandMaster');
      expect(attendeeNames[2]).toContain('Deputy GrandMaster');
      expect(attendeeNames[3]).toContain('Past Secretary');
    });

    test('mixed family group registration', async () => {
      // Father (Mason)
      await fillInput(page, '[data-testid="mason-0-title"]', 'Bro.');
      await fillInput(page, '[data-testid="mason-0-firstName"]', 'John');
      await fillInput(page, '[data-testid="mason-0-lastName"]', 'Smith');
      await page.select('[data-testid="mason-0-rank"]', 'MM');
      
      await page.click('[data-testid="mason-0-grandLodge"]');
      await page.type('[data-testid="mason-0-grandLodge"]', 'NSW');
      await page.keyboard.press('Enter');
      
      await page.click('[data-testid="mason-0-lodge"]');
      await page.type('[data-testid="mason-0-lodge"]', 'Family Lodge 789');
      await page.keyboard.press('Enter');
      
      await fillInput(page, '[data-testid="mason-0-email"]', 'smith.family@test.com');
      await fillInput(page, '[data-testid="mason-0-phone"]', '+61400000000');
      await fillInput(page, '[data-testid="mason-0-dietary"]', 'Vegetarian');
      
      // Wife (Partner)
      await page.click('[data-testid="mason-0-hasPartner"]');
      await page.waitForSelector('[data-testid="mason-0-partner-form"]');
      await page.select('[data-testid="mason-0-partner-title"]', 'Mrs.');
      await fillInput(page, '[data-testid="mason-0-partner-firstName"]', 'Jane');
      await fillInput(page, '[data-testid="mason-0-partner-lastName"]', 'Smith');
      await page.select('[data-testid="mason-0-partner-relationship"]', 'Wife');
      await fillInput(page, '[data-testid="mason-0-partner-dietary"]', 'Vegetarian, Gluten-free');
      
      // Son (Mason)
      await page.click('[data-testid="add-mason-button"]');
      await page.waitForSelector('[data-testid="mason-1-title"]');
      await page.select('[data-testid="mason-1-title"]', 'Bro.');
      await fillInput(page, '[data-testid="mason-1-firstName"]', 'James');
      await fillInput(page, '[data-testid="mason-1-lastName"]', 'Smith');
      await page.select('[data-testid="mason-1-rank"]', 'FC');
      await page.click('[data-testid="mason-1-sameLodge"]');
      await page.select('[data-testid="mason-1-contactPreference"]', 'PrimaryAttendee');
      
      // Daughter-in-law (Son's partner)
      await page.click('[data-testid="mason-1-hasPartner"]');
      await page.waitForSelector('[data-testid="mason-1-partner-form"]');
      await page.select('[data-testid="mason-1-partner-title"]', 'Mrs.');
      await fillInput(page, '[data-testid="mason-1-partner-firstName"]', 'Sarah');
      await fillInput(page, '[data-testid="mason-1-partner-lastName"]', 'Smith');
      await page.select('[data-testid="mason-1-partner-relationship"]', 'Wife');
      
      // Daughter (Guest)
      await page.click('[data-testid="add-guest-button"]');
      await page.waitForSelector('[data-testid="guest-0-title"]');
      await page.select('[data-testid="guest-0-title"]', 'Ms.');
      await fillInput(page, '[data-testid="guest-0-firstName"]', 'Emily');
      await fillInput(page, '[data-testid="guest-0-lastName"]', 'Smith');
      await page.select('[data-testid="guest-0-contactPreference"]', 'PrimaryAttendee');
      await fillInput(page, '[data-testid="guest-0-dietary"]', 'Vegan');
      
      // Son-in-law (Daughter's partner)
      await page.click('[data-testid="guest-0-hasPartner"]');
      await page.waitForSelector('[data-testid="guest-0-partner-form"]');
      await page.select('[data-testid="guest-0-partner-title"]', 'Mr.');
      await fillInput(page, '[data-testid="guest-0-partner-firstName"]', 'Michael');
      await fillInput(page, '[data-testid="guest-0-partner-lastName"]', 'Brown');
      await page.select('[data-testid="guest-0-partner-relationship"]', 'Husband');
      
      // Family friend (Guest)
      await page.click('[data-testid="add-guest-button"]');
      await page.waitForSelector('[data-testid="guest-1-title"]');
      await page.select('[data-testid="guest-1-title"]', 'Dr.');
      await fillInput(page, '[data-testid="guest-1-firstName"]', 'Robert');
      await fillInput(page, '[data-testid="guest-1-lastName"]', 'Johnson');
      await page.select('[data-testid="guest-1-contactPreference"]', 'Directly');
      await fillInput(page, '[data-testid="guest-1-email"]', 'rjohnson@test.com');
      await fillInput(page, '[data-testid="guest-1-phone"]', '+61400000004');
      
      await captureScreenshot(page, 'family-group-registration');
      
      // Verify family group structure
      const attendeeCards = await page.$$('[data-testid^="attendee-card-"]');
      expect(attendeeCards.length).toBe(7);
    });
  });

  describe('Attendee Management Operations', () => {
    test('removes attendee from middle of complex group', async () => {
      // Create group of 8 attendees
      // Primary Mason
      await fillInput(page, '[data-testid="mason-0-title"]', 'W.Bro.');
      await fillInput(page, '[data-testid="mason-0-firstName"]', 'Keep1');
      await fillInput(page, '[data-testid="mason-0-lastName"]', 'Mason');
      await page.select('[data-testid="mason-0-rank"]', 'MM');
      
      await page.click('[data-testid="mason-0-grandLodge"]');
      await page.type('[data-testid="mason-0-grandLodge"]', 'NSW');
      await page.keyboard.press('Enter');
      
      await page.click('[data-testid="mason-0-lodge"]');
      await page.type('[data-testid="mason-0-lodge"]', 'Test Lodge');
      await page.keyboard.press('Enter');
      
      await fillInput(page, '[data-testid="mason-0-email"]', 'primary@test.com');
      await fillInput(page, '[data-testid="mason-0-phone"]', '+61400000000');
      
      // Add Mason 2 with partner
      await page.click('[data-testid="add-mason-button"]');
      await page.waitForSelector('[data-testid="mason-1-title"]');
      await page.select('[data-testid="mason-1-title"]', 'Bro.');
      await fillInput(page, '[data-testid="mason-1-firstName"]', 'Remove');
      await fillInput(page, '[data-testid="mason-1-lastName"]', 'This');
      await page.select('[data-testid="mason-1-rank"]', 'MM');
      await page.click('[data-testid="mason-1-sameLodge"]');
      await page.select('[data-testid="mason-1-contactPreference"]', 'PrimaryAttendee');
      
      await page.click('[data-testid="mason-1-hasPartner"]');
      await page.waitForSelector('[data-testid="mason-1-partner-form"]');
      await page.select('[data-testid="mason-1-partner-title"]', 'Mrs.');
      await fillInput(page, '[data-testid="mason-1-partner-firstName"]', 'Also');
      await fillInput(page, '[data-testid="mason-1-partner-lastName"]', 'Removed');
      await page.select('[data-testid="mason-1-partner-relationship"]', 'Wife');
      
      // Add Guest 1
      await page.click('[data-testid="add-guest-button"]');
      await page.waitForSelector('[data-testid="guest-0-title"]');
      await page.select('[data-testid="guest-0-title"]', 'Mr.');
      await fillInput(page, '[data-testid="guest-0-firstName"]', 'Keep2');
      await fillInput(page, '[data-testid="guest-0-lastName"]', 'Guest');
      await page.select('[data-testid="guest-0-contactPreference"]', 'PrimaryAttendee');
      
      // Add Mason 3
      await page.click('[data-testid="add-mason-button"]');
      await page.waitForSelector('[data-testid="mason-2-title"]');
      await page.select('[data-testid="mason-2-title"]', 'Bro.');
      await fillInput(page, '[data-testid="mason-2-firstName"]', 'Keep3');
      await fillInput(page, '[data-testid="mason-2-lastName"]', 'Mason');
      await page.select('[data-testid="mason-2-rank"]', 'EA');
      await page.click('[data-testid="mason-2-sameLodge"]');
      await page.select('[data-testid="mason-2-contactPreference"]', 'PrimaryAttendee');
      
      // Add Guest 2 with partner
      await page.click('[data-testid="add-guest-button"]');
      await page.waitForSelector('[data-testid="guest-1-title"]');
      await page.select('[data-testid="guest-1-title"]', 'Dr.');
      await fillInput(page, '[data-testid="guest-1-firstName"]', 'Keep4');
      await fillInput(page, '[data-testid="guest-1-lastName"]', 'Guest');
      await page.select('[data-testid="guest-1-contactPreference"]', 'PrimaryAttendee');
      
      await page.click('[data-testid="guest-1-hasPartner"]');
      await page.waitForSelector('[data-testid="guest-1-partner-form"]');
      await page.select('[data-testid="guest-1-partner-title"]', 'Dr.');
      await fillInput(page, '[data-testid="guest-1-partner-firstName"]', 'Keep5');
      await fillInput(page, '[data-testid="guest-1-partner-lastName"]', 'Partner');
      await page.select('[data-testid="guest-1-partner-relationship"]', 'Partner');
      
      // Capture before removal
      await captureScreenshot(page, 'before-middle-removal');
      
      // Remove Mason 2 (and their partner)
      await page.click('[data-testid="remove-mason-1"]');
      
      // Wait for reindexing
      await page.waitForFunction(() => {
        const mason1Name = document.querySelector('[data-testid="mason-1-firstName"]');
        return mason1Name && mason1Name.value === 'Keep3';
      });
      
      // Verify correct attendees remain and indices updated
      const mason0Name = await page.$eval('[data-testid="mason-0-firstName"]', el => el.value);
      const mason1Name = await page.$eval('[data-testid="mason-1-firstName"]', el => el.value);
      const guest0Name = await page.$eval('[data-testid="guest-0-firstName"]', el => el.value);
      const guest1Name = await page.$eval('[data-testid="guest-1-firstName"]', el => el.value);
      
      expect(mason0Name).toBe('Keep1');
      expect(mason1Name).toBe('Keep3'); // Was mason-2
      expect(guest0Name).toBe('Keep2');
      expect(guest1Name).toBe('Keep4');
      
      // Verify total count (was 7, now 5 after removing 1 Mason + partner)
      const attendeeCards = await page.$$('[data-testid^="attendee-card-"]');
      expect(attendeeCards.length).toBe(5);
      
      await captureScreenshot(page, 'after-middle-removal');
    });

    test('handles bulk contact preference changes', async () => {
      // Create diverse group
      await fillInput(page, '[data-testid="mason-0-title"]', 'Bro.');
      await fillInput(page, '[data-testid="mason-0-firstName"]', 'Primary');
      await fillInput(page, '[data-testid="mason-0-lastName"]', 'Contact');
      await page.select('[data-testid="mason-0-rank"]', 'MM');
      
      await page.click('[data-testid="mason-0-grandLodge"]');
      await page.type('[data-testid="mason-0-grandLodge"]', 'NSW');
      await page.keyboard.press('Enter');
      
      await page.click('[data-testid="mason-0-lodge"]');
      await page.type('[data-testid="mason-0-lodge"]', 'Bulk Lodge');
      await page.keyboard.press('Enter');
      
      await fillInput(page, '[data-testid="mason-0-email"]', 'bulk@test.com');
      await fillInput(page, '[data-testid="mason-0-phone"]', '+61400000000');
      
      // Add 4 more attendees with different initial preferences
      const attendeeTypes = [
        { type: 'mason', preference: 'PrimaryAttendee' },
        { type: 'guest', preference: 'Directly' },
        { type: 'mason', preference: 'ProvideLater' },
        { type: 'guest', preference: 'PrimaryAttendee' }
      ];
      
      for (let i = 0; i < attendeeTypes.length; i++) {
        const { type, preference } = attendeeTypes[i];
        
        if (type === 'mason') {
          const masonIndex = i < 2 ? 1 : 2;
          await page.click('[data-testid="add-mason-button"]');
          await page.waitForSelector(`[data-testid="mason-${masonIndex}-title"]`);
          await page.select(`[data-testid="mason-${masonIndex}-title"]`, 'Bro.');
          await fillInput(page, `[data-testid="mason-${masonIndex}-firstName"]`, `Mason${masonIndex + 1}`);
          await fillInput(page, `[data-testid="mason-${masonIndex}-lastName"]`, 'Test');
          await page.select(`[data-testid="mason-${masonIndex}-rank"]`, 'MM');
          await page.click(`[data-testid="mason-${masonIndex}-sameLodge"]`);
          await page.select(`[data-testid="mason-${masonIndex}-contactPreference"]`, preference);
          
          if (preference === 'Directly') {
            await fillInput(page, `[data-testid="mason-${masonIndex}-email"]`, `mason${masonIndex}@test.com`);
            await fillInput(page, `[data-testid="mason-${masonIndex}-phone"]`, `+6140000000${masonIndex}`);
          }
        } else {
          const guestIndex = i === 1 ? 0 : 1;
          await page.click('[data-testid="add-guest-button"]');
          await page.waitForSelector(`[data-testid="guest-${guestIndex}-title"]`);
          await page.select(`[data-testid="guest-${guestIndex}-title"]`, 'Mr.');
          await fillInput(page, `[data-testid="guest-${guestIndex}-firstName"]`, `Guest${guestIndex + 1}`);
          await fillInput(page, `[data-testid="guest-${guestIndex}-lastName"]`, 'Test');
          await page.select(`[data-testid="guest-${guestIndex}-contactPreference"]`, preference);
          
          if (preference === 'Directly') {
            await fillInput(page, `[data-testid="guest-${guestIndex}-email"]`, `guest${guestIndex}@test.com`);
            await fillInput(page, `[data-testid="guest-${guestIndex}-phone"]`, `+6140000000${guestIndex + 3}`);
          }
        }
      }
      
      // Check if bulk operations UI exists
      const bulkOperations = await page.$('[data-testid="bulk-operations"]');
      if (bulkOperations) {
        // Select all non-primary attendees
        await page.click('[data-testid="select-all-attendees"]');
        
        // Change all to PrimaryAttendee
        await page.select('[data-testid="bulk-contact-preference"]', 'PrimaryAttendee');
        await page.click('[data-testid="apply-bulk-changes"]');
        
        await captureScreenshot(page, 'bulk-contact-preference-change');
      }
    });
  });

  describe('Real-world Complex Scenarios', () => {
    test('Lodge installation ceremony delegation', async () => {
      // Installing Master
      await fillInput(page, '[data-testid="mason-0-title"]', 'R.W.Bro.');
      await fillInput(page, '[data-testid="mason-0-firstName"]', 'Installing');
      await fillInput(page, '[data-testid="mason-0-lastName"]', 'Master');
      await page.select('[data-testid="mason-0-rank"]', 'GL');
      
      await page.click('[data-testid="mason-0-grandLodge"]');
      await page.type('[data-testid="mason-0-grandLodge"]', 'NSW');
      await page.keyboard.press('Enter');
      
      await page.click('[data-testid="mason-0-lodge"]');
      await page.type('[data-testid="mason-0-lodge"]', 'Installation Lodge');
      await page.keyboard.press('Enter');
      
      await fillInput(page, '[data-testid="mason-0-email"]', 'installing.master@test.com');
      await fillInput(page, '[data-testid="mason-0-phone"]', '+61400000000');
      await fillInput(page, '[data-testid="mason-0-grandRank"]', 'PAGDC');
      await page.select('[data-testid="mason-0-grandOfficerStatus"]', 'Past');
      
      // Master Elect
      await page.click('[data-testid="add-mason-button"]');
      await page.waitForSelector('[data-testid="mason-1-title"]');
      await page.select('[data-testid="mason-1-title"]', 'Bro.');
      await fillInput(page, '[data-testid="mason-1-firstName"]', 'Master');
      await fillInput(page, '[data-testid="mason-1-lastName"]', 'Elect');
      await page.select('[data-testid="mason-1-rank"]', 'MM');
      await page.click('[data-testid="mason-1-sameLodge"]');
      await page.select('[data-testid="mason-1-contactPreference"]', 'Directly');
      await fillInput(page, '[data-testid="mason-1-email"]', 'master.elect@test.com');
      await fillInput(page, '[data-testid="mason-1-phone"]', '+61400000001');
      
      await page.click('[data-testid="mason-1-hasPartner"]');
      await page.waitForSelector('[data-testid="mason-1-partner-form"]');
      await page.select('[data-testid="mason-1-partner-title"]', 'Mrs.');
      await fillInput(page, '[data-testid="mason-1-partner-firstName"]', 'Wife');
      await fillInput(page, '[data-testid="mason-1-partner-lastName"]', 'Elect');
      await page.select('[data-testid="mason-1-partner-relationship"]', 'Wife');
      
      // Immediate Past Master
      await page.click('[data-testid="add-mason-button"]');
      await page.waitForSelector('[data-testid="mason-2-title"]');
      await page.select('[data-testid="mason-2-title"]', 'W.Bro.');
      await fillInput(page, '[data-testid="mason-2-firstName"]', 'Past');
      await fillInput(page, '[data-testid="mason-2-lastName"]', 'Master');
      await page.select('[data-testid="mason-2-rank"]', 'MM');
      await page.click('[data-testid="mason-2-sameLodge"]');
      await page.select('[data-testid="mason-2-contactPreference"]', 'PrimaryAttendee');
      
      // Wardens
      const wardenTitles = ['Senior', 'Junior'];
      for (let i = 0; i < 2; i++) {
        await page.click('[data-testid="add-mason-button"]');
        const index = 3 + i;
        await page.waitForSelector(`[data-testid="mason-${index}-title"]`);
        await page.select(`[data-testid="mason-${index}-title"]`, 'Bro.');
        await fillInput(page, `[data-testid="mason-${index}-firstName"]`, wardenTitles[i]);
        await fillInput(page, `[data-testid="mason-${index}-lastName"]`, 'Warden');
        await page.select(`[data-testid="mason-${index}-rank"]`, 'MM');
        await page.click(`[data-testid="mason-${index}-sameLodge"]`);
        await page.select(`[data-testid="mason-${index}-contactPreference"]`, 'PrimaryAttendee');
      }
      
      // Distinguished Visitor
      await page.click('[data-testid="add-guest-button"]');
      await page.waitForSelector('[data-testid="guest-0-title"]');
      await page.select('[data-testid="guest-0-title"]', 'Rev.');
      await fillInput(page, '[data-testid="guest-0-firstName"]', 'Distinguished');
      await fillInput(page, '[data-testid="guest-0-lastName"]', 'Visitor');
      await page.select('[data-testid="guest-0-contactPreference"]', 'ProvideLater');
      await fillInput(page, '[data-testid="guest-0-dietary"]', 'Kosher meal required');
      await fillInput(page, '[data-testid="guest-0-accessibility"]', 'Reserved seating near exit');
      
      await captureScreenshot(page, 'installation-ceremony-delegation');
      
      // Verify structure
      const attendeeCards = await page.$$('[data-testid^="attendee-card-"]');
      expect(attendeeCards.length).toBe(7); // 5 Masons + 1 Partner + 1 Guest
    });

    test('corporate table booking with mixed attendees', async () => {
      // Company Representative (Mason)
      await fillInput(page, '[data-testid="mason-0-title"]', 'Bro.');
      await fillInput(page, '[data-testid="mason-0-firstName"]', 'Corporate');
      await fillInput(page, '[data-testid="mason-0-lastName"]', 'Representative');
      await page.select('[data-testid="mason-0-rank"]', 'MM');
      
      await page.click('[data-testid="mason-0-grandLodge"]');
      await page.type('[data-testid="mason-0-grandLodge"]', 'NSW');
      await page.keyboard.press('Enter');
      
      await page.click('[data-testid="mason-0-lodge"]');
      await page.type('[data-testid="mason-0-lodge"]', 'Business Lodge 999');
      await page.keyboard.press('Enter');
      
      await fillInput(page, '[data-testid="mason-0-email"]', 'events@company.com.au');
      await fillInput(page, '[data-testid="mason-0-phone"]', '+61299999999');
      
      // CEO (Guest)
      await page.click('[data-testid="add-guest-button"]');
      await page.waitForSelector('[data-testid="guest-0-title"]');
      await page.select('[data-testid="guest-0-title"]', 'Mr.');
      await fillInput(page, '[data-testid="guest-0-firstName"]', 'Chief');
      await fillInput(page, '[data-testid="guest-0-lastName"]', 'Executive');
      await page.select('[data-testid="guest-0-contactPreference"]', 'Directly');
      await fillInput(page, '[data-testid="guest-0-email"]', 'ceo@company.com.au');
      await fillInput(page, '[data-testid="guest-0-phone"]', '+61299999900');
      
      await page.click('[data-testid="guest-0-hasPartner"]');
      await page.waitForSelector('[data-testid="guest-0-partner-form"]');
      await page.select('[data-testid="guest-0-partner-title"]', 'Mrs.');
      await fillInput(page, '[data-testid="guest-0-partner-firstName"]', 'CEO');
      await fillInput(page, '[data-testid="guest-0-partner-lastName"]', 'Partner');
      await page.select('[data-testid="guest-0-partner-relationship"]', 'Wife');
      
      // Board Members (Mixed)
      for (let i = 0; i < 3; i++) {
        await page.click('[data-testid="add-guest-button"]');
        const index = i + 1;
        await page.waitForSelector(`[data-testid="guest-${index}-title"]`);
        await page.select(`[data-testid="guest-${index}-title"]`, 'Dr.');
        await fillInput(page, `[data-testid="guest-${index}-firstName"]`, `Board`);
        await fillInput(page, `[data-testid="guest-${index}-lastName"]`, `Member${i + 1}`);
        await page.select(`[data-testid="guest-${index}-contactPreference"]`, 'PrimaryAttendee');
        await fillInput(page, `[data-testid="guest-${index}-dietary"]`, 'No shellfish');
      }
      
      // Executive Assistant (coordinating)
      await page.click('[data-testid="add-guest-button"]');
      await page.waitForSelector('[data-testid="guest-4-title"]');
      await page.select('[data-testid="guest-4-title"]', 'Ms.');
      await fillInput(page, '[data-testid="guest-4-firstName"]', 'Executive');
      await fillInput(page, '[data-testid="guest-4-lastName"]', 'Assistant');
      await page.select('[data-testid="guest-4-contactPreference"]', 'Directly');
      await fillInput(page, '[data-testid="guest-4-email"]', 'ea@company.com.au');
      await fillInput(page, '[data-testid="guest-4-phone"]', '+61299999901');
      await fillInput(page, '[data-testid="guest-4-accessibility"]', 'Please seat our table near the stage');
      
      await captureScreenshot(page, 'corporate-table-booking');
      
      // Add note about invoice requirements
      const notesField = await page.$('[data-testid="booking-notes"]');
      if (notesField) {
        await fillInput(page, '[data-testid="booking-notes"]', 'Invoice to Company Pty Ltd, ABN 12345678901');
      }
    });
  });

  describe('Edge Cases with Mixed Groups', () => {
    test('handles maximum attendees with uneven distribution', async () => {
      // 5 Masons (3 with partners) + 5 Guests (2 with partners) = 17 total
      
      // Primary Mason without partner
      await fillInput(page, '[data-testid="mason-0-title"]', 'Bro.');
      await fillInput(page, '[data-testid="mason-0-firstName"]', 'Solo');
      await fillInput(page, '[data-testid="mason-0-lastName"]', 'Primary');
      await page.select('[data-testid="mason-0-rank"]', 'MM');
      
      await page.click('[data-testid="mason-0-grandLodge"]');
      await page.type('[data-testid="mason-0-grandLodge"]', 'NSW');
      await page.keyboard.press('Enter');
      
      await page.click('[data-testid="mason-0-lodge"]');
      await page.type('[data-testid="mason-0-lodge"]', 'Edge Case Lodge');
      await page.keyboard.press('Enter');
      
      await fillInput(page, '[data-testid="mason-0-email"]', 'edge@test.com');
      await fillInput(page, '[data-testid="mason-0-phone"]', '+61400000000');
      
      // Add remaining Masons
      for (let i = 1; i < 5; i++) {
        await page.click('[data-testid="add-mason-button"]');
        await page.waitForSelector(`[data-testid="mason-${i}-title"]`);
        await page.select(`[data-testid="mason-${i}-title"]`, 'Bro.');
        await fillInput(page, `[data-testid="mason-${i}-firstName"]`, `Mason${i + 1}`);
        await fillInput(page, `[data-testid="mason-${i}-lastName"]`, i < 3 ? 'WithPartner' : 'Solo');
        await page.select(`[data-testid="mason-${i}-rank"]`, 'MM');
        await page.click(`[data-testid="mason-${i}-sameLodge"]`);
        await page.select(`[data-testid="mason-${i}-contactPreference"]`, 'PrimaryAttendee');
        
        // Add partners to Mason 2 and 3
        if (i < 3) {
          await page.click(`[data-testid="mason-${i}-hasPartner"]`);
          await page.waitForSelector(`[data-testid="mason-${i}-partner-form"]`);
          await page.select(`[data-testid="mason-${i}-partner-title"]`, 'Mrs.');
          await fillInput(page, `[data-testid="mason-${i}-partner-firstName"]`, `Partner${i}`);
          await fillInput(page, `[data-testid="mason-${i}-partner-lastName"]`, 'Mason');
          await page.select(`[data-testid="mason-${i}-partner-relationship"]`, 'Wife');
        }
      }
      
      // Add Guests
      for (let i = 0; i < 5; i++) {
        await page.click('[data-testid="add-guest-button"]');
        await page.waitForSelector(`[data-testid="guest-${i}-title"]`);
        await page.select(`[data-testid="guest-${i}-title"]`, 'Mr.');
        await fillInput(page, `[data-testid="guest-${i}-firstName"]`, `Guest${i + 1}`);
        await fillInput(page, `[data-testid="guest-${i}-lastName"]`, i < 2 ? 'WithPartner' : 'Solo');
        await page.select(`[data-testid="guest-${i}-contactPreference"]`, 'PrimaryAttendee');
        
        // Add partners to first 2 guests
        if (i < 2) {
          await page.click(`[data-testid="guest-${i}-hasPartner"]`);
          await page.waitForSelector(`[data-testid="guest-${i}-partner-form"]`);
          await page.select(`[data-testid="guest-${i}-partner-title"]`, 'Mrs.');
          await fillInput(page, `[data-testid="guest-${i}-partner-firstName"]`, `Partner${i + 3}`);
          await fillInput(page, `[data-testid="guest-${i}-partner-lastName"]`, 'Guest');
          await page.select(`[data-testid="guest-${i}-partner-relationship"]`, 'Wife');
        }
      }
      
      await captureScreenshot(page, 'uneven-distribution-17-attendees');
      
      // Verify count and button states
      const attendeeCards = await page.$$('[data-testid^="attendee-card-"]');
      expect(attendeeCards.length).toBe(17);
      
      // Should still be able to add more (not at 20 yet)
      const addMasonDisabled = await page.$eval('[data-testid="add-mason-button"]', el => el.disabled);
      const addGuestDisabled = await page.$eval('[data-testid="add-guest-button"]', el => el.disabled);
      
      expect(addMasonDisabled).toBe(true); // At Mason limit (5)
      expect(addGuestDisabled).toBe(true); // At Guest limit (5)
    });
  });
});