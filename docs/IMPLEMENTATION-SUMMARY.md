# Implementation Summary: Event Display View Fix

## Current Status

### Problem
- The `get_event_with_details` RPC function references a non-existent view `event_display_view`
- This causes error: `relation "event_display_view" does not exist 42P01`

### Environment Configuration
Your `.env.local` already has:
```bash
FILTER_TO=function
FEATURED_FUNCTION_ID=eebddef5-6833-43e3-8d32-700508b1c089
```

This featured function is "Grand Proclamation 2025" which contains 9 events:
- Grand Communication 2025
- Welcome Reception (featured)
- Registration & Welcome Pack Collection
- Grand Proclamation Gala Dinner (featured)
- Partners' Harbour Cruise
- Grand Officers Preparation Meeting
- Grand Proclamation Ceremony (featured)
- Thanksgiving Service
- Farewell Lunch

## Solution Implemented

### 1. Database Fix
Created SQL scripts to update the `get_event_with_details` RPC function:
- `scripts/fix-event-rpc-function.sql` - The SQL to apply
- `scripts/apply-rpc-fix.ts` - Script to generate the SQL

The updated function:
- Removes dependency on `event_display_view`
- Queries tables directly
- Fixes column name issues (e.g., `ticket_type_id` → `id`)
- Supports the new functions architecture

### 2. Code Updates
Updated `lib/api/event-rpc-service.ts` to:
- Import environment configuration helpers
- Automatically filter events based on `FEATURED_FUNCTION_ID`
- Apply filtering to both list queries and individual event fetches

Updated `lib/config/environment.ts` to:
- Support both `FEATURED_FUNCTION_ID` and explicit `FILTER_TO` patterns
- Fall back to `FEATURED_FUNCTION_ID` when no explicit filtering is set

### 3. Helper Scripts
Created diagnostic scripts:
- `scripts/test-event-rpc-fix.ts` - Test the RPC function
- `scripts/check-featured-function-events.ts` - List events in featured function

## Next Steps

1. **Apply the database fix** in Supabase Dashboard:
   ```sql
   -- Copy the SQL from scripts/fix-event-rpc-function.sql
   -- Or run: npx tsx scripts/apply-rpc-fix.ts
   ```

2. **Test the fix**:
   ```bash
   npx tsx scripts/test-event-rpc-fix.ts
   ```

3. **Verify filtering works**:
   ```bash
   npx tsx scripts/check-featured-function-events.ts
   ```

## How It Works

With your current configuration:
- All event queries will automatically filter to show only events from the "Grand Proclamation 2025" function
- The homepage will show featured events from this function
- Individual event pages will only be accessible if they belong to this function
- Other events will return 404

This creates a focused experience for the Grand Proclamation 2025 event series.