#!/bin/bash

# Fix naming issues based on user's expected structure

cd /Users/darrenallatt/Development/LodgeTix-UGLNSW-v2/.development/nextjs-refactor

# First backup the files
echo "Creating backup..."
mkdir -p backup-before-final-fix
cp *.md backup-before-final-fix/

# Rename files to match user's expected naming
echo "Renaming files to match expected structure..."

# Fix multiple 00 prefixed files - spread them out properly
mv 00-guide-summary.md 00-architecture-overview.md
mv 00-immutable-laws-summary.md 22-immutable-laws-summary.md  
mv 00-sop-index.md 23-sop-index.md

# Create 01-immutable-ui-design-laws.md (empty for now)
touch 01-immutable-ui-design-laws.md

# Rename existing pattern files to match user's list
mv 05-component-patterns.md 07-component-patterns.md
mv 06-routing-patterns.md 06-nextjs-app-patterns.md
mv 07-data-fetching-patterns.md 09-api-patterns.md
mv 08-state-management-patterns.md 12-state-patterns.md
mv 09-performance-patterns.md 16-performance-patterns.md
mv 10-testing-patterns.md 19-testing-patterns.md

# Create missing pattern files from user's expected list
touch 05-package-json-patterns.md
touch 08-form-patterns.md  
touch 10-hook-patterns.md
touch 11-context-patterns.md
touch 13-theme-patterns.md
touch 14-internationalization-patterns.md
touch 15-accessibility-patterns.md
touch 17-error-handling-patterns.md
touch 18-logging-patterns.md
touch 20-deployment-patterns.md
touch 21-security-patterns.md

# Create application guide files
touch application-guide-events.md
touch application-guide-registration.md  
touch application-guide-tickets.md

# Rename guide files to match user's expected numbering
mv 11-style-guide.md 24-style-guide.md
mv 12-application-of-laws.md 25-application-of-laws.md
mv 13-practical-guide-following-laws.md 26-practical-guide-following-laws.md
mv 14-code-review-guide.md 27-code-review-guide.md
mv 15-quick-reference-card.md 28-quick-reference-card.md
mv 16-printable-cheat-sheet.md 29-printable-cheat-sheet.md

# Rename SOPs to higher numbers to keep them at the end
mv SOP-000-Template.md 30-SOP-000-Template.md
mv SOP-001-How-To-Write-Laws.md 31-SOP-001-How-To-Write-Laws.md
mv SOP-002-Law-Integration-Process.md 32-SOP-002-Law-Integration-Process.md
mv SOP-003-New-Technology-Adoption.md 33-SOP-003-New-Technology-Adoption.md
mv SOP-004-Documentation-Research.md 34-SOP-004-Documentation-Research.md

# Finally, rename back the files that need 00 prefix
mv 00-architecture-overview.md 00-guide-summary.md
mv 22-immutable-laws-summary.md 00-immutable-laws-summary.md
mv 23-sop-index.md 00-sop-index.md

echo "Final file structure:"
ls -la *.md | sort -k9