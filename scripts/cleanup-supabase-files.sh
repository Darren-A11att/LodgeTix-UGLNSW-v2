#!/bin/bash

# Supabase Files Cleanup Script
# This script consolidates the Supabase client files

echo "Starting Supabase files cleanup..."

# Step 1: Create backup
echo "Creating backup of current files..."
mkdir -p scripts/supabase-cleanup-backup
cp lib/supabase*.ts scripts/supabase-cleanup-backup/

# Step 2: Update imports from supabase-browser to supabase
echo "Updating imports from supabase-browser to supabase..."
find . -type f \( -name "*.ts" -o -name "*.tsx" \) -not -path "./node_modules/*" -not -path "./.next/*" -exec sed -i '' 's/from ['"'"'"]@\/lib\/supabase-browser['"'"'"]/from "@\/lib\/supabase"/g' {} +
find . -type f \( -name "*.ts" -o -name "*.tsx" \) -not -path "./node_modules/*" -not -path "./.next/*" -exec sed -i '' 's/from ['"'"'"]\.\.\/supabase-browser['"'"'"]/from "..\/supabase"/g' {} +
find . -type f \( -name "*.ts" -o -name "*.tsx" \) -not -path "./node_modules/*" -not -path "./.next/*" -exec sed -i '' 's/from ['"'"'"]\.\/supabase-browser['"'"'"]/from ".\/supabase"/g' {} +

# Step 3: List all files that will be affected
echo "Files that will be updated:"
grep -r "supabase-browser" . --include="*.ts" --include="*.tsx" --exclude-dir=node_modules --exclude-dir=.next 2>/dev/null || echo "No more references to supabase-browser found"

echo ""
echo "Cleanup plan complete. Review the changes and run the consolidation script when ready."