# Task 145: Create Delegation Registration Flow Tests

## Description
Create comprehensive E2E tests for Delegation registration flow, covering inter-jurisdictional and overseas delegations with appropriate entitlements.

## Dependencies
- Complete Task 141 (Setup E2E Testing Infrastructure)
- Complete Task 142 (Create Registration Type Tests)
- Complete Task 143 (Create Individual Registration Tests)
- Complete Task 144 (Create Lodge Registration Tests)

## Test File Requirements

### 1. Create /tests/e2e/registration/delegation-flow.test.ts
```typescript
import { test, expect } from '@playwright/test';
import { generateUniqueTestData } from '../../helpers/test-data';

describe('Delegation Registration Flow', () => {
  let testData: any;

  beforeEach(async ({ page }) => {
    testData = generateUniqueTestData();
    await page.goto('/events/grand-installation/register');
    
    // Select Delegation registration
    await page.click('[data-testid="registration-type-delegation"]');
    await page.click('[data-testid="continue-button"]');
  });

  test('should complete Inter-jurisdictional Delegation registration', async ({ page }) => {
    // Select delegation type
    await expect(page.locator('h2')).toContainText('Delegation Type');
    await page.click('[data-testid="delegation-type-interjurisdictional"]');
    await page.click('[data-testid="continue-button"]');
    
    // Delegation Details
    await expect(page.locator('h2')).toContainText('Delegation Details');
    
    // Fill delegation information
    await page.selectOption('#jurisdiction', 'Victoria');
    await page.fill('#delegation_size', '5');
    await page.fill('#head_of_delegation_name', testData.headDelegateName);
    await page.fill('#head_of_delegation_email', testData.headDelegateEmail);
    await page.fill('#head_of_delegation_phone', testData.headDelegatePhone);
    
    await page.click('[data-testid="continue-button"]');
    
    // Should show auto-generated attendees
    await expect(page.locator('h2')).toContainText('Delegation Members');
    
    // Verify 5 attendees are created
    await expect(page.locator('[data-testid="delegation-member-count"]')).toContainText('5 Members');
    
    // Edit first member (Head of Delegation)
    await page.click('[data-testid="edit-member-1"]');
    await page.selectOption('#title-1', 'RW Bro');
    await page.fill('#first_name-1', testData.headDelegateFirstName);
    await page.fill('#last_name-1', testData.headDelegateLastName);
    await page.selectOption('#masonic_rank-1', 'Grand_Master');
    await page.click('[data-testid="save-member-1"]');
    
    // Edit second member
    await page.click('[data-testid="edit-member-2"]');
    await fillDelegationMember(page, generateUniqueTestData(), 2, 'Deputy_Grand_Master');
    await page.click('[data-testid="save-member-2"]');
    
    await page.click('[data-testid="continue-button"]');
  });

  test('should handle Overseas Delegation with different entitlements', async ({ page }) => {
    // Select overseas delegation
    await page.click('[data-testid="delegation-type-overseas"]');
    await page.click('[data-testid="continue-button"]');
    
    // Delegation Details
    await page.fill('#country', 'United Kingdom');
    await page.fill('#delegation_size', '3');
    await page.fill('#head_of_delegation_name', testData.headDelegateName);
    await page.fill('#head_of_delegation_email', testData.headDelegateEmail);
    await page.fill('#head_of_delegation_phone', testData.headDelegatePhone);
    
    // Special requirements for overseas
    await page.check('#requires_visa_assistance');
    await page.fill('#arrival_date', '2024-03-01');
    await page.fill('#departure_date', '2024-03-05');
    
    await page.click('[data-testid="continue-button"]');
    
    // Verify entitlements are displayed
    await expect(page.locator('[data-testid="delegation-entitlements"]')).toContainText('Overseas Delegation Benefits');
    await expect(page.locator('[data-testid="hotel-accommodation"]')).toContainText('Complimentary hotel accommodation');
    await expect(page.locator('[data-testid="transport"]')).toContainText('Airport transfers included');
  });

  test('should validate delegation size limits', async ({ page }) => {
    // Select inter-jurisdictional
    await page.click('[data-testid="delegation-type-interjurisdictional"]');
    await page.click('[data-testid="continue-button"]');
    
    // Try excessive delegation size
    await page.selectOption('#jurisdiction', 'Victoria');
    await page.fill('#delegation_size', '50'); // Too large
    await page.click('[data-testid="continue-button"]');
    
    // Expect error
    await expect(page.locator('[data-testid="error-delegation_size"]')).toContainText('Maximum delegation size is 30');
    
    // Set valid size
    await page.fill('#delegation_size', '10');
    await page.fill('#head_of_delegation_name', testData.headDelegateName);
    await page.fill('#head_of_delegation_email', testData.headDelegateEmail);
    await page.fill('#head_of_delegation_phone', testData.headDelegatePhone);
    
    await page.click('[data-testid="continue-button"]');
    await expect(page.locator('[data-testid="error-delegation_size"]')).not.toBeVisible();
  });

  test('should handle delegation member removal and addition', async ({ page }) => {
    // Complete delegation setup with 5 members
    await setupDelegation(page, 'Victoria', 5);
    
    // Remove a member
    await page.click('[data-testid="remove-member-3"]');
    await page.click('[data-testid="confirm-remove"]');
    
    // Verify count updated
    await expect(page.locator('[data-testid="delegation-member-count"]')).toContainText('4 Members');
    
    // Add a new member
    await page.click('[data-testid="add-member"]');
    await fillDelegationMember(page, generateUniqueTestData(), 5, 'Grand_Officer');
    await page.click('[data-testid="save-member-5"]');
    
    // Verify count
    await expect(page.locator('[data-testid="delegation-member-count"]')).toContainText('5 Members');
  });

  test('should calculate correct pricing for delegations', async ({ page }) => {
    // Setup inter-jurisdictional delegation
    await setupDelegation(page, 'Victoria', 6);
    
    // Continue to ticket selection
    await page.click('[data-testid="continue-button"]');
    
    // Should show appropriate pricing
    await expect(page.locator('h2')).toContainText('Select Tickets');
    await expect(page.locator('[data-testid="delegation-pricing"]')).toContainText('Delegation rate applied');
    
    // Verify bulk pricing
    await expect(page.locator('[data-testid="per-person-price"]')).toBeVisible();
    await expect(page.locator('[data-testid="total-price"]')).toBeVisible();
  });

  test('should show different entitlements by delegation type', async ({ page }) => {
    // Test Inter-jurisdictional
    await page.click('[data-testid="delegation-type-interjurisdictional"]');
    await page.click('[data-testid="continue-button"]');
    
    await setupDelegationDetails(page, 'Victoria', 3);
    await page.click('[data-testid="continue-button"]');
    
    // Check entitlements
    await expect(page.locator('[data-testid="reserved-seating"]')).toContainText('Reserved seating area');
    await expect(page.locator('[data-testid="welcome-reception"]')).toContainText('Welcome reception invitation');
    
    // Go back and test Overseas
    await page.click('[data-testid="back-button"]');
    await page.click('[data-testid="back-button"]');
    
    await page.click('[data-testid="delegation-type-overseas"]');
    await page.click('[data-testid="continue-button"]');
    
    await page.fill('#country', 'United Kingdom');
    await page.fill('#delegation_size', '3');
    await page.fill('#head_of_delegation_name', testData.headDelegateName);
    await page.fill('#head_of_delegation_email', testData.headDelegateEmail);
    await page.fill('#head_of_delegation_phone', testData.headDelegatePhone);
    
    await page.click('[data-testid="continue-button"]');
    
    // Check additional entitlements
    await expect(page.locator('[data-testid="hotel-accommodation"]')).toContainText('Complimentary accommodation');
    await expect(page.locator('[data-testid="vip-dinner"]')).toContainText('VIP dinner invitation');
    await expect(page.locator('[data-testid="cultural-program"]')).toContainText('Cultural program access');
  });

  test('should handle special dietary and accessibility for delegation', async ({ page }) => {
    // Setup delegation
    await setupDelegation(page, 'Queensland', 4);
    
    // Edit members to add special requirements
    for (let i = 1; i <= 2; i++) {
      await page.click(`[data-testid="edit-member-${i}"]`);
      
      // Add dietary requirements
      await page.check(`#has_dietary_requirements-${i}`);
      await page.fill(`#dietary_requirements-${i}`, 'Kosher meals required');
      
      // Add accessibility needs
      await page.check(`#has_accessibility_needs-${i}`);
      await page.fill(`#accessibility_needs-${i}`, 'Wheelchair accessible seating');
      
      await page.click(`[data-testid="save-member-${i}"]`);
    }
    
    // Continue to summary
    await page.click('[data-testid="continue-button"]');
    
    // Verify special requirements are shown
    await expect(page.locator('[data-testid="special-requirements-summary"]')).toContainText('2 members with dietary requirements');
    await expect(page.locator('[data-testid="accessibility-summary"]')).toContainText('2 members with accessibility needs');
  });
});

// Helper functions
async function setupDelegation(page: any, jurisdiction: string, size: number) {
  await page.click('[data-testid="delegation-type-interjurisdictional"]');
  await page.click('[data-testid="continue-button"]');
  
  await setupDelegationDetails(page, jurisdiction, size);
  await page.click('[data-testid="continue-button"]');
}

async function setupDelegationDetails(page: any, jurisdiction: string, size: number) {
  const testData = generateUniqueTestData();
  await page.selectOption('#jurisdiction', jurisdiction);
  await page.fill('#delegation_size', size.toString());
  await page.fill('#head_of_delegation_name', testData.headDelegateName);
  await page.fill('#head_of_delegation_email', testData.headDelegateEmail);
  await page.fill('#head_of_delegation_phone', testData.headDelegatePhone);
}

async function fillDelegationMember(page: any, data: any, memberNumber: number, rank: string) {
  await page.selectOption(`#title-${memberNumber}`, 'RW Bro');
  await page.fill(`#first_name-${memberNumber}`, data.firstName);
  await page.fill(`#last_name-${memberNumber}`, data.lastName);
  await page.fill(`#email-${memberNumber}`, data.email);
  await page.fill(`#mobile_phone-${memberNumber}`, data.phoneNumber);
  await page.selectOption(`#masonic_rank-${memberNumber}`, rank);
  await page.fill(`#official_title-${memberNumber}`, data.officialTitle);
}
```

### 2. Create delegation-specific test scenarios
```typescript
describe('Delegation Registration - Special Scenarios', () => {
  test('should handle protocol order for delegation members', async ({ page }) => {
    // Setup delegation
    await setupDelegation(page, 'Victoria', 5);
    
    // Verify members are ordered by protocol
    const member1Title = await page.locator('[data-testid="member-1-title"]').textContent();
    const member2Title = await page.locator('[data-testid="member-2-title"]').textContent();
    
    // Grand Master should be first
    expect(member1Title).toContain('Head of Delegation');
    
    // Verify reordering when ranks change
    await page.click('[data-testid="edit-member-3"]');
    await page.selectOption('#masonic_rank-3', 'Grand_Master');
    await page.click('[data-testid="save-member-3"]');
    
    // Should trigger reordering warning
    await expect(page.locator('[data-testid="protocol-order-warning"]')).toBeVisible();
  });

  test('should validate delegation head requirements', async ({ page }) => {
    // Select delegation type
    await page.click('[data-testid="delegation-type-interjurisdictional"]');
    await page.click('[data-testid="continue-button"]');
    
    // Try to submit without head of delegation
    await page.selectOption('#jurisdiction', 'Victoria');
    await page.fill('#delegation_size', '3');
    await page.click('[data-testid="continue-button"]');
    
    // Expect errors
    await expect(page.locator('[data-testid="error-head_of_delegation_name"]')).toContainText('Head of delegation is required');
    await expect(page.locator('[data-testid="error-head_of_delegation_email"]')).toContainText('Email is required');
  });

  test('should handle mixed delegation with partners', async ({ page }) => {
    // Setup delegation
    await setupDelegation(page, 'South Australia', 4);
    
    // Add partners to some members
    await page.click('[data-testid="edit-member-1"]');
    await page.check('#attending_with_partner-1');
    await fillPartnerDetails(page, generateUniqueTestData(), 1);
    await page.click('[data-testid="save-member-1"]');
    
    await page.click('[data-testid="edit-member-3"]');
    await page.check('#attending_with_partner-3');
    await fillPartnerDetails(page, generateUniqueTestData(), 3);
    await page.click('[data-testid="save-member-3"]');
    
    // Verify total count
    await expect(page.locator('[data-testid="total-attendees"]')).toContainText('6 Total Attendees');
    await expect(page.locator('[data-testid="partner-count"]')).toContainText('2 Partners');
  });
});

async function fillPartnerDetails(page: any, data: any, memberNumber: number) {
  await page.selectOption(`#partner_title-${memberNumber}`, 'Mrs');
  await page.fill(`#partner_first_name-${memberNumber}`, data.firstName);
  await page.fill(`#partner_last_name-${memberNumber}`, data.lastName);
  await page.fill(`#partner_email-${memberNumber}`, data.email);
  await page.fill(`#partner_mobile_phone-${memberNumber}`, data.phoneNumber);
}
```

## Expected Outcomes
1. Complete test coverage for both inter-jurisdictional and overseas delegations
2. Validation of delegation-specific business rules
3. Entitlement verification by delegation type
4. Protocol order handling for members
5. Special requirements aggregation
6. Bulk pricing calculations

## Verification Steps
1. Run delegation tests: `npm run test:e2e -- delegation-flow.test.ts`
2. Verify delegation type selection works correctly
3. Check entitlements are properly displayed
4. Validate member management functionality
5. Ensure protocol ordering is maintained
6. Test special requirements handling