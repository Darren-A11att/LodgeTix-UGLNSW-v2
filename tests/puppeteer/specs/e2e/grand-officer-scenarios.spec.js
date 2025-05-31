/**
 * Grand Officer Scenarios Test Suite
 * 
 * This comprehensive test suite covers all Grand Lodge (GL) rank variations and the
 * complex conditional fields that appear for Grand Officers. It tests:
 * - Grand Officer status (Present/Past)
 * - All 20+ Grand Officer roles
 * - Other role with custom text
 * - Grand rank suffix field
 * - Multiple Grand Officers in one registration
 * - Grand Officer with partners
 * - Validation of conditional fields
 * - Data persistence for GL fields
 * - Grand Officer hierarchy and precedence
 */

const puppeteer = require('puppeteer');
const { testData } = require('../../config/test-data');
const { captureScreenshot, waitForElement, fillInput } = require('../../helpers/test-utils');

describe('Grand Officer Scenarios', () => {
  let browser;
  let page;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  // All Grand Officer roles
  const grandOfficerRoles = [
    { value: 'GrandMaster', label: 'Grand Master' },
    { value: 'DepGrandMaster', label: 'Deputy Grand Master' },
    { value: 'AssistGrandMaster', label: 'Assistant Grand Master' },
    { value: 'SeniorGrandWarden', label: 'Senior Grand Warden' },
    { value: 'JuniorGrandWarden', label: 'Junior Grand Warden' },
    { value: 'GrandTreasurer', label: 'Grand Treasurer' },
    { value: 'GrandSecretary', label: 'Grand Secretary' },
    { value: 'GrandRegistrar', label: 'Grand Registrar' },
    { value: 'DepGrandSecretary', label: 'Deputy Grand Secretary' },
    { value: 'AssistGrandSecretary', label: 'Assistant Grand Secretary' },
    { value: 'GrandDirectorCeremonies', label: 'Grand Director of Ceremonies' },
    { value: 'DepGrandDirectorCeremonies', label: 'Deputy Grand Director of Ceremonies' },
    { value: 'AssistGrandDirectorCeremonies', label: 'Assistant Grand Director of Ceremonies' },
    { value: 'GrandChaplain', label: 'Grand Chaplain' },
    { value: 'GrandOrganist', label: 'Grand Organist' },
    { value: 'GrandPursuivant', label: 'Grand Pursuivant' },
    { value: 'GrandSteward', label: 'Grand Steward' },
    { value: 'GrandStandardBearer', label: 'Grand Standard Bearer' },
    { value: 'GrandSwordBearer', label: 'Grand Sword Bearer' },
    { value: 'GrandTyler', label: 'Grand Tyler' },
    { value: 'Other', label: 'Other' }
  ];

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

  describe('Basic Grand Officer Fields', () => {
    test('shows Grand Officer fields when rank is GL', async () => {
      // Fill basic Mason info
      await fillInput(page, '[data-testid="mason-0-title"]', 'R.W.Bro.');
      await fillInput(page, '[data-testid="mason-0-firstName"]', 'Grand');
      await fillInput(page, '[data-testid="mason-0-lastName"]', 'Officer');
      
      // Select GL rank
      await page.select('[data-testid="mason-0-rank"]', 'GL');
      
      // Wait for Grand Officer fields to appear
      await page.waitForSelector('[data-testid="mason-0-grandRank"]');
      await page.waitForSelector('[data-testid="mason-0-grandOfficerStatus"]');
      
      // Verify fields are visible
      const grandRankField = await page.$('[data-testid="mason-0-grandRank"]');
      const grandOfficerStatusField = await page.$('[data-testid="mason-0-grandOfficerStatus"]');
      
      expect(grandRankField).toBeTruthy();
      expect(grandOfficerStatusField).toBeTruthy();
      
      await captureScreenshot(page, 'grand-officer-fields-visible');
    });

    test('hides Grand Officer fields when rank is not GL', async () => {
      // Fill basic Mason info
      await fillInput(page, '[data-testid="mason-0-title"]', 'W.Bro.');
      await fillInput(page, '[data-testid="mason-0-firstName"]', 'Regular');
      await fillInput(page, '[data-testid="mason-0-lastName"]', 'Mason');
      
      // Select non-GL rank
      await page.select('[data-testid="mason-0-rank"]', 'MM');
      
      // Verify Grand Officer fields are not visible
      const grandRankField = await page.$('[data-testid="mason-0-grandRank"]');
      const grandOfficerStatusField = await page.$('[data-testid="mason-0-grandOfficerStatus"]');
      
      expect(grandRankField).toBeFalsy();
      expect(grandOfficerStatusField).toBeFalsy();
      
      // Change to GL rank
      await page.select('[data-testid="mason-0-rank"]', 'GL');
      
      // Fields should appear
      await page.waitForSelector('[data-testid="mason-0-grandRank"]');
      await page.waitForSelector('[data-testid="mason-0-grandOfficerStatus"]');
      
      // Change back to non-GL
      await page.select('[data-testid="mason-0-rank"]', 'FC');
      
      // Fields should disappear
      await page.waitForFunction(() => !document.querySelector('[data-testid="mason-0-grandRank"]'));
      
      await captureScreenshot(page, 'grand-officer-fields-toggle');
    });
  });

  describe('Present Grand Officer Scenarios', () => {
    beforeEach(async () => {
      // Setup Grand Officer
      await fillInput(page, '[data-testid="mason-0-title"]', 'M.W.Bro.');
      await fillInput(page, '[data-testid="mason-0-firstName"]', 'Present');
      await fillInput(page, '[data-testid="mason-0-lastName"]', 'Officer');
      await page.select('[data-testid="mason-0-rank"]', 'GL');
      
      await page.click('[data-testid="mason-0-grandLodge"]');
      await page.type('[data-testid="mason-0-grandLodge"]', 'New South Wales');
      await page.keyboard.press('Enter');
      
      await page.click('[data-testid="mason-0-lodge"]');
      await page.type('[data-testid="mason-0-lodge"]', 'Grand Lodge');
      await page.keyboard.press('Enter');
      
      await fillInput(page, '[data-testid="mason-0-email"]', 'present.officer@test.com');
      await fillInput(page, '[data-testid="mason-0-phone"]', '+61400000000');
      
      // Wait for Grand Officer fields
      await page.waitForSelector('[data-testid="mason-0-grandOfficerStatus"]');
    });

    test('Present Grand Master with grand rank', async () => {
      // Fill grand rank suffix
      await fillInput(page, '[data-testid="mason-0-grandRank"]', 'PGM');
      
      // Select Present status
      await page.select('[data-testid="mason-0-grandOfficerStatus"]', 'Present');
      
      // Wait for role dropdown
      await page.waitForSelector('[data-testid="mason-0-presentGrandOfficerRole"]');
      
      // Select Grand Master role
      await page.select('[data-testid="mason-0-presentGrandOfficerRole"]', 'GrandMaster');
      
      await captureScreenshot(page, 'present-grand-master');
      
      // Verify no "Other" field appears
      const otherField = await page.$('[data-testid="mason-0-otherGrandOfficerRole"]');
      expect(otherField).toBeFalsy();
    });

    test('cycles through all Present Grand Officer roles', async () => {
      await fillInput(page, '[data-testid="mason-0-grandRank"]', 'GL');
      await page.select('[data-testid="mason-0-grandOfficerStatus"]', 'Present');
      await page.waitForSelector('[data-testid="mason-0-presentGrandOfficerRole"]');
      
      // Test each role except "Other"
      for (const role of grandOfficerRoles.filter(r => r.value !== 'Other')) {
        await page.select('[data-testid="mason-0-presentGrandOfficerRole"]', role.value);
        
        // Verify selection
        const selectedRole = await page.$eval('[data-testid="mason-0-presentGrandOfficerRole"]', el => el.value);
        expect(selectedRole).toBe(role.value);
        
        // Verify no other field
        const otherField = await page.$('[data-testid="mason-0-otherGrandOfficerRole"]');
        expect(otherField).toBeFalsy();
        
        await captureScreenshot(page, `present-role-${role.value.toLowerCase()}`);
      }
    });

    test('Present Other Grand Officer role with custom text', async () => {
      await fillInput(page, '[data-testid="mason-0-grandRank"]', 'GL');
      await page.select('[data-testid="mason-0-grandOfficerStatus"]', 'Present');
      await page.waitForSelector('[data-testid="mason-0-presentGrandOfficerRole"]');
      
      // Select Other role
      await page.select('[data-testid="mason-0-presentGrandOfficerRole"]', 'Other');
      
      // Wait for other field to appear
      await page.waitForSelector('[data-testid="mason-0-otherGrandOfficerRole"]');
      
      // Other field should be required
      const otherRequired = await page.$('[data-testid="mason-0-otherGrandOfficerRole"][required]');
      expect(otherRequired).toBeTruthy();
      
      // Try to continue without filling other field
      await page.click('[data-testid="continue-button"]');
      
      // Should show validation error
      await page.waitForSelector('[data-testid="mason-0-otherGrandOfficerRole-error"]');
      const errorText = await page.$eval('[data-testid="mason-0-otherGrandOfficerRole-error"]', el => el.textContent);
      expect(errorText).toContain('specify');
      
      // Fill other role
      await fillInput(page, '[data-testid="mason-0-otherGrandOfficerRole"]', 'Grand Historian');
      
      await captureScreenshot(page, 'present-other-role');
    });
  });

  describe('Past Grand Officer Scenarios', () => {
    beforeEach(async () => {
      // Setup Grand Officer
      await fillInput(page, '[data-testid="mason-0-title"]', 'R.W.Bro.');
      await fillInput(page, '[data-testid="mason-0-firstName"]', 'Past');
      await fillInput(page, '[data-testid="mason-0-lastName"]', 'Officer');
      await page.select('[data-testid="mason-0-rank"]', 'GL');
      
      await page.click('[data-testid="mason-0-grandLodge"]');
      await page.type('[data-testid="mason-0-grandLodge"]', 'New South Wales');
      await page.keyboard.press('Enter');
      
      await page.click('[data-testid="mason-0-lodge"]');
      await page.type('[data-testid="mason-0-lodge"]', 'Former Lodge');
      await page.keyboard.press('Enter');
      
      await fillInput(page, '[data-testid="mason-0-email"]', 'past.officer@test.com');
      await fillInput(page, '[data-testid="mason-0-phone"]', '+61400000001');
      
      await page.waitForSelector('[data-testid="mason-0-grandOfficerStatus"]');
    });

    test('Past Grand Officer does not show role dropdown', async () => {
      await fillInput(page, '[data-testid="mason-0-grandRank"]', 'PDGM');
      
      // Select Past status
      await page.select('[data-testid="mason-0-grandOfficerStatus"]', 'Past');
      
      // Wait a moment to ensure no role field appears
      await page.waitForTimeout(500);
      
      // Verify no role dropdown appears
      const presentRoleField = await page.$('[data-testid="mason-0-presentGrandOfficerRole"]');
      const otherRoleField = await page.$('[data-testid="mason-0-otherGrandOfficerRole"]');
      
      expect(presentRoleField).toBeFalsy();
      expect(otherRoleField).toBeFalsy();
      
      await captureScreenshot(page, 'past-grand-officer');
      
      // Can continue without role selection
      await page.click('[data-testid="continue-button"]');
      await page.waitForSelector('[data-testid="ticket-selection-step"]');
    });

    test('switching between Present and Past status', async () => {
      await fillInput(page, '[data-testid="mason-0-grandRank"]', 'GL');
      
      // Start with Present
      await page.select('[data-testid="mason-0-grandOfficerStatus"]', 'Present');
      await page.waitForSelector('[data-testid="mason-0-presentGrandOfficerRole"]');
      await page.select('[data-testid="mason-0-presentGrandOfficerRole"]', 'GrandSecretary');
      
      // Switch to Past
      await page.select('[data-testid="mason-0-grandOfficerStatus"]', 'Past');
      
      // Role field should disappear
      await page.waitForFunction(() => !document.querySelector('[data-testid="mason-0-presentGrandOfficerRole"]'));
      
      // Switch back to Present
      await page.select('[data-testid="mason-0-grandOfficerStatus"]', 'Present');
      await page.waitForSelector('[data-testid="mason-0-presentGrandOfficerRole"]');
      
      // Role should be cleared
      const roleValue = await page.$eval('[data-testid="mason-0-presentGrandOfficerRole"]', el => el.value);
      expect(roleValue).toBe('');
      
      await captureScreenshot(page, 'status-switching');
    });
  });

  describe('Multiple Grand Officers', () => {
    test('registration with multiple Grand Officers of different ranks', async () => {
      // Grand Master
      await fillInput(page, '[data-testid="mason-0-title"]', 'M.W.Bro.');
      await fillInput(page, '[data-testid="mason-0-firstName"]', 'Grand');
      await fillInput(page, '[data-testid="mason-0-lastName"]', 'Master');
      await page.select('[data-testid="mason-0-rank"]', 'GL');
      
      await page.click('[data-testid="mason-0-grandLodge"]');
      await page.type('[data-testid="mason-0-grandLodge"]', 'New South Wales');
      await page.keyboard.press('Enter');
      
      await page.click('[data-testid="mason-0-lodge"]');
      await page.type('[data-testid="mason-0-lodge"]', 'Grand Lodge');
      await page.keyboard.press('Enter');
      
      await fillInput(page, '[data-testid="mason-0-email"]', 'gm@test.com');
      await fillInput(page, '[data-testid="mason-0-phone"]', '+61400000000');
      await fillInput(page, '[data-testid="mason-0-grandRank"]', 'GM');
      await page.select('[data-testid="mason-0-grandOfficerStatus"]', 'Present');
      await page.waitForSelector('[data-testid="mason-0-presentGrandOfficerRole"]');
      await page.select('[data-testid="mason-0-presentGrandOfficerRole"]', 'GrandMaster');
      
      // Deputy Grand Master
      await page.click('[data-testid="add-mason-button"]');
      await page.waitForSelector('[data-testid="mason-1-title"]');
      await page.select('[data-testid="mason-1-title"]', 'R.W.Bro.');
      await fillInput(page, '[data-testid="mason-1-firstName"]', 'Deputy');
      await fillInput(page, '[data-testid="mason-1-lastName"]', 'Master');
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
      await fillInput(page, '[data-testid="mason-2-email"]', 'pgs@test.com');
      await fillInput(page, '[data-testid="mason-2-phone"]', '+61400000002');
      await fillInput(page, '[data-testid="mason-2-grandRank"]', 'PGS');
      await page.select('[data-testid="mason-2-grandOfficerStatus"]', 'Past');
      
      // Regular Mason (non-GL)
      await page.click('[data-testid="add-mason-button"]');
      await page.waitForSelector('[data-testid="mason-3-title"]');
      await page.select('[data-testid="mason-3-title"]', 'Bro.');
      await fillInput(page, '[data-testid="mason-3-firstName"]', 'Regular');
      await fillInput(page, '[data-testid="mason-3-lastName"]', 'Mason');
      await page.select('[data-testid="mason-3-rank"]', 'MM');
      await page.click('[data-testid="mason-3-sameLodge"]');
      await page.select('[data-testid="mason-3-contactPreference"]', 'ProvideLater');
      
      await captureScreenshot(page, 'multiple-grand-officers');
      
      // Verify only GL ranks show grand officer fields
      const mason3GrandRank = await page.$('[data-testid="mason-3-grandRank"]');
      expect(mason3GrandRank).toBeFalsy();
    });

    test('Grand Officer hierarchy with partners', async () => {
      // Grand Officer with partner
      await fillInput(page, '[data-testid="mason-0-title"]', 'R.W.Bro.');
      await fillInput(page, '[data-testid="mason-0-firstName"]', 'Senior');
      await fillInput(page, '[data-testid="mason-0-lastName"]', 'Warden');
      await page.select('[data-testid="mason-0-rank"]', 'GL');
      
      await page.click('[data-testid="mason-0-grandLodge"]');
      await page.type('[data-testid="mason-0-grandLodge"]', 'NSW');
      await page.keyboard.press('Enter');
      
      await page.click('[data-testid="mason-0-lodge"]');
      await page.type('[data-testid="mason-0-lodge"]', 'Grand Lodge');
      await page.keyboard.press('Enter');
      
      await fillInput(page, '[data-testid="mason-0-email"]', 'sgw@test.com');
      await fillInput(page, '[data-testid="mason-0-phone"]', '+61400000000');
      await fillInput(page, '[data-testid="mason-0-grandRank"]', 'SGW');
      await page.select('[data-testid="mason-0-grandOfficerStatus"]', 'Present');
      await page.waitForSelector('[data-testid="mason-0-presentGrandOfficerRole"]');
      await page.select('[data-testid="mason-0-presentGrandOfficerRole"]', 'SeniorGrandWarden');
      
      // Add partner
      await page.click('[data-testid="mason-0-hasPartner"]');
      await page.waitForSelector('[data-testid="mason-0-partner-form"]');
      await page.select('[data-testid="mason-0-partner-title"]', 'Mrs.');
      await fillInput(page, '[data-testid="mason-0-partner-firstName"]', 'Lady');
      await fillInput(page, '[data-testid="mason-0-partner-lastName"]', 'Warden');
      await page.select('[data-testid="mason-0-partner-relationship"]', 'Wife');
      
      // Add another Grand Officer
      await page.click('[data-testid="add-mason-button"]');
      await page.waitForSelector('[data-testid="mason-1-title"]');
      await page.select('[data-testid="mason-1-title"]', 'V.W.Bro.');
      await fillInput(page, '[data-testid="mason-1-firstName"]', 'Grand');
      await fillInput(page, '[data-testid="mason-1-lastName"]', 'Chaplain');
      await page.select('[data-testid="mason-1-rank"]', 'GL');
      await page.click('[data-testid="mason-1-sameLodge"]');
      await page.select('[data-testid="mason-1-contactPreference"]', 'PrimaryAttendee');
      await fillInput(page, '[data-testid="mason-1-grandRank"]', 'GC');
      await page.select('[data-testid="mason-1-grandOfficerStatus"]', 'Present');
      await page.waitForSelector('[data-testid="mason-1-presentGrandOfficerRole"]');
      await page.select('[data-testid="mason-1-presentGrandOfficerRole"]', 'GrandChaplain');
      
      await captureScreenshot(page, 'grand-officers-with-partners');
      
      // Verify attendee order
      const attendeeCards = await page.$$('[data-testid^="attendee-card-"]');
      expect(attendeeCards.length).toBe(3); // 2 Grand Officers + 1 partner
    });
  });

  describe('Grand Officer Validation', () => {
    test('validates required Grand Officer fields', async () => {
      // Setup GL rank Mason
      await fillInput(page, '[data-testid="mason-0-title"]', 'R.W.Bro.');
      await fillInput(page, '[data-testid="mason-0-firstName"]', 'Validation');
      await fillInput(page, '[data-testid="mason-0-lastName"]', 'Test');
      await page.select('[data-testid="mason-0-rank"]', 'GL');
      
      await page.click('[data-testid="mason-0-grandLodge"]');
      await page.type('[data-testid="mason-0-grandLodge"]', 'NSW');
      await page.keyboard.press('Enter');
      
      await page.click('[data-testid="mason-0-lodge"]');
      await page.type('[data-testid="mason-0-lodge"]', 'Lodge');
      await page.keyboard.press('Enter');
      
      await fillInput(page, '[data-testid="mason-0-email"]', 'validate@test.com');
      await fillInput(page, '[data-testid="mason-0-phone"]', '+61400000000');
      
      // Don't fill Grand Officer fields
      await page.click('[data-testid="continue-button"]');
      
      // Should show validation errors
      await page.waitForSelector('[data-testid="mason-0-grandRank-error"]');
      await page.waitForSelector('[data-testid="mason-0-grandOfficerStatus-error"]');
      
      const grandRankError = await page.$eval('[data-testid="mason-0-grandRank-error"]', el => el.textContent);
      const statusError = await page.$eval('[data-testid="mason-0-grandOfficerStatus-error"]', el => el.textContent);
      
      expect(grandRankError).toContain('required');
      expect(statusError).toContain('required');
      
      // Fill grand rank and status but not role
      await fillInput(page, '[data-testid="mason-0-grandRank"]', 'GL');
      await page.select('[data-testid="mason-0-grandOfficerStatus"]', 'Present');
      await page.waitForSelector('[data-testid="mason-0-presentGrandOfficerRole"]');
      
      // Try again without role
      await page.click('[data-testid="continue-button"]');
      
      // Should show role error
      await page.waitForSelector('[data-testid="mason-0-presentGrandOfficerRole-error"]');
      const roleError = await page.$eval('[data-testid="mason-0-presentGrandOfficerRole-error"]', el => el.textContent);
      expect(roleError).toContain('select');
      
      await captureScreenshot(page, 'grand-officer-validation');
    });

    test('validates character limits for grand rank field', async () => {
      await fillInput(page, '[data-testid="mason-0-title"]', 'R.W.Bro.');
      await fillInput(page, '[data-testid="mason-0-firstName"]', 'Char');
      await fillInput(page, '[data-testid="mason-0-lastName"]', 'Limit');
      await page.select('[data-testid="mason-0-rank"]', 'GL');
      
      await page.click('[data-testid="mason-0-grandLodge"]');
      await page.type('[data-testid="mason-0-grandLodge"]', 'NSW');
      await page.keyboard.press('Enter');
      
      await page.click('[data-testid="mason-0-lodge"]');
      await page.type('[data-testid="mason-0-lodge"]', 'Lodge');
      await page.keyboard.press('Enter');
      
      await fillInput(page, '[data-testid="mason-0-email"]', 'limit@test.com');
      await fillInput(page, '[data-testid="mason-0-phone"]', '+61400000000');
      
      // Test grand rank character limit (assuming 10 chars)
      const longRank = 'VERYLONGGRANDRANK';
      await page.type('[data-testid="mason-0-grandRank"]', longRank);
      
      const grandRankValue = await page.$eval('[data-testid="mason-0-grandRank"]', el => el.value);
      expect(grandRankValue.length).toBeLessThanOrEqual(10);
      
      // Test other role character limit for long custom roles
      await page.select('[data-testid="mason-0-grandOfficerStatus"]', 'Present');
      await page.waitForSelector('[data-testid="mason-0-presentGrandOfficerRole"]');
      await page.select('[data-testid="mason-0-presentGrandOfficerRole"]', 'Other');
      await page.waitForSelector('[data-testid="mason-0-otherGrandOfficerRole"]');
      
      const longOtherRole = 'A'.repeat(100);
      await page.type('[data-testid="mason-0-otherGrandOfficerRole"]', longOtherRole);
      
      const otherRoleValue = await page.$eval('[data-testid="mason-0-otherGrandOfficerRole"]', el => el.value);
      expect(otherRoleValue.length).toBeLessThanOrEqual(50); // Assuming 50 char limit
      
      await captureScreenshot(page, 'grand-officer-char-limits');
    });
  });

  describe('Data Persistence', () => {
    test('Grand Officer data persists through navigation', async () => {
      // Fill complete Grand Officer data
      await fillInput(page, '[data-testid="mason-0-title"]', 'V.W.Bro.');
      await fillInput(page, '[data-testid="mason-0-firstName"]', 'Persist');
      await fillInput(page, '[data-testid="mason-0-lastName"]', 'Data');
      await page.select('[data-testid="mason-0-rank"]', 'GL');
      
      await page.click('[data-testid="mason-0-grandLodge"]');
      await page.type('[data-testid="mason-0-grandLodge"]', 'Victoria');
      await page.keyboard.press('Enter');
      
      await page.click('[data-testid="mason-0-lodge"]');
      await page.type('[data-testid="mason-0-lodge"]', 'Grand Lodge VIC');
      await page.keyboard.press('Enter');
      
      await fillInput(page, '[data-testid="mason-0-email"]', 'persist@test.com');
      await fillInput(page, '[data-testid="mason-0-phone"]', '+61400000000');
      await fillInput(page, '[data-testid="mason-0-grandRank"]', 'PAGDC');
      await page.select('[data-testid="mason-0-grandOfficerStatus"]', 'Past');
      
      // Navigate forward
      await page.click('[data-testid="continue-button"]');
      await page.waitForSelector('[data-testid="ticket-selection-step"]');
      
      // Navigate back
      await page.click('[data-testid="back-button"]');
      await page.waitForSelector('[data-testid="attendee-details-step"]');
      
      // Verify all Grand Officer data persisted
      const grandRank = await page.$eval('[data-testid="mason-0-grandRank"]', el => el.value);
      const grandStatus = await page.$eval('[data-testid="mason-0-grandOfficerStatus"]', el => el.value);
      const rank = await page.$eval('[data-testid="mason-0-rank"]', el => el.value);
      
      expect(grandRank).toBe('PAGDC');
      expect(grandStatus).toBe('Past');
      expect(rank).toBe('GL');
      
      await captureScreenshot(page, 'grand-officer-data-persisted');
    });

    test('Grand Officer fields clear when changing from GL rank', async () => {
      // Setup Grand Officer
      await fillInput(page, '[data-testid="mason-0-title"]', 'R.W.Bro.');
      await fillInput(page, '[data-testid="mason-0-firstName"]', 'Clear');
      await fillInput(page, '[data-testid="mason-0-lastName"]', 'Test');
      await page.select('[data-testid="mason-0-rank"]', 'GL');
      
      await page.click('[data-testid="mason-0-grandLodge"]');
      await page.type('[data-testid="mason-0-grandLodge"]', 'NSW');
      await page.keyboard.press('Enter');
      
      await page.click('[data-testid="mason-0-lodge"]');
      await page.type('[data-testid="mason-0-lodge"]', 'Lodge');
      await page.keyboard.press('Enter');
      
      await fillInput(page, '[data-testid="mason-0-email"]', 'clear@test.com');
      await fillInput(page, '[data-testid="mason-0-phone"]', '+61400000000');
      
      // Fill Grand Officer fields
      await fillInput(page, '[data-testid="mason-0-grandRank"]', 'GDC');
      await page.select('[data-testid="mason-0-grandOfficerStatus"]', 'Present');
      await page.waitForSelector('[data-testid="mason-0-presentGrandOfficerRole"]');
      await page.select('[data-testid="mason-0-presentGrandOfficerRole"]', 'GrandDirectorCeremonies');
      
      // Change rank to non-GL
      await page.select('[data-testid="mason-0-rank"]', 'MM');
      
      // Fields should disappear
      await page.waitForFunction(() => !document.querySelector('[data-testid="mason-0-grandRank"]'));
      
      // Change back to GL
      await page.select('[data-testid="mason-0-rank"]', 'GL');
      await page.waitForSelector('[data-testid="mason-0-grandRank"]');
      
      // Verify fields are cleared
      const grandRank = await page.$eval('[data-testid="mason-0-grandRank"]', el => el.value);
      const grandStatus = await page.$eval('[data-testid="mason-0-grandOfficerStatus"]', el => el.value);
      
      expect(grandRank).toBe('');
      expect(grandStatus).toBe('');
      
      await captureScreenshot(page, 'grand-officer-fields-cleared');
    });
  });
});