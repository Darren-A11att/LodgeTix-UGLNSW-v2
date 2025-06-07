# TODO-006: Implement Stripe Transaction Fee Handling

## Overview
Add Stripe transaction fee calculation and display in the payment flow, ensuring customers understand the total cost including processing fees.

## Stripe Fee Structure (Australia)
Standard Stripe pricing in Australia:
- **Domestic cards**: 1.75% + $0.30 AUD
- **International cards**: 2.9% + $0.30 AUD
- **Currency conversion**: Additional 2%

For Stripe Connect with direct charges, the connected account typically pays the Stripe fee.

## Implementation Strategy

### Option 1: Absorb the Fee (Recommended for MVP)
The organization absorbs the Stripe fee - customer pays ticket price, organization receives amount minus Stripe fees.

### Option 2: Pass Fee to Customer
Add the Stripe fee to the customer's total, ensuring the organization receives the full ticket amount.

## Implementation for Option 2 (Pass Fee to Customer)

### 1. Create Fee Calculator Utility

```typescript
// /lib/utils/stripe-fee-calculator.ts

export interface StripeFeeCalculation {
  subtotal: number;
  stripeFee: number;
  platformFee: number;
  total: number;
}

/**
 * Calculate Stripe transaction fees
 * Note: This uses standard Stripe pricing - actual fees may vary based on:
 * - Card type (domestic/international)
 * - Connected account pricing
 * - Negotiated rates
 */
export function calculateStripeFees(
  subtotal: number,
  options: {
    isDomestic?: boolean;
    platformFeePercentage?: number;
  } = {}
): StripeFeeCalculation {
  const {
    isDomestic = true, // Assume domestic by default
    platformFeePercentage = 0.05 // 5% platform fee
  } = options;
  
  // Stripe fee rates for Australia
  const stripePercentage = isDomestic ? 0.0175 : 0.029; // 1.75% or 2.9%
  const stripeFixedFee = 0.30; // $0.30 AUD
  
  // Calculate fees
  // For pass-through fees, we need to solve: total = (subtotal + fee) where fee = total * % + fixed
  // Rearranging: total = (subtotal + fixed) / (1 - percentage)
  const totalWithStripeFee = (subtotal + stripeFixedFee) / (1 - stripePercentage);
  const stripeFee = totalWithStripeFee - subtotal;
  
  // Platform fee is calculated on the subtotal
  const platformFee = subtotal * platformFeePercentage;
  
  // Total amount customer pays
  const total = totalWithStripeFee; // Platform fee is separate (paid by organization)
  
  return {
    subtotal: Number(subtotal.toFixed(2)),
    stripeFee: Number(stripeFee.toFixed(2)),
    platformFee: Number(platformFee.toFixed(2)),
    total: Number(total.toFixed(2))
  };
}

/**
 * Format fee for display
 */
export function formatFeeBreakdown(calculation: StripeFeeCalculation): string[] {
  return [
    `Subtotal: $${calculation.subtotal.toFixed(2)}`,
    `Processing Fee: $${calculation.stripeFee.toFixed(2)}`,
    `Total: $${calculation.total.toFixed(2)}`
  ];
}

/**
 * Get fee disclaimer text
 */
export function getFeeDisclaimer(): string {
  return "A processing fee is added to cover payment processing costs. This ensures the full ticket price goes to the event organizer.";
}
```

### 2. Update Order Summary Component

```typescript
// Update /components/register/RegistrationWizard/payment/OrderSummary.tsx

import { calculateStripeFees, getFeeDisclaimer } from '@/lib/utils/stripe-fee-calculator';

export function OrderSummary({ items, showFees = true }: OrderSummaryProps) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  
  // Calculate fees
  const feeCalculation = calculateStripeFees(subtotal);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Existing item list */}
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="flex justify-between">
              <span>{item.name} x {item.quantity}</span>
              <span>${(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
        </div>
        
        <Separator />
        
        {/* Fee breakdown */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span>${feeCalculation.subtotal.toFixed(2)}</span>
          </div>
          
          {showFees && (
            <>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  Processing Fee
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-3 w-3" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs text-sm">
                          {getFeeDisclaimer()}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </span>
                <span>${feeCalculation.stripeFee.toFixed(2)}</span>
              </div>
            </>
          )}
          
          <Separator />
          
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span>${feeCalculation.total.toFixed(2)}</span>
          </div>
        </div>
        
        {showFees && (
          <p className="text-xs text-muted-foreground">
            {getFeeDisclaimer()}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
```

### 3. Update Payment Step to Include Fees

```typescript
// Update payment-step.tsx to pass fee-adjusted total

const handlePayment = async (paymentMethodId: string) => {
  const subtotal = calculateSubtotal();
  const { total } = calculateStripeFees(subtotal);
  
  const response = await fetch(`/api/registrations/${registrationId}/payment`, {
    method: 'PUT',
    body: JSON.stringify({
      paymentMethodId,
      totalAmount: total, // Use fee-adjusted total
      subtotalAmount: subtotal, // Keep original subtotal for records
      billingDetails
    })
  });
};
```

### 4. Update Payment API Route

```typescript
// Update /app/api/registrations/[id]/payment/route.ts

const {
  paymentMethodId,
  totalAmount, // This now includes the Stripe fee
  subtotalAmount, // Original amount before fees
  billingDetails
} = data;

// When creating payment intent
const paymentIntent = await stripe.paymentIntents.create({
  amount: Math.round(totalAmount * 100), // Total including fees
  currency: 'aud',
  
  // Connect parameters
  on_behalf_of: connectedAccountId,
  application_fee_amount: Math.round(subtotalAmount * platformFeePercentage * 100),
  
  metadata: {
    registration_id: registrationId,
    subtotal_amount: subtotalAmount.toFixed(2),
    stripe_fee: (totalAmount - subtotalAmount).toFixed(2),
    total_amount_paid: totalAmount.toFixed(2),
    platform_fee: (subtotalAmount * platformFeePercentage).toFixed(2),
    // ... other metadata
  }
});

// Update registration record
const updateData = {
  subtotal: subtotalAmount,
  stripe_fee: totalAmount - subtotalAmount,
  total_amount_paid: totalAmount,
  // ... other fields
};
```

### 5. Database Schema Updates

```sql
-- Add fee tracking columns to registrations table
ALTER TABLE registrations 
ADD COLUMN subtotal DECIMAL(10,2),
ADD COLUMN stripe_fee DECIMAL(10,2),
ADD COLUMN includes_processing_fee BOOLEAN DEFAULT false;

-- Update view to include fees
CREATE OR REPLACE VIEW registration_summary AS
SELECT 
  r.*,
  r.subtotal as ticket_subtotal,
  r.stripe_fee as processing_fee,
  r.total_amount_paid as total_charged,
  r.platform_fee_amount as marketplace_fee,
  (r.total_amount_paid - r.stripe_fee - r.platform_fee_amount) as organization_receives
FROM registrations r;
```

### 6. Configuration Options

```typescript
// Add to environment variables
STRIPE_FEE_MODE=pass_to_customer # or 'absorb'
STRIPE_DOMESTIC_PERCENTAGE=0.0175
STRIPE_INTERNATIONAL_PERCENTAGE=0.029
STRIPE_FIXED_FEE=0.30
SHOW_FEE_BREAKDOWN=true
```

### 7. Fee Transparency Component

```typescript
// /components/register/RegistrationWizard/payment/FeeExplanation.tsx

export function FeeExplanation() {
  return (
    <Alert>
      <Info className="h-4 w-4" />
      <AlertTitle>About Processing Fees</AlertTitle>
      <AlertDescription>
        <p className="text-sm">
          To ensure event organizers receive the full ticket price, we add a 
          small processing fee to cover payment costs. This fee goes directly 
          to our payment processor.
        </p>
        <ul className="mt-2 text-sm list-disc list-inside">
          <li>Australian cards: 1.75% + $0.30</li>
          <li>International cards: 2.9% + $0.30</li>
        </ul>
      </AlertDescription>
    </Alert>
  );
}
```

## Alternative: Absorb the Fee (Simpler Option)

If you prefer to absorb the fee:

1. Keep the current payment flow as-is
2. Add fee tracking for reporting:

```typescript
// After payment succeeds, retrieve the balance transaction
const paymentIntent = await stripe.paymentIntents.retrieve(
  paymentIntentId,
  { expand: ['latest_charge.balance_transaction'] }
);

const balanceTransaction = paymentIntent.latest_charge?.balance_transaction;
const stripeFee = balanceTransaction?.fee ? balanceTransaction.fee / 100 : 0;

// Store fee for reporting
await adminClient
  .from('registrations')
  .update({
    stripe_fee: stripeFee,
    net_amount: totalAmount - stripeFee - platformFee
  })
  .eq('registration_id', registrationId);
```

## Implementation Checklist

- [ ] Create fee calculator utility
- [ ] Update OrderSummary component to show fees
- [ ] Update payment step to use fee-adjusted total
- [ ] Update payment API route to handle fees
- [ ] Add database columns for fee tracking
- [ ] Add configuration for fee handling mode
- [ ] Create fee explanation component
- [ ] Test with various amounts to verify calculations
- [ ] Add unit tests for fee calculator
- [ ] Update confirmation emails to show fee breakdown

## Testing Fee Calculations

```typescript
// Test cases for fee calculator
describe('Stripe Fee Calculator', () => {
  it('calculates domestic card fees correctly', () => {
    const result = calculateStripeFees(100, { isDomestic: true });
    expect(result.subtotal).toBe(100);
    expect(result.stripeFee).toBeCloseTo(2.08); // (100 + 0.30) / (1 - 0.0175) - 100
    expect(result.total).toBeCloseTo(102.08);
  });
  
  it('calculates international card fees correctly', () => {
    const result = calculateStripeFees(100, { isDomestic: false });
    expect(result.subtotal).toBe(100);
    expect(result.stripeFee).toBeCloseTo(3.31); // (100 + 0.30) / (1 - 0.029) - 100
    expect(result.total).toBeCloseTo(103.31);
  });
});
```

## Notes

1. **Actual fees may vary**: Card type, country, and negotiated rates affect fees
2. **Legal considerations**: Check local regulations about passing fees to customers
3. **User experience**: Consider showing fees upfront vs. at checkout
4. **International transactions**: May need to handle currency conversion fees
5. **Connected account pricing**: Fees might differ based on the connected account's Stripe agreement