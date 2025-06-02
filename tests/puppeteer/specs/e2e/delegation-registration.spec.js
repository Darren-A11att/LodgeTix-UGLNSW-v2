const puppeteer = require('puppeteer');
const { createPageHelper } = require('../../helpers/playwright-to-puppeteer');
const { selfHealingFindElement } = require('../../helpers/self-healing');
const testData = require('../../config/test-data');

describe('Delegation Registration Flow', () => {
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
    
    // Select delegation registration
    const delegationButton = await page.getByTestId('registration-type-delegation');
    await delegationButton.click();
    
    // Wait for navigation to delegation details
    await page.waitForFunction(() => window.location.href.includes('delegation-details'));
  });
  
  afterEach(async () => {
    await page.close();
  });
  
  test('should allow filling delegation details', async () => {
    const uniqueId = Date.now().toString();
    
    // Fill delegation name
    const delegationNameInput = await page.getByLabel('Delegation Name');
    await page.fill(delegationNameInput, `Test Delegation ${uniqueId}`);
    
    // Select delegation type
    const delegationTypeSelect = await page.getByLabel('Delegation Type');
    await page.selectOption(delegationTypeSelect, 'Inter-jurisdictional');
    
    // Select Grand Lodge
    const grandLodgeSelect = await page.getByLabel('Grand Lodge');
    await page.selectOption(grandLodgeSelect, 'United Grand Lodge of NSW & ACT');
    
    // Fill leader details
    const leaderNameInput = await page.getByLabel('Leader Name');
    await page.fill(leaderNameInput, `Delegation Leader ${uniqueId}`);
    
    const leaderEmailInput = await page.getByLabel('Leader Email');
    await page.fill(leaderEmailInput, `leader${uniqueId}@example.com`);
    
    const leaderPhoneInput = await page.getByLabel('Leader Phone');
    await page.fill(leaderPhoneInput, `0400${uniqueId.substring(0, 6)}`);
    
    // Take screenshot
    await page.screenshot({ 
      path: 'tests/puppeteer/screenshots/delegation-details-completed.png' 
    });
  });
  
  test('should support both delegation types', async () => {
    const uniqueId = Date.now().toString();
    
    // Fill delegation name
    const delegationNameInput = await page.getByLabel('Delegation Name');
    await page.fill(delegationNameInput, `Test Delegation ${uniqueId}`);
    
    // Test inter-jurisdictional type
    const delegationTypeSelect = await page.getByLabel('Delegation Type');
    await page.selectOption(delegationTypeSelect, 'Inter-jurisdictional');
    
    // Fill remaining details
    const grandLodgeSelect = await page.getByLabel('Grand Lodge');
    await page.selectOption(grandLodgeSelect, 'United Grand Lodge of NSW & ACT');
    
    const leaderNameInput = await page.getByLabel('Leader Name');
    await page.fill(leaderNameInput, `Delegation Leader ${uniqueId}`);
    
    const leaderEmailInput = await page.getByLabel('Leader Email');
    await page.fill(leaderEmailInput, `leader${uniqueId}@example.com`);
    
    const leaderPhoneInput = await page.getByLabel('Leader Phone');
    await page.fill(leaderPhoneInput, `0400${uniqueId.substring(0, 6)}`);
    
    // Take screenshot
    await page.screenshot({ 
      path: 'tests/puppeteer/screenshots/delegation-inter-jurisdictional.png' 
    });
    
    // Change to overseas type
    await page.selectOption(delegationTypeSelect, 'Overseas');
    
    // Take screenshot
    await page.screenshot({ 
      path: 'tests/puppeteer/screenshots/delegation-overseas.png' 
    });
    
    // Check for overseas-specific fields
    const overseasFields = await page.$('[data-testid="overseas-fields"]');
    if (overseasFields) {
      const isVisible = await page.isVisible(overseasFields);
      expect(isVisible).toBe(true);
    }
  });
  
  test('should allow adding official delegates with different roles', async () => {
    const uniqueId = Date.now().toString();
    
    // Fill delegation details
    const delegationNameInput = await page.getByLabel('Delegation Name');
    await page.fill(delegationNameInput, `Test Delegation ${uniqueId}`);
    
    const delegationTypeSelect = await page.getByLabel('Delegation Type');
    await page.selectOption(delegationTypeSelect, 'Inter-jurisdictional');
    
    const grandLodgeSelect = await page.getByLabel('Grand Lodge');
    await page.selectOption(grandLodgeSelect, 'United Grand Lodge of NSW & ACT');
    
    const leaderNameInput = await page.getByLabel('Leader Name');
    await page.fill(leaderNameInput, `Delegation Leader ${uniqueId}`);
    
    const leaderEmailInput = await page.getByLabel('Leader Email');
    await page.fill(leaderEmailInput, `leader${uniqueId}@example.com`);
    
    const leaderPhoneInput = await page.getByLabel('Leader Phone');
    await page.fill(leaderPhoneInput, `0400${uniqueId.substring(0, 6)}`);
    
    // Define delegate roles
    const delegateRoles = [
      { firstName: 'Grand', lastName: 'Master', title: 'MW Bro', rank: 'GL', role: 'Grand Master' },
      { firstName: 'Deputy', lastName: 'Grand Master', title: 'RW Bro', rank: 'GL', role: 'Deputy Grand Master' },
      { firstName: 'Grand', lastName: 'Secretary', title: 'VW Bro', rank: 'GL', role: 'Grand Secretary' }
    ];
    
    // Add delegates
    for (let i = 0; i < delegateRoles.length; i++) {
      const delegate = delegateRoles[i];
      
      // Click add delegate button
      const addDelegateButton = await page.getByRole('button', { name: 'Add Official Delegate' });
      await addDelegateButton.click();
      
      // Fill delegate form
      const firstNameInput = await page.getByLabel('Delegate First Name');
      await page.fill(firstNameInput, delegate.firstName);
      
      const lastNameInput = await page.getByLabel('Delegate Last Name');
      await page.fill(lastNameInput, delegate.lastName);
      
      const emailInput = await page.getByLabel('Delegate Email');
      await page.fill(emailInput, `${delegate.firstName.toLowerCase()}.${delegate.lastName.toLowerCase()}${uniqueId}@example.com`);
      
      const phoneInput = await page.getByLabel('Delegate Phone');
      await page.fill(phoneInput, `0400${uniqueId.substring(0, 3)}${i+1}00`);
      
      const titleInput = await page.getByLabel('Title');
      await page.fill(titleInput, delegate.title);
      
      const rankSelect = await page.getByLabel('Rank');
      await page.selectOption(rankSelect, delegate.rank);
      
      const roleInput = await page.getByLabel('Role');
      await page.fill(roleInput, delegate.role);
      
      // Save delegate
      const saveButton = await page.getByRole('button', { name: 'Save Delegate' });
      await saveButton.click();
      
      // Wait for delegate to be added to table
      await page.waitForSelector(`[data-testid="delegate-row-${i}"]`);
    }
    
    // Verify delegate count
    const delegateRows = await page.$$('[data-testid^="delegate-row-"]');
    expect(delegateRows.length).toBe(delegateRoles.length);
    
    // Take screenshot
    await page.screenshot({ 
      path: 'tests/puppeteer/screenshots/delegation-official-delegates.png' 
    });
  });
  
  test('should allow adding accompanying guests', async () => {
    const uniqueId = Date.now().toString();
    
    // Fill delegation details
    const delegationNameInput = await page.getByLabel('Delegation Name');
    await page.fill(delegationNameInput, `Test Delegation ${uniqueId}`);
    
    const delegationTypeSelect = await page.getByLabel('Delegation Type');
    await page.selectOption(delegationTypeSelect, 'Inter-jurisdictional');
    
    const grandLodgeSelect = await page.getByLabel('Grand Lodge');
    await page.selectOption(grandLodgeSelect, 'United Grand Lodge of NSW & ACT');
    
    const leaderNameInput = await page.getByLabel('Leader Name');
    await page.fill(leaderNameInput, `Delegation Leader ${uniqueId}`);
    
    const leaderEmailInput = await page.getByLabel('Leader Email');
    await page.fill(leaderEmailInput, `leader${uniqueId}@example.com`);
    
    const leaderPhoneInput = await page.getByLabel('Leader Phone');
    await page.fill(leaderPhoneInput, `0400${uniqueId.substring(0, 6)}`);
    
    // Add official delegate first
    const addDelegateButton = await page.getByRole('button', { name: 'Add Official Delegate' });
    await addDelegateButton.click();
    
    await page.fill(await page.getByLabel('Delegate First Name'), 'Grand');
    await page.fill(await page.getByLabel('Delegate Last Name'), 'Master');
    await page.fill(await page.getByLabel('Delegate Email'), `gm${uniqueId}@example.com`);
    await page.fill(await page.getByLabel('Delegate Phone'), `0400${uniqueId.substring(0, 6)}`);
    await page.fill(await page.getByLabel('Title'), 'MW Bro');
    await page.selectOption(await page.getByLabel('Rank'), 'GL');
    await page.fill(await page.getByLabel('Role'), 'Grand Master');
    
    const saveDelegateButton = await page.getByRole('button', { name: 'Save Delegate' });
    await saveDelegateButton.click();
    
    // Add accompanying guest
    const addGuestButton = await page.getByRole('button', { name: 'Add Accompanying Guest' });
    await addGuestButton.click();
    
    await page.fill(await page.getByLabel('Guest First Name'), 'Jane');
    await page.fill(await page.getByLabel('Guest Last Name'), 'Master');
    await page.fill(await page.getByLabel('Guest Email'), `jane.master${uniqueId}@example.com`);
    await page.fill(await page.getByLabel('Guest Phone'), `0400${uniqueId.substring(0, 3)}999`);
    await page.selectOption(await page.getByLabel('Relationship'), 'Spouse');
    
    const saveGuestButton = await page.getByRole('button', { name: 'Save Guest' });
    await saveGuestButton.click();
    
    // Verify guest section is visible
    const guestSection = await page.$('[data-testid="accompanying-guests-section"]');
    const isVisible = await page.isVisible(guestSection);
    expect(isVisible).toBe(true);
    
    // Take screenshot
    await page.screenshot({ 
      path: 'tests/puppeteer/screenshots/delegation-accompanying-guests.png' 
    });
  });
  
  test('should complete full delegation registration flow', async () => {
    const uniqueId = Date.now().toString();
    
    // Fill delegation details
    const delegationNameInput = await page.getByLabel('Delegation Name');
    await page.fill(delegationNameInput, `Test Delegation ${uniqueId}`);
    
    const delegationTypeSelect = await page.getByLabel('Delegation Type');
    await page.selectOption(delegationTypeSelect, 'Inter-jurisdictional');
    
    const grandLodgeSelect = await page.getByLabel('Grand Lodge');
    await page.selectOption(grandLodgeSelect, 'United Grand Lodge of NSW & ACT');
    
    const leaderNameInput = await page.getByLabel('Leader Name');
    await page.fill(leaderNameInput, `Delegation Leader ${uniqueId}`);
    
    const leaderEmailInput = await page.getByLabel('Leader Email');
    await page.fill(leaderEmailInput, `leader${uniqueId}@example.com`);
    
    const leaderPhoneInput = await page.getByLabel('Leader Phone');
    await page.fill(leaderPhoneInput, `0400${uniqueId.substring(0, 6)}`);
    
    // Add 2 delegates
    const delegateRoles = [
      { firstName: 'Grand', lastName: 'Master', title: 'MW Bro', rank: 'GL', role: 'Grand Master' },
      { firstName: 'Deputy', lastName: 'Grand Master', title: 'RW Bro', rank: 'GL', role: 'Deputy Grand Master' }
    ];
    
    for (let i = 0; i < delegateRoles.length; i++) {
      const delegate = delegateRoles[i];
      
      const addDelegateButton = await page.getByRole('button', { name: 'Add Official Delegate' });
      await addDelegateButton.click();
      
      await page.fill(await page.getByLabel('Delegate First Name'), delegate.firstName);
      await page.fill(await page.getByLabel('Delegate Last Name'), delegate.lastName);
      await page.fill(await page.getByLabel('Delegate Email'), `${delegate.firstName.toLowerCase()}.${delegate.lastName.toLowerCase()}${uniqueId}@example.com`);
      await page.fill(await page.getByLabel('Delegate Phone'), `0400${uniqueId.substring(0, 3)}${i+1}00`);
      await page.fill(await page.getByLabel('Title'), delegate.title);
      await page.selectOption(await page.getByLabel('Rank'), delegate.rank);
      await page.fill(await page.getByLabel('Role'), delegate.role);
      
      const saveButton = await page.getByRole('button', { name: 'Save Delegate' });
      await saveButton.click();
    }
    
    // Add guest
    const addGuestButton = await page.getByRole('button', { name: 'Add Accompanying Guest' });
    await addGuestButton.click();
    
    await page.fill(await page.getByLabel('Guest First Name'), 'Jane');
    await page.fill(await page.getByLabel('Guest Last Name'), 'Master');
    await page.fill(await page.getByLabel('Guest Email'), `jane.master${uniqueId}@example.com`);
    await page.fill(await page.getByLabel('Guest Phone'), `0400${uniqueId.substring(0, 3)}999`);
    await page.selectOption(await page.getByLabel('Relationship'), 'Spouse');
    
    const saveGuestButton = await page.getByRole('button', { name: 'Save Guest' });
    await saveGuestButton.click();
    
    // Continue to ticket selection
    const continueButton = await page.getByRole('button', { name: 'Continue to Ticket Selection' });
    await continueButton.click();
    
    // Wait for ticket selection page
    await page.waitForFunction(() => window.location.href.includes('ticket-selection'));
    expect(page.url()).toContain('ticket-selection');
    
    // Select tickets
    const heroFunctionCard = await selfHealingFindElement(page, '[data-testid="ticket-card-hero-function"]', {
      fallbacks: [
        '.ticket-card:has-text("Hero Function")',
        '[data-test="ticket-hero-function"]'
      ]
    });
    
    if (heroFunctionCard) {
      // Select 2 tickets for delegates
      const plusButton = await heroFunctionCard.$('[data-testid="ticket-quantity-increase"]');
      if (plusButton) {
        await plusButton.click();
        await plusButton.click(); // Click twice for 2 tickets
      }
    }
    
    // Select guest ticket
    const guestTicketCard = await selfHealingFindElement(page, '[data-testid="ticket-card-guest-ticket"]', {
      fallbacks: [
        '.ticket-card:has-text("Guest Ticket")',
        '[data-test="ticket-guest"]'
      ]
    });
    
    if (guestTicketCard) {
      const plusButton = await guestTicketCard.$('[data-testid="ticket-quantity-increase"]');
      if (plusButton) {
        await plusButton.click();
      }
    }
    
    // Verify total amount
    await page.waitForSelector('[data-testid="order-total"]');
    const totalText = await page.$eval('[data-testid="order-total"]', el => el.textContent);
    const totalAmount = parseFloat(totalText.replace(/[^0-9.]/g, ''));
    expect(totalAmount).toBeGreaterThan(0);
    
    // Continue to order review
    const reviewButton = await page.getByRole('button', { name: 'Continue to Order Review' });
    await reviewButton.click();
    
    // Verify navigation
    await page.waitForFunction(() => window.location.href.includes('order-review'));
    expect(page.url()).toContain('order-review');
  });
});