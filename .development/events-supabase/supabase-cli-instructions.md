# Supabase CLI Migration Instructions

## Prerequisites

1. Install Supabase CLI (if not already installed):
```bash
npm install -g supabase
```

2. Get your project reference from your Supabase URL:
   - Your URL: `https://[PROJECT_REF].supabase.co`
   - Example: If URL is `https://xyzabc123.supabase.co`, then PROJECT_REF is `xyzabc123`

## Step 1: Execute Schema with Supabase CLI

### Option A: Use the Automated Script
```bash
# Run the automated script
./scripts/supabase-cli-migration.sh
```

### Option B: Manual Steps
```bash
# 1. Link to your Supabase project
supabase link --project-ref YOUR_PROJECT_REF

# 2. Execute the events schema
supabase db execute -f .development/events-supabase/01-events-schema-definition.sql

# 3. Add project reference to .env.local
echo "SUPABASE_PROJECT_REF=YOUR_PROJECT_REF" >> .env.local
```

## Step 2: Run the Migration

```bash
# 1. Install dependencies
npm install

# 2. Run the migration script
npm run migrate:events
```

## Step 3: Verify Migration

```bash
# Verify all events were migrated correctly
npm run verify:events
```

## Step 4: Test with Feature Flag

1. Update `.env.local`:
```bash
NEXT_PUBLIC_USE_EVENTS_SCHEMA=true
```

2. Start the development server:
```bash
npm run dev
```

3. Visit the test page:
```
http://localhost:3000/test-events
```

## Step 5: Test Event Pages

Visit these pages to ensure events are loading correctly:
- `/events/grand-installation`
- `/events/third-degree-ceremony`
- `/events/masonic-lecture-series`

## Troubleshooting

### Supabase CLI Issues

If you get authentication errors:
```bash
# Login to Supabase
supabase login

# Then retry linking
supabase link --project-ref YOUR_PROJECT_REF
```

### Schema Execution Errors

If the schema fails to execute:
1. Check the SQL syntax
2. Ensure no conflicting schemas exist
3. Try executing in smaller chunks

### Migration Script Errors

If the migration script fails:
1. Check environment variables are set correctly
2. Verify Supabase connection
3. Check console for specific error messages

## Rollback Instructions

If you need to rollback:

1. Disable the feature flag:
```bash
# In .env.local
NEXT_PUBLIC_USE_EVENTS_SCHEMA=false
```

2. Drop the events schema (if needed):
```bash
supabase db execute --sql "DROP SCHEMA IF EXISTS events CASCADE;"
```

## Complete CLI Commands Reference

```bash
# Install CLI
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref YOUR_PROJECT_REF

# Execute SQL file
supabase db execute -f path/to/file.sql

# Execute inline SQL
supabase db execute --sql "SELECT * FROM events.events;"

# Get database status
supabase db remote status

# Push migrations
supabase db push

# Pull remote schema
supabase db pull
```

## Next Steps

After successful migration:
1. Update remaining pages to use the event facade
2. Remove hard-coded events when all pages are updated
3. Build admin UI for event management
4. Remove feature flag when stable