# Step 6: Test Generation Based on Existing Code

## Objective
Leverage Claude Code to automatically generate Puppeteer tests based on existing application code and user flows.

## Tasks

### 6.1 Analyze Existing Test Patterns
- [ ] Extract patterns from current Playwright tests
- [ ] Document common test scenarios
- [ ] Identify reusable test templates
- [ ] Map test data requirements

### 6.2 Create Test Generation Templates
- [ ] Build templates for registration flow tests
- [ ] Create payment flow test templates
- [ ] Design ticket selection test patterns
- [ ] Develop form validation templates

### 6.3 Implement Claude Code Commands
- [ ] Create "Generate test from component" command
- [ ] Build "Convert Playwright to Puppeteer" command
- [ ] Implement "Generate test from user story" command
- [ ] Add "Generate visual regression test" command

### 6.4 Test Generation Workflow
- [ ] Document Claude Code prompts for test generation
- [ ] Create test generation best practices
- [ ] Build test naming conventions
- [ ] Establish test organization structure

## Test Generation Examples

### Component-Based Test Generation
```typescript
// Claude prompt: "Generate Puppeteer test for RegistrationWizard component"
describe('Registration Wizard', () => {
  test('should complete individual registration flow', async () => {
    // Generated test code based on component analysis
  });
});
```

### User Story Test Generation
```typescript
// Claude prompt: "Generate test for: As a Mason, I want to register for Grand Installation"
describe('Mason Registration Flow', () => {
  test('Mason can register for Grand Installation event', async () => {
    // Generated test based on user story
  });
});
```

## Expected Outputs
- Test generation templates
- Claude Code command library
- Generated test examples
- Best practices documentation

## Success Criteria
- Tests generated match existing patterns
- Generated tests are maintainable
- Coverage improves significantly
- Team adopts generation workflow