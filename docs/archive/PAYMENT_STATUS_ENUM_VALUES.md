# Payment Status Enum Values

## Valid payment_status values in the database:

- `pending` - Payment is pending/awaiting processing
- `completed` - Payment has been successfully completed
- `failed` - Payment attempt failed
- `refunded` - Payment was refunded
- `partially_refunded` - Payment was partially refunded
- `cancelled` - Payment was cancelled
- `expired` - Payment expired before completion

## Important Notes:

1. **No "processing" status**: The database does not have a "processing" status. Use "pending" for payments that are being processed.

2. **No "paid" status**: Use "completed" instead of "paid" for successful payments.

3. **No "requires_action" status**: Use "pending" for payments that require additional action.

## Common Mappings:

| Stripe Status | Database payment_status |
|--------------|------------------------|
| requires_action | pending |
| processing | pending |
| succeeded | completed |
| paid | completed |
| failed | failed |
| canceled | cancelled |

## RLS Policy Considerations:

Users can only modify registrations and attendees when `payment_status = 'pending'`. Once a payment is completed, the registration becomes read-only for the user (though service role can still update).

## Code References:

- Enum definition: `/shared/types/database.ts` (lines 1588-1595)
- RLS policies: `/supabase/migrations/20250531_enable_rls_policies.sql`
- Helper functions: `/supabase/migrations/20250531_rls_helper_functions.sql`