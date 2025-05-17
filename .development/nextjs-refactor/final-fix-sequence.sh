#!/bin/bash

cd /Users/darrenallatt/Development/LodgeTix-UGLNSW-v2/.development/nextjs-refactor

echo "Final sequence number fix..."

# Fix duplicate 05 files
mv 05-package-json-patterns.md 06-package-json-patterns.md
# Shift all files after 05 up by 1
mv 06-nextjs-app-patterns.md 07-nextjs-app-patterns.md
mv 07-component-patterns.md 08-component-patterns.md
mv 08-form-patterns.md 09-form-patterns.md
mv 09-api-patterns.md 10-api-patterns.md
mv 10-hook-patterns.md 11-hook-patterns.md

# Continue shifting to fill gaps
mv 12-state-patterns.md 13-state-patterns.md
mv 13-theme-patterns.md 14-theme-patterns.md
mv 14-internationalization-patterns.md 15-internationalization-patterns.md

# Now fix double 15 by moving context to 12
mv 15-context-patterns.md 12-context-patterns.md

# Continue with rest
mv 16-performance-patterns.md 16-performance-patterns.md

# Check for duplicates at 15 (in case accessibility got duplicated)
if [ -f "15-accessibility-patterns.md" ]; then
    mv 15-accessibility-patterns.md 16-accessibility-patterns.md
    mv 16-performance-patterns.md 17-performance-patterns.md
    mv 17-error-handling-patterns.md 18-error-handling-patterns.md
    mv 18-logging-patterns.md 19-logging-patterns.md
    mv 19-testing-patterns.md 20-testing-patterns.md
    mv 20-deployment-patterns.md 21-deployment-patterns.md
    mv 21-security-patterns.md 22-security-patterns.md
    mv 22-immutable-laws-summary.md 23-immutable-laws-summary.md
    mv 23-sop-index.md 24-sop-index.md
    mv 24-style-guide.md 25-style-guide.md
    mv 25-application-of-laws.md 26-application-of-laws.md
    mv 26-practical-guide-following-laws.md 27-practical-guide-following-laws.md
    mv 27-code-review-guide.md 28-code-review-guide.md
    mv 28-quick-reference-card.md 29-quick-reference-card.md
    mv 29-printable-cheat-sheet.md 30-printable-cheat-sheet.md
    mv 30-SOP-000-Template.md 31-SOP-000-Template.md
    mv 31-SOP-001-How-To-Write-Laws.md 32-SOP-001-How-To-Write-Laws.md
    mv 32-SOP-002-Law-Integration-Process.md 33-SOP-002-Law-Integration-Process.md
    mv 33-SOP-003-New-Technology-Adoption.md 34-SOP-003-New-Technology-Adoption.md
    mv 34-SOP-004-Documentation-Research.md 35-SOP-004-Documentation-Research.md
fi

echo "Final cleaned structure:"
ls -la *.md | grep -E '^-' | awk '{print $9}' | sort -V