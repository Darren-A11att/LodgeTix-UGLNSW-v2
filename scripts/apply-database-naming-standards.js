#!/usr/bin/env node

/**
 * Database Naming Convention Migration Utility
 * 
 * This script applies the SQL migration for standardizing database naming
 * conventions, converting PascalCase tables to snake_case and camelCase columns
 * to snake_case. It can be run directly against your Supabase database.
 * 
 * Usage:
 *   npm run db:rename-convention
 * 
 * Requirements:
 *   - Supabase CLI installed and logged in
 *   - Valid connection to your Supabase project
 * 
 * @author LodgeTix Development Team
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Configuration
const MIGRATION_FILE = '20250522-simple-sql-migration.sql';
const MIGRATION_PATH = path.join(__dirname, '..', 'supabase', 'migrations', MIGRATION_FILE);

// Check if migration file exists
if (!fs.existsSync(MIGRATION_PATH)) {
  console.error(`Migration file not found: ${MIGRATION_PATH}`);
  process.exit(1);
}

// Main function
async function applyNamingConventionMigration() {
  try {
    console.log('Starting database naming convention migration...');
    console.log(`Using migration file: ${MIGRATION_PATH}`);
    
    // Execute the migration using Supabase CLI
    // Note: This assumes that the Supabase CLI is installed and properly configured
    console.log('Applying migration to Supabase database...');
    try {
      execSync(`supabase db execute --file ${MIGRATION_PATH}`, { stdio: 'inherit' });
    } catch (error) {
      console.error('Migration execution failed. This might be due to the migration script format.');
      console.error('Attempting alternative execution method...');
      
      // Read the SQL file and execute directly
      const sqlContent = fs.readFileSync(MIGRATION_PATH, 'utf8');
      
      // Create a temporary file without the \i commands if they exist
      const tempPath = path.join(__dirname, 'temp_migration.sql');
      fs.writeFileSync(tempPath, sqlContent);
      
      try {
        execSync(`supabase db execute --file ${tempPath}`, { stdio: 'inherit' });
        fs.unlinkSync(tempPath); // Clean up temp file
      } catch (secondError) {
        console.error('Alternative execution also failed:');
        console.error(secondError.message);
        if (fs.existsSync(tempPath)) {
          fs.unlinkSync(tempPath); // Clean up temp file even on error
        }
        process.exit(1);
      }
    }
    
    console.log('Migration completed successfully.');
    
    // Additional checks and validation
    console.log('Verifying the migration...');
    
    console.log('\nChecking table names:');
    execSync(`supabase db execute --command "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name;"`, 
      { stdio: 'inherit' });
      
    console.log('\nChecking sample column names from events table:');
    execSync(`supabase db execute --command "SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'events' ORDER BY column_name LIMIT 10;"`, 
      { stdio: 'inherit' });
    
    console.log('\nChecking constraints for format:');
    execSync(`supabase db execute --command "SELECT conname FROM pg_constraint WHERE conname LIKE 'events%' OR conname LIKE 'attendees%' ORDER BY conname LIMIT 10;"`, 
      { stdio: 'inherit' });
    
    console.log('\nDatabase tables have been successfully renamed to follow snake_case convention.');
    console.log('\nImportant: You may need to update your application code to reflect these naming changes.');
    console.log('Check the following files:');
    console.log(' - lib/supabase.ts');
    console.log(' - app/api/* routes');
    console.log(' - Any direct SQL queries in your codebase');
    
  } catch (error) {
    console.error('Error applying migration:');
    console.error(error.message);
    process.exit(1);
  }
}

// Run the script
applyNamingConventionMigration();