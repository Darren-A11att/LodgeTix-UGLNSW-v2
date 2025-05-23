# Task 041: Complete Database Naming Migration

**Priority**: High  
**Category**: Database Integrity  
**Dependencies**: None  
**Estimated Time**: 4 hours  

## Problem

The database has inconsistent naming conventions with a mix of:
- PascalCase (Events, Customers)
- camelCase (attendeeevents)
- snake_case (event_days, ticket_definitions)

This inconsistency causes:
- Confusion about correct table names
- Complex mapping logic in `supabase-singleton.ts`
- Potential bugs from incorrect table references
- Difficult database maintenance

## Current State

From `lib/supabase-singleton.ts`, we have multiple naming mappings:

```typescript
export const DB_TABLE_NAMES = {
  // Old PascalCase/camelCase names mapping to new snake_case names
  Events: 'events',
  DisplayScopes: 'displayscopes',
  Customers: 'customers',
  Registrations: 'registrations',
  // ... many more mappings
};
```

## Solution

Complete the migration to consistent snake_case naming for all database objects:
1. Tables
2. Columns
3. Indexes
4. Foreign keys
5. Functions

## Implementation Steps

### 1. Analyze Current Schema

Create `scripts/analyze-database-schema.ts`:

```typescript
import { getServerClient } from '@/lib/supabase-singleton';

async function analyzeSchema() {
  const supabase = getServerClient();
  
  // Get all tables
  const { data: tables } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public');

  // Get all columns
  const { data: columns } = await supabase
    .from('information_schema.columns')
    .select('table_name, column_name')
    .eq('table_schema', 'public');

  // Categorize by naming convention
  const analysis = {
    tables: {
      snake_case: [],
      PascalCase: [],
      camelCase: [],
      other: []
    },
    columns: {
      snake_case: [],
      PascalCase: [],
      camelCase: [],
      other: []
    }
  };

  // Analyze tables
  tables?.forEach(({ table_name }) => {
    if (/^[a-z]+(_[a-z]+)*$/.test(table_name)) {
      analysis.tables.snake_case.push(table_name);
    } else if (/^[A-Z][a-zA-Z]*$/.test(table_name)) {
      analysis.tables.PascalCase.push(table_name);
    } else if (/^[a-z][a-zA-Z]*$/.test(table_name)) {
      analysis.tables.camelCase.push(table_name);
    } else {
      analysis.tables.other.push(table_name);
    }
  });

  // Generate migration plan
  const migrations = [];
  
  [...analysis.tables.PascalCase, ...analysis.tables.camelCase].forEach(table => {
    const snake_case_name = table
      .replace(/([A-Z])/g, '_$1')
      .toLowerCase()
      .replace(/^_/, '');
    
    migrations.push({
      type: 'table',
      old: table,
      new: snake_case_name
    });
  });

  return { analysis, migrations };
}
```

### 2. Create Migration Script

Create `supabase/migrations/20240101000000_standardize_naming_conventions.sql`:

```sql
-- Standardize Database Naming Conventions
-- This migration converts all tables and columns to snake_case

BEGIN;

-- Create migration tracking table
CREATE TABLE IF NOT EXISTS migration_history (
  id SERIAL PRIMARY KEY,
  migration_name VARCHAR(255) NOT NULL,
  executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  old_name VARCHAR(255),
  new_name VARCHAR(255),
  object_type VARCHAR(50)
);

-- Function to rename table and track change
CREATE OR REPLACE FUNCTION rename_table_tracked(old_name TEXT, new_name TEXT)
RETURNS VOID AS $$
BEGIN
  -- Check if table exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = old_name
  ) THEN
    -- Check if new name already exists
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = new_name
    ) THEN
      EXECUTE format('ALTER TABLE %I RENAME TO %I', old_name, new_name);
      
      INSERT INTO migration_history (migration_name, old_name, new_name, object_type)
      VALUES ('standardize_naming_conventions', old_name, new_name, 'table');
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Rename tables to snake_case
SELECT rename_table_tracked('Events', 'events');
SELECT rename_table_tracked('DisplayScopes', 'display_scopes');
SELECT rename_table_tracked('Customers', 'customers');
SELECT rename_table_tracked('Registrations', 'registrations');
SELECT rename_table_tracked('Tickets', 'tickets');
SELECT rename_table_tracked('Attendees', 'attendees');
SELECT rename_table_tracked('AttendeeEvents', 'attendee_events');
SELECT rename_table_tracked('EventTickets', 'event_tickets');
SELECT rename_table_tracked('EventPackages', 'event_packages');
SELECT rename_table_tracked('EventPackageTickets', 'event_package_tickets');
SELECT rename_table_tracked('MasonicProfiles', 'masonic_profiles');
SELECT rename_table_tracked('OrganisationMemberships', 'organisation_memberships');
SELECT rename_table_tracked('EventDays', 'event_days');
SELECT rename_table_tracked('Masons', 'masons');
SELECT rename_table_tracked('Guests', 'guests');
SELECT rename_table_tracked('Contacts', 'contacts');
SELECT rename_table_tracked('TicketDefinitions', 'ticket_definitions');

-- Fix column names (example for common patterns)
DO $$
DECLARE
  r RECORD;
BEGIN
  -- Fix camelCase columns in attendees table
  FOR r IN 
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'attendees'
    AND column_name ~ '[A-Z]'
  LOOP
    EXECUTE format(
      'ALTER TABLE attendees RENAME COLUMN %I TO %I',
      r.column_name,
      lower(regexp_replace(r.column_name, '([A-Z])', '_\1', 'g'))
    );
  END LOOP;
END $$;

-- Update foreign key constraints to use new names
DO $$
DECLARE
  r RECORD;
  new_constraint_name TEXT;
BEGIN
  FOR r IN 
    SELECT 
      tc.constraint_name,
      tc.table_name,
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name
    FROM information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
  LOOP
    -- Generate new constraint name in format: table_column_fkey
    new_constraint_name := r.table_name || '_' || r.column_name || '_fkey';
    
    IF r.constraint_name != new_constraint_name THEN
      EXECUTE format(
        'ALTER TABLE %I RENAME CONSTRAINT %I TO %I',
        r.table_name,
        r.constraint_name,
        new_constraint_name
      );
    END IF;
  END LOOP;
END $$;

-- Create views for backward compatibility (temporary)
CREATE OR REPLACE VIEW "Events" AS SELECT * FROM events;
CREATE OR REPLACE VIEW "Customers" AS SELECT * FROM customers;
CREATE OR REPLACE VIEW "Registrations" AS SELECT * FROM registrations;
-- Add more views as needed

-- Drop the helper function
DROP FUNCTION rename_table_tracked(TEXT, TEXT);

COMMIT;
```

### 3. Update Application Code

Create `scripts/update-table-references.ts`:

```typescript
import * as fs from 'fs';
import * as path from 'path';
import * as glob from 'glob';

const tableNameMappings = {
  'Events': 'events',
  'DisplayScopes': 'display_scopes',
  'Customers': 'customers',
  'Registrations': 'registrations',
  'Tickets': 'tickets',
  'Attendees': 'attendees',
  'AttendeeEvents': 'attendee_events',
  'EventTickets': 'event_tickets',
  'EventPackages': 'event_packages',
  'EventPackageTickets': 'event_package_tickets',
  'MasonicProfiles': 'masonic_profiles',
  'OrganisationMemberships': 'organisation_memberships',
};

function updateTableReferences() {
  const files = glob.sync('**/*.{ts,tsx}', {
    ignore: ['node_modules/**', '.next/**', 'scripts/**']
  });

  files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let updated = false;

    // Update .from() calls
    Object.entries(tableNameMappings).forEach(([old, new_name]) => {
      const regex = new RegExp(`\\.from\\(['"\`]${old}['"\`]\\)`, 'g');
      if (regex.test(content)) {
        content = content.replace(regex, `.from('${new_name}')`);
        updated = true;
      }
    });

    // Update table references in strings
    Object.entries(tableNameMappings).forEach(([old, new_name]) => {
      const regex = new RegExp(`(['"\`])${old}(['"\`])`, 'g');
      if (regex.test(content)) {
        content = content.replace(regex, `$1${new_name}$2`);
        updated = true;
      }
    });

    if (updated) {
      fs.writeFileSync(file, content);
      console.log(`Updated: ${file}`);
    }
  });
}

updateTableReferences();
```

### 4. Simplify Supabase Singleton

After migration, update `lib/supabase-singleton.ts`:

```typescript
// Remove the complex mapping object
// export const DB_TABLE_NAMES = { ... }

// Simplified table helper
export function table(tableName: string, isServer = false) {
  const client = getSupabaseClient(isServer);
  
  // All tables now use snake_case consistently
  return client.from(tableName as keyof Database['public']['Tables']);
}

// Export standard table names
export const Tables = {
  events: 'events',
  customers: 'customers',
  registrations: 'registrations',
  tickets: 'tickets',
  attendees: 'attendees',
  attendee_events: 'attendee_events',
  event_tickets: 'event_tickets',
  event_packages: 'event_packages',
  event_package_tickets: 'event_package_tickets',
  masonic_profiles: 'masonic_profiles',
  organisation_memberships: 'organisation_memberships',
  // ... etc
} as const;
```

### 5. Update Type Definitions

Regenerate Supabase types after migration:

```bash
npx supabase gen types typescript --project-id your-project-id > supabase/types.ts
```

### 6. Testing Plan

Create `scripts/test-migration.ts`:

```typescript
import { getServerClient, Tables } from '@/lib/supabase-singleton';

async function testMigration() {
  const supabase = getServerClient();
  const errors = [];

  // Test each table
  for (const [key, tableName] of Object.entries(Tables)) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
        
      if (error) {
        errors.push(`Table ${tableName}: ${error.message}`);
      }
    } catch (e) {
      errors.push(`Table ${tableName}: ${e.message}`);
    }
  }

  if (errors.length > 0) {
    console.error('Migration test failed:');
    errors.forEach(e => console.error(`  - ${e}`));
  } else {
    console.log('✅ All tables accessible with new names');
  }
}
```

## Rollback Plan

Create `supabase/migrations/20240101000001_rollback_naming_conventions.sql`:

```sql
-- Rollback naming convention changes
BEGIN;

-- Recreate original table names
CREATE OR REPLACE VIEW "Events" AS SELECT * FROM events;
CREATE OR REPLACE VIEW "Customers" AS SELECT * FROM customers;
-- ... etc

-- Or rename tables back (if views not sufficient)
-- ALTER TABLE events RENAME TO "Events";
-- ALTER TABLE customers RENAME TO "Customers";

COMMIT;
```

## Verification

1. Run migration in development first
2. Test all critical queries
3. Verify foreign key constraints
4. Check that all API endpoints work
5. Run full test suite

## Benefits

- Consistent naming across entire database
- Simplified code without mapping logic
- Better SQL readability
- Easier database maintenance
- Standard PostgreSQL conventions

## Next Steps

1. Implement database transactions (Task 042)
2. Add proper indexes (Task 043)
3. Set up database monitoring
4. Document schema conventions