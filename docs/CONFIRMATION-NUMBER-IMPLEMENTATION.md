# Confirmation Number Implementation Summary

## Problem Solved
1. **Missing Sequence Error**: The `upsert_individual_registration` function was trying to use `registration_confirmation_seq` which didn't exist
2. **Better Architecture**: Moved confirmation number generation to Edge Function that triggers only after successful payment

## Changes Made

### 1. Database Migration (20250607_010)
- Removed confirmation number generation from `upsert_individual_registration`
- Confirmation number remains NULL until payment completes
- Added `status` field update for Edge Function trigger

### 2. Database View (20250607_011)
- Created `individuals_registration_confirmation_view`
- Comprehensive view with all registration, attendee, ticket, and function data
- Indexed on confirmation_number for performance

### 3. Edge Function (Already Deployed)
- Listens for `status = 'completed'` AND `payment_status = 'completed'`
- Generates sequential confirmation numbers
- Updates registration record

## Next Steps to Implement

### 1. API Route for Confirmation Number
Create `/api/registrations/confirmation/[confirmationNumber]/route.ts`:
```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: { confirmationNumber: string } }
) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('individuals_registration_confirmation_view')
    .select('*')
    .eq('confirmation_number', params.confirmationNumber)
    .single();
    
  if (error) {
    return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
  }
  
  return NextResponse.json(data);
}
```

### 2. Update Post-Payment Service
In `/lib/services/post-payment-service.ts`, add polling for confirmation number:
```typescript
// After payment success, poll for confirmation number
let attempts = 0;
const maxAttempts = 30; // 30 seconds timeout

while (attempts < maxAttempts) {
  const { data } = await supabase
    .from('registrations')
    .select('confirmation_number')
    .eq('registration_id', registrationId)
    .single();
    
  if (data?.confirmation_number) {
    return { confirmationNumber: data.confirmation_number };
  }
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  attempts++;
}
```

### 3. Update Confirmation Page Route
Change from:
- `/functions/[slug]/register/[registrationId]`

To:
- `/functions/[slug]/register/confirmation/[confirmationNumber]`

### 4. Update Confirmation Page Component
Fetch data using confirmation number instead of registration ID.

## Benefits
1. No confirmation numbers for unpaid registrations
2. Sequential, human-readable numbers
3. Clean URLs for sharing
4. Immutable once assigned
5. No missing sequence errors