# Task 144: Create Lodge Registration Flow Tests

## Description
Create comprehensive E2E tests for Lodge registration flow, covering multiple Mason and Guest attendees with partners.

## Dependencies
- Complete Task 141 (Setup E2E Testing Infrastructure)
- Complete Task 142 (Create Registration Type Tests)
- Complete Task 143 (Create Individual Registration Tests)

## Test File Requirements

### 1. Create /tests/e2e/registration/lodge-flow.test.ts
```typescript
import { test, expect } from '@playwright/test';
import { generateUniqueTestData } from '../../helpers/test-data';

describe('Lodge Registration Flow', () => {
  let testData: any;

  beforeEach(async ({ page }) => {
    testData = generateUniqueTestData();
    await page.goto('/events/grand-installation/register');
    
    // Select Lodge registration
    await page.click('[data-testid="registration-type-lodge"]');
    await page.click('[data-testid="continue-button"]');
  });

  test('should complete Lodge registration with multiple Masons', async ({ page }) => {
    // Should start with Lodge Details
    await expect(page.locator('h2')).toContainText('Lodge Details');
    
    // Fill Lodge information
    await page.fill('#lodge_number', testData.lodgeNumber);
    await page.fill('#lodge_name', testData.lodgeName);
    await page.fill('#contact_person_name', testData.contactName);
    await page.fill('#contact_person_email', testData.contactEmail);
    await page.fill('#contact_person_phone', testData.contactPhone);
    
    await page.click('[data-testid="continue-button"]');
    
    // Should show attendee management
    await expect(page.locator('h2')).toContainText('Lodge Attendees');
    
    // Add first Mason
    await page.click('[data-testid="add-mason-button"]');
    await fillMasonDetails(page, generateUniqueTestData(), 1);
    await page.click('[data-testid="save-attendee-1"]');
    
    // Add second Mason
    await page.click('[data-testid="add-mason-button"]');
    await fillMasonDetails(page, generateUniqueTestData(), 2);
    await page.click('[data-testid="save-attendee-2"]');
    
    // Verify attendee count
    await expect(page.locator('[data-testid="mason-count"]')).toContainText('2 Masons');
    
    await page.click('[data-testid="continue-button"]');
  });

  test('should handle Lodge registration with Mason and partner', async ({ page }) => {
    // Complete Lodge details
    await fillLodgeDetails(page, testData);
    await page.click('[data-testid="continue-button"]');
    
    // Add Mason
    await page.click('[data-testid="add-mason-button"]');
    const masonData = generateUniqueTestData();
    await fillMasonDetails(page, masonData, 1);
    
    // Add partner
    await page.check('#attending_with_partner');
    await fillPartnerDetails(page, generateUniqueTestData(), 1);
    
    await page.click('[data-testid="save-attendee-1"]');
    
    // Verify partner is added
    await expect(page.locator('[data-testid="partner-1-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="attendee-count"]')).toContainText('2 Attendees');
  });

  test('should add and remove attendees dynamically', async ({ page }) => {
    // Complete Lodge details
    await fillLodgeDetails(page, testData);
    await page.click('[data-testid="continue-button"]');
    
    // Add three attendees
    for (let i = 1; i <= 3; i++) {
      await page.click('[data-testid="add-mason-button"]');
      await fillMasonDetails(page, generateUniqueTestData(), i);
      await page.click(`[data-testid="save-attendee-${i}"]`);
    }
    
    // Verify count
    await expect(page.locator('[data-testid="mason-count"]')).toContainText('3 Masons');
    
    // Remove second attendee
    await page.click('[data-testid="remove-attendee-2"]');
    await page.click('[data-testid="confirm-remove"]');
    
    // Verify updated count
    await expect(page.locator('[data-testid="mason-count"]')).toContainText('2 Masons');
  });

  test('should handle mixed attendee types', async ({ page }) => {
    // Complete Lodge details
    await fillLodgeDetails(page, testData);
    await page.click('[data-testid="continue-button"]');
    
    // Add Mason
    await page.click('[data-testid="add-mason-button"]');
    await fillMasonDetails(page, generateUniqueTestData(), 1);
    await page.click('[data-testid="save-attendee-1"]');
    
    // Add Guest
    await page.click('[data-testid="add-guest-button"]');
    await fillGuestDetails(page, generateUniqueTestData(), 2);
    await page.click('[data-testid="save-attendee-2"]');
    
    // Add Mason with partner
    await page.click('[data-testid="add-mason-button"]');
    await fillMasonDetails(page, generateUniqueTestData(), 3);
    await page.check('#attending_with_partner');
    await fillPartnerDetails(page, generateUniqueTestData(), 3);
    await page.click('[data-testid="save-attendee-3"]');
    
    // Verify counts
    await expect(page.locator('[data-testid="mason-count"]')).toContainText('2 Masons');
    await expect(page.locator('[data-testid="guest-count"]')).toContainText('1 Guest');
    await expect(page.locator('[data-testid="partner-count"]')).toContainText('1 Partner');
    await expect(page.locator('[data-testid="total-attendees"]')).toContainText('4 Total Attendees');
  });

  test('should validate minimum attendee requirement', async ({ page }) => {
    // Complete Lodge details
    await fillLodgeDetails(page, testData);
    await page.click('[data-testid="continue-button"]');
    
    // Try to continue without adding attendees
    await page.click('[data-testid="continue-button"]');
    
    // Expect error
    await expect(page.locator('[data-testid="error-min-attendees"]')).toContainText('At least 1 attendee required');
    
    // Add one attendee
    await page.click('[data-testid="add-mason-button"]');
    await fillMasonDetails(page, generateUniqueTestData(), 1);
    await page.click('[data-testid="save-attendee-1"]');
    
    // Should now allow continuation
    await page.click('[data-testid="continue-button"]');
    await expect(page.locator('[data-testid="error-min-attendees"]')).not.toBeVisible();
  });

  test('should calculate correct pricing for Lodge registration', async ({ page }) => {
    // Complete Lodge details
    await fillLodgeDetails(page, testData);
    await page.click('[data-testid="continue-button"]');
    
    // Add attendees
    await addMasonAttendee(page, generateUniqueTestData(), 1);
    await addMasonAttendee(page, generateUniqueTestData(), 2);
    await addGuestAttendee(page, generateUniqueTestData(), 3);
    
    await page.click('[data-testid="continue-button"]');
    
    // Should show ticket selection
    await expect(page.locator('h2')).toContainText('Select Tickets');
    
    // Verify volume pricing is applied
    await expect(page.locator('[data-testid="discount-message"]')).toContainText('Lodge discount applied');
  });

  test('should save progress and allow editing attendees', async ({ page }) => {
    // Complete Lodge details
    await fillLodgeDetails(page, testData);
    await page.click('[data-testid="continue-button"]');
    
    // Add attendee
    const attendeeData = generateUniqueTestData();
    await addMasonAttendee(page, attendeeData, 1);
    
    // Edit attendee
    await page.click('[data-testid="edit-attendee-1"]');
    
    // Verify data is populated
    await expect(page.inputValue('#first_name')).toBe(attendeeData.firstName);
    await expect(page.inputValue('#last_name')).toBe(attendeeData.lastName);
    
    // Update data
    await page.fill('#first_name', 'Updated');
    await page.click('[data-testid="save-attendee-1"]');
    
    // Verify update
    await expect(page.locator('[data-testid="attendee-1-name"]')).toContainText('Updated');
  });
});

// Helper functions
async function fillLodgeDetails(page: any, data: any) {
  await page.fill('#lodge_number', data.lodgeNumber);
  await page.fill('#lodge_name', data.lodgeName);
  await page.fill('#contact_person_name', data.contactName);
  await page.fill('#contact_person_email', data.contactEmail);
  await page.fill('#contact_person_phone', data.contactPhone);
}

async function fillMasonDetails(page: any, data: any, attendeeNumber: number) {
  await page.selectOption(`#title-${attendeeNumber}`, 'Bro');
  await page.fill(`#first_name-${attendeeNumber}`, data.firstName);
  await page.fill(`#last_name-${attendeeNumber}`, data.lastName);
  await page.fill(`#email-${attendeeNumber}`, data.email);
  await page.fill(`#mobile_phone-${attendeeNumber}`, data.phoneNumber);
  await page.fill(`#registration_number-${attendeeNumber}`, data.registrationNumber);
  await page.selectOption(`#masonic_rank-${attendeeNumber}`, 'Grand_Officer');
}

async function fillGuestDetails(page: any, data: any, attendeeNumber: number) {
  await page.selectOption(`#title-${attendeeNumber}`, 'Mr');
  await page.fill(`#first_name-${attendeeNumber}`, data.firstName);
  await page.fill(`#last_name-${attendeeNumber}`, data.lastName);
  await page.fill(`#email-${attendeeNumber}`, data.email);
  await page.fill(`#mobile_phone-${attendeeNumber}`, data.phoneNumber);
  await page.selectOption(`#relationship-${attendeeNumber}`, 'Guest');
}

async function fillPartnerDetails(page: any, data: any, attendeeNumber: number) {
  await page.selectOption(`#partner_title-${attendeeNumber}`, 'Mrs');
  await page.fill(`#partner_first_name-${attendeeNumber}`, data.firstName);
  await page.fill(`#partner_last_name-${attendeeNumber}`, data.lastName);
  await page.fill(`#partner_email-${attendeeNumber}`, data.email);
  await page.fill(`#partner_mobile_phone-${attendeeNumber}`, data.phoneNumber);
}

async function addMasonAttendee(page: any, data: any, attendeeNumber: number) {
  await page.click('[data-testid="add-mason-button"]');
  await fillMasonDetails(page, data, attendeeNumber);
  await page.click(`[data-testid="save-attendee-${attendeeNumber}"]`);
}

async function addGuestAttendee(page: any, data: any, attendeeNumber: number) {
  await page.click('[data-testid="add-guest-button"]');
  await fillGuestDetails(page, data, attendeeNumber);
  await page.click(`[data-testid="save-attendee-${attendeeNumber}"]`);
}
```

### 2. Create Lodge-specific edge case tests
```typescript
describe('Lodge Registration - Edge Cases', () => {
  test('should handle large number of attendees', async ({ page }) => {
    // Complete Lodge details
    await fillLodgeDetails(page, generateUniqueTestData());
    await page.click('[data-testid="continue-button"]');
    
    // Add 20 attendees (stress test)
    for (let i = 1; i <= 20; i++) {
      await addMasonAttendee(page, generateUniqueTestData(), i);
    }
    
    // Verify all attendees are displayed
    await expect(page.locator('[data-testid="mason-count"]')).toContainText('20 Masons');
    
    // Verify pagination if implemented
    if (await page.locator('[data-testid="pagination"]').isVisible()) {
      await expect(page.locator('[data-testid="page-1"]')).toBeVisible();
      await expect(page.locator('[data-testid="page-2"]')).toBeVisible();
    }
  });

  test('should prevent duplicate emails within Lodge', async ({ page }) => {
    // Complete Lodge details
    await fillLodgeDetails(page, generateUniqueTestData());
    await page.click('[data-testid="continue-button"]');
    
    // Add first attendee
    const duplicateEmail = 'duplicate@example.com';
    const attendee1 = { ...generateUniqueTestData(), email: duplicateEmail };
    await addMasonAttendee(page, attendee1, 1);
    
    // Try to add second attendee with same email
    await page.click('[data-testid="add-mason-button"]');
    const attendee2 = { ...generateUniqueTestData(), email: duplicateEmail };
    await fillMasonDetails(page, attendee2, 2);
    await page.click('[data-testid="save-attendee-2"]');
    
    // Expect error
    await expect(page.locator('[data-testid="error-duplicate-email"]')).toContainText('Email already used for another attendee');
  });

  test('should validate Lodge number format', async ({ page }) => {
    await page.goto('/events/grand-installation/register');
    await page.click('[data-testid="registration-type-lodge"]');
    await page.click('[data-testid="continue-button"]');
    
    // Invalid Lodge number
    await page.fill('#lodge_number', 'ABC');
    await page.click('[data-testid="continue-button"]');
    
    await expect(page.locator('[data-testid="error-lodge_number"]')).toContainText('Lodge number must be numeric');
    
    // Valid Lodge number
    await page.fill('#lodge_number', '123');
    await page.fill('#lodge_name', 'Test Lodge');
    await page.fill('#contact_person_name', 'Test Contact');
    await page.fill('#contact_person_email', 'contact@lodge.com');
    await page.fill('#contact_person_phone', '+61412345678');
    
    await page.click('[data-testid="continue-button"]');
    await expect(page.locator('[data-testid="error-lodge_number"]')).not.toBeVisible();
  });
});
```

## Expected Outcomes
1. Comprehensive test coverage for Lodge registration flow
2. Tests for multiple attendee management
3. Partner addition and removal scenarios
4. Volume pricing validation
5. Edge case handling for large groups
6. Duplicate prevention within Lodge

## Verification Steps
1. Run Lodge registration tests: `npm run test:e2e -- lodge-flow.test.ts`
2. Verify all attendee management scenarios work
3. Check partner functionality
4. Validate pricing calculations
5. Ensure edge cases are handled gracefully