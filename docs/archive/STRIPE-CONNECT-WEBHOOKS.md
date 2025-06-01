# Stripe Connect Webhook Implementation

## Overview

This document describes the enhanced webhook handling for Stripe Connect in the LodgeTix platform.

## Implemented Features

### 1. Connect Event Handlers

The webhook handler now supports the following Stripe Connect events:

- **account.updated** - Tracks changes to connected account status and capabilities
- **account.application.authorized** - Handles initial authorization of a connected account
- **account.application.deauthorized** - Handles when an organization disconnects their Stripe account
- **capability.updated** - Logs capability changes (mainly for debugging)
- **payout.created** - Tracks when payouts are initiated to connected accounts
- **payout.failed** - Handles failed payouts and logs failure reasons
- **payout.paid** - Confirms successful payout completion
- **transfer.created** - Tracks transfers from platform to connected accounts
- **application_fee.created** - Records platform fees collected

### 2. Enhanced Payment Intent Handler

The `payment_intent.succeeded` handler has been updated to:
- Detect Connect payments using `on_behalf_of` field
- Track application fees charged
- Log payments to `connected_account_payments` table
- Calculate and display fee breakdowns

### 3. Database Schema Updates

New tables created:
- `organisation_payouts` - Tracks all payouts to connected accounts
- `platform_transfers` - Records transfers between platform and connected accounts
- `connected_account_payments` - Logs all payments processed through Connect

Updated tables:
- `organisations` - Added Connect status fields:
  - `stripe_account_status` (pending/active/restricted/deauthorized)
  - `stripe_payouts_enabled`
  - `stripe_details_submitted`
  - `stripe_capabilities` (JSON)
- `registrations` - Added Connect tracking fields:
  - `connected_account_id`
  - `platform_fee_amount`
  - `platform_fee_id`

### 4. Helper Functions

Created `/lib/utils/stripe-connect-helpers.ts` with utilities for:
- Parsing Connect account status
- Updating organization Connect status
- Handling account deauthorization
- Logging payout details
- Calculating platform fees

## Configuration

### Environment Variables

```bash
# Existing webhook secret for platform events
STRIPE_WEBHOOK_SECRET=whsec_xxx

# New webhook secret for Connect events (optional)
STRIPE_CONNECT_WEBHOOK_SECRET=whsec_xxx_connect
```

If `STRIPE_CONNECT_WEBHOOK_SECRET` is not set, the system will use the main webhook secret for all events.

### Webhook Endpoints

Configure two webhook endpoints in your Stripe Dashboard:

1. **Platform Webhook** (existing)
   - URL: `https://yourdomain.com/api/stripe/webhook`
   - Events: All platform events
   
2. **Connect Webhook** (optional)
   - URL: `https://yourdomain.com/api/stripe/webhook`
   - Events: All Connect events
   - Listen to events on Connected accounts: Yes

## Testing with Stripe CLI

### Basic Testing

```bash
# Forward webhooks to local development
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Test specific events
stripe trigger account.updated
stripe trigger payout.created
stripe trigger transfer.created
```

### Testing Connect Payments

```bash
# Test payment with connected account
stripe trigger payment_intent.succeeded \
  --add payment_intent:on_behalf_of=acct_1234567890 \
  --add payment_intent:application_fee_amount=500 \
  --add payment_intent:metadata.registration_id=test-reg-id
```

### Testing Account Status Changes

```bash
# Test account activation
stripe trigger account.updated \
  --add account:charges_enabled=true \
  --add account:payouts_enabled=true

# Test account deauthorization
stripe trigger account.application.deauthorized
```

## Monitoring and Debugging

### Webhook Logs

The webhook handler provides detailed logging:
- Event type and ID
- Connected account context
- Fee calculations
- Database update status

### Database Queries

Monitor Connect activity:

```sql
-- View recent payouts
SELECT * FROM organisation_payouts 
ORDER BY created_at DESC 
LIMIT 10;

-- Check platform fees collected
SELECT 
  DATE(created_at) as date,
  SUM(platform_fee) as total_fees,
  COUNT(*) as payment_count
FROM connected_account_payments
WHERE status = 'succeeded'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- View organization Connect status
SELECT 
  name,
  stripe_onbehalfof,
  stripe_account_status,
  stripe_payouts_enabled,
  stripe_capabilities
FROM organisations
WHERE stripe_onbehalfof IS NOT NULL;
```

## Error Handling

The webhook handler includes error handling for:
- Missing webhook signatures
- Invalid event data
- Database update failures
- Missing metadata
- Account retrieval failures

All errors are logged but don't prevent the webhook from returning a 200 status to avoid Stripe retries for non-critical errors.

## Security Considerations

1. **Webhook Signature Verification**: All incoming webhooks are verified using Stripe's signature verification
2. **Admin Client Usage**: Database updates use the admin client with appropriate permissions
3. **Sensitive Data**: No sensitive payment data is logged; only necessary information for reconciliation

## Future Enhancements

1. **Email Notifications**: Send emails when:
   - Account becomes fully active
   - Payout fails
   - Account is deauthorized

2. **Dashboard**: Create admin dashboard showing:
   - Active connected accounts
   - Pending payouts
   - Platform fees collected
   - Transfer history

3. **Automatic Retries**: Implement retry logic for failed database updates

4. **Webhook Replay**: Add ability to replay missed webhooks from Stripe Dashboard