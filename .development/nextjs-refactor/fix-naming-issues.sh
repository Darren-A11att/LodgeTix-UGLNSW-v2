#!/bin/bash

# First, let's reorganize files with proper numbering

# Rename the summary/index files to have proper sequence
mv 00-guide-summary.md 00-architecture-overview.md
mv 00-immutable-laws-summary.md 00-implementation-guide.md
mv 00-sop-index.md 23-sop-index.md

# Fix specific pattern file names to match user's list
mv 05-component-patterns.md 07-component-patterns.md
mv 06-routing-patterns.md 06-nextjs-app-patterns.md
mv 07-data-fetching-patterns.md 09-api-patterns.md
mv 08-state-management-patterns.md 12-state-patterns.md
mv 09-performance-patterns.md 16-performance-patterns.md
mv 10-testing-patterns.md 19-testing-patterns.md

# Create missing pattern files from user's list
touch 01-immutable-ui-design-laws.md
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

echo "Naming issues fixed!"