# Fix Failing E2E Test

Debug and fix the failing test: $ARGUMENTS

## Steps:
1. Locate the failing test file
2. Analyze the error message and stack trace
3. Check for:
   - Selector changes (use self-healing if needed)
   - Timing issues (add appropriate waits)
   - Test data problems
   - Environment differences

4. Common fixes:
   - Update selectors to use data-testid
   - Add waitForSelector before interactions
   - Increase timeouts for slow operations
   - Handle dynamic content properly

5. Verify the fix by running the test locally
6. Update the test to prevent future failures
7. Add comments explaining the fix

## Example Usage:
- "tests/puppeteer/specs/e2e/registration-workflow.spec.js"
- "payment test timeout on line 45"
- "element not found error in ticket selection"