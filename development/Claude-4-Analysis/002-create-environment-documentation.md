# Task 002: Create Environment Variables Documentation

**Priority**: Critical  
**Category**: Security/Documentation  
**Dependencies**: None  
**Estimated Time**: 30 minutes  

## Problem

No `.env.example` file exists in the repository, making it unclear what environment variables are required. This leads to:
- Configuration errors for new developers
- Potential security issues from missing variables
- Deployment failures
- Inconsistent environments

## Solution

Create a comprehensive `.env.example` file documenting all required environment variables with descriptions and example values.

## Implementation Steps

1. Analyze codebase for all environment variable usage
2. Create `.env.example` in the project root
3. Document each variable with:
   - Variable name
   - Description
   - Example value (not real secrets)
   - Required/optional status

## Environment Variables to Document

Based on codebase analysis:

```bash
# Supabase Configuration (Required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Stripe Configuration (Required for payments)
STRIPE_SECRET_KEY=sk_test_your-test-key-here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your-test-key-here

# Cloudflare Turnstile (Required for bot protection)
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your-turnstile-site-key
TURNSTILE_SECRET_KEY=your-turnstile-secret-key

# Email Service (Required for confirmations)
RESEND_API_KEY=your-resend-api-key

# Application Settings (Optional)
NEXT_PUBLIC_USE_EVENTS_SCHEMA=true
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# Sentry Error Tracking (Optional)
SENTRY_DSN=your-sentry-dsn
SENTRY_AUTH_TOKEN=your-sentry-auth-token
```

## File Content

Create `.env.example`:

```bash
# LodgeTix Environment Variables
# Copy this file to .env.local and fill in your values

# ============================================
# REQUIRED VARIABLES
# ============================================

# Supabase Configuration
# Get these from your Supabase project settings
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Stripe Payment Processing
# Get these from https://dashboard.stripe.com/apikeys
STRIPE_SECRET_KEY=sk_test_51H...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51H...

# ============================================
# SECURITY FEATURES
# ============================================

# Cloudflare Turnstile Bot Protection
# Get these from Cloudflare Dashboard
NEXT_PUBLIC_TURNSTILE_SITE_KEY=0x4AAAAAAA...
TURNSTILE_SECRET_KEY=0x4AAAAAAAsecret...

# ============================================
# OPTIONAL FEATURES
# ============================================

# Email Service (Resend)
# Get from https://resend.com/api-keys
RESEND_API_KEY=re_123...

# Feature Flags
NEXT_PUBLIC_USE_EVENTS_SCHEMA=false

# Application URL (for emails, redirects)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Environment
NODE_ENV=development

# Sentry Error Tracking
# Get from https://sentry.io/settings/projects/
SENTRY_DSN=https://public@sentry.io/123
SENTRY_AUTH_TOKEN=sntrys_auth...
```

## Additional Steps

1. Update `.gitignore` to ensure it includes:
   ```
   .env
   .env.local
   .env.production
   .env.*.local
   ```

2. Create `docs/ENVIRONMENT.md` with detailed setup instructions

3. Add validation script `scripts/validate-env.js`:
   ```javascript
   const required = [
     'NEXT_PUBLIC_SUPABASE_URL',
     'NEXT_PUBLIC_SUPABASE_ANON_KEY',
     'STRIPE_SECRET_KEY'
   ];
   
   const missing = required.filter(key => !process.env[key]);
   if (missing.length > 0) {
     console.error('Missing required environment variables:', missing);
     process.exit(1);
   }
   ```

## Verification

1. Copy `.env.example` to `.env.local`
2. Fill in test values
3. Run the application
4. Verify all features work with example configuration

## Security Considerations

- Never commit real secrets to `.env.example`
- Use descriptive example values that indicate format
- Mark sensitive variables clearly
- Document rotation procedures for production keys