/**
 * Playwright to Puppeteer conversion helpers
 * Provides utilities for converting Playwright tests to Puppeteer with self-healing
 */

const { selfHealingFindElement } = require('./self-healing');

class PlaywrightToPuppeteerHelper {
  constructor(page) {
    this.page = page;
  }

  /**
   * Convert Playwright's getByTestId to Puppeteer selector
   */
  async getByTestId(testId) {
    const selector = `[data-testid="${testId}"]`;
    return await selfHealingFindElement(this.page, selector, {
      fallbacks: [
        `[data-test-id="${testId}"]`,
        `[data-test="${testId}"]`,
        `[testid="${testId}"]`,
        `#${testId}`
      ]
    });
  }

  /**
   * Convert Playwright's getByRole to Puppeteer selector
   */
  async getByRole(role, options = {}) {
    let selector = '';
    
    switch (role) {
      case 'button':
        selector = options.name 
          ? `button:has-text("${options.name}"), [role="button"]:has-text("${options.name}")`
          : 'button, [role="button"]';
        break;
      case 'link':
        selector = options.name
          ? `a:has-text("${options.name}"), [role="link"]:has-text("${options.name}")`
          : 'a, [role="link"]';
        break;
      case 'textbox':
        selector = 'input[type="text"], input[type="email"], input[type="password"], textarea';
        break;
      case 'checkbox':
        selector = 'input[type="checkbox"]';
        break;
      case 'radio':
        selector = 'input[type="radio"]';
        break;
      case 'combobox':
        selector = 'select, [role="combobox"]';
        break;
      case 'heading':
        const level = options.level || '';
        selector = level ? `h${level}, [role="heading"][aria-level="${level}"]` : 'h1, h2, h3, h4, h5, h6, [role="heading"]';
        break;
      default:
        selector = `[role="${role}"]`;
    }

    if (options.name && !['button', 'link'].includes(role)) {
      // Use XPath for text matching
      const elements = await this.page.$x(`//*[contains(text(), "${options.name}")]`);
      return elements[0];
    }

    return await selfHealingFindElement(this.page, selector);
  }

  /**
   * Convert Playwright's getByText to Puppeteer
   */
  async getByText(text, options = {}) {
    const exact = options.exact || false;
    let elements;

    if (exact) {
      // Exact text match
      elements = await this.page.$x(`//*[text()="${text}"]`);
    } else {
      // Contains text
      elements = await this.page.$x(`//*[contains(text(), "${text}")]`);
    }

    return elements[0] || null;
  }

  /**
   * Convert Playwright's getByLabel to Puppeteer
   */
  async getByLabel(labelText) {
    // First try to find the label
    const label = await this.getByText(labelText);
    if (label) {
      // Get the 'for' attribute
      const forAttr = await label.evaluate(el => el.getAttribute('for'));
      if (forAttr) {
        return await this.page.$(`#${forAttr}`);
      }
      
      // Check if input is nested within label
      const input = await label.$('input, textarea, select');
      if (input) return input;
    }

    // Fallback to aria-label
    return await selfHealingFindElement(this.page, `[aria-label="${labelText}"]`);
  }

  /**
   * Convert Playwright's getByPlaceholder to Puppeteer
   */
  async getByPlaceholder(placeholder) {
    return await selfHealingFindElement(this.page, `[placeholder="${placeholder}"]`);
  }

  /**
   * Fill input with value (Playwright's fill)
   */
  async fill(selector, value) {
    const element = typeof selector === 'string' 
      ? await selfHealingFindElement(this.page, selector)
      : selector;
      
    if (!element) throw new Error(`Element not found: ${selector}`);
    
    // Clear existing value
    await element.click({ clickCount: 3 });
    await element.press('Backspace');
    
    // Type new value
    await element.type(value);
  }

  /**
   * Click element (with retry logic)
   */
  async click(selector) {
    const element = typeof selector === 'string'
      ? await selfHealingFindElement(this.page, selector)
      : selector;
      
    if (!element) throw new Error(`Element not found: ${selector}`);
    
    await element.click();
  }

  /**
   * Check/uncheck checkbox
   */
  async check(selector) {
    const element = typeof selector === 'string'
      ? await selfHealingFindElement(this.page, selector)
      : selector;
      
    if (!element) throw new Error(`Element not found: ${selector}`);
    
    const isChecked = await element.evaluate(el => el.checked);
    if (!isChecked) {
      await element.click();
    }
  }

  /**
   * Select option from dropdown
   */
  async selectOption(selector, value) {
    const element = typeof selector === 'string'
      ? await selfHealingFindElement(this.page, selector)
      : selector;
      
    if (!element) throw new Error(`Element not found: ${selector}`);
    
    await element.select(value);
  }

  /**
   * Wait for URL to contain specific text
   */
  async waitForURL(urlPart) {
    await this.page.waitForFunction(
      (part) => window.location.href.includes(part),
      {},
      urlPart
    );
  }

  /**
   * Take screenshot with consistent naming
   */
  async screenshot(options = {}) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const defaultPath = `tests/puppeteer/screenshots/${timestamp}.png`;
    
    return await this.page.screenshot({
      path: defaultPath,
      fullPage: false,
      ...options
    });
  }

  /**
   * Wait for element to be visible
   */
  async waitForSelector(selector, options = {}) {
    return await this.page.waitForSelector(selector, {
      visible: true,
      timeout: 30000,
      ...options
    });
  }

  /**
   * Press key
   */
  async press(selector, key) {
    const element = typeof selector === 'string'
      ? await selfHealingFindElement(this.page, selector)
      : selector;
      
    if (!element) throw new Error(`Element not found: ${selector}`);
    
    await element.press(key);
  }

  /**
   * Get inner text of element
   */
  async innerText(selector) {
    const element = typeof selector === 'string'
      ? await selfHealingFindElement(this.page, selector)
      : selector;
      
    if (!element) throw new Error(`Element not found: ${selector}`);
    
    return await element.evaluate(el => el.textContent?.trim() || '');
  }

  /**
   * Check if element is visible
   */
  async isVisible(selector) {
    try {
      const element = typeof selector === 'string'
        ? await selfHealingFindElement(this.page, selector)
        : selector;
        
      if (!element) return false;
      
      return await element.evaluate(el => {
        const style = window.getComputedStyle(el);
        return style.display !== 'none' && 
               style.visibility !== 'hidden' && 
               style.opacity !== '0';
      });
    } catch {
      return false;
    }
  }
}

/**
 * Create page helper with Playwright-like API
 */
function createPageHelper(page) {
  const helper = new PlaywrightToPuppeteerHelper(page);
  
  // Add methods directly to page object for easier migration
  page.getByTestId = (testId) => helper.getByTestId(testId);
  page.getByRole = (role, options) => helper.getByRole(role, options);
  page.getByText = (text, options) => helper.getByText(text, options);
  page.getByLabel = (label) => helper.getByLabel(label);
  page.getByPlaceholder = (placeholder) => helper.getByPlaceholder(placeholder);
  page.fill = (selector, value) => helper.fill(selector, value);
  page.check = (selector) => helper.check(selector);
  page.selectOption = (selector, value) => helper.selectOption(selector, value);
  page.waitForURL = (urlPart) => helper.waitForURL(urlPart);
  page.press = (selector, key) => helper.press(selector, key);
  page.innerText = (selector) => helper.innerText(selector);
  page.isVisible = (selector) => helper.isVisible(selector);
  
  // Keep original methods available
  page._screenshot = page.screenshot;
  page.screenshot = (options) => helper.screenshot(options);
  
  return page;
}

module.exports = {
  PlaywrightToPuppeteerHelper,
  createPageHelper
};