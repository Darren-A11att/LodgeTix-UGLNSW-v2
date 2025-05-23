import { Page, Locator } from '@playwright/test';

export class OrderReviewPage {
  readonly page: Page;
  readonly orderSummary: Locator;
  readonly totalAmount: Locator;
  readonly attendeeSummary: Locator;
  readonly ticketSummary: Locator;
  readonly discountCodeInput: Locator;
  readonly applyDiscountButton: Locator;
  readonly discountAmount: Locator;
  readonly continueButton: Locator;
  readonly backButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.orderSummary = page.locator('[data-testid="order-summary"]');
    this.totalAmount = page.locator('[data-testid="total-amount"]');
    this.attendeeSummary = page.locator('[data-testid="attendee-summary"]');
    this.ticketSummary = page.locator('[data-testid="ticket-summary"]');
    this.discountCodeInput = page.getByPlaceholder(/Enter discount code/i);
    this.applyDiscountButton = page.getByRole('button', { name: /Apply/i });
    this.discountAmount = page.locator('[data-testid="discount-amount"]');
    this.continueButton = page.getByRole('button', { name: /Continue to Payment/i });
    this.backButton = page.getByRole('button', { name: /Back/i });
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

  async getTicketCount() {
    const ticketSummaryText = await this.ticketSummary.textContent();
    if (!ticketSummaryText) return 0;
    
    // Count occurrences of "x1", "x2", etc. to get total ticket count
    const matches = ticketSummaryText.match(/x(\d+)/g);
    if (!matches) return 0;
    
    return matches.reduce((sum, match) => {
      const count = parseInt(match.substring(1), 10);
      return sum + count;
    }, 0);
  }

  async applyDiscountCode(code: string) {
    await this.discountCodeInput.fill(code);
    await this.applyDiscountButton.click();
    
    // Wait for discount to be applied
    await this.page.waitForResponse(response => 
      response.url().includes('discount') && response.status() === 200
    );
  }

  async getDiscountAmount() {
    if (await this.discountAmount.isVisible()) {
      const discountText = await this.discountAmount.textContent();
      
      // Extract numeric discount (assuming format like "-$10.00")
      if (discountText) {
        const discount = parseFloat(discountText.replace(/[^0-9.]/g, ''));
        return discount;
      }
    }
    
    return 0;
  }

  async continueToPayment() {
    await this.continueButton.click();
  }

  async goBack() {
    await this.backButton.click();
  }
}