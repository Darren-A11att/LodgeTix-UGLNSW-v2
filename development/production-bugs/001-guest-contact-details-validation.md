# Guest Contact Details Validation Bug

## Issue Description
When registering Guests (either as standalone Guests or as Partners), changing the contact preference option doesn't properly hide/show email and phone fields when switching to "provide details later".

## Steps to Reproduce
1. Navigate to registration form (Myself & Others / Individuals)
2. Add a Guest or a Partner to an attendee
3. Initially select "provide contact details directly"
4. Fill in email and phone number fields
5. Change selection to "provide details later"
6. Observe that email and phone fields remain visible and editable

## Expected Behavior
- When "provide details later" is selected, email and phone fields should:
  - Be hidden from view
  - Not be required for form validation
  - Clear any previously entered values

## Actual Behavior
- Email and phone fields remain visible
- Fields still accept input
- "Provide details later" option doesn't properly disable field validation

## Affected Components
- Guest form layouts
- Partner form sections
- Form validation logic for contact details

## Priority
High - Affects data collection and user experience

## Impact
- Confusing user experience
- Potential for collecting unnecessary data
- Validation errors when users expect fields to be optional