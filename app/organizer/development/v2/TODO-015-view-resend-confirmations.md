# TODO-015: View and Resend Confirmations

## Overview
Allow organizers to view original confirmation emails and resend them.

## Acceptance Criteria
- [ ] View original confirmation email
- [ ] Resend to original email
- [ ] Send to alternate email
- [ ] Update with current details
- [ ] Include tickets if applicable
- [ ] Track resend history
- [ ] Show delivery status

## Confirmation Features
1. **View Original**
   - Show what was sent
   - When it was sent
   - Delivery status
   
2. **Resend Options**
   - As-is to same email
   - Updated version
   - To different email
   - With current tickets

3. **Tracking**
   - Number of resends
   - Who requested
   - Delivery confirmation

## Technical Requirements
- Store original email content
- Regenerate with current data
- Handle email changes
- Track delivery
- Prevent email loops

## Why This Next
"I didn't get my confirmation" is a common request.

## Definition of Done
- Can view original email
- Resend works reliably
- Updated info included
- Delivery tracked
- No duplicate sends