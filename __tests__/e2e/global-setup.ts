import { chromium } from '@playwright/test';

async function globalSetup() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Set up Stripe test mode
  await page.addInitScript(() => {
    window.Stripe = function(key) {
      return {
        elements: () => ({
          create: () => ({
            mount: () => {},
            on: () => {},
            unmount: () => {},
          }),
        }),
        confirmCardPayment: async () => ({
          paymentIntent: { status: 'succeeded' },
        }),
        createPaymentMethod: async () => ({
          paymentMethod: { id: 'test_payment_method' },
        }),
      };
    };
  });

  await browser.close();
}

export default globalSetup;