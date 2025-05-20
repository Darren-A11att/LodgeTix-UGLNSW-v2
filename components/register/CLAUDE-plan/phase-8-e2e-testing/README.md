# Phase 8: End-to-End Testing

This phase implements comprehensive end-to-end testing using Jest and Puppeteer/Playwright to ensure the entire registration system works correctly from the user's perspective.

## Phase Overview

Phase 8 consists of 6 tasks that build a complete E2E testing suite:

1. **Task 141**: Setup E2E Testing Infrastructure
2. **Task 142**: Create Registration Type Tests  
3. **Task 143**: Create Individual Registration Flow Tests
4. **Task 144**: Create Lodge Registration Flow Tests
5. **Task 145**: Create Delegation Registration Flow Tests
6. **Task 146**: Create Payment and Confirmation Flow Tests

## Dependencies

This phase can run in parallel with other phases but should ideally be started after:
- Phase 1: Domain/Core Types (for consistent data structures)
- Phase 2: State Management (for testing store behavior)
- Phase 3-5: Registration flow components are implemented

## Testing Strategy

### Test Categories

1. **Happy Path Tests**: Primary user flows work correctly
2. **Edge Case Tests**: Unusual but valid scenarios
3. **Error Handling Tests**: System behaves correctly under failure conditions
4. **Performance Tests**: Response times meet requirements
5. **Security Tests**: Input validation, session management

### Registration Types Covered

1. **Individual Registration**
   - Single Mason registration
   - Form validation
   - Navigation flow
   - Summary display

2. **Lodge Registration**
   - Multiple attendees
   - Mixed attendee types (Mason/Guest)
   - Partner additions
   - Bulk operations

3. **Delegation Registration**
   - Inter-jurisdictional vs Overseas
   - Entitlement verification
   - Protocol ordering
   - Special requirements

4. **Payment & Confirmation**
   - Stripe integration
   - Error handling
   - 3D Secure
   - Receipt generation
   - Email confirmations

## Implementation Guide

### 1. Complete Infrastructure Setup (Task 141)

```bash
# Install dependencies
npm install --save-dev jest puppeteer @types/jest @types/puppeteer
npm install --save-dev @playwright/test # Alternative to Puppeteer

# Create test directories
mkdir -p tests/e2e/registration
mkdir -p tests/e2e/helpers
```

### 2. Create Test Helpers

```typescript
// tests/e2e/helpers/test-data.ts
export function generateUniqueTestData() {
  const timestamp = Date.now();
  return {
    firstName: `Test${timestamp}`,
    lastName: `User${timestamp}`,
    email: `test${timestamp}@example.com`,
    // ... other fields
  };
}
```

### 3. Write Registration Tests (Tasks 142-145)

Follow the patterns established in each task file to create comprehensive tests for:
- Registration type selection
- Form completion and validation
- Multi-step navigation
- Data persistence
- Error handling

### 4. Implement Payment Tests (Task 146)

Ensure proper testing of:
- Stripe Elements integration
- Payment processing
- Error scenarios
- Confirmation flow

## Running Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run specific test file
npm run test:e2e -- registration-type.test.ts

# Run tests in headed mode (see browser)
npm run test:e2e -- --headed

# Run tests with specific browser
npm run test:e2e -- --browser=firefox
```

## CI/CD Integration

Add to your GitHub Actions workflow:

```yaml
- name: Run E2E Tests
  run: |
    npm run build
    npm run test:e2e
  env:
    STRIPE_TEST_KEY: ${{ secrets.STRIPE_TEST_KEY }}
    NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
```

## Best Practices

1. **Test Data Isolation**: Each test should create unique data
2. **Test Independence**: Tests should not depend on each other
3. **Proper Cleanup**: Reset state between tests
4. **Meaningful Assertions**: Test user-visible behavior
5. **Error Messages**: Include helpful error messages in assertions
6. **Page Object Pattern**: Consider using for complex pages

## Common Issues & Solutions

### Issue: Tests fail due to timing
**Solution**: Use proper wait strategies
```typescript
// Good
await page.waitForSelector('[data-testid="submit-button"]');

// Bad
await page.waitForTimeout(1000);
```

### Issue: Flaky tests
**Solution**: Add retry logic and better selectors
```typescript
// jest.config.js
module.exports = {
  testRetries: 2,
  // ...
};
```

### Issue: Tests pass locally but fail in CI
**Solution**: Ensure consistent environment
- Use same Node version
- Set proper viewport size
- Handle different timezones

## Maintenance

1. **Update Selectors**: Keep data-testid attributes in sync
2. **Mock External Services**: Use test doubles for Stripe, email
3. **Performance Monitoring**: Track test execution times
4. **Coverage Reports**: Maintain high test coverage

## Next Steps

After completing Phase 8:
1. Set up continuous test execution in CI/CD
2. Create visual regression tests
3. Add accessibility testing
4. Implement load testing for high-traffic scenarios
5. Create smoke test suite for production monitoring