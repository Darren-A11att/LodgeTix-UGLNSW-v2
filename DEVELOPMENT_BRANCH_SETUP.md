# Supabase Development Branch Setup

## Current Status

- **Production Project ID**: pwwpcjbbxotmiqrisjvf
- **Development Branch ID**: ufkrpmtrirxrebztmwkc
- **Development API URL**: https://ufkrpmtrirxrebztmwkc.supabase.co
- **Development DB Host**: db.ufkrpmtrirxrebztmwkc.supabase.co

## Getting API Keys for Development Branch

1. Go to: https://supabase.com/dashboard/project/pwwpcjbbxotmiqrisjvf/settings/api
2. Look for the branch selector dropdown (should be near the top)
3. Select "development" branch
4. Copy the following keys:
   - **anon (public) key**
   - **service_role (secret) key**

## Environment Configuration

### Option 1: Manual Configuration

Add these to your `.env.local` file:

```bash
# Development Branch Configuration
NEXT_PUBLIC_SUPABASE_URL=https://ufkrpmtrirxrebztmwkc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[copy-from-dashboard]
SUPABASE_SERVICE_ROLE_KEY=[copy-from-dashboard]

# Development Database URL
DATABASE_URL=[get-from-supabase-dashboard]

# Keep your existing Stripe and other configs
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=[your-stripe-publishable-key]
STRIPE_SECRET_KEY=[your-stripe-secret-key]
```

### Option 2: Use the Generated File

We've created `.env.development` with most settings pre-configured. After getting the API keys:

1. Edit `.env.development` and add the keys
2. Copy to `.env.local`: `cp .env.development .env.local`

## Migration Issues

The development branch has "MIGRATIONS_FAILED" status due to Edge Functions dependencies. These migrations reference `supabase_functions` schema which doesn't exist in branches.

### Workaround Options:

1. **Reset Branch** (Recommended for fresh start):
   ```bash
   # Delete and recreate the branch
   supabase branches delete development --experimental
   supabase branches create development --experimental
   ```

2. **Manual Database Setup**:
   - Connect to the development database using a SQL client
   - Run migrations manually, skipping problematic ones
   - Use the DATABASE_URL from above

3. **Use Branch Without Migrations**:
   - The branch is functional for basic operations
   - Some features requiring specific migrations may not work

## Testing the Development Branch

Once configured, test the connection:

```bash
# Start your Next.js app
npm run dev

# The app should now connect to the development branch
# Check browser console for any connection errors
```

## Switching Between Environments

### For Local Development (Docker):
```bash
# Use the local configuration in .env.local
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=[local-anon-key-from-supabase-start]
```

### For Development Branch:
```bash
# Use the development branch configuration
NEXT_PUBLIC_SUPABASE_URL=https://ufkrpmtrirxrebztmwkc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[development-anon-key]
```

### For Production:
```bash
# Use the production configuration
NEXT_PUBLIC_SUPABASE_URL=https://pwwpcjbbxotmiqrisjvf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[production-anon-key]
```

## GitHub Integration

To automatically deploy to development branch on push:

1. Add these GitHub secrets:
   - `SUPABASE_ACCESS_TOKEN`: [your-supabase-access-token]
   - `SUPABASE_PROJECT_REF`: pwwpcjbbxotmiqrisjvf
   - `SUPABASE_DB_PASSWORD`: [get-from-supabase-dashboard]

2. Create `.github/workflows/supabase-development.yml`:
   ```yaml
   name: Deploy to Development Branch
   
   on:
     push:
       branches: [development]
   
   jobs:
     deploy:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3
         - uses: supabase/setup-cli@v1
         - run: |
             supabase link --project-ref ${{ secrets.SUPABASE_PROJECT_REF }}
             supabase db push --db-url "postgresql://postgres:${{ secrets.SUPABASE_DB_PASSWORD }}@db.[dev-branch-id].supabase.co:5432/postgres"
           env:
             SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
   ```

## Next Steps

1. Get the API keys from Supabase dashboard
2. Update your `.env.local` with development branch settings
3. Test the connection
4. Consider resetting the branch if migrations continue to fail