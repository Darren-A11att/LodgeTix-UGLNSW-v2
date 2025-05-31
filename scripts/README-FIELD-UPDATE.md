# Database Field Update Scripts

This directory contains scripts to help migrate the codebase from camelCase field names to snake_case database field names, based on the mappings defined in `lib/database-mappings.ts`.

## Overview

The database uses snake_case naming convention (e.g., `first_name`, `contact_id`) while the codebase historically used camelCase (e.g., `firstName`, `contactId`). These scripts help automate the migration process.

## Available Scripts

### 1. `update-fields-to-database.ts` - Comprehensive Update Script

The main script that performs intelligent pattern-based replacements across the codebase.

**Features:**
- Handles multiple replacement contexts (object properties, destructuring, type definitions, etc.)
- Updates field names, table names, and enum values
- Provides detailed statistics and dry-run mode
- Excludes test files and node_modules by default

**Usage:**
```bash
# Dry run (preview changes without modifying files)
npx ts-node scripts/update-fields-to-database.ts --dry-run

# Apply changes to current directory
npx ts-node scripts/update-fields-to-database.ts

# Apply changes to specific directory
npx ts-node scripts/update-fields-to-database.ts ./src --dry-run
```

### 2. `update-fields-simple.ts` - Simple Update Script

A simpler version that uses basic word boundary matching. Good for initial passes or simpler codebases.

**Features:**
- Simple whole-word replacement
- Optional backup creation
- Faster execution but less precise

**Usage:**
```bash
# Dry run
npx ts-node scripts/update-fields-simple.ts --dry-run

# Run with backup
npx ts-node scripts/update-fields-simple.ts --backup

# Apply to specific directory
npx ts-node scripts/update-fields-simple.ts ./components
```

### 3. `validate-field-usage.ts` - Field Usage Validator

Checks the codebase for any remaining camelCase field names that should be snake_case.

**Features:**
- Identifies incorrect field naming
- Shows file, line, and column information
- Helps verify migration completeness

**Usage:**
```bash
# Validate current directory
npx ts-node scripts/validate-field-usage.ts

# Validate specific directory
npx ts-node scripts/validate-field-usage.ts ./src
```

### 4. `generate-field-helpers.ts` - TypeScript Helper Generator

Generates TypeScript helper functions and types for field name conversions.

**Features:**
- Type-safe conversion functions
- Object transformation utilities
- Field mapping types for TypeScript

**Usage:**
```bash
# Generate helpers
npx ts-node scripts/generate-field-helpers.ts
```

This creates `lib/database-field-helpers.ts` with utilities like:
```typescript
import { toSnakeCase, toCamelCase, toSnakeCaseObject } from './lib/database-field-helpers';

// Convert field names
const dbField = toSnakeCase('firstName'); // 'first_name'
const codeField = toCamelCase('first_name'); // 'firstName'

// Convert objects
const dbData = toSnakeCaseObject({ firstName: 'John', lastName: 'Doe' });
// { first_name: 'John', last_name: 'Doe' }
```

## Recommended Migration Process

1. **Backup your code** (use git or create a branch)

2. **Generate helpers** for gradual migration:
   ```bash
   npx ts-node scripts/generate-field-helpers.ts
   ```

3. **Validate current state** to see what needs updating:
   ```bash
   npx ts-node scripts/validate-field-usage.ts
   ```

4. **Dry run the comprehensive update** to preview changes:
   ```bash
   npx ts-node scripts/update-fields-to-database.ts --dry-run
   ```

5. **Apply the updates**:
   ```bash
   npx ts-node scripts/update-fields-to-database.ts
   ```

6. **Validate again** to ensure completeness:
   ```bash
   npx ts-node scripts/validate-field-usage.ts
   ```

7. **Run your tests** to ensure nothing broke

8. **TypeScript compilation** to catch any type errors:
   ```bash
   npm run build
   ```

## Field Mappings

The scripts use mappings from `lib/database-mappings.ts`:

- **Field mappings**: `contactId` → `contact_id`, `firstName` → `first_name`, etc.
- **Table mappings**: `contacts` → `contacts`, `eventTickets` → `event_tickets`, etc.
- **Enum mappings**: `Mason` → `mason`, `GrandLodge` → `grand_lodge`, etc.

## Troubleshooting

### Some fields weren't updated
- The comprehensive script uses pattern matching that might miss some edge cases
- Try the simple script for remaining cases
- Manual review may be needed for complex scenarios

### TypeScript errors after update
- Run `npm run build` to see all type errors
- The generated helpers can help with gradual migration
- You may need to update type definitions manually

### Tests failing
- Database queries now expect snake_case fields
- Update your test fixtures and mocks accordingly
- Check for hardcoded field names in tests

## Adding New Mappings

To add new field mappings:

1. Edit `lib/database-mappings.ts`
2. Add your mappings to the appropriate object:
   ```typescript
   export const DATABASE_FIELD_MAPPINGS = {
     // ... existing mappings
     "newFieldName": "new_field_name",
   };
   ```
3. Re-run the scripts to apply new mappings

## Safety Notes

- Always use `--dry-run` first to preview changes
- The scripts skip `node_modules`, `.git`, and build directories
- Create backups before running in production codebases
- Review git diff after running to ensure correctness
- Run your test suite after migration