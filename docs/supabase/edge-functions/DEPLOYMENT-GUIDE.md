# Edge Functions Deployment Guide

## Overview
This guide covers the complete deployment pipeline for Supabase Edge Functions in the LodgeTix UGLNSW project. It includes CI/CD setup, environment management, and production deployment best practices.

## Table of Contents
1. [Deployment Overview](#deployment-overview)
2. [Manual Deployment](#manual-deployment)
3. [GitHub Actions CI/CD](#github-actions-cicd)
4. [Environment Configuration](#environment-configuration)
5. [Secrets Management](#secrets-management)
6. [Deployment Strategies](#deployment-strategies)
7. [Monitoring & Rollback](#monitoring--rollback)
8. [Production Checklist](#production-checklist)
9. [Advanced Patterns](#advanced-patterns)
10. [Troubleshooting Deployments](#troubleshooting-deployments)

## Deployment Overview

### Edge Functions Deployment Flow
```
Local Development → Git Push → CI Tests → Deploy to Staging → Manual Approval → Deploy to Production
```

### Key Components
- **Supabase CLI**: Handles deployment to Supabase platform
- **GitHub Actions**: Automates testing and deployment
- **Environment Secrets**: Manages configuration across environments
- **Monitoring**: Tracks function health and performance

## Manual Deployment

### Prerequisites
```bash
# Install Supabase CLI
brew install supabase/tap/supabase

# Login to Supabase
supabase login
```

### Deploy All Functions
```bash
# Link to your project
supabase link --project-ref your-project-ref

# Deploy all functions
supabase functions deploy

# Deploy with specific region
supabase functions deploy --region us-east-1
```

### Deploy Specific Function
```bash
# Deploy single function
supabase functions deploy function-name

# Deploy with verification
supabase functions deploy function-name --verify-jwt

# Deploy with import map
supabase functions deploy function-name --import-map supabase/functions/import_map.json
```

### Deploy with Environment Variables
```bash
# Set secrets before deployment
supabase secrets set STRIPE_SECRET_KEY=sk_live_xxx
supabase secrets set RESEND_API_KEY=re_live_xxx

# Deploy function
supabase functions deploy

# Verify secrets
supabase secrets list
```

## GitHub Actions CI/CD

### Basic CI/CD Workflow

Create `.github/workflows/deploy-edge-functions.yml`:

```yaml
name: Deploy Edge Functions

on:
  push:
    branches:
      - main
    paths:
      - 'supabase/functions/**'
  pull_request:
    paths:
      - 'supabase/functions/**'

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Deno
        uses: denoland/setup-deno@v1
        with:
          deno-version: v1.x
      
      - name: Verify formatting
        run: deno fmt --check supabase/functions/
      
      - name: Run linter
        run: deno lint supabase/functions/
      
      - name: Run tests
        run: deno test --allow-all supabase/functions/

  deploy-staging:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - uses: actions/checkout@v4
      
      - uses: supabase/setup-cli@v1
        with:
          version: latest
      
      - name: Deploy to Staging
        run: |
          supabase link --project-ref ${{ secrets.STAGING_PROJECT_REF }}
          supabase functions deploy --project-ref ${{ secrets.STAGING_PROJECT_REF }}
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}

  deploy-production:
    needs: deploy-staging
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4
      
      - uses: supabase/setup-cli@v1
        with:
          version: latest
      
      - name: Deploy to Production
        run: |
          supabase link --project-ref ${{ secrets.PRODUCTION_PROJECT_REF }}
          supabase functions deploy --project-ref ${{ secrets.PRODUCTION_PROJECT_REF }}
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
```

### Advanced CI/CD with Function-Level Control

```yaml
name: Deploy Specific Functions

on:
  workflow_dispatch:
    inputs:
      function:
        description: 'Function to deploy (leave empty for all)'
        required: false
        type: string
      environment:
        description: 'Target environment'
        required: true
        type: choice
        options:
          - staging
          - production

jobs:
  validate:
    runs-on: ubuntu-latest
    outputs:
      function-list: ${{ steps.list.outputs.functions }}
    steps:
      - uses: actions/checkout@v4
      
      - name: List functions
        id: list
        run: |
          if [ -z "${{ inputs.function }}" ]; then
            FUNCTIONS=$(ls -d supabase/functions/*/ | xargs -n 1 basename | grep -v _shared | jq -R -s -c 'split("\n")[:-1]')
          else
            FUNCTIONS='["${{ inputs.function }}"]'
          fi
          echo "functions=$FUNCTIONS" >> $GITHUB_OUTPUT

  deploy:
    needs: validate
    runs-on: ubuntu-latest
    environment: ${{ inputs.environment }}
    strategy:
      matrix:
        function: ${{ fromJson(needs.validate.outputs.function-list) }}
    steps:
      - uses: actions/checkout@v4
      
      - uses: supabase/setup-cli@v1
      
      - name: Deploy ${{ matrix.function }}
        run: |
          PROJECT_REF=${{ inputs.environment == 'production' && secrets.PRODUCTION_PROJECT_REF || secrets.STAGING_PROJECT_REF }}
          supabase functions deploy ${{ matrix.function }} --project-ref $PROJECT_REF
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
```

### PR Preview Deployments

```yaml
name: Preview Deployment

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  create-preview:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: supabase/setup-cli@v1
      
      - name: Create preview branch
        id: preview
        run: |
          BRANCH_NAME="preview-pr-${{ github.event.pull_request.number }}"
          supabase branches create $BRANCH_NAME --project-ref ${{ secrets.STAGING_PROJECT_REF }}
          echo "branch=$BRANCH_NAME" >> $GITHUB_OUTPUT
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
      
      - name: Deploy to preview
        run: |
          supabase functions deploy --project-ref ${{ secrets.STAGING_PROJECT_REF }} --branch ${{ steps.preview.outputs.branch }}
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
      
      - name: Comment PR
        uses: actions/github-script@v6
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: '🚀 Preview deployed to branch: `${{ steps.preview.outputs.branch }}`'
            })
```

## Environment Configuration

### Managing Multiple Environments

```bash
# Development
supabase link --project-ref dev-project-ref
supabase functions deploy --project-ref dev-project-ref

# Staging
supabase link --project-ref staging-project-ref
supabase functions deploy --project-ref staging-project-ref

# Production
supabase link --project-ref prod-project-ref
supabase functions deploy --project-ref prod-project-ref
```

### Environment-Specific Configuration

Create `supabase/functions/config/`:

```typescript
// config/environments.ts
export const config = {
  development: {
    apiUrl: 'http://localhost:3000',
    stripeKey: 'sk_test_...',
    logLevel: 'debug'
  },
  staging: {
    apiUrl: 'https://staging.lodgetix.uglnsw.org.au',
    stripeKey: 'sk_test_...',
    logLevel: 'info'
  },
  production: {
    apiUrl: 'https://lodgetix.uglnsw.org.au',
    stripeKey: 'sk_live_...',
    logLevel: 'error'
  }
}

// Get current environment
const env = Deno.env.get('ENVIRONMENT') || 'development'
export const currentConfig = config[env]
```

## Secrets Management

### Setting Secrets via CLI

```bash
# Set individual secrets
supabase secrets set SECRET_NAME=secret_value

# Set multiple secrets
supabase secrets set STRIPE_KEY=sk_live_xxx RESEND_KEY=re_xxx

# Set from .env file
supabase secrets set --env-file .env.production

# List all secrets
supabase secrets list

# Remove a secret
supabase secrets unset SECRET_NAME
```

### Secrets in GitHub Actions

Required repository secrets:
```
SUPABASE_ACCESS_TOKEN      # Personal access token
STAGING_PROJECT_REF        # Staging project ID
PRODUCTION_PROJECT_REF     # Production project ID
```

Optional function secrets:
```
STRIPE_SECRET_KEY_STAGING
STRIPE_SECRET_KEY_PRODUCTION
RESEND_API_KEY_STAGING
RESEND_API_KEY_PRODUCTION
```

### Secrets Rotation Workflow

```yaml
name: Rotate Secrets

on:
  schedule:
    - cron: '0 0 1 * *' # Monthly
  workflow_dispatch:

jobs:
  rotate:
    runs-on: ubuntu-latest
    steps:
      - name: Generate new secrets
        id: generate
        run: |
          NEW_API_KEY=$(openssl rand -hex 32)
          echo "::add-mask::$NEW_API_KEY"
          echo "new_key=$NEW_API_KEY" >> $GITHUB_OUTPUT
      
      - name: Update Supabase secrets
        run: |
          supabase secrets set API_KEY=${{ steps.generate.outputs.new_key }} --project-ref ${{ secrets.PRODUCTION_PROJECT_REF }}
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
      
      - name: Update GitHub secrets
        uses: gliech/create-github-secret-action@v1
        with:
          name: API_KEY
          value: ${{ steps.generate.outputs.new_key }}
          pa_token: ${{ secrets.PA_TOKEN }}
```

## Deployment Strategies

### Blue-Green Deployment

```typescript
// Function with version routing
serve(async (req) => {
  const version = req.headers.get('x-function-version') || 'stable'
  
  if (version === 'canary') {
    return handleCanaryVersion(req)
  }
  
  return handleStableVersion(req)
})
```

### Canary Deployment

```typescript
// Percentage-based routing
serve(async (req) => {
  const userId = req.headers.get('x-user-id')
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(userId))
  const percentage = new DataView(hash).getUint8(0) / 255
  
  if (percentage < 0.1) { // 10% canary
    return handleCanaryVersion(req)
  }
  
  return handleStableVersion(req)
})
```

### Feature Flags

```typescript
// Using Supabase for feature flags
const supabase = createClient(/* ... */)

serve(async (req) => {
  const { data: flags } = await supabase
    .from('feature_flags')
    .select('*')
    .eq('active', true)
  
  if (flags?.find(f => f.name === 'new_email_system')) {
    return handleNewEmailSystem(req)
  }
  
  return handleLegacyEmailSystem(req)
})
```

## Monitoring & Rollback

### Health Check Endpoint

```typescript
// Add health check to every function
serve(async (req) => {
  const url = new URL(req.url)
  
  if (url.pathname.endsWith('/health')) {
    return new Response(JSON.stringify({
      status: 'healthy',
      version: Deno.env.get('FUNCTION_VERSION') || 'unknown',
      timestamp: new Date().toISOString()
    }), {
      headers: { 'Content-Type': 'application/json' }
    })
  }
  
  // Regular function logic
})
```

### Automated Health Checks

```yaml
name: Health Check

on:
  schedule:
    - cron: '*/5 * * * *' # Every 5 minutes
  workflow_dispatch:

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - name: Check functions health
        run: |
          FUNCTIONS=("send-email" "generate-qr" "process-payment")
          for func in "${FUNCTIONS[@]}"; do
            response=$(curl -s -o /dev/null -w "%{http_code}" https://your-project.supabase.co/functions/v1/$func/health)
            if [ $response -ne 200 ]; then
              echo "Function $func is unhealthy"
              exit 1
            fi
          done
```

### Rollback Procedure

```bash
# Quick rollback to previous version
#!/bin/bash
FUNCTION_NAME=$1
PREVIOUS_COMMIT=$2

# Checkout previous version
git checkout $PREVIOUS_COMMIT -- supabase/functions/$FUNCTION_NAME

# Deploy immediately
supabase functions deploy $FUNCTION_NAME --project-ref $PRODUCTION_PROJECT_REF

# Verify deployment
curl https://your-project.supabase.co/functions/v1/$FUNCTION_NAME/health
```

### Monitoring Setup

```typescript
// Add structured logging
function log(level: string, message: string, data?: any) {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    message,
    ...data
  }))
}

serve(async (req) => {
  const requestId = crypto.randomUUID()
  
  log('info', 'Request received', {
    requestId,
    method: req.method,
    path: new URL(req.url).pathname
  })
  
  try {
    const result = await processRequest(req)
    
    log('info', 'Request completed', {
      requestId,
      status: 200
    })
    
    return new Response(JSON.stringify(result))
  } catch (error) {
    log('error', 'Request failed', {
      requestId,
      error: error.message,
      stack: error.stack
    })
    
    throw error
  }
})
```

## Production Checklist

### Pre-Deployment Checklist

- [ ] **Code Quality**
  - [ ] All tests passing
  - [ ] No linting errors
  - [ ] Code reviewed and approved
  - [ ] No console.log statements (use structured logging)

- [ ] **Security**
  - [ ] JWT verification enabled
  - [ ] Input validation implemented
  - [ ] Rate limiting configured
  - [ ] No hardcoded secrets
  - [ ] CORS properly configured

- [ ] **Performance**
  - [ ] Function size < 50MB
  - [ ] Cold start optimized
  - [ ] Database queries optimized
  - [ ] Caching implemented where appropriate

- [ ] **Error Handling**
  - [ ] All errors caught and logged
  - [ ] User-friendly error messages
  - [ ] No sensitive data in errors
  - [ ] Retry logic for external services

- [ ] **Monitoring**
  - [ ] Health check endpoint added
  - [ ] Structured logging implemented
  - [ ] Alerts configured
  - [ ] Performance metrics tracked

- [ ] **Documentation**
  - [ ] README updated
  - [ ] API documentation current
  - [ ] Deployment notes added
  - [ ] Runbook created

### Deployment Script

```bash
#!/bin/bash
# deploy-production.sh

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

echo "🚀 Starting production deployment..."

# Run tests
echo "Running tests..."
deno test --allow-all supabase/functions/

# Lint check
echo "Running linter..."
deno lint supabase/functions/

# Format check
echo "Checking formatting..."
deno fmt --check supabase/functions/

# Confirm deployment
read -p "Deploy to production? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}Deployment cancelled${NC}"
    exit 1
fi

# Deploy
echo "Deploying to production..."
supabase functions deploy --project-ref $PRODUCTION_PROJECT_REF

# Verify deployment
echo "Verifying deployment..."
FUNCTIONS=("send-email" "generate-qr" "process-payment")
for func in "${FUNCTIONS[@]}"; do
    response=$(curl -s -o /dev/null -w "%{http_code}" https://your-project.supabase.co/functions/v1/$func/health)
    if [ $response -eq 200 ]; then
        echo -e "${GREEN}✓ $func is healthy${NC}"
    else
        echo -e "${RED}✗ $func is unhealthy${NC}"
        exit 1
    fi
done

echo -e "${GREEN}✅ Deployment successful!${NC}"
```

## Advanced Patterns

### Multi-Region Deployment

```yaml
name: Multi-Region Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    strategy:
      matrix:
        region: [us-east-1, eu-west-1, ap-southeast-1]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: supabase/setup-cli@v1
      
      - name: Deploy to ${{ matrix.region }}
        run: |
          supabase functions deploy --project-ref ${{ secrets[format('PROJECT_REF_{0}', matrix.region)] }} --region ${{ matrix.region }}
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
```

### Gradual Rollout

```typescript
// Function with gradual rollout
const ROLLOUT_PERCENTAGE = parseInt(Deno.env.get('ROLLOUT_PERCENTAGE') || '0')

serve(async (req) => {
  const userId = req.headers.get('x-user-id') || 'anonymous'
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(userId))
  const userPercentage = (new DataView(hash).getUint8(0) / 255) * 100
  
  if (userPercentage < ROLLOUT_PERCENTAGE) {
    return handleNewVersion(req)
  }
  
  return handleOldVersion(req)
})
```

### Deployment Notifications

```yaml
name: Deploy with Notifications

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy
        id: deploy
        run: |
          # Deploy logic here
          echo "version=$(git rev-parse --short HEAD)" >> $GITHUB_OUTPUT
      
      - name: Notify Slack
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {
              "text": "Edge Functions deployed to production",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "*Edge Functions Deployed* :rocket:\n*Version:* ${{ steps.deploy.outputs.version }}\n*Environment:* Production\n*Deployed by:* ${{ github.actor }}"
                  }
                }
              ]
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

## Troubleshooting Deployments

### Common Deployment Issues

1. **Authentication Error**
   ```
   Error: Invalid access token
   ```
   Solution:
   ```bash
   # Re-authenticate
   supabase login
   # Or use access token
   export SUPABASE_ACCESS_TOKEN=your-token
   ```

2. **Function Size Limit**
   ```
   Error: Function size exceeds limit (50MB)
   ```
   Solution:
   - Remove unnecessary dependencies
   - Use dynamic imports
   - Optimize bundle size

3. **Missing Secrets**
   ```
   Error: Environment variable X not found
   ```
   Solution:
   ```bash
   # Set missing secret
   supabase secrets set X=value --project-ref your-ref
   ```

4. **Region Mismatch**
   ```
   Error: Function not found in region
   ```
   Solution:
   ```bash
   # Deploy to correct region
   supabase functions deploy --region correct-region
   ```

5. **Version Conflicts**
   ```
   Error: Import version mismatch
   ```
   Solution:
   - Clear Deno cache: `deno cache --reload`
   - Update import versions
   - Use fixed versions in imports

### Debug Deployment Script

```bash
#!/bin/bash
# debug-deployment.sh

echo "🔍 Debugging deployment..."

# Check CLI version
echo "Supabase CLI version:"
supabase --version

# Check authentication
echo "\nChecking authentication..."
supabase projects list

# Check project link
echo "\nChecking project link..."
supabase status

# List functions
echo "\nListing functions..."
ls -la supabase/functions/

# Check function sizes
echo "\nChecking function sizes..."
du -sh supabase/functions/*

# Validate functions
echo "\nValidating functions..."
for dir in supabase/functions/*/; do
    if [ -f "$dir/index.ts" ]; then
        echo "✓ $(basename $dir)"
        deno check "$dir/index.ts"
    fi
done

# Check secrets
echo "\nChecking secrets..."
supabase secrets list
```

## Next Steps

1. **Set up GitHub repository secrets** for automated deployment
2. **Configure monitoring** using Supabase dashboard or external tools
3. **Create runbooks** for common operational tasks
4. **Set up alerts** for function failures
5. **Document your deployment process** for team members

For local development setup, see [DEVELOPMENT-GUIDE.md](./DEVELOPMENT-GUIDE.md)
For troubleshooting help, see [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)