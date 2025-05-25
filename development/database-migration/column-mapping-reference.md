# Column Mapping Reference

## Registrations → registrations
No changes needed - all columns already match perfectly!

## Tickets → tickets Column Mapping

### Renamed Columns (CamelCase to snake_case)
| Old Column Name | New Column Name | Purpose |
|-----------------|-----------------|---------|
| ticketid | ticket_id | Primary key |
| attendeeid | attendee_id | FK to attendees |
| eventid | event_id | FK to events |
| ticketdefinitionid | ticket_definition_id | FK to ticket_definitions |
| pricepaid | price_paid | Amount paid for ticket |
| seatinfo | seat_info | Seat information |
| checkedinat | checked_in_at | Check-in timestamp |
| createdat | created_at | Creation timestamp |
| updatedat | updated_at | Update timestamp |

### Columns That Stay The Same (already snake_case)
- status
- currency
- payment_status
- original_price
- purchased_at
- event_ticket_id
- package_id
- reservation_id
- reservation_expires_at

### New Columns Added for App Compatibility
| Column Name | Type | Purpose |
|-------------|------|---------|
| id | UUID | Maps to ticket_id for app compatibility |
| registration_id | UUID | FK to registrations table |
| ticket_price | NUMERIC | Maps to price_paid for app compatibility |
| ticket_status | VARCHAR | Maps to status for app compatibility |
| is_partner_ticket | BOOLEAN | Flag for partner tickets |

## Benefits of This Approach

1. **Standards Compliance**: All tables and columns follow PostgreSQL snake_case convention
2. **Backward Compatibility**: App-expected columns (id, ticket_price, ticket_status) map to proper columns
3. **Future-Ready**: All original Tickets columns preserved for upcoming features
4. **Clean Architecture**: No more PascalCase/snake_case confusion

## Post-Migration Code Updates

1. **Remove dual-insert workaround** in `/app/api/registrations/route.ts`
2. **Clean up DB_TABLE_NAMES** in `/lib/supabase-singleton.ts` 
3. **Regenerate types**: `npx supabase gen types typescript`

The beauty of this approach is that the app continues to work with minimal changes while the database is now properly standardized!