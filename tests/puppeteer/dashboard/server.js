const express = require('express');
const path = require('path');
const fs = require('fs').promises;

/**
 * Integration Dashboard for monitoring Puppeteer + Playwright tests
 */
class IntegrationDashboard {
  constructor(port = 3001) {
    this.app = express();
    this.port = port;
    this.testResults = {
      playwright: {},
      puppeteer: {},
      combined: {}
    };
    
    this.setupMiddleware();
    this.setupRoutes();
  }

  setupMiddleware() {
    this.app.use(express.json());
    this.app.use(express.static(path.join(__dirname, 'public')));
    
    // Enable CORS for development
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Headers', 'Content-Type');
      next();
    });
  }

  setupRoutes() {
    // Dashboard home
    this.app.get('/', (req, res) => {
      res.sendFile(path.join(__dirname, 'public', 'index.html'));
    });

    // API endpoints
    this.app.get('/api/status', async (req, res) => {
      const status = await this.getIntegrationStatus();
      res.json(status);
    });

    this.app.get('/api/test-results', async (req, res) => {
      const results = await this.getTestResults();
      res.json(results);
    });

    this.app.get('/api/coverage', async (req, res) => {
      const coverage = await this.getCoverageComparison();
      res.json(coverage);
    });

    this.app.get('/api/healing-report', async (req, res) => {
      const report = await this.getHealingReport();
      res.json(report);
    });

    this.app.get('/api/performance', async (req, res) => {
      const performance = await this.getPerformanceMetrics();
      res.json(performance);
    });

    this.app.get('/api/recommendations', async (req, res) => {
      const recommendations = await this.getRecommendations();
      res.json(recommendations);
    });
  }

  async getIntegrationStatus() {
    return {
      playwright: {
        installed: await this.checkPlaywrightInstalled(),
        tests: await this.countTests('__tests__/e2e'),
        lastRun: await this.getLastRunTime('playwright'),
        status: 'active'
      },
      puppeteer: {
        installed: await this.checkPuppeteerInstalled(),
        tests: await this.countTests('tests/puppeteer/specs'),
        lastRun: await this.getLastRunTime('puppeteer'),
        status: 'active'
      },
      integration: {
        phase: 'Phase 6: Monitoring',
        progress: 85,
        blockers: [],
        nextSteps: ['Complete team training', 'Production rollout']
      }
    };
  }

  async getTestResults() {
    const playwrightResults = await this.loadTestResults('playwright');
    const puppeteerResults = await this.loadTestResults('puppeteer');
    
    return {
      playwright: playwrightResults,
      puppeteer: puppeteerResults,
      summary: {
        totalTests: playwrightResults.total + puppeteerResults.total,
        passing: playwrightResults.passing + puppeteerResults.passing,
        failing: playwrightResults.failing + puppeteerResults.failing,
        skipped: playwrightResults.skipped + puppeteerResults.skipped,
        duration: playwrightResults.duration + puppeteerResults.duration
      }
    };
  }

  async getCoverageComparison() {
    // Mock data - would connect to actual coverage tools
    return {
      before: {
        lines: 68,
        branches: 52,
        functions: 71,
        statements: 67
      },
      after: {
        lines: 82,
        branches: 71,
        functions: 85,
        statements: 81
      },
      improvement: {
        lines: 14,
        branches: 19,
        functions: 14,
        statements: 14
      },
      uncoveredPaths: [
        'app/api/stripe/webhook',
        'components/register/payment/3DSecure',
        'lib/error-handling'
      ]
    };
  }

  async getHealingReport() {
    try {
      const reportPath = path.join(__dirname, '../reports/healing-history.json');
      const data = await fs.readFile(reportPath, 'utf-8');
      const history = JSON.parse(data);
      
      // Analyze healing patterns
      const byStrategy = {};
      const bySelector = {};
      
      history.forEach(entry => {
        byStrategy[entry.strategy] = (byStrategy[entry.strategy] || 0) + 1;
        bySelector[entry.original] = (bySelector[entry.original] || 0) + 1;
      });
      
      return {
        totalHealings: history.length,
        byStrategy,
        mostHealed: Object.entries(bySelector)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 10),
        recentHealings: history.slice(-10).reverse(),
        recommendations: this.generateHealingRecommendations(bySelector)
      };
    } catch (error) {
      return {
        totalHealings: 0,
        byStrategy: {},
        mostHealed: [],
        recentHealings: [],
        recommendations: []
      };
    }
  }

  async getPerformanceMetrics() {
    return {
      executionTime: {
        playwright: {
          average: 45.2,
          min: 32.1,
          max: 78.5,
          trend: 'stable'
        },
        puppeteer: {
          average: 42.8,
          min: 28.4,
          max: 65.2,
          trend: 'improving'
        }
      },
      resourceUsage: {
        cpu: {
          playwright: 45,
          puppeteer: 38
        },
        memory: {
          playwright: 512,
          puppeteer: 420
        }
      },
      parallelization: {
        optimal: 4,
        current: 2,
        recommendation: 'Increase parallel workers to 4'
      }
    };
  }

  async getRecommendations() {
    return [
      {
        priority: 'high',
        category: 'selectors',
        title: 'Modernize Legacy Selectors',
        description: '45 selectors using class names should be converted to data-testid',
        impact: 'Reduce test failures by 30%',
        effort: '2 hours'
      },
      {
        priority: 'medium',
        category: 'performance',
        title: 'Enable Test Parallelization',
        description: 'Run Playwright and Puppeteer tests in parallel',
        impact: 'Reduce CI time by 40%',
        effort: '1 hour'
      },
      {
        priority: 'medium',
        category: 'coverage',
        title: 'Add Payment Webhook Tests',
        description: 'Critical payment flow lacks E2E coverage',
        impact: 'Prevent payment processing bugs',
        effort: '4 hours'
      },
      {
        priority: 'low',
        category: 'maintenance',
        title: 'Consolidate Test Utilities',
        description: 'Share common utilities between Playwright and Puppeteer',
        impact: 'Reduce code duplication',
        effort: '3 hours'
      }
    ];
  }

  // Helper methods
  async checkPlaywrightInstalled() {
    try {
      await fs.access(path.join(this.projectRoot, 'node_modules/@playwright/test'));
      return true;
    } catch {
      return false;
    }
  }

  async checkPuppeteerInstalled() {
    try {
      await fs.access(path.join(this.projectRoot, 'tests/puppeteer/node_modules/puppeteer'));
      return true;
    } catch {
      return false;
    }
  }

  async countTests(directory) {
    try {
      const fullPath = path.join(this.projectRoot, directory);
      const files = await this.walkDirectory(fullPath);
      return files.filter(f => f.endsWith('.spec.js') || f.endsWith('.spec.ts')).length;
    } catch {
      return 0;
    }
  }

  async walkDirectory(dir) {
    const files = [];
    try {
      const items = await fs.readdir(dir);
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = await fs.stat(fullPath);
        if (stat.isDirectory()) {
          files.push(...await this.walkDirectory(fullPath));
        } else {
          files.push(fullPath);
        }
      }
    } catch (error) {
      console.error(`Error walking directory ${dir}:`, error);
    }
    return files;
  }

  async getLastRunTime(framework) {
    // Mock data - would read from actual test results
    const times = {
      playwright: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      puppeteer: new Date(Date.now() - 30 * 60 * 1000).toISOString()
    };
    return times[framework] || null;
  }

  async loadTestResults(framework) {
    // Mock data - would load from actual test reports
    const results = {
      playwright: {
        total: 45,
        passing: 42,
        failing: 2,
        skipped: 1,
        duration: 180
      },
      puppeteer: {
        total: 28,
        passing: 26,
        failing: 1,
        skipped: 1,
        duration: 120
      }
    };
    return results[framework] || { total: 0, passing: 0, failing: 0, skipped: 0, duration: 0 };
  }

  generateHealingRecommendations(bySelector) {
    return Object.entries(bySelector)
      .filter(([, count]) => count > 3)
      .map(([selector, count]) => ({
        selector,
        healingCount: count,
        recommendation: `Consider adding data-testid to element: ${selector}`
      }));
  }

  start() {
    this.projectRoot = path.resolve(__dirname, '../../../');
    
    this.app.listen(this.port, () => {
      console.log(`Integration Dashboard running at http://localhost:${this.port}`);
      console.log('Press Ctrl+C to stop');
    });
  }
}

// Start dashboard if run directly
if (require.main === module) {
  const dashboard = new IntegrationDashboard();
  dashboard.start();
}

module.exports = IntegrationDashboard;