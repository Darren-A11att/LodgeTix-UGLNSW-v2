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

## Resolution Summary
Fixed the issue by updating the ContactInfo component to use immediate updates when changing contact preferences. The problem was caused by debounced updates (300ms delay) in the form fields, which meant that when users changed the contact preference from "Directly" to "Provide details later", the email and phone fields were not immediately cleared and hidden.

### Changes Made:
1. Updated ContactInfo component to use `onChangeImmediate` callback for contact preference changes
2. Modified GuestForm to pass `updateFieldImmediate` function from useAttendeeDataWithDebounce hook
3. Ensured that email and phone fields are immediately cleared when switching away from "Directly" option

The fix ensures that:
- Fields are hidden immediately when "provide details later" is selected
- Previously entered values are cleared right away
- No validation errors occur for fields that should be optional
- The UI updates without delay, providing better user experience

Note: MasonForm already had this fix implemented correctly.