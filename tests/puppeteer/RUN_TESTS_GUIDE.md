# Running LodgeTix Puppeteer Tests

## Prerequisites

1. **Install Dependencies**
   ```bash
   # Navigate to the Puppeteer tests directory
   cd tests/puppeteer
   
   # Install all dependencies
   npm install
   ```

2. **Environment Setup**
   Create a `.env` file in the `tests/puppeteer` directory:
   ```env
   NEXT_PUBLIC_BASE_URL=http://localhost:3000
   PUPPETEER_HEADLESS=true
   ```

3. **Start Your Application**
   ```bash
   # In the root directory
   npm run dev
   ```

## Running Tests

### Run All Tests
```bash
cd tests/puppeteer
npm test
```

### Run Specific Test Categories

**Smoke Tests** (Quick basic functionality checks):
```bash
npm run test:smoke
```

**Critical Path Tests** (Payment, confirmation flows):
```bash
npm run test:critical
```

**Run Tests in Headed Mode** (See browser):
```bash
npm run test:headed
```

**Debug Mode** (With Chrome DevTools):
```bash
npm run test:debug
```

### Run Specific Test Files

**Individual Mason Variations**:
```bash
npm test -- individual-mason-variations.spec.js
```

**Guest Variations**:
```bash
npm test -- individual-guest-variations.spec.js
```

**Partner Combinations**:
```bash
npm test -- partner-combinations.spec.js
```

**Contact Preferences**:
```bash
npm test -- contact-preference-scenarios.spec.js
```

**Grand Officer Scenarios**:
```bash
npm test -- grand-officer-scenarios.spec.js
```

**Mixed Attendee Groups**:
```bash
npm test -- mixed-attendee-groups.spec.js
```

**Ticket Eligibility**:
```bash
npm test -- ticket-eligibility-matrix.spec.js
```

**Edge Cases**:
```bash
npm test -- edge-cases-and-limits.spec.js
```

**Data Persistence**:
```bash
npm test -- data-persistence-scenarios.spec.js
```

### Run Tests by Pattern
```bash
# Run all Mason-related tests
npm test -- --testNamePattern="Mason"

# Run all validation tests
npm test -- --testNamePattern="validation"

# Run all partner tests
npm test -- --testNamePattern="partner"
```

### Run Tests with Coverage
```bash
npm test -- --coverage
```

## Test Output

### Screenshots
Failed test screenshots are saved to:
```
tests/puppeteer/reports/screenshots/
```

### Test Reports
After running tests, generate an HTML report:
```bash
npm run generate:report
npm run open:report
```

## Parallel Execution

To run tests in parallel (faster):
```bash
# Run with 4 workers
npm test -- --maxWorkers=4
```

## CI/CD Integration

For GitHub Actions, tests run automatically on:
- Push to main branch
- Pull requests
- Daily at 2 AM UTC

Manual trigger:
```bash
# From GitHub Actions tab
# Run workflow -> Run E2E Tests
```

## Troubleshooting

### Tests Failing on "Element not found"
1. Ensure your app is running on http://localhost:3000
2. Check if test selectors match your current HTML
3. Increase timeout in test files if needed

### Browser Launch Issues
```bash
# On Ubuntu/Debian
sudo apt-get install -y libgbm-dev

# On macOS
brew install chromium
```

### Memory Issues with Many Tests
```bash
# Run tests sequentially
npm test -- --runInBand

# Or limit workers
npm test -- --maxWorkers=2
```

### Debug Specific Test
```bash
# Add console.logs and run single test
npm test -- individual-mason-variations.spec.js -t "completes registration with minimum required fields only"
```

## Test Organization

```
tests/puppeteer/
├── specs/
│   ├── smoke/          # Quick health checks
│   ├── critical/       # Payment & confirmation
│   ├── functional/     # Form validation, accessibility
│   └── e2e/           # Full registration flows
├── helpers/           # Reusable test utilities
├── config/           # Test configuration
└── reports/          # Test outputs
```

## Best Practices

1. **Run smoke tests first** to verify basic functionality
2. **Use headed mode** when debugging failures
3. **Check screenshots** for visual verification
4. **Run in parallel** for faster execution
5. **Use pattern matching** to run related tests together

## Example Test Session

```bash
# 1. Quick smoke test
cd tests/puppeteer
npm run test:smoke

# 2. Run specific variation tests
npm test -- individual-mason-variations.spec.js
npm test -- partner-combinations.spec.js

# 3. Run all tests with visual browser
npm run test:headed

# 4. Generate report
npm run generate:report
npm run open:report
```

## Environment Variables

- `PUPPETEER_HEADLESS`: Set to `false` to see browser
- `NEXT_PUBLIC_BASE_URL`: Your app URL (default: http://localhost:3000)
- `DEBUG`: Set to `puppeteer:*` for debug logs
- `SLOWMO`: Milliseconds to slow down Puppeteer operations