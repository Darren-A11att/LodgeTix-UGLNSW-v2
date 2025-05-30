#!/usr/bin/env node

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const execAsync = promisify(exec);

interface TestSuite {
  name: string;
  script: string;
  description: string;
  required: boolean;
}

const TEST_SUITES: TestSuite[] = [
  {
    name: 'Environment Check',
    script: 'check-environment',
    description: 'Verify environment is configured correctly',
    required: true,
  },
  {
    name: 'Create Test Accounts',
    script: 'create-test-stripe-accounts',
    description: 'Set up test Stripe connected accounts',
    required: false,
  },
  {
    name: 'Basic Payment Flow',
    script: 'test-basic-payment',
    description: 'Test payment creation with connected accounts',
    required: true,
  },
  {
    name: 'Metadata Validation',
    script: 'test-metadata-validation',
    description: 'Validate payment intent metadata structure',
    required: true,
  },
  {
    name: 'Webhook Handling',
    script: 'test-webhook-handling',
    description: 'Test webhook event processing',
    required: false,
  },
  {
    name: 'Fee Calculations',
    script: 'test-fee-calculations',
    description: 'Verify platform fee calculations',
    required: true,
  },
];

async function checkEnvironment(): Promise<boolean> {
  console.log('🔍 Checking environment configuration...\n');
  
  const requiredEnvVars = [
    'STRIPE_SECRET_KEY',
    'STRIPE_PUBLISHABLE_KEY',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'STRIPE_PLATFORM_FEE_PERCENTAGE',
  ];
  
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.log('❌ Missing required environment variables:');
    missingVars.forEach(varName => console.log(`   - ${varName}`));
    return false;
  }
  
  // Check if running in test mode
  if (!process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_')) {
    console.log('⚠️  Warning: Not using test Stripe keys!');
    console.log('   Current key starts with:', process.env.STRIPE_SECRET_KEY?.substring(0, 10));
    return false;
  }
  
  console.log('✅ Environment configured correctly\n');
  return true;
}

async function runTestSuite(suite: TestSuite): Promise<boolean> {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🧪 Running: ${suite.name}`);
  console.log(`📝 ${suite.description}`);
  console.log(`${'='.repeat(60)}\n`);
  
  const scriptPath = path.join(__dirname, `${suite.script}.ts`);
  
  // Check if script exists
  if (!fs.existsSync(scriptPath)) {
    console.log(`⚠️  Test script not found: ${scriptPath}`);
    return false;
  }
  
  try {
    const { stdout, stderr } = await execAsync(`npx ts-node ${scriptPath}`);
    
    if (stdout) {
      console.log(stdout);
    }
    
    if (stderr) {
      console.error('Errors:', stderr);
    }
    
    return true;
  } catch (error) {
    console.error(`❌ Test suite failed: ${suite.name}`);
    if (error instanceof Error) {
      console.error(error.message);
    }
    return suite.required ? false : true; // Don't fail on optional tests
  }
}

async function generateSummaryReport(results: Map<string, boolean>) {
  console.log('\n' + '='.repeat(60));
  console.log('📊 STRIPE CONNECT TEST SUMMARY');
  console.log('='.repeat(60) + '\n');
  
  const totalTests = results.size;
  const passedTests = Array.from(results.values()).filter(passed => passed).length;
  const failedTests = totalTests - passedTests;
  const successRate = ((passedTests / totalTests) * 100).toFixed(1);
  
  console.log(`Total Test Suites: ${totalTests}`);
  console.log(`Passed: ${passedTests} ✅`);
  console.log(`Failed: ${failedTests} ❌`);
  console.log(`Success Rate: ${successRate}%\n`);
  
  // Show individual results
  console.log('Individual Results:');
  results.forEach((passed, suiteName) => {
    console.log(`${passed ? '✅' : '❌'} ${suiteName}`);
  });
  
  // Generate timestamp
  const timestamp = new Date().toISOString();
  
  // Create summary report
  const report = {
    timestamp,
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
      stripeTestMode: process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_'),
    },
    summary: {
      totalTests,
      passedTests,
      failedTests,
      successRate: `${successRate}%`,
    },
    results: Object.fromEntries(results),
    recommendations: generateRecommendations(results),
  };
  
  // Save report
  const reportPath = path.join(__dirname, `test-summary-${timestamp.replace(/[:.]/g, '-')}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log(`\n💾 Full report saved to: ${reportPath}`);
  
  return failedTests === 0;
}

function generateRecommendations(results: Map<string, boolean>): string[] {
  const recommendations: string[] = [];
  
  if (!results.get('Environment Check')) {
    recommendations.push('Fix environment configuration before proceeding');
  }
  
  if (!results.get('Create Test Accounts')) {
    recommendations.push('Create test Stripe accounts for comprehensive testing');
  }
  
  if (!results.get('Webhook Handling')) {
    recommendations.push('Ensure local server is running for webhook tests');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('All tests passed! Ready for production testing.');
  }
  
  return recommendations;
}

async function main() {
  console.log('🚀 STRIPE CONNECT TEST RUNNER');
  console.log('============================\n');
  console.log(`Started at: ${new Date().toLocaleString()}\n`);
  
  // Check environment first
  const envOk = await checkEnvironment();
  if (!envOk) {
    console.log('\n❌ Please fix environment configuration before running tests.');
    process.exit(1);
  }
  
  // Run test suites
  const results = new Map<string, boolean>();
  
  for (const suite of TEST_SUITES) {
    if (suite.script === 'check-environment') {
      results.set(suite.name, true); // Already checked
      continue;
    }
    
    const passed = await runTestSuite(suite);
    results.set(suite.name, passed);
    
    // Stop if required test fails
    if (!passed && suite.required) {
      console.log(`\n⛔ Required test failed. Stopping test run.`);
      break;
    }
  }
  
  // Generate summary
  const allPassed = await generateSummaryReport(results);
  
  // Show recommendations
  const recommendations = generateRecommendations(results);
  if (recommendations.length > 0) {
    console.log('\n📋 Recommendations:');
    recommendations.forEach(rec => console.log(`   • ${rec}`));
  }
  
  // Show manual testing reminder
  console.log('\n📖 Next Steps:');
  console.log('   1. Review test results and fix any failures');
  console.log('   2. Run manual tests using MANUAL_TESTING_CHECKLIST.md');
  console.log('   3. Test in Stripe Dashboard with real UI');
  console.log('   4. Verify production configuration');
  
  console.log(`\nCompleted at: ${new Date().toLocaleString()}`);
  
  process.exit(allPassed ? 0 : 1);
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Test runner failed:', error);
    process.exit(1);
  });
}

export { main as runAllTests };