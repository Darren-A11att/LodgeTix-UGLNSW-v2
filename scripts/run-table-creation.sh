#!/bin/bash
# Script to create the required tables directly

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
SQL_FILE="$SCRIPT_DIR/create-registrations-table.sql"

echo "=== LodgeTix Direct Table Creation Script ==="
echo "This script will create the required tables for payment processing."
echo

# Check for SQL file
if [ ! -f "$SQL_FILE" ]; then
    echo "Error: SQL file not found at $SQL_FILE"
    exit 1
fi

echo "Attempting to run SQL with available methods..."
echo

# Try Supabase CLI first if it exists
if command -v supabase &> /dev/null; then
    echo "Supabase CLI found. Attempting to use it..."
    echo
    echo "Enter your Supabase project reference:"
    read -p "Project Reference: " PROJECT_REF
    
    if [ -z "$PROJECT_REF" ]; then
        echo "Project reference is required for Supabase CLI."
    else
        echo "Running: supabase link --project-ref $PROJECT_REF"
        supabase link --project-ref "$PROJECT_REF"
        
        echo "Running: supabase db execute -f $SQL_FILE"
        supabase db execute -f "$SQL_FILE"
        
        if [ $? -eq 0 ]; then
            echo "✅ Tables created successfully using Supabase CLI!"
            exit 0
        else
            echo "❌ Failed to create tables using Supabase CLI."
        fi
    fi
fi

# Try using psql if available
if command -v psql &> /dev/null; then
    echo "PostgreSQL client (psql) found. Attempting to use it..."
    echo
    echo "Enter your Supabase database connection string:"
    echo "Example: postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres"
    read -p "Connection string: " DB_URL
    
    if [ -z "$DB_URL" ]; then
        echo "Database connection string is required for psql."
    else
        echo "Running: psql \"$DB_URL\" -f $SQL_FILE"
        psql "$DB_URL" -f "$SQL_FILE"
        
        if [ $? -eq 0 ]; then
            echo "✅ Tables created successfully using psql!"
            exit 0
        else
            echo "❌ Failed to create tables using psql."
        fi
    fi
fi

# Manual instructions as a fallback
echo
echo "No automated method succeeded. Please try one of these manual methods:"
echo
echo "1. Using Supabase Dashboard SQL Editor:"
echo "   a. Open your Supabase project dashboard"
echo "   b. Go to the SQL Editor tab"
echo "   c. Copy the contents of $SQL_FILE and paste them into the editor"
echo "   d. Run the SQL"
echo
echo "2. Using Supabase API:"
echo "   curl -X POST 'https://YOUR_PROJECT_ID.supabase.co/rest/v1/sql' \\"
echo "     -H 'apikey: YOUR_ANON_KEY' \\"
echo "     -H 'Authorization: Bearer YOUR_ANON_KEY' \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d \"{\\\"query\\\": \\\"$(sed 's/"/\\\\"/g' "$SQL_FILE" | tr -d '\n')\\\"}\" \\"
echo
echo "SQL file is located at: $SQL_FILE" 