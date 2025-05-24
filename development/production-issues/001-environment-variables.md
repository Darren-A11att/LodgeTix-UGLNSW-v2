# Issue: Environment Variables Configuration

**Status:** 🟡 YELLOW - Potential issues identified

## Problems Identified

1. **Missing NEXT_PUBLIC_APP_URL**
   - Not referenced in code but listed in checklist as required
   - May cause issues with absolute URL generation

2. **Turnstile Key Naming Inconsistency**
   - API expects: `CLOUDFLARE_TURNSTILE_SECRET_KEY`
   - Frontend supports both: `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and `NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY`
   - Recent fix (commit e1e3122) added fallback support

3. **Stripe Key References**
   - Uses `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` in code
   - But `.env.example` and checklist reference `STRIPE_PUBLISHABLE_KEY` (without NEXT_PUBLIC prefix)

## Impact
- Missing environment variables will cause runtime errors
- Turnstile verification may fail if wrong key names are used
- Payment processing will fail without correct Stripe keys

## Fix Plan

1. **Immediate Actions:**
   - Verify all environment variables match expected names in production
   - Ensure NEXT_PUBLIC prefix is used for all client-side variables
   - Add NEXT_PUBLIC_APP_URL if needed for URL generation

2. **Code Changes:**
   - Update `.env.example` to use consistent naming
   - Add environment variable validation on startup
   - Create a central config file that validates all required env vars

3. **Verification Steps:**
   ```bash
   # Check if all required env vars are set
   env | grep -E "(SUPABASE|STRIPE|TURNSTILE|APP_URL)"
   ```