// Supabase Files Consolidation Script
// Run this after reviewing the cleanup plan

import fs from 'fs';
import path from 'path';

const LIB_DIR = path.join(process.cwd(), 'lib');

// Step 1: Read the current supabase.ts to get any unique exports
const supabaseContent = fs.readFileSync(path.join(LIB_DIR, 'supabase.ts'), 'utf-8');

// Step 2: Create the new consolidated supabase.ts that re-exports from singleton
const newSupabaseContent = `/**
 * Main Supabase client export file
 * Re-exports everything from supabase-singleton for backward compatibility
 */

// Re-export everything from the singleton implementation
export {
  supabase,
  getBrowserClient,
  getServerClient,
  getSupabaseClient,
  supabaseTables,
  supabaseSchemas,
  table,
  getSupabase,
  getSupabaseAdmin
} from './supabase-singleton';

// Type exports
export type { Database } from '@/shared/types/database';
`;

// Step 3: Write the new content
fs.writeFileSync(path.join(LIB_DIR, 'supabase.ts'), newSupabaseContent);

// Step 4: Remove supabase-browser.ts as it's now redundant
const browserPath = path.join(LIB_DIR, 'supabase-browser.ts');
if (fs.existsSync(browserPath)) {
  console.log('Removing supabase-browser.ts...');
  fs.unlinkSync(browserPath);
}

// Step 5: Check if supabase-adapter.ts is used
const adapterPath = path.join(LIB_DIR, 'supabase-adapter.ts');
if (fs.existsSync(adapterPath)) {
  console.log('Note: supabase-adapter.ts still exists. Check if it\'s still needed for the naming migration.');
}

console.log('Consolidation complete!');
console.log('- supabase.ts now re-exports from supabase-singleton.ts');
console.log('- supabase-browser.ts has been removed');
console.log('- All imports have been updated');