# Payment Step Summary Component Formatting Issues

## Issue Description
The payment step summary component lacks proper structure and formatting, making it difficult for users to review their order details before payment. The summary should clearly show attendee-level breakdowns and totals, with proper formatting for payment status and security indicators.

## Current Issues
- No clear breakdown by attendee
- Missing ticket/package details per attendee
- Poor formatting of payment status and secure payment indicators
- Lack of hierarchical information structure

## Expected Format

### Summary Structure Should Display:

**Individual Attendee Breakdown:**
```
Attendee: John Smith (Mason)
  - Grand Installation Package: $250.00
  - Welcome Reception: $75.00
  Subtotal: $325.00

Attendee: Jane Doe (Partner)
  - Partner Package: $200.00
  Subtotal: $200.00

Attendee: Robert Johnson (Guest)
  - Individual Tickets:
    - Installation Ceremony: $150.00
    - Gala Dinner: $100.00
  Subtotal: $250.00
```

**Order Totals:**
```
Total Attendees: 3
Total Tickets: 5
Amount Due: $775.00
```

**Payment Information:**
- Payment Status: [Properly formatted status indicator]
- Secure Payment: [Properly formatted security badge/icon]

## Specific Formatting Requirements

### Attendee Section
- Clear attendee name with type in parentheses
- Indented ticket/package list under each attendee
- Individual subtotals per attendee
- Clear visual separation between attendees

### Totals Section
- Clear labels for each total type
- Proper currency formatting
- Visual emphasis on final amount due

### Payment Status Section
- Consistent status indicator styling
- Clear secure payment badge/icon
- Proper alignment and spacing

## Impact
- **Purchase Confidence**: Users cannot clearly review what they're paying for
- **Error Prevention**: Difficult to spot incorrect selections
- **Trust**: Poor formatting of security indicators reduces payment confidence
- **User Experience**: Frustrating final step in registration process

## Affected Components
- Payment step summary component
- Order summary rendering logic
- Payment status indicators
- Secure payment badge display

## Priority
High - Directly affects payment conversion and user trust

## Suggested Implementation
1. Implement hierarchical data structure for attendee → tickets display
2. Add proper indentation and visual hierarchy
3. Use consistent currency formatting throughout
4. Design clear payment status indicators
5. Add security badge with proper styling
6. Ensure responsive design for mobile payments

## Technical Considerations
- May need to restructure summary data model
- Implement reusable currency formatting utilities
- Create consistent status indicator components
- Ensure accessibility for screen readers
- Consider print-friendly formatting for receipts