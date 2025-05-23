#!/usr/bin/env node
import * as fs from 'fs';
import * as path from 'path';
import { globSync } from 'glob';

const importMappings: Record<string, string> = {
  // Old forms to new forms
  '@/components/register/oldforms/mason/MasonForm': '@/components/register/Forms/mason/Layouts/MasonForm',
  '@/components/register/oldforms/guest/GuestForm': '@/components/register/Forms/guest/Layouts/GuestForm',
  '../oldforms/mason/editMasonForm': '../Forms/mason/Layouts/MasonForm',
  '../oldforms/guest/unified-guest-form': '../Forms/guest/Layouts/GuestForm',
  '../oldforms/mason/LadyPartnerForm': '../Forms/guest/Layouts/GuestForm',
  '../oldforms/guest/GuestPartnerForm': '../Forms/guest/Layouts/GuestForm',
  '../../../oldforms/Functions/TermsAndConditions': '../../Forms/shared/TermsAndConditions',
  
  // Functions directory mappings
  '@/components/register/oldforms/Functions/AutocompleteInput': '@/components/register/Forms/shared/AutocompleteInput',
  '@/components/register/oldforms/Functions/AddRemoveControl': '@/components/register/Forms/shared/AddRemoveControl',
  '@/components/register/oldforms/Functions/TermsAndConditions': '@/components/register/Forms/shared/TermsAndConditions',
  
  // Basic sections
  '@/components/register/oldforms/mason/MasonBasicInfo': '@/components/register/Forms/basic-details/BasicInfo',
  '@/components/register/oldforms/guest/GuestBasicInfo': '@/components/register/Forms/basic-details/BasicInfo',
  
  // Contact sections
  '@/components/register/oldforms/mason/MasonContactInfo': '@/components/register/Forms/basic-details/ContactInfo',
  '@/components/register/oldforms/guest/GuestContactInfo': '@/components/register/Forms/basic-details/ContactInfo',
  
  // Additional info sections
  '@/components/register/oldforms/mason/MasonAdditionalInfo': '@/components/register/Forms/basic-details/AdditionalInfo',
  '@/components/register/oldforms/guest/GuestAdditionalInfo': '@/components/register/Forms/basic-details/AdditionalInfo',
  
  // Lodge sections
  '@/components/register/oldforms/mason/MasonLodgeInfo': '@/components/register/Forms/mason/lib/LodgeSelection',
  '@/components/register/oldforms/mason/MasonGrandLodgeFields': '@/components/register/Forms/mason/utils/GrandOfficerFields',
  
  // Partner components
  '@/components/register/oldforms/guest/PartnerToggle': '@/components/register/Forms/shared/PartnerToggle',
  '@/components/register/oldforms/mason/LadyPartnerToggle': '@/components/register/Forms/shared/PartnerToggle',
  
  // With partner containers
  '@/components/register/oldforms/mason/MasonWithPartner': '@/components/register/Forms/attendee/AttendeeWithPartner',
  '@/components/register/oldforms/guest/GuestWithPartner': '@/components/register/Forms/attendee/AttendeeWithPartner',
};

function updateFile(filePath: string): void {
  let content = fs.readFileSync(filePath, 'utf8');
  let hasChanges = false;

  // Update imports
  Object.entries(importMappings).forEach(([oldImport, newImport]) => {
    const importRegex = new RegExp(
      `(import\\s+(?:{[^}]*}|\\*\\s+as\\s+\\w+|\\w+)\\s+from\\s+['"])${escapeRegex(oldImport)}(['"])`,
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
      `(require\\(['"])${escapeRegex(oldImport)}(['"]\\))`,
      'g'
    );
    
    if (requireRegex.test(content)) {
      content = content.replace(requireRegex, `$1${newImport}$2`);
      hasChanges = true;
    }
  });

  if (hasChanges) {
    fs.writeFileSync(filePath, content);
    console.log(`Updated: ${filePath}`);
  }
}

function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Find and update all files
const patterns = [
  '**/*.{ts,tsx,js,jsx}',
  '!node_modules/**',
  '!oldforms-backup/**',
  '!.next/**',
  '!build/**',
  '!dist/**',
];

console.log('Starting import migration...');

const files = globSync('**/*.{ts,tsx,js,jsx}', {
  ignore: ['node_modules/**', 'oldforms-backup/**', '.next/**', 'build/**', 'dist/**'],
  cwd: '/Users/darrenallatt/Development/LodgeTix-UGLNSW-v2'
});

console.log(`Found ${files.length} files to check`);

files.forEach((file: string) => {
  const fullPath = path.join('/Users/darrenallatt/Development/LodgeTix-UGLNSW-v2', file);
  updateFile(fullPath);
});

console.log('Import migration complete!');