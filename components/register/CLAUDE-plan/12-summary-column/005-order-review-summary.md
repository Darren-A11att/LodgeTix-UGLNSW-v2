# Order Review Summary Content

## Objective
Create a comprehensive order summary component for the review step that helps users verify all details are correct and provides easy access to make last-minute changes.

## Tasks
1. Design a complete order summary with all registration details
2. Create an attendee list with quick edit shortcuts
3. Implement a detailed payment summary
4. Add policy information for cancellation/refunds

## Implementation Details
- Complete order summary:
  - Registration type and event details
  - Total number of attendees
  - All tickets selected with prices
  - Special requests/accommodations
  - Billing information summary
  
- Attendee quick-edit:
  - Condensed view of all attendees
  - Status indicators for completion
  - Direct edit links for each attendee
  - Special request highlights
  
- Payment summary:
  - Detailed breakdown of all costs
  - Per-attendee and per-ticket itemization
  - Tax and fee calculations
  - Total amount to be charged
  
- Policies and information:
  - Cancellation policy summary
  - Refund conditions
  - Terms of service reminder
  - Privacy policy highlights

## Visual Elements
- Section dividers for different summary areas
- Edit icons with direct links to previous steps
- Warning indicators for any incomplete information
- Confirmation checkbox for final review

## Dependencies
- Registration store for all registration data
- Navigation controls to access edit functions
- Policy text and information
- UI components for sectioned layout

## Technical Notes
- All edit links should preserve current progress and return user to review step
- Consider adding a "print/save" option for record-keeping
- Include a final validation check with clear error indicators
- Ensure all sensitive information is appropriately masked