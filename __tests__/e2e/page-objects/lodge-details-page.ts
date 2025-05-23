import { Page, Locator } from '@playwright/test';

export class LodgeDetailsPage {
  readonly page: Page;
  readonly lodgeNameInput: Locator;
  readonly lodgeNumberInput: Locator;
  readonly grandLodgeSelect: Locator;
  readonly contactPersonInput: Locator;
  readonly contactEmailInput: Locator;
  readonly contactPhoneInput: Locator;
  readonly attendeeList: Locator;
  readonly addAttendeeButton: Locator;
  readonly attendeeCountDisplay: Locator;
  readonly continueButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.lodgeNameInput = page.getByLabel('Lodge Name');
    this.lodgeNumberInput = page.getByLabel('Lodge Number');
    this.grandLodgeSelect = page.getByLabel('Grand Lodge');
    this.contactPersonInput = page.getByLabel('Contact Person');
    this.contactEmailInput = page.getByLabel('Contact Email');
    this.contactPhoneInput = page.getByTestId('contact-phone-input');
    this.attendeeList = page.locator('[data-testid="attendee-list"]');
    this.addAttendeeButton = page.getByRole('button', { name: /Add Attendee/i });
    this.attendeeCountDisplay = page.getByTestId('member-count');
    this.continueButton = page.getByRole('button', { name: /Continue|Next/i });
  }

  async fillLodgeDetails(lodgeName: string, lodgeNumber: string, grandLodge: string, contactPerson: string, contactEmail: string, contactPhone: string) {
    await this.lodgeNameInput.fill(lodgeName);
    await this.lodgeNumberInput.fill(lodgeNumber);
    await this.grandLodgeSelect.selectOption(grandLodge);
    await this.contactPersonInput.fill(contactPerson);
    await this.contactEmailInput.fill(contactEmail);
    await this.contactPhoneInput.fill(contactPhone);
  }

  async addMasonAttendee(firstName: string, lastName: string, email: string, phone: string, rank: string) {
    await this.addAttendeeButton.click();
    
    // Wait for attendee modal to appear
    const modal = this.page.locator('[data-testid="attendee-modal"]');
    await modal.waitFor();
    
    // Fill attendee details
    await modal.getByLabel('First Name').fill(firstName);
    await modal.getByLabel('Last Name').fill(lastName);
    await modal.getByLabel('Email').fill(email);
    await modal.getByTestId('phone-input').fill(phone);
    
    // Make sure "Is Mason" is checked
    const isMasonCheckbox = modal.getByLabel(/Is Mason/i);
    if (!await isMasonCheckbox.isChecked()) {
      await isMasonCheckbox.check();
    }
    
    // Select rank
    await modal.getByLabel('Rank').selectOption(rank);
    
    // Save attendee
    await modal.getByRole('button', { name: /Save/i }).click();
    
    // Wait for modal to close
    await modal.waitFor({ state: 'hidden' });
  }

  async addGuestAttendee(firstName: string, lastName: string, email: string, phone: string) {
    await this.addAttendeeButton.click();
    
    // Wait for attendee modal to appear
    const modal = this.page.locator('[data-testid="attendee-modal"]');
    await modal.waitFor();
    
    // Fill attendee details
    await modal.getByLabel('First Name').fill(firstName);
    await modal.getByLabel('Last Name').fill(lastName);
    await modal.getByLabel('Email').fill(email);
    await modal.getByTestId('phone-input').fill(phone);
    
    // Make sure "Is Mason" is unchecked
    const isMasonCheckbox = modal.getByLabel(/Is Mason/i);
    if (await isMasonCheckbox.isChecked()) {
      await isMasonCheckbox.uncheck();
    }
    
    // Save attendee
    await modal.getByRole('button', { name: /Save/i }).click();
    
    // Wait for modal to close
    await modal.waitFor({ state: 'hidden' });
  }

  async editAttendee(index: number, updates: { firstName?: string, lastName?: string, email?: string, phone?: string }) {
    // Get the edit button for the attendee at the specified index
    const editButtons = await this.page.locator('[data-testid="edit-attendee-button"]').all();
    if (index >= editButtons.length) {
      throw new Error(`Cannot edit attendee at index ${index}. Only ${editButtons.length} attendees exist.`);
    }
    
    // Click the edit button
    await editButtons[index].click();
    
    // Wait for attendee modal to appear
    const modal = this.page.locator('[data-testid="attendee-modal"]');
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
    
    // Save attendee
    await modal.getByRole('button', { name: /Save/i }).click();
    
    // Wait for modal to close
    await modal.waitFor({ state: 'hidden' });
  }

  async removeAttendee(index: number) {
    // Get the remove button for the attendee at the specified index
    const removeButtons = await this.page.locator('[data-testid="remove-attendee-button"]').all();
    if (index >= removeButtons.length) {
      throw new Error(`Cannot remove attendee at index ${index}. Only ${removeButtons.length} attendees exist.`);
    }
    
    // Click the remove button
    await removeButtons[index].click();
    
    // Confirm removal if a confirmation dialog appears
    const confirmButton = this.page.getByRole('button', { name: /Confirm|Yes|Delete/i });
    if (await confirmButton.isVisible()) {
      await confirmButton.click();
    }
  }

  async getAttendeeCount() {
    const countText = await this.attendeeCountDisplay.textContent();
    if (!countText) return 0;
    
    // Extract the current count from format like "3 of 3 minimum"
    const match = countText.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  }

  async continueToTicketSelection() {
    await this.continueButton.click();
  }
}