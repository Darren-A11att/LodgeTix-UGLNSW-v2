# Task 131: Remove Old Forms

## Objective
Remove the old form components and clean up the codebase after successful migration to the new architecture.

## Dependencies
- All previous phases completed
- All imports updated to use new components

## Steps

1. Create a backup of old forms:
```bash
# Create backup directory
mkdir -p components/register/oldforms-backup

# Copy all old forms to backup
cp -r components/register/oldforms/* components/register/oldforms-backup/

# Create a dated archive
tar -czf oldforms-backup-$(date +%Y%m%d).tar.gz components/register/oldforms-backup/
```

2. Remove old form directories:
```bash
# Remove old forms directory
rm -rf components/register/oldforms

# Remove legacy functions directory
rm -rf components/register/functions

# Remove deprecated form components
rm -f components/register/forms/mason/MasonForm.tsx
rm -f components/register/forms/guest/GuestForm.tsx
rm -f components/register/forms/guest/GuestPartnerToggle.tsx
rm -f components/register/forms/mason/LadyPartnerToggle.tsx
```

3. Update imports throughout the codebase:
```typescript
// Find and replace old imports
// Old:
import { MasonForm } from '@/components/register/oldforms/mason/MasonForm';
// New:
import { MasonForm } from '@/components/register/forms/mason/layouts/MasonForm';

// Old:
import { GuestForm } from '@/components/register/oldforms/guest/GuestForm';
// New:
import { GuestForm } from '@/components/register/forms/guest/layouts/GuestForm';

// Old:
import { AutocompleteInput } from '@/components/register/functions/AutocompleteInput';
// New:
import { AutocompleteInput } from '@/components/register/forms/shared/AutocompleteInput';
```

4. Create migration script:
```typescript
// scripts/migrate-form-imports.js
const fs = require('fs');
const path = require('path');
const glob = require('glob');

const importMappings = {
  '@/components/register/oldforms/mason/MasonForm': '@/components/register/forms/mason/layouts/MasonForm',
  '@/components/register/oldforms/guest/GuestForm': '@/components/register/forms/guest/layouts/GuestForm',
  '@/components/register/functions/AutocompleteInput': '@/components/register/forms/shared/AutocompleteInput',
  // Add more mappings as needed
};

function updateImports(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let updated = false;

  Object.entries(importMappings).forEach(([oldImport, newImport]) => {
    if (content.includes(oldImport)) {
      content = content.replace(new RegExp(oldImport, 'g'), newImport);
      updated = true;
    }
  });

  if (updated) {
    fs.writeFileSync(filePath, content);
    console.log(`Updated imports in: ${filePath}`);
  }
}

// Find all TypeScript/JavaScript files
const files = glob.sync('**/*.{ts,tsx,js,jsx}', {
  ignore: ['node_modules/**', 'oldforms-backup/**']
});

files.forEach(updateImports);
console.log('Import migration complete!');
```

5. Clean up unused dependencies:
```json
// Remove from package.json if no longer used
{
  "dependencies": {
    // Remove any form-specific libraries that were only used in old forms
  }
}
```

6. Update documentation:
```markdown
# components/register/README.md

## Migration from Old Forms

The form system has been completely refactored as of [date]. The old forms have been removed and replaced with a new architecture that provides:

- Better separation of concerns
- Improved type safety
- Reusable components
- Centralized business logic

### Backup Location

The old forms have been backed up to: `oldforms-backup-YYYYMMDD.tar.gz`

### Key Changes

1. Form components moved from `oldforms/` to `forms/`
2. Shared components now in `forms/shared/`
3. Business logic centralized in `forms/attendee/lib/`
4. New container layouts for different registration types

### Import Changes

See `scripts/migrate-form-imports.js` for automated import updates.
```

## Deliverables
- Backup of old forms
- Removal of old directories
- Import migration script
- Updated documentation
- Clean git history

## Success Criteria
- No broken imports
- All tests pass
- Application works correctly
- Backup created for safety
- Documentation updated

## Compliance Analysis with CLAUDE.md

### Issues Found:

1. **Directory References**: References `components/register/oldforms` but CLAUDE.md shows the existing structure uses different paths like `forms/mason/` and `forms/guest/`.

2. **Legacy Files**: The specific files to be removed don't match the actual file structure. For example, it references removing `MasonForm.tsx` and `GuestForm.tsx` which according to CLAUDE.md are the new files, not the old ones.

3. **Import Mappings**: The import mapping examples use incorrect paths that don't align with CLAUDE.md structure.

4. **Functions Directory**: References removing a `functions` directory, but CLAUDE.md shows this should remain as it contains legitimate shared components.

### Required Corrections:

1. Update the list of files to remove based on actual old file locations
2. Fix import mappings to use correct paths from CLAUDE.md
3. Don't remove the `functions` directory - it contains valid shared components
4. Clarify which are the actual old forms vs new forms

### Good Practices:

- Creating backups before removal
- Using a migration script
- Updating documentation
- Git history preservation

### Alignment Score: 50%

The concept is correct but the specific implementation details don't match the actual file structure defined in CLAUDE.md. The task needs significant revision to accurately reflect which files should be removed.