import { Page, Locator } from '@playwright/test';
import { testUrls } from '../config/test-data';

export class RegistrationTypePage {
  readonly page: Page;
  readonly individualOption: Locator;
  readonly lodgeOption: Locator;
  readonly delegationOption: Locator;
  readonly continueButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.individualOption = page.getByTestId('registration-type-individual');
    this.lodgeOption = page.getByTestId('registration-type-lodge');
    this.delegationOption = page.getByTestId('registration-type-delegation');
    this.continueButton = page.getByRole('button', { name: /continue|next/i });
  }

  async goto() {
    await this.page.goto(testUrls.registration);
    await this.page.waitForLoadState('networkidle');
  }

  async selectIndividual() {
    await this.individualOption.click();
    await this.continueButton.click();
  }

  async selectLodge() {
    await this.lodgeOption.click();
    await this.continueButton.click();
  }

  async selectDelegation() {
    await this.delegationOption.click();
    await this.continueButton.click();
  }
  
  async isButtonEnabled() {
    return await this.continueButton.isEnabled();
  }
}