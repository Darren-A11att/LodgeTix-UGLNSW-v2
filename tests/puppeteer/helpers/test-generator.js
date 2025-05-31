const fs = require('fs').promises;
const path = require('path');

/**
 * Automated test generator for creating Puppeteer tests from existing workflows
 */
class PuppeteerTestGenerator {
  constructor(config) {
    this.config = config;
    this.projectRoot = path.resolve(__dirname, '../../../');
    this.existingTestsPath = path.join(this.projectRoot, '__tests__/e2e');
    this.outputPath = path.join(__dirname, '../specs');
  }

  /**
   * Analyze existing Playwright tests and generate Puppeteer equivalents
   */
  async generateFromExistingTests() {
    const results = {
      analyzed: 0,
      generated: 0,
      errors: []
    };

    try {
      // Scan registration tests
      const registrationTests = await this.scanDirectory(
        path.join(this.existingTestsPath, 'registration')
      );

      for (const testFile of registrationTests) {
        if (testFile.endsWith('.spec.ts')) {
          results.analyzed++;
          
          try {
            const generated = await this.convertPlaywrightTest(testFile);
            if (generated) {
              results.generated++;
              await this.saveGeneratedTest(generated);
            }
          } catch (error) {
            results.errors.push({
              file: testFile,
              error: error.message
            });
          }
        }
      }
    } catch (error) {
      console.error('Test generation error:', error);
    }

    return results;
  }

  /**
   * Convert a Playwright test to Puppeteer
   */
  async convertPlaywrightTest(testPath) {
    const content = await fs.readFile(testPath, 'utf-8');
    const testName = path.basename(testPath, '.spec.ts');
    
    // Extract test structure
    const testStructure = this.analyzeTestStructure(content);
    
    // Generate Puppeteer test
    return this.generatePuppeteerTest(testName, testStructure);
  }

  /**
   * Analyze test structure from Playwright test
   */
  analyzeTestStructure(content) {
    const structure = {
      imports: [],
      describes: [],
      tests: [],
      helpers: []
    };

    // Extract test descriptions
    const describePattern = /describe\(['"`]([^'"`]+)['"`]/g;
    let match;
    while ((match = describePattern.exec(content)) !== null) {
      structure.describes.push(match[1]);
    }

    // Extract test cases
    const testPattern = /test\(['"`]([^'"`]+)['"`]/g;
    while ((match = testPattern.exec(content)) !== null) {
      structure.tests.push(match[1]);
    }

    // Extract page interactions
    const interactions = this.extractInteractions(content);
    structure.interactions = interactions;

    return structure;
  }

  /**
   * Extract page interactions from test content
   */
  extractInteractions(content) {
    const interactions = [];
    
    const patterns = [
      { type: 'navigation', pattern: /page\.goto\(['"`]([^'"`]+)['"`]\)/g },
      { type: 'click', pattern: /page\.click\(['"`]([^'"`]+)['"`]\)/g },
      { type: 'fill', pattern: /page\.fill\(['"`]([^'"`]+)['"`],\s*['"`]([^'"`]+)['"`]\)/g },
      { type: 'testId', pattern: /getByTestId\(['"`]([^'"`]+)['"`]\)/g },
      { type: 'role', pattern: /getByRole\(['"`]([^'"`]+)['"`]/g },
      { type: 'text', pattern: /getByText\(['"`]([^'"`]+)['"`]\)/g }
    ];

    patterns.forEach(({ type, pattern }) => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        interactions.push({
          type,
          selector: match[1],
          value: match[2] || null
        });
      }
    });

    return interactions;
  }

  /**
   * Generate Puppeteer test from structure
   */
  generatePuppeteerTest(name, structure) {
    const template = `const config = require('../../config/puppeteer.config');
const { createBridge } = require('../../helpers/playwright-bridge');

describe('${structure.describes[0] || name}', () => {
  let browser;
  let page;
  let bridge;

  beforeAll(async () => {
    browser = global.__BROWSER__;
  });

  beforeEach(async () => {
    page = await browser.newPage();
    await global.setupPage(page);
    bridge = createBridge(page);
  });

  afterEach(async () => {
    if (page) {
      await page.close();
    }
  });

${this.generateTestCases(structure)}
});`;

    return {
      name: `${name}.spec.js`,
      content: template,
      category: this.categorizeTest(name)
    };
  }

  /**
   * Generate test cases from structure
   */
  generateTestCases(structure) {
    return structure.tests.map((testName, index) => {
      const interactions = structure.interactions.slice(
        index * 5, 
        (index + 1) * 5
      );

      return `  test('${testName}', async () => {
    ${this.generateInteractionCode(interactions)}
    
    // Add assertions based on test name
    ${this.generateAssertions(testName)}
  });`;
    }).join('\n\n');
  }

  /**
   * Generate interaction code for Puppeteer
   */
  generateInteractionCode(interactions) {
    return interactions.map(interaction => {
      switch (interaction.type) {
        case 'navigation':
          return `await page.goto(config.baseUrl + '${interaction.selector}');`;
        
        case 'click':
          return `await page.click('${interaction.selector}');`;
        
        case 'fill':
          return `await page.type('${interaction.selector}', '${interaction.value}');`;
        
        case 'testId':
          return `await page.clickTestId('${interaction.selector}');`;
        
        case 'role':
          return `await bridge.page.getByRole('${interaction.selector}').click();`;
        
        case 'text':
          return `await bridge.page.getByText('${interaction.selector}').click();`;
        
        default:
          return `// TODO: Convert ${interaction.type} interaction`;
      }
    }).join('\n    ');
  }

  /**
   * Generate assertions based on test name
   */
  generateAssertions(testName) {
    const assertions = [];

    if (testName.includes('navigate') || testName.includes('redirect')) {
      assertions.push(`const url = page.url();\n    expect(url).toContain('/expected-path');`);
    }

    if (testName.includes('display') || testName.includes('show')) {
      assertions.push(`const element = await page.$('[data-testid="expected-element"]');\n    expect(element).not.toBeNull();`);
    }

    if (testName.includes('submit') || testName.includes('save')) {
      assertions.push(`await page.waitForNavigation();\n    expect(page.url()).toContain('/success');`);
    }

    return assertions.join('\n    ') || `expect(true).toBe(true); // TODO: Add specific assertions`;
  }

  /**
   * Categorize test for organization
   */
  categorizeTest(name) {
    if (name.includes('smoke')) return 'smoke';
    if (name.includes('critical')) return 'critical';
    if (name.includes('visual')) return 'visual';
    if (name.includes('a11y')) return 'accessibility';
    if (name.includes('flow')) return 'e2e';
    return 'functional';
  }

  /**
   * Save generated test to appropriate directory
   */
  async saveGeneratedTest(generated) {
    const categoryPath = path.join(this.outputPath, generated.category);
    await fs.mkdir(categoryPath, { recursive: true });
    
    const filePath = path.join(categoryPath, generated.name);
    await fs.writeFile(filePath, generated.content);
    
    console.log(`Generated test: ${filePath}`);
  }

  /**
   * Scan directory for test files
   */
  async scanDirectory(dirPath) {
    try {
      const files = await fs.readdir(dirPath);
      const fullPaths = files.map(file => path.join(dirPath, file));
      return fullPaths;
    } catch (error) {
      console.error(`Error scanning directory ${dirPath}:`, error);
      return [];
    }
  }

  /**
   * Generate test for specific user workflow
   */
  async generateWorkflowTest(workflowName, steps) {
    const template = `const config = require('../../config/puppeteer.config');

describe('${workflowName} Workflow', () => {
  let browser;
  let page;

  beforeAll(async () => {
    browser = global.__BROWSER__;
  });

  beforeEach(async () => {
    page = await browser.newPage();
    await global.setupPage(page);
  });

  afterEach(async () => {
    await page.close();
  });

  test('complete ${workflowName} workflow', async () => {
    ${steps.map(step => this.generateStepCode(step)).join('\n    ')}
    
    // Verify workflow completion
    await page.waitForSelector('[data-testid="confirmation"]');
    const success = await page.$eval('[data-testid="confirmation"]', el => el.textContent);
    expect(success).toContain('Success');
  });
});`;

    return {
      name: `${workflowName.toLowerCase().replace(/\s+/g, '-')}-workflow.spec.js`,
      content: template,
      category: 'e2e'
    };
  }

  /**
   * Generate code for workflow step
   */
  generateStepCode(step) {
    const stepCode = [];
    
    stepCode.push(`// ${step.description}`);
    
    if (step.navigation) {
      stepCode.push(`await page.goto(config.baseUrl + '${step.navigation}');`);
    }
    
    if (step.actions) {
      step.actions.forEach(action => {
        stepCode.push(this.generateActionCode(action));
      });
    }
    
    if (step.validation) {
      stepCode.push(`await page.waitForSelector('${step.validation}');`);
    }
    
    return stepCode.join('\n    ');
  }

  /**
   * Generate code for specific action
   */
  generateActionCode(action) {
    switch (action.type) {
      case 'click':
        return `await page.click('${action.selector}');`;
      
      case 'fill':
        return `await page.type('${action.selector}', '${action.value}');`;
      
      case 'select':
        return `await page.select('${action.selector}', '${action.value}');`;
      
      case 'wait':
        return `await page.waitForTimeout(${action.duration || 1000});`;
      
      default:
        return `// TODO: Implement ${action.type} action`;
    }
  }
}

// Export for use
module.exports = PuppeteerTestGenerator;