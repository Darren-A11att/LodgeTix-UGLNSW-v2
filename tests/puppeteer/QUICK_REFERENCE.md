# Puppeteer Integration - Quick Reference

## Key Commands

```bash
# Run all tests
cd tests/puppeteer && npm test

# Run specific test suites
npm run test:smoke
npm run test:critical
npm run test:functional
npm run test:e2e

# Run with browser visible
npm run test:headed

# Debug mode
npm run test:debug

# Start monitoring dashboard
cd tests/puppeteer/dashboard && npm start
# Open http://localhost:3001
```

## Important Files

### Configuration
- **MCP Config**: `/.mcp.json`
- **Test Config**: `/tests/puppeteer/config/puppeteer.config.js`
- **Jest Setup**: `/tests/puppeteer/config/jest.setup.js`

### Tests
- **Smoke Tests**: `/tests/puppeteer/specs/smoke/`
- **Critical Tests**: `/tests/puppeteer/specs/critical/`
- **Functional Tests**: `/tests/puppeteer/specs/functional/`
- **E2E Tests**: `/tests/puppeteer/specs/e2e/`

### Utilities
- **Self-Healing**: `/tests/puppeteer/helpers/self-healing.js`
- **Test Generator**: `/tests/puppeteer/helpers/test-generator.js`
- **Playwright Bridge**: `/tests/puppeteer/helpers/playwright-bridge.js`
- **Test Data Manager**: `/tests/puppeteer/helpers/test-data-manager.js`

### CI/CD
- **E2E Tests Workflow**: `/.github/workflows/e2e-tests.yml`
- **AI Test Generation**: `/.github/workflows/claude-test-generation.yml`

### Documentation
- **Training Guide**: `/tests/puppeteer/docs/team-training-guide.md`
- **Migration Strategy**: `/tests/puppeteer/migration-strategy.md`
- **Integration Report**: `/integration-assessment-report.md`

### Claude Commands
- **Generate Test**: `/.claude/commands/generate-e2e-test.md`
- **Fix Test**: `/.claude/commands/fix-failing-test.md`
- **Coverage Analysis**: `/.claude/commands/analyze-test-coverage.md`
- **Convert Test**: `/.claude/commands/convert-playwright-test.md`

## Environment Variables

```bash
# Required for tests
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_key
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Optional
PUPPETEER_HEADLESS=true
PUPPETEER_SLOW_MO=0
PUPPETEER_SCREENSHOTS=true
```

## Common Tasks

### Add a New Test
```bash
# Use Claude Code
claude > generate E2E test for payment with discount code

# Or manually create in appropriate directory
tests/puppeteer/specs/functional/discount-code.spec.js
```

### Fix a Failing Test
```bash
# Use Claude Code
claude > fix failing test payment-processing.spec.js

# Or debug manually
npm run test:debug -- payment-processing.spec.js
```

### Check Test Coverage
```bash
# Use Claude Code
claude > analyze test coverage for registration flows

# Or run dashboard
cd dashboard && npm start
```

## Troubleshooting

### Test Timeouts
- Increase timeout in test: `jest.setTimeout(60000)`
- Or in specific test: `test('name', async () => {}, 60000)`

### Selector Not Found
- Use self-healing: `const healer = new SelfHealingFramework(page)`
- Or update selector to use data-testid

### CI/CD Issues
- Check environment variables in GitHub Secrets
- Verify Supabase/Stripe credentials
- Review workflow logs in Actions tab

## Support

- **Slack**: #testing-automation
- **Dashboard**: http://localhost:3001
- **Docs**: `/tests/puppeteer/docs/`