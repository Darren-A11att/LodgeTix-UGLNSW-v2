# TODO-012: Process Refund

## Overview
Enable organizers to process full or partial refunds for registrations.

## Acceptance Criteria
- [ ] "Process Refund" button on registration
- [ ] Full refund option
- [ ] Partial refund with amount input
- [ ] Refund reason required
- [ ] Email notification to attendee
- [ ] Update registration status
- [ ] Show refund history

## Refund Flow
1. **Initiate Refund**
   - Select registration
   - Choose full/partial
   - Enter amount if partial
   - Provide reason
   
2. **Confirmation**
   - Show amount to refund
   - Warn if event is soon
   - Require confirmation
   
3. **Process**
   - Call Stripe refund API
   - Update database
   - Send notification
   - Log action

## Technical Requirements
- Integrate with Stripe refunds
- Handle platform fee adjustment
- Atomic transaction (all or nothing)
- Audit trail for compliance
- Cannot refund more than paid

## Why This Next
High-impact customer service feature.

## Definition of Done
- Refunds process successfully
- Email notifications sent
- Database updated correctly
- Platform fees adjusted
- History tracked