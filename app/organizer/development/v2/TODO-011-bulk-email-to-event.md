# TODO-011: Bulk Email to Event Attendees

## Overview
Send email updates to all attendees of an event (or filtered subset).

## Acceptance Criteria
- [ ] "Email All Attendees" button on event page
- [ ] Filter by payment status
- [ ] Filter by attendee type
- [ ] Preview recipient count before sending
- [ ] Schedule for later sending
- [ ] Track open rates
- [ ] Prevent duplicate sends

## Bulk Email Features
1. **Templates**
   - Event update
   - Reminder
   - Venue change
   - Cancellation
   
2. **Personalization**
   - Merge attendee name
   - Include ticket details
   - Payment status

3. **Safety Features**
   - Confirm recipient count
   - Test mode (send to self)
   - Gradual sending (not all at once)

## Technical Requirements
- Queue system for large sends
- Prevent timeout issues
- Track delivery status
- Handle unsubscribes
- Respect communication preferences

## Why This Next
Organizers need to communicate event changes efficiently.

## Definition of Done
- Can send to 500+ recipients
- Delivery tracking works
- No duplicate sends
- Templates save time