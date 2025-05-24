# Issue: Missing NEXT_PUBLIC_APP_URL Environment Variable

**Status:** 🟡 YELLOW  
**Severity:** Medium  
**Category:** Environment Configuration

## Problem Description
The checklist requires `NEXT_PUBLIC_APP_URL` for absolute URL generation, but this environment variable is not referenced anywhere in the codebase. The `.env.example` only has `APP_URL` without the `NEXT_PUBLIC_` prefix.

## Evidence
- Checklist requirement: "NEXT_PUBLIC_APP_URL - Set for absolute URL generation"
- No code references found for `NEXT_PUBLIC_APP_URL`
- `.env.example` line 9: `APP_URL=http://localhost:3000`

## Impact
- May cause issues with:
  - Email links in confirmation emails
  - Redirect URLs after payment
  - Webhook callbacks
  - Any feature requiring absolute URLs

## Root Cause
Inconsistency between documentation and implementation. The app may be using relative URLs or hardcoded values instead.

## Fix Plan

### Immediate Action (Vercel)
1. Check Vercel dashboard for both `APP_URL` and `NEXT_PUBLIC_APP_URL`
2. In Vercel, client-side variables MUST have `NEXT_PUBLIC_` prefix
3. Add in Vercel dashboard if missing:
   - Environment Variables > Add New
   - Key: `NEXT_PUBLIC_APP_URL`
   - Value: `https://yourdomain.vercel.app` (or custom domain)

### Long-term Solution
1. Standardize on `NEXT_PUBLIC_APP_URL` for client-side access
2. Update `.env.example` to include both:
   ```
   APP_URL=https://yourdomain.com  # Server-side
   NEXT_PUBLIC_APP_URL=https://yourdomain.com  # Client-side
   ```
3. Add usage in code where absolute URLs are needed
4. Add validation to ensure this variable is set

## Vercel-Specific Notes
- Environment variables without `NEXT_PUBLIC_` prefix are only available server-side
- Variables are replaced at build time, so changes require redeployment
- Use Vercel CLI to check: `vercel env ls`

## Verification Steps
```bash
# Check Vercel environment
vercel env ls

# Or in Vercel Dashboard:
# Settings > Environment Variables

# Test in production
curl https://yourdomain.vercel.app/api/health
```