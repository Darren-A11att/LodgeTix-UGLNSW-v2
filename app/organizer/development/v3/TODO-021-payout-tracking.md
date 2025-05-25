# TODO-021: Payout Tracking Dashboard

## Overview
Track all payouts from Stripe to bank account with reconciliation tools.

## Acceptance Criteria
- [ ] List all payouts
- [ ] Show status and dates
- [ ] Group by bank deposit
- [ ] Match to registrations
- [ ] Export for accounting
- [ ] Email notifications
- [ ] Failed payout alerts

## Payout Features
1. **Payout List**
   - Date initiated
   - Amount
   - Status
   - Expected arrival
   - Bank reference
   
2. **Reconciliation View**
   - Group payments by payout
   - Total matches bank
   - Download details
   - Mark as reconciled

3. **Notifications**
   - Payout initiated
   - Payout completed
   - Failed payouts
   - Weekly summary

## Technical Requirements
- Real-time Stripe webhook
- Automatic status updates
- Historical data
- Bank format export
- Timezone handling

## Why This Next
Critical for financial trust and bookkeeping.

## Definition of Done
- All payouts tracked
- Status updates automatic
- Reconciliation tools work
- Exports match bank
- Notifications reliable