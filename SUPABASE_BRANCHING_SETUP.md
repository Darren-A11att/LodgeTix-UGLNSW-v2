# Supabase Branching Setup Guide

## Prerequisites

1. **Supabase CLI Access Token**
   - Go to https://supabase.com/dashboard/account/tokens
   - Create a new access token
   - Save it securely

2. **Project Reference**
   - Your project ref: `pwwpcjbbxotmiqrisjvf` (from your Supabase URL)

## Setup Steps

### 1. Login to Supabase CLI

```bash
# Set your access token as environment variable
export SUPABASE_ACCESS_TOKEN="your-access-token-here"

# Or login interactively
supabase login
```

### 2. Link Your Project

```bash
# Link to your Supabase project
supabase link --project-ref pwwpcjbbxotmiqrisjvf
```

### 3. Create Development Branch

```bash
# Create a new branch called "development"
supabase branches create development --experimental
```

### 4. List Branches

```bash
# Verify the branch was created
supabase branches list --experimental
```

### 5. Switch to Development Branch

```bash
# Switch to the development branch
supabase branches switch development --experimental
```

## Environment Variables for Branches

After creating your development branch, you'll get new connection strings. Update your `.env.local`:

```bash
# Development Branch Supabase
# NEXT_PUBLIC_SUPABASE_URL=https://[branch-id].supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=[branch-anon-key]
```

## GitHub Integration

### 1. Create GitHub Action

Create `.github/workflows/supabase-preview.yml`:

```yaml
name: Deploy Supabase Preview

on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - uses: supabase/setup-cli@v1
        with:
          version: latest
          
      - name: Deploy Preview Branch
        run: |
          supabase link --project-ref ${{ secrets.SUPABASE_PROJECT_REF }}
          supabase db push --linked
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
```

### 2. Add GitHub Secrets

Add these secrets to your GitHub repository:
- `SUPABASE_ACCESS_TOKEN`: Your Supabase access token
- `SUPABASE_PROJECT_REF`: pwwpcjbbxotmiqrisjvf

## Working with Branches

### Push Local Changes to Branch

```bash
# Push your local database changes to the current branch
supabase db push --linked
```

### Pull Branch Changes Locally

```bash
# Pull changes from the remote branch to local
supabase db pull --linked
```

### Reset Branch

```bash
# Reset branch to match production
supabase branches reset development --experimental
```

### Delete Branch

```bash
# Delete a branch when no longer needed
supabase branches delete development --experimental
```

## Best Practices

1. **Always work on a branch** - Never push directly to production
2. **Test migrations locally first** - Use `supabase db reset` to test
3. **Use preview branches** - Create branches for pull requests
4. **Clean up old branches** - Delete branches after merging

## Troubleshooting

### If you get "experimental flag" errors:
Always add `--experimental` to branch commands

### If you get authentication errors:
Check your `SUPABASE_ACCESS_TOKEN` is set correctly

### If migrations fail:
1. Check migration syntax with `supabase db lint`
2. Test locally with `supabase db reset`
3. Review error logs in Supabase dashboard