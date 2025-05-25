#!/bin/bash

# Database Migration Script for Registrations and Tickets tables
# This script safely executes the migration with proper error handling

set -e  # Exit on error

echo "🚀 Starting database migration for registrations and tickets tables..."
echo ""

# Check if we have the required environment variables
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL environment variable is not set"
    echo "Please set it to your Supabase database URL"
    exit 1
fi

# Create backup timestamp
BACKUP_TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "📦 Creating backup of current tables..."
echo ""

# Create backup using pg_dump (optional - uncomment if you want full backup)
# pg_dump $DATABASE_URL -t "Registrations" -t "Tickets" -t "registrations" -t "tickets" > backup_$BACKUP_TIMESTAMP.sql

# Or create backup tables within the database
psql $DATABASE_URL << EOF
-- Create backup tables
CREATE TABLE IF NOT EXISTS "Registrations_backup_$BACKUP_TIMESTAMP" AS SELECT * FROM "Registrations";
CREATE TABLE IF NOT EXISTS "Tickets_backup_$BACKUP_TIMESTAMP" AS SELECT * FROM "Tickets";

-- Show row counts
SELECT 'Registrations backup' as table_name, COUNT(*) as row_count FROM "Registrations_backup_$BACKUP_TIMESTAMP"
UNION ALL
SELECT 'Tickets backup' as table_name, COUNT(*) as row_count FROM "Tickets_backup_$BACKUP_TIMESTAMP";
EOF

echo ""
echo "✅ Backup completed"
echo ""

# Execute the migration
echo "🔄 Running migration..."
echo ""

psql $DATABASE_URL -f complete-migration-registrations-tickets.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migration completed successfully!"
    echo ""
    
    # Verify the migration
    echo "🔍 Verifying migration results..."
    psql $DATABASE_URL << EOF
SELECT 
    'Table check' as verification,
    tablename as table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = tablename) as column_count
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('registrations', 'tickets')
ORDER BY tablename;
EOF

    echo ""
    echo "📋 Next steps:"
    echo "1. Run: npx supabase gen types typescript --local"
    echo "2. Update your application code to use snake_case field names"
    echo "3. Test your application thoroughly"
    echo ""
    echo "⚠️  If you need to rollback, backup tables are available:"
    echo "   - Registrations_backup_$BACKUP_TIMESTAMP"
    echo "   - Tickets_backup_$BACKUP_TIMESTAMP"
else
    echo ""
    echo "❌ Migration failed! Your data is safe in the backup tables."
    echo "Please check the error messages above."
    exit 1
fi