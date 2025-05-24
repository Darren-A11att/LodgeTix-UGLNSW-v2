# Confirmation Step/Page Multiple Issues

## Issue Description
The confirmation step/page has multiple critical issues affecting the user's ability to complete their registration and receive proper documentation.

## Issue 1: Next Indicator Display
### Current Behavior
- Next/continue indicator is shown on confirmation page
- Creates confusion as confirmation is the final step

### Expected Behavior
- Hide the next indicator completely
- Remove the entire row from the layout to clean up the interface

## Issue 2: Download/Print Confirmation Not Working
### Current Behavior
- "Download Confirmation" button does not function
- "Print Confirmation" button does not function
- No PDF is generated or displayed

### Expected Behavior
- Download Confirmation: Generate and download PDF file
- Print Confirmation: Open PDF in new tab for printing
- PDF should be properly formatted as detailed below

### PDF Confirmation Format Requirements
Invoice-style presentation with registration data in a table format:

**Table Row Structure (Media Object Pattern):**
```
[QR Code] | Attendee Information              | Ticket Details
          | Title First Last Name            | 
          | (Rank/Grand Rank if Mason)       |
          | Contact: email@example.com       |
          | Dietary: Vegetarian              |
          | Assistance: Wheelchair access    |
          |                                  | > Grand Installation Package $250
          |                                  | > Welcome Reception $75
```

- QR Code: Based on attendee's UUID (left column)
- Attendee details: Center column with personal information
- Nested ticket rows: Under attendee name, right of QR code

## Issue 3: Tickets Tab Implementation
### Current Behavior
- Tickets tab exists but doesn't render individual tickets

### Expected Behavior
- Render one ticket card per attendee
- Card structure:
  ```
  ┌─────────────────────────────────┐
  │ HEADER: Title First Last Name   │
  │ (Rank/Grand Lodge if Mason)     │
  ├─────────────────────────────────┤
  │ BODY (2 columns: 20% | 80%)     │
  │ [QR Code] │ Tickets:            │
  │           │ • Package Name       │
  │           │ • Event Details      │
  │           │ • Date/Time/Venue    │
  └─────────────────────────────────┘
  ```

## Issue 4: Email Distribution System
### Requirements
Once confirmation PDF and tickets are properly generated:

1. **Individual Attendee Emails:**
   - Send only their specific ticket to each attendee
   - Use attendee's email if provided
   - If "contact via primary attendee": Send to primary attendee's email
   - If "provide details later": Queue for later sending

2. **Billing Contact Email:**
   - Send complete confirmation with all attendees
   - Include all tickets and registration details

3. **Email Content Structure:**
   - For individual attendees: Personal ticket only
   - For billing contact: Full registration confirmation
   - Subject line format: "Your Tickets - [Event Name]"

## Technical Implementation Notes

### QR Code Generation
- Use attendee UUID as QR code data
- Ensure QR codes are scannable at event check-in
- Consistent size across all documents

### PDF Generation
- Use proper PDF library (e.g., jsPDF, React-PDF)
- Ensure proper formatting and layout
- Include event branding/logos
- Make printer-friendly

### Email Service
- Queue emails appropriately
- Handle "provide details later" cases
- Track email delivery status
- Include proper email templates

## Priority
**Critical** - Core functionality for event registration completion

## Affected Components
- Confirmation step/page UI
- PDF generation service
- QR code generator
- Email service
- Ticket rendering components

## Success Criteria
1. Next indicator removed from confirmation page
2. Working download/print functionality with proper PDF format
3. Individual ticket cards generated per attendee
4. Automated email distribution based on contact preferences
5. All documents contain scannable QR codes with attendee UUIDs