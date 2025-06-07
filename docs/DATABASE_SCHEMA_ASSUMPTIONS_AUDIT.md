# Database Schema Assumptions Audit

## Critical Findings

### 1. Table Existence Assumptions
The code assumes these tables exist without checking:
- `raw_registrations` - Used for debugging but checked with IF EXISTS
- `event_hierarchy_view` - Referenced but may not exist
- `ticket_availability_view` - Referenced for real-time updates
- `registration_detail_view` - Used in optimized services
- `attendee_complete_view` - Used for fetching attendee data

### 2. Most Dangerous Assumptions

#### Views That May Not Exist
```typescript
// In registration-service-optimized.ts
const { data } = await supabase
  .from('registration_detail_view')
  .select('*')
```

#### RPC Functions That May Not Exist
```typescript
// In event-rpc-service.ts
.rpc('get_event_with_details', { p_event_slug })
```

#### Column Name Mismatches
- `customers` table: Code uses both `address_line1` and `address_line_1`
- `contacts` table: Similar inconsistencies with underscores
- `billing_*` fields: Inconsistent naming patterns

### 3. Immediate Action Items

#### High Priority (May cause runtime errors)
1. **Verify all database views exist**:
   ```sql
   SELECT table_name FROM information_schema.views 
   WHERE table_schema = 'public';
   ```

2. **Verify all RPC functions exist**:
   ```sql
   SELECT proname FROM pg_proc 
   WHERE pronamespace = 'public'::regnamespace;
   ```

3. **Check column existence in critical tables**:
   ```sql
   SELECT column_name FROM information_schema.columns 
   WHERE table_name IN ('customers', 'contacts', 'registrations', 'attendees');
   ```

#### Medium Priority (May cause data issues)
1. **JSON field access patterns** - Verify JSONB columns exist
2. **Foreign key relationships** - Ensure all references are valid
3. **Default values** - Check if assumed defaults are set

#### Low Priority (Performance/optimization)
1. **Index existence** - Verify performance-critical indexes
2. **Trigger existence** - Check webhook and email triggers

## Recommended Fixes

### 1. Add Schema Validation
Create a startup validation script:
```typescript
// lib/utils/validate-schema.ts
export async function validateDatabaseSchema() {
  const requiredTables = ['customers', 'registrations', ...];
  const requiredViews = ['registration_detail_view', ...];
  const requiredFunctions = ['upsert_individual_registration', ...];
  
  // Check each exists and log warnings
}
```

### 2. Use Defensive Coding
Replace direct view access:
```typescript
// Bad
await supabase.from('some_view').select('*');

// Good
const viewExists = await checkViewExists('some_view');
if (viewExists) {
  await supabase.from('some_view').select('*');
} else {
  // Fallback to joining tables manually
}
```

### 3. Create Missing Schema Elements
Generate migrations for any missing:
- Views
- RPC functions
- Indexes
- Triggers

### 4. Standardize Column Names
Create migration to fix inconsistent column names:
- `address_line1` vs `address_line_1`
- `billing_*` field naming

### 5. Document Schema Contract
Create a schema contract document listing all:
- Required tables and columns
- Required views and their columns
- Required RPC functions and parameters
- Required triggers and their behavior

## Testing Checklist
- [ ] Run schema validation on startup
- [ ] Test each registration type (individuals, lodge, delegation)
- [ ] Test view fallbacks work correctly
- [ ] Verify all RPC functions are callable
- [ ] Check JSON field access doesn't fail on null

## Next Steps
1. Run the verification queries above
2. Create migrations for any missing schema elements
3. Implement defensive coding patterns
4. Add schema validation to CI/CD pipeline