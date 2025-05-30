import * as fs from 'fs';
import * as path from 'path';

interface TestResult {
  timestamp: string;
  summary: {
    total: number;
    passed: number;
    failed: number;
  };
  results: any[];
}

interface AnalysisReport {
  totalRuns: number;
  timeRange: {
    start: string;
    end: string;
  };
  overallStats: {
    totalTests: number;
    totalPassed: number;
    totalFailed: number;
    successRate: string;
  };
  commonFailures: Array<{
    testName: string;
    failureCount: number;
    failureRate: string;
    reasons: string[];
  }>;
  trends: Array<{
    date: string;
    successRate: number;
  }>;
  recommendations: string[];
}

async function analyzeTestResults() {
  console.log('📊 Analyzing Stripe Connect Test Results\n');
  
  const testDir = path.join(__dirname);
  const files = fs.readdirSync(testDir);
  
  // Find all test result files
  const resultFiles = files.filter(f => 
    f.includes('test-results-') && f.endsWith('.json') && !f.includes('analyze')
  );
  
  if (resultFiles.length === 0) {
    console.log('No test result files found. Run some tests first!');
    return;
  }
  
  console.log(`Found ${resultFiles.length} test result files\n`);
  
  // Load all test results
  const allResults: TestResult[] = [];
  const failureReasons = new Map<string, Set<string>>();
  const testFailureCounts = new Map<string, number>();
  const testRunCounts = new Map<string, number>();
  
  for (const file of resultFiles) {
    try {
      const content = fs.readFileSync(path.join(testDir, file), 'utf-8');
      const result = JSON.parse(content) as TestResult;
      allResults.push(result);
      
      // Track individual test results
      if (result.results && Array.isArray(result.results)) {
        result.results.forEach(test => {
          const testName = test.testName || test.name || 'Unknown Test';
          
          // Increment run count
          testRunCounts.set(testName, (testRunCounts.get(testName) || 0) + 1);
          
          // Track failures
          if (test.status === 'failed' || test.passed === false) {
            testFailureCounts.set(testName, (testFailureCounts.get(testName) || 0) + 1);
            
            // Track failure reasons
            if (!failureReasons.has(testName)) {
              failureReasons.set(testName, new Set());
            }
            
            const reason = test.message || test.error || test.details?.error || 'Unknown reason';
            failureReasons.get(testName)!.add(reason);
          }
        });
      }
    } catch (error) {
      console.log(`Failed to parse ${file}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  // Sort results by timestamp
  allResults.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  
  // Calculate overall statistics
  let totalTests = 0;
  let totalPassed = 0;
  let totalFailed = 0;
  
  allResults.forEach(result => {
    totalTests += result.summary.total;
    totalPassed += result.summary.passed;
    totalFailed += result.summary.failed;
  });
  
  // Calculate trends
  const trends = allResults.map(result => ({
    date: new Date(result.timestamp).toLocaleDateString(),
    successRate: (result.summary.passed / result.summary.total) * 100,
  }));
  
  // Identify common failures
  const commonFailures = Array.from(testFailureCounts.entries())
    .map(([testName, failureCount]) => {
      const runCount = testRunCounts.get(testName) || 1;
      return {
        testName,
        failureCount,
        failureRate: `${((failureCount / runCount) * 100).toFixed(1)}%`,
        reasons: Array.from(failureReasons.get(testName) || []),
      };
    })
    .filter(f => f.failureCount > 0)
    .sort((a, b) => b.failureCount - a.failureCount);
  
  // Generate recommendations
  const recommendations: string[] = [];
  
  if (commonFailures.length > 0) {
    recommendations.push('Focus on fixing the most common failures first');
  }
  
  const overallSuccessRate = (totalPassed / totalTests) * 100;
  if (overallSuccessRate < 80) {
    recommendations.push('Overall success rate is below 80% - investigate systematic issues');
  }
  
  // Check for specific patterns
  const webhookFailures = commonFailures.filter(f => 
    f.testName.toLowerCase().includes('webhook')
  );
  if (webhookFailures.length > 0) {
    recommendations.push('Webhook tests are failing - ensure local server is running');
  }
  
  const connectFailures = commonFailures.filter(f => 
    f.reasons.some(r => r.toLowerCase().includes('connected account'))
  );
  if (connectFailures.length > 0) {
    recommendations.push('Connected account issues detected - run test:stripe:setup');
  }
  
  // Create analysis report
  const report: AnalysisReport = {
    totalRuns: allResults.length,
    timeRange: {
      start: allResults[0]?.timestamp || 'N/A',
      end: allResults[allResults.length - 1]?.timestamp || 'N/A',
    },
    overallStats: {
      totalTests,
      totalPassed,
      totalFailed,
      successRate: `${overallSuccessRate.toFixed(1)}%`,
    },
    commonFailures: commonFailures.slice(0, 10), // Top 10
    trends,
    recommendations,
  };
  
  // Display report
  console.log('📈 Test Results Analysis\n');
  console.log(`Test Runs Analyzed: ${report.totalRuns}`);
  console.log(`Time Range: ${new Date(report.timeRange.start).toLocaleDateString()} - ${new Date(report.timeRange.end).toLocaleDateString()}\n`);
  
  console.log('Overall Statistics:');
  console.log(`  Total Tests Run: ${report.overallStats.totalTests}`);
  console.log(`  Passed: ${report.overallStats.totalPassed}`);
  console.log(`  Failed: ${report.overallStats.totalFailed}`);
  console.log(`  Success Rate: ${report.overallStats.successRate}\n`);
  
  if (commonFailures.length > 0) {
    console.log('Most Common Failures:');
    commonFailures.slice(0, 5).forEach((failure, index) => {
      console.log(`\n${index + 1}. ${failure.testName}`);
      console.log(`   Failed ${failure.failureCount} times (${failure.failureRate} failure rate)`);
      console.log(`   Reasons:`);
      failure.reasons.slice(0, 3).forEach(reason => {
        console.log(`   - ${reason}`);
      });
    });
  }
  
  console.log('\n📊 Success Rate Trend:');
  const recentTrends = trends.slice(-5);
  recentTrends.forEach(trend => {
    const bar = '█'.repeat(Math.floor(trend.successRate / 5));
    console.log(`${trend.date}: ${bar} ${trend.successRate.toFixed(1)}%`);
  });
  
  if (recommendations.length > 0) {
    console.log('\n💡 Recommendations:');
    recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. ${rec}`);
    });
  }
  
  // Save analysis report
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportPath = path.join(testDir, `test-analysis-${timestamp}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log(`\n💾 Full analysis saved to: ${reportPath}`);
  
  return report;
}

// Run if called directly
if (require.main === module) {
  analyzeTestResults()
    .then(() => {
      console.log('\n✅ Analysis complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Analysis failed:', error);
      process.exit(1);
    });
}

export { analyzeTestResults };