# Payment Gateway Configuration

This document outlines the environment variables and configuration needed for both Stripe and Square payment gateways in the LodgeTix system.

## Payment Gateway Selection

The system supports both Stripe and Square payment processing. The active gateway is controlled by:

```bash
PAYMENT_GATEWAY=SQUARE  # Options: STRIPE | SQUARE (defaults to SQUARE)
```

## Platform Fee Configuration

These settings apply to both payment gateways:

```bash
PLATFORM_FEE_PERCENTAGE=0.022  # 2.2% platform fee
PLATFORM_FEE_CAP=20            # $20 maximum platform fee
PLATFORM_FEE_MINIMUM=0.50      # $0.50 minimum platform fee
```

## Stripe Configuration

### Required Environment Variables

```bash
# Stripe Secret Key (server-side)
# ⚠️ SECURITY WARNING: Never expose this client-side
STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key  # Test mode
# STRIPE_SECRET_KEY=sk_live_your-stripe-secret-key  # Production mode

# Stripe Publishable Key (client-side safe)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your-stripe-publishable-key  # Test mode  
# NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your-stripe-publishable-key  # Production mode

# Stripe Webhook Secret (for verifying webhook signatures)
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret
```

### Key Format Validation

- **Secret Key**: Must start with `sk_test_` (test) or `sk_live_` (production)
- **Publishable Key**: Must start with `pk_test_` (test) or `pk_live_` (production)
- **Webhook Secret**: Must start with `whsec_`

### Getting Stripe Keys

1. Visit [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
2. Navigate to **Developers > API keys**
3. Copy the publishable and secret keys
4. For webhooks: **Developers > Webhooks > Signing secret**

## Square Configuration

### Required Environment Variables

```bash
# Square Environment
SQUARE_ENVIRONMENT=sandbox  # Options: sandbox | production

# Square Application ID (client-side safe)
NEXT_PUBLIC_SQUARE_APPLICATION_ID=sandbox-sq0idb-your-application-id  # Sandbox
# NEXT_PUBLIC_SQUARE_APPLICATION_ID=sq0idp-your-production-application-id  # Production

# Square Access Token (server-side)
# ⚠️ SECURITY WARNING: Never expose this client-side
SQUARE_ACCESS_TOKEN=EAAAl_your-sandbox-access-token  # Sandbox
# SQUARE_ACCESS_TOKEN=EAAAl_your-production-access-token  # Production

# Square Location ID (required for payments)
SQUARE_LOCATION_ID=L123456789ABCDEFGHIJ

# Square Webhook Signature Key (for verifying webhooks)
SQUARE_WEBHOOK_SIGNATURE_KEY=wh_your-webhook-signature-key
```

### Key Format Validation

- **Application ID (Sandbox)**: Must start with `sandbox-sq0idb-`
- **Application ID (Production)**: Must start with `sq0idp-`
- **Access Token**: Must start with `EAAAl`
- **Location ID**: Must start with `L`
- **Webhook Signature Key**: Must start with `wh_`

### Getting Square Keys

1. Visit [Square Developer Dashboard](https://developer.squareup.com/apps)
2. Navigate to **My Applications**
3. Select your application
4. Copy the Application ID and Access Token for your environment
5. Location ID: **Account & Settings > Locations**
6. Webhook Signature Key: **Developer > Webhooks > Signature Key**

## Environment-Specific Configuration

### Development (.env.local)
```bash
# Use test/sandbox credentials
PAYMENT_GATEWAY=SQUARE
SQUARE_ENVIRONMENT=sandbox
NEXT_PUBLIC_SQUARE_APPLICATION_ID=sandbox-sq0idb-***
SQUARE_ACCESS_TOKEN=EAAAl***
```

### Production (.env.production)
```bash
# Use live/production credentials
PAYMENT_GATEWAY=SQUARE
SQUARE_ENVIRONMENT=production
NEXT_PUBLIC_SQUARE_APPLICATION_ID=sq0idp-***
SQUARE_ACCESS_TOKEN=EAAAl***
```

## Configuration Validation

The system automatically validates configuration on startup. Invalid configurations will throw descriptive errors:

### Common Validation Errors

1. **Missing Environment Variables**
   - `NEXT_PUBLIC_SQUARE_APPLICATION_ID is required`
   - `SQUARE_ACCESS_TOKEN is required`

2. **Invalid Key Formats**
   - `Invalid Square application ID format for sandbox environment`
   - `Invalid Square access token format`

3. **Environment Mismatches**
   - Using production keys with sandbox environment
   - Using sandbox keys with production environment

## Testing Configuration

### Validate Current Configuration

```typescript
import { getPaymentConfig, validatePaymentConfig } from '@/lib/config/payment';

const config = getPaymentConfig();
const errors = validatePaymentConfig(config);

if (errors.length > 0) {
  console.error('Configuration errors:', errors);
} else {
  console.log('Configuration is valid');
}
```

### Check Active Gateway

```typescript
import { getActivePaymentGateway } from '@/lib/config/payment';

const gateway = getActivePaymentGateway();
console.log('Active payment gateway:', gateway);
```

## Security Best Practices

1. **Never commit sensitive keys to version control**
2. **Use different keys for different environments**
3. **Regularly rotate access tokens**
4. **Monitor webhook signature validation failures**
5. **Use environment-specific prefixes to avoid accidental key mixing**

## Troubleshooting

### Common Issues

1. **"Square configuration is not available"**
   - Check that all required Square environment variables are set
   - Verify key formats match the expected patterns

2. **"Invalid application ID format"**
   - Ensure sandbox keys start with `sandbox-sq0idb-`
   - Ensure production keys start with `sq0idp-`

3. **"Payment gateway SQUARE is not supported"**
   - The current service only supports Stripe
   - Either switch to Stripe or implement Square support in the service

### Debug Commands

```bash
# Check current environment variables
npm run debug-env

# Validate payment configuration
npm run validate-payment-config

# Test payment gateway connection
npm run test-payment-gateway
```

## Migration Notes

When switching between payment gateways:

1. Update `PAYMENT_GATEWAY` environment variable
2. Ensure the target gateway is fully configured
3. Test payment flows in development first
4. Update webhook endpoints if necessary
5. Inform users of any changes in payment flow