# Generate E2E Test

Generate a comprehensive Puppeteer E2E test for: $ARGUMENTS

## Requirements:
1. Analyze the specified feature or workflow
2. Create a test file in the appropriate directory:
   - `tests/puppeteer/specs/smoke/` for quick checks
   - `tests/puppeteer/specs/critical/` for payment/auth
   - `tests/puppeteer/specs/functional/` for features
   - `tests/puppeteer/specs/e2e/` for full workflows

3. Include:
   - Proper test structure with setup/teardown
   - Self-healing selectors using data-testid
   - Error handling and retries
   - Screenshots at key steps
   - Meaningful assertions

4. Follow patterns from existing tests
5. Use test data manager for data creation
6. Add cleanup in afterAll hook

## Example Usage:
- "the lodge registration flow"
- "payment with 3D Secure authentication"
- "event search and filtering"