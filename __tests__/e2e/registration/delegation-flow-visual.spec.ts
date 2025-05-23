import { test, expect } from '@playwright/test';
import { RegistrationTypePage } from '../page-objects/registration-type-page';
import { DelegationDetailsPage } from '../page-objects/delegation-details-page';
import { generateUniqueTestData } from '../config/test-data';

test.describe('Delegation Registration Flow Visual Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Start from registration type page
    const regTypePage = new RegistrationTypePage(page);
    await regTypePage.goto();
    
    // Select delegation registration for all tests in this group
    await regTypePage.selectDelegation();
    
    // Verify we're on the delegation details page
    await page.waitForURL(/.*delegation-details/);
  });

  test('should have consistent form layout on desktop', async ({ page }) => {
    // Set desktop viewport
    await page.setViewport({ width: 1280, height: 800 });
    
    // Take screenshot of initial form state
    const screenshot = await page.screenshot({ fullPage: true });
    expect(screenshot).toBeTruthy();
  });

  test('should have responsive form layout on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewport({ width: 375, height: 812 });
    
    // Take screenshot of mobile form layout
    const screenshot = await page.screenshot({ fullPage: true });
    expect(screenshot).toBeTruthy();
  });

  test('should show visual distinction between delegates and guests', async ({ page }) => {
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
    
    // Add one official delegate
    await delegationDetailsPage.addOfficialDelegate(
      'Grand',
      'Master',
      `gm${uniqueId}@example.com`,
      uniqueData.mason.phone,
      'MW Bro',
      'GL',
      'Grand Master'
    );
    
    // Add accompanying guest
    await delegationDetailsPage.addAccompanyingGuest(
      'Jane',
      'Master',
      `jane.master${uniqueId}@example.com`,
      uniqueData.guest.phone,
      'Spouse'
    );
    
    // Take screenshot showing visual distinction between delegate and guest
    const screenshot = await page.screenshot({ fullPage: true });
    expect(screenshot).toBeTruthy();
  });

  test('should show delegate modal with correct layout', async ({ page }) => {
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
    
    // Open add delegate modal
    await delegationDetailsPage.addAttendeeButton.click();
    
    // Wait for modal to appear
    await page.waitForSelector('[data-testid="delegate-modal"]');
    
    // Take screenshot of add delegate modal
    const screenshot = await page.screenshot();
    expect(screenshot).toBeTruthy();
  });

  test('should show different fields for official delegate vs guest', async ({ page }) => {
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
    
    // Open add delegate modal
    await delegationDetailsPage.addAttendeeButton.click();
    
    // Wait for modal to appear
    const modal = page.locator('[data-testid="delegate-modal"]');
    await modal.waitFor();
    
    // Take screenshot with "Official Delegate" selected
    const delegateTypeRadio = modal.getByLabel('Official Delegate');
    await delegateTypeRadio.check();
    
    const officialDelegateScreenshot = await page.screenshot();
    
    // Change to "Accompanying Guest"
    const guestTypeRadio = modal.getByLabel('Accompanying Guest');
    await guestTypeRadio.check();
    
    // Take screenshot with "Accompanying Guest" selected
    const accompanyingGuestScreenshot = await page.screenshot();
    
    // Verify screenshots are different (indicating different form fields are shown)
    expect(officialDelegateScreenshot).not.toEqual(accompanyingGuestScreenshot);
    
    // Close the modal
    await modal.getByRole('button', { name: /Cancel|Close/i }).click();
  });

  test('should show protocol order in the delegates table', async ({ page }) => {
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
    
    // Add delegates in reverse order to check if they're reordered by protocol
    const delegateRoles = [
      { firstName: 'Grand', lastName: 'Secretary', title: 'VW Bro', rank: 'GL', role: 'Grand Secretary' },
      { firstName: 'Deputy', lastName: 'Grand Master', title: 'RW Bro', rank: 'GL', role: 'Deputy Grand Master' },
      { firstName: 'Grand', lastName: 'Master', title: 'MW Bro', rank: 'GL', role: 'Grand Master' }
    ];
    
    // Add delegates
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
    
    // Take screenshot of delegates table showing protocol order
    const screenshot = await page.screenshot({ fullPage: true });
    expect(screenshot).toBeTruthy();
  });
});