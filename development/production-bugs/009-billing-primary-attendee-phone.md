# Billing Details Phone Number Population Bug

## Issue Description
When selecting "Bill to primary attendee" in the billing details form, the phone number does not populate in the mobile number field. Ironically, the phone number only appears after deselecting the "Bill to primary attendee" option.

## Steps to Reproduce
1. Navigate to payment step in registration wizard
2. Reach billing details form
3. Click/check "Bill to primary attendee" option
4. Observe that mobile number field remains empty
5. Uncheck "Bill to primary attendee" option
6. Observe that mobile number now appears in the field

## Expected Behavior
- When "Bill to primary attendee" is selected:
  - All primary attendee details should populate immediately
  - Including name, email, phone number, and address
  - Fields should be read-only while option is selected

## Actual Behavior
- Phone number field remains empty when option is selected
- Phone number paradoxically appears only after deselecting the option
- Other fields may populate correctly while phone does not

## Impact
- Confusing user experience
- Users may manually enter phone numbers unnecessarily
- Potential for incorrect billing information
- Breaks expected autofill functionality

## Root Cause Analysis
Likely issues:
- State update timing issue
- Incorrect field mapping for phone number
- Form state not properly syncing with checkbox state
- Possible race condition in data population

## Affected Components
- BillingDetailsForm component
- Primary attendee data mapping
- Form state management
- Checkbox event handlers

## Priority
High - Core functionality issue affecting payment flow

## Suggested Fix
1. Review checkbox onChange handler logic
2. Ensure phone number is included in field mapping
3. Check for state update timing issues
4. Verify data flow from primary attendee to billing form
5. Add proper field population on checkbox selection