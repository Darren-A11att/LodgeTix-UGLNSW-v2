#!/bin/bash
# Supabase CLI migration script for events schema

echo "=== Supabase Events Migration Script ==="
echo

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "Supabase CLI not found. Installing..."
    npm install -g supabase
fi

# Get project reference from user
echo "Please enter your Supabase project reference:"
echo "(You can find this in your Supabase URL: https://[PROJECT_REF].supabase.co)"
read -p "Project Reference: " PROJECT_REF

if [ -z "$PROJECT_REF" ]; then
    echo "Error: Project reference is required"
    exit 1
fi

# Link to the project
echo
echo "Linking to Supabase project..."
supabase link --project-ref $PROJECT_REF

# Execute the schema
echo
echo "Executing events schema..."
supabase db execute -f .development/events-supabase/01-events-schema-definition.sql

# Check if schema execution was successful
if [ $? -eq 0 ]; then
    echo "✓ Schema executed successfully"
else
    echo "✗ Error executing schema"
    exit 1
fi

# Add project ref to .env.local if not already there
if ! grep -q "SUPABASE_PROJECT_REF" .env.local 2>/dev/null; then
    echo
    echo "Adding project reference to .env.local..."
    echo "SUPABASE_PROJECT_REF=$PROJECT_REF" >> .env.local
fi

echo
echo "=== Schema creation complete ==="
echo
echo "Next steps:"
echo "1. Run the migration: npm run migrate:events"
echo "2. Verify migration: npm run verify:events"
echo "3. Enable feature flag in .env.local: NEXT_PUBLIC_USE_EVENTS_SCHEMA=true"
echo "4. Test: npm run dev"
echo