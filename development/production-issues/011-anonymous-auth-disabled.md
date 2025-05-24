# Issue: Anonymous Authentication May Be Disabled

**Status:** 🔴 RED  
**Severity:** Critical  
**Category:** Authentication

## Problem Description
Anonymous authentication might be disabled in production Supabase, preventing users from starting the registration process.

## Evidence
- Local config has `enable_anonymous_sign_ins = false` (config.toml:121)
- SessionGuard depends on `signInAnonymously()` working
- Registration flow requires anonymous session for users not logged in
- Recent fix (commit f69b74b) addressed anonymous session establishment

## Impact
- **CRITICAL**: Users cannot start registration without login
- SessionGuard shows error state
- Registration wizard won't load
- Complete blocker for anonymous users

## Root Cause
Supabase project configuration may have anonymous authentication disabled, but the application assumes it's enabled.

## Fix Plan

### Immediate Action (Production)
1. **URGENT**: Check Supabase Dashboard
   - Authentication > Settings > User Signups
   - Ensure "Enable anonymous sign-ins" is ON
   
2. If disabled, enable immediately:
   ```sql
   -- In Supabase SQL Editor
   ALTER DATABASE postgres SET "app.settings.enable_anonymous_sign_ins" TO 'true';
   ```

3. Verify in Supabase Dashboard or via API

### Vercel-Specific Considerations
- This is a Supabase configuration, not a Vercel env var issue
- No redeployment needed if changed in Supabase
- Changes take effect immediately

### Long-term Solution
1. Add health check endpoint:
```typescript
// /api/health/auth
const { data, error } = await supabase.auth.signInAnonymously();
if (error) {
  return { anonymous_auth: false, error: error.message };
}
await supabase.auth.signOut();
return { anonymous_auth: true };
```

2. Add startup validation to check critical features
3. Document Supabase configuration requirements
4. Consider alternative flow if anonymous auth unavailable

## Verification Steps
```bash
# Test anonymous auth
curl -X POST https://yourdomain.vercel.app/api/test-anonymous-auth

# Or in browser console
const { data, error } = await supabase.auth.signInAnonymously()
console.log({ data, error })

# Check for SessionGuard errors in console
# Navigate to registration page and check browser console
```