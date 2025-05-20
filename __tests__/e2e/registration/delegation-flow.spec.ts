import { test, expect } from '@playwright/test';
import { RegistrationTypePage } from '../page-objects/registration-type-page';
import { DelegationDetailsPage } from '../page-objects/delegation-details-page';
import { TicketSelectionPage } from '../page-objects/ticket-selection-page';
import { generateUniqueTestData } from '../config/test-data';
import { takeScreenshot } from '../utils/test-utils';

test.describe('Delegation Registration Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Start from registration type page
    const regTypePage = new RegistrationTypePage(page);
    await regTypePage.goto();
    
    // Select delegation registration for all tests in this group
    await regTypePage.selectDelegation();
    
    // Verify we're on the delegation details page
    await page.waitForURL(/.*delegation-details/);
  });

  test('should allow filling delegation details', async ({ page }) => {
    // Generate unique test data
    const uniqueId = Date.now().toString();
    
    // Create delegation details page object
    const delegationDetailsPage = new DelegationDetailsPage(page);
    
    // Fill delegation details
    await delegationDetailsPage.fillDelegationDetails(
      `Test Delegation ${uniqueId}`,
      'Inter-jurisdictional',
      'United Grand Lodge of NSW & ACT',
      `Delegation Leader ${uniqueId}`,
      `leader${uniqueId}@example.com`,
      `0400${uniqueId.substring(0, 6)}`
    );
    
    // Take screenshot of completed form
    await takeScreenshot(page, 'delegation-details-completed');
  });

  test('should support both delegation types', async ({ page }) => {
    // Generate unique test data
    const uniqueId = Date.now().toString();
    
    // Create delegation details page object
    const delegationDetailsPage = new DelegationDetailsPage(page);
    
    // Fill delegation details with "Inter-jurisdictional" type
    await delegationDetailsPage.fillDelegationDetails(
      `Test Delegation ${uniqueId}`,
      'Inter-jurisdictional',
      'United Grand Lodge of NSW & ACT',
      `Delegation Leader ${uniqueId}`,
      `leader${uniqueId}@example.com`,
      `0400${uniqueId.substring(0, 6)}`
    );
    
    // Take screenshot of inter-jurisdictional form
    await takeScreenshot(page, 'delegation-inter-jurisdictional');
    
    // Change to "Overseas" type
    await delegationDetailsPage.delegationTypeSelect.selectOption('Overseas');
    
    // Take screenshot of overseas form
    await takeScreenshot(page, 'delegation-overseas');
    
    // Verify overseas-specific fields appear if applicable
    const hasOverseaseFields = await page.locator('[data-testid="overseas-fields"]').count() > 0;
    if (hasOverseaseFields) {
      await expect(page.locator('[data-testid="overseas-fields"]')).toBeVisible();
    }
  });

  test('should allow adding official delegates with different roles', async ({ page }) => {
    // Generate unique test data
    const uniqueData = generateUniqueTestData();
    const uniqueId = Date.now().toString();
    
    // Create delegation details page object
    const delegationDetailsPage = new DelegationDetailsPage(page);
    
    // Fill delegation details
    await delegationDetailsPage.fillDelegationDetails(
      `Test Delegation ${uniqueId}`,
      'Inter-jurisdictional',
      'United Grand Lodge of NSW & ACT',
      `Delegation Leader ${uniqueId}`,
      `leader${uniqueId}@example.com`,
      `0400${uniqueId.substring(0, 6)}`
    );
    
    // Define delegate roles to add
    const delegateRoles = [
      { firstName: 'Grand', lastName: 'Master', title: 'MW Bro', rank: 'GL', role: 'Grand Master' },
      { firstName: 'Deputy', lastName: 'Grand Master', title: 'RW Bro', rank: 'GL', role: 'Deputy Grand Master' },
      { firstName: 'Grand', lastName: 'Secretary', title: 'VW Bro', rank: 'GL', role: 'Grand Secretary' }
    ];
    
    // Add delegates with different roles
    for (let i = 0; i < delegateRoles.length; i++) {
      const delegate = delegateRoles[i];
      await delegationDetailsPage.addOfficialDelegate(
        delegate.firstName,
        delegate.lastName,
        `${delegate.firstName.toLowerCase()}.${delegate.lastName.toLowerCase()}${uniqueId}@example.com`,
        uniqueData.mason.phone.replace(/\d{4}$/, `${i+1}000`),
        delegate.title,
        delegate.rank,
        delegate.role
      );
    }
    
    // Verify delegates are added to the table
    const delegateCount = await delegationDetailsPage.getDelegateCount();
    expect(delegateCount).toBe(delegateRoles.length);
    
    // Take screenshot of delegates table
    await takeScreenshot(page, 'delegation-official-delegates');
  });

  test('should allow adding accompanying guests', async ({ page }) => {
    // Generate unique test data
    const uniqueData = generateUniqueTestData();
    const uniqueId = Date.now().toString();
    
    // Create delegation details page object
    const delegationDetailsPage = new DelegationDetailsPage(page);
    
    // Fill delegation details
    await delegationDetailsPage.fillDelegationDetails(
      `Test Delegation ${uniqueId}`,
      'Inter-jurisdictional',
      'United Grand Lodge of NSW & ACT',
      `Delegation Leader ${uniqueId}`,
      `leader${uniqueId}@example.com`,
      `0400${uniqueId.substring(0, 6)}`
    );
    
    // Add one official delegate (Grand Master)
    await delegationDetailsPage.addOfficialDelegate(
      'Grand',
      'Master',
      `gm${uniqueId}@example.com`,
      uniqueData.mason.phone,
      'MW Bro',
      'GL',
      'Grand Master'
    );
    
    // Add accompanying guest (spouse)
    await delegationDetailsPage.addAccompanyingGuest(
      'Jane',
      'Master',
      `jane.master${uniqueId}@example.com`,
      uniqueData.guest.phone,
      'Spouse'
    );
    
    // Verify guest is added to the table
    const guestSection = await delegationDetailsPage.accompanyingGuestsSection.isVisible();
    expect(guestSection).toBe(true);
    
    // Take screenshot of guests section
    await takeScreenshot(page, 'delegation-accompanying-guests');
  });

  test('should allow editing delegates', async ({ page }) => {
    // Generate unique test data
    const uniqueData = generateUniqueTestData();
    const uniqueId = Date.now().toString();
    
    // Create delegation details page object
    const delegationDetailsPage = new DelegationDetailsPage(page);
    
    // Fill delegation details
    await delegationDetailsPage.fillDelegationDetails(
      `Test Delegation ${uniqueId}`,
      'Inter-jurisdictional',
      'United Grand Lodge of NSW & ACT',
      `Delegation Leader ${uniqueId}`,
      `leader${uniqueId}@example.com`,
      `0400${uniqueId.substring(0, 6)}`
    );
    
    // Add an official delegate
    await delegationDetailsPage.addOfficialDelegate(
      'Grand',
      'Master',
      `gm${uniqueId}@example.com`,
      uniqueData.mason.phone,
      'MW Bro',
      'GL',
      'Grand Master'
    );
    
    // Edit the delegate
    const updatedTitle = 'Most Worshipful Brother';
    await delegationDetailsPage.editDelegate(0, {
      title: updatedTitle,
      email: `updated.gm${uniqueId}@example.com`
    });
    
    // Verify the edit was successful by checking if the updated title appears in the table
    const delegationTable = await page.locator('[data-testid="delegation-table"]').textContent();
    expect(delegationTable).toContain(updatedTitle);
  });

  test('should allow removing delegates', async ({ page }) => {
    // Generate unique test data
    const uniqueData = generateUniqueTestData();
    const uniqueId = Date.now().toString();
    
    // Create delegation details page object
    const delegationDetailsPage = new DelegationDetailsPage(page);
    
    // Fill delegation details
    await delegationDetailsPage.fillDelegationDetails(
      `Test Delegation ${uniqueId}`,
      'Inter-jurisdictional',
      'United Grand Lodge of NSW & ACT',
      `Delegation Leader ${uniqueId}`,
      `leader${uniqueId}@example.com`,
      `0400${uniqueId.substring(0, 6)}`
    );
    
    // Add two delegates
    await delegationDetailsPage.addOfficialDelegate(
      'Grand',
      'Master',
      `gm${uniqueId}@example.com`,
      uniqueData.mason.phone,
      'MW Bro',
      'GL',
      'Grand Master'
    );
    
    await delegationDetailsPage.addOfficialDelegate(
      'Deputy',
      'Grand Master',
      `dgm${uniqueId}@example.com`,
      uniqueData.mason.phone.replace(/\d{4}$/, '1111'),
      'RW Bro',
      'GL',
      'Deputy Grand Master'
    );
    
    // Get initial delegate count
    const initialCount = await delegationDetailsPage.getDelegateCount();
    
    // Remove one delegate
    await delegationDetailsPage.removeDelegate(0); // Remove the first delegate (Grand Master)
    
    // Verify delegate count decreased
    const newCount = await delegationDetailsPage.getDelegateCount();
    expect(newCount).toBe(initialCount - 1);
  });

  test('should complete full delegation registration flow', async ({ page }) => {
    // Generate unique test data
    const uniqueData = generateUniqueTestData();
    const uniqueId = Date.now().toString();
    
    // Create page objects
    const delegationDetailsPage = new DelegationDetailsPage(page);
    const ticketSelectionPage = new TicketSelectionPage(page);
    
    // Fill delegation details
    await delegationDetailsPage.fillDelegationDetails(
      `Test Delegation ${uniqueId}`,
      'Inter-jurisdictional',
      'United Grand Lodge of NSW & ACT',
      `Delegation Leader ${uniqueId}`,
      `leader${uniqueId}@example.com`,
      `0400${uniqueId.substring(0, 6)}`
    );
    
    // Define delegate roles to add
    const delegateRoles = [
      { firstName: 'Grand', lastName: 'Master', title: 'MW Bro', rank: 'GL', role: 'Grand Master' },
      { firstName: 'Deputy', lastName: 'Grand Master', title: 'RW Bro', rank: 'GL', role: 'Deputy Grand Master' }
    ];
    
    // Add official delegates
    for (let i = 0; i < delegateRoles.length; i++) {
      const delegate = delegateRoles[i];
      await delegationDetailsPage.addOfficialDelegate(
        delegate.firstName,
        delegate.lastName,
        `${delegate.firstName.toLowerCase()}.${delegate.lastName.toLowerCase()}${uniqueId}@example.com`,
        uniqueData.mason.phone.replace(/\d{4}$/, `${i+1}000`),
        delegate.title,
        delegate.rank,
        delegate.role
      );
    }
    
    // Add accompanying guest
    await delegationDetailsPage.addAccompanyingGuest(
      'Jane',
      'Master',
      `jane.master${uniqueId}@example.com`,
      uniqueData.guest.phone,
      'Spouse'
    );
    
    // Continue to ticket selection
    await delegationDetailsPage.continueToTicketSelection();
    
    // Verify we're on ticket selection page
    await expect(page).toHaveURL(/.*ticket-selection/);
    
    // Select tickets for all attendees (2 delegates + 1 guest = 3 tickets)
    await ticketSelectionPage.selectTicket('Grand Installation', 2);
    await ticketSelectionPage.selectTicket('Guest Ticket', 1);
    
    // Verify total amount updates
    const totalAmount = await ticketSelectionPage.getTotalAmount();
    expect(totalAmount).toBeGreaterThan(0);
    
    // Continue to order review
    await ticketSelectionPage.continueToOrderReview();
    
    // Verify navigation to order review page
    await expect(page).toHaveURL(/.*order-review/);
  });
});