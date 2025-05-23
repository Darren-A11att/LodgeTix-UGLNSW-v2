import { Page, Locator } from '@playwright/test';
import { testData } from '../config/test-data';

export class PaymentPage {
  readonly page: Page;
  readonly orderSummary: Locator;
  readonly totalAmount: Locator;
  readonly billingForm: Locator;
  readonly nameOnCardInput: Locator;
  readonly emailInput: Locator;
  readonly phoneInput: Locator;
  readonly addressLine1Input: Locator;
  readonly addressLine2Input: Locator;
  readonly suburbInput: Locator;
  readonly stateSelect: Locator;
  readonly postcodeInput: Locator;
  readonly countrySelect: Locator;
  readonly cardElement: Locator;
  readonly payButton: Locator;
  readonly backButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.orderSummary = page.locator('[data-testid="order-summary"]');
    this.totalAmount = page.locator('[data-testid="total-amount"]');
    this.billingForm = page.locator('[data-testid="billing-form"]');
    this.nameOnCardInput = page.getByLabel('Name on card');
    this.emailInput = page.getByLabel('Email');
    this.phoneInput = page.getByTestId('phone-input');
    this.addressLine1Input = page.getByLabel('Address');
    this.addressLine2Input = page.getByLabel('Address line 2');
    this.suburbInput = page.getByLabel('Suburb');
    this.stateSelect = page.getByLabel('State');
    this.postcodeInput = page.getByLabel('Postcode');
    this.countrySelect = page.getByLabel('Country');
    this.cardElement = page.locator('[data-testid="card-element"]');
    this.payButton = page.getByRole('button', { name: /Pay|Complete|Place Order/i });
    this.backButton = page.getByRole('button', { name: /Back/i });
    this.errorMessage = page.locator('[data-testid="payment-error"]');
  }

  async fillBillingDetails(billingDetails: {
    name: string;
    email: string;
    phone: string;
    address1: string;
    address2?: string;
    suburb: string;
    state: string;
    postcode: string;
    country?: string;
  }) {
    await this.nameOnCardInput.fill(billingDetails.name);
    await this.emailInput.fill(billingDetails.email);
    await this.phoneInput.fill(billingDetails.phone);
    await this.addressLine1Input.fill(billingDetails.address1);
    
    if (billingDetails.address2) {
      await this.addressLine2Input.fill(billingDetails.address2);
    }
    
    await this.suburbInput.fill(billingDetails.suburb);
    await this.stateSelect.selectOption(billingDetails.state);
    await this.postcodeInput.fill(billingDetails.postcode);
    
    if (billingDetails.country) {
      await this.countrySelect.selectOption(billingDetails.country);
    }
  }

  async fillCardDetails() {
    // In a real test, we'd need to handle the Stripe card element iframe
    // For our mock, we'll just ensure the card element exists and is visible
    await this.cardElement.waitFor({ state: 'visible' });
    
    // Since we've mocked Stripe in global-setup.ts, we don't need to actually enter card details
    // The mock will automatically succeed
  }

  async completePurchase() {
    // Fill in test billing details
    await this.fillBillingDetails({
      name: 'Test User',
      email: 'test@example.com',
      phone: '0400000000',
      address1: '123 Test Street',
      suburb: 'Testville',
      state: 'NSW',
      postcode: '2000',
      country: 'Australia'
    });
    
    // Fill card details using our mock
    await this.fillCardDetails();
    
    // Click the pay button
    await this.payButton.click();
    
    // Wait for navigation to confirmation page
    await this.page.waitForURL(/.*confirmation/);
  }

  async goBack() {
    await this.backButton.click();
  }

  async getErrorMessage() {
    if (await this.errorMessage.isVisible()) {
      return this.errorMessage.textContent();
    }
    return null;
  }
}