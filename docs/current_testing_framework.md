# Current Testing Framework

## Overview
LodgeTix-UGLNSW-v2 uses:
- **Puppeteer** with Claude Code integration for end-to-end (E2E) testing
- **Vitest** for unit and integration testing

## Puppeteer Configuration

### Main Configuration (`tests/puppeteer/config/puppeteer.config.js`)
```javascript
{
  baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
  launchOptions: {
    headless: process.env.PUPPETEER_HEADLESS !== 'false',
    slowMo: process.env.PUPPETEER_SLOW_MO ? parseInt(process.env.PUPPETEER_SLOW_MO) : 0,
    devtools: process.env.PUPPETEER_DEVTOOLS === 'true',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  },
  viewport: {
    width: 1920,
    height: 1080
  },
  timeouts: {
    navigation: 30000,
    waitForSelector: 10000,
    waitForFunction: 5000
  }
}
```

### Key Features
- **AI-Powered Testing**: Claude Code integration for test generation and maintenance
- **Self-Healing Tests**: Automatic selector adaptation when UI changes
- **Test Environment**: Isolated Puppeteer environment in `tests/puppeteer/`
- **Parallel Execution**: Multiple test suites run concurrently
- **Evidence Collection**: Screenshots on every major step and failure

### Test Categories
1. **Smoke Tests** (`tests/puppeteer/specs/smoke/`):
   - Quick validation of critical paths
   - Basic functionality checks
   
2. **Critical Tests** (`tests/puppeteer/specs/critical/`):
   - Payment processing
   - Authentication flows
   
3. **Functional Tests** (`tests/puppeteer/specs/functional/`):
   - Feature-specific tests
   - Self-healing demonstrations
   
4. **E2E Tests** (`tests/puppeteer/specs/e2e/`):
   - Complete user workflows
   - Registration flows

### Self-Healing Framework
- **6 Healing Strategies**: ID, data-testid, CSS, XPath, text, visual
- **Automatic Adaptation**: Tests adapt to UI changes without code updates
- **Healing History**: Tracks successful adaptations for learning

### Claude Code Integration
- **Test Generation**: `claude > generate E2E test for [feature]`
- **Test Fixing**: `claude > fix failing test [test-name]`
- **Coverage Analysis**: `claude > analyze test coverage`
- **Test Conversion**: Previously supported Playwright to Puppeteer conversion

### CI/CD Integration
- **GitHub Actions**: Automated test execution on push/PR
- **Test Suites**: smoke, critical, functional, e2e
- **Artifacts**: Test results, screenshots, and reports
- **Cleanup**: Automatic test data cleanup after runs

### Development Commands
```bash
# Run all tests
npm run test:e2e

# Run specific test suites
npm run test:e2e:smoke
npm run test:e2e:critical
npm run test:e2e:functional

# Run with browser visible
npm run test:e2e:headed

# Debug mode
npm run test:e2e:debug
```

### Monitoring
- **Dashboard**: Real-time test monitoring at `http://localhost:3001`
- **Metrics**: Pass rate, execution time, self-healing success
- **Reports**: Comprehensive test reports with screenshots