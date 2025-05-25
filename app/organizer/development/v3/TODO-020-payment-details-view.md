# TODO-020: Payment Details View

## Overview
Show detailed payment information for each registration.

## Acceptance Criteria
- [ ] Payment amount and date
- [ ] Card details (last 4 digits)
- [ ] Platform fee breakdown
- [ ] Net amount to organizer
- [ ] Payment status
- [ ] Stripe payment link
- [ ] Refund history

## Payment Information
1. **Transaction Details**
   - Gross amount paid
   - Platform fee (2.5%)
   - Net to organizer
   - Payment method
   - Transaction ID
   
2. **Status Tracking**
   - Payment confirmed
   - Payout initiated
   - Payout completed
   - Bank arrival date

3. **Fee Transparency**
   - Show calculation
   - GST if applicable
   - Monthly fee summary

## Technical Requirements
- Pull from Stripe API
- Cache for performance
- Secure display
- Link to Stripe dashboard
- Export capability

## Why This Next
Organizers need to understand their money flow.

## Definition of Done
- Payment details accurate
- Fees clearly shown
- Status tracking works
- Links to Stripe functional
- Mobile responsive