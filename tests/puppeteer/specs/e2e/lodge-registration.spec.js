const puppeteer = require('puppeteer');
const { createPageHelper } = require('../../helpers/playwright-to-puppeteer');
const { selfHealingFindElement } = require('../../helpers/self-healing');
const testData = require('../../config/test-data');

describe('Lodge Registration Flow', () => {
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
    
    // Select lodge registration
    const lodgeButton = await page.getByTestId('registration-type-lodge');
    await lodgeButton.click();
    
    // Wait for navigation to lodge details
    await page.waitForFunction(() => window.location.href.includes('lodge-details'));
  });
  
  afterEach(async () => {
    await page.close();
  });
  
  test('should allow filling lodge details', async () => {
    const uniqueId = Date.now().toString();
    
    // Fill lodge name
    const lodgeNameInput = await page.getByLabel('Lodge Name');
    await page.fill(lodgeNameInput, `Test Lodge ${uniqueId}`);
    
    // Fill lodge number
    const lodgeNumberInput = await page.getByLabel('Lodge Number');
    await page.fill(lodgeNumberInput, uniqueId.substring(0, 3));
    
    // Select Grand Lodge
    const grandLodgeSelect = await page.getByLabel('Grand Lodge');
    await page.selectOption(grandLodgeSelect, 'United Grand Lodge of NSW & ACT');
    
    // Fill secretary details
    const secretaryNameInput = await page.getByLabel('Secretary Name');
    await page.fill(secretaryNameInput, `Lodge Secretary ${uniqueId}`);
    
    const secretaryEmailInput = await page.getByLabel('Secretary Email');
    await page.fill(secretaryEmailInput, `secretary${uniqueId}@example.com`);
    
    const secretaryPhoneInput = await page.getByLabel('Secretary Phone');
    await page.fill(secretaryPhoneInput, `0400${uniqueId.substring(0, 6)}`);
    
    // Take screenshot
    await page.screenshot({ 
      path: 'tests/puppeteer/screenshots/lodge-details-completed.png' 
    });
  });
  
  test('should enforce minimum 3 members for lodge registration', async () => {
    const uniqueId = Date.now().toString();
    const timestamp = Date.now();
    
    // Fill lodge details
    const lodgeNameInput = await page.getByLabel('Lodge Name');
    await page.fill(lodgeNameInput, `Test Lodge ${uniqueId}`);
    
    const lodgeNumberInput = await page.getByLabel('Lodge Number');
    await page.fill(lodgeNumberInput, uniqueId.substring(0, 3));
    
    const grandLodgeSelect = await page.getByLabel('Grand Lodge');
    await page.selectOption(grandLodgeSelect, 'United Grand Lodge of NSW & ACT');
    
    const secretaryNameInput = await page.getByLabel('Secretary Name');
    await page.fill(secretaryNameInput, `Lodge Secretary ${uniqueId}`);
    
    const secretaryEmailInput = await page.getByLabel('Secretary Email');
    await page.fill(secretaryEmailInput, `secretary${uniqueId}@example.com`);
    
    const secretaryPhoneInput = await page.getByLabel('Secretary Phone');
    await page.fill(secretaryPhoneInput, `0400${uniqueId.substring(0, 6)}`);
    
    // Add only 2 members
    for (let i = 1; i <= 2; i++) {
      const addMemberButton = await page.getByRole('button', { name: 'Add Member' });
      await addMemberButton.click();
      
      // Select Mason type
      const memberTypeRadio = await page.getByRole('radio', { name: 'Mason' });
      await memberTypeRadio.click();
      
      await page.fill(await page.getByLabel('Member First Name'), `Mason${i}`);
      await page.fill(await page.getByLabel('Member Last Name'), `Test${timestamp}`);
      await page.fill(await page.getByLabel('Member Email'), `mason${i}.test${timestamp}@example.com`);
      await page.fill(await page.getByLabel('Member Phone'), `0400${timestamp.toString().slice(-6).replace(/(\d)/, `${i}`)}`);
      await page.selectOption(await page.getByLabel('Rank'), 'MM');
      
      const saveMemberButton = await page.getByRole('button', { name: 'Save Member' });
      await saveMemberButton.click();
    }
    
    // Check if continue button is disabled
    const continueButton = await page.getByRole('button', { name: 'Continue to Ticket Selection' });
    const isEnabled = await continueButton.evaluate(el => !el.disabled);
    expect(isEnabled).toBe(false);
    
    // Check for error message
    const errorMessage = await page.getByText(/minimum 3 members required/i);
    const errorVisible = await page.isVisible(errorMessage);
    expect(errorVisible).toBe(true);
    
    // Add third member
    const addMemberButton = await page.getByRole('button', { name: 'Add Member' });
    await addMemberButton.click();
    
    const memberTypeRadio = await page.getByRole('radio', { name: 'Mason' });
    await memberTypeRadio.click();
    
    await page.fill(await page.getByLabel('Member First Name'), 'Mason3');
    await page.fill(await page.getByLabel('Member Last Name'), `Test${timestamp}`);
    await page.fill(await page.getByLabel('Member Email'), `mason3.test${timestamp}@example.com`);
    await page.fill(await page.getByLabel('Member Phone'), `0400${timestamp.toString().slice(-6).replace(/(\d)/, '3')}`);
    await page.selectOption(await page.getByLabel('Rank'), 'MM');
    
    const saveMemberButton = await page.getByRole('button', { name: 'Save Member' });
    await saveMemberButton.click();
    
    // Check if continue button is now enabled
    const isNowEnabled = await continueButton.evaluate(el => !el.disabled);
    expect(isNowEnabled).toBe(true);
  });
  
  test('should allow adding mixed mason and guest attendees', async () => {
    const uniqueId = Date.now().toString();
    const timestamp = Date.now();
    
    // Fill lodge details
    const lodgeNameInput = await page.getByLabel('Lodge Name');
    await page.fill(lodgeNameInput, `Test Lodge ${uniqueId}`);
    
    const lodgeNumberInput = await page.getByLabel('Lodge Number');
    await page.fill(lodgeNumberInput, uniqueId.substring(0, 3));
    
    const grandLodgeSelect = await page.getByLabel('Grand Lodge');
    await page.selectOption(grandLodgeSelect, 'United Grand Lodge of NSW & ACT');
    
    const secretaryNameInput = await page.getByLabel('Secretary Name');
    await page.fill(secretaryNameInput, `Lodge Secretary ${uniqueId}`);
    
    const secretaryEmailInput = await page.getByLabel('Secretary Email');
    await page.fill(secretaryEmailInput, `secretary${uniqueId}@example.com`);
    
    const secretaryPhoneInput = await page.getByLabel('Secretary Phone');
    await page.fill(secretaryPhoneInput, `0400${uniqueId.substring(0, 6)}`);
    
    // Add 3 mason attendees
    for (let i = 1; i <= 3; i++) {
      const addMemberButton = await page.getByRole('button', { name: 'Add Member' });
      await addMemberButton.click();
      
      const memberTypeRadio = await page.getByRole('radio', { name: 'Mason' });
      await memberTypeRadio.click();
      
      await page.fill(await page.getByLabel('Member First Name'), `Mason${i}`);
      await page.fill(await page.getByLabel('Member Last Name'), `Test${timestamp}`);
      await page.fill(await page.getByLabel('Member Email'), `mason${i}.test${timestamp}@example.com`);
      await page.fill(await page.getByLabel('Member Phone'), `0400${timestamp.toString().slice(-6).replace(/(\d)/, `${i}`)}`);
      await page.selectOption(await page.getByLabel('Rank'), 'MM');
      
      const saveMemberButton = await page.getByRole('button', { name: 'Save Member' });
      await saveMemberButton.click();
    }
    
    // Add 2 guest attendees
    for (let i = 1; i <= 2; i++) {
      const addMemberButton = await page.getByRole('button', { name: 'Add Member' });
      await addMemberButton.click();
      
      const memberTypeRadio = await page.getByRole('radio', { name: 'Guest' });
      await memberTypeRadio.click();
      
      await page.fill(await page.getByLabel('Member First Name'), `Guest${i}`);
      await page.fill(await page.getByLabel('Member Last Name'), `Test${timestamp}`);
      await page.fill(await page.getByLabel('Member Email'), `guest${i}.test${timestamp}@example.com`);
      await page.fill(await page.getByLabel('Member Phone'), `0400${timestamp.toString().slice(-6).replace(/(\d)/, `${i+3}`)}`);
      
      const saveMemberButton = await page.getByRole('button', { name: 'Save Member' });
      await saveMemberButton.click();
    }
    
    // Verify attendee count
    const attendeeRows = await page.$$('[data-testid^="attendee-row-"]');
    expect(attendeeRows.length).toBe(5); // 3 masons + 2 guests
    
    // Take screenshot
    await page.screenshot({ 
      path: 'tests/puppeteer/screenshots/lodge-mixed-attendees.png' 
    });
  });
  
  test('should complete full lodge registration flow', async () => {
    const uniqueId = Date.now().toString();
    const timestamp = Date.now();
    
    // Fill lodge details
    const lodgeNameInput = await page.getByLabel('Lodge Name');
    await page.fill(lodgeNameInput, `Test Lodge ${uniqueId}`);
    
    const lodgeNumberInput = await page.getByLabel('Lodge Number');
    await page.fill(lodgeNumberInput, uniqueId.substring(0, 3));
    
    const grandLodgeSelect = await page.getByLabel('Grand Lodge');
    await page.selectOption(grandLodgeSelect, 'United Grand Lodge of NSW & ACT');
    
    const secretaryNameInput = await page.getByLabel('Secretary Name');
    await page.fill(secretaryNameInput, `Lodge Secretary ${uniqueId}`);
    
    const secretaryEmailInput = await page.getByLabel('Secretary Email');
    await page.fill(secretaryEmailInput, `secretary${uniqueId}@example.com`);
    
    const secretaryPhoneInput = await page.getByLabel('Secretary Phone');
    await page.fill(secretaryPhoneInput, `0400${uniqueId.substring(0, 6)}`);
    
    // Add 3 mason attendees
    for (let i = 1; i <= 3; i++) {
      const addMemberButton = await page.getByRole('button', { name: 'Add Member' });
      await addMemberButton.click();
      
      const memberTypeRadio = await page.getByRole('radio', { name: 'Mason' });
      await memberTypeRadio.click();
      
      await page.fill(await page.getByLabel('Member First Name'), `Mason${i}`);
      await page.fill(await page.getByLabel('Member Last Name'), `Test${timestamp}`);
      await page.fill(await page.getByLabel('Member Email'), `mason${i}.test${timestamp}@example.com`);
      await page.fill(await page.getByLabel('Member Phone'), `0400${timestamp.toString().slice(-6).replace(/(\d)/, `${i}`)}`);
      await page.selectOption(await page.getByLabel('Rank'), 'MM');
      
      const saveMemberButton = await page.getByRole('button', { name: 'Save Member' });
      await saveMemberButton.click();
    }
    
    // Continue to ticket selection
    const continueButton = await page.getByRole('button', { name: 'Continue to Ticket Selection' });
    await continueButton.click();
    
    // Wait for ticket selection page
    await page.waitForFunction(() => window.location.href.includes('ticket-selection'));
    expect(page.url()).toContain('ticket-selection');
    
    // Select tickets
    const generalAdmissionCard = await selfHealingFindElement(page, '[data-testid="ticket-card-general-admission"]', {
      fallbacks: [
        '.ticket-card:has-text("General Admission")',
        '[data-test="ticket-general-admission"]'
      ]
    });
    
    if (generalAdmissionCard) {
      // Select 3 tickets for all members
      const plusButton = await generalAdmissionCard.$('[data-testid="ticket-quantity-increase"]');
      if (plusButton) {
        await plusButton.click();
        await plusButton.click();
        await plusButton.click(); // Click 3 times for 3 tickets
      }
    }
    
    // Get single ticket price
    const priceElement = await generalAdmissionCard.$('.ticket-price');
    const priceText = await priceElement.evaluate(el => el.textContent);
    const singlePrice = parseFloat(priceText.replace(/[^0-9.]/g, ''));
    
    // Verify total amount
    await page.waitForSelector('[data-testid="order-total"]');
    const totalText = await page.$eval('[data-testid="order-total"]', el => el.textContent);
    const totalAmount = parseFloat(totalText.replace(/[^0-9.]/g, ''));
    expect(totalAmount).toBeCloseTo(singlePrice * 3, 1); // Allow for rounding
    
    // Continue to order review
    const reviewButton = await page.getByRole('button', { name: 'Continue to Order Review' });
    await reviewButton.click();
    
    // Verify navigation
    await page.waitForFunction(() => window.location.href.includes('order-review'));
    expect(page.url()).toContain('order-review');
  });
});