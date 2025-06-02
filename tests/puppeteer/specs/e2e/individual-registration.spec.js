const puppeteer = require('puppeteer');
const { createPageHelper } = require('../../helpers/playwright-to-puppeteer');
const { selfHealingFindElement } = require('../../helpers/self-healing');
const testData = require('../../config/test-data');

describe('Individual Registration Flow', () => {
  let browser;
  let page;
  
  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: process.env.HEADLESS !== 'false',
      slowMo: process.env.SLOW_MO ? parseInt(process.env.SLOW_MO) : 0,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  });
  
  afterAll(async () => {
    await browser.close();
  });
  
  beforeEach(async () => {
    page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
    
    // Add Playwright-like helpers
    createPageHelper(page);
    
    // Navigate to registration type page
    await page.goto(`${testData.baseUrl}/events/${testData.eventSlug}/register/${testData.registrationId}/tickets`);
    
    // Select individual registration
    const individualButton = await page.getByTestId('registration-type-individual');
    await individualButton.click();
    
    // Wait for navigation to attendee details
    await page.waitForFunction(() => window.location.href.includes('attendee-details'));
  });
  
  afterEach(async () => {
    await page.close();
  });
  
  test('guest should be able to complete basic details', async () => {
    // Generate unique test data
    const timestamp = Date.now();
    const guestData = {
      firstName: `Test${timestamp}`,
      lastName: `Guest${timestamp}`,
      email: `test.guest.${timestamp}@example.com`,
      phone: `0400${timestamp.toString().slice(-6)}`
    };
    
    // Fill guest details
    const firstNameInput = await page.getByLabel('First Name');
    await page.fill(firstNameInput, guestData.firstName);
    
    const lastNameInput = await page.getByLabel('Last Name');
    await page.fill(lastNameInput, guestData.lastName);
    
    const emailInput = await page.getByLabel('Email');
    await page.fill(emailInput, guestData.email);
    
    const phoneInput = await page.getByLabel('Phone');
    await page.fill(phoneInput, guestData.phone);
    
    // Fill dietary requirements
    const dietaryInput = await page.getByLabel('Dietary Requirements');
    if (dietaryInput) {
      await page.fill(dietaryInput, 'No nuts please');
    }
    
    // Fill accessibility requirements
    const accessibilityInput = await page.getByLabel('Accessibility Requirements');
    if (accessibilityInput) {
      await page.fill(accessibilityInput, 'None');
    }
    
    // Take screenshot
    await page.screenshot({ 
      path: 'tests/puppeteer/screenshots/individual-guest-form-completed.png' 
    });
    
    // Continue to ticket selection
    const continueButton = await page.getByRole('button', { name: 'Continue to Ticket Selection' });
    await continueButton.click();
    
    // Verify navigation
    await page.waitForFunction(() => window.location.href.includes('ticket-selection'));
    expect(page.url()).toContain('ticket-selection');
  });
  
  test('mason should be able to complete details with lodge information', async () => {
    // Generate unique test data
    const timestamp = Date.now();
    const masonData = {
      firstName: `Test${timestamp}`,
      lastName: `Mason${timestamp}`,
      email: `test.mason.${timestamp}@example.com`,
      phone: `0400${timestamp.toString().slice(-6)}`
    };
    
    // Select Mason type
    const masonRadio = await page.getByRole('radio', { name: 'Mason' });
    await masonRadio.click();
    
    // Fill mason details
    const firstNameInput = await page.getByLabel('First Name');
    await page.fill(firstNameInput, masonData.firstName);
    
    const lastNameInput = await page.getByLabel('Last Name');
    await page.fill(lastNameInput, masonData.lastName);
    
    const emailInput = await page.getByLabel('Email');
    await page.fill(emailInput, masonData.email);
    
    const phoneInput = await page.getByLabel('Phone');
    await page.fill(phoneInput, masonData.phone);
    
    // Select rank
    const rankSelect = await page.getByLabel('Rank');
    await page.selectOption(rankSelect, 'MM');
    
    // Select Grand Lodge
    const grandLodgeSelect = await page.getByLabel('Grand Lodge');
    await page.selectOption(grandLodgeSelect, 'United Grand Lodge of NSW & ACT');
    
    // Select Lodge
    const lodgeInput = await page.getByLabel('Lodge');
    await page.fill(lodgeInput, 'Sydney Lodge No. 123');
    
    // Fill dietary requirements
    const dietaryInput = await page.getByLabel('Dietary Requirements');
    if (dietaryInput) {
      await page.fill(dietaryInput, 'Vegetarian');
    }
    
    // Take screenshot
    await page.screenshot({ 
      path: 'tests/puppeteer/screenshots/individual-mason-form-completed.png' 
    });
    
    // Continue to ticket selection
    const continueButton = await page.getByRole('button', { name: 'Continue to Ticket Selection' });
    await continueButton.click();
    
    // Verify navigation
    await page.waitForFunction(() => window.location.href.includes('ticket-selection'));
    expect(page.url()).toContain('ticket-selection');
  });
  
  test('guest should be able to add partner', async () => {
    // Generate unique test data
    const timestamp = Date.now();
    const guestData = {
      firstName: `Test${timestamp}`,
      lastName: `Guest${timestamp}`,
      email: `test.guest.${timestamp}@example.com`,
      phone: `0400${timestamp.toString().slice(-6)}`
    };
    
    const partnerData = {
      firstName: 'Partner',
      lastName: guestData.lastName,
      email: `partner.${guestData.email}`,
      phone: guestData.phone.replace(/\d{4}$/, '9999')
    };
    
    // Fill guest details
    const firstNameInput = await page.getByLabel('First Name');
    await page.fill(firstNameInput, guestData.firstName);
    
    const lastNameInput = await page.getByLabel('Last Name');
    await page.fill(lastNameInput, guestData.lastName);
    
    const emailInput = await page.getByLabel('Email');
    await page.fill(emailInput, guestData.email);
    
    const phoneInput = await page.getByLabel('Phone');
    await page.fill(phoneInput, guestData.phone);
    
    // Add partner
    const addPartnerButton = await page.getByRole('button', { name: 'Add Partner' });
    await addPartnerButton.click();
    
    // Fill partner details
    const partnerFirstName = await page.getByLabel('Partner First Name');
    await page.fill(partnerFirstName, partnerData.firstName);
    
    const partnerLastName = await page.getByLabel('Partner Last Name');
    await page.fill(partnerLastName, partnerData.lastName);
    
    const partnerEmail = await page.getByLabel('Partner Email');
    await page.fill(partnerEmail, partnerData.email);
    
    const partnerPhone = await page.getByLabel('Partner Phone');
    await page.fill(partnerPhone, partnerData.phone);
    
    // Partner dietary requirements
    const partnerDietary = await page.getByLabel('Partner Dietary Requirements');
    if (partnerDietary) {
      await page.fill(partnerDietary, 'Gluten free');
    }
    
    // Take screenshot
    await page.screenshot({ 
      path: 'tests/puppeteer/screenshots/individual-guest-with-partner-completed.png' 
    });
    
    // Continue to ticket selection
    const continueButton = await page.getByRole('button', { name: 'Continue to Ticket Selection' });
    await continueButton.click();
    
    // Verify navigation
    await page.waitForFunction(() => window.location.href.includes('ticket-selection'));
    expect(page.url()).toContain('ticket-selection');
  });
  
  test('should validate all required fields', async () => {
    // Try to continue without filling required fields
    const continueButton = await page.getByRole('button', { name: 'Continue to Ticket Selection' });
    await continueButton.click();
    
    // Wait for validation errors
    await page.waitForSelector('[data-testid="form-error-message"]');
    
    // Check for error messages
    const errorMessages = await page.$$('[data-testid="form-error-message"]');
    expect(errorMessages.length).toBeGreaterThan(0);
    
    // Take screenshot of validation errors
    await page.screenshot({ 
      path: 'tests/puppeteer/screenshots/individual-form-validation-errors.png' 
    });
  });
  
  test('should allow complete flow from guest details to ticket selection', async () => {
    // Generate unique test data
    const timestamp = Date.now();
    const guestData = {
      firstName: `Test${timestamp}`,
      lastName: `Guest${timestamp}`,
      email: `test.guest.${timestamp}@example.com`,
      phone: `0400${timestamp.toString().slice(-6)}`
    };
    
    // Fill guest details
    const firstNameInput = await page.getByLabel('First Name');
    await page.fill(firstNameInput, guestData.firstName);
    
    const lastNameInput = await page.getByLabel('Last Name');
    await page.fill(lastNameInput, guestData.lastName);
    
    const emailInput = await page.getByLabel('Email');
    await page.fill(emailInput, guestData.email);
    
    const phoneInput = await page.getByLabel('Phone');
    await page.fill(phoneInput, guestData.phone);
    
    // Continue to ticket selection
    const continueButton = await page.getByRole('button', { name: 'Continue to Ticket Selection' });
    await continueButton.click();
    
    // Wait for ticket selection page
    await page.waitForFunction(() => window.location.href.includes('ticket-selection'));
    expect(page.url()).toContain('ticket-selection');
    
    // Select tickets
    const ticketCard = await selfHealingFindElement(page, '[data-testid="ticket-card-general-admission"]', {
      fallbacks: [
        '.ticket-card:has-text("General Admission")',
        '[data-test="ticket-general-admission"]'
      ]
    });
    
    if (ticketCard) {
      // Increase ticket quantity
      const plusButton = await ticketCard.$('[data-testid="ticket-quantity-increase"]');
      if (plusButton) {
        await plusButton.click();
      }
    }
    
    // Verify total amount updates
    await page.waitForSelector('[data-testid="order-total"]');
    const totalText = await page.$eval('[data-testid="order-total"]', el => el.textContent);
    const totalAmount = parseFloat(totalText.replace(/[^0-9.]/g, ''));
    expect(totalAmount).toBeGreaterThan(0);
    
    // Continue to order review
    const reviewButton = await page.getByRole('button', { name: 'Continue to Order Review' });
    await reviewButton.click();
    
    // Verify navigation to order review
    await page.waitForFunction(() => window.location.href.includes('order-review'));
    expect(page.url()).toContain('order-review');
  });
});