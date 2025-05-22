#!/usr/bin/env node

/**
 * Supabase Database Naming Convention Migration Script
 * 
 * This script automatically updates all codebase references to match the new
 * snake_case database naming conventions from the migration JSON.
 */

const fs = require('fs');
const path = require('path');

// Load the migration data
const migrationData = JSON.parse(
  fs.readFileSync('.development/supabase-integration/name-migration.json', 'utf8')
);

// Build transformation maps
const tableMappings = new Map();
const columnMappings = new Map();
const enumMappings = new Map();

migrationData.forEach(change => {
  switch (change.change_type) {
    case 'TABLE':
      tableMappings.set(change.old_name, change.new_name);
      break;
    case 'COLUMN':
      const key = `${change.context}.${change.old_name}`;
      columnMappings.set(key, change.new_name);
      // Also create global column mapping for common fields
      columnMappings.set(change.old_name, change.new_name);
      break;
    case 'ENUM_VALUE':
      enumMappings.set(change.old_name, change.new_name);
      break;
  }
});

// Files to process
const filesToProcess = [
  // Core Supabase files
  'lib/supabase.ts',
  'lib/supabase-browser.ts',
  'lib/supabase-singleton.ts',
  
  // API routes
  'app/api/registrations/route.ts',
  'app/api/registrations/[id]/route.ts',
  'app/api/registrations/[id]/payment/route.ts',
  'app/api/registrations/[id]/verify-payment/route.ts',
  'app/api/check-tables/route.ts',
  'app/api/stripe/create-payment-intent/route.ts',
  
  // Service files
  'lib/services/events-schema-service.ts',
  'lib/event-facade.ts',
  'lib/event-utils.ts',
  'lib/reservationService.ts',
  'lib/reservationService.realtime.ts',
  'lib/packageService.ts',
  'lib/services/masonic-services.ts',
  'lib/services/homepage-service.ts',
  'lib/services/content-service.ts',
  'lib/attendeeAccessService.ts',
  'lib/vasService.ts',
  'lib/locationStore.ts',
  'lib/formSaveManager.ts',
  
  // API services
  'lib/api/lodges.ts',
  'lib/api/grandLodges.ts',
  'lib/api/admin/adminApiService.ts',
  'lib/api/admin/customerAdminService.ts',
  'lib/api/admin/eventAdminService.ts',
  'lib/api/admin/packageAdminService.ts',
  'lib/api/admin/registrationAdminService.ts',
  'lib/api/admin/ticketAdminService.ts',
  
  // Type definitions
  'shared/types/register_updated.ts',
  'shared/types/supabase.ts',
  
  // Scripts
  'scripts/verify-events-migration.ts',
  'scripts/migrate-events-to-supabase.ts',
  'scripts/migrate-events-to-uuid.js',
];

function transformContent(content, filePath) {
  let transformed = content;
  
  // 1. Transform table names in .from() calls
  tableMappings.forEach((newName, oldName) => {
    // Match .from("TableName") or .from('TableName')
    const fromRegex = new RegExp(`\\.from\\s*\\(\\s*["'\`]${oldName}["'\`]\\s*\\)`, 'g');
    transformed = transformed.replace(fromRegex, `.from("${newName}")`);
    
    // Match table("TableName") or table('TableName')
    const tableRegex = new RegExp(`\\btable\\s*\\(\\s*["'\`]${oldName}["'\`]\\s*\\)`, 'g');
    transformed = transformed.replace(tableRegex, `table("${newName}")`);
    
    // Match DB_TABLE_NAMES entries
    const dbTableRegex = new RegExp(`${oldName}:\\s*["'\`]${oldName}["'\`]`, 'g');
    transformed = transformed.replace(dbTableRegex, `${oldName}: "${newName}"`);
  });
  
  // 2. Transform column names in select, insert, update operations
  columnMappings.forEach((newName, oldName) => {
    // Skip context-specific mappings for now, focus on common ones
    if (!oldName.includes('.')) {
      // Match column references in various contexts
      const patterns = [
        // .select("columnName")
        new RegExp(`\\.select\\s*\\(\\s*["'\`]([^"']*,\\s*)*${oldName}(\\s*,[^"']*)*["'\`]\\s*\\)`, 'g'),
        // { columnName: value }
        new RegExp(`\\b${oldName}\\s*:`, 'g'),
        // data.columnName or row.columnName
        new RegExp(`\\.(${oldName})\\b`, 'g'),
        // "columnName" in quotes
        new RegExp(`["'\`]${oldName}["'\`]`, 'g'),
      ];
      
      patterns.forEach(pattern => {
        if (pattern.source.includes('\\.(')) {
          // Handle dot notation carefully
          transformed = transformed.replace(pattern, `.${newName}`);
        } else if (pattern.source.includes(':')) {
          // Handle object property names
          transformed = transformed.replace(pattern, `${newName}:`);
        } else {
          // Handle quoted strings
          transformed = transformed.replace(pattern, `"${newName}"`);
        }
      });
    }
  });
  
  // 3. Transform enum values
  enumMappings.forEach((newValue, oldValue) => {
    // Match enum values in quotes
    const enumRegex = new RegExp(`["'\`]${oldValue}["'\`]`, 'g');
    transformed = transformed.replace(enumRegex, `"${newValue}"`);
  });
  
  return transformed;
}

function processFile(filePath) {
  const fullPath = path.join(process.cwd(), filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return false;
  }
  
  try {
    const content = fs.readFileSync(fullPath, 'utf8');
    const transformed = transformContent(content, filePath);
    
    if (content !== transformed) {
      fs.writeFileSync(fullPath, transformed);
      console.log(`✅ Updated: ${filePath}`);
      return true;
    } else {
      console.log(`ℹ️  No changes needed: ${filePath}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

function main() {
  console.log('🚀 Starting Supabase naming convention migration...\n');
  
  let processed = 0;
  let updated = 0;
  
  filesToProcess.forEach(filePath => {
    processed++;
    if (processFile(filePath)) {
      updated++;
    }
  });
  
  console.log(`\n📊 Migration Summary:`);
  console.log(`   Files processed: ${processed}`);
  console.log(`   Files updated: ${updated}`);
  console.log(`   Files unchanged: ${processed - updated}`);
  
  if (updated > 0) {
    console.log('\n⚠️  IMPORTANT: Please review all changes and run tests before committing!');
  }
}

// Export for testing
module.exports = {
  transformContent,
  tableMappings,
  columnMappings,
  enumMappings
};

// Run if called directly
if (require.main === module) {
  main();
}