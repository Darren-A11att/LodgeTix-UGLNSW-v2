# Supabase Environment Management Guide

## Overview

This guide provides comprehensive instructions for managing multiple Supabase environments (local, staging, production) for the LodgeTix UGLNSW project. Proper environment management ensures safe development, thorough testing, and reliable deployments.

## Table of Contents

1. [Environment Strategy](#environment-strategy)
2. [Local Development Setup](#local-development-setup)
3. [Staging Environment](#staging-environment)
4. [Production Environment](#production-environment)
5. [Environment Variables](#environment-variables)
6. [Data Management](#data-management)
7. [Switching Between Environments](#switching-between-environments)
8. [Best Practices](#best-practices)

## Environment Strategy

### Three-Tier Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     Local       │ --> │    Staging      │ --> │   Production    │
│  Development    │     │   (Preview)     │     │    (Live)       │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### Environment Purposes

| Environment | Purpose | Data | Access |
|------------|---------|------|---------|
| Local | Individual development | Synthetic test data | Developer only |
| Staging | Integration testing | Copy of production (sanitized) | Development team |
| Production | Live application | Real user data | Restricted access |

## Local Development Setup

### Initial Setup

1. **Install Prerequisites**
   ```bash
   # Install Supabase CLI
   brew install supabase/tap/supabase
   
   # Install Docker Desktop
   # Download from https://www.docker.com/products/docker-desktop
   ```

2. **Initialize Project**
   ```bash
   # In project root
   supabase init
   ```

3. **Configure Local Environment**
   ```bash
   # Create local env file
   cp .env.example .env.local
   ```

4. **Start Local Stack**
   ```bash
   supabase start
   ```

### Local Services

After running `supabase start`, you'll have:

| Service | URL | Purpose |
|---------|-----|---------|
| Studio | http://localhost:54323 | Database management UI |
| API | http://localhost:54321 | REST API endpoint |
| DB | postgresql://localhost:54322/postgres | Direct database connection |
| Inbucket | http://localhost:54324 | Email testing |

### Local Environment Variables

Create `/supabase/.env.local`:
```env
# Local development secrets
STRIPE_SECRET_KEY=sk_test_...
RESEND_API_KEY=re_test_...
CUSTOM_SMTP_HOST=localhost
CUSTOM_SMTP_PORT=54325
```

### Seed Local Database

```bash
# Reset database with seed data
supabase db reset

# Or run specific seed file
psql -h localhost -p 54322 -U postgres -d postgres -f supabase/seed.sql
```

## Staging Environment

### Creating Staging Branch

```bash
# Create persistent staging branch
supabase branches create staging --persistent

# Switch to staging branch
supabase branches switch staging
```

### Staging Configuration

1. **Link to Staging Project**
   ```bash
   supabase link --project-ref staging-project-id
   ```

2. **Set Staging Secrets**
   ```bash
   # Set individual secrets
   supabase secrets set STRIPE_SECRET_KEY=sk_test_staging_...
   
   # Or set from file
   supabase secrets set --env-file .env.staging
   ```

3. **Deploy to Staging**
   ```bash
   # Deploy everything
   supabase deploy
   
   # Or deploy individually
   supabase db push
   supabase functions deploy
   ```

### Preview Branches (Ephemeral)

For feature testing:

```bash
# Create preview branch for PR
supabase branches create preview/feature-123

# Auto-deleted after PR merge
```

## Production Environment

### Production Setup

1. **Link Production Project**
   ```bash
   supabase link --project-ref prod-project-id
   ```

2. **Production Secrets**
   ```bash
   # Use production values
   supabase secrets set STRIPE_SECRET_KEY=sk_live_...
   supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<prod-key>
   ```

### Production Deployment

**Via GitHub Actions** (Recommended):
```yaml
# .github/workflows/deploy.yml
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: supabase/setup-cli@v1
      - run: supabase deploy --project-ref ${{ secrets.PROD_PROJECT_ID }}
```

**Manual Deployment**:
```bash
# Ensure on main branch
git checkout main

# Deploy to production
supabase link --project-ref prod-project-id
supabase deploy
```

## Environment Variables

### Variable Categories

1. **Supabase Core Variables** (Auto-provided)
   ```
   SUPABASE_URL
   SUPABASE_ANON_KEY
   SUPABASE_SERVICE_ROLE_KEY
   SUPABASE_DB_URL
   ```

2. **Application Variables**
   ```
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   FEATURED_FUNCTION_ID
   ```

3. **Third-Party Services**
   ```
   STRIPE_SECRET_KEY
   STRIPE_WEBHOOK_SECRET
   RESEND_API_KEY
   SENTRY_DSN
   ```

### Environment Variable Management

**Local Development** (`.env.local`):
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-local-anon-key

# Feature flags
ENABLE_DEBUG_MODE=true
ENABLE_TEST_PAYMENTS=true
```

**Staging** (Supabase Dashboard or CLI):
```bash
supabase secrets set --project-ref staging-id \
  STRIPE_SECRET_KEY=sk_test_... \
  ENABLE_DEBUG_MODE=true
```

**Production** (Supabase Dashboard):
- Set via Dashboard > Settings > Secrets
- Use GitHub Secrets for CI/CD
- Rotate keys regularly

## Data Management

### Data Strategy by Environment

**Local Development**:
- Synthetic test data only
- Reset frequently with `supabase db reset`
- Use factories for consistent test data

**Staging**:
- Sanitized copy of production data
- Updated weekly/monthly
- PII removed or anonymized

**Production**:
- Real user data
- Regular backups
- Strict access controls

### Copying Data Between Environments

**Production → Staging** (Sanitized):
```bash
# Export from production (with sanitization)
pg_dump --data-only --exclude-table=sensitive_table \
  production_url > staging_data.sql

# Import to staging
psql staging_url < staging_data.sql
```

**Never copy**:
- Production → Local (security risk)
- Local → Production (test data contamination)

### Database Migrations

**Migration Flow**:
```
Local (develop) → Staging (test) → Production (deploy)
```

**Creating Migrations**:
```bash
# Create new migration
supabase migration new add_user_preferences

# Edit the migration file
# Test locally
supabase db reset

# Commit to version control
git add supabase/migrations/*
git commit -m "Add user preferences table"
```

## Switching Between Environments

### Quick Switch Commands

```bash
# List all projects
supabase projects list

# Switch to staging
supabase link --project-ref staging-project-id

# Switch to production
supabase link --project-ref prod-project-id

# Switch to local
supabase start
```

### Environment Context Script

Create `scripts/switch-env.sh`:
```bash
#!/bin/bash

case $1 in
  "local")
    echo "Switching to local environment..."
    supabase start
    export NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
    ;;
  "staging")
    echo "Switching to staging environment..."
    supabase link --project-ref staging-id
    export NEXT_PUBLIC_SUPABASE_URL=https://staging.supabase.co
    ;;
  "production")
    echo "Switching to production environment..."
    supabase link --project-ref prod-id
    export NEXT_PUBLIC_SUPABASE_URL=https://prod.supabase.co
    ;;
esac
```

## Best Practices

### 1. Environment Isolation

**DO**:
- Keep environments completely separate
- Use different API keys per environment
- Test in staging before production

**DON'T**:
- Share databases between environments
- Use production data in development
- Skip staging for "simple" changes

### 2. Configuration Management

**DO**:
- Use environment-specific config files
- Document all environment variables
- Rotate secrets regularly

**DON'T**:
- Hardcode environment values
- Commit secrets to git
- Use same passwords across environments

### 3. Deployment Flow

**Always follow**:
```
Local → Staging → Production
```

**Never**:
- Deploy directly to production
- Skip testing in staging
- Make database changes without migrations

### 4. Access Control

**Local**: Open to developer
**Staging**: Development team only
**Production**: 
- Read access: Development team
- Write access: Senior developers only
- Admin access: With approval only

### 5. Monitoring

**Per Environment Monitoring**:

| Environment | Monitoring Level | Alerts |
|------------|-----------------|--------|
| Local | Console logs | None |
| Staging | Basic monitoring | Email on errors |
| Production | Full monitoring | PagerDuty, Slack |

## Common Scenarios

### Scenario 1: New Feature Development

```bash
# 1. Start local environment
supabase start

# 2. Create feature branch
git checkout -b feature/new-feature

# 3. Develop with local database
# Make changes, test locally

# 4. Create preview branch
supabase branches create preview/new-feature

# 5. Test in preview
# Run integration tests

# 6. Merge to main
# Automatic deployment to staging

# 7. Test in staging
# Run acceptance tests

# 8. Deploy to production
# Via GitHub Actions on approval
```

### Scenario 2: Database Schema Change

```bash
# 1. Create migration locally
supabase migration new add_column

# 2. Test locally
supabase db reset

# 3. Deploy to staging
supabase link --project-ref staging-id
supabase db push

# 4. Verify in staging
# Check data integrity

# 5. Deploy to production
supabase link --project-ref prod-id
supabase db push
```

### Scenario 3: Debugging Production Issue

```bash
# 1. Check production logs
supabase functions logs function-name --project-ref prod-id

# 2. Reproduce in staging
supabase link --project-ref staging-id
# Test same scenario

# 3. Fix in local
supabase start
# Develop fix

# 4. Deploy fix through environments
# Local → Staging → Production
```

## Troubleshooting

### Environment Mismatch Issues

**Symptoms**:
- "Project not found" errors
- Wrong data appearing
- Authentication failures

**Solutions**:
```bash
# Verify current project
supabase projects list

# Re-link correct project
supabase link --project-ref correct-project-id

# Clear local state
supabase stop
supabase start
```

### Secret Access Issues

**Symptoms**:
- "Missing environment variable" errors
- API key failures

**Solutions**:
```bash
# List current secrets
supabase secrets list

# Re-set secret
supabase secrets set KEY_NAME=value

# Verify in edge function
Deno.env.get('KEY_NAME')
```

## Next Steps

1. Set up local development: Follow the [Local Development Setup](#local-development-setup)
2. Configure staging: See [Staging Environment](#staging-environment)
3. Learn about edge functions: [edge-functions/DEVELOPMENT-GUIDE.md](./edge-functions/DEVELOPMENT-GUIDE.md)
4. Set up CI/CD: [edge-functions/DEPLOYMENT-GUIDE.md](./edge-functions/DEPLOYMENT-GUIDE.md)

## Additional Resources

- [Supabase Branching Guide](https://supabase.com/docs/guides/platform/branching)
- [Environment Variables Best Practices](https://supabase.com/docs/guides/functions/secrets)
- [Database Migration Strategies](./DATABASE-MIGRATION-GUIDE.md)