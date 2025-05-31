const fs = require('fs').promises;
const path = require('path');

/**
 * Maps existing test selectors from Playwright to Puppeteer format
 * and provides healing recommendations
 */
class SelectorMapper {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '../../../');
    this.playwrightTestPath = path.join(this.projectRoot, '__tests__/e2e');
    this.mappings = new Map();
    this.recommendations = [];
  }

  /**
   * Scan and map all existing selectors
   */
  async mapExistingSelectors() {
    console.log('Scanning existing Playwright tests for selectors...');
    
    // Scan page objects
    await this.scanPageObjects();
    
    // Scan test files
    await this.scanTestFiles();
    
    // Generate recommendations
    this.generateRecommendations();
    
    // Save mappings
    await this.saveMappings();
    
    return {
      totalSelectors: this.mappings.size,
      recommendations: this.recommendations.length,
      mappings: Array.from(this.mappings.entries())
    };
  }

  /**
   * Scan page object files
   */
  async scanPageObjects() {
    const pageObjectsPath = path.join(this.playwrightTestPath, 'page-objects');
    
    try {
      const files = await fs.readdir(pageObjectsPath);
      
      for (const file of files) {
        if (file.endsWith('.ts')) {
          const filePath = path.join(pageObjectsPath, file);
          const content = await fs.readFile(filePath, 'utf-8');
          
          this.extractSelectorsFromContent(content, file);
        }
      }
    } catch (error) {
      console.warn('Could not scan page objects:', error.message);
    }
  }

  /**
   * Scan test specification files
   */
  async scanTestFiles() {
    const testDirs = ['registration', 'smoke.spec.ts'];
    
    for (const dir of testDirs) {
      const testPath = path.join(this.playwrightTestPath, dir);
      
      try {
        const stats = await fs.stat(testPath);
        
        if (stats.isDirectory()) {
          const files = await fs.readdir(testPath);
          for (const file of files) {
            if (file.endsWith('.spec.ts')) {
              const filePath = path.join(testPath, file);
              const content = await fs.readFile(filePath, 'utf-8');
              this.extractSelectorsFromContent(content, file);
            }
          }
        } else if (stats.isFile()) {
          const content = await fs.readFile(testPath, 'utf-8');
          this.extractSelectorsFromContent(content, dir);
        }
      } catch (error) {
        console.warn(`Could not scan ${testPath}:`, error.message);
      }
    }
  }

  /**
   * Extract selectors from file content
   */
  extractSelectorsFromContent(content, fileName) {
    const patterns = [
      // Playwright patterns
      { pattern: /getByTestId\(['"`]([^'"`]+)['"`]\)/g, type: 'data-testid' },
      { pattern: /getByRole\(['"`]([^'"`]+)['"`]/g, type: 'role' },
      { pattern: /getByText\(['"`]([^'"`]+)['"`]\)/g, type: 'text' },
      { pattern: /getByPlaceholder\(['"`]([^'"`]+)['"`]\)/g, type: 'placeholder' },
      { pattern: /locator\(['"`]([^'"`]+)['"`]\)/g, type: 'css' },
      { pattern: /\$\(['"`]([^'"`]+)['"`]\)/g, type: 'css' },
      
      // Direct selectors
      { pattern: /data-testid=["']([^"']+)["']/g, type: 'data-testid-attr' },
      { pattern: /\.click\(['"`]([^'"`]+)['"`]\)/g, type: 'css' },
      { pattern: /\.fill\(['"`]([^'"`]+)['"`]\)/g, type: 'css' },
      { pattern: /waitForSelector\(['"`]([^'"`]+)['"`]\)/g, type: 'css' }
    ];

    patterns.forEach(({ pattern, type }) => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const selector = match[1];
        const puppeteerSelector = this.convertToPuppeteer(selector, type);
        
        this.mappings.set(selector, {
          original: selector,
          type: type,
          puppeteer: puppeteerSelector,
          source: fileName,
          isModern: this.isModernSelector(selector, type),
          needsHealing: this.needsHealing(selector, type)
        });
      }
    });
  }

  /**
   * Convert Playwright selector to Puppeteer format
   */
  convertToPuppeteer(selector, type) {
    switch (type) {
      case 'data-testid':
        return `[data-testid="${selector}"]`;
      
      case 'role':
        return `[role="${selector}"]`;
      
      case 'text':
        // Puppeteer doesn't have direct text selector, use XPath
        return `xpath=//*[contains(text(), "${selector}")]`;
      
      case 'placeholder':
        return `[placeholder="${selector}"]`;
      
      case 'data-testid-attr':
        return `[data-testid="${selector}"]`;
      
      case 'css':
      default:
        // Already in CSS format
        return selector;
    }
  }

  /**
   * Check if selector follows modern best practices
   */
  isModernSelector(selector, type) {
    // Modern selectors use data-testid or specific attributes
    const modernTypes = ['data-testid', 'data-testid-attr', 'role'];
    if (modernTypes.includes(type)) return true;
    
    // Check for problematic patterns
    const problematicPatterns = [
      /^\./, // Class selectors
      /^\#/, // ID selectors (unless specific)
      /\s/, // Descendant selectors
      />/, // Child selectors
      /nth-child/, // Position-based selectors
    ];
    
    return !problematicPatterns.some(pattern => pattern.test(selector));
  }

  /**
   * Determine if selector needs healing/modernization
   */
  needsHealing(selector, type) {
    // Text selectors are fragile
    if (type === 'text') return true;
    
    // Generic class/tag selectors need improvement
    if (/^(div|span|button|input)$/.test(selector)) return true;
    if (/^\.(btn|button|link)$/.test(selector)) return true;
    
    // Complex selectors are fragile
    if (selector.split(' ').length > 2) return true;
    
    return false;
  }

  /**
   * Generate modernization recommendations
   */
  generateRecommendations() {
    this.mappings.forEach((mapping, selector) => {
      if (mapping.needsHealing || !mapping.isModern) {
        this.recommendations.push({
          selector: selector,
          current: mapping.puppeteer,
          recommended: this.generateRecommendedSelector(mapping),
          reason: this.getRecommendationReason(mapping),
          source: mapping.source,
          priority: this.calculatePriority(mapping)
        });
      }
    });
    
    // Sort by priority
    this.recommendations.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Generate recommended modern selector
   */
  generateRecommendedSelector(mapping) {
    const { original, type } = mapping;
    
    // For text selectors, recommend data-testid
    if (type === 'text') {
      const testId = original.toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');
      return `[data-testid="${testId}"]`;
    }
    
    // For generic selectors, add data-testid
    if (/^(button|input|div|span)/.test(original)) {
      return `[data-testid="${original}-element"]`;
    }
    
    // For class selectors, recommend data-testid
    if (original.startsWith('.')) {
      const testId = original.substring(1);
      return `[data-testid="${testId}"]`;
    }
    
    return mapping.puppeteer;
  }

  /**
   * Get reason for recommendation
   */
  getRecommendationReason(mapping) {
    const { type, original } = mapping;
    
    if (type === 'text') {
      return 'Text selectors are fragile and break with content changes';
    }
    
    if (!mapping.isModern) {
      return 'Legacy selector pattern - modernize for better stability';
    }
    
    if (original.includes(' ')) {
      return 'Complex selector with multiple parts - simplify for reliability';
    }
    
    if (original.startsWith('.')) {
      return 'Class-based selector - use data-testid for test stability';
    }
    
    return 'Selector could be more specific and stable';
  }

  /**
   * Calculate priority for fixing selector
   */
  calculatePriority(mapping) {
    let priority = 0;
    
    // Text selectors are highest priority
    if (mapping.type === 'text') priority += 10;
    
    // Complex selectors
    if (mapping.original.includes(' ')) priority += 5;
    
    // Class selectors
    if (mapping.original.startsWith('.')) priority += 3;
    
    // Generic tag selectors
    if (/^(div|span|button|input)$/.test(mapping.original)) priority += 7;
    
    return priority;
  }

  /**
   * Save mappings to file
   */
  async saveMappings() {
    const outputPath = path.join(__dirname, '../reports/selector-mappings.json');
    
    const data = {
      timestamp: new Date().toISOString(),
      summary: {
        total: this.mappings.size,
        modern: Array.from(this.mappings.values()).filter(m => m.isModern).length,
        needsHealing: Array.from(this.mappings.values()).filter(m => m.needsHealing).length
      },
      mappings: Array.from(this.mappings.entries()).map(([key, value]) => ({
        ...value,
        key
      })),
      recommendations: this.recommendations
    };
    
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, JSON.stringify(data, null, 2));
    
    console.log(`Selector mappings saved to: ${outputPath}`);
  }

  /**
   * Generate migration script
   */
  async generateMigrationScript() {
    const script = `#!/usr/bin/env node
/**
 * Auto-generated selector migration script
 * Updates existing selectors to modern patterns
 */

const fs = require('fs');
const path = require('path');

const migrations = ${JSON.stringify(this.recommendations, null, 2)};

// Apply migrations to codebase
migrations.forEach(migration => {
  console.log(\`Updating: \${migration.selector} -> \${migration.recommended}\`);
  // Implementation would update source files
});

console.log('Selector migration complete!');
`;
    
    const scriptPath = path.join(__dirname, '../reports/migrate-selectors.js');
    await fs.writeFile(scriptPath, script);
    
    console.log(`Migration script saved to: ${scriptPath}`);
  }
}

// Export for use
module.exports = SelectorMapper;