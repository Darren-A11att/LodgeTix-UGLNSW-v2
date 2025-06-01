#!/usr/bin/env node

/**
 * Comprehensive test runner with self-healing capabilities
 * Runs all Puppeteer tests with enhanced error recovery and reporting
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;
const puppeteer = require('puppeteer');

// Test configuration
const config = {
  baseUrl: process.env.BASE_URL || 'http://192.168.20.41:3000',
  headless: process.env.HEADLESS !== 'false',
  selfHealingEnabled: true,
  parallelExecution: false, // Set to true for faster execution
  maxRetries: 3,
  viewport: {
    width: 1920,
    height: 1080
  }
};

// Test suites organized by priority
const testSuites = [
  { name: 'Smoke Tests', pattern: 'smoke', priority: 1 },
  { name: 'Critical Flows', pattern: 'critical', priority: 2 },
  { name: 'E2E Scenarios', pattern: 'e2e', priority: 3 },
  { name: 'Functional Tests', pattern: 'functional', priority: 4 }
];

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Utility functions
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'bright');
  console.log('='.repeat(60) + '\n');
}

// Pre-test validation
async function validateEnvironment() {
  logSection('🔍 Validating Test Environment');
  
  try {
    // Check if application is accessible
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setViewport(config.viewport);
    
    log(`Checking application at ${config.baseUrl}...`, 'cyan');
    const response = await page.goto(config.baseUrl, { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    if (response.status() !== 200) {
      throw new Error(`Application returned status ${response.status()}`);
    }
    
    log('✅ Application is accessible', 'green');
    
    // Take a validation screenshot
    await page.screenshot({
      path: path.join(__dirname, 'reports/screenshots/environment-check.png'),
      fullPage: false
    });
    
    await browser.close();
    
    // Check test file structure
    log('Checking test files...', 'cyan');
    const testDirs = ['specs/smoke', 'specs/critical', 'specs/e2e', 'specs/functional'];
    for (const dir of testDirs) {
      const dirPath = path.join(__dirname, dir);
      try {
        const files = await fs.readdir(dirPath);
        const specFiles = files.filter(f => f.endsWith('.spec.js'));
        log(`  ✓ ${dir}: ${specFiles.length} test files`, 'green');
      } catch (e) {
        log(`  ✗ ${dir}: Directory not found`, 'yellow');
      }
    }
    
    return true;
  } catch (error) {
    log(`❌ Environment validation failed: ${error.message}`, 'red');
    return false;
  }
}

// Run a specific test suite
async function runTestSuite(suite, retryCount = 0) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    log(`\n🚀 Running ${suite.name}...`, 'blue');
    
    const env = {
      ...process.env,
      PUPPETEER_HEADLESS: String(config.headless),
      NEXT_PUBLIC_BASE_URL: config.baseUrl,
      SELF_HEALING_ENABLED: String(config.selfHealingEnabled),
      NODE_ENV: 'test',
      JEST_TIMEOUT: '60000'
    };
    
    const args = ['test', '--testPathPattern', suite.pattern];
    
    if (process.env.VERBOSE) {
      args.push('--verbose');
    }
    
    // Add custom error handling
    args.push('--detectOpenHandles');
    
    const child = spawn('npm', args, {
      cwd: __dirname,
      env,
      stdio: 'inherit'
    });
    
    child.on('close', (code) => {
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      
      if (code === 0) {
        log(`✅ ${suite.name} completed successfully in ${duration}s`, 'green');
        resolve({ suite: suite.name, status: 'passed', duration, code });
      } else if (retryCount < config.maxRetries) {
        log(`⚠️  ${suite.name} failed, retrying (${retryCount + 1}/${config.maxRetries})...`, 'yellow');
        setTimeout(() => {
          runTestSuite(suite, retryCount + 1).then(resolve);
        }, 2000);
      } else {
        log(`❌ ${suite.name} failed after ${config.maxRetries} attempts (${duration}s)`, 'red');
        resolve({ suite: suite.name, status: 'failed', duration, code });
      }
    });
    
    child.on('error', (error) => {
      log(`💥 Failed to run ${suite.name}: ${error.message}`, 'red');
      resolve({ suite: suite.name, status: 'error', error: error.message });
    });
  });
}

// Generate test report
async function generateReport(results) {
  const reportDir = path.join(__dirname, 'reports');
  await fs.mkdir(reportDir, { recursive: true });
  
  const report = {
    timestamp: new Date().toISOString(),
    configuration: config,
    environment: {
      node: process.version,
      platform: process.platform,
      arch: process.arch
    },
    results: results,
    summary: {
      total: results.length,
      passed: results.filter(r => r.status === 'passed').length,
      failed: results.filter(r => r.status === 'failed').length,
      errors: results.filter(r => r.status === 'error').length,
      totalDuration: results.reduce((sum, r) => sum + (parseFloat(r.duration) || 0), 0).toFixed(2)
    }
  };
  
  // Write JSON report
  const jsonPath = path.join(reportDir, 'test-report.json');
  await fs.writeFile(jsonPath, JSON.stringify(report, null, 2));
  
  // Generate HTML report
  const htmlReport = `
<!DOCTYPE html>
<html>
<head>
  <title>Puppeteer Test Report - ${new Date().toLocaleDateString()}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
    .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    h1 { color: #333; }
    .summary { display: flex; gap: 20px; margin: 20px 0; }
    .summary-card { flex: 1; padding: 15px; border-radius: 8px; text-align: center; }
    .passed { background: #d4edda; color: #155724; }
    .failed { background: #f8d7da; color: #721c24; }
    .total { background: #d1ecf1; color: #0c5460; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background: #f8f9fa; font-weight: bold; }
    .status-passed { color: #28a745; }
    .status-failed { color: #dc3545; }
    .config { background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🧪 Puppeteer Test Report</h1>
    <p>Generated: ${new Date().toLocaleString()}</p>
    
    <div class="summary">
      <div class="summary-card total">
        <h3>Total Tests</h3>
        <h2>${report.summary.total}</h2>
      </div>
      <div class="summary-card passed">
        <h3>Passed</h3>
        <h2>${report.summary.passed}</h2>
      </div>
      <div class="summary-card failed">
        <h3>Failed</h3>
        <h2>${report.summary.failed}</h2>
      </div>
    </div>
    
    <div class="config">
      <h3>Configuration</h3>
      <p><strong>Base URL:</strong> ${config.baseUrl}</p>
      <p><strong>Headless:</strong> ${config.headless}</p>
      <p><strong>Self-Healing:</strong> ${config.selfHealingEnabled}</p>
      <p><strong>Viewport:</strong> ${config.viewport.width}x${config.viewport.height}</p>
      <p><strong>Total Duration:</strong> ${report.summary.totalDuration}s</p>
    </div>
    
    <h3>Test Results</h3>
    <table>
      <thead>
        <tr>
          <th>Test Suite</th>
          <th>Status</th>
          <th>Duration</th>
          <th>Details</th>
        </tr>
      </thead>
      <tbody>
        ${results.map(r => `
          <tr>
            <td>${r.suite}</td>
            <td class="status-${r.status}">${r.status.toUpperCase()}</td>
            <td>${r.duration || 'N/A'}s</td>
            <td>${r.error || '-'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
</body>
</html>
  `;
  
  const htmlPath = path.join(reportDir, 'test-report.html');
  await fs.writeFile(htmlPath, htmlReport);
  
  return { jsonPath, htmlPath };
}

// Main execution
async function main() {
  logSection('🧪 LodgeTix Puppeteer Test Runner');
  
  log('Configuration:', 'cyan');
  log(`  Base URL: ${config.baseUrl}`);
  log(`  Headless: ${config.headless}`);
  log(`  Self-Healing: ${config.selfHealingEnabled}`);
  log(`  Viewport: ${config.viewport.width}x${config.viewport.height}`);
  
  // Validate environment
  const isValid = await validateEnvironment();
  if (!isValid) {
    log('\n❌ Environment validation failed. Please check your setup.', 'red');
    process.exit(1);
  }
  
  // Create reports directory
  const reportsDir = path.join(__dirname, 'reports');
  await fs.mkdir(path.join(reportsDir, 'screenshots'), { recursive: true });
  
  logSection('🏃 Running Test Suites');
  
  const results = [];
  
  // Run test suites based on priority
  for (const suite of testSuites.sort((a, b) => a.priority - b.priority)) {
    const result = await runTestSuite(suite);
    results.push(result);
    
    // Stop if critical tests fail
    if (suite.priority <= 2 && result.status === 'failed') {
      log('\n⚠️  Critical test suite failed. Stopping execution.', 'yellow');
      break;
    }
  }
  
  // Generate reports
  logSection('📊 Generating Reports');
  
  const { jsonPath, htmlPath } = await generateReport(results);
  
  log(`JSON Report: ${jsonPath}`, 'cyan');
  log(`HTML Report: ${htmlPath}`, 'cyan');
  
  // Print summary
  logSection('📈 Test Summary');
  
  const summary = {
    total: results.length,
    passed: results.filter(r => r.status === 'passed').length,
    failed: results.filter(r => r.status === 'failed').length
  };
  
  log(`Total Suites: ${summary.total}`);
  log(`Passed: ${summary.passed}`, 'green');
  log(`Failed: ${summary.failed}`, summary.failed > 0 ? 'red' : 'green');
  
  // Self-healing insights
  if (config.selfHealingEnabled) {
    logSection('🔧 Self-Healing Insights');
    log('Self-healing was enabled for all tests.', 'cyan');
    log('Check individual test logs for selector adaptations.', 'cyan');
    
    // Check for healing report
    try {
      const healingReportPath = path.join(reportsDir, 'healing-history.json');
      const healingData = await fs.readFile(healingReportPath, 'utf8');
      const healings = JSON.parse(healingData);
      log(`Total selector healings: ${healings.length}`, 'green');
    } catch (e) {
      log('No healing events recorded in this run.', 'yellow');
    }
  }
  
  // Final status
  const exitCode = summary.failed > 0 ? 1 : 0;
  
  if (exitCode === 0) {
    log('\n✅ All tests passed successfully!', 'green');
  } else {
    log('\n❌ Some tests failed. Please review the reports.', 'red');
  }
  
  // Open HTML report if not in CI
  if (!process.env.CI && process.platform === 'darwin') {
    const { exec } = require('child_process');
    exec(`open ${htmlPath}`);
    log('\n📄 Opening HTML report in browser...', 'cyan');
  }
  
  process.exit(exitCode);
}

// Handle errors
process.on('unhandledRejection', (error) => {
  log(`\n💥 Unhandled error: ${error.message}`, 'red');
  process.exit(1);
});

// Run the test suite
if (require.main === module) {
  main().catch(error => {
    log(`\n💥 Fatal error: ${error.message}`, 'red');
    console.error(error.stack);
    process.exit(1);
  });
}

module.exports = { runTestSuite, generateReport };