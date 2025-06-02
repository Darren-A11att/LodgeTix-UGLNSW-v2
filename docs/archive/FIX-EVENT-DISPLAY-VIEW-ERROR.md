# Fix for "event_display_view does not exist" Error

## Problem

When trying to access an event page, you're getting this error:
```
Error in get_event_with_details: relation "event_display_view" does not exist 42P01
```

This happens because the database is using an outdated version of the `get_event_with_details` RPC function that references a view (`event_display_view`) that no longer exists.

## Solution

### Step 1: Apply the Database Fix

Run the SQL script to update the RPC function. You have two options:

#### Option A: Using Node.js Script
```bash
npm run tsx scripts/apply-rpc-fix.ts
```
This will generate the SQL and show you how to apply it.

#### Option B: Direct SQL in Supabase Dashboard

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to SQL Editor
4. Run the SQL from `scripts/fix-event-rpc-function.sql`

### Step 2: Environment Configuration (Optional)

The application supports multi-tenant filtering using environment variables. You already have:

```bash
FEATURED_FUNCTION_ID=eebddef5-6833-43e3-8d32-700508b1c089
```

This will automatically:
- Show events from this function in the featured events section
- Filter all event queries to only show events from this function

For more explicit filtering control, you can also use:

```bash
# Filter by specific function
FILTER_TO=function
FUNCTION_ID=your-function-uuid-here

# OR filter by organisation
FILTER_TO=organisation
ORGANISATION_ID=your-organisation-uuid-here
```

If neither `FILTER_TO` nor explicit IDs are set, the system falls back to using `FEATURED_FUNCTION_ID` for filtering.

## What Changed

### Database Changes

The updated RPC function:
- No longer depends on `event_display_view`
- Queries tables directly (events, functions, locations, etc.)
- Supports the new functions architecture where events belong to functions
- Returns proper ticket and package information

### Code Changes

The EventRPCService now:
- Imports environment configuration helpers
- Automatically applies function/organisation filtering based on environment variables
- Filters both list queries and individual event fetches
- Logs when events are filtered out for debugging

## Testing

After applying the fix:

1. Test event listing:
```
http://localhost:3000/events
```

2. Test individual event page:
```
http://localhost:3000/events/welcome-reception
```

3. If using filtering, verify only events from your configured function/organisation appear

## Troubleshooting

If the error persists:

1. **Check migration was applied**: In Supabase SQL Editor, run:
```sql
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'get_event_with_details';
```
The function source should NOT contain references to `event_display_view`.

2. **Clear Next.js cache**:
```bash
rm -rf .next
npm run dev
```

3. **Check environment variables**: Ensure your `.env.local` has valid UUIDs if filtering is enabled:
```bash
# Get function IDs
SELECT function_id, name FROM functions;

# Get organisation IDs  
SELECT organisation_id, name FROM organisations;
```

## Migration Files Reference

- Original migration: `20250601132505_db_009_update_rpc_functions_for_functions_architecture.sql`
- Fix script: `scripts/fix-event-rpc-function.sql`
- Apply script: `scripts/apply-rpc-fix.ts`