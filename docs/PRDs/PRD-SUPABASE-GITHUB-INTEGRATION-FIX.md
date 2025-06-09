# PRD: Fix Supabase GitHub Integration Errors

## Problem Statement
The Supabase GitHub integration is failing to apply migrations and edge functions automatically when updated on GitHub. Both production (main branch) and preview (development branch) databases are experiencing errors.

## Current Issues

### Production Database (main branch)
- Error: "Remote migration versions not found in local migrations directory"
- This prevents migrations from being applied to production

### Preview Database (development branch)  
- Same migration version mismatch error
- Additional error: "schema 'supabase_functions' does not exist"
- Multiple migration files being skipped due to invalid naming patterns (.disabled, .backup extensions)
- Subdirectories (backup/, custom/, parsed/) being skipped

## Requirements

### Functional Requirements
1. Fix migration version synchronization between remote and local
2. Ensure supabase_functions schema exists before creating triggers
3. Clean up migration directory structure to follow Supabase conventions
4. Restore automatic deployment of migrations via GitHub integration
5. Ensure edge functions are deployed correctly

### Technical Requirements
1. All migration files must follow pattern: `<timestamp>_<name>.sql`
2. No subdirectories in migrations folder (except as configured)
3. Proper schema dependencies must be resolved
4. Migration history must be synchronized

## Success Criteria
1. GitHub pushes to main branch successfully apply migrations to production
2. GitHub pushes to development branch successfully apply migrations to preview
3. No error messages in Supabase GitHub integration logs
4. All edge functions deploy correctly

## Out of Scope
- Changing the overall GitHub integration setup
- Modifying the core migration content (unless necessary for fixes)

## TODO Checklist
- [ ] Investigate current migration directory structure
- [ ] Identify all non-conforming migration files
- [ ] Check remote migration history vs local files
- [ ] Verify supabase_functions schema creation
- [ ] Clean up migration file naming and structure
- [ ] Test GitHub integration on development branch
- [ ] Verify and fix production branch
- [ ] Document the solution

## Questions for Clarification

### Critical Questions:
1. **Remote Migration History**: Have migrations been applied directly in the Supabase dashboard that aren't reflected in the git repository? The error suggests remote has migrations that local doesn't have.

2. **Migration Files in migrations_temp**: There are 15 migration files in the `migrations_temp` directory. Should these be:
   - Moved to the main migrations directory?
   - Deleted as they're no longer needed?
   - Applied in a specific order?

3. **Production vs Preview Database**: 
   - Are both databases supposed to have the same migration history?
   - Was the preview database created as a branch from production?
   - Should we sync the migration histories between them?

4. **supabase_functions Schema**: The `20250605000000_create_supabase_functions_schema.sql` migration exists but seems not to be running before `20250605073722_remote_schema.sql`. Are there any remote migrations that might be interfering?

5. **GitHub Integration Setup**: 
   - Is the GitHub integration configured through Supabase dashboard or GitHub Actions?
   - Are there any specific environment variables or secrets that need to be configured?

### Investigation Findings:
1. **Migration Directory Structure Issues**:
   - Main migrations directory has 66 properly named migration files
   - migrations_temp directory has 15 additional migrations with later timestamps
   - No subdirectories (backup/, custom/, parsed/) in main migrations folder
   
2. **Schema Dependency Issue**:
   - `20250605073722_remote_schema.sql` references `supabase_functions` schema
   - `20250605000000_create_supabase_functions_schema.sql` should create it first
   - Error suggests the schema creation migration isn't running

3. **File Naming Compliance**:
   - All migration files in main directory follow correct pattern: `<timestamp>_<name>.sql`
   - No files with .disabled, .backup extensions in main directory

### Recommended Actions Before Implementation:
1. Check remote migration history: `supabase db remote commit` to see what's on remote
2. Verify if migrations_temp files should be integrated
3. Confirm the intended migration sync strategy between environments