# Issue: Potential Supabase Environment Variable Issues on Vercel

**Status:** 🟡 YELLOW  
**Severity:** Medium  
**Category:** Environment Configuration / Database

## Problem Description
Supabase environment variables must be properly configured in Vercel for both client-side and server-side access.

## Evidence
- Client needs: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Server needs: `SUPABASE_SERVICE_ROLE_KEY`
- Some files reference both prefixed and non-prefixed versions

## Impact
- Database connection failures
- Authentication issues
- API routes unable to perform admin operations
- Build failures if variables missing

## Root Cause
Supabase client initialization happens both server-side and client-side, requiring careful environment variable configuration on Vercel.

## Fix Plan

### Immediate Action (Vercel)
1. Verify in Vercel Dashboard > Settings > Environment Variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL         # For client-side
   NEXT_PUBLIC_SUPABASE_ANON_KEY    # For client-side
   SUPABASE_SERVICE_ROLE_KEY       # For server-side only
   ```

2. **DO NOT** expose service role key with `NEXT_PUBLIC_` prefix

3. Check for duplicates (non-prefixed versions):
   ```
   SUPABASE_URL        # Remove if exists
   SUPABASE_ANON_KEY   # Remove if exists
   ```

### Vercel-Specific Configuration
1. Set environment variables for all environments:
   - Production
   - Preview (for PR deployments)
   - Development (optional)

2. Use Vercel's environment variable UI to ensure proper scoping

3. For sensitive keys (service role), consider using Vercel's encrypted environment variables

## Security Considerations
- `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS - NEVER expose client-side
- Only `NEXT_PUBLIC_*` variables are safe for browser exposure
- Vercel logs may show env var names but not values

## Verification Steps
```bash
# Check all Supabase variables
vercel env ls | grep SUPABASE

# Verify client can connect (in browser console)
console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)

# Test API route that uses service role
curl https://yourdomain.vercel.app/api/test-db-connection
```