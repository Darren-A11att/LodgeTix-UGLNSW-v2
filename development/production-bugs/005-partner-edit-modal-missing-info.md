# Partner Edit Modal Missing Basic Info

## Issue Description
When using the Edit Attendee Modal for partners, the Basic Info section for Partner Guests is not displayed in the modal form, preventing users from viewing or editing partner details.

## Steps to Reproduce
1. Register an attendee with a partner
2. Navigate to a step where attendees can be edited
3. Click edit on a partner attendee
4. Observe that Basic Info fields are missing from the modal

## Expected Behavior
Edit modal should display all partner information including:
- Basic Info (name, title, etc.)
- Contact details
- Any other relevant partner fields

## Actual Behavior
- Basic Info section is missing entirely
- Only partial partner information is shown
- Users cannot edit partner personal details

## Impact
- Cannot correct partner information after initial entry
- Frustrating user experience
- Potential for incorrect data to remain in system
- Accessibility concern for users who need to update information

## Affected Components
- AttendeeEditModal component
- Partner form rendering logic
- Modal form field configuration

## Priority
High - Prevents users from editing critical information

## Suggested Fix
- Ensure partner form fields are properly included in edit modal
- Check conditional rendering logic for partner vs regular attendee
- Verify form field mapping for partner attendees