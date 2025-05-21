# Ticket Selection Summary Content

## Objective
Create a dynamic order summary component for the ticket selection step that helps users track costs, ticket selections, and ensures all attendees have appropriate tickets.

## Tasks
1. Create a real-time order summary with running total
2. Implement per-attendee ticket selection status tracking
3. Add a price breakdown section with taxes and fees
4. Develop a packages/discounts information section

## Implementation Details
- Order summary features:
  - Line items for each selected ticket
  - Grouped by attendee/ticket type
  - Running subtotal, taxes, fees, and grand total
  - Visual indicators for changes (animations for price updates)
  
- Attendee ticket status:
  - List of all attendees with ticket selection status
  - Warnings for attendees without tickets
  - Icons for ticket types assigned to each attendee
  
- Price breakdown:
  - Itemized list of all costs
  - Subtotal for ticket costs
  - Any applicable taxes and fees
  - Calculated total with clear formatting
  
- Discounts and packages:
  - Available package options
  - Applied discounts
  - Potential savings opportunities
  - Package recommendations based on selections

## Visual Elements
- Currency formatting for all prices
- Color-coded status indicators for ticket selections
- Collapsible sections for detailed breakdowns
- Visual cues for price changes (animations, color changes)

## Dependencies
- Registration store to access attendee and ticket data
- Ticket pricing service/calculations
- UI components for pricing displays
- Animation components for price changes

## Technical Notes
- Summary should update in real-time as users select tickets
- Consider adding tooltips for price explanations
- Include a "best value" indicator for package options
- Ensure all pricing calculations match backend logic
- Display payment methods and security indicators