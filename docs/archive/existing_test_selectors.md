# Existing Test Selectors

## Overview
This document catalogs all test selectors used in the LodgeTix-UGLNSW-v2 E2E test suite. The project uses Playwright for testing and follows a mix of selector strategies including test IDs, ARIA roles, labels, and text content.

## Selector Strategy

### 1. Primary Strategies
- **Test IDs**: `data-testid` attributes for unique identification
- **ARIA Roles**: `getByRole()` for semantic elements
- **Labels**: `getByLabel()` for form inputs
- **Text Content**: `getByText()` or `:has-text()` for content-based selection

### 2. Naming Conventions
- Test IDs use kebab-case: `registration-type-individual`
- Descriptive names that reflect the element's purpose
- Consistent prefixes for related elements

## Page-Specific Selectors

### Registration Type Page

#### Test IDs
```typescript
registration-type-individual    // Individual registration option
registration-type-lodge        // Lodge registration option  
registration-type-delegation   // Delegation registration option
```

#### Role-Based
```typescript
button: { name: /continue|next/i }  // Continue/Next button
```

### Attendee Details Page

#### Labels
```typescript
'First Name'                    // First name input
'Last Name'                     // Last name input
'Email'                         // Email input
'Rank'                          // Mason rank select
'Grand Lodge'                   // Grand Lodge select
'Lodge'                         // Lodge select
/Are you a Freemason/i          // Mason toggle
/Add Partner/i                  // Partner toggle
/Dietary Requirements/i         // Dietary requirements input
/Special Needs/i               // Special needs input
```

#### Test IDs
```typescript
phone-input                     // Phone number input
partner-form                    // Partner form section
```

#### Element Selectors
```typescript
select[name="grandLodge"]:not([disabled])  // Enabled grand lodge select
select[name="lodge"]:not([disabled])       // Enabled lodge select
```

### Payment Page

#### Test IDs
```typescript
order-summary                   // Order summary section
total-amount                    // Total amount display
billing-form                    // Billing form section
phone-input                     // Phone number input
card-element                    // Stripe card element
payment-error                   // Payment error message
```

#### Labels
```typescript
'Name on card'                  // Cardholder name input
'Email'                         // Email input
'Address'                       // Address line 1 input
'Address line 2'                // Address line 2 input
'Suburb'                        // Suburb/City input
'State'                         // State select
'Postcode'                      // Postcode input
'Country'                       // Country select
```

#### Role-Based
```typescript
button: { name: /Pay|Complete|Place Order/i }  // Payment button
button: { name: /Back/i }                       // Back button
```

### Ticket Selection Page

#### Test IDs
```typescript
ticket-list                     // Container for all tickets
ticket-item                     // Individual ticket item
ticket-quantity-input           // Quantity input for tickets
ticket-price                    // Ticket price display
total-amount                    // Total amount display
```

#### Content-Based
```typescript
[data-testid="ticket-item"]:has-text("${ticketName}")  // Ticket by name
```

### Order Review Page

#### Test IDs
```typescript
order-summary                   // Order summary section
attendee-summary                // Attendee details summary
ticket-summary                  // Selected tickets summary
total-amount                    // Total amount display
edit-attendees                  // Edit attendees button
edit-tickets                    // Edit tickets button
```

### Confirmation Page

#### Test IDs
```typescript
confirmation-number             // Confirmation number display
registration-summary            // Registration summary section
download-tickets                // Download tickets button
print-tickets                   // Print tickets button
email-confirmation              // Email confirmation message
```

### Lodge Details Page

#### Test IDs
```typescript
lodge-search                    // Lodge search input
lodge-select                    // Lodge selection dropdown
representative-name             // Representative name input
representative-email            // Representative email input
representative-phone            // Representative phone input
number-of-tables                // Number of tables input
special-requirements            // Special requirements textarea
```

### Delegation Details Page

#### Test IDs
```typescript
delegation-type                 // Delegation type select
delegation-name                 // Delegation name input
leader-details                  // Leader details section
member-list                     // Delegation members list
add-member                      // Add member button
remove-member                   // Remove member button
member-form                     // Member details form
```

## Common Patterns

### Form Inputs
```typescript
// Text inputs typically use labels
getByLabel('Field Name')

// Phone inputs consistently use test ID
getByTestId('phone-input')

// Select dropdowns use labels
getByLabel('Select Field')
```

### Buttons
```typescript
// Navigation buttons use role with regex
getByRole('button', { name: /continue|next/i })
getByRole('button', { name: /back|previous/i })

// Action buttons use specific text
getByRole('button', { name: 'Save' })
getByRole('button', { name: 'Cancel' })
```

### Sections and Containers
```typescript
// Major sections use test IDs
[data-testid="section-name"]

// Forms use descriptive test IDs
[data-testid="form-type-form"]
```

### Dynamic Content
```typescript
// Items in lists combine test ID with content
[data-testid="item-type"]:has-text("Specific Item")

// Status-based selectors
[data-testid="element"]:not([disabled])
[data-testid="element"][aria-checked="true"]
```

## Best Practices

### 1. Selector Priority
1. Use `data-testid` for elements that need reliable selection
2. Use semantic selectors (role, label) for accessibility testing
3. Avoid CSS selectors unless absolutely necessary
4. Use text content only for user-visible elements

### 2. Selector Stability
- Test IDs should remain stable across refactors
- Avoid positional selectors (nth-child, etc.)
- Use unique identifiers for dynamic content
- Prefer explicit waits over implicit timing

### 3. Maintainability
- Document non-obvious selectors
- Group related selectors in page objects
- Use constants for frequently used selectors
- Keep selectors close to their usage

## Accessibility Considerations

### ARIA Labels
```typescript
// Ensure interactive elements have accessible names
getByRole('button', { name: 'Descriptive Action' })
getByRole('textbox', { name: 'Field Purpose' })
```

### Form Labels
```typescript
// All form inputs should have associated labels
getByLabel('Visible Label Text')
```

### Semantic HTML
```typescript
// Prefer semantic roles over generic selectors
getByRole('navigation')
getByRole('main')
getByRole('complementary')
```

## Testing Tips

### 1. Waiting for Elements
```typescript
// Wait for specific state
await page.waitForSelector('[data-testid="element"]:visible');
await page.waitForSelector('button:not([disabled])');
```

### 2. Debugging Selectors
```typescript
// Use Playwright inspector
await page.pause();

// Log element count
const count = await page.locator('[data-testid="item"]').count();
console.log(`Found ${count} items`);
```

### 3. Handling Dynamic Content
```typescript
// Wait for content to stabilize
await page.waitForLoadState('networkidle');
await page.waitForTimeout(500); // Use sparingly
```

## Future Improvements

1. **Standardize Test IDs**: Ensure all interactive elements have test IDs
2. **Component Testing**: Add test IDs to reusable components
3. **Selector Documentation**: Generate selector documentation from code
4. **Visual Testing**: Add visual regression test selectors
5. **Performance Markers**: Add test IDs for performance measurement points