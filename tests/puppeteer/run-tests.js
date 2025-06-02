#!/usr/bin/env node

/**
 * Run all Puppeteer tests with proper configuration
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Configuration
const config = {
  // Test patterns to run
  testPatterns: [
    'specs/e2e/**/*.spec.js',
    'specs/smoke/**/*.spec.js',
    'specs/functional/**/*.spec.js',
    'specs/critical/**/*.spec.js'
  ],
  
  // Jest configuration
  jestConfig: {
    preset: 'jest-puppeteer',
    testEnvironment: './config/puppeteer-environment.js',
    setupFilesAfterEnv: ['./config/jest.setup.js'],
    testTimeout: 60000,
    verbose: true,
    collectCoverage: process.env.COVERAGE === 'true',
    coverageDirectory: './coverage',
    coverageReporters: ['text', 'lcov', 'html'],
    reporters: [
      'default',
      ['jest-html-reporter', {
        pageTitle: 'Puppeteer Test Report',
        outputPath: './reports/test-report.html',
        includeFailureMsg: true,
        includeConsoleLog: true
      }],
      ['jest-junit', {
        outputDirectory: './reports',
        outputName: 'test-report.xml'
      }]
    ]
  }
};

// Environment variables
const env = {
  ...process.env,
  NODE_ENV: 'test',
  HEADLESS: process.env.HEADLESS || 'true',
  SLOW_MO: process.env.SLOW_MO || '0',
  ENABLE_SELF_HEALING: 'true'
};

// Parse command line arguments
const args = process.argv.slice(2);
const isWatch = args.includes('--watch');
const isDebug = args.includes('--debug');
const specificTest = args.find(arg => arg.endsWith('.spec.js'));

// Build Jest command
const jestArgs = [];

if (specificTest) {
  // Run specific test file
  jestArgs.push(specificTest);
} else {
  // Run all tests matching patterns
  config.testPatterns.forEach(pattern => {
    jestArgs.push('--testPathPattern', pattern);
  });
}

// Add additional flags
if (isWatch) {
  jestArgs.push('--watch');
}

if (isDebug) {
  env.HEADLESS = 'false';
  env.SLOW_MO = '250';
  jestArgs.push('--runInBand');
}

// Create reports directory if it doesn't exist
const reportsDir = path.join(__dirname, 'reports');
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

// Create screenshots directory if it doesn't exist
const screenshotsDir = path.join(__dirname, 'screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

// Write Jest configuration
const jestConfigPath = path.join(__dirname, 'jest.config.json');
fs.writeFileSync(jestConfigPath, JSON.stringify(config.jestConfig, null, 2));

// Run Jest
console.log('🧪 Running Puppeteer tests...');
console.log('Configuration:');
console.log(`  Headless: ${env.HEADLESS}`);
console.log(`  SlowMo: ${env.SLOW_MO}ms`);
console.log(`  Self-healing: ${env.ENABLE_SELF_HEALING}`);
if (specificTest) {
  console.log(`  Running: ${specificTest}`);
} else {
  console.log(`  Patterns: ${config.testPatterns.join(', ')}`);
}
console.log('');

const jest = spawn('npx', ['jest', '--config', jestConfigPath, ...jestArgs], {
  cwd: __dirname,
  env,
  stdio: 'inherit'
});

jest.on('close', (code) => {
  // Clean up temporary config file
  fs.unlinkSync(jestConfigPath);
  
  if (code === 0) {
    console.log('\n✅ All tests passed!');
  } else {
    console.log(`\n❌ Tests failed with code ${code}`);
  }
  
  // Show report location
  console.log('\n📊 Test reports available at:');
  console.log(`  HTML: ${path.join(reportsDir, 'test-report.html')}`);
  console.log(`  XML: ${path.join(reportsDir, 'test-report.xml')}`);
  if (process.env.COVERAGE === 'true') {
    console.log(`  Coverage: ${path.join(__dirname, 'coverage', 'index.html')}`);
  }
  
  process.exit(code);
});

// Handle script termination
process.on('SIGINT', () => {
  jest.kill('SIGINT');
});

process.on('SIGTERM', () => {
  jest.kill('SIGTERM');
});