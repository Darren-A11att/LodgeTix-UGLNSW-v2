# Supabase Deployment Overview

## Executive Summary

This document provides a comprehensive overview of Supabase deployment strategies, environment management, and best practices for the LodgeTix UGLNSW project. It covers the complete deployment lifecycle from local development to production.

## Table of Contents

1. [Deployment Philosophy](#deployment-philosophy)
2. [Environment Types](#environment-types)
3. [Deployment Methods](#deployment-methods)
4. [Deployment Components](#deployment-components)
5. [Best Practices](#best-practices)
6. [Security Considerations](#security-considerations)

## Deployment Philosophy

Supabase follows a **multi-environment deployment model** designed to ensure code quality, minimize risk, and enable rapid iteration:

```
Local Development → Preview/Staging → Production
```

### Core Principles
- **Environment Isolation**: Each environment is completely isolated
- **Progressive Deployment**: Changes flow through environments sequentially
- **Automated Testing**: Each stage includes automated validation
- **Rollback Capability**: Quick recovery from failed deployments

## Environment Types

### 1. Local Development Environment

**Purpose**: Individual developer testing and iteration

**Characteristics**:
- Runs entirely on developer's machine
- Uses Docker containers for consistency
- Includes all Supabase services (Auth, Database, Storage, Realtime)
- Hot reload for rapid development

**Setup**:
```bash
supabase init
supabase start
```

**Key Features**:
- Studio UI at `http://localhost:54323`
- PostgreSQL at `localhost:54322`
- Edge Functions with hot reload
- Local email testing with Inbucket

### 2. Preview/Staging Environments

**Purpose**: Testing features before production deployment

**Types**:
1. **Persistent Staging Branch**
   - Long-lived environment
   - Mirrors production closely
   - Used for final testing

2. **Ephemeral Preview Branches**
   - Created per pull request
   - Automatically destroyed after merge
   - Perfect for feature testing

**Creation**:
```bash
supabase branches create staging
supabase branches switch staging
```

### 3. Production Environment

**Purpose**: Live environment serving end users

**Characteristics**:
- Highest security and performance
- Automated deployments from main branch
- Comprehensive monitoring and alerting
- Regular automated backups

## Deployment Methods

### 1. GitHub Integration (Recommended)

**Setup**:
1. Connect Supabase project to GitHub repository
2. Configure deployment triggers
3. Set up environment secrets

**Workflow**:
```yaml
main branch push → Automated tests → Deploy to production
feature branch → Create preview → Test → Merge → Deploy
```

**Benefits**:
- Zero-config deployments
- Automatic preview environments
- Integrated with PR workflow

### 2. Supabase CLI

**Use Cases**:
- Manual deployments
- Complex deployment scenarios
- Debugging deployment issues

**Commands**:
```bash
# Link to project
supabase link --project-ref <project-id>

# Deploy database migrations
supabase db push

# Deploy edge functions
supabase functions deploy

# Deploy all
supabase deploy
```

### 3. Terraform Provider

**Use Cases**:
- Infrastructure as Code
- Multi-cloud deployments
- Advanced automation

**Example**:
```hcl
resource "supabase_project" "production" {
  name            = "lodgetix-uglnsw"
  organization_id = var.org_id
  database_password = var.db_password
  region           = "us-east-1"
}
```

## Deployment Components

### 1. Database Migrations

**Location**: `/supabase/migrations/`

**Deployment Process**:
1. Migrations run sequentially by timestamp
2. Each migration is transactional
3. Failed migrations roll back automatically

**Best Practices**:
- Never modify existing migrations
- Test migrations locally first
- Include rollback scripts for complex changes

### 2. Edge Functions

**Location**: `/supabase/functions/`

**Deployment Process**:
1. Functions bundled with dependencies
2. Deployed to Deno Deploy infrastructure
3. Automatic SSL and global distribution

**Considerations**:
- Each function is independently deployable
- Environment variables set separately
- Cold start optimization important

### 3. Storage Policies

**Deployment**:
- RLS policies defined in migrations
- Bucket creation via migrations or API
- CORS rules configured per bucket

### 4. Authentication Configuration

**Includes**:
- Provider settings
- Email templates
- JWT configuration
- Custom SMTP settings

## Best Practices

### 1. Pre-Deployment Checklist

- [ ] All tests passing locally
- [ ] Migrations tested with `supabase db reset`
- [ ] Edge functions tested with `supabase functions serve`
- [ ] Environment variables documented
- [ ] Breaking changes communicated

### 2. Deployment Sequence

1. **Database First**
   ```bash
   supabase db push
   ```

2. **Edge Functions Second**
   ```bash
   supabase functions deploy
   ```

3. **Application Last**
   ```bash
   npm run build && npm run deploy
   ```

### 3. Rollback Strategy

**Database Rollback**:
```sql
-- Include in migration file
-- UP Migration
CREATE TABLE ...;

-- DOWN Migration (in separate file)
DROP TABLE IF EXISTS ...;
```

**Function Rollback**:
```bash
# Deploy previous version
supabase functions deploy function-name --version previous
```

### 4. Monitoring Deployments

**Key Metrics**:
- Migration execution time
- Function deployment status
- API availability
- Error rates post-deployment

**Tools**:
- Supabase Dashboard
- GitHub Actions logs
- Application monitoring (Sentry)

## Security Considerations

### 1. Secret Management

**Never Commit**:
- `.env` files
- Service role keys
- JWT secrets
- API keys

**Use Instead**:
- GitHub Secrets for CI/CD
- Supabase Vault for runtime secrets
- Environment-specific configurations

### 2. Access Control

**Production Access**:
- Limited to authorized personnel
- Requires MFA
- Audit trail for all changes

**Service Keys**:
- Rotate regularly
- Use minimal permissions
- Monitor usage

### 3. Data Protection

**During Deployment**:
- Use encrypted connections
- Validate data migrations
- Test rollback procedures
- Monitor for data anomalies

## Common Deployment Scenarios

### 1. Feature Deployment

```bash
# Create feature branch
git checkout -b feature/new-feature

# Develop locally
supabase start
# Make changes

# Create preview
git push origin feature/new-feature
# PR creates preview environment automatically

# Test in preview
# Run tests against preview URL

# Merge to main
# Automatic production deployment
```

### 2. Hotfix Deployment

```bash
# Create hotfix branch from main
git checkout -b hotfix/urgent-fix main

# Make minimal fix
# Test locally

# Deploy directly to production
supabase link --project-ref prod-id
supabase functions deploy affected-function

# Merge back to main
git checkout main
git merge hotfix/urgent-fix
```

### 3. Database Migration

```bash
# Create migration
supabase migration new add_user_preferences

# Edit migration file
# Test locally
supabase db reset

# Deploy to staging
supabase link --project-ref staging-id
supabase db push

# Verify in staging
# Deploy to production
supabase link --project-ref prod-id
supabase db push
```

## Troubleshooting Deployments

### Common Issues

1. **Migration Failures**
   - Check for dependency order
   - Verify SQL syntax
   - Ensure idempotency

2. **Function Deploy Errors**
   - Validate TypeScript compilation
   - Check import paths
   - Verify environment variables

3. **Permission Errors**
   - Confirm authentication
   - Check project access
   - Verify service role key

### Debug Commands

```bash
# Check deployment status
supabase projects list

# View function logs
supabase functions logs function-name

# Test migrations
supabase db diff
supabase db lint
```

## Next Steps

1. Set up your local environment: See [ENVIRONMENT-MANAGEMENT.md](./ENVIRONMENT-MANAGEMENT.md)
2. Configure CI/CD: See [edge-functions/DEPLOYMENT-GUIDE.md](./edge-functions/DEPLOYMENT-GUIDE.md)
3. Learn about migrations: See [DATABASE-MIGRATION-GUIDE.md](./DATABASE-MIGRATION-GUIDE.md)

## Additional Resources

- [Supabase CLI Reference](https://supabase.com/docs/reference/cli)
- [GitHub Integration Guide](https://supabase.com/docs/guides/platform/github-integration)
- [Branching Documentation](https://supabase.com/docs/guides/platform/branching)