import { Page, Locator } from '@playwright/test';

export class DelegationDetailsPage {
  readonly page: Page;
  readonly delegationNameInput: Locator;
  readonly delegationTypeSelect: Locator;
  readonly grandLodgeSelect: Locator;
  readonly contactPersonInput: Locator;
  readonly contactEmailInput: Locator;
  readonly contactPhoneInput: Locator;
  readonly delegationTable: Locator;
  readonly addAttendeeButton: Locator;
  readonly delegateCountDisplay: Locator;
  readonly continueButton: Locator;
  readonly officialDelegatesSection: Locator;
  readonly accompanyingGuestsSection: Locator;

  constructor(page: Page) {
    this.page = page;
    this.delegationNameInput = page.getByLabel('Delegation Name');
    this.delegationTypeSelect = page.getByLabel('Delegation Type');
    this.grandLodgeSelect = page.getByLabel('Grand Lodge');
    this.contactPersonInput = page.getByLabel('Contact Person');
    this.contactEmailInput = page.getByLabel('Contact Email');
    this.contactPhoneInput = page.getByTestId('contact-phone-input');
    this.delegationTable = page.locator('[data-testid="delegation-table"]');
    this.addAttendeeButton = page.getByRole('button', { name: /Add Delegate/i });
    this.delegateCountDisplay = page.getByTestId('delegate-count');
    this.continueButton = page.getByRole('button', { name: /Continue|Next/i });
    this.officialDelegatesSection = page.getByTestId('official-delegates-section');
    this.accompanyingGuestsSection = page.getByTestId('accompanying-guests-section');
  }

  async fillDelegationDetails(delegationName: string, delegationType: string, grandLodge: string, contactPerson: string, contactEmail: string, contactPhone: string) {
    await this.delegationNameInput.fill(delegationName);
    await this.delegationTypeSelect.selectOption(delegationType);
    await this.grandLodgeSelect.selectOption(grandLodge);
    await this.contactPersonInput.fill(contactPerson);
    await this.contactEmailInput.fill(contactEmail);
    await this.contactPhoneInput.fill(contactPhone);
  }

  async addOfficialDelegate(firstName: string, lastName: string, email: string, phone: string, title: string, rank: string, role: string) {
    await this.addAttendeeButton.click();
    
    // Wait for delegate modal to appear
    const modal = this.page.locator('[data-testid="delegate-modal"]');
    await modal.waitFor();
    
    // Fill delegate details
    await modal.getByLabel('First Name').fill(firstName);
    await modal.getByLabel('Last Name').fill(lastName);
    await modal.getByLabel('Email').fill(email);
    await modal.getByTestId('phone-input').fill(phone);
    await modal.getByLabel('Title').fill(title);
    await modal.getByLabel('Rank').selectOption(rank);
    await modal.getByLabel('Role').selectOption(role);
    
    // Select "Official Delegate" type
    const delegateTypeRadio = modal.getByLabel('Official Delegate');
    await delegateTypeRadio.check();
    
    // Save delegate
    await modal.getByRole('button', { name: /Save|Add/i }).click();
    
    // Wait for modal to close
    await modal.waitFor({ state: 'hidden' });
  }

  async addAccompanyingGuest(firstName: string, lastName: string, email: string, phone: string, relationship: string) {
    await this.addAttendeeButton.click();
    
    // Wait for delegate modal to appear
    const modal = this.page.locator('[data-testid="delegate-modal"]');
    await modal.waitFor();
    
    // Fill guest details
    await modal.getByLabel('First Name').fill(firstName);
    await modal.getByLabel('Last Name').fill(lastName);
    await modal.getByLabel('Email').fill(email);
    await modal.getByTestId('phone-input').fill(phone);
    
    // Select "Accompanying Guest" type
    const guestTypeRadio = modal.getByLabel('Accompanying Guest');
    await guestTypeRadio.check();
    
    // Set relationship
    await modal.getByLabel('Relationship').selectOption(relationship);
    
    // Save guest
    await modal.getByRole('button', { name: /Save|Add/i }).click();
    
    // Wait for modal to close
    await modal.waitFor({ state: 'hidden' });
  }

  async editDelegate(index: number, updates: { firstName?: string, lastName?: string, email?: string, phone?: string, title?: string, role?: string }) {
    // Get the edit button for the delegate at the specified index
    const editButtons = await this.page.locator('[data-testid="edit-delegate-button"]').all();
    if (index >= editButtons.length) {
      throw new Error(`Cannot edit delegate at index ${index}. Only ${editButtons.length} delegates exist.`);
    }
    
    // Click the edit button
    await editButtons[index].click();
    
    // Wait for delegate modal to appear
    const modal = this.page.locator('[data-testid="delegate-modal"]');
    await modal.waitFor();
    
    // Update fields as specified
    if (updates.firstName) {
      await modal.getByLabel('First Name').fill(updates.firstName);
    }
    
    if (updates.lastName) {
      await modal.getByLabel('Last Name').fill(updates.lastName);
    }
    
    if (updates.email) {
      await modal.getByLabel('Email').fill(updates.email);
    }
    
    if (updates.phone) {
      await modal.getByTestId('phone-input').fill(updates.phone);
    }
    
    if (updates.title) {
      await modal.getByLabel('Title').fill(updates.title);
    }
    
    if (updates.role) {
      await modal.getByLabel('Role').selectOption(updates.role);
    }
    
    // Save delegate
    await modal.getByRole('button', { name: /Save|Update/i }).click();
    
    // Wait for modal to close
    await modal.waitFor({ state: 'hidden' });
  }

  async removeDelegate(index: number) {
    // Get the remove button for the delegate at the specified index
    const removeButtons = await this.page.locator('[data-testid="remove-delegate-button"]').all();
    if (index >= removeButtons.length) {
      throw new Error(`Cannot remove delegate at index ${index}. Only ${removeButtons.length} delegates exist.`);
    }
    
    // Click the remove button
    await removeButtons[index].click();
    
    // Confirm removal if a confirmation dialog appears
    const confirmButton = this.page.getByRole('button', { name: /Confirm|Yes|Delete/i });
    if (await confirmButton.isVisible()) {
      await confirmButton.click();
    }
  }

  async getDelegateCount() {
    const countText = await this.delegateCountDisplay.textContent();
    if (!countText) return 0;
    
    // Extract the delegate count from format like "5 delegates"
    const match = countText.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  }

  async continueToTicketSelection() {
    await this.continueButton.click();
  }
}