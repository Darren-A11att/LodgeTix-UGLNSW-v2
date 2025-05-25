# Database Migration Plan: Registrations and Tickets Tables

## Overview
This migration converts the `Registrations` and `Tickets` tables from PascalCase to lowercase with snake_case columns, following PostgreSQL naming conventions.

## Current State (Before Migration)
- **Tables**: `Registrations` (PascalCase), `Tickets` (PascalCase)
- **Test tables**: `registrations` (lowercase), `tickets` (lowercase) - will be dropped
- **Columns**: Mix of camelCase and snake_case

## Target State (After Migration)
- **Tables**: `registrations` (lowercase), `tickets` (lowercase)
- **Columns**: All snake_case
- **Backward compatibility**: Maintained through alias columns

## Migration Steps

### 1. Pre-Migration Checklist
- [ ] Backup database or create backup tables
- [ ] Notify team about migration window
- [ ] Stop any write operations to affected tables
- [ ] Review current table structure

### 2. Execute Migration
```bash
# Set your database URL
export DATABASE_URL="postgresql://..."

# Run the migration
cd development/database-migration
./run-migration.sh
```

### 3. Column Mappings

#### Registrations Table
| Old Column | New Column |
|------------|------------|
| registrationId | registration_id |
| customerId | customer_id |
| eventId | event_id |
| registrationDate | registration_date |
| totalAmountPaid | total_amount_paid |
| totalPricePaid | total_price_paid |
| paymentStatus | payment_status |
| agreeToTerms | agree_to_terms |
| stripePaymentIntentId | stripe_payment_intent_id |
| primaryAttendeeId | primary_attendee_id |
| registrationType | registration_type |
| createdAt | created_at |
| updatedAt | updated_at |
| registrationData | registration_data |

#### Tickets Table
| Old Column | New Column | Notes |
|------------|------------|-------|
| ticketid | ticket_id | Primary key |
| attendeeid | attendee_id | FK to attendees |
| eventid | event_id | FK to events |
| ticketdefinitionid | ticket_definition_id | FK to ticket_definitions |
| pricepaid | price_paid | Ticket price |
| seatinfo | seat_info | Seat information |
| checkedinat | checked_in_at | Check-in timestamp |
| createdat | created_at | Creation timestamp |
| updatedat | updated_at | Update timestamp |
| - | id | Added for compatibility (maps to ticket_id) |
| - | registration_id | Added FK to registrations |
| - | ticket_type_id | Added for compatibility (maps to ticket_definition_id) |
| - | ticket_price | Added for compatibility (maps to price_paid) |
| - | ticket_status | Added for compatibility (maps to status) |
| - | is_partner_ticket | Added boolean flag |

### 4. Post-Migration Tasks

#### Immediate Tasks
1. **Regenerate TypeScript Types**
   ```bash
   npx supabase gen types typescript --local > shared/types/supabase.ts
   ```

2. **Update Code References**
   - Update all field references from camelCase to snake_case
   - Remove PascalCase table references
   - Update API endpoints and queries

3. **Test Critical Flows**
   - Registration creation
   - Ticket purchase
   - Payment processing
   - Data retrieval

#### Code Updates Required
1. **Remove workarounds in**:
   - `/app/api/registrations/route.ts` - dual insert logic
   - `/lib/supabase-singleton.ts` - PascalCase mappings

2. **Update field names in**:
   - Registration components
   - Ticket selection components
   - API routes
   - Database queries

### 5. Rollback Plan
If issues occur, rollback using:
```sql
-- Drop migrated tables
DROP TABLE IF EXISTS registrations CASCADE;
DROP TABLE IF EXISTS tickets CASCADE;

-- Restore from backups
ALTER TABLE "Registrations_backup_[timestamp]" RENAME TO "Registrations";
ALTER TABLE "Tickets_backup_[timestamp]" RENAME TO "Tickets";
```

### 6. Verification Queries
```sql
-- Check table structure
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('registrations', 'tickets')
ORDER BY table_name, ordinal_position;

-- Check foreign keys
SELECT conname, conrelid::regclass, confrelid::regclass 
FROM pg_constraint 
WHERE contype = 'f' 
AND conrelid::regclass::text IN ('registrations', 'tickets');

-- Check row counts
SELECT 'registrations' as table_name, COUNT(*) FROM registrations
UNION ALL
SELECT 'tickets' as table_name, COUNT(*) FROM tickets;
```

## Success Criteria
- [ ] All tables renamed to lowercase
- [ ] All columns converted to snake_case
- [ ] No data loss (same row counts)
- [ ] All foreign keys intact
- [ ] Application continues to function
- [ ] TypeScript types regenerated
- [ ] No console errors in application

## Notes
- The migration maintains backward compatibility by adding alias columns
- Original data is preserved in timestamped backup tables
- The migration is wrapped in a transaction for atomicity