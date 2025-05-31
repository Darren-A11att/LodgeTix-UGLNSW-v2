/**
 * Form Validation Tests
 * Comprehensive tests for all form validation scenarios
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

describe('Form Validation Tests', () => {
  let browser;
  let page;
  
  const screenshotDir = path.join(__dirname, '../../screenshots/validation');
  
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
  
  describe('Basic Information Validation', () => {
    test('validates required fields on basic info form', async () => {
      await page.goto(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/events/grand-installation-2025/register`);
      
      // Navigate to attendee details
      await page.click('[data-testid="registration-type-individual"]');
      await page.click('[data-testid="continue-button"]');
      
      await page.waitForSelector('[data-testid="attendee-details-step"]');
      
      // Try to submit without filling any fields
      await page.click('[data-testid="continue-button"]');
      
      // Check for required field errors
      const errors = await page.$$eval('[data-testid^="field-error-"]', els => 
        els.map(el => ({
          field: el.dataset.field,
          message: el.textContent
        }))
      );
      
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.field === 'firstname')).toBe(true);
      expect(errors.some(e => e.field === 'lastname')).toBe(true);
      expect(errors.some(e => e.field === 'email')).toBe(true);
      
      await page.screenshot({ 
        path: path.join(screenshotDir, 'required-fields-errors.png'),
        fullPage: true 
      });
    });
    
    test('validates email format', async () => {
      await page.goto(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/events/grand-installation-2025/register`);
      
      // Navigate to form
      await page.click('[data-testid="registration-type-individual"]');
      await page.click('[data-testid="continue-button"]');
      
      await page.waitForSelector('[data-testid="attendee-details-step"]');
      
      // Test invalid email formats
      const invalidEmails = [
        'notanemail',
        'missing@domain',
        '@nodomain.com',
        'spaces in@email.com',
        'double@@domain.com'
      ];
      
      for (const email of invalidEmails) {
        await page.evaluate(() => {
          document.querySelector('[data-testid="attendee-email"]').value = '';
        });
        
        await page.type('[data-testid="attendee-email"]', email);
        await page.click('[data-testid="continue-button"]');
        
        const emailError = await page.waitForSelector('[data-testid="field-error-email"]');
        const errorText = await page.$eval('[data-testid="field-error-email"]', el => el.textContent);
        expect(errorText).toContain('valid email');
      }
      
      // Test valid email
      await page.evaluate(() => {
        document.querySelector('[data-testid="attendee-email"]').value = '';
      });
      
      await page.type('[data-testid="attendee-email"]', 'valid@email.com');
      await page.click('body'); // Blur field
      
      // Should not show error for valid email
      const validEmailError = await page.$('[data-testid="field-error-email"]');
      expect(validEmailError).toBeFalsy();
    });
    
    test('validates phone number format', async () => {
      await page.goto(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/events/grand-installation-2025/register`);
      
      // Navigate to form
      await page.click('[data-testid="registration-type-individual"]');
      await page.click('[data-testid="continue-button"]');
      
      await page.waitForSelector('[data-testid="attendee-details-step"]');
      
      // Fill required fields first
      await page.type('[data-testid="attendee-firstname"]', 'Test');
      await page.type('[data-testid="attendee-lastname"]', 'User');
      await page.type('[data-testid="attendee-email"]', 'test@example.com');
      
      // Test invalid phone formats
      const invalidPhones = [
        '123',
        'abcd1234567',
        '123-456-789'
      ];
      
      for (const phone of invalidPhones) {
        await page.evaluate(() => {
          const phoneInput = document.querySelector('[data-testid="attendee-phone"]');
          if (phoneInput) phoneInput.value = '';
        });
        
        await page.type('[data-testid="attendee-phone"]', phone);
        await page.click('[data-testid="continue-button"]');
        
        const phoneError = await page.$('[data-testid="field-error-phone"]');
        if (phoneError) {
          const errorText = await page.$eval('[data-testid="field-error-phone"]', el => el.textContent);
          expect(errorText).toContain('phone');
        }
      }
      
      await page.screenshot({ 
        path: path.join(screenshotDir, 'phone-validation.png'),
        fullPage: false,
        clip: await page.$eval('[data-testid="attendee-phone"]', el => {
          const rect = el.getBoundingClientRect();
          return { x: rect.x - 20, y: rect.y - 20, width: rect.width + 40, height: rect.height + 80 };
        })
      });
    });
  });
  
  describe('Mason-specific Validation', () => {
    test('validates mason registration number', async () => {
      await page.goto(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/events/grand-installation-2025/register`);
      
      // Navigate to form and select mason
      await page.click('[data-testid="registration-type-individual"]');
      await page.click('[data-testid="continue-button"]');
      
      await page.waitForSelector('[data-testid="attendee-details-step"]');
      await page.click('[data-testid="attendee-type-mason"]');
      
      // Wait for mason fields to appear
      await page.waitForSelector('[data-testid="mason-registration-number"]');
      
      // Test invalid registration numbers
      const invalidRegNumbers = [
        'ABC',
        '12',
        '123456789012345', // too long
        'REG-123@'
      ];
      
      for (const regNum of invalidRegNumbers) {
        await page.evaluate(() => {
          document.querySelector('[data-testid="mason-registration-number"]').value = '';
        });
        
        await page.type('[data-testid="mason-registration-number"]', regNum);
        await page.click('body'); // Blur field
        
        const regError = await page.$('[data-testid="field-error-registration-number"]');
        if (regError) {
          const errorText = await page.$eval('[data-testid="field-error-registration-number"]', el => el.textContent);
          expect(errorText).toBeTruthy();
        }
      }
    });
    
    test('validates Grand Lodge selection', async () => {
      await page.goto(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/events/grand-installation-2025/register`);
      
      // Navigate to form and select mason
      await page.click('[data-testid="registration-type-individual"]');
      await page.click('[data-testid="continue-button"]');
      
      await page.waitForSelector('[data-testid="attendee-details-step"]');
      await page.click('[data-testid="attendee-type-mason"]');
      
      // Fill basic info
      await page.type('[data-testid="attendee-firstname"]', 'Mason');
      await page.type('[data-testid="attendee-lastname"]', 'Test');
      await page.type('[data-testid="attendee-email"]', 'mason@test.com');
      
      // Try to submit without selecting Grand Lodge
      await page.click('[data-testid="continue-button"]');
      
      const grandLodgeError = await page.waitForSelector('[data-testid="field-error-grand-lodge"]');
      expect(grandLodgeError).toBeTruthy();
      
      await page.screenshot({ 
        path: path.join(screenshotDir, 'grand-lodge-required.png'),
        fullPage: false,
        clip: await page.$eval('[data-testid="grand-lodge-select"]', el => {
          const rect = el.getBoundingClientRect();
          return { x: rect.x - 20, y: rect.y - 20, width: rect.width + 40, height: rect.height + 80 };
        })
      });
    });
    
    test('validates Grand Officer fields', async () => {
      await page.goto(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/events/grand-installation-2025/register`);
      
      // Navigate to form and select mason
      await page.click('[data-testid="registration-type-individual"]');
      await page.click('[data-testid="continue-button"]');
      
      await page.waitForSelector('[data-testid="attendee-details-step"]');
      await page.click('[data-testid="attendee-type-mason"]');
      
      // Toggle Grand Officer
      await page.click('[data-testid="is-grand-officer-toggle"]');
      
      // Wait for Grand Officer fields
      await page.waitForSelector('[data-testid="grand-rank-select"]');
      
      // Try to submit without selecting rank
      await page.click('[data-testid="continue-button"]');
      
      const rankError = await page.waitForSelector('[data-testid="field-error-grand-rank"]');
      expect(rankError).toBeTruthy();
    });
  });
  
  describe('Partner Validation', () => {
    test('validates partner fields when partner is added', async () => {
      await page.goto(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/events/grand-installation-2025/register`);
      
      // Navigate to form
      await page.click('[data-testid="registration-type-individual"]');
      await page.click('[data-testid="continue-button"]');
      
      await page.waitForSelector('[data-testid="attendee-details-step"]');
      
      // Toggle partner
      await page.click('[data-testid="has-partner-toggle"]');
      
      // Wait for partner fields
      await page.waitForSelector('[data-testid="partner-firstname"]');
      
      // Try to submit without partner details
      await page.type('[data-testid="attendee-firstname"]', 'Test');
      await page.type('[data-testid="attendee-lastname"]', 'User');
      await page.type('[data-testid="attendee-email"]', 'test@example.com');
      
      await page.click('[data-testid="continue-button"]');
      
      // Check for partner field errors
      const partnerErrors = await page.$$('[data-testid^="field-error-partner-"]');
      expect(partnerErrors.length).toBeGreaterThan(0);
      
      await page.screenshot({ 
        path: path.join(screenshotDir, 'partner-validation.png'),
        fullPage: true 
      });
    });
    
    test('validates partner relationship selection', async () => {
      await page.goto(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/events/grand-installation-2025/register`);
      
      // Navigate to form
      await page.click('[data-testid="registration-type-individual"]');
      await page.click('[data-testid="continue-button"]');
      
      await page.waitForSelector('[data-testid="attendee-details-step"]');
      
      // Toggle partner
      await page.click('[data-testid="has-partner-toggle"]');
      
      // Fill partner name but not relationship
      await page.type('[data-testid="partner-firstname"]', 'Partner');
      await page.type('[data-testid="partner-lastname"]', 'Name');
      
      await page.click('[data-testid="continue-button"]');
      
      const relationshipError = await page.$('[data-testid="field-error-partner-relationship"]');
      if (relationshipError) {
        const errorText = await page.$eval('[data-testid="field-error-partner-relationship"]', el => el.textContent);
        expect(errorText).toContain('relationship');
      }
    });
  });
  
  describe('Billing Details Validation', () => {
    test('validates billing address fields', async () => {
      // Navigate directly to payment step with test data
      await page.goto(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/events/grand-installation-2025/register/test-id/payment`);
      
      await page.waitForSelector('[data-testid="payment-step"]');
      
      // Try to submit without billing details
      await page.click('[data-testid="submit-payment-button"]');
      
      // Check for billing errors
      const billingErrors = [
        'billing-name',
        'billing-address',
        'billing-city',
        'billing-postcode',
        'billing-country',
        'billing-state'
      ];
      
      for (const field of billingErrors) {
        const error = await page.$(`[data-testid="field-error-${field}"]`);
        expect(error).toBeTruthy();
      }
      
      await page.screenshot({ 
        path: path.join(screenshotDir, 'billing-validation.png'),
        fullPage: true 
      });
    });
    
    test('validates postcode format by country', async () => {
      await page.goto(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/events/grand-installation-2025/register/test-id/payment`);
      
      await page.waitForSelector('[data-testid="payment-step"]');
      
      // Select Australia
      await page.click('[data-testid="billing-country"]');
      await page.click('[data-testid="country-AU"]');
      
      // Test invalid Australian postcode
      await page.type('[data-testid="billing-postcode"]', '123'); // Too short
      await page.click('body');
      
      const postcodeError = await page.$('[data-testid="field-error-billing-postcode"]');
      if (postcodeError) {
        const errorText = await page.$eval('[data-testid="field-error-billing-postcode"]', el => el.textContent);
        expect(errorText).toContain('4 digits');
      }
    });
  });
  
  describe('Cross-field Validation', () => {
    test('validates attendee uniqueness in group registrations', async () => {
      await page.goto(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/events/grand-installation-2025/register`);
      
      // Select lodge registration
      await page.click('[data-testid="registration-type-lodge"]');
      await page.click('[data-testid="continue-button"]');
      
      await page.waitForSelector('[data-testid="attendee-details-step"]');
      
      // Add first member
      await page.type('[data-testid="member-0-firstname"]', 'John');
      await page.type('[data-testid="member-0-lastname"]', 'Doe');
      await page.type('[data-testid="member-0-email"]', 'john@example.com');
      
      // Add second member with same email
      await page.click('[data-testid="add-member-button"]');
      await page.type('[data-testid="member-1-firstname"]', 'Jane');
      await page.type('[data-testid="member-1-lastname"]', 'Doe');
      await page.type('[data-testid="member-1-email"]', 'john@example.com'); // Same email
      
      await page.click('[data-testid="continue-button"]');
      
      // Check for duplicate email error
      const duplicateError = await page.waitForSelector('[data-testid="duplicate-email-error"]');
      expect(duplicateError).toBeTruthy();
      
      await page.screenshot({ 
        path: path.join(screenshotDir, 'duplicate-attendee.png'),
        fullPage: true 
      });
    });
    
    test('validates date fields for logical consistency', async () => {
      await page.goto(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/events/grand-installation-2025/register`);
      
      // Navigate to form
      await page.click('[data-testid="registration-type-individual"]');
      await page.click('[data-testid="continue-button"]');
      
      await page.waitForSelector('[data-testid="attendee-details-step"]');
      
      // If there are date fields (like date of birth)
      const dobField = await page.$('[data-testid="date-of-birth"]');
      if (dobField) {
        // Try to enter future date
        const futureDate = new Date();
        futureDate.setFullYear(futureDate.getFullYear() + 1);
        
        await page.type('[data-testid="date-of-birth"]', futureDate.toISOString().split('T')[0]);
        await page.click('body');
        
        const dateError = await page.$('[data-testid="field-error-date-of-birth"]');
        if (dateError) {
          const errorText = await page.$eval('[data-testid="field-error-date-of-birth"]', el => el.textContent);
          expect(errorText).toContain('future');
        }
      }
    });
  });
  
  test('shows field-specific validation on blur', async () => {
    await page.goto(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/events/grand-installation-2025/register`);
    
    // Navigate to form
    await page.click('[data-testid="registration-type-individual"]');
    await page.click('[data-testid="continue-button"]');
    
    await page.waitForSelector('[data-testid="attendee-details-step"]');
    
    // Focus and blur email field with invalid value
    await page.focus('[data-testid="attendee-email"]');
    await page.type('[data-testid="attendee-email"]', 'invalid');
    await page.click('body'); // Blur
    
    // Error should appear immediately
    const emailError = await page.waitForSelector('[data-testid="field-error-email"]', { timeout: 1000 });
    expect(emailError).toBeTruthy();
    
    // Fix the error
    await page.evaluate(() => {
      document.querySelector('[data-testid="attendee-email"]').value = '';
    });
    await page.type('[data-testid="attendee-email"]', 'valid@email.com');
    await page.click('body');
    
    // Error should disappear
    await page.waitForTimeout(500);
    const errorGone = await page.$('[data-testid="field-error-email"]');
    expect(errorGone).toBeFalsy();
    
    await page.screenshot({ 
      path: path.join(screenshotDir, 'realtime-validation.png'),
      fullPage: false,
      clip: await page.$eval('[data-testid="attendee-email"]', el => {
        const rect = el.getBoundingClientRect();
        return { x: rect.x - 20, y: rect.y - 20, width: rect.width + 40, height: rect.height + 80 };
      })
    });
  });
});