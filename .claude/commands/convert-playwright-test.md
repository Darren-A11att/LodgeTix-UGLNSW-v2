# Convert Playwright Test to Puppeteer

Convert the Playwright test to Puppeteer: $ARGUMENTS

## Conversion Process:
1. Read the specified Playwright test file
2. Identify test structure and patterns
3. Convert to Puppeteer equivalents:
   - `page.getByTestId()` → `page.clickTestId()`
   - `page.getByRole()` → role selectors
   - `page.getByText()` → XPath or text search
   - `expect(page).toHaveURL()` → `expect(page.url()).toContain()`

4. Add self-healing capabilities
5. Preserve test logic and assertions
6. Use Playwright bridge where needed
7. Maintain same file structure

## Conversion Mappings:
- Locators → CSS/XPath selectors
- Assertions → Jest expectations
- Network waits → waitForLoadState
- Screenshots → takeScreenshot helper

## Example Usage:
- "__tests__/e2e/registration/individual-flow.spec.ts"
- "the payment processing test"
- "all visual regression tests"