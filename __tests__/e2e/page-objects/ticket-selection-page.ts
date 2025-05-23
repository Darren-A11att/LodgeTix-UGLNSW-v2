import { Page, Locator } from '@playwright/test';

export class TicketSelectionPage {
  readonly page: Page;
  readonly ticketList: Locator;
  readonly quantityInputs: Locator;
  readonly totalAmount: Locator;
  readonly continueButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.ticketList = page.locator('[data-testid="ticket-list"]');
    this.quantityInputs = page.locator('[data-testid="ticket-quantity-input"]');
    this.totalAmount = page.locator('[data-testid="total-amount"]');
    this.continueButton = page.getByRole('button', { name: /Continue|Next/i });
  }

  async selectTicket(ticketName: string, quantity: number) {
    // Find the ticket by name
    const ticketItem = this.page.locator(`[data-testid="ticket-item"]:has-text("${ticketName}")`);
    
    // Find the quantity input within this ticket item
    const quantityInput = ticketItem.locator('[data-testid="ticket-quantity-input"]');
    
    // Set the quantity
    await quantityInput.fill(quantity.toString());
  }

  async getTicketPrice(ticketName: string) {
    const ticketItem = this.page.locator(`[data-testid="ticket-item"]:has-text("${ticketName}")`);
    const priceText = await ticketItem.locator('[data-testid="ticket-price"]').textContent();
    
    // Extract numeric price (assuming format like "$99.00")
    if (priceText) {
      const price = parseFloat(priceText.replace(/[^0-9.]/g, ''));
      return price;
    }
    
    return 0;
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

  async continueToOrderReview() {
    await this.continueButton.click();
  }
}