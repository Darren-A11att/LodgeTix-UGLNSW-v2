# TODO-008: Print-Friendly Lists

## Overview
Generate print-optimized layouts for common event needs like door lists and table assignments.

## Acceptance Criteria
- [ ] Print attendee list (alphabetical)
- [ ] Print check-in list with checkboxes
- [ ] Include event header on all pages
- [ ] Page breaks at logical points
- [ ] Remove UI elements when printing
- [ ] A4 paper optimization
- [ ] Option for large text (elderly volunteers)

## Print Templates
1. **Door List**
   - Name, ticket type, table (if assigned)
   - Checkbox for manual check-in
   - Alphabetical order
   
2. **Dietary Summary**
   - Grouped by dietary requirement
   - Count per requirement
   - Names listed under each
   
3. **VIP/Special Guest List**
   - Filtered by attendee type
   - Include titles and lodge info

## Technical Requirements
- CSS print media queries
- Hide navigation and buttons
- Add page headers/footers
- Optimize for black & white printing
- Test on common printers

## Why This Next
Many lodges still use paper lists at events.

## Definition of Done
- Prints cleanly on A4 paper
- No cut-off content
- Clear and readable
- Includes essential info only