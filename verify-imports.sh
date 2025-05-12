#!/bin/bash

# Script to verify all imports are using correct paths
cd /Users/darrenallatt/Development/LodgeTix-UGLNSW-v2

echo "=== Verifying import paths ==="

# Check for any remaining references to store/registrationStore
echo "Checking for remaining references to store/registrationStore..."
result=$(grep -r "store/registrationStore" --include="*.tsx" --include="*.ts" ./components)
if [ -n "$result" ]; then
  echo "Found references to old path:"
  echo "$result"
  echo "These need to be fixed."
else
  echo "✅ No references to old store/registrationStore path found!"
fi

# Check for missing type imports
echo "Checking for missing UnifiedAttendeeData type imports..."
refs=$(grep -r "UnifiedAttendeeData" --include="*.tsx" --include="*.ts" ./components)
imports=$(grep -r "import.*UnifiedAttendeeData" --include="*.tsx" --include="*.ts" ./components)

echo "References to UnifiedAttendeeData: $(echo "$refs" | wc -l | xargs)"
echo "Imports of UnifiedAttendeeData: $(echo "$imports" | wc -l | xargs)"

# Check for proper useRegistrationStore imports
echo "Checking for proper useRegistrationStore imports..."
proper_imports=$(grep -r "import { useRegistrationStore } from \"@/lib/registration-store\"" --include="*.tsx" --include="*.ts" ./components)
echo "Files with proper useRegistrationStore imports: $(echo "$proper_imports" | wc -l | xargs)"

echo "=== Import verification complete ==="