# TODO-002: Update AttendeeDetails to use OneColumnStepLayout

## Objective
Update the AttendeeDetails step to use OneColumnStepLayout for all Official Delegation types (Lodge, Grand Lodge, and Masonic Order).

## Requirements
- Official Delegations should use OneColumnStepLayout
- Individual registrations should continue using TwoColumnStepLayout
- All delegation subtypes should use the same layout

## Implementation Details

### Changes Made
1. **Updated layout selection logic in AttendeeDetails.tsx**:
   - Changed from `registrationType === 'lodge'` to `registrationType === 'delegation'`
   - This ensures all delegation types use OneColumnStepLayout
   - Individual registrations continue to use TwoColumnStepLayout with summary

2. **Added delegationType to component state**:
   - Imported delegationType from useRegistrationStore
   - Enables future delegation-specific logic if needed

3. **Code cleanup**:
   - Removed unused imports for GrandLodgesForm and MasonicOrdersForm
   - Maintained clean, focused implementation

## Result
All Official Delegation registrations now use the full-width OneColumnStepLayout, providing more space for the complex delegation forms while individual registrations maintain their two-column layout with summary sidebar.

## Status: ✅ COMPLETED