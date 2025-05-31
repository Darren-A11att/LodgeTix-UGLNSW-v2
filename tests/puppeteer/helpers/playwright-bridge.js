/**
 * Bridge helper to reuse existing Playwright test patterns with Puppeteer
 */

const fs = require('fs').promises;
const path = require('path');

class PlaywrightBridge {
  constructor(puppeteerPage) {
    this.page = puppeteerPage;
    this.setupHelpers();
  }

  setupHelpers() {
    // Add Playwright-like methods to Puppeteer page
    this.page.getByTestId = (testId) => {
      return {
        click: async () => await this.page.click(`[data-testid="${testId}"]`),
        fill: async (value) => {
          await this.page.click(`[data-testid="${testId}"]`);
          await this.page.keyboard.down('Control');
          await this.page.keyboard.press('A');
          await this.page.keyboard.up('Control');
          await this.page.keyboard.press('Backspace');
          await this.page.type(`[data-testid="${testId}"]`, value);
        },
        isVisible: async () => {
          const element = await this.page.$(`[data-testid="${testId}"]`);
          if (!element) return false;
          return await element.isIntersectingViewport();
        },
        waitFor: async (options = {}) => {
          return await this.page.waitForSelector(`[data-testid="${testId}"]`, options);
        }
      };
    };

    this.page.getByRole = (role, options = {}) => {
      const selector = options.name 
        ? `[role="${role}"][aria-label="${options.name}"]`
        : `[role="${role}"]`;
      
      return {
        click: async () => await this.page.click(selector),
        fill: async (value) => await this.fillField(selector, value),
        isVisible: async () => {
          const element = await this.page.$(selector);
          return element !== null;
        }
      };
    };

    this.page.getByText = (text) => {
      return {
        click: async () => {
          await this.page.evaluate((text) => {
            const elements = Array.from(document.querySelectorAll('*'));
            const element = elements.find(el => 
              el.textContent && el.textContent.includes(text)
            );
            if (element) element.click();
          }, text);
        },
        isVisible: async () => {
          return await this.page.evaluate((text) => {
            const elements = Array.from(document.querySelectorAll('*'));
            return elements.some(el => 
              el.textContent && el.textContent.includes(text)
            );
          }, text);
        }
      };
    };

    this.page.getByPlaceholder = (placeholder) => {
      const selector = `[placeholder="${placeholder}"]`;
      return {
        fill: async (value) => await this.fillField(selector, value),
        click: async () => await this.page.click(selector)
      };
    };
  }

  async fillField(selector, value) {
    await this.page.click(selector);
    await this.page.keyboard.down('Control');
    await this.page.keyboard.press('A');
    await this.page.keyboard.up('Control');
    await this.page.keyboard.press('Backspace');
    await this.page.type(selector, value);
  }

  // Import existing page object patterns
  async importPageObject(pageObjectPath) {
    try {
      const content = await fs.readFile(pageObjectPath, 'utf-8');
      
      // Extract selectors and methods
      const selectorPattern = /this\.(\w+)\s*=\s*['"`]([^'"`]+)['"`]/g;
      const selectors = {};
      
      let match;
      while ((match = selectorPattern.exec(content)) !== null) {
        selectors[match[1]] = match[2];
      }
      
      return selectors;
    } catch (error) {
      console.error(`Failed to import page object: ${error.message}`);
      return {};
    }
  }

  // Convert Playwright test to Puppeteer
  async convertTest(playwrightTestPath) {
    try {
      const content = await fs.readFile(playwrightTestPath, 'utf-8');
      
      // Basic conversions
      let puppeteerTest = content
        .replace(/page\.goto\(/g, 'await page.goto(')
        .replace(/page\.click\(/g, 'await page.click(')
        .replace(/page\.fill\(/g, 'await page.type(')
        .replace(/page\.waitForSelector\(/g, 'await page.waitForSelector(')
        .replace(/expect\(page\)\.toHaveURL/g, 'expect(page.url()).toContain')
        .replace(/expect\(page\)\.toHaveTitle/g, 'expect(await page.title()).toContain');
      
      return puppeteerTest;
    } catch (error) {
      console.error(`Failed to convert test: ${error.message}`);
      return null;
    }
  }
}

// Helper function to create bridge instance
function createBridge(puppeteerPage) {
  return new PlaywrightBridge(puppeteerPage);
}

// Export for use in tests
module.exports = {
  PlaywrightBridge,
  createBridge
};