# PRD: Fix "raw_id" Column Error in Individual Registration

## Problem Statement
The individual registration flow is failing during payment processing with the error:
- **Error**: `Failed to create registration: column "raw_id" does not exist`
- **HTTP Status**: 500 Internal Server Error
- **Endpoint**: `POST /api/registrations/individuals`

## Error Context
The error occurs when:
1. User completes individual registration form
2. User enters payment details
3. System attempts to save registration data
4. API call to create registration fails with "raw_id" column not found

## Stack Trace
```
registration-wizard.tsx:783 - POST request fails
payment-step.tsx:485 - handlePaymentMethodCreated
CheckoutForm.tsx:93 - createPaymentMethod
CheckoutForm.tsx:123 - handleButtonClick
```

## Expected Behavior
- Registration data should be saved successfully to the database
- Payment processing should continue after registration is saved
- No database column errors should occur

## Technical Analysis
Based on previous fixes:
- There was a migration to fix "id" → "raw_id" column naming
- The `raw_registrations` table should have a `raw_id` column
- The RPC function or API route may still be referencing the wrong column name

## Success Criteria
- Individual registration saves successfully without column errors
- Payment processing continues smoothly after registration save
- All registration types (individual, lodge, delegation) work correctly

## TODO Checklist
- [ ] Identify all references to "raw_id" in the codebase
- [ ] Check if migrations were applied correctly to the database
- [ ] Verify the actual database schema for raw_registrations table
- [ ] Fix any mismatches between code and database schema
- [ ] Test all registration flows to ensure no regression

## Questions for Clarification
1. Have all recent migrations been applied to your local database?
2. Are you running against a local or remote Supabase instance?
3. Did this error start occurring after the recent field mapping fixes?

## Implementation Plan
1. Investigate current database schema
2. Find all code references to raw_id
3. Determine if issue is in API route, RPC function, or migration
4. Apply appropriate fix
5. Test thoroughly across all registration types