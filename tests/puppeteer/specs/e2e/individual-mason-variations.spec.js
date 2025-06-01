/**
 * Individual Mason Variations Test Suite
 * 
 * This comprehensive test suite covers all variations of Mason attendee registration
 * in the Individual (Myself & Others) registration flow. It tests:
 * - All 5 Mason titles
 * - All 4 ranks (MM, FC, EA, GL)
 * - Primary vs non-primary Masons
 * - Same lodge vs different lodge options
 * - Contact preference variations
 * - Optional fields (dietary, accessibility)
 * - Field validation and error handling
 */

const config = require('../../config/puppeteer.config');
const { testData } = require('../../config/test-data');
const { captureScreenshot, waitForElement, fillInput } = require('../../helpers/test-utils');

describe('Individual Mason Variations', () => {
  let browser;
  let page;

  beforeAll(async () => {
    browser = global.__BROWSER__;
  });

  beforeEach(async () => {
    page = await browser.newPage();
    await global.setupPage(page);
    
    // Navigate to Grand Installation function and start Individual registration
    await page.goto(`${config.baseUrl}/functions/${testData.functionSlug}`);
    await page.waitForTimeout(2000);
    
    // Click register button
    await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a'));
      const registerLink = links.find(a => 
        a.textContent.includes('Register') || 
        a.textContent.includes('Get Tickets') ||
        a.textContent.includes('Purchase Tickets')
      );
      if (registerLink) registerLink.click();
    });
    
    await page.waitForTimeout(2000);
    
    // Select Individual registration type
    await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('div'));
      const myselfCard = cards.find(card => 
        card.textContent.includes('Myself & Others') &&
        card.textContent.includes('Register yourself')
      );
      
      if (myselfCard) {
        const selectButton = myselfCard.querySelector('button');
        if (selectButton) selectButton.click();
      } else {
        // Fallback: click first Select button
        const selectButtons = Array.from(document.querySelectorAll('button'));
        const firstSelect = selectButtons.find(btn => btn.textContent.trim() === 'Select');
        if (firstSelect) firstSelect.click();
      }
    });
    
    await page.waitForTimeout(2000);
  });

  afterEach(async () => {
    await page.close();
  });

  describe('Primary Mason Scenarios', () => {
    test('completes registration with minimum required fields only', async () => {
      // Fill primary Mason with minimum fields
      await fillInput(page, '[data-testid="mason-0-title"]', 'Bro.');
      await fillInput(page, '[data-testid="mason-0-firstName"]', 'John');
      await fillInput(page, '[data-testid="mason-0-lastName"]', 'Smith');
      await fillInput(page, '[data-testid="mason-0-rank"]', 'MM');
      
      // Select Grand Lodge
      await page.click('[data-testid="mason-0-grandLodge"]');
      await page.type('[data-testid="mason-0-grandLodge"]', 'New South Wales');
      await page.keyboard.press('Enter');
      
      // Select Lodge
      await page.click('[data-testid="mason-0-lodge"]');
      await page.type('[data-testid="mason-0-lodge"]', 'Lodge Test 123');
      await page.keyboard.press('Enter');
      
      // Fill contact info (required for primary)
      await fillInput(page, '[data-testid="mason-0-email"]', 'john.smith@test.com');
      await fillInput(page, '[data-testid="mason-0-phone"]', '+61400000000');
      
      await captureScreenshot(page, 'primary-mason-minimum-fields');
      
      // Continue to ticket selection
      await page.click('[data-testid="continue-button"]');
      await page.waitForSelector('[data-testid="ticket-selection-step"]');
      
      expect(await page.$('[data-testid="ticket-selection-step"]')).toBeTruthy();
    });

    test('completes registration with all optional fields filled', async () => {
      // Fill all fields including optional
      await fillInput(page, '[data-testid="mason-0-title"]', 'W.Bro.');
      await fillInput(page, '[data-testid="mason-0-firstName"]', 'William');
      await fillInput(page, '[data-testid="mason-0-lastName"]', 'Johnson');
      await fillInput(page, '[data-testid="mason-0-rank"]', 'MM');
      
      // Select Grand Lodge and Lodge
      await page.click('[data-testid="mason-0-grandLodge"]');
      await page.type('[data-testid="mason-0-grandLodge"]', 'New South Wales');
      await page.keyboard.press('Enter');
      
      await page.click('[data-testid="mason-0-lodge"]');
      await page.type('[data-testid="mason-0-lodge"]', 'Lodge Test 456');
      await page.keyboard.press('Enter');
      
      // Fill contact info
      await fillInput(page, '[data-testid="mason-0-email"]', 'william.johnson@test.com');
      await fillInput(page, '[data-testid="mason-0-phone"]', '+61400000001');
      
      // Fill optional fields
      await fillInput(page, '[data-testid="mason-0-dietary"]', 'Vegetarian, no nuts');
      await fillInput(page, '[data-testid="mason-0-accessibility"]', 'Wheelchair access required');
      
      await captureScreenshot(page, 'primary-mason-all-fields');
      
      // Verify character counts
      const dietaryCount = await page.$eval('[data-testid="mason-0-dietary-count"]', el => el.textContent);
      expect(dietaryCount).toContain('19/200');
      
      const accessibilityCount = await page.$eval('[data-testid="mason-0-accessibility-count"]', el => el.textContent);
      expect(accessibilityCount).toContain('25/500');
    });

    test('validates all five Mason title options', async () => {
      const titles = ['W.Bro.', 'Bro.', 'V.W.Bro.', 'R.W.Bro.', 'M.W.Bro.'];
      
      for (const title of titles) {
        // Select title
        await page.select('[data-testid="mason-0-title"]', title);
        
        // Verify selection
        const selectedTitle = await page.$eval('[data-testid="mason-0-title"]', el => el.value);
        expect(selectedTitle).toBe(title);
        
        await captureScreenshot(page, `mason-title-${title.replace(/\./g, '')}`);
      }
    });

    test('validates all four rank options', async () => {
      const ranks = [
        { value: 'MM', label: 'Master Mason' },
        { value: 'FC', label: 'Fellow Craft' },
        { value: 'EA', label: 'Entered Apprentice' },
        { value: 'GL', label: 'Grand Lodge' }
      ];
      
      for (const rank of ranks) {
        await page.select('[data-testid="mason-0-rank"]', rank.value);
        
        const selectedRank = await page.$eval('[data-testid="mason-0-rank"]', el => el.value);
        expect(selectedRank).toBe(rank.value);
        
        // Check if Grand Officer fields appear for GL rank
        if (rank.value === 'GL') {
          await page.waitForSelector('[data-testid="mason-0-grandOfficerStatus"]');
          expect(await page.$('[data-testid="mason-0-grandOfficerStatus"]')).toBeTruthy();
        }
        
        await captureScreenshot(page, `mason-rank-${rank.value}`);
      }
    });
  });

  describe('Non-Primary Mason Scenarios', () => {
    beforeEach(async () => {
      // Add primary Mason first
      await fillInput(page, '[data-testid="mason-0-title"]', 'Bro.');
      await fillInput(page, '[data-testid="mason-0-firstName"]', 'Primary');
      await fillInput(page, '[data-testid="mason-0-lastName"]', 'Mason');
      await fillInput(page, '[data-testid="mason-0-rank"]', 'MM');
      
      await page.click('[data-testid="mason-0-grandLodge"]');
      await page.type('[data-testid="mason-0-grandLodge"]', 'New South Wales');
      await page.keyboard.press('Enter');
      
      await page.click('[data-testid="mason-0-lodge"]');
      await page.type('[data-testid="mason-0-lodge"]', 'Primary Lodge 111');
      await page.keyboard.press('Enter');
      
      await fillInput(page, '[data-testid="mason-0-email"]', 'primary@test.com');
      await fillInput(page, '[data-testid="mason-0-phone"]', '+61400000000');
      
      // Add another Mason
      await page.click('[data-testid="add-mason-button"]');
      await page.waitForSelector('[data-testid="mason-1-title"]');
    });

    test('uses same lodge option for non-primary Mason', async () => {
      // Check "Use same lodge" checkbox
      await page.click('[data-testid="mason-1-sameLodge"]');
      
      // Fill other fields
      await fillInput(page, '[data-testid="mason-1-title"]', 'Bro.');
      await fillInput(page, '[data-testid="mason-1-firstName"]', 'Same');
      await fillInput(page, '[data-testid="mason-1-lastName"]', 'Lodge');
      await fillInput(page, '[data-testid="mason-1-rank"]', 'FC');
      
      // Select contact preference - Primary Attendee
      await page.select('[data-testid="mason-1-contactPreference"]', 'PrimaryAttendee');
      
      // Verify lodge fields are disabled
      const grandLodgeDisabled = await page.$eval('[data-testid="mason-1-grandLodge"]', el => el.disabled);
      const lodgeDisabled = await page.$eval('[data-testid="mason-1-lodge"]', el => el.disabled);
      
      expect(grandLodgeDisabled).toBe(true);
      expect(lodgeDisabled).toBe(true);
      
      // Verify values match primary
      const grandLodgeValue = await page.$eval('[data-testid="mason-1-grandLodge"]', el => el.value);
      const lodgeValue = await page.$eval('[data-testid="mason-1-lodge"]', el => el.value);
      
      expect(grandLodgeValue).toBe('New South Wales');
      expect(lodgeValue).toBe('Primary Lodge 111');
      
      await captureScreenshot(page, 'non-primary-same-lodge');
    });

    test('enters different lodge for non-primary Mason', async () => {
      // Don't check same lodge - enter different lodge info
      await fillInput(page, '[data-testid="mason-1-title"]', 'V.W.Bro.');
      await fillInput(page, '[data-testid="mason-1-firstName"]', 'Different');
      await fillInput(page, '[data-testid="mason-1-lastName"]', 'Lodge');
      await fillInput(page, '[data-testid="mason-1-rank"]', 'MM');
      
      // Select different Grand Lodge
      await page.click('[data-testid="mason-1-grandLodge"]');
      await page.type('[data-testid="mason-1-grandLodge"]', 'Victoria');
      await page.keyboard.press('Enter');
      
      // Select different Lodge
      await page.click('[data-testid="mason-1-lodge"]');
      await page.type('[data-testid="mason-1-lodge"]', 'Different Lodge 222');
      await page.keyboard.press('Enter');
      
      // Select contact preference
      await page.select('[data-testid="mason-1-contactPreference"]', 'Directly');
      
      // When "Directly" is selected, email and phone become required
      await page.waitForSelector('[data-testid="mason-1-email"][required]');
      await fillInput(page, '[data-testid="mason-1-email"]', 'different@test.com');
      await fillInput(page, '[data-testid="mason-1-phone"]', '+61400000002');
      
      await captureScreenshot(page, 'non-primary-different-lodge');
    });

    test('validates contact preference options', async () => {
      // Fill basic info
      await fillInput(page, '[data-testid="mason-1-title"]', 'Bro.');
      await fillInput(page, '[data-testid="mason-1-firstName"]', 'Contact');
      await fillInput(page, '[data-testid="mason-1-lastName"]', 'Test');
      await fillInput(page, '[data-testid="mason-1-rank"]', 'EA');
      
      // Test PrimaryAttendee preference
      await page.select('[data-testid="mason-1-contactPreference"]', 'PrimaryAttendee');
      let emailRequired = await page.$('[data-testid="mason-1-email"][required]');
      expect(emailRequired).toBeFalsy();
      
      // Test Directly preference
      await page.select('[data-testid="mason-1-contactPreference"]', 'Directly');
      await page.waitForSelector('[data-testid="mason-1-email"][required]');
      emailRequired = await page.$('[data-testid="mason-1-email"][required]');
      expect(emailRequired).toBeTruthy();
      
      // Test ProvideLater preference
      await page.select('[data-testid="mason-1-contactPreference"]', 'ProvideLater');
      emailRequired = await page.$('[data-testid="mason-1-email"][required]');
      expect(emailRequired).toBeFalsy();
      
      await captureScreenshot(page, 'contact-preference-variations');
    });
  });

  describe('Validation Scenarios', () => {
    test('prevents submission with missing required fields', async () => {
      // Try to continue without filling required fields
      await page.click('[data-testid="continue-button"]');
      
      // Check for validation errors
      await page.waitForSelector('[data-testid="validation-error"]');
      const errors = await page.$$('[data-testid="validation-error"]');
      expect(errors.length).toBeGreaterThan(0);
      
      // Check specific field errors
      const titleError = await page.$('[data-testid="mason-0-title-error"]');
      const firstNameError = await page.$('[data-testid="mason-0-firstName-error"]');
      const lastNameError = await page.$('[data-testid="mason-0-lastName-error"]');
      
      expect(titleError).toBeTruthy();
      expect(firstNameError).toBeTruthy();
      expect(lastNameError).toBeTruthy();
      
      await captureScreenshot(page, 'validation-errors');
    });

    test('validates email format', async () => {
      // Fill basic info
      await fillInput(page, '[data-testid="mason-0-title"]', 'Bro.');
      await fillInput(page, '[data-testid="mason-0-firstName"]', 'Email');
      await fillInput(page, '[data-testid="mason-0-lastName"]', 'Test');
      await fillInput(page, '[data-testid="mason-0-rank"]', 'MM');
      
      // Test invalid email formats
      const invalidEmails = ['notanemail', 'missing@', '@nodomain.com', 'spaces in@email.com'];
      
      for (const email of invalidEmails) {
        await page.click('[data-testid="mason-0-email"]', { clickCount: 3 });
        await page.type('[data-testid="mason-0-email"]', email);
        await page.click('[data-testid="mason-0-phone"]'); // Blur to trigger validation
        
        await page.waitForSelector('[data-testid="mason-0-email-error"]');
        const errorText = await page.$eval('[data-testid="mason-0-email-error"]', el => el.textContent);
        expect(errorText).toContain('valid email');
        
        await captureScreenshot(page, `invalid-email-${email.replace(/[@.]/g, '-')}`);
      }
    });

    test('validates phone number format', async () => {
      // Fill basic info
      await fillInput(page, '[data-testid="mason-0-title"]', 'Bro.');
      await fillInput(page, '[data-testid="mason-0-firstName"]', 'Phone');
      await fillInput(page, '[data-testid="mason-0-lastName"]', 'Test');
      await fillInput(page, '[data-testid="mason-0-rank"]', 'MM');
      await fillInput(page, '[data-testid="mason-0-email"]', 'phone@test.com');
      
      // Test invalid phone formats
      const invalidPhones = ['1234', 'abcdefghij', '123-456-789'];
      
      for (const phone of invalidPhones) {
        await page.click('[data-testid="mason-0-phone"]', { clickCount: 3 });
        await page.type('[data-testid="mason-0-phone"]', phone);
        await page.click('[data-testid="mason-0-email"]'); // Blur
        
        await page.waitForSelector('[data-testid="mason-0-phone-error"]');
        const errorText = await page.$eval('[data-testid="mason-0-phone-error"]', el => el.textContent);
        expect(errorText).toContain('valid phone');
      }
    });

    test('enforces character limits on text fields', async () => {
      // Fill basic required fields first
      await fillInput(page, '[data-testid="mason-0-title"]', 'Bro.');
      await fillInput(page, '[data-testid="mason-0-firstName"]', 'Char');
      await fillInput(page, '[data-testid="mason-0-lastName"]', 'Limit');
      await fillInput(page, '[data-testid="mason-0-rank"]', 'MM');
      
      // Test dietary requirements limit (200 chars)
      const longDietary = 'a'.repeat(250);
      await page.type('[data-testid="mason-0-dietary"]', longDietary);
      
      const dietaryValue = await page.$eval('[data-testid="mason-0-dietary"]', el => el.value);
      expect(dietaryValue.length).toBe(200);
      
      // Test accessibility requirements limit (500 chars)
      const longAccessibility = 'b'.repeat(600);
      await page.type('[data-testid="mason-0-accessibility"]', longAccessibility);
      
      const accessibilityValue = await page.$eval('[data-testid="mason-0-accessibility"]', el => el.value);
      expect(accessibilityValue.length).toBe(500);
      
      await captureScreenshot(page, 'character-limits');
    });
  });

  describe('Complex Scenarios', () => {
    test('adds maximum number of Masons (5)', async () => {
      // Add 5 Masons
      for (let i = 0; i < 5; i++) {
        if (i > 0) {
          await page.click('[data-testid="add-mason-button"]');
          await page.waitForSelector(`[data-testid="mason-${i}-title"]`);
        }
        
        await fillInput(page, `[data-testid="mason-${i}-title"]`, 'Bro.');
        await fillInput(page, `[data-testid="mason-${i}-firstName"]`, `Mason${i + 1}`);
        await fillInput(page, `[data-testid="mason-${i}-lastName"]`, 'Test');
        await fillInput(page, `[data-testid="mason-${i}-rank"]`, 'MM');
        
        if (i === 0) {
          // Primary Mason needs full details
          await page.click(`[data-testid="mason-${i}-grandLodge"]`);
          await page.type(`[data-testid="mason-${i}-grandLodge"]`, 'New South Wales');
          await page.keyboard.press('Enter');
          
          await page.click(`[data-testid="mason-${i}-lodge"]`);
          await page.type(`[data-testid="mason-${i}-lodge"]`, 'Test Lodge');
          await page.keyboard.press('Enter');
          
          await fillInput(page, `[data-testid="mason-${i}-email"]`, `mason${i + 1}@test.com`);
          await fillInput(page, `[data-testid="mason-${i}-phone"]`, `+6140000000${i}`);
        } else {
          // Non-primary use same lodge
          await page.click(`[data-testid="mason-${i}-sameLodge"]`);
          await page.select(`[data-testid="mason-${i}-contactPreference"]`, 'PrimaryAttendee');
        }
      }
      
      // Verify add button is disabled after 5 Masons
      const addButtonDisabled = await page.$eval('[data-testid="add-mason-button"]', el => el.disabled);
      expect(addButtonDisabled).toBe(true);
      
      await captureScreenshot(page, 'maximum-masons');
    });

    test('removes Mason and updates indices correctly', async () => {
      // Add 3 Masons
      for (let i = 0; i < 3; i++) {
        if (i > 0) {
          await page.click('[data-testid="add-mason-button"]');
          await page.waitForSelector(`[data-testid="mason-${i}-title"]`);
        }
        
        await fillInput(page, `[data-testid="mason-${i}-firstName"]`, `Mason${i + 1}`);
      }
      
      // Remove middle Mason (index 1)
      await page.click('[data-testid="remove-mason-1"]');
      
      // Wait for removal
      await page.waitForFunction(() => !document.querySelector('[data-testid="mason-2-firstName"]'));
      
      // Verify indices updated correctly
      const mason0Name = await page.$eval('[data-testid="mason-0-firstName"]', el => el.value);
      const mason1Name = await page.$eval('[data-testid="mason-1-firstName"]', el => el.value);
      
      expect(mason0Name).toBe('Mason1');
      expect(mason1Name).toBe('Mason3'); // Previously mason-2
      
      // Verify only 2 Masons remain
      const masonForms = await page.$$('[data-testid^="mason-form-"]');
      expect(masonForms.length).toBe(2);
      
      await captureScreenshot(page, 'remove-mason-reindex');
    });

    test('handles mixed titles and ranks', async () => {
      const variations = [
        { title: 'W.Bro.', rank: 'MM', firstName: 'Worshipful' },
        { title: 'Bro.', rank: 'FC', firstName: 'Brother' },
        { title: 'V.W.Bro.', rank: 'EA', firstName: 'VeryWorshipful' },
        { title: 'R.W.Bro.', rank: 'GL', firstName: 'RightWorshipful' },
        { title: 'M.W.Bro.', rank: 'MM', firstName: 'MostWorshipful' }
      ];
      
      // Add 5 Masons with different titles and ranks
      for (let i = 0; i < variations.length; i++) {
        if (i > 0) {
          await page.click('[data-testid="add-mason-button"]');
          await page.waitForSelector(`[data-testid="mason-${i}-title"]`);
        }
        
        const variation = variations[i];
        await page.select(`[data-testid="mason-${i}-title"]`, variation.title);
        await fillInput(page, `[data-testid="mason-${i}-firstName"]`, variation.firstName);
        await fillInput(page, `[data-testid="mason-${i}-lastName"]`, 'Mason');
        await page.select(`[data-testid="mason-${i}-rank"]`, variation.rank);
        
        // Handle GL rank special fields
        if (variation.rank === 'GL') {
          await page.waitForSelector(`[data-testid="mason-${i}-grandOfficerStatus"]`);
          await page.select(`[data-testid="mason-${i}-grandOfficerStatus"]`, 'Present');
          await page.select(`[data-testid="mason-${i}-presentGrandOfficerRole"]`, 'DepGrandMaster');
        }
        
        // Primary Mason needs full details
        if (i === 0) {
          await page.click(`[data-testid="mason-${i}-grandLodge"]`);
          await page.type(`[data-testid="mason-${i}-grandLodge"]`, 'New South Wales');
          await page.keyboard.press('Enter');
          
          await page.click(`[data-testid="mason-${i}-lodge"]`);
          await page.type(`[data-testid="mason-${i}-lodge"]`, 'Mixed Lodge');
          await page.keyboard.press('Enter');
          
          await fillInput(page, `[data-testid="mason-${i}-email"]`, 'mixed@test.com');
          await fillInput(page, `[data-testid="mason-${i}-phone"]`, '+61400000000');
        } else {
          await page.click(`[data-testid="mason-${i}-sameLodge"]`);
          await page.select(`[data-testid="mason-${i}-contactPreference"]`, 'PrimaryAttendee');
        }
      }
      
      await captureScreenshot(page, 'mixed-titles-ranks');
      
      // Verify all variations saved correctly
      for (let i = 0; i < variations.length; i++) {
        const savedTitle = await page.$eval(`[data-testid="mason-${i}-title"]`, el => el.value);
        const savedRank = await page.$eval(`[data-testid="mason-${i}-rank"]`, el => el.value);
        
        expect(savedTitle).toBe(variations[i].title);
        expect(savedRank).toBe(variations[i].rank);
      }
    });
  });
});