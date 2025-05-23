#!/bin/bash
# Script to combine migration files and run them against the Supabase database

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DEFINITIONS_DIR="$PROJECT_ROOT/.development/supabase-integration/Table-Definitions"
TEMP_FILE="$PROJECT_ROOT/tmp/combined-migrations.sql"

# Create temp directory if it doesn't exist
mkdir -p "$PROJECT_ROOT/tmp"

echo "=== LodgeTix Database Migration Script ==="
echo "This script will create all required database tables for the application."
echo

# Ensure we have the Supabase URL and key
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
    echo "Error: Supabase environment variables not set."
    echo "Please set the following environment variables:"
    echo "  NEXT_PUBLIC_SUPABASE_URL"
    echo "  NEXT_PUBLIC_SUPABASE_ANON_KEY"
    echo
    echo "You can set them temporarily with:"
    echo "  export NEXT_PUBLIC_SUPABASE_URL=your-url"
    echo "  export NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key"
    exit 1
fi

# Combine all the SQL definition files
echo "Combining table definition files..."

# First, create necessary enum types
cat > "$TEMP_FILE" << EOF
-- Create enum types first
CREATE TYPE IF NOT EXISTS public.payment_status AS ENUM (
  'pending', 'completed', 'failed', 'refunded', 'partially_refunded', 'cancelled', 'expired'
);

CREATE TYPE IF NOT EXISTS public.registration_type AS ENUM (
  'Individuals', 'Groups', 'Officials'
);

-- Now we add all the table definitions
EOF

# Add all the table definitions
for file in "$DEFINITIONS_DIR"/*.sql; do
    echo "Adding $(basename "$file")"
    echo "-- $(basename "$file")" >> "$TEMP_FILE"
    cat "$file" >> "$TEMP_FILE"
    echo "" >> "$TEMP_FILE"
done

# Display options to run migrations
echo
echo "Migration file created at: $TEMP_FILE"
echo
echo "How would you like to run the migrations?"
echo "1) Using Supabase CLI (if installed)"
echo "2) Using Supabase direct SQL API endpoint"
echo "3) Just create the file (manual run later)"
echo "q) Quit without running migrations"
read -p "Select an option [1-3/q]: " option

case "$option" in
    1)
        echo "Running migrations with Supabase CLI..."
        if ! command -v supabase &> /dev/null; then
            echo "Error: Supabase CLI not found. Please install it first."
            echo "npm install -g supabase"
            exit 1
        fi
        
        read -p "Enter your Supabase project reference: " PROJECT_REF
        supabase link --project-ref "$PROJECT_REF"
        supabase db execute -f "$TEMP_FILE"
        ;;
    2)
        echo "Running migrations with direct SQL API..."
        # Get Supabase direct SQL API endpoint
        SUPABASE_HOST=$(echo $NEXT_PUBLIC_SUPABASE_URL | sed 's/https:\/\///')
        SQL_API_URL="https://$SUPABASE_HOST/rest/v1/sql"
        
        # Read the migration file
        MIGRATION_SQL=$(cat "$TEMP_FILE")
        
        # Run the migrations
        echo "Sending SQL to Supabase..."
        curl -X POST "$SQL_API_URL" \
            -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
            -H "Authorization: Bearer $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
            -H "Content-Type: application/json" \
            -d "{\"query\": \"$MIGRATION_SQL\"}"
        echo
        ;;
    3)
        echo "Migration file created but not executed."
        echo "You can run it manually with your preferred SQL tool."
        ;;
    q|Q)
        echo "Quitting without running migrations."
        exit 0
        ;;
    *)
        echo "Invalid option."
        exit 1
        ;;
esac

echo
echo "=== Migration Process Complete ==="
echo 