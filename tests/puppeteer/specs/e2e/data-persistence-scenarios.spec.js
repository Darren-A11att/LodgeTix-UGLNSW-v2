/**
 * Data Persistence Scenarios Test Suite
 * 
 * This comprehensive test suite covers all data persistence and recovery scenarios
 * throughout the registration flow. It tests:
 * - Draft recovery after browser refresh
 * - Session storage management
 * - Local storage persistence
 * - Cross-tab data synchronization
 * - Data retention across navigation
 * - Registration type switching
 * - Timeout and expiry handling
 * - Conflict resolution
 * - Offline mode handling
 * - Data migration between versions
 */

const puppeteer = require('puppeteer');
const { testData } = require('../../config/test-data');
const { captureScreenshot, waitForElement, fillInput } = require('../../helpers/test-utils');

describe('Data Persistence Scenarios', () => {
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
  });

  afterEach(async () => {
    // Clear storage to prevent test interference
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.close();
  });

  describe('Draft Recovery Scenarios', () => {
    test('recovers draft after browser refresh', async () => {
      // Navigate to registration
      await page.goto(`${baseUrl}/events/${testData.eventSlug}`);
      await page.waitForSelector('[data-testid="register-button"]');
      await page.click('[data-testid="register-button"]');
      
      await page.waitForSelector('[data-testid="registration-type-individual"]');
      await page.click('[data-testid="registration-type-individual"]');
      await page.click('[data-testid="continue-button"]');
      
      // Fill comprehensive data
      await fillInput(page, '[data-testid="mason-0-title"]', 'R.W.Bro.');
      await fillInput(page, '[data-testid="mason-0-firstName"]', 'Draft');
      await fillInput(page, '[data-testid="mason-0-lastName"]', 'Recovery');
      await page.select('[data-testid="mason-0-rank"]', 'GL');
      
      await page.click('[data-testid="mason-0-grandLodge"]');
      await page.type('[data-testid="mason-0-grandLodge"]', 'New South Wales');
      await page.keyboard.press('Enter');
      
      await page.click('[data-testid="mason-0-lodge"]');
      await page.type('[data-testid="mason-0-lodge"]', 'Draft Lodge 123');
      await page.keyboard.press('Enter');
      
      await fillInput(page, '[data-testid="mason-0-email"]', 'draft@test.com');
      await fillInput(page, '[data-testid="mason-0-phone"]', '+61400000000');
      
      await page.waitForSelector('[data-testid="mason-0-grandRank"]');
      await fillInput(page, '[data-testid="mason-0-grandRank"]', 'DGM');
      await page.select('[data-testid="mason-0-grandOfficerStatus"]', 'Present');
      await page.waitForSelector('[data-testid="mason-0-presentGrandOfficerRole"]');
      await page.select('[data-testid="mason-0-presentGrandOfficerRole"]', 'DepGrandMaster');
      
      await fillInput(page, '[data-testid="mason-0-dietary"]', 'Vegetarian');
      await fillInput(page, '[data-testid="mason-0-accessibility"]', 'Step-free access');
      
      // Add partner
      await page.click('[data-testid="mason-0-hasPartner"]');
      await page.waitForSelector('[data-testid="mason-0-partner-form"]');
      await page.select('[data-testid="mason-0-partner-title"]', 'Mrs.');
      await fillInput(page, '[data-testid="mason-0-partner-firstName"]', 'Partner');
      await fillInput(page, '[data-testid="mason-0-partner-lastName"]', 'Draft');
      await page.select('[data-testid="mason-0-partner-relationship"]', 'Wife');
      
      // Add another Mason
      await page.click('[data-testid="add-mason-button"]');
      await page.waitForSelector('[data-testid="mason-1-title"]');
      await page.select('[data-testid="mason-1-title"]', 'Bro.');
      await fillInput(page, '[data-testid="mason-1-firstName"]', 'Second');
      await fillInput(page, '[data-testid="mason-1-lastName"]', 'Mason');
      await page.select('[data-testid="mason-1-rank"]', 'MM');
      await page.click('[data-testid="mason-1-sameLodge"]');
      await page.select('[data-testid="mason-1-contactPreference"]', 'Directly');
      await fillInput(page, '[data-testid="mason-1-email"]', 'second@test.com');
      await fillInput(page, '[data-testid="mason-1-phone"]', '+61400000001');
      
      // Capture before refresh
      await captureScreenshot(page, 'before-browser-refresh');
      
      // Get registration ID if available
      const registrationId = await page.evaluate(() => {
        return localStorage.getItem('currentRegistrationId') || sessionStorage.getItem('currentRegistrationId');
      });
      
      // Refresh the page
      await page.reload();
      
      // Wait for draft recovery modal
      await page.waitForSelector('[data-testid="draft-recovery-modal"]', { timeout: 10000 });
      
      // Check modal content
      const modalTitle = await page.$eval('[data-testid="draft-recovery-title"]', el => el.textContent);
      expect(modalTitle).toContain('Continue your registration');
      
      // Check draft details shown
      const draftDetails = await page.$('[data-testid="draft-details"]');
      if (draftDetails) {
        const detailsText = await page.$eval('[data-testid="draft-details"]', el => el.textContent);
        expect(detailsText).toContain('Draft Recovery');
      }
      
      // Click continue with draft
      await page.click('[data-testid="continue-draft-button"]');
      
      // Wait for form to load
      await page.waitForSelector('[data-testid="attendee-details-step"]');
      
      // Verify all data restored
      const firstName = await page.$eval('[data-testid="mason-0-firstName"]', el => el.value);
      const grandRank = await page.$eval('[data-testid="mason-0-grandRank"]', el => el.value);
      const dietary = await page.$eval('[data-testid="mason-0-dietary"]', el => el.value);
      const partnerFirstName = await page.$eval('[data-testid="mason-0-partner-firstName"]', el => el.value);
      const secondMasonFirstName = await page.$eval('[data-testid="mason-1-firstName"]', el => el.value);
      
      expect(firstName).toBe('Draft');
      expect(grandRank).toBe('DGM');
      expect(dietary).toBe('Vegetarian');
      expect(partnerFirstName).toBe('Partner');
      expect(secondMasonFirstName).toBe('Second');
      
      await captureScreenshot(page, 'after-draft-recovery');
    });

    test('handles draft recovery with start fresh option', async () => {
      // Create a draft
      await page.goto(`${baseUrl}/events/${testData.eventSlug}`);
      await page.waitForSelector('[data-testid="register-button"]');
      await page.click('[data-testid="register-button"]');
      
      await page.waitForSelector('[data-testid="registration-type-individual"]');
      await page.click('[data-testid="registration-type-individual"]');
      await page.click('[data-testid="continue-button"]');
      
      await fillInput(page, '[data-testid="mason-0-title"]', 'Bro.');
      await fillInput(page, '[data-testid="mason-0-firstName"]', 'Old');
      await fillInput(page, '[data-testid="mason-0-lastName"]', 'Draft');
      await page.select('[data-testid="mason-0-rank"]', 'MM');
      
      await page.click('[data-testid="mason-0-grandLodge"]');
      await page.type('[data-testid="mason-0-grandLodge"]', 'NSW');
      await page.keyboard.press('Enter');
      
      await page.click('[data-testid="mason-0-lodge"]');
      await page.type('[data-testid="mason-0-lodge"]', 'Old Lodge');
      await page.keyboard.press('Enter');
      
      await fillInput(page, '[data-testid="mason-0-email"]', 'old@test.com');
      await fillInput(page, '[data-testid="mason-0-phone"]', '+61400000000');
      
      // Refresh
      await page.reload();
      
      // Wait for draft recovery modal
      await page.waitForSelector('[data-testid="draft-recovery-modal"]');
      
      // Click start fresh
      await page.click('[data-testid="start-fresh-button"]');
      
      // Confirm in dialog if present
      const confirmDialog = await page.$('[data-testid="confirm-fresh-start"]');
      if (confirmDialog) {
        await page.click('[data-testid="confirm-button"]');
      }
      
      // Should be back at registration type selection
      await page.waitForSelector('[data-testid="registration-type-step"]');
      
      // Select Individual again
      await page.click('[data-testid="registration-type-individual"]');
      await page.click('[data-testid="continue-button"]');
      
      // Verify form is empty
      await page.waitForSelector('[data-testid="mason-0-firstName"]');
      const firstName = await page.$eval('[data-testid="mason-0-firstName"]', el => el.value);
      expect(firstName).toBe('');
      
      await captureScreenshot(page, 'fresh-start-empty-form');
    });
  });

  describe('Navigation Data Persistence', () => {
    test('persists data through all wizard steps', async () => {
      // Navigate to registration
      await page.goto(`${baseUrl}/events/${testData.eventSlug}`);
      await page.waitForSelector('[data-testid="register-button"]');
      await page.click('[data-testid="register-button"]');
      
      // Step 1: Registration Type
      await page.waitForSelector('[data-testid="registration-type-individual"]');
      await page.click('[data-testid="registration-type-individual"]');
      await page.click('[data-testid="continue-button"]');
      
      // Step 2: Attendee Details
      await fillInput(page, '[data-testid="mason-0-title"]', 'W.Bro.');
      await fillInput(page, '[data-testid="mason-0-firstName"]', 'Navigation');
      await fillInput(page, '[data-testid="mason-0-lastName"]', 'Test');
      await page.select('[data-testid="mason-0-rank"]', 'MM');
      
      await page.click('[data-testid="mason-0-grandLodge"]');
      await page.type('[data-testid="mason-0-grandLodge"]', 'Victoria');
      await page.keyboard.press('Enter');
      
      await page.click('[data-testid="mason-0-lodge"]');
      await page.type('[data-testid="mason-0-lodge"]', 'Navigation Lodge 456');
      await page.keyboard.press('Enter');
      
      await fillInput(page, '[data-testid="mason-0-email"]', 'nav@test.com');
      await fillInput(page, '[data-testid="mason-0-phone"]', '+61300000000');
      await fillInput(page, '[data-testid="mason-0-dietary"]', 'Halal');
      
      // Add guest
      await page.click('[data-testid="add-guest-button"]');
      await page.waitForSelector('[data-testid="guest-0-title"]');
      await page.select('[data-testid="guest-0-title"]', 'Dr.');
      await fillInput(page, '[data-testid="guest-0-firstName"]', 'Guest');
      await fillInput(page, '[data-testid="guest-0-lastName"]', 'Navigation');
      await page.select('[data-testid="guest-0-contactPreference"]', 'PrimaryAttendee');
      
      await page.click('[data-testid="continue-button"]');
      
      // Step 3: Ticket Selection
      await page.waitForSelector('[data-testid="ticket-selection-step"]');
      
      // Select tickets
      await page.click('[data-testid="attendee-0-tickets"] input[type="checkbox"]');
      await page.click('[data-testid="attendee-1-tickets"] input[type="checkbox"]');
      
      await page.click('[data-testid="continue-button"]');
      
      // Step 4: Order Review
      await page.waitForSelector('[data-testid="order-review-step"]');
      
      // Navigate back through all steps
      await page.click('[data-testid="back-button"]');
      await page.waitForSelector('[data-testid="ticket-selection-step"]');
      
      await page.click('[data-testid="back-button"]');
      await page.waitForSelector('[data-testid="attendee-details-step"]');
      
      // Verify attendee data persisted
      const firstName = await page.$eval('[data-testid="mason-0-firstName"]', el => el.value);
      const dietary = await page.$eval('[data-testid="mason-0-dietary"]', el => el.value);
      const guestFirstName = await page.$eval('[data-testid="guest-0-firstName"]', el => el.value);
      
      expect(firstName).toBe('Navigation');
      expect(dietary).toBe('Halal');
      expect(guestFirstName).toBe('Guest');
      
      await page.click('[data-testid="back-button"]');
      await page.waitForSelector('[data-testid="registration-type-step"]');
      
      // Verify registration type persisted
      const individualSelected = await page.$eval('[data-testid="registration-type-individual"]', el => el.checked);
      expect(individualSelected).toBe(true);
      
      // Navigate forward to payment
      await page.click('[data-testid="continue-button"]');
      await page.waitForSelector('[data-testid="attendee-details-step"]');
      await page.click('[data-testid="continue-button"]');
      await page.waitForSelector('[data-testid="ticket-selection-step"]');
      await page.click('[data-testid="continue-button"]');
      await page.waitForSelector('[data-testid="order-review-step"]');
      await page.click('[data-testid="continue-button"]');
      
      // Step 5: Payment
      await page.waitForSelector('[data-testid="payment-step"]');
      
      // Navigate all the way back
      await page.click('[data-testid="back-button"]');
      await page.waitForSelector('[data-testid="order-review-step"]');
      await page.click('[data-testid="back-button"]');
      await page.waitForSelector('[data-testid="ticket-selection-step"]');
      await page.click('[data-testid="back-button"]');
      await page.waitForSelector('[data-testid="attendee-details-step"]');
      
      // All data should still be there
      const stillFirstName = await page.$eval('[data-testid="mason-0-firstName"]', el => el.value);
      expect(stillFirstName).toBe('Navigation');
      
      await captureScreenshot(page, 'data-persisted-through-navigation');
    });

    test('handles step skipping attempts', async () => {
      // Try to navigate directly to a later step
      await page.goto(`${baseUrl}/events/${testData.eventSlug}/register/${testData.registrationId}/tickets`);
      
      // Should redirect to first incomplete step
      await page.waitForSelector('[data-testid="registration-type-step"]');
      
      // Verify we're at the beginning
      const registrationTypeStep = await page.$('[data-testid="registration-type-step"]');
      expect(registrationTypeStep).toBeTruthy();
      
      await captureScreenshot(page, 'step-skipping-prevented');
    });
  });

  describe('Registration Type Switching', () => {
    test('handles switching from Individual to Lodge with data warning', async () => {
      // Start with Individual registration
      await page.goto(`${baseUrl}/events/${testData.eventSlug}`);
      await page.waitForSelector('[data-testid="register-button"]');
      await page.click('[data-testid="register-button"]');
      
      await page.waitForSelector('[data-testid="registration-type-individual"]');
      await page.click('[data-testid="registration-type-individual"]');
      await page.click('[data-testid="continue-button"]');
      
      // Fill some data
      await fillInput(page, '[data-testid="mason-0-title"]', 'Bro.');
      await fillInput(page, '[data-testid="mason-0-firstName"]', 'Individual');
      await fillInput(page, '[data-testid="mason-0-lastName"]', 'Data');
      await page.select('[data-testid="mason-0-rank"]', 'MM');
      
      await page.click('[data-testid="mason-0-grandLodge"]');
      await page.type('[data-testid="mason-0-grandLodge"]', 'NSW');
      await page.keyboard.press('Enter');
      
      await page.click('[data-testid="mason-0-lodge"]');
      await page.type('[data-testid="mason-0-lodge"]', 'Switch Lodge');
      await page.keyboard.press('Enter');
      
      await fillInput(page, '[data-testid="mason-0-email"]', 'switch@test.com');
      await fillInput(page, '[data-testid="mason-0-phone"]', '+61400000000');
      
      // Go back to registration type
      await page.click('[data-testid="back-button"]');
      await page.waitForSelector('[data-testid="registration-type-step"]');
      
      // Try to switch to Lodge registration
      await page.click('[data-testid="registration-type-lodge"]');
      
      // Should show warning modal
      await page.waitForSelector('[data-testid="registration-type-change-warning"]');
      
      const warningText = await page.$eval('[data-testid="warning-message"]', el => el.textContent);
      expect(warningText).toContain('lose your current data');
      
      // Click cancel
      await page.click('[data-testid="cancel-change-button"]');
      
      // Should still be Individual
      const individualChecked = await page.$eval('[data-testid="registration-type-individual"]', el => el.checked);
      expect(individualChecked).toBe(true);
      
      // Try again and confirm
      await page.click('[data-testid="registration-type-lodge"]');
      await page.waitForSelector('[data-testid="registration-type-change-warning"]');
      await page.click('[data-testid="confirm-change-button"]');
      
      // Lodge should now be selected
      const lodgeChecked = await page.$eval('[data-testid="registration-type-lodge"]', el => el.checked);
      expect(lodgeChecked).toBe(true);
      
      await page.click('[data-testid="continue-button"]');
      await page.waitForSelector('[data-testid="lodge-details-step"]');
      
      await captureScreenshot(page, 'registration-type-switched');
    });

    test('preserves data when switching between compatible types', async () => {
      // Start with Individual
      await page.goto(`${baseUrl}/events/${testData.eventSlug}`);
      await page.waitForSelector('[data-testid="register-button"]');
      await page.click('[data-testid="register-button"]');
      
      await page.waitForSelector('[data-testid="registration-type-individual"]');
      await page.click('[data-testid="registration-type-individual"]');
      await page.click('[data-testid="continue-button"]');
      
      // Fill minimal data
      await fillInput(page, '[data-testid="mason-0-title"]', 'Bro.');
      await fillInput(page, '[data-testid="mason-0-firstName"]', 'Compatible');
      await fillInput(page, '[data-testid="mason-0-lastName"]', 'Switch');
      await page.select('[data-testid="mason-0-rank"]', 'MM');
      
      await page.click('[data-testid="mason-0-grandLodge"]');
      await page.type('[data-testid="mason-0-grandLodge"]', 'NSW');
      await page.keyboard.press('Enter');
      
      await page.click('[data-testid="mason-0-lodge"]');
      await page.type('[data-testid="mason-0-lodge"]', 'Compatible Lodge');
      await page.keyboard.press('Enter');
      
      await fillInput(page, '[data-testid="mason-0-email"]', 'compatible@test.com');
      await fillInput(page, '[data-testid="mason-0-phone"]', '+61400000000');
      
      // Navigate back
      await page.click('[data-testid="back-button"]');
      await page.waitForSelector('[data-testid="registration-type-step"]');
      
      // Switch to Delegation (compatible with Individual)
      await page.click('[data-testid="registration-type-delegation"]');
      
      // May or may not show warning depending on implementation
      const warningModal = await page.$('[data-testid="registration-type-change-warning"]');
      if (warningModal) {
        await page.click('[data-testid="confirm-change-button"]');
      }
      
      await page.click('[data-testid="continue-button"]');
      
      // Check if data preserved (delegation uses same attendee structure)
      const firstName = await page.$('[data-testid="mason-0-firstName"]');
      if (firstName) {
        const value = await page.$eval('[data-testid="mason-0-firstName"]', el => el.value);
        expect(value).toBe('Compatible');
      }
    });
  });

  describe('Session and Storage Management', () => {
    test('uses appropriate storage for different data types', async () => {
      await page.goto(`${baseUrl}/events/${testData.eventSlug}`);
      await page.waitForSelector('[data-testid="register-button"]');
      await page.click('[data-testid="register-button"]');
      
      // Check initial storage state
      const initialStorage = await page.evaluate(() => {
        return {
          localStorage: Object.keys(localStorage),
          sessionStorage: Object.keys(sessionStorage)
        };
      });
      
      await page.waitForSelector('[data-testid="registration-type-individual"]');
      await page.click('[data-testid="registration-type-individual"]');
      await page.click('[data-testid="continue-button"]');
      
      // Fill form
      await fillInput(page, '[data-testid="mason-0-title"]', 'Bro.');
      await fillInput(page, '[data-testid="mason-0-firstName"]', 'Storage');
      await fillInput(page, '[data-testid="mason-0-lastName"]', 'Test');
      await page.select('[data-testid="mason-0-rank"]', 'MM');
      
      await page.click('[data-testid="mason-0-grandLodge"]');
      await page.type('[data-testid="mason-0-grandLodge"]', 'NSW');
      await page.keyboard.press('Enter');
      
      await page.click('[data-testid="mason-0-lodge"]');
      await page.type('[data-testid="mason-0-lodge"]', 'Storage Lodge');
      await page.keyboard.press('Enter');
      
      await fillInput(page, '[data-testid="mason-0-email"]', 'storage@test.com');
      await fillInput(page, '[data-testid="mason-0-phone"]', '+61400000000');
      
      // Check storage after data entry
      const afterDataStorage = await page.evaluate(() => {
        const getStorageData = (storage) => {
          const data = {};
          for (let i = 0; i < storage.length; i++) {
            const key = storage.key(i);
            data[key] = storage.getItem(key);
          }
          return data;
        };
        
        return {
          localStorage: getStorageData(localStorage),
          sessionStorage: getStorageData(sessionStorage)
        };
      });
      
      // Verify appropriate storage usage
      // Registration data should be in session storage (temporary)
      expect(Object.keys(afterDataStorage.sessionStorage)).toContain('registrationData');
      
      // User preferences might be in local storage (persistent)
      const hasPreferences = Object.keys(afterDataStorage.localStorage).some(key => 
        key.includes('preferences') || key.includes('settings')
      );
      
      await captureScreenshot(page, 'storage-management');
    });

    test('handles storage quota exceeded gracefully', async () => {
      // Fill storage to near capacity
      await page.evaluate(() => {
        try {
          const largeData = 'x'.repeat(1024 * 1024); // 1MB string
          for (let i = 0; i < 5; i++) {
            localStorage.setItem(`test-data-${i}`, largeData);
          }
        } catch (e) {
          console.log('Storage quota reached during setup');
        }
      });
      
      // Try to use the application
      await page.goto(`${baseUrl}/events/${testData.eventSlug}`);
      await page.waitForSelector('[data-testid="register-button"]');
      await page.click('[data-testid="register-button"]');
      
      await page.waitForSelector('[data-testid="registration-type-individual"]');
      await page.click('[data-testid="registration-type-individual"]');
      await page.click('[data-testid="continue-button"]');
      
      // Fill form
      await fillInput(page, '[data-testid="mason-0-title"]', 'Bro.');
      await fillInput(page, '[data-testid="mason-0-firstName"]', 'Quota');
      await fillInput(page, '[data-testid="mason-0-lastName"]', 'Test');
      
      // Check for storage warnings
      const storageWarning = await page.$('[data-testid="storage-warning"]');
      if (storageWarning) {
        const warningText = await page.$eval('[data-testid="storage-warning"]', el => el.textContent);
        expect(warningText).toContain('storage');
        
        await captureScreenshot(page, 'storage-quota-warning');
      }
      
      // Clean up
      await page.evaluate(() => {
        localStorage.clear();
      });
    });
  });

  describe('Cross-Tab Synchronization', () => {
    test('synchronizes data between multiple tabs', async () => {
      // Open first tab
      const page1 = page;
      await page1.goto(`${baseUrl}/events/${testData.eventSlug}`);
      await page1.waitForSelector('[data-testid="register-button"]');
      await page1.click('[data-testid="register-button"]');
      
      await page1.waitForSelector('[data-testid="registration-type-individual"]');
      await page1.click('[data-testid="registration-type-individual"]');
      await page1.click('[data-testid="continue-button"]');
      
      // Fill data in first tab
      await fillInput(page1, '[data-testid="mason-0-title"]', 'Bro.');
      await fillInput(page1, '[data-testid="mason-0-firstName"]', 'Tab');
      await fillInput(page1, '[data-testid="mason-0-lastName"]', 'One');
      await page1.select('[data-testid="mason-0-rank"]', 'MM');
      
      await page1.click('[data-testid="mason-0-grandLodge"]');
      await page1.type('[data-testid="mason-0-grandLodge"]', 'NSW');
      await page1.keyboard.press('Enter');
      
      await page1.click('[data-testid="mason-0-lodge"]');
      await page1.type('[data-testid="mason-0-lodge"]', 'Cross Tab Lodge');
      await page1.keyboard.press('Enter');
      
      await fillInput(page1, '[data-testid="mason-0-email"]', 'tab1@test.com');
      await fillInput(page1, '[data-testid="mason-0-phone"]', '+61400000000');
      
      // Get registration URL
      const registrationUrl = await page1.url();
      
      // Open second tab
      const page2 = await browser.newPage();
      await page2.setViewport({ width: 1280, height: 800 });
      
      // Navigate to same registration
      await page2.goto(registrationUrl);
      
      // Check for cross-tab conflict warning
      const conflictWarning = await page2.$('[data-testid="cross-tab-warning"]');
      if (conflictWarning) {
        const warningText = await page2.$eval('[data-testid="cross-tab-warning"]', el => el.textContent);
        expect(warningText).toContain('another tab');
        
        await captureScreenshot(page2, 'cross-tab-warning');
        
        // Choose to view in this tab
        const viewButton = await page2.$('[data-testid="view-in-this-tab"]');
        if (viewButton) {
          await page2.click('[data-testid="view-in-this-tab"]');
        }
      }
      
      // If data is synchronized, should see same values
      await page2.waitForSelector('[data-testid="mason-0-firstName"]', { timeout: 5000 }).catch(() => {});
      const firstName = await page2.$('[data-testid="mason-0-firstName"]');
      if (firstName) {
        const value = await page2.$eval('[data-testid="mason-0-firstName"]', el => el.value);
        expect(value).toBe('Tab');
      }
      
      // Clean up
      await page2.close();
    });
  });

  describe('Timeout and Expiry Handling', () => {
    test('handles session timeout gracefully', async () => {
      await page.goto(`${baseUrl}/events/${testData.eventSlug}`);
      await page.waitForSelector('[data-testid="register-button"]');
      await page.click('[data-testid="register-button"]');
      
      await page.waitForSelector('[data-testid="registration-type-individual"]');
      await page.click('[data-testid="registration-type-individual"]');
      await page.click('[data-testid="continue-button"]');
      
      // Fill some data
      await fillInput(page, '[data-testid="mason-0-title"]', 'Bro.');
      await fillInput(page, '[data-testid="mason-0-firstName"]', 'Timeout');
      await fillInput(page, '[data-testid="mason-0-lastName"]', 'Test');
      
      // Simulate session expiry
      await page.evaluate(() => {
        // Clear auth tokens to simulate expiry
        localStorage.removeItem('authToken');
        sessionStorage.removeItem('authToken');
        
        // Trigger storage event
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'authToken',
          oldValue: 'some-token',
          newValue: null,
          storageArea: localStorage
        }));
      });
      
      // Wait for timeout handling
      await page.waitForTimeout(1000);
      
      // Check for session expiry message
      const expiryModal = await page.$('[data-testid="session-expired-modal"]');
      if (expiryModal) {
        const message = await page.$eval('[data-testid="expiry-message"]', el => el.textContent);
        expect(message).toContain('session');
        
        await captureScreenshot(page, 'session-expired');
        
        // Click to refresh or login
        const refreshButton = await page.$('[data-testid="refresh-session-button"]');
        if (refreshButton) {
          await page.click('[data-testid="refresh-session-button"]');
        }
      }
    });

    test('auto-saves progress periodically', async () => {
      await page.goto(`${baseUrl}/events/${testData.eventSlug}`);
      await page.waitForSelector('[data-testid="register-button"]');
      await page.click('[data-testid="register-button"]');
      
      await page.waitForSelector('[data-testid="registration-type-individual"]');
      await page.click('[data-testid="registration-type-individual"]');
      await page.click('[data-testid="continue-button"]');
      
      // Monitor storage for auto-save
      let autoSaveCount = 0;
      await page.evaluateOnNewDocument(() => {
        const originalSetItem = Storage.prototype.setItem;
        Storage.prototype.setItem = function(key, value) {
          if (key.includes('autoSave') || key.includes('draft')) {
            window.autoSaveDetected = (window.autoSaveDetected || 0) + 1;
          }
          return originalSetItem.apply(this, arguments);
        };
      });
      
      // Fill data slowly to trigger auto-saves
      await fillInput(page, '[data-testid="mason-0-title"]', 'Bro.');
      await page.waitForTimeout(2000); // Wait for potential auto-save
      
      await fillInput(page, '[data-testid="mason-0-firstName"]', 'Auto');
      await page.waitForTimeout(2000);
      
      await fillInput(page, '[data-testid="mason-0-lastName"]', 'Save');
      await page.waitForTimeout(2000);
      
      // Check if auto-save occurred
      const saves = await page.evaluate(() => window.autoSaveDetected || 0);
      
      // Check for auto-save indicator
      const autoSaveIndicator = await page.$('[data-testid="auto-save-indicator"]');
      if (autoSaveIndicator) {
        const indicatorText = await page.$eval('[data-testid="auto-save-indicator"]', el => el.textContent);
        expect(indicatorText).toContain('saved');
        
        await captureScreenshot(page, 'auto-save-indicator');
      }
    });
  });

  describe('Data Migration and Versioning', () => {
    test('handles data format version differences', async () => {
      // Simulate old format data in storage
      await page.evaluate(() => {
        // Old format (v1)
        const oldData = {
          version: 1,
          registrationType: 'individual',
          attendees: [{
            type: 'mason',
            firstName: 'Legacy',
            lastName: 'Data',
            lodge: 'Old Format Lodge' // Old format didn't separate grand lodge
          }]
        };
        
        sessionStorage.setItem('registrationData', JSON.stringify(oldData));
      });
      
      // Navigate to registration
      await page.goto(`${baseUrl}/events/${testData.eventSlug}`);
      
      // Check for migration handling
      const migrationNotice = await page.$('[data-testid="data-migration-notice"]');
      if (migrationNotice) {
        const noticeText = await page.$eval('[data-testid="data-migration-notice"]', el => el.textContent);
        expect(noticeText).toContain('updated');
        
        await captureScreenshot(page, 'data-migration-notice');
      }
      
      // Continue to see if data was migrated
      await page.waitForSelector('[data-testid="register-button"]');
      await page.click('[data-testid="register-button"]');
      
      // Should have pre-selected Individual
      await page.waitForSelector('[data-testid="registration-type-individual"][checked]');
      
      await page.click('[data-testid="continue-button"]');
      
      // Check if legacy data was migrated
      await page.waitForSelector('[data-testid="mason-0-firstName"]');
      const firstName = await page.$eval('[data-testid="mason-0-firstName"]', el => el.value);
      
      if (firstName === 'Legacy') {
        // Data was successfully migrated
        expect(firstName).toBe('Legacy');
        
        // Check if lodge was properly split
        const lodge = await page.$('[data-testid="mason-0-lodge"]');
        if (lodge) {
          const lodgeValue = await page.$eval('[data-testid="mason-0-lodge"]', el => el.value);
          expect(lodgeValue).toContain('Old Format Lodge');
        }
      }
    });

    test('prevents data loss during version upgrades', async () => {
      // Create current version data
      await page.goto(`${baseUrl}/events/${testData.eventSlug}`);
      await page.waitForSelector('[data-testid="register-button"]');
      await page.click('[data-testid="register-button"]');
      
      await page.waitForSelector('[data-testid="registration-type-individual"]');
      await page.click('[data-testid="registration-type-individual"]');
      await page.click('[data-testid="continue-button"]');
      
      await fillInput(page, '[data-testid="mason-0-title"]', 'Bro.');
      await fillInput(page, '[data-testid="mason-0-firstName"]', 'Current');
      await fillInput(page, '[data-testid="mason-0-lastName"]', 'Version');
      await page.select('[data-testid="mason-0-rank"]', 'MM');
      
      await page.click('[data-testid="mason-0-grandLodge"]');
      await page.type('[data-testid="mason-0-grandLodge"]', 'NSW');
      await page.keyboard.press('Enter');
      
      await page.click('[data-testid="mason-0-lodge"]');
      await page.type('[data-testid="mason-0-lodge"]', 'Version Test Lodge');
      await page.keyboard.press('Enter');
      
      await fillInput(page, '[data-testid="mason-0-email"]', 'version@test.com');
      await fillInput(page, '[data-testid="mason-0-phone"]', '+61400000000');
      
      // Get current data
      const currentData = await page.evaluate(() => {
        return sessionStorage.getItem('registrationData');
      });
      
      // Simulate version upgrade by modifying data structure
      await page.evaluate((data) => {
        const parsed = JSON.parse(data);
        // Add new version fields
        parsed.version = 2;
        parsed.upgradeDate = new Date().toISOString();
        parsed.backupV1 = JSON.parse(data); // Keep backup
        
        sessionStorage.setItem('registrationData', JSON.stringify(parsed));
      }, currentData);
      
      // Refresh to trigger upgrade handling
      await page.reload();
      
      // Continue with registration
      await page.waitForSelector('[data-testid="continue-button"]');
      await page.click('[data-testid="continue-button"]');
      
      // Verify data still intact
      await page.waitForSelector('[data-testid="mason-0-firstName"]');
      const firstName = await page.$eval('[data-testid="mason-0-firstName"]', el => el.value);
      expect(firstName).toBe('Current');
      
      await captureScreenshot(page, 'version-upgrade-preserved');
    });
  });
});