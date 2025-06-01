# Column Name Fix Summary

## Issue Identified
The codebase was using incorrect column names (like `id`) instead of the actual column names in the database (like `event_ticket_id`, `ticket_id`, etc.).

## Audit Results
- **57 column name issues** found across the codebase
- Most common issues:
  - `event_tickets` table: using `id` instead of `event_ticket_id` (25 issues)
  - `tickets` table: using `id` instead of `ticket_id` (11 issues)
  - `registrations` table: using `id` instead of `registration_id` (4 issues)
  - `customers` table: using `id` instead of `customer_id` (5 issues)
  - `events` table: using `id` instead of `event_id` (5 issues)

## Fixes Applied

### 1. Database Migration Created
File: `supabase/migrations/20250607_fix_all_column_name_mismatches.sql`
- Fixes the RPC function `get_event_with_details` to use correct column names
- Creates compatibility views for backward compatibility

### 2. Application Code Fixed
- **21 files** updated with correct column names in Supabase queries
- Property access patterns updated (e.g., `ticket.id` → `ticket.ticket_id`)

## Action Required

### 1. Apply Database Migration
Run the latest migration to fix the RPC function:
```bash
# Using Supabase CLI
supabase migration up

# Or apply directly to the database
psql $DATABASE_URL < supabase/migrations/20250607_fix_all_column_name_mismatches.sql
```

### 2. Review and Test
1. Test the fixed RPC function:
   ```bash
   npx tsx scripts/test-column-name-fixes.ts
   ```

2. Test key functionality:
   - Event display pages
   - Ticket selection
   - Registration flow
   - Payment processing

### 3. Clean Up Old Migrations
Consider removing these outdated migration files that have incorrect fixes:
- `20250602_fix_get_event_with_details_et_id_error.sql`
- `20250606_fix_get_event_with_details_et_id_error.sql`
- `20250606_fix_get_event_with_details_correct_columns.sql`

## Files Modified

### Supabase Queries Fixed:
- `/app/api/registrations/[id]/confirmation.pdf/route.ts`
- `/app/api/registrations/lodge/route.ts`
- `/app/api/registrations/route.ts`
- `/app/api/registrations/[id]/verify-payment/route.ts`
- `/app/api/tickets/[ticketId]/qr-code/route.ts`
- `/app/api/test-event/route.ts`
- `/app/registrations/[registrationId]/tickets/[ticketId]/page.tsx`
- `/lib/api/admin/eventAdminService.ts`
- `/lib/api/admin/packageAdminService.ts`
- `/lib/api/server-actions.ts`
- `/lib/batch-operations.ts`
- `/lib/packageService.ts`
- `/lib/realtime/reservation-expiry-manager.ts`
- `/lib/services/post-payment-service.ts`
- `/lib/services/registration-service-optimized.ts`
- `/lib/services/static-data-service.ts`
- `/lib/services/storage-cleanup-service.ts`
- `/lib/services/stripe-sync-service.ts`

### Property Access Patterns Fixed:
- `ticket.id` → `ticket.ticket_id`
- `event.id` → `event.event_id`
- `registration.id` → `registration.registration_id`
- `attendee.id` → `attendee.attendee_id`
- `package.id` → `package.package_id`

## Verification
After applying the migration, all column name errors should be resolved. The test script `test-column-name-fixes.ts` should pass without any "column does not exist" errors.