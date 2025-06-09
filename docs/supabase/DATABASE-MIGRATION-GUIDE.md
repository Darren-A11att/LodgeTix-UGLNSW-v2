# Supabase Database Migration Guide

## Overview

This guide covers database migration best practices for the LodgeTix UGLNSW project using Supabase. Proper migration management ensures database schema changes are versioned, tested, and safely deployed across all environments.

## Table of Contents

1. [Migration Fundamentals](#migration-fundamentals)
2. [Creating Migrations](#creating-migrations)
3. [Testing Migrations](#testing-migrations)
4. [Deployment Strategy](#deployment-strategy)
5. [Migration Patterns](#migration-patterns)
6. [Rollback Procedures](#rollback-procedures)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

## Migration Fundamentals

### What are Migrations?

Database migrations are version-controlled SQL scripts that incrementally change your database schema. They ensure:
- **Consistency**: Same schema across all environments
- **Traceability**: History of all schema changes
- **Reversibility**: Ability to rollback changes
- **Collaboration**: Team members stay synchronized

### Migration Structure

```
supabase/migrations/
├── 20240101000000_initial_schema.sql
├── 20240102000000_add_user_preferences.sql
├── 20240103000000_create_functions_table.sql
└── 20240104000000_add_rls_policies.sql
```

Each migration file:
- Has a timestamp prefix (ensures order)
- Contains descriptive name
- Is immutable once deployed
- Runs in a transaction

## Creating Migrations

### Step 1: Generate Migration File

```bash
# Create new migration
supabase migration new descriptive_name

# Example
supabase migration new add_user_preferences_table
```

This creates: `supabase/migrations/[timestamp]_add_user_preferences_table.sql`

### Step 2: Write Migration SQL

```sql
-- supabase/migrations/20240104000000_add_user_preferences_table.sql

-- Create user preferences table
CREATE TABLE public.user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  theme TEXT NOT NULL DEFAULT 'light' CHECK (theme IN ('light', 'dark')),
  notifications_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Users can only access their own preferences
CREATE POLICY "Users can manage own preferences" ON public.user_preferences
  FOR ALL USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes
CREATE INDEX idx_user_preferences_user_id ON public.user_preferences(user_id);

-- Add comments
COMMENT ON TABLE public.user_preferences IS 'User application preferences';
COMMENT ON COLUMN public.user_preferences.theme IS 'UI theme preference';
```

### Step 3: Document Migration

Add a comment block at the top:

```sql
/*
  # Add User Preferences Table
  
  ## Purpose
  Store user-specific application preferences
  
  ## Changes
  1. Creates user_preferences table
  2. Adds RLS policies for user access
  3. Creates updated_at trigger
  4. Adds performance indexes
  
  ## Rollback
  DROP TABLE IF EXISTS public.user_preferences CASCADE;
*/
```

## Testing Migrations

### Local Testing Workflow

1. **Reset and Apply**
   ```bash
   # Reset database and apply all migrations
   supabase db reset
   ```

2. **Test Specific Migration**
   ```bash
   # Apply migrations up to specific point
   supabase db push --up-to 20240104000000
   ```

3. **Verify Schema**
   ```bash
   # Generate TypeScript types
   supabase gen types typescript --local > types/database.ts
   
   # Check schema diff
   supabase db diff
   ```

### Testing Checklist

- [ ] Migration runs without errors
- [ ] Schema matches expectations
- [ ] RLS policies work correctly
- [ ] Indexes are created
- [ ] Performance is acceptable
- [ ] Rollback script works

### Data Migration Testing

For migrations that modify data:

```sql
-- Test with sample data
BEGIN;

-- Run migration
UPDATE users SET status = 'active' WHERE status IS NULL;

-- Verify results
SELECT COUNT(*) FROM users WHERE status = 'active';

-- Rollback if needed
ROLLBACK;
```

## Deployment Strategy

### Environment Progression

```
Local Testing → Staging Deployment → Production Deployment
```

### Deployment Steps

1. **Local Development**
   ```bash
   # Develop and test locally
   supabase migration new feature_name
   # Edit migration file
   supabase db reset
   ```

2. **Staging Deployment**
   ```bash
   # Switch to staging
   supabase link --project-ref staging-id
   
   # Deploy migrations
   supabase db push
   
   # Verify deployment
   supabase db remote status
   ```

3. **Production Deployment**
   ```bash
   # Switch to production
   supabase link --project-ref prod-id
   
   # Deploy migrations (via CI/CD recommended)
   supabase db push
   ```

### CI/CD Integration

```yaml
# .github/workflows/deploy-migrations.yml
name: Deploy Database Migrations

on:
  push:
    branches: [main]
    paths:
      - 'supabase/migrations/*.sql'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: supabase/setup-cli@v1
      
      - name: Deploy to Staging
        run: |
          supabase link --project-ref ${{ secrets.STAGING_PROJECT_ID }}
          supabase db push
          
      - name: Run Tests
        run: npm run test:integration
        
      - name: Deploy to Production
        if: success()
        run: |
          supabase link --project-ref ${{ secrets.PROD_PROJECT_ID }}
          supabase db push
```

## Migration Patterns

### 1. Table Creation Pattern

```sql
-- Standard table creation
CREATE TABLE public.table_name (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign keys
  related_id UUID REFERENCES related_table(id) ON DELETE CASCADE,
  
  -- Required fields
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  
  -- Optional fields
  description TEXT,
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.table_name ENABLE ROW LEVEL SECURITY;

-- Add policies
CREATE POLICY "Public read access" ON public.table_name
  FOR SELECT USING (status = 'active');

-- Add indexes
CREATE INDEX idx_table_name_status ON public.table_name(status);
CREATE INDEX idx_table_name_created_at ON public.table_name(created_at DESC);

-- Add triggers
CREATE TRIGGER update_table_name_updated_at
  BEFORE UPDATE ON public.table_name
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
```

### 2. Column Addition Pattern

```sql
-- Add column with default
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}' NOT NULL;

-- Add comment
COMMENT ON COLUMN public.users.preferences IS 'User preferences JSON';

-- Backfill existing data
UPDATE public.users 
SET preferences = '{"notifications": true}'::jsonb 
WHERE preferences = '{}'::jsonb;

-- Add index if needed
CREATE INDEX idx_users_preferences ON public.users USING gin(preferences);
```

### 3. Safe Column Rename

```sql
-- Step 1: Add new column
ALTER TABLE public.events ADD COLUMN event_date TIMESTAMPTZ;

-- Step 2: Copy data
UPDATE public.events SET event_date = date;

-- Step 3: Add constraints
ALTER TABLE public.events ALTER COLUMN event_date SET NOT NULL;

-- Step 4: In separate migration later
ALTER TABLE public.events DROP COLUMN date;
```

### 4. Enum Type Pattern

```sql
-- Create enum type
CREATE TYPE public.registration_status AS ENUM (
  'draft',
  'pending',
  'confirmed',
  'cancelled'
);

-- Use in table
ALTER TABLE public.registrations 
ADD COLUMN status public.registration_status NOT NULL DEFAULT 'draft';

-- Add new value to enum (requires special handling)
ALTER TYPE public.registration_status ADD VALUE 'expired';
```

### 5. RLS Policy Pattern

```sql
-- Comprehensive RLS setup
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "Anyone can view published documents"
  ON public.documents FOR SELECT
  USING (is_published = true);

-- Authenticated create
CREATE POLICY "Authenticated users can create documents"
  ON public.documents FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Owner update/delete
CREATE POLICY "Users can manage own documents"
  ON public.documents FOR ALL
  USING (auth.uid() = user_id);

-- Admin override
CREATE POLICY "Admins can manage all documents"
  ON public.documents FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

## Rollback Procedures

### Immediate Rollback

For migrations that just failed:

```bash
# Check current migration status
supabase db remote status

# Revert last migration
supabase db remote revert
```

### Manual Rollback Scripts

Create corresponding rollback files:

```
supabase/migrations/
├── 20240104000000_add_user_preferences.sql
└── rollback/
    └── 20240104000000_add_user_preferences_rollback.sql
```

Rollback script:
```sql
-- rollback/20240104000000_add_user_preferences_rollback.sql

-- Drop policies first
DROP POLICY IF EXISTS "Users can manage own preferences" ON public.user_preferences;

-- Drop triggers
DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON public.user_preferences;

-- Drop indexes
DROP INDEX IF EXISTS idx_user_preferences_user_id;

-- Drop table
DROP TABLE IF EXISTS public.user_preferences CASCADE;
```

### Rollback Strategy

1. **Identify Issue**
   ```sql
   -- Check migration history
   SELECT * FROM supabase_migrations.schema_migrations
   ORDER BY version DESC;
   ```

2. **Execute Rollback**
   ```bash
   # Run rollback script
   psql $DATABASE_URL -f rollback/20240104000000_add_user_preferences_rollback.sql
   ```

3. **Update Migration Table**
   ```sql
   -- Remove migration record
   DELETE FROM supabase_migrations.schema_migrations
   WHERE version = '20240104000000';
   ```

## Best Practices

### 1. Migration Principles

**DO**:
- Write idempotent migrations (can run multiple times)
- Test on copy of production data
- Include rollback procedures
- Use transactions for data changes
- Add helpful comments

**DON'T**:
- Modify existing migrations
- Use `DROP TABLE` without `CASCADE`
- Make breaking changes without warning
- Skip testing in staging
- Include sensitive data

### 2. Performance Considerations

**For Large Tables**:
```sql
-- Add index concurrently (doesn't lock table)
CREATE INDEX CONCURRENTLY idx_large_table_column 
ON public.large_table(column);

-- Add column with default in steps
ALTER TABLE public.large_table ADD COLUMN new_column BOOLEAN;
UPDATE public.large_table SET new_column = false WHERE new_column IS NULL;
ALTER TABLE public.large_table ALTER COLUMN new_column SET DEFAULT false;
ALTER TABLE public.large_table ALTER COLUMN new_column SET NOT NULL;
```

### 3. Breaking Changes

**Approach**:
1. Add backward-compatible change
2. Update application code
3. Remove old structure (separate migration)

**Example**:
```sql
-- Migration 1: Add new column
ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT false;

-- Application deploys here

-- Migration 2: Remove old column (weeks later)
ALTER TABLE users DROP COLUMN is_verified;
```

### 4. Data Integrity

**Always Verify**:
```sql
-- Before migration
SELECT COUNT(*) FROM affected_table;

-- After migration
SELECT COUNT(*) FROM affected_table;

-- Verify constraints
SELECT conname, contype, conrelid::regclass
FROM pg_constraint
WHERE conrelid = 'affected_table'::regclass;
```

### 5. Documentation

**Include in Each Migration**:
- Purpose and context
- Breaking changes warning
- Performance impact notes
- Rollback instructions
- Related application changes

## Troubleshooting

### Common Issues

1. **Migration Already Exists**
   ```
   Error: Migration already applied
   ```
   **Solution**: Check migration history, use new timestamp

2. **Foreign Key Constraint Violation**
   ```
   Error: violates foreign key constraint
   ```
   **Solution**: Check data integrity, add CASCADE if appropriate

3. **Timeout on Large Table**
   ```
   Error: statement timeout
   ```
   **Solution**: Use CONCURRENTLY, batch updates

4. **RLS Policy Conflicts**
   ```
   Error: policy already exists
   ```
   **Solution**: Use IF NOT EXISTS, check existing policies

### Debug Commands

```bash
# Check migration status
supabase db remote status

# View migration history
supabase db remote history

# Generate SQL diff
supabase db diff

# Lint migrations
supabase db lint
```

### Recovery Procedures

**If Production Migration Fails**:

1. **Don't Panic** - Migrations run in transactions
2. **Check Status** - Verify what actually changed
3. **Communicate** - Inform team immediately
4. **Rollback** - Use prepared rollback script
5. **Post-Mortem** - Document what happened

## Migration Examples

### Complex Migration Example

```sql
/*
  # Implement Multi-tenant Architecture
  
  ## Changes
  1. Add organization_id to all tables
  2. Update RLS policies for multi-tenancy
  3. Migrate existing data to default org
  4. Add performance indexes
*/

BEGIN;

-- 1. Create organizations table
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Add organization_id to existing tables
ALTER TABLE public.projects 
ADD COLUMN organization_id UUID REFERENCES public.organizations(id);

-- 3. Create default organization
INSERT INTO public.organizations (id, name, slug)
VALUES ('00000000-0000-0000-0000-000000000000', 'Default', 'default');

-- 4. Migrate existing data
UPDATE public.projects 
SET organization_id = '00000000-0000-0000-0000-000000000000'
WHERE organization_id IS NULL;

-- 5. Make column required
ALTER TABLE public.projects 
ALTER COLUMN organization_id SET NOT NULL;

-- 6. Update RLS policies
DROP POLICY IF EXISTS "Users can view own projects" ON public.projects;

CREATE POLICY "Users can view organization projects" ON public.projects
FOR SELECT USING (
  organization_id IN (
    SELECT organization_id 
    FROM public.organization_members 
    WHERE user_id = auth.uid()
  )
);

-- 7. Add indexes
CREATE INDEX idx_projects_organization_id ON public.projects(organization_id);
CREATE INDEX idx_organization_members_user_org 
ON public.organization_members(user_id, organization_id);

COMMIT;
```

## Next Steps

1. Learn about local development: [ENVIRONMENT-MANAGEMENT.md](./ENVIRONMENT-MANAGEMENT.md)
2. Set up edge functions: [edge-functions/DEVELOPMENT-GUIDE.md](./edge-functions/DEVELOPMENT-GUIDE.md)  
3. Configure CI/CD: [edge-functions/DEPLOYMENT-GUIDE.md](./edge-functions/DEPLOYMENT-GUIDE.md)

## Additional Resources

- [Supabase Migration Reference](https://supabase.com/docs/guides/cli/migrations)
- [PostgreSQL Best Practices](https://wiki.postgresql.org/wiki/Don't_Do_This)
- [SQL Style Guide](https://www.sqlstyle.guide/)