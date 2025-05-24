# Issue: Stripe Publishable Key Missing NEXT_PUBLIC Prefix

**Status:** 🔴 RED  
**Severity:** High  
**Category:** Environment Configuration / Payment

## Problem Description
The code expects `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` but documentation references `STRIPE_PUBLISHABLE_KEY` without the required prefix for client-side access.

## Evidence
- Code usage: `loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)` (PaymentMethod.tsx:11)
- Checklist lists: "STRIPE_PUBLISHABLE_KEY - Set for client-side Stripe"
- This will cause Stripe to fail to initialize on the client

## Impact
- **CRITICAL**: Payment processing will completely fail
- Stripe Elements won't load
- Users cannot complete registration
- Runtime error: "Please pass a valid publishable key"

## Root Cause
Next.js requires `NEXT_PUBLIC_` prefix for environment variables to be accessible in browser code. Without this prefix, the variable is undefined on the client side. Vercel enforces this strictly.

## Fix Plan

### Immediate Action (Vercel)
1. **URGENT**: Check Vercel Dashboard > Settings > Environment Variables
2. Ensure `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` exists (NOT just `STRIPE_PUBLISHABLE_KEY`)
3. If missing:
   - Add New Environment Variable
   - Key: `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - Value: `pk_live_...` (or `pk_test_...` for staging)
   - Environment: Production (and/or Preview/Development)
4. **REDEPLOY** after adding (Vercel requires rebuild for env changes)

### Long-term Solution
1. Update `.env.example`:
   ```
   # Stripe Publishable Key (safe for client-side)
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your-stripe-publishable-key
   ```
2. Update checklist documentation
3. Add build-time validation:
   ```typescript
   // In next.config.mjs
   if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
     throw new Error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is required');
   }
   ```

## Vercel-Specific Notes
- **CRITICAL**: Variables are injected at BUILD TIME, not runtime
- Changing env vars requires triggering a new deployment
- Vercel automatically exposes `NEXT_PUBLIC_*` variables to the browser
- Non-prefixed variables are server-only and return `undefined` in browser

## Verification Steps
```bash
# Check Vercel environment
vercel env ls | grep STRIPE

# After deployment, check in browser console:
console.log(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)

# Should NOT be undefined
```