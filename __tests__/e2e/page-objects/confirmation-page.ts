import { Page, Locator } from '@playwright/test';

export class ConfirmationPage {
  readonly page: Page;
  readonly confirmationMessage: Locator;
  readonly orderNumber: Locator;
  readonly confirmationDetails: Locator;
  readonly attendeeList: Locator;
  readonly ticketList: Locator;
  readonly totalAmount: Locator;
  readonly downloadReceiptButton: Locator;
  readonly returnToHomeButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.confirmationMessage = page.getByRole('heading', { name: /Thank you|Confirmation|Success/i });
    this.orderNumber = page.getByTestId('order-number');
    this.confirmationDetails = page.getByTestId('confirmation-details');
    this.attendeeList = page.getByTestId('attendee-list');
    this.ticketList = page.getByTestId('ticket-list');
    this.totalAmount = page.getByTestId('total-amount');
    this.downloadReceiptButton = page.getByRole('button', { name: /Download Receipt/i });
    this.returnToHomeButton = page.getByRole('button', { name: /Return to Home/i });
  }

  async getOrderNumber() {
    const orderNumberText = await this.orderNumber.textContent();
    if (!orderNumberText) return null;
    
    // Extract order number (assuming format like "Order #123456")
    const match = orderNumberText.match(/#([A-Z0-9-]+)/i);
    return match ? match[1] : null;
  }

  async getAttendeeCount() {
    if (!await this.attendeeList.isVisible()) return 0;
    
    const attendeeItems = await this.attendeeList.locator('li').count();
    return attendeeItems;
  }

  async getTotalAmount() {
    const totalText = await this.totalAmount.textContent();
    
    // Extract numeric total (assuming format like "Total: $99.00")
    if (totalText) {
      const total = parseFloat(totalText.replace(/[^0-9.]/g, ''));
      return total;
    }
    
    return 0;
  }

  async downloadReceipt() {
    // In a real test, we'd need to handle the download
    // For now, we'll just click the button and ensure it was clicked
    await this.downloadReceiptButton.click();
    
    // Wait a moment for any download dialog to appear
    await this.page.waitForTimeout(500);
  }

  async returnToHome() {
    await this.returnToHomeButton.click();
    
    // Wait for navigation to home page
    await this.page.waitForURL(/^\/?$/);
  }
}