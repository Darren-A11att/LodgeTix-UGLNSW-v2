# Post-Migration Code Cleanup

After the database migration is complete, minimal code changes are needed since we're keeping the lowercase table names that the app already expects.

## Required Code Changes

### 1. Remove the Dual-Insert Workaround
**File:** `/app/api/registrations/route.ts`

Remove lines 220-241 that insert into both tables:
```typescript
// DELETE THIS ENTIRE SECTION:
// Insert registration record into BOTH tables to handle FK constraints
// This is a temporary workaround for the table naming inconsistency
console.log("Inserting registration into Registrations (capital R) table");
const { data: savedRegistration, error: registrationError } = await userClient
  .from("Registrations")
  .insert(registrationRecord)
  .select()
  .single<Tables<'Registrations'>>(); // Use capital R type

if (!registrationError && savedRegistration) {
  // Also insert into lowercase table for tickets FK
  console.log("Also inserting into registrations (lowercase) table for consistency");
  const { error: lowerCaseError } = await userClient
    .from("registrations")
    .insert(registrationRecord)
    .select()
    .single();
    
  if (lowerCaseError) {
    console.warn("Failed to insert into lowercase registrations:", lowerCaseError.message);
  }
}
```

Replace with single insert:
```typescript
console.log("Inserting registration");
const { data: savedRegistration, error: registrationError } = await userClient
  .from("registrations")
  .insert(registrationRecord)
  .select()
  .single<Tables<'registrations'>>();
```

### 2. Clean up Type References
Update any remaining PascalCase type references:
- Change `Tables<'Registrations'>` to `Tables<'registrations'>`
- Change `Tables<'Tickets'>` to `Tables<'tickets'>`

### 3. Update supabase-singleton.ts
Remove the PascalCase mappings from `DB_TABLE_NAMES`:
```typescript
// Remove these lines:
Registrations: 'registrations',
Tickets: 'tickets',

// Keep only the lowercase versions:
registrations: 'registrations',
tickets: 'tickets',
```

### 4. Generate New Types
After the migration, regenerate Supabase types:
```bash
npx supabase gen types typescript --project-id your-project-id > supabase/types.ts
```

This will automatically remove the PascalCase interfaces.

## Verification Steps

1. **Test Registration Flow**
   - Create a new registration
   - Verify it saves to `registrations` table only
   - Verify tickets are created correctly

2. **Check Foreign Keys**
   - Attendees still link to registrations
   - Tickets link to registrations
   - All other relationships work

3. **Type Checking**
   ```bash
   npm run type-check
   ```

## Benefits of This Approach

1. **Minimal Code Changes** - Since we're renaming to match what the app expects
2. **No Data Migration** - We're dropping test data only
3. **Preserves All Relationships** - Foreign keys remain intact
4. **Cleaner Codebase** - Removes workarounds and duplicate logic

## Rollback Plan

If anything goes wrong, the backup tables can be used to restore:
```sql
-- To rollback:
DROP TABLE IF EXISTS registrations CASCADE;
DROP TABLE IF EXISTS tickets CASCADE;
ALTER TABLE registrations_backup RENAME TO registrations;
ALTER TABLE tickets_backup RENAME TO tickets;
-- Then restore the original PascalCase tables from backup
```