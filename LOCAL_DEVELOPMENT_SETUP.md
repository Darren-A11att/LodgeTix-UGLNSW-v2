# Local Development Setup

## Environment Variables

The `.env.local` file is now configured to support both local and production environments.

### Switching Between Environments

#### For Local Development
The environment variables are currently set to use the local Supabase instance running in Docker:
- **API URL**: http://127.0.0.1:54321
- **Studio URL**: http://127.0.0.1:54323

No changes needed - the file is already configured for local development.

#### For Production Testing
To test against the production database:
1. Comment out the "Local Supabase" section in `.env.local`
2. Uncomment the "Production Supabase" section
3. Restart your Next.js development server

### Starting Local Supabase

```bash
# Start Supabase
supabase start

# Check status
supabase status

# Access Supabase Studio
open http://localhost:54323
```

### Resetting Local Database

If you encounter migration issues:
```bash
# Use the reset script
./scripts/reset-local-db.sh
```

This script:
- Stops all Supabase containers
- Moves problematic migrations temporarily
- Starts fresh with working migrations
- Provides access URLs for Studio and API

### Important Notes

1. **Never commit production credentials** - The production values in `.env.local` are commented out for safety
2. **Local database is ephemeral** - Data will be lost when you run `supabase stop`
3. **Migration sync** - Local migrations should match what's in production
4. **Service role key** - The local service role key is included for server-side operations

### Troubleshooting

If you see connection errors:
1. Ensure Supabase is running: `supabase status`
2. Check Docker is running: `docker ps`
3. Verify environment variables are set correctly
4. Restart Next.js dev server after changing `.env.local`

### Database Access

- **Supabase Studio**: http://localhost:54323
- **API Endpoint**: http://localhost:54321
- **Database**: postgresql://postgres:postgres@localhost:54322/postgres