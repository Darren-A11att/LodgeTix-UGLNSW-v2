# Enum Type Schema Assumption Errors - Comprehensive Fix Summary

## Root Cause Analysis
The original error "type 'contact_preference_type' does not exist" was identified as a **Schema Assumption Error** - code assumes database enum types exist without verification.

## Classification
**Error Type**: Schema Assumption Error  
**Pattern**: Code attempting to cast values to non-existent enum types  
**Impact**: Runtime failures when executing RPC functions

## Enum Types Audit Results

### 1. Non-Existent Enums Referenced
- `contact_preference_type` - **DOES NOT EXIST** (should be `attendee_contact_preference`)
- `ticket_status` - **DOES NOT EXIST** (tickets.status is varchar(50))

### 2. Valid Enum Types in Database
From `/supabase/migrations/parsed/20250605073722_002_types.sql`:
- `attendee_contact_preference`: 'directly', 'primaryattendee', 'mason', 'guest', 'providelater'
- `attendee_type`: 'mason', 'guest', 'ladypartner', 'guestpartner'
- `contact_type`: 'individual', 'organisation'
- `customer_type`: 'booking_contact', 'sponsor', 'donor'
- `payment_status`: 'pending', 'completed', 'failed', 'refunded', 'partially_refunded', 'cancelled', 'expired', 'Unpaid', 'unpaid'
- `registration_type`: 'individuals', 'groups', 'officials', 'lodge', 'delegation'

### 3. Incorrect Enum Value Mappings Fixed
- `contact_type`: 'customer' → 'individual', 'attendee' → 'individual'
- `attendee_contact_preference`: Ensure lowercase values ('directly', not 'Directly')

## Files Fixed

### Primary Fixes
1. **20250607000101_fix_contact_creation_business_logic.sql**
   - Fixed `contact_preference_type` → `attendee_contact_preference`
   - Implemented correct business logic for contact creation

2. **20250607000102_fix_ticket_status_enum_assumptions.sql**
   - Removed all `::ticket_status` casts
   - Changed to plain string values for tickets.status column

### Affected Migration Files
Multiple files contained ticket_status enum casting errors:
- 20250608000027_update_registration_rpcs_with_org_id_and_tickets.sql
- 20250608000025_fix_attendee_type_casting.sql
- 20250608000031_restore_individual_registration_jsonb_function.sql
- 20250608000032_fix_raw_registrations_column_references.sql

## Business Logic Clarification
Per user requirements:
- **Primary attendees**: ALWAYS get a contact record
- **Additional attendees with 'directly' preference**: Get a contact record
- **Additional attendees with 'primaryattendee' or 'providelater'**: NO contact record

## Prevention Strategy
1. Always verify enum types exist before casting
2. Use database schema as source of truth
3. Consider using CHECK constraints instead of enums for flexibility
4. Document all enum values in codebase

## Migration Order
1. Apply 20250607000101_fix_contact_creation_business_logic.sql
2. Apply 20250607000102_fix_ticket_status_enum_assumptions.sql
3. Test registration flow end-to-end

## Testing Checklist
- [ ] Individual registration with primary attendee
- [ ] Individual registration with additional attendees (mixed contact preferences)
- [ ] Lodge registration with ticket creation
- [ ] Payment completion flow
- [ ] Confirmation number generation