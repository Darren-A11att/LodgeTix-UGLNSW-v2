#!/bin/bash

# Supabase Development Branch Setup Script

echo "=== Setting Up Supabase Development Branch ==="
echo ""

# Check for required environment variables
if [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
  echo "❌ SUPABASE_ACCESS_TOKEN environment variable is required"
  exit 1
fi

if [ -z "$DEV_BRANCH_ID" ]; then
  echo "❌ DEV_BRANCH_ID environment variable is required"
  exit 1
fi

if [ -z "$DEV_DB_PASSWORD" ]; then
  echo "❌ DEV_DB_PASSWORD environment variable is required"
  exit 1
fi

# Development branch details from environment variables
DEV_BRANCH_URL="https://${DEV_BRANCH_ID}.supabase.co"
DEV_DB_HOST="db.${DEV_BRANCH_ID}.supabase.co"

echo "Development Branch Details:"
echo "- Branch ID: ${DEV_BRANCH_ID}"
echo "- API URL: ${DEV_BRANCH_URL}"
echo "- Database Host: ${DEV_DB_HOST}"
echo ""

# Update .env.development file
cat > .env.development << EOF
# ============================================
# DEVELOPMENT BRANCH CONFIGURATION
# ============================================
# This file is for the Supabase development branch
# DO NOT commit this file to version control
# ============================================

# Development Branch URLs
NEXT_PUBLIC_SUPABASE_URL=${DEV_BRANCH_URL}
SUPABASE_URL=${DEV_BRANCH_URL}

# Development Branch Database
DATABASE_URL=postgresql://postgres:${DEV_DB_PASSWORD}@${DEV_DB_HOST}:5432/postgres
DIRECT_URL=postgresql://postgres:${DEV_DB_PASSWORD}@${DEV_DB_HOST}:5432/postgres

# Copy other necessary variables from production
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=[your-stripe-publishable-key]
STRIPE_SECRET_KEY=[your-stripe-secret-key]

# Stripe platform fee configuration
STRIPE_PLATFORM_FEE_PERCENTAGE=0.02
STRIPE_PLATFORM_FEE_CAP=20
NEXT_PUBLIC_STRIPE_FEE_MODE=pass_on

# Featured Function ID
FILTER_TO=function
FEATURED_FUNCTION_ID=eebddef5-6833-43e3-8d32-700508b1c089

# Enable new events schema
NEXT_PUBLIC_USE_EVENTS_SCHEMA=true
USE_RPC_STATUS_UPDATE=true
NEXT_PUBLIC_USE_RPC_REGISTRATION=true

# App URL for redirects and callbacks
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Cloudflare Turnstile
NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY=[your-turnstile-site-key]
CLOUDFLARE_TURNSTILE_SECRET_KEY=[your-turnstile-secret-key]
NEXT_CLOUDFLARE_TURNSTILE_SECRET_KEY=[your-turnstile-secret-key]

# Note: We need to get the anon key and service role key for the development branch
# These will be added once retrieved from the Supabase dashboard
EOF

echo "Created .env.development file"
echo ""

# Push local migrations to development branch
echo "Pushing local migrations to development branch..."
supabase db push --linked --project-ref pwwpcjbbxotmiqrisjvf

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Next steps:"
echo "1. Go to https://supabase.com/dashboard/project/pwwpcjbbxotmiqrisjvf/settings/api"
echo "2. Select the 'development' branch from the dropdown"
echo "3. Copy the anon key and service role key"
echo "4. Add them to .env.development:"
echo "   NEXT_PUBLIC_SUPABASE_ANON_KEY=<development-anon-key>"
echo "   SUPABASE_SERVICE_ROLE_KEY=<development-service-key>"
echo ""
echo "To use the development branch locally:"
echo "  cp .env.development .env.local"
echo ""