# TODO: Update Code Field Names to Match Database (REVISED)

## Overview
Directly update all code references to match the database column names. No adapters - just fix the naming once and be done with it.

## Why Direct Renaming is Better
- **Simpler**: No adapter layer to maintain
- **Clearer**: Code matches database exactly
- **Faster**: No runtime transformation overhead
- **Cleaner**: Single source of truth

## Bulk Find & Replace Tasks

### 1. Customer ID → Contact ID
```bash
# Find all occurrences
grep -r "customer_id" --include="*.ts" --include="*.tsx" .

# Replace in code
- customer_id → contact_id
- customerId → contactId
- customer_type → contact_type (where referring to the person)
```

### 2. Organization → Organisation (British Spelling)
```bash
# Find American spelling
grep -r "organization" --include="*.ts" --include="*.tsx" .

# Replace throughout
- organization → organisation
- organizationId → organisationId
- Organization → Organisation (in types)
```

### 3. Organizer → Organiser
```bash
# Find and replace
- organizer → organiser
- organizerId → organiserId
- organizerName → organiserName
```

### 4. Ticket Count Fields
```bash
# Update field names
- tickets_available → available_count
- tickets_sold → sold_count  
- tickets_reserved → reserved_count
```

### 5. Remove Computed Fields from Types
These don't exist in database, calculate them instead:
- Remove `min_price` from Event type (calculate from tickets)
- Remove `is_sold_out` from Event type (calculate from counts)
- Remove `location` string field (use location relation)

## Type Definition Updates

### Before:
```typescript
interface Registration {
  registration_id: string;
  customer_id: string; // WRONG
  organization_id: string; // WRONG
  // ...
}
```

### After:
```typescript
interface Registration {
  registration_id: string;
  contact_id: string; // CORRECT
  organisation_id: string; // CORRECT
  // ...
}
```

## Special Cases to Handle

### 1. Location Field
The code expects a simple string, but DB has a location table.

**Option A**: Add to view
```sql
-- In event_display_view
SELECT 
  e.*,
  l.place_name || ', ' || l.suburb as location_display
FROM events e
LEFT JOIN locations l ON e.location_id = l.location_id
```

**Option B**: Calculate in query
```typescript
const { data: event } = await supabase
  .from('events')
  .select(`
    *,
    locations (
      place_name,
      suburb
    )
  `)
  .single()

// Then construct: 
const location = `${event.locations.place_name}, ${event.locations.suburb}`;
```

### 2. Partner Data Structure
Database uses `related_attendee_id`, not nested partner object.

**Current Code Structure**:
```typescript
interface Attendee {
  partner?: {
    first_name: string;
    last_name: string;
  }
}
```

**Change to Match Database**:
```typescript
interface Attendee {
  has_partner: boolean;
  related_attendee_id?: string;
  // Fetch partner as separate attendee record
}
```

## Migration Steps

1. **Search & Replace Phase**
   - [ ] Run searches to find all occurrences
   - [ ] Use IDE refactoring tools where possible
   - [ ] Update imports and exports

2. **Type Updates**
   - [ ] Update all interface definitions
   - [ ] Remove non-existent fields
   - [ ] Add missing database fields

3. **Query Updates**
   - [ ] Update Supabase queries to use correct names
   - [ ] Remove references to computed fields
   - [ ] Add joins for related data

4. **Testing**
   - [ ] Run TypeScript compiler to catch errors
   - [ ] Test each major flow
   - [ ] Verify data loads correctly

## Benefits of This Approach
- No runtime overhead
- Code is truth - matches database
- Easier debugging - what you see is what's in DB
- No confusion about field names
- Simpler for new developers

## What NOT to Create
- ❌ No adapter functions
- ❌ No transformation layers  
- ❌ No field mapping objects
- ❌ No "legacy" support

Just fix it once and move on!