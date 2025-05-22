#!/usr/bin/env node

/**
 * Final Database Cleanup Script
 * 
 * This script performs a final pass to catch any remaining database references
 * that might have been missed by the previous migration scripts.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Common database fixes
const FINAL_FIXES = {
  // Fix service files that might still reference old table names
  'lib/services/events-schema-service.ts': [
    { old: '.from("Events")', new: '.from("events")' },
    { old: ".from('Events')", new: ".from('events')" },
    { old: '"Events"', new: '"events"' },
    { old: "'Events'", new: "'events'" },
  ],
  
  'lib/event-facade.ts': [
    { old: '.from("Events")', new: '.from("events")' },
    { old: ".from('Events')", new: ".from('events')" },
    { old: 'table("Events")', new: 'table("events")' },
  ],
  
  'lib/services/masonic-services.ts': [
    { old: '.from("MasonicProfiles")', new: '.from("masonicprofiles")' },
    { old: ".from('MasonicProfiles')", new: ".from('masonicprofiles')" },
    { old: 'table("MasonicProfiles")', new: 'table("masonicprofiles")' },
  ],
  
  'lib/services/homepage-service.ts': [
    { old: '.from("Events")', new: '.from("events")' },
    { old: ".from('Events')", new: ".from('events')" },
  ],
  
  'lib/services/content-service.ts': [
    { old: '.from("content")', new: '.from("content")' }, // This might already be lowercase
  ],
};

function applyFixes(filePath, fixes) {
  const fullPath = path.join(process.cwd(), filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return false;
  }
  
  let content = fs.readFileSync(fullPath, 'utf8');
  let changed = false;
  
  fixes.forEach(fix => {
    const newContent = content.replace(new RegExp(fix.old.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), fix.new);
    if (newContent !== content) {
      content = newContent;
      changed = true;
      console.log(`   Fixed: ${fix.old} -> ${fix.new}`);
    }
  });
  
  if (changed) {
    fs.writeFileSync(fullPath, content);
    return true;
  }
  return false;
}

// Also create a grep search for any remaining references
function findRemainingRefs() {
  console.log('\n🔍 Searching for remaining database references...');
  
  const searchTerms = [
    'Events"',
    'Registrations"',
    'Customers"', 
    'Tickets"',
    'Attendees"',
    'MasonicProfiles"',
  ];
  
  searchTerms.forEach(term => {
    try {
      const result = execSync(`grep -r "${term}" lib/ app/api/ shared/types/ components/register/ --include="*.ts" --include="*.tsx" || true`, { encoding: 'utf8' });
      if (result.trim()) {
        console.log(`\n📍 Found "${term}" in:`);
        console.log(result);
      }
    } catch (error) {
      // Ignore grep errors
    }
  });
}

function main() {
  console.log('🧹 Starting final database cleanup...\n');
  
  let fixed = 0;
  Object.entries(FINAL_FIXES).forEach(([filePath, fixes]) => {
    console.log(`Processing: ${filePath}`);
    if (applyFixes(filePath, fixes)) {
      console.log(`✅ Fixed: ${filePath}`);
      fixed++;
    } else {
      console.log(`ℹ️  No changes needed: ${filePath}`);
    }
  });
  
  console.log(`\n📊 Fixed ${fixed} files`);
  
  findRemainingRefs();
  
  console.log('\n✅ Final cleanup complete!');
  console.log('\n📋 Recommended next steps:');
  console.log('1. Check if your Supabase database tables have been renamed');
  console.log('2. Verify database connectivity');
  console.log('3. Run: npm run dev');
  console.log('4. Test registration flow');
}

main();