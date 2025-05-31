# Puppeteer Test Coverage Gaps - Quick Reference

## Test Coverage Matrix

| Feature/Workflow | Playwright | Puppeteer | Status |
|-----------------|------------|-----------|---------|
| **Registration Flows** |
| Individual Registration | ✅ Full + Visual | ✅ Basic E2E | ⚠️ Partial |
| Lodge Registration | ✅ Full + Visual | ⚠️ Placeholder | ❌ Insufficient |
| Delegation Registration | ✅ Full + Visual | ❌ None | ❌ Missing |
| **Core Features** |
| Authentication/Login | ✅ | ⚠️ Page load only | ❌ Insufficient |
| Payment Processing | ✅ | ✅ | ✅ OK |
| Ticket Selection | ✅ | ✅ | ✅ OK |
| Order Review | ✅ | ⚠️ Basic | ⚠️ Partial |
| Confirmation Page | ✅ | ❌ None | ❌ Missing |
| **Quality Assurance** |
| Form Validation | ✅ Comprehensive | ⚠️ Basic | ❌ Insufficient |
| Accessibility (a11y) | ✅ | ❌ None | ❌ Missing |
| Visual Regression | ✅ | ❌ Screenshots only | ❌ Missing |
| **Responsive Design** |
| Mobile Testing | ✅ | ✅ | ✅ OK |
| Tablet Testing | ✅ | ✅ | ✅ OK |
| Desktop Testing | ✅ | ✅ | ✅ OK |

## Critical Missing Tests

### 1. Delegation Registration (HIGH PRIORITY)
```javascript
// Need: specs/e2e/delegation-workflow.spec.js
- Grand Lodge delegation selection
- Masonic Orders selection
- Multiple delegate management
- Delegation-specific validation
```

### 2. Accessibility Testing (HIGH PRIORITY)
```javascript
// Need: specs/functional/accessibility.spec.js
- Keyboard navigation
- Screen reader support
- ARIA labels
- Focus management
- Color contrast
```

### 3. Confirmation Flow (HIGH PRIORITY)
```javascript
// Need: specs/e2e/confirmation-flow.spec.js
- Confirmation page display
- Registration details accuracy
- QR code generation
- Download ticket functionality
- Email confirmation trigger
```

### 4. Complete Authentication (MEDIUM PRIORITY)
```javascript
// Need: specs/functional/authentication.spec.js
- Full login flow
- Registration/signup
- Password reset
- Session management
- Logout functionality
```

### 5. Visual Regression (MEDIUM PRIORITY)
```javascript
// Need: Visual comparison framework
- Baseline screenshots
- Automated comparison
- Difference detection
- CI/CD integration
```

### 6. Form Validation Details (MEDIUM PRIORITY)
```javascript
// Need: specs/functional/form-validation.spec.js
- Required field validation
- Email format validation
- Phone number validation
- Mason-specific fields (lodge number, rank)
- Guest vs Mason form differences
- Error message display
```

## Test Count Comparison

| Test Suite | Playwright | Puppeteer | Gap |
|------------|------------|-----------|-----|
| Total Test Files | 12 | 6 | -6 |
| E2E Tests | 8 | 1 | -7 |
| Visual Tests | 3 | 0 | -3 |
| A11y Tests | 1 | 0 | -1 |
| Functional Tests | N/A | 2 | N/A |

## Minimum Required for Parity

To achieve equivalent coverage to Playwright, add these test files:

1. `specs/e2e/delegation-workflow.spec.js`
2. `specs/e2e/lodge-workflow.spec.js` (complete the placeholder)
3. `specs/e2e/confirmation-flow.spec.js`
4. `specs/functional/accessibility.spec.js`
5. `specs/functional/authentication.spec.js`
6. `specs/functional/form-validation.spec.js`
7. `specs/visual/visual-regression.spec.js`

## Risk Assessment

**Current Risk Level: HIGH** 🔴

Without the missing tests:
- Delegation registration could break unnoticed
- Accessibility issues won't be caught
- Visual UI regressions possible
- Form validation bugs likely
- Authentication issues may go undetected

## Recommendation

❌ **DO NOT remove Playwright tests until Puppeteer coverage is expanded**

The current Puppeteer test suite covers only ~60% of critical user workflows. Removing Playwright now would create significant regression risk.