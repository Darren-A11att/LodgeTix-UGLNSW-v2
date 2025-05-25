# Code Migration: Update Table References

## Overview
After consolidating the database tables, we need to update all code references from PascalCase to lowercase table names.

## Files to Update

### 1. API Routes
- `/app/api/registrations/route.ts`
  - Remove dual insertion workaround (lines 222-241)
  - Change `.from("Registrations")` to `.from("registrations")`
  - Update type references from `Tables<'Registrations'>` to `Tables<'registrations'>`

- `/app/api/registrations/[id]/route.ts`
  - Update all table references
  
- `/app/api/registrations/[id]/payment/route.ts`
  - Update all table references

### 2. Supabase Configuration
- `/lib/supabase-singleton.ts`
  - Remove PascalCase mappings from `DB_TABLE_NAMES`
  - Keep only lowercase versions

### 3. TypeScript Types
- `/supabase/types.ts`
  - Remove `Registrations` interface (keep only `registrations`)
  - Remove `Tickets` interface (requires separate migration)
  - Update all type references

### 4. Service Files
- Check all files in `/lib/api/` for table references
- Update any direct table access

## Search and Replace Commands

```bash
# Find all files with Registrations references
grep -r "from(['\"]Registrations['\"]" --include="*.ts" --include="*.tsx" .
grep -r "from\s*\(\s*['\"]Registrations['\"]" --include="*.ts" --include="*.tsx" .

# Find type references
grep -r "Tables<['\"]Registrations['\"]>" --include="*.ts" --include="*.tsx" .

# Find all Tickets references (for phase 2)
grep -r "from(['\"]Tickets['\"]" --include="*.ts" --include="*.tsx" .
```

## Manual Updates Required

1. **Remove workaround in** `/app/api/registrations/route.ts`:
```typescript
// DELETE THIS ENTIRE BLOCK:
// Also insert into lowercase table for tickets FK
console.log("Also inserting into registrations (lowercase) table for consistency");
const { error: lowerCaseError } = await userClient
  .from("registrations")
  .insert(registrationRecord)
  .select()
  .single();
```

2. **Update type imports**:
```typescript
// Change from:
.single<Tables<'Registrations'>>();

// To:
.single<Tables<'registrations'>>();
```

3. **Update DB_TABLE_NAMES in** `/lib/supabase-singleton.ts`:
```typescript
// Remove these lines:
Registrations: 'registrations',
Tickets: 'tickets',

// Keep only:
registrations: 'registrations',
tickets: 'tickets',
```

## Testing Checklist

After making these changes:

- [ ] Registration flow creates records in `registrations` only
- [ ] No errors about missing `Registrations` table
- [ ] Foreign keys work correctly
- [ ] Type checking passes
- [ ] All API endpoints function correctly

## Phase 2: Tickets Table Migration

The `Tickets` vs `tickets` situation is more complex as they have completely different schemas. This requires a separate migration strategy based on business requirements.