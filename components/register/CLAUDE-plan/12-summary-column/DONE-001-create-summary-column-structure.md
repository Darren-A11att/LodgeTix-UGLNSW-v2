# Summary Column Structure

## Objective
Create a consistent structure for the second column content across all registration wizard steps. This will ensure a cohesive user experience and establish patterns that users can easily understand as they progress through the wizard.

## Tasks
1. Define a common layout structure for all summary components
2. Create reusable components for common elements:
   - Section dividers
   - Summary section headers
   - Summary item components
   - Action links/buttons
3. Implement responsive behavior for mobile views
4. Create a documentation guide for summary column usage

## Implementation Details
- Design a consistent visual hierarchy:
  - Section titles (e.g., "Registration Type", "Attendees", "Tickets")
  - Item listings with appropriate icons
  - Action links/buttons with consistent styling
  - Progress indicators
- Ensure the structure supports different content types:
  - Lists of attendees/tickets
  - Cost breakdowns
  - Status indicators
  - Informational content

## Dependencies
- Existing TwoColumnStepLayout component
- UI component library

## Technical Notes
- The component should maintain a consistent width
- It should handle scrolling for overflow content
- Mobile view should provide a toggle to show/hide the summary
- Consider sticky positioning for desktop view