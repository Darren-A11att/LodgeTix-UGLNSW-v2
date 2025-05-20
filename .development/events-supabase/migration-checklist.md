# Supabase Events Migration Checklist

## Pre-Migration Setup ✅
- [x] Analyzed existing event data structure
- [x] Reviewed seed data in events-data-updated.md
- [x] Designed events.events table schema
- [x] Created implementation plan
- [x] Created SQL schema definition file
- [x] Created TypeScript seeding scripts  
- [x] Created event service for new schema
- [x] Created event facade for gradual migration
- [x] Updated package.json with migration commands
- [x] Created Supabase CLI migration script
- [x] Created detailed CLI instructions

## Migration Execution ⏳
- [ ] Execute schema with Supabase CLI
  ```bash
  # Option A: Automated script
  ./scripts/supabase-cli-migration.sh
  
  # Option B: Manual steps
  supabase link --project-ref YOUR_PROJECT_REF
  supabase db execute -f .development/events-supabase/01-events-schema-definition.sql
  ```
- [ ] Run migration to seed events data
  ```bash
  npm run migrate:events
  ```
- [ ] Verify migration completed successfully
  ```bash
  npm run verify:events
  ```

## Feature Flag Testing ⏳
- [ ] Enable feature flag in .env.local
  ```bash
  echo "NEXT_PUBLIC_USE_EVENTS_SCHEMA=true" >> .env.local
  ```
- [ ] Test event pages with database data:
  - [ ] /test-events (dedicated test page)
  - [ ] /events/grand-installation
  - [ ] /events/third-degree-ceremony
  - [ ] /events/masonic-lecture-series
  - [ ] /events/[id] (dynamic routes)

## Final Implementation ⏳
- [ ] Update remaining pages to use event facade:
  - [x] /app/page.tsx (homepage) - Already updated
  - [x] /app/events/[id]/page.tsx - Already updated  
  - [ ] /app/events/[id]/tickets/page.tsx
  - [ ] /app/events/[id]/confirmation/page.tsx
  - [ ] /app/events/grand-installation/page.tsx
  - [ ] /app/organizer/dashboard/page.tsx
- [ ] Remove hard-coded event data from lib/event-utils.ts
- [ ] Create admin UI for event management
- [ ] Remove feature flag when stable

## Files Created/Modified 📁
1. **Schema & Migration**:
   - `/.development/events-supabase/01-events-schema-definition.sql`
   - `/.development/events-supabase/02-seed-events-schema.ts`
   - `/.development/events-supabase/03-events-schema-service.ts`
   - `/scripts/migrate-events-to-supabase.ts`
   - `/scripts/verify-events-migration.ts`
   - `/scripts/supabase-cli-migration.sh`

2. **Integration**:
   - `/lib/event-facade.ts` (new)
   - `/app/test-events/page.tsx` (new)
   - `/app/page.tsx` (updated)
   - `/app/events/[id]/page.tsx` (updated)

3. **Documentation**:
   - `/.development/events-supabase/supabase-cli-instructions.md`
   - `/.development/events-supabase/migration-checklist.md` (this file)

## Environment Variables Required
```bash
# Supabase configuration (already set)
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Migration control (needs to be added)
NEXT_PUBLIC_USE_EVENTS_SCHEMA=false
SUPABASE_PROJECT_REF=your_project_ref
```

## Quick Commands Reference
```bash
# Make script executable
chmod +x scripts/supabase-cli-migration.sh

# Execute schema
./scripts/supabase-cli-migration.sh

# Run migration
npm run migrate:events

# Verify migration
npm run verify:events

# Enable feature flag
echo "NEXT_PUBLIC_USE_EVENTS_SCHEMA=true" >> .env.local

# Start dev server
npm run dev

# Test the migration
open http://localhost:3000/test-events
```

## Current Status 🚀
- **Phase**: Pre-Migration Complete ✅
- **Next Step**: Execute `./scripts/supabase-cli-migration.sh`
- **Blockers**: None - awaiting user execution
- **Ready**: All scripts and documentation prepared

## Rollback Plan (if needed) 🛟
1. Disable feature flag:
   ```bash
   # In .env.local
   NEXT_PUBLIC_USE_EVENTS_SCHEMA=false
   ```
2. Drop events schema (if needed):
   ```bash
   supabase db execute --sql "DROP SCHEMA IF EXISTS events CASCADE;"
   ```
3. Application will revert to hard-coded events automatically

## Troubleshooting Guide 🔧
### Supabase CLI Issues
- Ensure Supabase CLI is installed: `npm install -g supabase`
- Login if needed: `supabase login`
- Verify project reference from Supabase URL

### Schema Execution Errors
- Check SQL syntax in schema file
- Ensure no conflicting schemas exist
- Try executing in Supabase dashboard SQL editor

### Migration Script Errors
- Verify all environment variables are set
- Check Supabase service role key has proper permissions
- Look for specific error messages in console

### Events Not Loading
- Confirm feature flag is set to "true"
- Check browser console for errors
- Run verification script to ensure data exists
- Check network tab for API responses