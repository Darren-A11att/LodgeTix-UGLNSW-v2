const fs = require('fs').promises;
const path = require('path');

/**
 * Self-healing framework for Puppeteer tests
 * Automatically recovers from selector changes and UI updates
 */
class SelfHealingFramework {
  constructor(page, config = {}) {
    this.page = page;
    this.config = {
      maxRetries: config.maxRetries || 3,
      screenshotOnFailure: config.screenshotOnFailure !== false,
      logLevel: config.logLevel || 'info',
      selectorCache: new Map(),
      healingStrategies: config.strategies || [
        'id',
        'data-testid', 
        'css',
        'xpath',
        'text',
        'visual'
      ],
      ...config
    };
    
    this.healingHistory = [];
    this.selectorMappings = new Map();
    this.initializeStrategies();
  }

  /**
   * Initialize healing strategies
   */
  initializeStrategies() {
    this.strategies = {
      id: this.healById.bind(this),
      'data-testid': this.healByDataTestId.bind(this),
      css: this.healByCss.bind(this),
      xpath: this.healByXPath.bind(this),
      text: this.healByText.bind(this),
      visual: this.healByVisual.bind(this)
    };
  }

  /**
   * Main healing method - wraps any selector-based action
   */
  async heal(action, selector, options = {}) {
    let lastError;
    let healedSelector = selector;
    
    // Try original selector first
    try {
      return await action(selector);
    } catch (error) {
      lastError = error;
      this.log('warn', `Original selector failed: ${selector}`);
      
      if (this.config.screenshotOnFailure) {
        await this.takeDebugScreenshot('selector-failed');
      }
    }

    // Try healing strategies
    for (let attempt = 0; attempt < this.config.maxRetries; attempt++) {
      for (const strategyName of this.config.healingStrategies) {
        const strategy = this.strategies[strategyName];
        if (!strategy) continue;

        try {
          healedSelector = await strategy(selector, options);
          if (healedSelector && healedSelector !== selector) {
            this.log('info', `Healed selector using ${strategyName}: ${selector} -> ${healedSelector}`);
            
            // Try healed selector
            const result = await action(healedSelector);
            
            // Success! Record the healing
            this.recordHealing(selector, healedSelector, strategyName);
            
            return result;
          }
        } catch (error) {
          // Strategy failed, try next
          continue;
        }
      }
      
      // Wait before next retry
      if (attempt < this.config.maxRetries - 1) {
        await this.page.waitForTimeout(1000);
      }
    }

    // All strategies failed
    this.log('error', `Failed to heal selector after ${this.config.maxRetries} attempts: ${selector}`);
    throw lastError;
  }

  /**
   * Heal by finding element with same ID
   */
  async healById(selector, options) {
    // Extract ID from selector if possible
    const idMatch = selector.match(/#([\w-]+)/);
    if (!idMatch) return null;

    const id = idMatch[1];
    const newSelector = `#${id}`;
    
    // Check if element exists
    const element = await this.page.$(newSelector);
    return element ? newSelector : null;
  }

  /**
   * Heal by finding element with similar data-testid
   */
  async healByDataTestId(selector, options) {
    // Extract data-testid from selector
    const testIdMatch = selector.match(/data-testid=["']([^"']+)["']/);
    if (!testIdMatch) return null;

    const testId = testIdMatch[1];
    
    // Try exact match first
    let newSelector = `[data-testid="${testId}"]`;
    let element = await this.page.$(newSelector);
    if (element) return newSelector;

    // Try partial matches
    const partialMatches = await this.page.$$eval('[data-testid]', (elements, testId) => {
      return elements
        .filter(el => el.getAttribute('data-testid').includes(testId))
        .map(el => el.getAttribute('data-testid'));
    }, testId);

    if (partialMatches.length === 1) {
      return `[data-testid="${partialMatches[0]}"]`;
    }

    return null;
  }

  /**
   * Heal by analyzing CSS structure
   */
  async healByCss(selector, options) {
    // Try to find similar elements by class or structure
    const classMatch = selector.match(/\.([\w-]+)/g);
    if (!classMatch) return null;

    // Try each class individually
    for (const className of classMatch) {
      const element = await this.page.$(className);
      if (element) {
        // Verify it's the right element by checking attributes
        const attributes = await element.evaluate(el => {
          return {
            tag: el.tagName.toLowerCase(),
            type: el.type,
            role: el.getAttribute('role')
          };
        });

        // If attributes match expected, use this selector
        if (this.matchesExpectedElement(selector, attributes)) {
          return className;
        }
      }
    }

    return null;
  }

  /**
   * Heal by XPath analysis
   */
  async healByXPath(selector, options) {
    // Convert CSS to XPath and try variations
    const xpathVariations = this.generateXPathVariations(selector);
    
    for (const xpath of xpathVariations) {
      try {
        const elements = await this.page.$x(xpath);
        if (elements.length === 1) {
          return `xpath=${xpath}`;
        }
      } catch (error) {
        continue;
      }
    }

    return null;
  }

  /**
   * Heal by text content
   */
  async healByText(selector, options) {
    if (!options.expectedText) return null;

    // Search for elements containing the expected text
    const elements = await this.page.$$eval('*', (elements, text) => {
      return elements
        .filter(el => el.textContent && el.textContent.includes(text))
        .map(el => {
          // Generate a unique selector for this element
          const tag = el.tagName.toLowerCase();
          const id = el.id ? `#${el.id}` : '';
          const classes = el.className ? `.${el.className.split(' ').join('.')}` : '';
          return `${tag}${id}${classes}`;
        });
    }, options.expectedText);

    if (elements.length === 1) {
      return elements[0];
    }

    return null;
  }

  /**
   * Heal by visual similarity (placeholder for ML-based healing)
   */
  async healByVisual(selector, options) {
    // This would integrate with visual regression tools
    // For now, return null
    return null;
  }

  /**
   * Generate XPath variations for a selector
   */
  generateXPathVariations(selector) {
    const variations = [];
    
    // Basic tag matching
    const tagMatch = selector.match(/^(\w+)/);
    if (tagMatch) {
      variations.push(`//${tagMatch[1]}`);
    }

    // Class-based XPath
    const classMatch = selector.match(/\.([\w-]+)/);
    if (classMatch) {
      variations.push(`//*[contains(@class, "${classMatch[1]}")]`);
    }

    // ID-based XPath
    const idMatch = selector.match(/#([\w-]+)/);
    if (idMatch) {
      variations.push(`//*[@id="${idMatch[1]}"]`);
    }

    return variations;
  }

  /**
   * Check if element attributes match expected
   */
  matchesExpectedElement(originalSelector, attributes) {
    // Simple heuristic matching
    const expectedTag = originalSelector.match(/^(\w+)/);
    if (expectedTag && expectedTag[1] !== attributes.tag) {
      return false;
    }

    return true;
  }

  /**
   * Record successful healing for future use
   */
  recordHealing(originalSelector, healedSelector, strategy) {
    this.healingHistory.push({
      timestamp: new Date(),
      original: originalSelector,
      healed: healedSelector,
      strategy: strategy
    });

    // Update selector mappings
    this.selectorMappings.set(originalSelector, healedSelector);

    // Save to file for persistence
    this.saveHealingHistory();
  }

  /**
   * Save healing history to file
   */
  async saveHealingHistory() {
    const historyPath = path.join(__dirname, '../reports/healing-history.json');
    
    try {
      await fs.mkdir(path.dirname(historyPath), { recursive: true });
      await fs.writeFile(
        historyPath, 
        JSON.stringify(this.healingHistory, null, 2)
      );
    } catch (error) {
      this.log('error', `Failed to save healing history: ${error.message}`);
    }
  }

  /**
   * Load previous healing mappings
   */
  async loadHealingHistory() {
    const historyPath = path.join(__dirname, '../reports/healing-history.json');
    
    try {
      const data = await fs.readFile(historyPath, 'utf-8');
      const history = JSON.parse(data);
      
      // Rebuild selector mappings
      history.forEach(entry => {
        this.selectorMappings.set(entry.original, entry.healed);
      });
      
      this.healingHistory = history;
    } catch (error) {
      // No history file yet
    }
  }

  /**
   * Enhanced click with self-healing
   */
  async click(selector, options = {}) {
    return this.heal(async (sel) => {
      await this.page.waitForSelector(sel, { visible: true, ...options });
      return this.page.click(sel, options);
    }, selector, options);
  }

  /**
   * Enhanced type with self-healing
   */
  async type(selector, text, options = {}) {
    return this.heal(async (sel) => {
      await this.page.waitForSelector(sel, { visible: true, ...options });
      await this.page.click(sel);
      await this.page.keyboard.down('Control');
      await this.page.keyboard.press('A');
      await this.page.keyboard.up('Control');
      await this.page.keyboard.press('Backspace');
      return this.page.type(sel, text, options);
    }, selector, options);
  }

  /**
   * Enhanced waitForSelector with self-healing
   */
  async waitForSelector(selector, options = {}) {
    return this.heal(async (sel) => {
      return this.page.waitForSelector(sel, options);
    }, selector, options);
  }

  /**
   * Take debug screenshot
   */
  async takeDebugScreenshot(name) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `self-healing-${name}-${timestamp}.png`;
    const filepath = path.join(__dirname, '../reports/debug', filename);
    
    try {
      await fs.mkdir(path.dirname(filepath), { recursive: true });
      await this.page.screenshot({ path: filepath, fullPage: true });
    } catch (error) {
      console.error('Failed to take debug screenshot:', error);
    }
  }

  /**
   * Logging utility
   */
  log(level, message) {
    const levels = ['error', 'warn', 'info', 'debug'];
    const currentLevel = levels.indexOf(this.config.logLevel);
    const messageLevel = levels.indexOf(level);
    
    if (messageLevel <= currentLevel) {
      console.log(`[SelfHealing] [${level.toUpperCase()}] ${message}`);
    }
  }

  /**
   * Generate healing report
   */
  async generateReport() {
    const report = {
      totalHealings: this.healingHistory.length,
      byStrategy: {},
      mostHealed: {},
      successRate: 0
    };

    // Analyze healing history
    this.healingHistory.forEach(entry => {
      // Count by strategy
      report.byStrategy[entry.strategy] = (report.byStrategy[entry.strategy] || 0) + 1;
      
      // Count most healed selectors
      report.mostHealed[entry.original] = (report.mostHealed[entry.original] || 0) + 1;
    });

    // Sort most healed
    report.mostHealed = Object.entries(report.mostHealed)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .reduce((obj, [key, val]) => ({ ...obj, [key]: val }), {});

    return report;
  }
}

// Export for use in tests
module.exports = SelfHealingFramework;