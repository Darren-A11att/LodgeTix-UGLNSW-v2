# TODO-003: Payment Form & Billing Details Migration

## Overview
Update payment form to work with simplified contact model instead of separate billing entity.

## Current Implementation
- **Location**: `/components/register/RegistrationWizard/payment/BillingDetailsForm.tsx`
- **Data structure**:
  - Separate billing details object
  - Duplicates attendee information
  - Complex validation rules

## New Schema Changes
- **Simplified approach**:
  - Billing details are part of primary contact
  - No separate billing entity
  - Reuse contact information

## Migration Tasks
- [ ] Update BillingDetailsForm to use contact data
- [ ] Add option to use primary contact as billing contact
- [ ] Simplify form fields and validation
- [ ] Update data submission format
- [ ] Remove redundant field mappings

## UI/UX Changes
```typescript
// Old: Separate billing form
{
  billingDetails: {
    firstName: '',
    lastName: '',
    emailAddress: '',
    mobileNumber: '',
    address: { ... }
  }
}

// New: Use primary contact with override option
{
  usePrimaryContactForBilling: true,
  billingContactOverride: null | {
    // Only if different from primary
  }
}
```

## Form Updates
- [ ] Add "Use primary contact for billing" checkbox
- [ ] Auto-populate from primary contact
- [ ] Show override fields only when needed
- [ ] Simplify validation logic
- [ ] Update field names to match new schema

## Testing Requirements
- [ ] Test auto-population from primary contact
- [ ] Test manual billing details entry
- [ ] Test form validation
- [ ] Test data submission format
- [ ] Verify Stripe integration still works