#!/bin/bash

# Script to verify migration sync is correct
set -e

echo "=== Verifying Migration Sync ==="

# Expected migrations from remote (in order)
EXPECTED_MIGRATIONS=(
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
"20250607015000"
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

echo "Checking for all ${#EXPECTED_MIGRATIONS[@]} expected migrations..."

MISSING_COUNT=0
EXTRA_COUNT=0

# Check for missing migrations
for migration in "${EXPECTED_MIGRATIONS[@]}"; do
    if ! ls supabase/migrations/${migration}_*.sql >/dev/null 2>&1; then
        echo "❌ MISSING: ${migration}"
        ((MISSING_COUNT++))
    fi
done

# Check for extra migrations
for file in supabase/migrations/*.sql; do
    if [ -f "$file" ]; then
        version=$(basename "$file" | cut -d'_' -f1)
        if [[ ! " ${EXPECTED_MIGRATIONS[@]} " =~ " ${version} " ]]; then
            echo "⚠️  EXTRA: $(basename "$file")"
            ((EXTRA_COUNT++))
        fi
    fi
done

# Check supabase_functions schema fix
echo -e "\nChecking supabase_functions schema fix..."
if grep -q "CREATE SCHEMA IF NOT EXISTS supabase_functions" "supabase/migrations/20250605073722_remote_schema.sql"; then
    echo "✓ Schema creation found in remote_schema.sql"
else
    echo "❌ Schema creation NOT found in remote_schema.sql"
fi

# Summary
echo -e "\n=== Verification Summary ==="
echo "Expected migrations: ${#EXPECTED_MIGRATIONS[@]}"
echo "Missing migrations: $MISSING_COUNT"
echo "Extra migrations: $EXTRA_COUNT"

if [ $MISSING_COUNT -eq 0 ] && [ $EXTRA_COUNT -eq 0 ]; then
    echo -e "\n✅ SUCCESS: All migrations match remote exactly!"
else
    echo -e "\n❌ FAILED: Migrations do not match remote"
    exit 1
fi