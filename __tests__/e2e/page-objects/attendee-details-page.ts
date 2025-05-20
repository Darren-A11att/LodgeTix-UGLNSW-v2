import { Page, Locator } from '@playwright/test';

export class AttendeeDetailsPage {
  readonly page: Page;
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly emailInput: Locator;
  readonly phoneInput: Locator;
  readonly isMasonToggle: Locator;
  readonly rankSelect: Locator;
  readonly grandLodgeSelect: Locator;
  readonly lodgeSelect: Locator;
  readonly partnerToggle: Locator;
  readonly dietaryRequirementsInput: Locator;
  readonly specialNeedsInput: Locator;
  readonly continueButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.firstNameInput = page.getByLabel('First Name');
    this.lastNameInput = page.getByLabel('Last Name');
    this.emailInput = page.getByLabel('Email');
    this.phoneInput = page.getByTestId('phone-input');
    this.isMasonToggle = page.getByLabel(/Are you a Freemason/i);
    this.rankSelect = page.getByLabel('Rank');
    this.grandLodgeSelect = page.getByLabel('Grand Lodge');
    this.lodgeSelect = page.getByLabel('Lodge');
    this.partnerToggle = page.getByLabel(/Add Partner/i);
    this.dietaryRequirementsInput = page.getByLabel(/Dietary Requirements/i);
    this.specialNeedsInput = page.getByLabel(/Special Needs/i);
    this.continueButton = page.getByRole('button', { name: /Continue|Next/i });
  }

  async fillGuestDetails(firstName: string, lastName: string, email: string, phone: string, dietary?: string, specialNeeds?: string) {
    await this.firstNameInput.fill(firstName);
    await this.lastNameInput.fill(lastName);
    await this.emailInput.fill(email);
    await this.phoneInput.fill(phone);
    
    if (dietary) {
      await this.dietaryRequirementsInput.fill(dietary);
    }
    
    if (specialNeeds) {
      await this.specialNeedsInput.fill(specialNeeds);
    }
  }

  async fillMasonDetails(firstName: string, lastName: string, email: string, phone: string, rank: string, grandLodge: string, lodge: string, dietary?: string, specialNeeds?: string) {
    await this.firstNameInput.fill(firstName);
    await this.lastNameInput.fill(lastName);
    await this.emailInput.fill(email);
    await this.phoneInput.fill(phone);
    
    // Select mason toggle if not already selected
    if (!await this.isMasonToggle.isChecked()) {
      await this.isMasonToggle.check();
    }
    
    await this.rankSelect.selectOption(rank);
    
    // Wait for grand lodge dropdown to be enabled
    await this.page.waitForSelector('select[name="grandLodge"]:not([disabled])');
    await this.grandLodgeSelect.selectOption(grandLodge);
    
    // Wait for lodge dropdown to be enabled
    await this.page.waitForSelector('select[name="lodge"]:not([disabled])');
    await this.lodgeSelect.selectOption(lodge);
    
    if (dietary) {
      await this.dietaryRequirementsInput.fill(dietary);
    }
    
    if (specialNeeds) {
      await this.specialNeedsInput.fill(specialNeeds);
    }
  }

  async addPartner(firstName: string, lastName: string, email: string, phone: string, dietary?: string, specialNeeds?: string) {
    // Click partner toggle
    await this.partnerToggle.click();
    
    // Wait for partner form to appear
    await this.page.waitForSelector('[data-testid="partner-form"]');
    
    // Get partner form section
    const partnerForm = this.page.locator('[data-testid="partner-form"]');
    
    // Fill partner details
    await partnerForm.getByLabel('First Name').fill(firstName);
    await partnerForm.getByLabel('Last Name').fill(lastName);
    await partnerForm.getByLabel('Email').fill(email);
    await partnerForm.getByTestId('phone-input').fill(phone);
    
    if (dietary) {
      await partnerForm.getByLabel(/Dietary Requirements/i).fill(dietary);
    }
    
    if (specialNeeds) {
      await partnerForm.getByLabel(/Special Needs/i).fill(specialNeeds);
    }
  }

  async continueToTicketSelection() {
    await this.continueButton.click();
  }
}