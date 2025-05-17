#!/bin/bash

cd /Users/darrenallatt/Development/LodgeTix-UGLNSW-v2/.development/nextjs-refactor

# Create backup
mkdir -p backup-clean-fix
cp *.md backup-clean-fix/

# Remove all previous attempts and start fresh
echo "Cleaning up naming issues comprehensively..."

# Define the correct sequence and naming
declare -A new_names
new_names["00-guide-summary.md"]="00-guide-summary.md"
new_names["01-immutable-architecture-laws.md"]="01-immutable-architecture-laws.md"
new_names["01-immutable-ui-design-laws.md"]="02-immutable-ui-design-laws.md"
new_names["02-type-safety-patterns.md"]="03-type-safety-patterns.md"
new_names["03-type-safety-patterns.md"]="03-type-safety-patterns.md"
new_names["03-directory-structure-patterns.md"]="04-directory-structure-patterns.md"
new_names["04-file-extension-patterns.md"]="05-file-extension-patterns.md"
new_names["05-package-json-patterns.md"]="06-package-json-patterns.md"
new_names["06-nextjs-app-patterns.md"]="07-nextjs-app-patterns.md"
new_names["07-component-patterns.md"]="08-component-patterns.md"
new_names["08-form-patterns.md"]="09-form-patterns.md"
new_names["09-api-patterns.md"]="10-api-patterns.md"
new_names["10-hook-patterns.md"]="11-hook-patterns.md"
new_names["11-hook-patterns.md"]="11-hook-patterns.md"
new_names["11-context-patterns.md"]="12-context-patterns.md"
new_names["12-context-patterns.md"]="12-context-patterns.md"
new_names["12-state-patterns.md"]="13-state-patterns.md"
new_names["13-theme-patterns.md"]="14-theme-patterns.md"
new_names["14-theme-patterns.md"]="14-theme-patterns.md"
new_names["14-internationalization-patterns.md"]="15-internationalization-patterns.md"
new_names["15-context-patterns.md"]="12-context-patterns.md"
new_names["15-accessibility-patterns.md"]="16-accessibility-patterns.md"
new_names["16-performance-patterns.md"]="17-performance-patterns.md"
new_names["17-error-handling-patterns.md"]="18-error-handling-patterns.md"
new_names["18-logging-patterns.md"]="19-logging-patterns.md"
new_names["19-testing-patterns.md"]="20-testing-patterns.md"
new_names["20-deployment-patterns.md"]="21-deployment-patterns.md"
new_names["21-security-patterns.md"]="22-security-patterns.md"
new_names["22-immutable-laws-summary.md"]="23-immutable-laws-summary.md"
new_names["23-sop-index.md"]="24-sop-index.md"
new_names["24-style-guide.md"]="25-style-guide.md"
new_names["25-application-of-laws.md"]="26-application-of-laws.md"
new_names["26-practical-guide-following-laws.md"]="27-practical-guide-following-laws.md"
new_names["27-code-review-guide.md"]="28-code-review-guide.md"
new_names["28-quick-reference-card.md"]="29-quick-reference-card.md"
new_names["29-printable-cheat-sheet.md"]="30-printable-cheat-sheet.md"
new_names["30-SOP-000-Template.md"]="31-SOP-000-Template.md"
new_names["31-SOP-001-How-To-Write-Laws.md"]="32-SOP-001-How-To-Write-Laws.md"
new_names["32-SOP-002-Law-Integration-Process.md"]="33-SOP-002-Law-Integration-Process.md"
new_names["33-SOP-003-New-Technology-Adoption.md"]="34-SOP-003-New-Technology-Adoption.md"
new_names["34-SOP-004-Documentation-Research.md"]="35-SOP-004-Documentation-Research.md"
new_names["35-accessibility-patterns.md"]="16-accessibility-patterns.md"

# Now rename all files properly
for old_name in "${!new_names[@]}"; do
    new_name="${new_names[$old_name]}"
    if [ -f "$old_name" ] && [ "$old_name" != "$new_name" ]; then
        echo "Renaming $old_name to $new_name"
        # Use temp names to avoid conflicts
        mv "$old_name" "temp-$new_name"
    fi
done

# Move temp files to final names
for file in temp-*.md; do
    if [ -f "$file" ]; then
        final_name="${file#temp-}"
        mv "$file" "$final_name"
    fi
done

# Add application guide sequence numbers
mv application-guide-events.md 36-application-guide-events.md
mv application-guide-registration.md 37-application-guide-registration.md
mv application-guide-tickets.md 38-application-guide-tickets.md

echo "Final cleaned file structure:"
ls -la *.md | grep -E '^-' | awk '{print $9}' | sort -V