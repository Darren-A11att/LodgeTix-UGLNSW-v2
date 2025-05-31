# Environment Variables

## Overview
This document details all environment variables required for the LodgeTix-UGLNSW-v2 application. Environment variables are used to configure services, manage secrets, and control application behavior across different environments.

## Environment Files

### File Structure
```
.env                  # Default environment variables
.env.local            # Local overrides (gitignored)
.env.test             # Test environment configuration
.env.example          # Template with all required variables
```

### Loading Priority
1. `.env.local` (highest priority)
2. `.env.test` (when NODE_ENV=test)
3. `.env` (default)

## Required Environment Variables

### Application Settings

#### NODE_ENV
- **Type**: String
- **Values**: `development`, `staging`, `production`
- **Default**: `development`
- **Description**: Determines the application environment
- **Usage**: Controls debug mode, error reporting, optimizations

#### APP_URL
- **Type**: URL
- **Example**: `http://localhost:3000` (dev), `https://nsw.lodgetix.io` (prod)
- **Description**: Full application URL including protocol
- **Usage**: Webhooks, redirects, email links

#### NEXT_PUBLIC_USE_RPC_REGISTRATION
- **Type**: Boolean string
- **Default**: `true`
- **Description**: Enable RPC-based registration flow
- **Usage**: Feature flag for new registration system

#### USE_RPC_STATUS_UPDATE
- **Type**: Boolean string
- **Default**: `true`
- **Description**: Enable RPC-based status updates
- **Usage**: Feature flag for payment status updates

### Supabase Configuration

#### NEXT_PUBLIC_SUPABASE_URL
- **Type**: URL
- **Required**: Yes
- **Example**: `https://your-project-ref.supabase.co`
- **Description**: Supabase project URL
- **Usage**: Client-side database connections
- **Note**: Safe to expose publicly

#### SUPABASE_URL
- **Type**: URL
- **Required**: Yes
- **Example**: `https://your-project-ref.supabase.co`
- **Description**: Supabase project URL for server-side
- **Usage**: Server-side database connections

#### NEXT_PUBLIC_SUPABASE_ANON_KEY
- **Type**: String
- **Required**: Yes
- **Description**: Anonymous/public API key
- **Usage**: Client-side authentication
- **Security**: Safe to expose publicly

#### SUPABASE_ANON_KEY
- **Type**: String
- **Required**: Yes
- **Description**: Anonymous key for server-side
- **Usage**: Server-side operations with RLS

#### SUPABASE_SERVICE_ROLE_KEY
- **Type**: String
- **Required**: Yes
- **Description**: Service role key with full access
- **Usage**: Admin operations bypassing RLS
- **Security**: ⚠️ **NEVER expose client-side**

#### DATABASE_URL
- **Type**: PostgreSQL connection string
- **Required**: For migrations only
- **Example**: `postgres://postgres.[ref]:[password]@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres`
- **Description**: Direct database connection
- **Usage**: Running migrations, direct SQL access

### Stripe Configuration

#### STRIPE_SECRET_KEY
- **Type**: String
- **Required**: Yes
- **Format**: `sk_test_*` (test) or `sk_live_*` (production)
- **Description**: Server-side API key
- **Usage**: Payment processing, customer management
- **Security**: ⚠️ **NEVER expose client-side**

#### NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
- **Type**: String
- **Required**: Yes
- **Format**: `pk_test_*` (test) or `pk_live_*` (production)
- **Description**: Client-side publishable key
- **Usage**: Stripe Elements, payment forms
- **Security**: Safe to expose publicly

#### STRIPE_WEBHOOK_SECRET
- **Type**: String
- **Required**: Yes
- **Format**: `whsec_*`
- **Description**: Webhook endpoint secret
- **Usage**: Verifying webhook signatures
- **Location**: Stripe Dashboard > Webhooks > Signing secret

#### STRIPE_PLATFORM_FEE_PERCENTAGE
- **Type**: Float
- **Default**: `0.05` (5%)
- **Description**: Platform fee percentage
- **Usage**: Calculating platform fees for Connect
- **Example**: `0.05` = 5%, `0.10` = 10%

### Cloudflare Turnstile

#### NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY
- **Type**: String
- **Required**: Yes
- **Description**: Turnstile site key
- **Usage**: Client-side bot protection
- **Security**: Safe to expose publicly

#### CLOUDFLARE_TURNSTILE_SECRET_KEY
- **Type**: String
- **Required**: Yes
- **Description**: Turnstile secret key
- **Usage**: Server-side verification
- **Security**: ⚠️ **Keep secret**

### Email Service

#### RESEND_API_KEY
- **Type**: String
- **Required**: Yes
- **Format**: `re_*`
- **Description**: Resend API key
- **Usage**: Sending transactional emails
- **Location**: https://resend.com/api-keys

### Optional Services

#### Sentry Error Tracking
```env
SENTRY_DSN=https://[key]@sentry.io/[project-id]
NEXT_PUBLIC_SENTRY_DSN=https://[key]@sentry.io/[project-id]
SENTRY_ORG=mylodgeio-q1
SENTRY_PROJECT=nsw-lodgtix
SENTRY_AUTH_TOKEN=sntrys_*
```

#### Debug and Feature Flags
```env
DEBUG=false                      # Enable debug logging
ENABLE_LOGGING=true             # Enable general logging
ENABLE_PREMIUM_FEATURES=false   # Premium feature toggle
ENABLE_BETA_FEATURES=false      # Beta feature toggle
MAINTENANCE_MODE=false          # Maintenance mode
```

## Environment-Specific Variables

### Development Only
```env
# Development URLs
APP_URL=http://localhost:3000
TEST_BASE_URL=http://localhost:3000

# Debug mode
DEBUG=true
ENABLE_LOGGING=true

# Test credentials
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=testpassword
```

### Production Only
```env
# Production URLs
APP_URL=https://nsw.lodgetix.io

# Security
NODE_ENV=production
DEBUG=false

# Performance
ENABLE_CACHE=true
CDN_URL=https://cdn.lodgetix.io
```

### Test Environment
```env
# Test database
SUPABASE_URL=https://test-project.supabase.co

# Test Stripe keys
STRIPE_SECRET_KEY=sk_test_*
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_*

# Disable external services
ENABLE_EMAIL_SENDING=false
ENABLE_WEBHOOK_PROCESSING=false
```

## Security Best Practices

### 1. Never Commit Secrets
- Use `.env.local` for local secrets
- Add `.env.local` to `.gitignore`
- Use `.env.example` as template

### 2. Client vs Server Keys
**Safe to expose (NEXT_PUBLIC_*):**
- Supabase URL
- Supabase anon key
- Stripe publishable key
- Turnstile site key

**Must keep secret:**
- Service role keys
- Stripe secret key
- API keys
- Webhook secrets

### 3. Key Rotation
- Rotate keys regularly (quarterly)
- Update keys immediately if exposed
- Use different keys per environment
- Monitor key usage

### 4. Access Control
- Limit who has access to production keys
- Use environment-specific keys
- Implement key management system
- Audit key access

## Vercel Environment Variables

### Setting Variables in Vercel
1. Navigate to Project Settings
2. Go to "Environment Variables"
3. Add variables for each environment:
   - Production
   - Preview
   - Development

### Vercel-Specific Variables
```env
VERCEL_URL                # Deployment URL
VERCEL_ENV               # Environment name
VERCEL_GIT_COMMIT_SHA    # Git commit hash
VERCEL_GIT_COMMIT_REF    # Git branch/tag
```

## Local Development Setup

### 1. Copy Example File
```bash
cp .env.example .env.local
```

### 2. Fill in Required Values
- Get Supabase credentials from dashboard
- Create Stripe test account
- Set up Turnstile (or use test keys)
- Configure email service

### 3. Test Configuration
```bash
# Verify environment
npm run dev

# Check loaded variables
console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)
```

## Troubleshooting

### Common Issues

#### 1. Missing Environment Variables
**Error**: "STRIPE_SECRET_KEY is not set"
**Solution**: Ensure `.env.local` contains all required variables

#### 2. Wrong Environment
**Error**: Using production keys in development
**Solution**: Check NODE_ENV and use appropriate keys

#### 3. Client-Side Access
**Error**: "process.env.SECRET_KEY is undefined"
**Solution**: Only NEXT_PUBLIC_* variables are available client-side

#### 4. Vercel Deployment
**Error**: "Environment variable not found"
**Solution**: Add variables in Vercel dashboard

### Debugging Commands
```bash
# Check current environment
echo $NODE_ENV

# List all environment variables
printenv | grep NEXT_PUBLIC

# Verify .env files are loaded
ls -la .env*
```

## Migration Guide

### Adding New Variables
1. Add to `.env.example` with description
2. Document in this file
3. Add to Vercel dashboard
4. Update deployment documentation
5. Notify team members

### Removing Variables
1. Check all code references
2. Remove from codebase
3. Update `.env.example`
4. Remove from Vercel
5. Update documentation

## Reference

### Variable Naming Convention
- `NEXT_PUBLIC_*`: Client-side accessible
- `*_URL`: Full URLs including protocol
- `*_KEY`: API keys or secrets
- `*_SECRET`: Highly sensitive values
- `ENABLE_*`: Feature flags (boolean)
- `*_MODE`: Application modes