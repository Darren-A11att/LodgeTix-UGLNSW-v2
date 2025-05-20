# Task 143: Create Individual Registration Flow Tests

## Description
Create comprehensive E2E tests for the Individual registration flow, covering the complete journey from selecting Individual registration type through confirmation.

## Dependencies  
- Complete Task 141 (Setup E2E Testing Infrastructure)
- Complete Task 142 (Create Registration Type Tests)

## Test File Requirements

### 1. Create /tests/e2e/registration/individual-flow.test.ts
```typescript
import { test, expect } from '@playwright/test';
import { generateUniqueTestData } from '../../helpers/test-data';

describe('Individual Registration Flow', () => {
  let testData: any;

  beforeEach(async ({ page }) => {
    testData = generateUniqueTestData();
    await page.goto('/events/grand-installation/register');
    
    // Select Individual registration
    await page.click('[data-testid="registration-type-individual"]');
    await page.click('[data-testid="continue-button"]');
  });

  test('should complete full Individual registration flow', async ({ page }) => {
    // Mason Basic Information
    await expect(page.locator('h2')).toContainText('Mason Details');
    
    // Fill Mason form
    await page.selectOption('#title', 'Bro');
    await page.fill('#first_name', testData.firstName);
    await page.fill('#last_name', testData.lastName);
    await page.fill('#email', testData.email);
    await page.fill('#mobile_phone', testData.phoneNumber);
    
    // Mason-specific fields
    await page.fill('#registration_number', testData.registrationNumber);
    await page.selectOption('#masonic_rank', 'Grand_Officer');
    await page.fill('#lodge_number', testData.lodgeNumber);
    await page.fill('#lodge_name', testData.lodgeName);
    
    // Continue to contact information
    await page.click('[data-testid="continue-button"]');
    
    // Contact Details
    await expect(page.locator('h3')).toContainText('Contact Details');
    await page.selectOption('#preferred_contact_method', 'Email');
    await page.fill('#address_line_1', testData.address1);
    await page.fill('#city', testData.city);
    await page.fill('#state', testData.state);
    await page.fill('#post_code', testData.postCode);
    
    // Continue to event options
    await page.click('[data-testid="continue-button"]');
  });

  test('should handle validation errors in Individual flow', async ({ page }) => {
    // Try to continue without filling required fields
    await page.click('[data-testid="continue-button"]');
    
    // Expect validation errors
    await expect(page.locator('[data-testid="error-first_name"]')).toContainText('First name is required');
    await expect(page.locator('[data-testid="error-last_name"]')).toContainText('Last name is required');
    await expect(page.locator('[data-testid="error-email"]')).toContainText('Email is required');
    
    // Fill partial data
    await page.fill('#first_name', testData.firstName);
    await page.click('[data-testid="continue-button"]');
    
    // Expect reduced errors
    await expect(page.locator('[data-testid="error-first_name"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="error-last_name"]')).toContainText('Last name is required');
  });

  test('should save progress when navigating back and forth', async ({ page }) => {
    // Fill initial data
    await page.selectOption('#title', 'Bro');
    await page.fill('#first_name', testData.firstName);
    await page.fill('#last_name', testData.lastName);
    
    // Navigate forward
    await page.click('[data-testid="continue-button"]');
    
    // Navigate back
    await page.click('[data-testid="back-button"]');
    
    // Expect data to be preserved
    await expect(page.inputValue('#first_name')).toBe(testData.firstName);
    await expect(page.inputValue('#last_name')).toBe(testData.lastName);
    await expect(page.selectOption('#title')).toBe('Bro');
  });

  test('should complete additional information section', async ({ page }) => {
    // Complete basic information
    await fillMasonBasicInfo(page, testData);
    await page.click('[data-testid="continue-button"]');
    
    // Fill contact information
    await fillContactInfo(page, testData);
    await page.click('[data-testid="continue-button"]');
    
    // Additional Information section
    await expect(page.locator('h3')).toContainText('Additional Information');
    
    // Dietary requirements
    if (Math.random() > 0.5) {
      await page.check('#has_dietary_requirements');
      await page.fill('#dietary_requirements', 'Vegetarian, no nuts');
    }
    
    // Accessibility needs
    if (Math.random() > 0.5) {
      await page.check('#has_accessibility_needs');
      await page.fill('#accessibility_needs', 'Wheelchair access required');
    }
    
    // Emergency contact
    await page.fill('#emergency_contact_name', testData.emergencyContactName);
    await page.fill('#emergency_contact_phone', testData.emergencyContactPhone);
    
    await page.click('[data-testid="continue-button"]');
  });

  test('should display registration summary', async ({ page }) => {
    // Complete all previous steps
    await completeIndividualRegistration(page, testData);
    
    // Expect to see summary
    await expect(page.locator('h2')).toContainText('Registration Summary');
    
    // Verify summary contains correct data
    await expect(page.locator('[data-testid="summary-name"]')).toContainText(`${testData.firstName} ${testData.lastName}`);
    await expect(page.locator('[data-testid="summary-email"]')).toContainText(testData.email);
    await expect(page.locator('[data-testid="summary-type"]')).toContainText('Individual');
    
    // Should show only one attendee
    await expect(page.locator('[data-testid="attendee-count"]')).toContainText('1 Attendee');
  });

  test('should proceed to ticket selection', async ({ page }) => {
    // Complete registration
    await completeIndividualRegistration(page, testData);
    
    // Continue to ticket selection
    await page.click('[data-testid="continue-to-tickets"]');
    
    // Expect ticket selection page
    await expect(page.locator('h2')).toContainText('Select Tickets');
    
    // Should see Individual ticket options
    await expect(page.locator('[data-testid="ticket-type-individual"]')).toBeVisible();
  });
});

// Helper functions
async function fillMasonBasicInfo(page: any, data: any) {
  await page.selectOption('#title', 'Bro');
  await page.fill('#first_name', data.firstName);
  await page.fill('#last_name', data.lastName);
  await page.fill('#email', data.email);
  await page.fill('#mobile_phone', data.phoneNumber);
  await page.fill('#registration_number', data.registrationNumber);
  await page.selectOption('#masonic_rank', 'Grand_Officer');
  await page.fill('#lodge_number', data.lodgeNumber);
  await page.fill('#lodge_name', data.lodgeName);
}

async function fillContactInfo(page: any, data: any) {
  await page.selectOption('#preferred_contact_method', 'Email');
  await page.fill('#address_line_1', data.address1);
  await page.fill('#city', data.city);
  await page.fill('#state', data.state);
  await page.fill('#post_code', data.postCode);
}

async function completeIndividualRegistration(page: any, data: any) {
  await fillMasonBasicInfo(page, data);
  await page.click('[data-testid="continue-button"]');
  await fillContactInfo(page, data);
  await page.click('[data-testid="continue-button"]');
  await page.click('[data-testid="continue-button"]'); // Skip additional info
}
```

### 2. Create edge case tests for Individual flow
```typescript
describe('Individual Registration - Edge Cases', () => {
  test('should handle session timeout gracefully', async ({ page }) => {
    // Start registration
    await page.goto('/events/grand-installation/register');
    await page.click('[data-testid="registration-type-individual"]');
    
    // Simulate session timeout
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    
    // Attempt to continue
    await page.click('[data-testid="continue-button"]');
    
    // Should redirect to login or show session expired message
    await expect(page).toHaveURL(/login|session-expired/);
  });

  test('should prevent duplicate email registration', async ({ page }) => {
    const existingEmail = 'existing@example.com';
    
    // Attempt to register with existing email
    await page.goto('/events/grand-installation/register');
    await page.click('[data-testid="registration-type-individual"]');
    await page.click('[data-testid="continue-button"]');
    
    await page.fill('#email', existingEmail);
    await page.fill('#first_name', 'Test');
    await page.fill('#last_name', 'User');
    
    await page.click('[data-testid="continue-button"]');
    
    // Expect error message
    await expect(page.locator('[data-testid="error-email"]')).toContainText('Email already registered');
  });

  test('should validate phone number format', async ({ page }) => {
    await page.goto('/events/grand-installation/register');
    await page.click('[data-testid="registration-type-individual"]');
    await page.click('[data-testid="continue-button"]');
    
    // Invalid phone number
    await page.fill('#mobile_phone', '123');
    await page.click('[data-testid="continue-button"]');
    
    await expect(page.locator('[data-testid="error-mobile_phone"]')).toContainText('Invalid phone number format');
    
    // Valid phone number
    await page.fill('#mobile_phone', '+61412345678');
    await page.click('[data-testid="continue-button"]');
    
    await expect(page.locator('[data-testid="error-mobile_phone"]')).not.toBeVisible();
  });
});
```

### 3. Create performance tests
```typescript
describe('Individual Registration - Performance', () => {
  test('should load registration form within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/events/grand-installation/register');
    await page.waitForSelector('[data-testid="registration-type-individual"]');
    
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(3000); // 3 seconds max
  });

  test('should handle rapid form submissions', async ({ page }) => {
    await page.goto('/events/grand-installation/register');
    await page.click('[data-testid="registration-type-individual"]');
    await page.click('[data-testid="continue-button"]');
    
    // Fill minimal data
    await page.fill('#first_name', 'Test');
    await page.fill('#last_name', 'User');
    await page.fill('#email', 'test@example.com');
    
    // Rapid clicks
    await Promise.all([
      page.click('[data-testid="continue-button"]'),
      page.click('[data-testid="continue-button"]'),
      page.click('[data-testid="continue-button"]')
    ]);
    
    // Should only progress once
    await expect(page.locator('[data-testid="error-duplicate-submission"]')).not.toBeVisible();
  });
});
```

## Expected Outcomes
1. Comprehensive test coverage for Individual registration flow
2. All edge cases and validation scenarios covered
3. Helper functions for reusable test steps
4. Performance benchmarks established
5. Clear test organization and documentation

## Verification Steps
1. Run Individual registration tests: `npm run test:e2e -- individual-flow.test.ts`
2. Verify all tests pass consistently
3. Check test coverage report
4. Validate test results match expected user flow
5. Ensure tests are maintainable and documented