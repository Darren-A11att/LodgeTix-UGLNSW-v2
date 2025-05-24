# Issue: Turnstile Environment Variable Naming Inconsistency

**Status:** 🟡 YELLOW  
**Severity:** Medium  
**Category:** Environment Configuration

## Problem Description
The Turnstile integration uses inconsistent environment variable names between frontend and backend, which could cause verification failures.

## Evidence
- Backend expects: `CLOUDFLARE_TURNSTILE_SECRET_KEY` (route.ts:3)
- Frontend supports both:
  - `NEXT_PUBLIC_TURNSTILE_SITE_KEY` (preferred)
  - `NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY` (fallback)
- Recent fix in commit e1e3122 added fallback support

## Impact
- Turnstile verification failures if wrong variable names are used
- Registration flow blocked due to failed bot protection
- Inconsistent behavior between environments

## Root Cause
Evolution of naming convention without updating all references. The shorter names are cleaner but backwards compatibility is needed.

## Fix Plan

### Immediate Action
1. Ensure production has BOTH variable names set (for safety)
2. Verify Turnstile is working in production

### Long-term Solution
1. Standardize on shorter names:
   - `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
   - `TURNSTILE_SECRET_KEY`
2. Update backend to support both (with deprecation warning):
   ```typescript
   const TURNSTILE_SECRET_KEY = 
     process.env.TURNSTILE_SECRET_KEY || 
     process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY;
   
   if (!process.env.TURNSTILE_SECRET_KEY && process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY) {
     console.warn('CLOUDFLARE_TURNSTILE_SECRET_KEY is deprecated. Use TURNSTILE_SECRET_KEY');
   }
   ```
3. Update `.env.example` and documentation
4. Remove fallback support after migration period

## Verification Steps
```bash
# Check which variables are set
env | grep TURNSTILE

# Test Turnstile integration
curl -X POST https://yourdomain.com/api/verify-turnstile-and-anon-auth \
  -H "Content-Type: application/json" \
  -d '{"token": "test-token"}'
```