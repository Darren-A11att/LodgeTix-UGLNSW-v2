# Stripe Connect Manual Testing Checklist

This checklist provides step-by-step instructions for manually testing the Stripe Connect implementation.

## Prerequisites

- [ ] Development server running (`npm run dev`)
- [ ] Stripe CLI installed and authenticated
- [ ] Test Stripe accounts created (run `npm run test:stripe:setup`)
- [ ] Database populated with test events and organizations

## 1. Pre-Payment Setup Testing

### 1.1 Organization Setup
- [ ] Navigate to admin panel or database
- [ ] Verify test organizations have `stripe_onbehalfof` field populated
- [ ] Check `stripe_account_status` = 'active' for test organizations
- [ ] Confirm `stripe_charges_enabled` = true
- [ ] Confirm `stripe_payouts_enabled` = true

### 1.2 Event Configuration
- [ ] Create or find a test event
- [ ] Verify event is linked to organization with Stripe account
- [ ] Check event has active ticket types with prices

## 2. Registration Flow Testing

### 2.1 Individual Registration
1. Navigate to test event page
2. Click "Register Now"
3. Select "Individual" registration type
4. Fill in attendee details:
   - [ ] Enter name, email, phone
   - [ ] Select title and dietary requirements
   - [ ] Add partner if applicable
5. Select tickets:
   - [ ] Choose ticket types
   - [ ] Verify prices display correctly
   - [ ] Check order summary shows correct total
6. Proceed to payment

### 2.2 Lodge Registration
1. Navigate to test event page
2. Select "Lodge" registration type
3. Fill in lodge details:
   - [ ] Select Grand Lodge
   - [ ] Enter or select Lodge name and number
   - [ ] Add lodge members (minimum required)
   - [ ] Add partners as needed
4. Verify:
   - [ ] Member count validation works
   - [ ] Pricing calculations are correct
   - [ ] Order summary accurate

### 2.3 Delegation Registration
1. Navigate to test event page
2. Select "Delegation" registration type
3. Fill in delegation details:
   - [ ] Select Grand Lodge
   - [ ] Enter Grand Officer details
   - [ ] Add delegation members
4. Verify calculations and proceed to payment

## 3. Payment Processing Testing

### 3.1 Payment Form
- [ ] Billing details form displays correctly
- [ ] All required fields are present
- [ ] Country and state dropdowns work
- [ ] Form validation works properly

### 3.2 Test Card Payment
Use test card: `4242 4242 4242 4242`
- [ ] Enter card details
- [ ] Complete billing address
- [ ] Submit payment
- [ ] Wait for processing

### 3.3 Payment Verification
1. Check Stripe Dashboard:
   - [ ] Payment appears in platform account
   - [ ] Payment shows connected account ID
   - [ ] Application fee is visible
   - [ ] Metadata is complete

2. Check Connected Account Dashboard:
   - [ ] Payment appears in connected account
   - [ ] Net amount is correct (total - platform fee)
   - [ ] Transfer pending/completed

### 3.4 Statement Descriptor
- [ ] Make small test purchase
- [ ] Check statement descriptor format
- [ ] Verify no special characters cause issues
- [ ] Confirm truncation works for long event names

## 4. Post-Payment Testing

### 4.1 Registration Status
- [ ] Registration marked as 'paid'
- [ ] Tickets status updated to 'completed'
- [ ] Confirmation email sent (if enabled)
- [ ] QR codes generated (if applicable)

### 4.2 Database Verification
Check in database:
- [ ] `registrations.payment_status` = 'completed'
- [ ] `registrations.stripe_payment_intent_id` populated
- [ ] `registrations.connected_account_id` matches organization
- [ ] `registrations.platform_fee_amount` calculated correctly

## 5. Webhook Testing

### 5.1 Setup Stripe CLI
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

### 5.2 Test Payment Success
1. Complete a payment
2. Monitor webhook events:
   - [ ] `payment_intent.succeeded` received
   - [ ] Registration updated correctly
   - [ ] No errors in logs

### 5.3 Test Payment Failure
1. Use declining test card: `4000 0000 0000 9995`
2. Verify:
   - [ ] Payment fails gracefully
   - [ ] User sees appropriate error message
   - [ ] Registration remains unpaid

### 5.4 Test Account Updates
```bash
stripe trigger account.updated --add account:id=acct_YOUR_TEST_ACCOUNT
```
- [ ] Organization status updates in database
- [ ] Webhook processes without errors

## 6. Error Handling Testing

### 6.1 Missing Connected Account
1. Create event without connected organization
2. Try to make payment:
   - [ ] Error message displays
   - [ ] Payment doesn't proceed
   - [ ] User guided appropriately

### 6.2 Inactive Account
1. Set organization `stripe_account_status` to 'inactive'
2. Try to make payment:
   - [ ] Appropriate error shown
   - [ ] Payment blocked

### 6.3 Network Errors
1. Disconnect internet briefly during payment
2. Verify:
   - [ ] Timeout handled gracefully
   - [ ] User can retry
   - [ ] No duplicate charges

## 7. Fee Calculation Testing

### 7.1 Platform Fee Verification
For each test payment, verify:
- [ ] Platform fee = total amount × 5% (or configured percentage)
- [ ] Fee appears in Stripe Dashboard
- [ ] Connected account receives: total - platform fee

### 7.2 Different Amount Tests
Test with various amounts:
- [ ] $10.00 → Platform fee: $0.50
- [ ] $125.00 → Platform fee: $6.25
- [ ] $1,250.00 → Platform fee: $62.50
- [ ] $0.00 (free ticket) → Platform fee: $0.00

## 8. Multi-Event Testing

### 8.1 Parent Event Only
- [ ] Register for main event only
- [ ] Verify pricing and fees correct

### 8.2 Parent + Child Events
- [ ] Register for main event + sub-event
- [ ] Verify combined total correct
- [ ] Check metadata includes both events

## 9. Production Readiness

### 9.1 Configuration
- [ ] Production Stripe keys configured
- [ ] Webhook endpoints registered in Stripe
- [ ] Platform fee percentage confirmed

### 9.2 Monitoring
- [ ] Error tracking configured (Sentry)
- [ ] Webhook monitoring setup
- [ ] Payment success rate tracking

### 9.3 Documentation
- [ ] API documentation updated
- [ ] Support team trained
- [ ] Troubleshooting guide prepared

## Common Issues to Watch For

1. **Metadata Size**: Ensure metadata doesn't exceed Stripe's limits
2. **Statement Descriptors**: Check special characters are handled
3. **Currency**: Verify all amounts in AUD
4. **Decimal Precision**: Ensure no rounding errors
5. **Timezone**: Check all timestamps use correct timezone

## Test Data Cleanup

After testing:
```bash
# Cancel test payment intents
stripe payment_intents list --limit 10 | grep "pi_test" | xargs -I {} stripe payment_intents cancel {}

# Archive test customers
stripe customers list --limit 10 | grep "test" | xargs -I {} stripe customers delete {}
```

## Notes

- Always test in Stripe Test Mode first
- Keep test account credentials secure
- Document any issues found with screenshots
- Report bugs with payment intent IDs for debugging