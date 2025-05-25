#!/bin/bash

# Script to find all PascalCase table references in the codebase
# Run this to identify all files that need updating

echo "=== Finding PascalCase Table References ==="
echo

echo "1. Finding 'Registrations' table references:"
echo "----------------------------------------"
grep -r "from(['\"]Registrations['\"]" \
  --include="*.ts" \
  --include="*.tsx" \
  --include="*.js" \
  --exclude-dir=node_modules \
  --exclude-dir=.next \
  --exclude-dir=scripts \
  . 2>/dev/null | grep -v "development/database-migration"

echo
echo "2. Finding 'Registrations' in .from() calls with spaces:"
echo "-------------------------------------------------------"
grep -r "\.from\s*(\s*['\"]Registrations['\"]" \
  --include="*.ts" \
  --include="*.tsx" \
  --include="*.js" \
  --exclude-dir=node_modules \
  --exclude-dir=.next \
  --exclude-dir=scripts \
  . 2>/dev/null | grep -v "development/database-migration"

echo
echo "3. Finding 'Registrations' type references:"
echo "-----------------------------------------"
grep -r "Tables<['\"]Registrations['\"]>" \
  --include="*.ts" \
  --include="*.tsx" \
  --exclude-dir=node_modules \
  --exclude-dir=.next \
  --exclude-dir=scripts \
  . 2>/dev/null | grep -v "development/database-migration"

echo
echo "4. Finding 'Tickets' table references:"
echo "------------------------------------"
grep -r "from(['\"]Tickets['\"]" \
  --include="*.ts" \
  --include="*.tsx" \
  --include="*.js" \
  --exclude-dir=node_modules \
  --exclude-dir=.next \
  --exclude-dir=scripts \
  . 2>/dev/null | grep -v "development/database-migration"

echo
echo "5. Finding DB_TABLE_NAMES references:"
echo "-----------------------------------"
grep -r "DB_TABLE_NAMES\[.*Registrations.*\]" \
  --include="*.ts" \
  --include="*.tsx" \
  --exclude-dir=node_modules \
  --exclude-dir=.next \
  . 2>/dev/null

echo
echo "6. Finding direct string references:"
echo "----------------------------------"
grep -r "['\"]Registrations['\"]" \
  --include="*.ts" \
  --include="*.tsx" \
  --exclude="supabase/types.ts" \
  --exclude-dir=node_modules \
  --exclude-dir=.next \
  --exclude-dir=scripts \
  . 2>/dev/null | grep -v "development/database-migration" | grep -v "// "

echo
echo "=== Summary ==="
echo "Files that likely need updating:"
find . -name "*.ts" -o -name "*.tsx" | \
  xargs grep -l "Registrations\|Tickets" 2>/dev/null | \
  grep -v node_modules | \
  grep -v .next | \
  grep -v scripts | \
  grep -v types.ts | \
  sort | uniq