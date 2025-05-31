# Puppeteer E2E Tests

AI-powered E2E testing with Claude Code integration and self-healing capabilities.

## Quick Start

```bash
# Install dependencies
npm install

# Run all tests
npm test

# Run specific suites
npm run test:smoke      # Quick smoke tests
npm run test:critical   # Critical path tests
npm run test:functional # Feature tests
npm run test:e2e       # Full workflows

# Run with UI
npm run test:headed

# Debug mode
npm run test:debug
```

## Features

- 🤖 **AI-Powered**: Claude Code generates and maintains tests
- 🔧 **Self-Healing**: Tests adapt to UI changes automatically
- 🚀 **Fast Execution**: Parallel test running in CI/CD
- 📊 **Monitoring**: Real-time dashboard at http://localhost:3001
- 🌉 **Playwright Bridge**: Reuse existing test patterns

## Project Structure

```
tests/puppeteer/
├── config/          # Configuration files
├── helpers/         # Utilities and frameworks
├── specs/           # Test specifications
├── dashboard/       # Monitoring dashboard
├── docs/           # Documentation
└── reports/        # Test results
```

## Writing Tests

```javascript
describe('Feature', () => {
  test('should work', async () => {
    await page.goto(config.baseUrl);
    await page.clickTestId('button');
    expect(await page.title()).toContain('Expected');
  });
});
```

## Self-Healing Example

```javascript
const healer = new SelfHealingFramework(page);
await healer.click('[data-testid="submit"]'); // Auto-heals if selector changes
```

## Documentation

- [Training Guide](docs/team-training-guide.md)
- [Migration Strategy](migration-strategy.md)
- [Integration Report](../../CLAUDE_PUPPETEER_INTEGRATION_COMPLETE.md)

## Support

- Slack: #testing-automation
- Dashboard: http://localhost:3001
- Claude Commands: `.claude/commands/`