/**
 * Ticket Eligibility Matrix Test Suite
 * 
 * This comprehensive test suite covers all ticket eligibility scenarios based on
 * attendee types and ticket configurations. It tests:
 * - Mason-only tickets
 * - Guest-only tickets
 * - Mixed eligibility tickets
 * - Package vs individual ticket eligibility
 * - Partner eligibility (always treated as guests)
 * - Sold out ticket scenarios
 * - Inactive ticket handling
 * - Real-time availability updates
 * - Complex eligibility rules
 * - Lodge bulk ticket selection
 */

const puppeteer = require('puppeteer');
const { testData } = require('../../config/test-data');
const { captureScreenshot, waitForElement, fillInput } = require('../../helpers/test-utils');

describe('Ticket Eligibility Matrix', () => {
  let browser;
  let page;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  // Mock ticket configurations
  const mockTickets = {
    masonOnly: {
      id: 'ticket-mason-only',
      name: 'Mason Banquet Ticket',
      eligibleAttendeeTypes: ['mason'],
      price: 150,
      available: 100
    },
    guestOnly: {
      id: 'ticket-guest-only', 
      name: 'Guest Reception Ticket',
      eligibleAttendeeTypes: ['guest'],
      price: 120,
      available: 50
    },
    allAttendees: {
      id: 'ticket-all',
      name: 'Grand Installation Ceremony',
      eligibleAttendeeTypes: ['mason', 'guest'],
      price: 200,
      available: 500
    },
    ladiesLuncheon: {
      id: 'ticket-ladies',
      name: 'Ladies Luncheon',
      eligibleAttendeeTypes: ['guest'], // Partners are guests
      price: 85,
      available: 80
    },
    vipPackage: {
      id: 'package-vip',
      name: 'VIP Experience Package',
      eligibleAttendeeTypes: ['mason'],
      price: 500,
      available: 20,
      isPackage: true
    },
    couplePackage: {
      id: 'package-couple',
      name: 'Couples Package',
      eligibleAttendeeTypes: ['mason', 'guest'],
      price: 350,
      available: 40,
      isPackage: true
    },
    soldOut: {
      id: 'ticket-sold-out',
      name: 'Gala Dinner (SOLD OUT)',
      eligibleAttendeeTypes: ['mason', 'guest'],
      price: 180,
      available: 0
    },
    inactive: {
      id: 'ticket-inactive',
      name: 'Early Bird Special',
      eligibleAttendeeTypes: ['mason', 'guest'],
      price: 100,
      available: 100,
      active: false
    }
  };

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
    await page.close();
  });

  describe('Individual Registration Eligibility', () => {
    beforeEach(async () => {
      // Navigate through to ticket selection
      await page.goto(`${baseUrl}/events/${testData.eventSlug}`);
      await page.waitForSelector('[data-testid="register-button"]');
      await page.click('[data-testid="register-button"]');
      
      await page.waitForSelector('[data-testid="registration-type-individual"]');
      await page.click('[data-testid="registration-type-individual"]');
      await page.click('[data-testid="continue-button"]');
      
      // Add primary Mason
      await fillInput(page, '[data-testid="mason-0-title"]', 'Bro.');
      await fillInput(page, '[data-testid="mason-0-firstName"]', 'Test');
      await fillInput(page, '[data-testid="mason-0-lastName"]', 'Mason');
      await page.select('[data-testid="mason-0-rank"]', 'MM');
      
      await page.click('[data-testid="mason-0-grandLodge"]');
      await page.type('[data-testid="mason-0-grandLodge"]', 'NSW');
      await page.keyboard.press('Enter');
      
      await page.click('[data-testid="mason-0-lodge"]');
      await page.type('[data-testid="mason-0-lodge"]', 'Test Lodge');
      await page.keyboard.press('Enter');
      
      await fillInput(page, '[data-testid="mason-0-email"]', 'test@test.com');
      await fillInput(page, '[data-testid="mason-0-phone"]', '+61400000000');
    });

    test('Mason sees only Mason-eligible tickets', async () => {
      // Continue to ticket selection
      await page.click('[data-testid="continue-button"]');
      await page.waitForSelector('[data-testid="ticket-selection-step"]');
      
      // Check Mason's available tickets
      const masonTicketSection = await page.waitForSelector('[data-testid="attendee-0-tickets"]');
      
      // Should see Mason-only and mixed tickets
      const masonOnlyTicket = await page.$('[data-testid="ticket-mason-only"]');
      const allAttendeesTicket = await page.$('[data-testid="ticket-all"]');
      const vipPackage = await page.$('[data-testid="package-vip"]');
      const couplePackage = await page.$('[data-testid="package-couple"]');
      
      expect(masonOnlyTicket).toBeTruthy();
      expect(allAttendeesTicket).toBeTruthy();
      expect(vipPackage).toBeTruthy();
      expect(couplePackage).toBeTruthy();
      
      // Should NOT see Guest-only tickets
      const guestOnlyTicket = await page.$('[data-testid="ticket-guest-only"]');
      const ladiesTicket = await page.$('[data-testid="ticket-ladies"]');
      
      expect(guestOnlyTicket).toBeFalsy();
      expect(ladiesTicket).toBeFalsy();
      
      // Should see sold out ticket but disabled
      const soldOutTicket = await page.$('[data-testid="ticket-sold-out"][disabled]');
      expect(soldOutTicket).toBeTruthy();
      
      // Should NOT see inactive ticket
      const inactiveTicket = await page.$('[data-testid="ticket-inactive"]');
      expect(inactiveTicket).toBeFalsy();
      
      await captureScreenshot(page, 'mason-eligible-tickets');
    });

    test('Guest sees only Guest-eligible tickets', async () => {
      // Add a guest
      await page.click('[data-testid="add-guest-button"]');
      await page.waitForSelector('[data-testid="guest-0-title"]');
      await page.select('[data-testid="guest-0-title"]', 'Mr.');
      await fillInput(page, '[data-testid="guest-0-firstName"]', 'Test');
      await fillInput(page, '[data-testid="guest-0-lastName"]', 'Guest');
      await page.select('[data-testid="guest-0-contactPreference"]', 'PrimaryAttendee');
      
      // Continue to ticket selection
      await page.click('[data-testid="continue-button"]');
      await page.waitForSelector('[data-testid="ticket-selection-step"]');
      
      // Check Guest's available tickets
      const guestTicketSection = await page.waitForSelector('[data-testid="attendee-1-tickets"]');
      
      // Should see Guest-only and mixed tickets
      const guestOnlyTicket = await page.$('[data-testid="attendee-1-tickets"] [data-testid="ticket-guest-only"]');
      const allAttendeesTicket = await page.$('[data-testid="attendee-1-tickets"] [data-testid="ticket-all"]');
      const ladiesTicket = await page.$('[data-testid="attendee-1-tickets"] [data-testid="ticket-ladies"]');
      const couplePackage = await page.$('[data-testid="attendee-1-tickets"] [data-testid="package-couple"]');
      
      expect(guestOnlyTicket).toBeTruthy();
      expect(allAttendeesTicket).toBeTruthy();
      expect(ladiesTicket).toBeTruthy();
      expect(couplePackage).toBeTruthy();
      
      // Should NOT see Mason-only tickets
      const masonOnlyTicket = await page.$('[data-testid="attendee-1-tickets"] [data-testid="ticket-mason-only"]');
      const vipPackage = await page.$('[data-testid="attendee-1-tickets"] [data-testid="package-vip"]');
      
      expect(masonOnlyTicket).toBeFalsy();
      expect(vipPackage).toBeFalsy();
      
      await captureScreenshot(page, 'guest-eligible-tickets');
    });

    test('Partners are treated as guests for eligibility', async () => {
      // Add partner to Mason
      await page.click('[data-testid="mason-0-hasPartner"]');
      await page.waitForSelector('[data-testid="mason-0-partner-form"]');
      await page.select('[data-testid="mason-0-partner-title"]', 'Mrs.');
      await fillInput(page, '[data-testid="mason-0-partner-firstName"]', 'Mason');
      await fillInput(page, '[data-testid="mason-0-partner-lastName"]', 'Partner');
      await page.select('[data-testid="mason-0-partner-relationship"]', 'Wife');
      
      // Continue to ticket selection
      await page.click('[data-testid="continue-button"]');
      await page.waitForSelector('[data-testid="ticket-selection-step"]');
      
      // Partner should have guest eligibility
      const partnerTicketSection = await page.waitForSelector('[data-testid="attendee-1-tickets"]');
      
      // Should see guest tickets
      const guestTicket = await page.$('[data-testid="attendee-1-tickets"] [data-testid="ticket-guest-only"]');
      const ladiesTicket = await page.$('[data-testid="attendee-1-tickets"] [data-testid="ticket-ladies"]');
      
      expect(guestTicket).toBeTruthy();
      expect(ladiesTicket).toBeTruthy();
      
      // Should NOT see Mason-only tickets
      const masonTicket = await page.$('[data-testid="attendee-1-tickets"] [data-testid="ticket-mason-only"]');
      expect(masonTicket).toBeFalsy();
      
      await captureScreenshot(page, 'partner-guest-eligibility');
    });
  });

  describe('Package Selection Behavior', () => {
    beforeEach(async () => {
      // Setup registration with Mason and Guest
      await page.goto(`${baseUrl}/events/${testData.eventSlug}`);
      await page.waitForSelector('[data-testid="register-button"]');
      await page.click('[data-testid="register-button"]');
      
      await page.waitForSelector('[data-testid="registration-type-individual"]');
      await page.click('[data-testid="registration-type-individual"]');
      await page.click('[data-testid="continue-button"]');
      
      // Add Mason
      await fillInput(page, '[data-testid="mason-0-title"]', 'Bro.');
      await fillInput(page, '[data-testid="mason-0-firstName"]', 'Package');
      await fillInput(page, '[data-testid="mason-0-lastName"]', 'Test');
      await page.select('[data-testid="mason-0-rank"]', 'MM');
      
      await page.click('[data-testid="mason-0-grandLodge"]');
      await page.type('[data-testid="mason-0-grandLodge"]', 'NSW');
      await page.keyboard.press('Enter');
      
      await page.click('[data-testid="mason-0-lodge"]');
      await page.type('[data-testid="mason-0-lodge"]', 'Package Lodge');
      await page.keyboard.press('Enter');
      
      await fillInput(page, '[data-testid="mason-0-email"]', 'package@test.com');
      await fillInput(page, '[data-testid="mason-0-phone"]', '+61400000000');
      
      await page.click('[data-testid="continue-button"]');
      await page.waitForSelector('[data-testid="ticket-selection-step"]');
    });

    test('package selection overrides individual tickets', async () => {
      // First select individual tickets
      await page.click('[data-testid="attendee-0-tickets"] [data-testid="ticket-mason-only"]');
      await page.click('[data-testid="attendee-0-tickets"] [data-testid="ticket-all"]');
      
      // Verify tickets selected
      let selectedTickets = await page.$$('[data-testid="attendee-0-tickets"] input[type="checkbox"]:checked');
      expect(selectedTickets.length).toBe(2);
      
      // Now select a package
      await page.click('[data-testid="attendee-0-tickets"] [data-testid="package-vip"]');
      
      // Individual tickets should be deselected
      selectedTickets = await page.$$('[data-testid="attendee-0-tickets"] input[type="checkbox"]:checked');
      expect(selectedTickets.length).toBe(1);
      
      const packageSelected = await page.$('[data-testid="attendee-0-tickets"] [data-testid="package-vip"]:checked');
      expect(packageSelected).toBeTruthy();
      
      await captureScreenshot(page, 'package-overrides-tickets');
    });

    test('switching from package back to individual tickets', async () => {
      // Select package first
      await page.click('[data-testid="attendee-0-tickets"] [data-testid="package-vip"]');
      
      // Deselect package and select individual tickets
      await page.click('[data-testid="attendee-0-tickets"] [data-testid="package-vip"]'); // Deselect
      await page.click('[data-testid="attendee-0-tickets"] [data-testid="ticket-mason-only"]');
      await page.click('[data-testid="attendee-0-tickets"] [data-testid="ticket-all"]');
      
      // Verify individual tickets selected
      const masonTicket = await page.$('[data-testid="attendee-0-tickets"] [data-testid="ticket-mason-only"]:checked');
      const allTicket = await page.$('[data-testid="attendee-0-tickets"] [data-testid="ticket-all"]:checked');
      const packageTicket = await page.$('[data-testid="attendee-0-tickets"] [data-testid="package-vip"]:checked');
      
      expect(masonTicket).toBeTruthy();
      expect(allTicket).toBeTruthy();
      expect(packageTicket).toBeFalsy();
      
      await captureScreenshot(page, 'individual-tickets-selected');
    });
  });

  describe('Complex Eligibility Scenarios', () => {
    test('mixed group with varied eligibility', async () => {
      // Setup complex group
      await page.goto(`${baseUrl}/events/${testData.eventSlug}`);
      await page.waitForSelector('[data-testid="register-button"]');
      await page.click('[data-testid="register-button"]');
      
      await page.waitForSelector('[data-testid="registration-type-individual"]');
      await page.click('[data-testid="registration-type-individual"]');
      await page.click('[data-testid="continue-button"]');
      
      // Grand Officer Mason
      await fillInput(page, '[data-testid="mason-0-title"]', 'R.W.Bro.');
      await fillInput(page, '[data-testid="mason-0-firstName"]', 'Grand');
      await fillInput(page, '[data-testid="mason-0-lastName"]', 'Officer');
      await page.select('[data-testid="mason-0-rank"]', 'GL');
      
      await page.click('[data-testid="mason-0-grandLodge"]');
      await page.type('[data-testid="mason-0-grandLodge"]', 'NSW');
      await page.keyboard.press('Enter');
      
      await page.click('[data-testid="mason-0-lodge"]');
      await page.type('[data-testid="mason-0-lodge"]', 'Grand Lodge');
      await page.keyboard.press('Enter');
      
      await fillInput(page, '[data-testid="mason-0-email"]', 'go@test.com');
      await fillInput(page, '[data-testid="mason-0-phone"]', '+61400000000');
      await fillInput(page, '[data-testid="mason-0-grandRank"]', 'DGM');
      await page.select('[data-testid="mason-0-grandOfficerStatus"]', 'Present');
      await page.waitForSelector('[data-testid="mason-0-presentGrandOfficerRole"]');
      await page.select('[data-testid="mason-0-presentGrandOfficerRole"]', 'DepGrandMaster');
      
      // Add partner
      await page.click('[data-testid="mason-0-hasPartner"]');
      await page.waitForSelector('[data-testid="mason-0-partner-form"]');
      await page.select('[data-testid="mason-0-partner-title"]', 'Mrs.');
      await fillInput(page, '[data-testid="mason-0-partner-firstName"]', 'Lady');
      await fillInput(page, '[data-testid="mason-0-partner-lastName"]', 'Officer');
      await page.select('[data-testid="mason-0-partner-relationship"]', 'Wife');
      
      // Regular Mason
      await page.click('[data-testid="add-mason-button"]');
      await page.waitForSelector('[data-testid="mason-1-title"]');
      await page.select('[data-testid="mason-1-title"]', 'Bro.');
      await fillInput(page, '[data-testid="mason-1-firstName"]', 'Regular');
      await fillInput(page, '[data-testid="mason-1-lastName"]', 'Mason');
      await page.select('[data-testid="mason-1-rank"]', 'MM');
      await page.click('[data-testid="mason-1-sameLodge"]');
      await page.select('[data-testid="mason-1-contactPreference"]', 'PrimaryAttendee');
      
      // Guest
      await page.click('[data-testid="add-guest-button"]');
      await page.waitForSelector('[data-testid="guest-0-title"]');
      await page.select('[data-testid="guest-0-title"]', 'Dr.');
      await fillInput(page, '[data-testid="guest-0-firstName"]', 'Special');
      await fillInput(page, '[data-testid="guest-0-lastName"]', 'Guest');
      await page.select('[data-testid="guest-0-contactPreference"]', 'PrimaryAttendee');
      
      // Continue to ticket selection
      await page.click('[data-testid="continue-button"]');
      await page.waitForSelector('[data-testid="ticket-selection-step"]');
      
      // Verify each attendee sees appropriate tickets
      // Grand Officer - should see VIP package
      const goVipPackage = await page.$('[data-testid="attendee-0-tickets"] [data-testid="package-vip"]');
      expect(goVipPackage).toBeTruthy();
      
      // Lady Officer - should see ladies luncheon
      const ladyLuncheon = await page.$('[data-testid="attendee-1-tickets"] [data-testid="ticket-ladies"]');
      expect(ladyLuncheon).toBeTruthy();
      
      // Regular Mason - standard Mason tickets
      const regularMasonTicket = await page.$('[data-testid="attendee-2-tickets"] [data-testid="ticket-mason-only"]');
      expect(regularMasonTicket).toBeTruthy();
      
      // Guest - guest tickets
      const guestTicket = await page.$('[data-testid="attendee-3-tickets"] [data-testid="ticket-guest-only"]');
      expect(guestTicket).toBeTruthy();
      
      await captureScreenshot(page, 'complex-eligibility-matrix');
    });

    test('handles sold out ticket scenarios', async () => {
      // Setup basic registration
      await page.goto(`${baseUrl}/events/${testData.eventSlug}`);
      await page.waitForSelector('[data-testid="register-button"]');
      await page.click('[data-testid="register-button"]');
      
      await page.waitForSelector('[data-testid="registration-type-individual"]');
      await page.click('[data-testid="registration-type-individual"]');
      await page.click('[data-testid="continue-button"]');
      
      await fillInput(page, '[data-testid="mason-0-title"]', 'Bro.');
      await fillInput(page, '[data-testid="mason-0-firstName"]', 'Sold');
      await fillInput(page, '[data-testid="mason-0-lastName"]', 'Out');
      await page.select('[data-testid="mason-0-rank"]', 'MM');
      
      await page.click('[data-testid="mason-0-grandLodge"]');
      await page.type('[data-testid="mason-0-grandLodge"]', 'NSW');
      await page.keyboard.press('Enter');
      
      await page.click('[data-testid="mason-0-lodge"]');
      await page.type('[data-testid="mason-0-lodge"]', 'Lodge');
      await page.keyboard.press('Enter');
      
      await fillInput(page, '[data-testid="mason-0-email"]', 'soldout@test.com');
      await fillInput(page, '[data-testid="mason-0-phone"]', '+61400000000');
      
      await page.click('[data-testid="continue-button"]');
      await page.waitForSelector('[data-testid="ticket-selection-step"]');
      
      // Check sold out ticket
      const soldOutTicket = await page.$('[data-testid="ticket-sold-out"]');
      expect(soldOutTicket).toBeTruthy();
      
      // Should be disabled
      const isDisabled = await page.$eval('[data-testid="ticket-sold-out"]', el => el.disabled);
      expect(isDisabled).toBe(true);
      
      // Should show sold out badge
      const soldOutBadge = await page.$('[data-testid="ticket-sold-out-badge"]');
      expect(soldOutBadge).toBeTruthy();
      
      // Cannot select sold out ticket
      await page.click('[data-testid="ticket-sold-out"]').catch(() => {});
      const isChecked = await page.$eval('[data-testid="ticket-sold-out"]', el => el.checked);
      expect(isChecked).toBe(false);
      
      await captureScreenshot(page, 'sold-out-ticket-display');
    });

    test('real-time availability updates', async () => {
      // This would test WebSocket updates in real environment
      // For now, test UI responds to availability changes
      
      await page.goto(`${baseUrl}/events/${testData.eventSlug}`);
      await page.waitForSelector('[data-testid="register-button"]');
      await page.click('[data-testid="register-button"]');
      
      await page.waitForSelector('[data-testid="registration-type-individual"]');
      await page.click('[data-testid="registration-type-individual"]');
      await page.click('[data-testid="continue-button"]');
      
      await fillInput(page, '[data-testid="mason-0-title"]', 'Bro.');
      await fillInput(page, '[data-testid="mason-0-firstName"]', 'Realtime');
      await fillInput(page, '[data-testid="mason-0-lastName"]', 'Test');
      await page.select('[data-testid="mason-0-rank"]', 'MM');
      
      await page.click('[data-testid="mason-0-grandLodge"]');
      await page.type('[data-testid="mason-0-grandLodge"]', 'NSW');
      await page.keyboard.press('Enter');
      
      await page.click('[data-testid="mason-0-lodge"]');
      await page.type('[data-testid="mason-0-lodge"]', 'Lodge');
      await page.keyboard.press('Enter');
      
      await fillInput(page, '[data-testid="mason-0-email"]', 'realtime@test.com');
      await fillInput(page, '[data-testid="mason-0-phone"]', '+61400000000');
      
      await page.click('[data-testid="continue-button"]');
      await page.waitForSelector('[data-testid="ticket-selection-step"]');
      
      // Check for availability indicators
      const availabilityIndicators = await page.$$('[data-testid^="ticket-availability-"]');
      expect(availabilityIndicators.length).toBeGreaterThan(0);
      
      // Check for low availability warnings
      const lowAvailability = await page.$('[data-testid="low-availability-warning"]');
      if (lowAvailability) {
        const warningText = await page.$eval('[data-testid="low-availability-warning"]', el => el.textContent);
        expect(warningText).toContain('limited');
      }
      
      await captureScreenshot(page, 'ticket-availability-indicators');
    });
  });

  describe('Lodge Registration Ticket Selection', () => {
    test('lodge bulk ticket selection for all attendees', async () => {
      await page.goto(`${baseUrl}/events/${testData.eventSlug}`);
      await page.waitForSelector('[data-testid="register-button"]');
      await page.click('[data-testid="register-button"]');
      
      // Select Lodge registration
      await page.waitForSelector('[data-testid="registration-type-lodge"]');
      await page.click('[data-testid="registration-type-lodge"]');
      await page.click('[data-testid="continue-button"]');
      
      // Fill lodge details
      await page.waitForSelector('[data-testid="lodge-tables"]');
      await page.select('[data-testid="lodge-tables"]', '2'); // 2 tables = 20 people
      
      await fillInput(page, '[data-testid="booking-contact-firstName"]', 'Lodge');
      await fillInput(page, '[data-testid="booking-contact-lastName"]', 'Secretary');
      await fillInput(page, '[data-testid="booking-contact-email"]', 'secretary@lodge.com');
      await fillInput(page, '[data-testid="booking-contact-phone"]', '+61400000000');
      
      await page.click('[data-testid="continue-button"]');
      await page.waitForSelector('[data-testid="ticket-selection-step"]');
      
      // Should see bulk selection option
      const bulkSelectionMode = await page.$('[data-testid="bulk-ticket-selection"]');
      expect(bulkSelectionMode).toBeTruthy();
      
      // Select tickets for all
      await page.click('[data-testid="lodge-bulk-tickets"] [data-testid="ticket-all"]');
      
      // Verify quantity selector shows
      const quantitySelector = await page.waitForSelector('[data-testid="ticket-quantity-20"]');
      expect(quantitySelector).toBeTruthy();
      
      // Verify total calculation
      const totalPrice = await page.$eval('[data-testid="bulk-total-price"]', el => el.textContent);
      expect(totalPrice).toContain('4,000'); // 20 x $200
      
      await captureScreenshot(page, 'lodge-bulk-ticket-selection');
    });

    test('lodge individual ticket mode requires attendee details', async () => {
      await page.goto(`${baseUrl}/events/${testData.eventSlug}`);
      await page.waitForSelector('[data-testid="register-button"]');
      await page.click('[data-testid="register-button"]');
      
      await page.waitForSelector('[data-testid="registration-type-lodge"]');
      await page.click('[data-testid="registration-type-lodge"]');
      await page.click('[data-testid="continue-button"]');
      
      await page.waitForSelector('[data-testid="lodge-tables"]');
      await page.select('[data-testid="lodge-tables"]', '1');
      
      await fillInput(page, '[data-testid="booking-contact-firstName"]', 'Lodge');
      await fillInput(page, '[data-testid="booking-contact-lastName"]', 'Master');
      await fillInput(page, '[data-testid="booking-contact-email"]', 'master@lodge.com');
      await fillInput(page, '[data-testid="booking-contact-phone"]', '+61400000000');
      
      // Select individual ticket mode
      await page.click('[data-testid="individual-ticket-mode"]');
      
      await page.click('[data-testid="continue-button"]');
      
      // Should redirect to attendee details
      await page.waitForSelector('[data-testid="attendee-details-required"]');
      const warningMessage = await page.$eval('[data-testid="attendee-details-required"]', el => el.textContent);
      expect(warningMessage).toContain('provide attendee details');
      
      await captureScreenshot(page, 'lodge-individual-mode-warning');
    });
  });

  describe('Validation and Edge Cases', () => {
    test('prevents continuing without ticket selection', async () => {
      await page.goto(`${baseUrl}/events/${testData.eventSlug}`);
      await page.waitForSelector('[data-testid="register-button"]');
      await page.click('[data-testid="register-button"]');
      
      await page.waitForSelector('[data-testid="registration-type-individual"]');
      await page.click('[data-testid="registration-type-individual"]');
      await page.click('[data-testid="continue-button"]');
      
      await fillInput(page, '[data-testid="mason-0-title"]', 'Bro.');
      await fillInput(page, '[data-testid="mason-0-firstName"]', 'No');
      await fillInput(page, '[data-testid="mason-0-lastName"]', 'Tickets');
      await page.select('[data-testid="mason-0-rank"]', 'MM');
      
      await page.click('[data-testid="mason-0-grandLodge"]');
      await page.type('[data-testid="mason-0-grandLodge"]', 'NSW');
      await page.keyboard.press('Enter');
      
      await page.click('[data-testid="mason-0-lodge"]');
      await page.type('[data-testid="mason-0-lodge"]', 'Lodge');
      await page.keyboard.press('Enter');
      
      await fillInput(page, '[data-testid="mason-0-email"]', 'no.tickets@test.com');
      await fillInput(page, '[data-testid="mason-0-phone"]', '+61400000000');
      
      await page.click('[data-testid="continue-button"]');
      await page.waitForSelector('[data-testid="ticket-selection-step"]');
      
      // Try to continue without selecting tickets
      await page.click('[data-testid="continue-button"]');
      
      // Should show validation error
      await page.waitForSelector('[data-testid="no-tickets-error"]');
      const errorMessage = await page.$eval('[data-testid="no-tickets-error"]', el => el.textContent);
      expect(errorMessage).toContain('select at least one ticket');
      
      // Should highlight attendees without tickets
      const noTicketWarning = await page.$('[data-testid="attendee-0-no-ticket-warning"]');
      expect(noTicketWarning).toBeTruthy();
      
      await captureScreenshot(page, 'no-ticket-validation');
    });

    test('handles ticket selection for 20 attendees efficiently', async () => {
      // This tests performance with maximum attendees
      await page.goto(`${baseUrl}/events/${testData.eventSlug}`);
      await page.waitForSelector('[data-testid="register-button"]');
      await page.click('[data-testid="register-button"]');
      
      await page.waitForSelector('[data-testid="registration-type-individual"]');
      await page.click('[data-testid="registration-type-individual"]');
      await page.click('[data-testid="continue-button"]');
      
      // Add primary Mason
      await fillInput(page, '[data-testid="mason-0-title"]', 'Bro.');
      await fillInput(page, '[data-testid="mason-0-firstName"]', 'Performance');
      await fillInput(page, '[data-testid="mason-0-lastName"]', 'Test');
      await page.select('[data-testid="mason-0-rank"]', 'MM');
      
      await page.click('[data-testid="mason-0-grandLodge"]');
      await page.type('[data-testid="mason-0-grandLodge"]', 'NSW');
      await page.keyboard.press('Enter');
      
      await page.click('[data-testid="mason-0-lodge"]');
      await page.type('[data-testid="mason-0-lodge"]', 'Large Lodge');
      await page.keyboard.press('Enter');
      
      await fillInput(page, '[data-testid="mason-0-email"]', 'perf@test.com');
      await fillInput(page, '[data-testid="mason-0-phone"]', '+61400000000');
      
      // Add partner
      await page.click('[data-testid="mason-0-hasPartner"]');
      await page.waitForSelector('[data-testid="mason-0-partner-form"]');
      await page.select('[data-testid="mason-0-partner-title"]', 'Mrs.');
      await fillInput(page, '[data-testid="mason-0-partner-firstName"]', 'Partner');
      await fillInput(page, '[data-testid="mason-0-partner-lastName"]', 'One');
      await page.select('[data-testid="mason-0-partner-relationship"]', 'Wife');
      
      // Quick-add functionality for bulk attendees
      const quickAddExists = await page.$('[data-testid="quick-add-attendees"]');
      if (quickAddExists) {
        await page.click('[data-testid="quick-add-attendees"]');
        await page.select('[data-testid="quick-add-count"]', '18'); // 18 more to reach 20
        await page.click('[data-testid="confirm-quick-add"]');
      }
      
      await page.click('[data-testid="continue-button"]');
      await page.waitForSelector('[data-testid="ticket-selection-step"]');
      
      // Test "Apply to all" functionality
      const applyToAll = await page.$('[data-testid="apply-tickets-to-all"]');
      if (applyToAll) {
        // Select ticket for first attendee
        await page.click('[data-testid="attendee-0-tickets"] [data-testid="ticket-all"]');
        
        // Apply to all
        await page.click('[data-testid="apply-to-all-button"]');
        
        // Verify all have same ticket
        const allTicketsSelected = await page.$$('[data-testid^="attendee-"] [data-testid="ticket-all"]:checked');
        expect(allTicketsSelected.length).toBe(20);
      }
      
      await captureScreenshot(page, 'bulk-ticket-application');
    });
  });
});