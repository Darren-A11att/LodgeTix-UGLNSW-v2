# Stripe Fee Handling Implementation

## Overview
This document describes the implementation of Stripe transaction fee handling in the LodgeTix application.

## Implementation Summary

### 1. Fee Calculator Utility
Created `/lib/utils/stripe-fee-calculator.ts` with the following features:
- **calculateStripeFees()**: Main function to calculate fees based on subtotal
- **Fee Modes**: 
  - `pass_to_customer`: Adds processing fee to customer's total (default)
  - `absorb`: Organization pays the fee, customer pays ticket price only
- **Fee Rates** (Australia):
  - Domestic cards: 1.75% + $0.30 AUD
  - International cards: 2.9% + $0.30 AUD
- **Platform Fee**: Configurable percentage (default 5%)

### 2. Database Schema Updates
The database already has the necessary columns from the migration:
- `subtotal`: Original ticket price total before fees
- `stripe_fee`: Stripe processing fee amount
- `includes_processing_fee`: Boolean indicating if fee was passed to customer
- `registration_fee_summary`: View showing fee breakdown and organization revenue

### 3. UI Updates

#### Ticket Selection Step (`ticket-selection-step.tsx`)
- Shows processing fee next to each ticket price
- Displays fee breakdown in attendee ticket totals
- Uses tooltips to explain fees to users

#### Payment Step (`payment-step.tsx`)
- Calculates and displays fees in order summary
- Passes fee information to payment API
- Shows clear breakdown: Subtotal + Processing Fee = Total

#### Order Review Step (`order-review-step.tsx`)
- Displays complete fee breakdown for review
- Shows total amount including fees

#### Confirmation Step (`confirmation-step.tsx`)
- Shows final paid amount with fees
- Displays fee breakdown in order summary

### 4. API Updates

#### Payment Route (`/api/registrations/[id]/payment/route.ts`)
- Accepts `subtotal` and `stripeFee` parameters
- Stores fee information in database
- Includes fees in Stripe payment intent metadata

#### Registration Route (`/api/registrations/route.ts`)
- Accepts fee information during registration creation
- Stores initial fee calculations

### 5. Configuration

Environment variables (add to `.env.local`):
```env
# Fee Mode: 'pass_to_customer' or 'absorb'
NEXT_PUBLIC_STRIPE_FEE_MODE=pass_to_customer

# Platform fee percentage (0.05 = 5%)
NEXT_PUBLIC_PLATFORM_FEE_PERCENTAGE=0.05

# Show fee breakdown in UI
NEXT_PUBLIC_SHOW_FEE_BREAKDOWN=true
```

## Fee Calculation Logic

### Pass-Through Mode
When passing fees to customers:
```typescript
// For pass-through fees: total = (subtotal + fixed) / (1 - percentage)
total = (subtotal + 0.30) / (1 - 0.0175) // For domestic cards
stripeFee = total - subtotal
```

### Absorb Mode
When absorbing fees:
```typescript
stripeFee = subtotal * 0.0175 + 0.30 // For domestic cards
total = subtotal // Customer pays original price only
```

## Testing

Created comprehensive unit tests in `/lib/utils/__tests__/stripe-fee-calculator.test.ts` covering:
- Domestic and international fee calculations
- Pass-through and absorb modes
- Edge cases (zero amounts, large amounts)
- Rounding to 2 decimal places
- Platform fee calculations

## UI/UX Considerations

1. **Transparency**: Fees are shown upfront during ticket selection
2. **Tooltips**: Info icons explain why fees are charged
3. **Consistent Display**: Fees shown at every step of the process
4. **Clear Breakdown**: Subtotal, fees, and total clearly separated

## Future Enhancements

1. **Dynamic Card Type Detection**: Detect domestic vs international cards for accurate fee calculation
2. **Configurable Fee Rates**: Allow fee rates to be configured via environment variables
3. **Fee Reports**: Add reporting views for fee analysis
4. **Multiple Currency Support**: Extend to support fees in other currencies

## Implementation Status

✅ **Completed**:
- Fee calculator utility with comprehensive logic
- UI updates to show fees at all steps
- Database schema for fee tracking
- API updates to handle fee data
- Unit tests for fee calculations
- Environment variable configuration
- Fee transparency throughout the flow

The implementation provides a complete solution for handling Stripe transaction fees, with flexibility to either pass fees to customers or absorb them based on business requirements.