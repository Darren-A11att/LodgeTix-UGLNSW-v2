# Payment Gateway Database Migration Guide

## Overview
Payment fee configuration has been migrated from environment variables to a database-driven system using the `payment_gateway` table.

## What Changed

### Before (Environment Variables)
```bash
# Fee Configuration
SQUARE_PLATFORM_FEE_PERCENTAGE=0.02  # 2%
SQUARE_PLATFORM_FEE_CAP=20          # $20
SQUARE_PLATFORM_FEE_MINIMUM=1       # $1
STRIPE_PLATFORM_FEE_PERCENTAGE=0.025 # 2.5%
STRIPE_PLATFORM_FEE_CAP=30          # $30
SQUARE_FEE_MODE=pass_to_customer
```

### After (Database)
All fee configuration is now stored in the `payment_gateway` table with a single active row.

## Migration Steps

### 1. Run Database Migration
```bash
npm run db:migrate
```

This creates the `payment_gateway` table and seeds it with current Square configuration.

### 2. Update Code Usage

#### For Fee Calculations
**Old:**
```typescript
import { calculateSquareFees } from '@/lib/utils/square-fee-calculator';

const fees = calculateSquareFees(amount, options);
```

**New:**
```typescript
import { calculateSquareFeesWithDb } from '@/lib/utils/square-fee-calculator';

const fees = await calculateSquareFeesWithDb(amount, options);
```

#### For Payment Gateway Selection
**Old:**
```typescript
import { getActivePaymentGateway } from '@/lib/config/payment';

const gateway = getActivePaymentGateway(); // Synchronous
```

**New:**
```typescript
import { paymentGatewayService } from '@/lib/services/payment-gateway-service';

const gateway = await paymentGatewayService.getActivePaymentGateway(); // Async
```

### 3. Remove Environment Variables
After migration, remove these environment variables:
- `SQUARE_PLATFORM_FEE_PERCENTAGE`
- `SQUARE_PLATFORM_FEE_CAP`
- `SQUARE_PLATFORM_FEE_MINIMUM`
- `STRIPE_PLATFORM_FEE_PERCENTAGE`
- `STRIPE_PLATFORM_FEE_CAP`
- `STRIPE_PLATFORM_FEE_MINIMUM`
- `SQUARE_FEE_MODE`
- `STRIPE_FEE_MODE`

Keep these for API credentials:
- `SQUARE_APPLICATION_ID`
- `SQUARE_ACCESS_TOKEN`
- `SQUARE_LOCATION_ID`
- `STRIPE_SECRET_KEY`
- `STRIPE_PUBLISHABLE_KEY`

## Database Schema

```sql
CREATE TABLE payment_gateway (
  payment_gateway_id SERIAL PRIMARY KEY,
  payment_gateway_uuid UUID DEFAULT gen_random_uuid(),
  payment_gateway TEXT CHECK (payment_gateway IN ('square', 'stripe')),
  fee_mode TEXT CHECK (fee_mode IN ('pass_on', 'absorb')),
  domestic_card_percentage NUMERIC(4,2), -- 2.20 for 2.20%
  domestic_card_fixed NUMERIC(10,2),
  international_card_percentage NUMERIC(4,2),
  international_card_fixed NUMERIC(10,2),
  platform_fee_percentage NUMERIC(4,2),
  platform_fee_min NUMERIC(10,2),
  platform_fee_cap NUMERIC(10,2),
  is_active BOOLEAN DEFAULT FALSE,
  created_on TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  enabled_on TIMESTAMP WITH TIME ZONE,
  disabled_on TIMESTAMP WITH TIME ZONE
);
```

## Managing Fee Configuration

### View Current Configuration
```sql
SELECT * FROM payment_gateway WHERE is_active = TRUE;
```

### Update Fees
```sql
-- Deactivate current
UPDATE payment_gateway SET is_active = FALSE WHERE is_active = TRUE;

-- Insert new configuration
INSERT INTO payment_gateway (
  payment_gateway, fee_mode,
  domestic_card_percentage, domestic_card_fixed,
  international_card_percentage, international_card_fixed,
  platform_fee_percentage, platform_fee_min, platform_fee_cap,
  is_active
) VALUES (
  'square', 'pass_on',
  2.20, 0.00,  -- 2.2% + $0
  3.50, 0.50,  -- 3.5% + $0.50
  2.00, 1.00, 20.00,  -- 2% platform fee, $1 min, $20 cap
  TRUE
);
```

## Benefits

1. **No Deployment Required**: Change fees without redeploying
2. **Audit Trail**: Track when fees were changed
3. **Cleaner Code**: No environment variable sprawl
4. **Type Safety**: Database enforces valid values
5. **Consistency**: Single source of truth

## Rollback Plan

If needed, the old environment variable functions are still available:
- `calculateSquareFees()` - Uses env vars (deprecated)
- `calculateSquareFeesWithDb()` - Uses database (preferred)

## Future Enhancements

1. Admin UI for fee management
2. Fee configuration per function/organizer
3. Historical fee tracking
4. A/B testing different fee structures