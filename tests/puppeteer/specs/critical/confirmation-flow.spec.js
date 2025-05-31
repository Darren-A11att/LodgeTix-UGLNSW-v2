/**
 * Confirmation Flow Tests
 * Tests the confirmation page functionality and email delivery
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

describe('Confirmation Flow Tests', () => {
  let browser;
  let page;
  let testData;
  
  const screenshotDir = path.join(__dirname, '../../screenshots/confirmation');
  
  beforeAll(async () => {
    // Create screenshot directory
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }
    
    browser = await puppeteer.launch({
      headless: process.env.PUPPETEER_HEADLESS !== 'false',
      slowMo: process.env.CI ? 0 : 50,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    // Load test data
    const TestDataManager = require('../../helpers/test-data-manager');
    testData = await TestDataManager.getRegistrationTestData();
  });
  
  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
  });
  
  beforeEach(async () => {
    page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
  });
  
  afterEach(async () => {
    if (page) {
      await page.close();
    }
  });
  
  test('displays confirmation details after successful payment', async () => {
    // Navigate directly to confirmation page with test registration
    const confirmationUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/events/${testData.eventSlug}/register/${testData.registrationId}/confirmation`;
    await page.goto(confirmationUrl);
    
    // Wait for confirmation content to load
    await page.waitForSelector('[data-testid="confirmation-step"]', { timeout: 10000 });
    
    // Verify confirmation number is displayed
    const confirmationNumber = await page.$eval('[data-testid="confirmation-number"]', el => el.textContent);
    expect(confirmationNumber).toMatch(/^CONF-[A-Z0-9]+$/);
    
    // Verify event details
    const eventTitle = await page.$eval('[data-testid="confirmation-event-title"]', el => el.textContent);
    expect(eventTitle).toContain(testData.eventName);
    
    const eventDate = await page.$eval('[data-testid="confirmation-event-date"]', el => el.textContent);
    expect(eventDate).toBeTruthy();
    
    // Verify attendee details
    const attendeeList = await page.$$eval('[data-testid^="confirmation-attendee-"]', els => 
      els.map(el => el.textContent)
    );
    expect(attendeeList.length).toBeGreaterThan(0);
    
    // Verify ticket details
    const ticketSummary = await page.$eval('[data-testid="confirmation-ticket-summary"]', el => el.textContent);
    expect(ticketSummary).toContain(testData.ticketType);
    
    // Verify total amount
    const totalAmount = await page.$eval('[data-testid="confirmation-total-amount"]', el => el.textContent);
    expect(totalAmount).toMatch(/\$[\d,]+\.\d{2}/);
    
    await page.screenshot({ 
      path: path.join(screenshotDir, 'confirmation-details.png'),
      fullPage: true 
    });
  });
  
  test('generates and displays QR code', async () => {
    const confirmationUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/events/${testData.eventSlug}/register/${testData.registrationId}/confirmation`;
    await page.goto(confirmationUrl);
    
    await page.waitForSelector('[data-testid="confirmation-qr-code"]', { timeout: 10000 });
    
    // Verify QR code is displayed
    const qrCode = await page.$('[data-testid="confirmation-qr-code"] img');
    expect(qrCode).toBeTruthy();
    
    // Get QR code source
    const qrSrc = await page.$eval('[data-testid="confirmation-qr-code"] img', el => el.src);
    expect(qrSrc).toContain('data:image');
    
    // Verify QR code data attributes
    const qrData = await page.$eval('[data-testid="confirmation-qr-code"]', el => el.dataset.registrationId);
    expect(qrData).toBe(testData.registrationId);
    
    await page.screenshot({ 
      path: path.join(screenshotDir, 'qr-code.png'),
      fullPage: false,
      clip: await page.$eval('[data-testid="confirmation-qr-code"]', el => {
        const rect = el.getBoundingClientRect();
        return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
      })
    });
  });
  
  test('allows downloading tickets as PDF', async () => {
    const confirmationUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/events/${testData.eventSlug}/register/${testData.registrationId}/confirmation`;
    await page.goto(confirmationUrl);
    
    await page.waitForSelector('[data-testid="download-tickets-button"]', { timeout: 10000 });
    
    // Set up download handling
    const downloadPath = path.join(__dirname, '../../downloads');
    if (!fs.existsSync(downloadPath)) {
      fs.mkdirSync(downloadPath, { recursive: true });
    }
    
    await page._client.send('Page.setDownloadBehavior', {
      behavior: 'allow',
      downloadPath: downloadPath
    });
    
    // Click download button
    await page.click('[data-testid="download-tickets-button"]');
    
    // Wait for download to complete
    await page.waitForTimeout(3000);
    
    // Check if PDF was downloaded
    const files = fs.readdirSync(downloadPath);
    const pdfFile = files.find(f => f.endsWith('.pdf') && f.includes('tickets'));
    expect(pdfFile).toBeTruthy();
    
    // Clean up
    if (pdfFile) {
      fs.unlinkSync(path.join(downloadPath, pdfFile));
    }
    
    await page.screenshot({ 
      path: path.join(screenshotDir, 'download-button.png'),
      fullPage: false,
      clip: await page.$eval('[data-testid="download-tickets-button"]', el => {
        const rect = el.getBoundingClientRect();
        return { x: rect.x - 20, y: rect.y - 20, width: rect.width + 40, height: rect.height + 40 };
      })
    });
  });
  
  test('sends confirmation email', async () => {
    const confirmationUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/events/${testData.eventSlug}/register/${testData.registrationId}/confirmation`;
    await page.goto(confirmationUrl);
    
    await page.waitForSelector('[data-testid="confirmation-email-sent"]', { timeout: 10000 });
    
    // Verify email sent notification
    const emailNotification = await page.$eval('[data-testid="confirmation-email-sent"]', el => el.textContent);
    expect(emailNotification).toContain('email');
    expect(emailNotification).toContain(testData.email);
    
    // Check for resend email button
    const resendButton = await page.$('[data-testid="resend-email-button"]');
    expect(resendButton).toBeTruthy();
    
    // Test resend functionality
    await page.click('[data-testid="resend-email-button"]');
    
    // Wait for success message
    await page.waitForSelector('[data-testid="email-resent-success"]', { timeout: 5000 });
    
    const successMessage = await page.$eval('[data-testid="email-resent-success"]', el => el.textContent);
    expect(successMessage).toContain('sent');
    
    await page.screenshot({ 
      path: path.join(screenshotDir, 'email-notification.png'),
      fullPage: false,
      clip: await page.$eval('[data-testid="confirmation-email-sent"]', el => {
        const rect = el.getBoundingClientRect();
        return { x: rect.x - 20, y: rect.y - 20, width: rect.width + 40, height: rect.height + 40 };
      })
    });
  });
  
  test('displays payment receipt information', async () => {
    const confirmationUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/events/${testData.eventSlug}/register/${testData.registrationId}/confirmation`;
    await page.goto(confirmationUrl);
    
    await page.waitForSelector('[data-testid="payment-receipt"]', { timeout: 10000 });
    
    // Verify payment details
    const paymentMethod = await page.$eval('[data-testid="payment-method"]', el => el.textContent);
    expect(paymentMethod).toContain('ending in');
    
    const paymentAmount = await page.$eval('[data-testid="payment-amount"]', el => el.textContent);
    expect(paymentAmount).toMatch(/\$[\d,]+\.\d{2}/);
    
    const paymentDate = await page.$eval('[data-testid="payment-date"]', el => el.textContent);
    expect(paymentDate).toBeTruthy();
    
    // Check for Stripe receipt link
    const stripeReceipt = await page.$('[data-testid="stripe-receipt-link"]');
    if (stripeReceipt) {
      const receiptHref = await page.$eval('[data-testid="stripe-receipt-link"]', el => el.href);
      expect(receiptHref).toContain('stripe.com');
    }
    
    await page.screenshot({ 
      path: path.join(screenshotDir, 'payment-receipt.png'),
      fullPage: false,
      clip: await page.$eval('[data-testid="payment-receipt"]', el => {
        const rect = el.getBoundingClientRect();
        return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
      })
    });
  });
  
  test('provides action buttons for next steps', async () => {
    const confirmationUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/events/${testData.eventSlug}/register/${testData.registrationId}/confirmation`;
    await page.goto(confirmationUrl);
    
    await page.waitForSelector('[data-testid="confirmation-actions"]', { timeout: 10000 });
    
    // Check for various action buttons
    const actions = [
      { testId: 'view-event-button', expectedText: 'View Event' },
      { testId: 'register-another-button', expectedText: 'Register Another' },
      { testId: 'manage-registration-button', expectedText: 'Manage Registration' },
      { testId: 'add-to-calendar-button', expectedText: 'Add to Calendar' }
    ];
    
    for (const action of actions) {
      const button = await page.$(`[data-testid="${action.testId}"]`);
      if (button) {
        const buttonText = await page.$eval(`[data-testid="${action.testId}"]`, el => el.textContent);
        expect(buttonText).toContain(action.expectedText);
      }
    }
    
    // Test calendar download
    const calendarButton = await page.$('[data-testid="add-to-calendar-button"]');
    if (calendarButton) {
      await page.click('[data-testid="add-to-calendar-button"]');
      
      // Wait for calendar options
      await page.waitForSelector('[data-testid="calendar-options"]', { timeout: 5000 });
      
      const calendarOptions = await page.$$('[data-testid^="calendar-option-"]');
      expect(calendarOptions.length).toBeGreaterThan(0);
    }
    
    await page.screenshot({ 
      path: path.join(screenshotDir, 'action-buttons.png'),
      fullPage: false,
      clip: await page.$eval('[data-testid="confirmation-actions"]', el => {
        const rect = el.getBoundingClientRect();
        return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
      })
    });
  });
  
  test('handles invalid confirmation URLs', async () => {
    // Try to access confirmation with invalid registration ID
    const invalidUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/events/${testData.eventSlug}/register/invalid-id/confirmation`;
    await page.goto(invalidUrl);
    
    // Should show error or redirect
    await page.waitForTimeout(2000);
    
    // Check for error message or redirect
    const errorMessage = await page.$('[data-testid="confirmation-error"]');
    const currentUrl = page.url();
    
    expect(errorMessage || currentUrl !== invalidUrl).toBeTruthy();
    
    if (errorMessage) {
      const errorText = await page.$eval('[data-testid="confirmation-error"]', el => el.textContent);
      expect(errorText).toContain('not found');
      
      await page.screenshot({ 
        path: path.join(screenshotDir, 'confirmation-error.png'),
        fullPage: true 
      });
    }
  });
  
  test('shows loading state while fetching confirmation data', async () => {
    // Intercept API calls to delay response
    await page.setRequestInterception(true);
    
    page.on('request', request => {
      if (request.url().includes('/api/registrations/')) {
        setTimeout(() => request.continue(), 2000); // 2 second delay
      } else {
        request.continue();
      }
    });
    
    const confirmationUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/events/${testData.eventSlug}/register/${testData.registrationId}/confirmation`;
    await page.goto(confirmationUrl);
    
    // Check for loading state
    const loadingIndicator = await page.waitForSelector('[data-testid="confirmation-loading"]', { timeout: 1000 });
    expect(loadingIndicator).toBeTruthy();
    
    await page.screenshot({ 
      path: path.join(screenshotDir, 'confirmation-loading.png'),
      fullPage: true 
    });
    
    // Wait for content to load
    await page.waitForSelector('[data-testid="confirmation-step"]', { timeout: 10000 });
  });
});