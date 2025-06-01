/**
 * Common test utility functions for Puppeteer tests
 */

const fs = require('fs').promises;
const path = require('path');

/**
 * Capture a screenshot with timestamp
 * @param {Page} page - Puppeteer page instance
 * @param {string} name - Screenshot name
 * @returns {Promise<string>} - Path to saved screenshot
 */
async function captureScreenshot(page, name) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${name}-${timestamp}.png`;
  const screenshotPath = path.join(__dirname, '../reports/screenshots', filename);
  
  // Ensure directory exists
  await fs.mkdir(path.dirname(screenshotPath), { recursive: true });
  
  await page.screenshot({
    path: screenshotPath,
    fullPage: true
  });
  
  return screenshotPath;
}

/**
 * Wait for an element and return it
 * @param {Page} page - Puppeteer page instance
 * @param {string} selector - CSS selector or data-testid
 * @param {Object} options - Wait options
 * @returns {Promise<ElementHandle>} - Element handle
 */
async function waitForElement(page, selector, options = {}) {
  const defaultOptions = {
    visible: true,
    timeout: 30000
  };
  
  const mergedOptions = { ...defaultOptions, ...options };
  
  // Check if selector is a data-testid
  if (!selector.startsWith('[') && !selector.startsWith('.') && !selector.startsWith('#')) {
    selector = `[data-testid="${selector}"]`;
  }
  
  try {
    await page.waitForSelector(selector, mergedOptions);
    return await page.$(selector);
  } catch (error) {
    // Try with self-healing if available
    if (global.withSelfHealing) {
      return await global.withSelfHealing(page, async () => {
        await page.waitForSelector(selector, mergedOptions);
        return await page.$(selector);
      }, selector);
    }
    throw error;
  }
}

/**
 * Fill an input field with value
 * @param {Page} page - Puppeteer page instance
 * @param {string} selector - CSS selector or data-testid
 * @param {string} value - Value to fill
 * @param {Object} options - Type options
 */
async function fillInput(page, selector, value, options = {}) {
  // Check if selector is a data-testid
  if (!selector.startsWith('[') && !selector.startsWith('.') && !selector.startsWith('#')) {
    selector = `[data-testid="${selector}"]`;
  }
  
  try {
    // Wait for element
    await waitForElement(page, selector);
    
    // Clear existing value
    await page.click(selector, { clickCount: 3 });
    await page.keyboard.press('Backspace');
    
    // Type new value
    await page.type(selector, value, options);
  } catch (error) {
    // Try with self-healing if available
    if (global.withSelfHealing) {
      return await global.withSelfHealing(page, async () => {
        await page.click(selector, { clickCount: 3 });
        await page.keyboard.press('Backspace');
        await page.type(selector, value, options);
      }, selector);
    }
    throw error;
  }
}

/**
 * Click an element
 * @param {Page} page - Puppeteer page instance
 * @param {string} selector - CSS selector or data-testid
 * @param {Object} options - Click options
 */
async function clickElement(page, selector, options = {}) {
  // Check if selector is a data-testid
  if (!selector.startsWith('[') && !selector.startsWith('.') && !selector.startsWith('#')) {
    selector = `[data-testid="${selector}"]`;
  }
  
  try {
    await waitForElement(page, selector);
    await page.click(selector, options);
  } catch (error) {
    // Try with self-healing if available
    if (global.withSelfHealing) {
      return await global.withSelfHealing(page, async () => {
        await page.click(selector, options);
      }, selector);
    }
    throw error;
  }
}

/**
 * Select an option from dropdown
 * @param {Page} page - Puppeteer page instance
 * @param {string} selector - CSS selector or data-testid
 * @param {string} value - Value to select
 */
async function selectOption(page, selector, value) {
  // Check if selector is a data-testid
  if (!selector.startsWith('[') && !selector.startsWith('.') && !selector.startsWith('#')) {
    selector = `[data-testid="${selector}"]`;
  }
  
  try {
    await waitForElement(page, selector);
    await page.select(selector, value);
  } catch (error) {
    // Try with self-healing if available
    if (global.withSelfHealing) {
      return await global.withSelfHealing(page, async () => {
        await page.select(selector, value);
      }, selector);
    }
    throw error;
  }
}

/**
 * Check if element exists
 * @param {Page} page - Puppeteer page instance
 * @param {string} selector - CSS selector or data-testid
 * @returns {Promise<boolean>} - True if element exists
 */
async function elementExists(page, selector) {
  // Check if selector is a data-testid
  if (!selector.startsWith('[') && !selector.startsWith('.') && !selector.startsWith('#')) {
    selector = `[data-testid="${selector}"]`;
  }
  
  try {
    const element = await page.$(selector);
    return element !== null;
  } catch {
    return false;
  }
}

/**
 * Get text content of element
 * @param {Page} page - Puppeteer page instance
 * @param {string} selector - CSS selector or data-testid
 * @returns {Promise<string>} - Text content
 */
async function getTextContent(page, selector) {
  // Check if selector is a data-testid
  if (!selector.startsWith('[') && !selector.startsWith('.') && !selector.startsWith('#')) {
    selector = `[data-testid="${selector}"]`;
  }
  
  try {
    await waitForElement(page, selector);
    return await page.$eval(selector, el => el.textContent.trim());
  } catch (error) {
    // Try with self-healing if available
    if (global.withSelfHealing) {
      return await global.withSelfHealing(page, async () => {
        return await page.$eval(selector, el => el.textContent.trim());
      }, selector);
    }
    throw error;
  }
}

/**
 * Wait for navigation
 * @param {Page} page - Puppeteer page instance
 * @param {Object} options - Navigation options
 */
async function waitForNavigation(page, options = {}) {
  const defaultOptions = {
    waitUntil: 'networkidle0',
    timeout: 30000
  };
  
  const mergedOptions = { ...defaultOptions, ...options };
  return await page.waitForNavigation(mergedOptions);
}

/**
 * Wait for a specific URL pattern
 * @param {Page} page - Puppeteer page instance
 * @param {string|RegExp} urlPattern - URL pattern to match
 * @param {Object} options - Wait options
 */
async function waitForUrl(page, urlPattern, options = {}) {
  const defaultOptions = {
    timeout: 30000
  };
  
  const mergedOptions = { ...defaultOptions, ...options };
  
  return await page.waitForFunction(
    (pattern) => {
      if (typeof pattern === 'string') {
        return window.location.href.includes(pattern);
      } else {
        return pattern.test(window.location.href);
      }
    },
    mergedOptions,
    urlPattern
  );
}

/**
 * Fill Stripe card details
 * @param {Page} page - Puppeteer page instance
 * @param {Object} cardDetails - Card details object
 */
async function fillStripeCard(page, cardDetails) {
  // Wait for Stripe iframe
  await page.waitForSelector('iframe[name*="__privateStripeFrame"]', { timeout: 10000 });
  
  const stripeFrames = await page.$$('iframe[name*="__privateStripeFrame"]');
  
  for (const frame of stripeFrames) {
    const frameName = await frame.evaluate(el => el.name);
    
    if (frameName.includes('__privateStripeFrame')) {
      const stripeFrame = await frame.contentFrame();
      
      if (frameName.includes('cardNumber')) {
        await stripeFrame.type('input[name="cardnumber"]', cardDetails.number);
      } else if (frameName.includes('cardExpiry')) {
        await stripeFrame.type('input[name="exp-date"]', cardDetails.expiry);
      } else if (frameName.includes('cardCvc')) {
        await stripeFrame.type('input[name="cvc"]', cardDetails.cvc);
      }
    }
  }
  
  // Fill cardholder name if present
  if (await elementExists(page, 'cardholderName')) {
    await fillInput(page, 'cardholderName', cardDetails.name || 'Test User');
  }
}

module.exports = {
  captureScreenshot,
  waitForElement,
  fillInput,
  clickElement,
  selectOption,
  elementExists,
  getTextContent,
  waitForNavigation,
  waitForUrl,
  fillStripeCard
};