# Database Schema Validation Report

## Schema Exists in Database (from Supabase Console)

### Tables and Views Present ✅
- `attendees` ✅
- `auth_user_customer_view` ✅
- `contacts` ✅
- `customers` ✅
- `delegation_registration_confirmation_view` ✅
- `event_tickets` ✅
- `events` ✅
- `functions` ✅
- `individuals_registration_complete_view` ✅
- `individuals_registration_confirmation_view` ✅
- `locations` ✅
- `lodge_registration_confirmation_view` ✅
- `lodges` ✅
- `masonic_profiles` ✅
- `packages` ✅
- `raw_registrations` ✅
- `registration_confirmation_base_view` ✅
- `registration_confirmation_unified_view` ✅
- `registrations` ✅
- `ticket_availability_view` ✅
- `tickets` ✅

### Stored Procedures Present ✅
- `check_ticket_availability` ✅
- `complete_payment` ✅
- `get_event_with_details` ✅
- `get_function_details` ✅
- `get_registration_summary` ✅
- `upsert_delegation_registration` ✅
- `upsert_individual_registration` ✅
- `upsert_lodge_registration` ✅

## Schema Assumptions NOT in Database ❌

### Missing Views (Referenced in Code)
1. **`registration_detail_view`** ❌
   - Referenced in: `registration-service-optimized.ts`
   - Impact: Service will fail when trying to fetch detailed registration data
   
2. **`attendee_complete_view`** ❌
   - Referenced in: `registration-service-optimized.ts`
   - Impact: Cannot fetch comprehensive attendee information
   
3. **`event_hierarchy_view`** ❌
   - Referenced in: `event-service-optimized.ts`
   - Impact: Event hierarchy queries will fail

### Missing RPC Functions (Called in Code)
1. **`create_function_registration`** ❌
   - Called in: `rpc-service.ts`
   - Impact: Function registration creation will fail
   
2. **`execute_sql`** ❌
   - Called in: `adminApiService.ts`
   - Impact: Admin SQL execution will fail
   
3. **`get_function_eligible_tickets`** ❌
   - Called in: `rpc-service.ts`
   - Impact: Cannot fetch eligible tickets for functions
   
4. **`get_package_availability`** ❌
   - Called in: `packageAdminService.ts`
   - Impact: Package availability checks will fail
   
5. **`get_payment_processing_data`** ❌
   - Called in: `stripe-queries.ts`
   - Impact: Payment processing data retrieval will fail
   
6. **`get_ticket_availability`** ❌
   - Called in: `rpc-service.ts`
   - Impact: Ticket availability checks will fail (Note: `check_ticket_availability` exists)
   
7. **`release_registration_tickets`** ❌
   - Called in: `registrationAdminService.ts`
   - Impact: Cannot release tickets from cancelled registrations
   
8. **`search_all_lodges`** ❌
   - Called in: `lodges.ts`
   - Impact: Lodge search functionality will fail
   
9. **`update_package_capacity`** ❌
   - Called in: `packageAdminService.ts`
   - Impact: Cannot update package capacities

## Critical Data Completeness Issues

### 1. Registration Data Flow
**Issue**: The `upsert_individual_registration` function may not handle all required fields

**Fields Code Expects but May Not Be Saved**:
- `organisation_id` (for Mason attendees)
- `booking_contact_id` (relationship to contacts table)
- `attendee_data` (JSONB field for flexibility)
- Suffix fields (`suffix_1`, `suffix_2`, `suffix_3`)

### 2. View Column Mismatches
**Issue**: Views that exist may not have all expected columns

**Example**: `individuals_registration_complete_view`
- Code expects: `booking_contact_*` fields
- Reality: View returns NULL for these fields (line 50 in migration)

### 3. Contact Creation Logic
**Issue**: Business rules for contact creation may not be fully implemented
- Primary attendees should ALWAYS get contacts
- Additional attendees only if preference is 'directly'

### 4. Ticket Status Handling
**Issue**: Code assumes `ticket_status` enum but tickets.status is varchar(50)
- Fixed in recent migration but needs verification

## Recommendations

### Immediate Actions Required

1. **Create Missing Views**:
```sql
-- registration_detail_view
CREATE VIEW registration_detail_view AS
SELECT r.*, c.*, a.*
FROM registrations r
LEFT JOIN customers c ON r.customer_id = c.customer_id
LEFT JOIN attendees a ON r.registration_id = a.registration_id;

-- attendee_complete_view  
CREATE VIEW attendee_complete_view AS
SELECT a.*, c.*, mp.*
FROM attendees a
LEFT JOIN contacts c ON a.contact_id = c.contact_id
LEFT JOIN masonic_profiles mp ON c.contact_id = mp.contact_id;

-- event_hierarchy_view
CREATE VIEW event_hierarchy_view AS
WITH RECURSIVE event_tree AS (
  SELECT event_id, parent_event_id, 0 as level
  FROM events WHERE parent_event_id IS NULL
  UNION ALL
  SELECT e.event_id, e.parent_event_id, et.level + 1
  FROM events e
  JOIN event_tree et ON e.parent_event_id = et.event_id
)
SELECT * FROM event_tree;
```

2. **Create Missing RPC Functions** or update code to use existing ones:
- Use `check_ticket_availability` instead of `get_ticket_availability`
- Create `search_all_lodges` function
- Create `get_payment_processing_data` function

3. **Fix Data Completeness**:
- Ensure all JSONB fields are properly populated
- Add missing column mappings in RPC functions
- Validate foreign key relationships

4. **Add Defensive Coding**:
```typescript
// Check if view/function exists before using
try {
  const { data, error } = await supabase.from('registration_detail_view').select('*');
  if (error?.code === '42P01') { // undefined_table
    // Fallback to manual joins
  }
} catch (e) {
  // Handle gracefully
}
```

5. **Create Schema Contract Tests**:
- Test that all required columns exist
- Test that all RPC functions accept expected parameters
- Test that views return expected columns

## Testing Priority

1. **High Priority** (Blocks core functionality):
   - Individual registration flow
   - Lodge registration flow  
   - Payment processing
   - Confirmation number generation

2. **Medium Priority** (Degrades experience):
   - Lodge search
   - Ticket availability real-time updates
   - Admin functions

3. **Low Priority** (Nice to have):
   - Optimized views for performance
   - Admin SQL execution