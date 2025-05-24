# Attendee Form Spacing Issue

## Issue Description
There is excessive vertical spacing between the form header and the first row of input fields on attendee forms, creating an unprofessional appearance.

## Visual Description
- Large visible gap between bottom of form header and top of field labels
- Spacing appears inconsistent with other form sections
- Creates visual disconnect between header and form content

## Affected Areas
- All attendee form types (Mason, Guest)
- Both individual and partner sections
- Appears across all registration types (Individuals, Delegations, Lodges)

## Expected Behavior
- Consistent, professional spacing between form sections
- Visual continuity between header and form fields
- Spacing should match design system standards

## Actual Behavior
- Excessive gap creating visual separation
- Inconsistent with overall form design
- Reduces perceived quality of the interface

## Affected Components
- Attendee form layouts
- Form section headers
- CSS/Tailwind spacing classes

## Priority
Medium - Visual/UX issue affecting professional appearance

## Suggested Fix
- Review and adjust margin/padding classes on form headers
- Ensure consistent spacing units across all forms
- Consider using design system spacing tokens

## Resolution Summary
Fixed the excessive vertical spacing between form headers and input fields by adjusting the spacing classes in the attendee form components.

### Changes Made:
1. Updated GuestForm component: Changed `space-y-6` to `space-y-4` (reduced from 24px to 16px gap)
2. Updated MasonForm component: Changed `space-y-6` to `space-y-4` in both desktop and mobile layouts
3. Maintained consistent spacing across both form types

The changes reduce the visual gap while maintaining proper separation between form sections. The reduction from 1.5rem (24px) to 1rem (16px) creates a more cohesive and professional appearance without making the forms feel cramped.

Container-level forms (IndividualsForm, LodgesForm, DelegationsForm) were left unchanged as they use the larger spacing appropriately for card-based layouts.