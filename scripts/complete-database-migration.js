#!/usr/bin/env node

/**
 * Complete Database Migration Script
 * 
 * This script handles the complete migration from the JSON payload
 * and updates all database references in the codebase.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Load the migration data
const migrationData = JSON.parse(
  fs.readFileSync('.development/supabase-integration/name-migration.json', 'utf8')
);

// Build comprehensive mapping from migration JSON
const fieldMappings = new Map();
const tableMappings = new Map();
const enumMappings = new Map();

console.log('🔄 Processing migration data...');

migrationData.forEach(change => {
  switch (change.change_type) {
    case 'TABLE':
      tableMappings.set(change.old_name, change.new_name);
      console.log(`Table: ${change.old_name} -> ${change.new_name}`);
      break;
    case 'COLUMN':
      fieldMappings.set(change.old_name, change.new_name);
      console.log(`Field: ${change.old_name} -> ${change.new_name}`);
      break;
    case 'ENUM_VALUE':
      enumMappings.set(change.old_name, change.new_name);
      console.log(`Enum: ${change.old_name} -> ${change.new_name}`);
      break;
  }
});

console.log(`\n📊 Migration Summary:`);
console.log(`   Tables to rename: ${tableMappings.size}`);
console.log(`   Fields to rename: ${fieldMappings.size}`);
console.log(`   Enum values to rename: ${enumMappings.size}`);

// Create the final field mappings script
const finalMappingScript = `
// Generated field mappings for database migration
export const DATABASE_FIELD_MAPPINGS = {
${Array.from(fieldMappings.entries()).map(([old, new_]) => `  "${old}": "${new_}"`).join(',\n')}
};

export const DATABASE_TABLE_MAPPINGS = {
${Array.from(tableMappings.entries()).map(([old, new_]) => `  "${old}": "${new_}"`).join(',\n')}
};

export const DATABASE_ENUM_MAPPINGS = {
${Array.from(enumMappings.entries()).map(([old, new_]) => `  "${old}": "${new_}"`).join(',\n')}
};
`;

fs.writeFileSync('./lib/database-mappings.ts', finalMappingScript);
console.log('✅ Created database mappings file: lib/database-mappings.ts');

// Apply transformations to all relevant files
function transformFile(filePath, mappings) {
  if (!fs.existsSync(filePath)) {
    return false;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // Apply field mappings
  fieldMappings.forEach((newName, oldName) => {
    const patterns = [
      new RegExp(`"${oldName}"`, 'g'),
      new RegExp(`'${oldName}'`, 'g'),
      new RegExp(`\`${oldName}\``, 'g'),
    ];
    
    patterns.forEach(pattern => {
      const newContent = content.replace(pattern, `"${newName}"`);
      if (newContent !== content) {
        content = newContent;
        changed = true;
      }
    });
  });

  // Apply table mappings
  tableMappings.forEach((newName, oldName) => {
    const patterns = [
      new RegExp(`\\.from\\s*\\(\\s*["'\`]${oldName}["'\`]\\s*\\)`, 'g'),
      new RegExp(`table\\s*\\(\\s*["'\`]${oldName}["'\`]\\s*\\)`, 'g'),
    ];
    
    patterns.forEach(pattern => {
      const newContent = content.replace(pattern, (match) => {
        return match.replace(oldName, newName);
      });
      if (newContent !== content) {
        content = newContent;
        changed = true;
      }
    });
  });

  // Apply enum mappings
  enumMappings.forEach((newValue, oldValue) => {
    const patterns = [
      new RegExp(`"${oldValue}"`, 'g'),
      new RegExp(`'${oldValue}'`, 'g'),
    ];
    
    patterns.forEach(pattern => {
      const newContent = content.replace(pattern, `"${newValue}"`);
      if (newContent !== content) {
        content = newContent;
        changed = true;
      }
    });
  });

  if (changed) {
    fs.writeFileSync(filePath, content);
    return true;
  }
  return false;
}

// Files to process
const filesToProcess = [
  'lib/services/events-schema-service.ts',
  'lib/event-facade.ts',
  'lib/reservationService.ts',
  'lib/services/masonic-services.ts',
  'app/api/registrations/route.ts',
  'shared/types/register_updated.ts',
  'components/register/RegistrationWizard/hooks/useRegistrationType.ts',
];

console.log('\n🚀 Applying transformations...');

let processed = 0;
filesToProcess.forEach(file => {
  if (transformFile(file, { fieldMappings, tableMappings, enumMappings })) {
    console.log(`✅ Updated: ${file}`);
    processed++;
  } else {
    console.log(`ℹ️  No changes: ${file}`);
  }
});

console.log(`\n🎉 Migration complete! Updated ${processed} files.`);
console.log('\n⚠️  Next steps:');
console.log('1. Run: npm run build');
console.log('2. Test database operations');
console.log('3. Update any remaining hardcoded references');