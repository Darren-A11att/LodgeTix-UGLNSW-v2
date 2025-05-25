# TODO-006: Export Attendee List

## Overview
Enable exporting attendee lists in formats useful for different purposes (catering, badges, committee).

## Acceptance Criteria
- [ ] Export to CSV format
- [ ] Export to Excel format (.xlsx)
- [ ] Include all attendee fields
- [ ] Separate export for dietary requirements
- [ ] Option to export by attendee type
- [ ] Include summary counts in export
- [ ] Download happens in browser

## Export Templates
1. **Full Attendee List**
   - All fields for committee records
   
2. **Catering List**
   - Name, dietary requirements, special needs
   - Summary counts by dietary type
   
3. **Badge/Check-in List**
   - Name, organization, attendee type
   - Alphabetical by last name

4. **Contact List**
   - Name, email, phone
   - For emergency communications

## Technical Requirements
- Client-side export (no server load)
- Use existing libraries (xlsx, papa-parse)
- Include metadata (event name, date, export time)
- Handle large lists (500+ attendees)

## Why This Next
Immediate value - replaces manual spreadsheet work.

## Definition of Done
- Multiple export formats available
- Files open correctly in Excel
- Includes all necessary data
- Summary information included