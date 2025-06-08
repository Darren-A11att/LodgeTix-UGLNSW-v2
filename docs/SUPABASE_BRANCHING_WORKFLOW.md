# Supabase Branching Workflow for LodgeTix

## Overview
This document outlines the proper workflow for using Supabase database branching with production data.

## Prerequisites
- Supabase CLI installed and configured
- Git repository with clean working tree
- Production database access

## Workflow Steps

### 1. Create a Development Branch in Git
```bash
git checkout -b development
```

### 2. Create a Supabase Database Branch
```bash
# Login to Supabase (if not already logged in)
supabase login

# Link your project
supabase link --project-ref pwwpcjbbxotmiqrisjvf

# Create a database branch
supabase branches create development --experimental
```

### 3. Switch to the Development Branch
```bash
# List branches
supabase branches list --experimental

# Switch to development branch
supabase branches switch development --experimental
```

### 4. Apply New Migrations to Branch
```bash
# Create new migration
supabase migration new your_migration_name

# Edit the migration file in supabase/migrations/

# Push changes to your branch database
supabase db push
```

### 5. Test Your Changes
- Your branch has its own database instance
- Test all changes thoroughly
- Use the branch-specific connection string for testing

### 6. Merge Changes Back to Production
```bash
# Switch back to main branch
git checkout main
supabase branches switch main --experimental

# Merge your Git changes
git merge development

# The migrations will be applied to production on next deployment
```

## Connection URLs

### Production Database
- Direct: `postgresql://postgres:VkLOwjeRErVm1aCd@db.pwwpcjbbxotmiqrisjvf.supabase.co:5432/postgres`
- Pooled: `postgresql://postgres.pwwpcjbbxotmiqrisjvf:VkLOwjeRErVm1aCd@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres`

### Branch Database
- Will be provided when you create the branch
- Format: `postgresql://postgres:[password]@db.[branch-id].supabase.co:5432/postgres`

## Best Practices

1. **Always test migrations on a branch first**
   - Create branch before making schema changes
   - Test thoroughly before merging

2. **Keep migrations small and focused**
   - One logical change per migration
   - Easier to debug and rollback if needed

3. **Use descriptive migration names**
   - Include date and description
   - Example: `20250608_add_user_preferences_table`

4. **Document breaking changes**
   - Note any changes that require app code updates
   - Coordinate deployments accordingly

5. **Regular branch cleanup**
   - Delete branches after merging
   - Keep branch list manageable

## Troubleshooting

### Migration Conflicts
If you see "migration history does not match":
1. Check migration list: `supabase migration list`
2. Repair if needed: `supabase migration repair --status applied [migration_name]`
3. Ensure all team members are synced

### SSL Connection Issues
Use direct connection URL (port 5432) for migration operations instead of pooled connection.

### Branch Creation Fails
- Ensure you're on a paid Supabase plan (branching requires Pro plan)
- Check project permissions
- Try logging out and back in: `supabase logout && supabase login`

## Environment-Specific Configuration

### Development
```env
NEXT_PUBLIC_SUPABASE_URL=https://[branch-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[branch-anon-key]
DATABASE_URL=postgresql://postgres:[password]@db.[branch-id].supabase.co:5432/postgres
```

### Production
```env
NEXT_PUBLIC_SUPABASE_URL=https://pwwpcjbbxotmiqrisjvf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[production-anon-key]
DATABASE_URL=postgresql://postgres:VkLOwjeRErVm1aCd@db.pwwpcjbbxotmiqrisjvf.supabase.co:5432/postgres
```

## Next Steps
1. Set up Vercel preview deployments to use Supabase branches
2. Configure CI/CD to run migrations automatically
3. Set up monitoring for database performance