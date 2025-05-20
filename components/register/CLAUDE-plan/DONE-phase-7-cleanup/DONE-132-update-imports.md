# Task 132: Update Imports Throughout App

## Objective
Update all imports throughout the application to use the new form components and ensure no references to old components remain.

## Dependencies
- Task 131 (old forms removed)
- New components fully implemented

## Steps

1. Create comprehensive import mapping:
```typescript
// scripts/update-all-imports.ts
const importMappings = {
  // Form components
  '@/components/register/oldforms/mason/MasonForm': '@/components/register/forms/mason/layouts/MasonForm',
  '@/components/register/oldforms/guest/GuestForm': '@/components/register/forms/guest/layouts/GuestForm',
  '@/components/register/forms/mason/MasonForm2': '@/components/register/forms/mason/layouts/MasonForm',
  '@/components/register/forms/guest/GuestForm2': '@/components/register/forms/guest/layouts/GuestForm',
  
  // Basic sections
  '@/components/register/oldforms/mason/MasonBasicInfo': '@/components/register/forms/basic-details/BasicInfo',
  '@/components/register/oldforms/guest/GuestBasicInfo': '@/components/register/forms/basic-details/BasicInfo',
  
  // Contact sections
  '@/components/register/oldforms/mason/MasonContactInfo': '@/components/register/forms/basic-details/ContactInfo',
  '@/components/register/oldforms/guest/GuestContactInfo': '@/components/register/forms/basic-details/ContactInfo',
  
  // Additional info sections
  '@/components/register/oldforms/mason/MasonAdditionalInfo': '@/components/register/forms/basic-details/AdditionalInfo',
  '@/components/register/oldforms/guest/GuestAdditionalInfo': '@/components/register/forms/basic-details/AdditionalInfo',
  
  // Lodge sections
  '@/components/register/oldforms/mason/MasonLodgeInfo': '@/components/register/forms/mason/lib/LodgeSelection',
  '@/components/register/oldforms/mason/MasonGrandLodgeFields': '@/components/register/forms/mason/utils/GrandOfficerFields',
  
  // Shared components
  '@/components/register/functions/AutocompleteInput': '@/components/register/forms/shared/AutocompleteInput',
  '@/components/register/functions/AddRemoveControl': '@/components/register/forms/shared/AddRemoveControl',
  '@/components/register/functions/TermsAndConditions': '@/components/register/forms/shared/TermsAndConditions',
  
  // Partner components
  '@/components/register/forms/guest/PartnerToggle': '@/components/register/forms/shared/PartnerToggle',
  '@/components/register/forms/mason/LadyPartnerToggle': '@/components/register/forms/shared/PartnerToggle',
  '@/components/register/forms/guest/GuestPartnerToggle': '@/components/register/forms/shared/PartnerToggle',
  
  // With partner containers
  '@/components/register/forms/mason/MasonWithPartner': '@/components/register/forms/attendee/AttendeeWithPartner',
  '@/components/register/forms/guest/GuestWithPartner': '@/components/register/forms/attendee/AttendeeWithPartner',
};
```

2. Find all files that need updating:
```bash
# Search for old imports
grep -r "oldforms" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" .
grep -r "register/functions" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" .
grep -r "MasonForm2" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" .
grep -r "GuestForm2" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" .
```

3. Update specific file patterns:
```typescript
// Update registration wizard files
const wizardFiles = [
  'components/register/registration-wizard/registration-wizard.tsx',
  'components/register/registration-wizard/steps/AttendeeDetails.tsx',
  'components/register/steps/registration-type-step.tsx',
];

// Update event pages
const eventFiles = [
  'app/events/[id]/page.tsx',
  'app/events/[id]/tickets/page.tsx',
  'app/events/grand-installation/register/page.tsx',
];

// Update test files
const testFiles = [
  'tests/**/*.test.ts',
  'tests/**/*.test.tsx',
];
```

4. Create automated update script:
```typescript
// scripts/update-imports.ts
import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';

function updateFile(filePath: string) {
  let content = readFileSync(filePath, 'utf8');
  let hasChanges = false;

  // Update imports
  Object.entries(importMappings).forEach(([oldImport, newImport]) => {
    const importRegex = new RegExp(
      `(import\\s+(?:{[^}]*}|\\*\\s+as\\s+\\w+|\\w+)\\s+from\\s+['"])${oldImport}(['"])`,
      'g'
    );
    
    if (importRegex.test(content)) {
      content = content.replace(importRegex, `$1${newImport}$2`);
      hasChanges = true;
    }
  });

  // Update require statements
  Object.entries(importMappings).forEach(([oldImport, newImport]) => {
    const requireRegex = new RegExp(
      `(require\\(['"])${oldImport}(['"]\\))`,
      'g'
    );
    
    if (requireRegex.test(content)) {
      content = content.replace(requireRegex, `$1${newImport}$2`);
      hasChanges = true;
    }
  });

  if (hasChanges) {
    writeFileSync(filePath, content);
    console.log(`Updated: ${filePath}`);
  }
}

// Find and update all files
const patterns = [
  '**/*.{ts,tsx,js,jsx}',
  '!node_modules/**',
  '!oldforms-backup/**',
  '!.next/**',
  '!build/**',
];

const files = glob.sync(patterns.join(','));
files.forEach(updateFile);
```

5. Verify no old imports remain:
```bash
# Check for any remaining old imports
echo "Checking for old imports..."
grep -r "oldforms" --include="*.ts" --include="*.tsx" . || echo "No oldforms imports found"
grep -r "register/functions" --include="*.ts" --include="*.tsx" . || echo "No functions imports found"
grep -r "Form2" --include="*.ts" --include="*.tsx" . || echo "No Form2 imports found"
```

6. Update TypeScript path mappings if needed:
```json
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@/register/forms/*": ["./components/register/forms/*"],
      "@/register/shared/*": ["./components/register/forms/shared/*"],
      // Remove old paths
      // "@/register/oldforms/*": ["./components/register/oldforms/*"],
    }
  }
}
```

## Deliverables
- Import update script
- Comprehensive import mappings
- Verification scripts
- Updated TypeScript config
- Clean import statements

## Success Criteria
- No old imports remain
- All files use new import paths
- TypeScript compilation succeeds
- No runtime errors
- Tests pass