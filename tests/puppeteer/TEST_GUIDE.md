# LodgeTix Puppeteer Test Suite Guide

## What We're Testing

LodgeTix is an event ticketing platform for Masonic events. Our tests ensure that users can successfully register for events, purchase tickets, and receive confirmations. We test the entire user journey from browsing events to receiving their tickets.

## Test Categories Explained

### 1. Smoke Tests (Quick Health Checks)
**Purpose**: Verify the application is running and basic functionality works

#### `setup-verification.spec.js`
- **What it tests**: Basic app setup and configuration
- **Why it matters**: Ensures the app starts correctly
- **Key checks**:
  - Homepage loads
  - Environment variables are set
  - Basic navigation works
  - Database connection is active

#### `basic-registration.spec.js`
- **What it tests**: Simple registration flow
- **Why it matters**: Core functionality must always work
- **Key checks**:
  - Can navigate to registration
  - Form displays correctly
  - Basic form submission works

### 2. Critical Tests (Must-Work Features)
**Purpose**: Test features that directly impact revenue and user trust

#### `payment-flow.spec.js`
- **What it tests**: Stripe payment processing
- **Why it matters**: Users must be able to pay for tickets
- **Key checks**:
  - Credit card form loads
  - Payment processes successfully
  - Handles payment errors gracefully
  - Correct amounts are charged
  - Payment confirmations are received

#### `confirmation-flow.spec.js`
- **What it tests**: Post-payment confirmation experience
- **Why it matters**: Users need proof of purchase
- **Key checks**:
  - Confirmation number is generated
  - QR code displays correctly
  - Tickets can be downloaded as PDF
  - Confirmation email is sent
  - Payment receipt is accurate

### 3. End-to-End Tests (Complete User Journeys)
**Purpose**: Test full workflows as real users would experience them

#### `individual-registration.spec.js`
- **What it tests**: Single person registering for an event
- **User story**: "As an individual, I want to register myself for an event"
- **Complete flow**:
  1. Browse to event
  2. Select "Individual" registration
  3. Enter personal details
  4. Select tickets
  5. Review order
  6. Make payment
  7. Receive confirmation

#### `lodge-registration.spec.js`
- **What it tests**: Lodge group registrations
- **User story**: "As a lodge secretary, I want to register multiple members"
- **Complete flow**:
  1. Select "Lodge" registration
  2. Choose Grand Lodge and Lodge
  3. Add multiple members with roles (Worshipful Master, etc.)
  4. Handle partners/spouses
  5. Bulk import members from CSV
  6. Select tickets for each person
  7. Complete payment for entire group

#### `delegation-registration.spec.js`
- **What it tests**: Official delegation registrations
- **User story**: "As a delegation organizer, I want to register our official group"
- **Complete flow**:
  1. Select "Delegation" registration
  2. Choose delegation type (official/unofficial)
  3. Select Grand Lodge representation
  4. Add delegation members and Grand Officers
  5. Manage complex ticket arrangements
  6. Process group payment

### 4. Functional Tests (Feature-Specific Testing)
**Purpose**: Deep-dive into specific features and quality aspects

#### `ticket-selection.spec.js`
- **What it tests**: Ticket selection interface
- **Why it matters**: Users need to understand pricing and availability
- **Key checks**:
  - Ticket types display correctly
  - Prices are accurate
  - Availability limits work
  - Order summary updates in real-time
  - Discounts apply correctly

#### `self-healing-demo.spec.js`
- **What it tests**: Test resilience to UI changes
- **Why it matters**: Tests shouldn't break when UI is updated
- **Key checks**:
  - Tests adapt to changed selectors
  - Multiple strategies to find elements
  - Automatic healing when elements move

#### `accessibility.spec.js`
- **What it tests**: WCAG 2.1 compliance
- **Why it matters**: Application must be usable by everyone
- **Key checks**:
  - Keyboard navigation works
  - Screen readers can understand content
  - Color contrast meets standards
  - Focus indicators are visible
  - Form labels are properly associated
  - Error messages are announced
  - Landmark regions are defined

#### `visual-regression.spec.js`
- **What it tests**: UI consistency
- **Why it matters**: Prevent unexpected visual changes
- **Key checks**:
  - Components look correct
  - Responsive design works
  - Dark mode displays properly
  - Loading states are consistent
  - Error states display correctly

#### `form-validation.spec.js`
- **What it tests**: All form validation rules
- **Why it matters**: Prevent bad data and guide users
- **Key checks**:
  - Required fields are enforced
  - Email format validation
  - Phone number validation
  - Mason-specific fields (registration numbers)
  - Partner information validation
  - Billing address validation
  - Real-time validation feedback

## What Makes Our Tests Special

### 1. Self-Healing Capabilities
Our tests automatically adapt when the UI changes. If a button moves or its ID changes, the test tries multiple strategies to find it:
- By ID
- By data-testid
- By CSS class
- By XPath
- By text content
- By visual appearance

### 2. Claude Code Integration
Tests can be generated and maintained using Claude Code commands:
```bash
claude > generate test for new feature
claude > fix failing test
claude > analyze test coverage
```

### 3. Comprehensive Evidence Collection
Every test captures:
- Screenshots at each major step
- Screenshots on failure
- Performance metrics
- Console logs
- Network requests

### 4. Real-World Test Data
Tests use realistic data:
- Actual Grand Lodge names
- Valid Australian phone numbers
- Proper Masonic titles and ranks
- Realistic member counts
- Actual event information

## Understanding Test Results

### When Tests Pass ✅
- The feature works as expected
- Users can complete their journey
- Data is saved correctly
- Payments process successfully

### When Tests Fail ❌
Common reasons:
1. **UI Changed**: Element moved or renamed
2. **API Error**: Backend service issue
3. **Validation Changed**: New required field
4. **Performance Issue**: Timeout waiting for elements
5. **Data Issue**: Test data no longer valid

### Reading Test Output
```bash
PASS  specs/smoke/setup-verification.spec.js
  ✓ loads the homepage (2341 ms)
  ✓ displays navigation menu (1523 ms)

FAIL  specs/critical/payment-flow.spec.js
  ✕ processes credit card payment (30124 ms)
    Expected: Payment successful
    Received: Payment declined
    Screenshot: screenshots/payment-error.png
```

## Running Tests Locally

### Run all tests:
```bash
cd tests/puppeteer
npm test
```

### Run specific categories:
```bash
npm run test:smoke      # Quick checks (2-3 min)
npm run test:critical   # Payment & confirmation (5 min)
npm run test:functional # Features & quality (10 min)
npm run test:e2e       # Full workflows (15 min)
```

### Debug a failing test:
```bash
npm run test:debug
# Browser will open and pause at breakpoints
```

### See tests run (not headless):
```bash
npm run test:headed
# Watch the browser automation
```

## Common Test Scenarios

### 1. New User Registration
- First-time visitor
- No existing account
- Completes full registration
- Receives welcome email

### 2. Returning User
- Has registered before
- Email pre-filled
- Faster checkout

### 3. Group Organizer
- Registers multiple people
- Manages dietary requirements
- Handles special accommodations
- Bulk operations

### 4. Edge Cases
- Payment decline
- Sold out events
- Network errors
- Invalid data
- Session timeout

## Test Maintenance

### When to Update Tests:
1. **New Feature**: Add corresponding test
2. **Bug Fix**: Add test to prevent regression
3. **UI Redesign**: Update selectors and screenshots
4. **Validation Change**: Update test data
5. **API Change**: Update expected responses

### Best Practices:
1. Use `data-testid` attributes for stable selectors
2. Keep tests independent (no shared state)
3. Use realistic test data
4. Clean up test data after runs
5. Take screenshots for evidence
6. Write clear test descriptions

## Why These Tests Matter

1. **User Confidence**: Ensure users can always register and pay
2. **Revenue Protection**: Payment flow must never break
3. **Accessibility**: Events accessible to all Masons
4. **Quality Assurance**: Catch bugs before users do
5. **Regression Prevention**: Changes don't break existing features
6. **Documentation**: Tests show how features should work

## Test Coverage Goals

- **Critical Paths**: 100% coverage
- **User Workflows**: All major scenarios
- **Edge Cases**: Common error scenarios
- **Accessibility**: WCAG 2.1 AA compliance
- **Performance**: Page load under 3 seconds
- **Cross-browser**: Chrome, Firefox, Safari