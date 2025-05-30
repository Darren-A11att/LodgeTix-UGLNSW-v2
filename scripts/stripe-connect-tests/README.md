# Stripe Connect Testing Infrastructure

This directory contains comprehensive test suites for validating the Stripe Connect implementation in LodgeTix.

## Overview

The test infrastructure validates:
- ✅ Payment intent creation with connected accounts
- ✅ Platform fee calculations
- ✅ Metadata structure and completeness
- ✅ Webhook event handling
- ✅ Error scenarios and edge cases
- ✅ Statement descriptor formatting

## Prerequisites

1. **Environment Setup**
   ```bash
   # Ensure you have test Stripe keys in .env.local
   STRIPE_SECRET_KEY=sk_test_xxx
   STRIPE_PUBLISHABLE_KEY=pk_test_xxx
   STRIPE_WEBHOOK_SECRET=whsec_test_xxx
   STRIPE_PLATFORM_FEE_PERCENTAGE=0.05
   ```

2. **Dependencies**
   ```bash
   npm install -D ts-node @types/node dotenv
   ```

3. **Database**
   - Ensure Supabase is configured with test data
   - Organizations need to exist in the database

## Quick Start

Run all tests:
```bash
npm run test:stripe:all
```

## Individual Test Suites

### 1. Setup Test Accounts
Creates test Stripe connected accounts and links them to organizations.
```bash
npm run test:stripe:setup
```

### 2. Basic Payment Flow
Tests end-to-end payment creation with connected accounts.
```bash
npm run test:stripe:payment
```

### 3. Metadata Validation
Validates payment intent metadata structure and required fields.
```bash
npm run test:stripe:metadata
```

### 4. Webhook Handling
Tests webhook event processing (requires local server running).
```bash
# In one terminal:
npm run dev

# In another terminal:
npm run test:stripe:webhooks
```

### 5. Fee Calculations
Validates platform fee calculations for various amounts.
```bash
npm run test:stripe:fees
```

## Manual Testing

For comprehensive manual testing, follow the checklist:
```bash
open scripts/stripe-connect-tests/MANUAL_TESTING_CHECKLIST.md
```

## Test Data

### Test Cards
- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 9995`
- **Authentication Required**: `4000 0025 0000 3155`

### Test Amounts
The fee calculation tests cover:
- Small amounts ($1, $10)
- Standard tickets ($125, $250)
- Large groups ($1,250+)
- Edge cases (decimals, zero amounts)

## Webhook Testing with Stripe CLI

1. Install Stripe CLI
2. Forward webhooks to local:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

3. Trigger test events:
   ```bash
   stripe trigger payment_intent.succeeded
   stripe trigger account.updated
   ```

## Test Results

Test results are saved with timestamps in this directory:
- `test-results-*.json` - Basic payment test results
- `metadata-test-results-*.json` - Metadata validation results
- `webhook-test-results-*.json` - Webhook handling results
- `fee-calculation-results-*.json` - Fee calculation results
- `test-summary-*.json` - Overall test summary

## Troubleshooting

### Common Issues

1. **"No event with connected organization found"**
   - Run setup script first: `npm run test:stripe:setup`
   - Ensure organizations have Stripe account IDs

2. **"Local server is not running"**
   - Start dev server: `npm run dev`
   - Webhook tests require active server

3. **"Missing environment variables"**
   - Check `.env.local` has all required variables
   - Ensure using test keys (start with `sk_test_`)

4. **"Webhook signature verification failed"**
   - Update `STRIPE_WEBHOOK_SECRET` from Stripe CLI output
   - Ensure using correct endpoint secret

## CI/CD Integration

Add to your CI pipeline:
```yaml
- name: Run Stripe Connect Tests
  env:
    STRIPE_SECRET_KEY: ${{ secrets.STRIPE_TEST_SECRET_KEY }}
  run: |
    npm run test:stripe:setup
    npm run test:stripe:metadata
    npm run test:stripe:fees
```

## Production Validation

Before going live:
1. ✅ All automated tests pass
2. ✅ Manual testing checklist complete
3. ✅ Production Stripe keys configured
4. ✅ Webhook endpoints registered
5. ✅ Monitoring and alerting setup

## Contributing

When adding new tests:
1. Follow existing test structure
2. Include both success and failure cases
3. Document expected outcomes
4. Update this README