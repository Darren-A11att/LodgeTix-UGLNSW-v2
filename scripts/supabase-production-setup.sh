#!/bin/bash

# Supabase Production Setup Script
# This script helps set up proper database connection with SSL for production

echo "=== Supabase Production Database Setup ==="
echo ""

# Production database URL with SSL mode - set via environment variable
if [ -z "$PROD_DB_URL" ]; then
  echo "❌ PROD_DB_URL environment variable is required"
  exit 1
fi

# Direct connection URL (bypassing pooler)
# Set database URL via environment variable
if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL environment variable is required"
  exit 1
fi
DIRECT_DB_URL="$DATABASE_URL"

echo "1. First, let's check the current migration status..."
supabase migration list --db-url "$DIRECT_DB_URL"

echo ""
echo "2. Creating a clean migrations backup..."
mkdir -p supabase/migrations_backup_$(date +%Y%m%d_%H%M%S)
cp -r supabase/migrations/* supabase/migrations_backup_$(date +%Y%m%d_%H%M%S)/ 2>/dev/null || true

echo ""
echo "3. Cleaning up migration files..."
# Remove disabled and backup files
find supabase/migrations -name "*.disabled" -delete
find supabase/migrations -name "*.backup" -delete
find supabase/migrations -name "*.bak" -delete

# Remove subdirectories from migrations folder
rm -rf supabase/migrations/backup
rm -rf supabase/migrations/custom
rm -rf supabase/migrations/parsed

echo ""
echo "4. Now let's repair the migration history..."
echo "This will mark migrations as applied in the production database."

# List of migrations that need to be marked as applied (from the error message)
APPLIED_MIGRATIONS=(
    "20250605073722"
    "20250606000001"
    "20250606000002"
    "20250606000003"
    "20250606043128"
    "20250607000007"
    "20250607000008"
    "20250607000009"
    "20250607000100"
    "20250607000101"
    "20250607000102"
    "20250607000105"
    "20250607000107"
    "20250608000003"
    "20250608000007"
    "20250608000008"
    "20250608000009"
    "20250608000010"
    "20250608000011"
    "20250608000012"
    "20250608000013"
    "20250608000014"
    "20250608000015"
    "20250608000016"
    "20250608000017"
    "20250608000020"
    "20250608000021"
    "20250608000022"
    "20250608000025"
    "20250608000026"
    "20250608000027"
    "20250608000028"
    "20250608000029"
    "20250608000030"
    "20250608000031"
    "20250608000032"
    "20250608000033"
    "20250608000034"
    "20250608000035"
    "20250608000036"
    "20250608000037"
    "20250608000038"
    "20250608000039"
    "20250608000040"
    "20250608000041"
    "20250608000102"
    "20250608000103"
    "20250608000104"
    "20250608000105"
    "20250608000106"
    "20250608000108"
    "20250608000109"
    "20250608000110"
    "20250608000111"
    "20250608000112"
    "20250608000113"
    "20250608000114"
    "20250608000200"
    "20250608000210"
    "20250608000211"
    "20250608000212"
    "20250608000213"
    "20250608000214"
    "20250608000215"
    "20250608000216"
    "20250608000217"
    "20250608000220"
    "20250608000221"
    "20250608000222"
    "20250608000223"
    "20250608000224"
    "20250608000225"
    "20250608000226"
    "20250608000227"
    "20250608000228"
    "20250608000229"
    "20250608000230"
    "20250608000310"
    "20250608001020"
    "20250608001030"
    "20250608001040"
    "20250608001100"
    "20250608001200"
)

# Migrations that need to be marked as reverted
REVERTED_MIGRATIONS=(
    "20250608000107"
    "20250608000300"
)

echo "Marking migrations as reverted..."
for migration in "${REVERTED_MIGRATIONS[@]}"; do
    echo "Marking $migration as reverted..."
    supabase migration repair --status reverted "$migration" --db-url "$DIRECT_DB_URL"
done

echo ""
echo "Marking migrations as applied..."
for migration in "${APPLIED_MIGRATIONS[@]}"; do
    # Check if the migration file exists
    if ls supabase/migrations/${migration}_*.sql 1> /dev/null 2>&1; then
        echo "Marking $migration as applied..."
        supabase migration repair --status applied "$migration" --db-url "$DIRECT_DB_URL"
    else
        echo "Skipping $migration (file not found)"
    fi
done

echo ""
echo "5. Verifying migration status..."
supabase migration list --db-url "$DIRECT_DB_URL"

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Next steps for proper branching workflow:"
echo "1. Create a new branch for development: git checkout -b development"
echo "2. Create a Supabase branch: supabase branches create development"
echo "3. Use 'supabase db push' to apply migrations to your branch"
echo "4. When ready to deploy, create a PR and merge to main"
echo ""
echo "For more info: https://supabase.com/docs/guides/platform/branching"