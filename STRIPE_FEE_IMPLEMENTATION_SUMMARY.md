# Stripe Fee Implementation for Lodge Registrations

## Summary
Added Stripe processing fee calculation and display to the LodgesForm component so that processing fees are transparently passed on to lodges purchasing tickets.

## Changes Made

### 1. Updated LodgesForm Component (`/components/register/Forms/attendee/LodgesForm.tsx`)
- Added imports for Stripe fee calculator utilities
- Updated `PackageOrder` interface to include `stripeFee` and `totalWithFees`
- Modified the package order calculation to include Stripe fees
- Enhanced the Order Summary display to show:
  - Subtotal (package price before fees)
  - Processing Fee with tooltip explanation
  - Total Amount (including fees)
  - Fee disclaimer text

### 2. Updated LodgeRegistrationStep Component (`/components/register/RegistrationWizard/Steps/LodgeRegistrationStep.tsx`)
- Added Stripe fee calculator imports
- Updated total amount calculation to include fees
- Modified payment submission to send both subtotal and fee information to the API

### 3. Updated LodgeFormSummary Component
- Added fee calculation for the summary view
- Shows subtotal and processing fee separately
- Displays total amount including fees

## Fee Calculation Details

The implementation uses the existing Stripe fee calculator with:
- **Pass-to-customer mode**: Fees are added to the subtotal
- **Australian domestic rate**: 1.75% + $0.30 per transaction
- **International rate**: 2.9% + $0.30 per transaction (when applicable)

### Example Calculations
- 1 package ($1,950): Processing fee $35.04, Total $1,985.04
- 2 packages ($3,900): Processing fee $69.77, Total $3,969.77
- 5 packages ($9,750): Processing fee $173.97, Total $9,923.97
- 10 packages ($19,500): Processing fee $347.63, Total $19,847.63

## UI Features
- Processing fee is clearly displayed with an info tooltip
- Tooltip explains the fee structure and shows different rates
- Fee disclaimer text is shown when fees are passed to customers
- All amounts are properly formatted with currency symbols

## Environment Configuration
The fee mode is controlled by the `NEXT_PUBLIC_STRIPE_FEE_MODE` environment variable:
- If not set or set to `'pass_to_customer'`: Fees are added to the order total
- If set to `'absorb'`: Fees are absorbed by the organizer (not shown to customer)

## Testing
Created test script at `/scripts/test-lodge-stripe-fees.ts` to verify fee calculations for various package quantities.

## Next Steps
No additional changes needed. The implementation is complete and consistent with the existing payment flow for individual registrations.