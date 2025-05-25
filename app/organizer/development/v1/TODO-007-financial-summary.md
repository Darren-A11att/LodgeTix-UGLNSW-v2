# TODO-007: Financial Summary Report

## Overview
Provide a financial summary view for treasurers to report to committees.

## Acceptance Criteria
- [ ] Total revenue by event
- [ ] Breakdown by ticket type
- [ ] Number of paid vs pending
- [ ] Show platform fees (even though not connected yet)
- [ ] Export financial summary
- [ ] Date range filtering
- [ ] Print-friendly format

## Financial Metrics
1. **Revenue Summary**
   - Total collected
   - Total pending
   - Number of registrations
   
2. **By Ticket Type**
   - Quantity sold
   - Revenue per type
   - Average ticket price

3. **Payment Status**
   - Completed payments
   - Pending payments
   - Failed payments

## Technical Requirements
- Calculate from registrations table
- Include all fees in calculations
- Format currency appropriately (AUD)
- Group by event for multi-event orgs

## Why This Next
Treasurers need this for every committee meeting.

## Definition of Done
- Accurate financial totals
- Exportable to Excel
- Print-friendly layout
- Matches bank deposits (when connected)