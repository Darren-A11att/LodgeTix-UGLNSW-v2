# Supabase Web Portal Migration Guide

This guide explains how to execute the events migration using the Supabase web portal.

## Files to Execute

You have three SQL files to run in order:

1. **web-portal-1-schema.sql** - Creates the events schema and tables
2. **web-portal-2-seed-data.sql** - Inserts the seed data
3. **web-portal-3-verify.sql** - Verification queries

## Step-by-Step Instructions

### 1. Login to Supabase

1. Go to [app.supabase.com](https://app.supabase.com)
2. Login and select your project

### 2. Execute the Schema

1. Navigate to the SQL Editor (left sidebar)
2. Click "New Query"
3. Copy the entire contents of `web-portal-1-schema.sql`
4. Paste into the query editor
5. Click "Run" or press Cmd+Enter (Mac) / Ctrl+Enter (PC)
6. You should see "Success. No rows returned"

### 3. Insert Seed Data

1. Click "New Query" again
2. Copy the entire contents of `web-portal-2-seed-data.sql`
3. Paste into the query editor
4. Click "Run"
5. You should see "Success. No rows returned"

### 4. Verify the Migration

1. Click "New Query" again
2. Copy any of the queries from `web-portal-3-verify.sql`
3. Paste and run to verify your data
4. You should see results showing your events

### 5. Check the Tables

You can also verify using the Table Editor:

1. Click "Table Editor" in the left sidebar
2. You should see "events" in the schema dropdown
3. Select it and you'll see the events table
4. Click on the table to browse the data

## What Gets Created

### Schema: `events`
- Table: `events.events` - Main events table
- View: `events.formatted_events` - Formatted dates/times view
- Function: `events.update_modified_column()` - Auto-update timestamps
- Policies: RLS policies for security

### Data: 8 Events
1. Grand Installation 2023
2. Grand Banquet 2023
3. Farewell Brunch 2023
4. Sydney Harbour Cruise 2023
5. Third Degree Ceremony 2023
6. Masonic Education Night 2023
7. Annual Charity Gala 2023
8. Grand Installation 2025

## After Migration

Once the migration is complete:

1. Add to your `.env.local`:
   ```bash
   NEXT_PUBLIC_USE_EVENTS_SCHEMA=true
   ```

2. Test your application:
   ```bash
   npm run dev
   ```

3. Visit test pages:
   - http://localhost:3000/test-events
   - http://localhost:3000/events/grand-installation

## Troubleshooting

### Schema Already Exists
If you get an error about the schema already existing, you can drop it first:
```sql
DROP SCHEMA IF EXISTS events CASCADE;
```

### Permission Issues
Make sure your database user has permission to create schemas.

### Data Conflicts
If you get unique constraint violations, the data might already exist. Check with:
```sql
SELECT * FROM events.events;
```

## Quick Test Query

After migration, run this to see your events:
```sql
SELECT 
  title,
  slug,
  event_start,
  category
FROM events.events
ORDER BY event_start;
```

## Support

If you encounter issues:
1. Check the error message in the SQL editor
2. Verify your Supabase URL and anon key in `.env.local`
3. Ensure RLS is configured correctly for your use case