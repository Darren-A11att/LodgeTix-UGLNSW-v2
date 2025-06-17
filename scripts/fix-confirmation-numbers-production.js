#!/usr/bin/env node

/**
 * Script to fix confirmation numbers in PRODUCTION database
 * 
 * This script:
 * 1. Connects directly to production Supabase
 * 2. Fetches all registrations with their confirmation numbers
 * 3. Updates confirmation numbers to the correct hyphenated format
 * 4. Generates new confirmation numbers for null values
 */

const { createClient } = require('@supabase/supabase-js');

// Production Supabase credentials from environment variables
const PRODUCTION_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const PRODUCTION_SERVICE_ROLE_KEY = process.env.PROD_SUPABASE_SERVICE_ROLE_KEY;

if (!PRODUCTION_SUPABASE_URL) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL environment variable is required');
  process.exit(1);
}

if (!PRODUCTION_SERVICE_ROLE_KEY) {
  console.error('❌ PROD_SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  process.exit(1);
}

// Initialize Supabase client for production
const supabase = createClient(PRODUCTION_SUPABASE_URL, PRODUCTION_SERVICE_ROLE_KEY);

/**
 * Generate a confirmation number based on registration type
 * @param {string} registrationType - 'individual', 'lodge', or 'delegate'
 * @returns {string} Generated confirmation number
 */
function generateConfirmationNumber(registrationType) {
  const prefix = registrationType === 'individual' ? 'IND' :
                registrationType === 'lodge' ? 'LDG' : 'DEL';
  
  // Generate 6 random digits
  const digits = Math.floor(Math.random() * 999999).toString().padStart(6, '0');
  
  // Generate 2 random uppercase letters
  const letters = String.fromCharCode(
    65 + Math.floor(Math.random() * 26),
    65 + Math.floor(Math.random() * 26)
  );
  
  return `${prefix}-${digits}${letters}`;
}

/**
 * Fix confirmation number format
 * @param {string} confirmationNumber - Current confirmation number
 * @param {string} registrationType - Registration type
 * @returns {string} Fixed confirmation number
 */
function fixConfirmationNumber(confirmationNumber, registrationType) {
  if (!confirmationNumber) {
    return generateConfirmationNumber(registrationType);
  }
  
  // Check if already in correct format
  if (/^(IND|LDG|DEL)-[0-9]{6}[A-Z]{2}$/.test(confirmationNumber)) {
    return confirmationNumber;
  }
  
  // Fix format without hyphen: IND123456AB -> IND-123456AB
  if (/^(IND|LDG|DEL)[0-9]{6}[A-Z]{2}$/.test(confirmationNumber)) {
    return confirmationNumber.slice(0, 3) + '-' + confirmationNumber.slice(3);
  }
  
  // Fix format with hyphen but missing letters: IND-123456 -> IND-123456AB
  if (/^(IND|LDG|DEL)-[0-9]{6}$/.test(confirmationNumber)) {
    const letters = String.fromCharCode(
      65 + Math.floor(Math.random() * 26),
      65 + Math.floor(Math.random() * 26)
    );
    console.log(`🔧 Adding missing letters to ${confirmationNumber} -> ${confirmationNumber}${letters}`);
    return confirmationNumber + letters;
  }
  
  // Fix format without hyphen and missing letters: IND123456 -> IND-123456AB
  if (/^(IND|LDG|DEL)[0-9]{6}$/.test(confirmationNumber)) {
    const letters = String.fromCharCode(
      65 + Math.floor(Math.random() * 26),
      65 + Math.floor(Math.random() * 26)
    );
    const fixed = confirmationNumber.slice(0, 3) + '-' + confirmationNumber.slice(3) + letters;
    console.log(`🔧 Fixing format and adding letters: ${confirmationNumber} -> ${fixed}`);
    return fixed;
  }
  
  // If format is completely wrong, generate new one
  console.log(`⚠️  Invalid format for ${confirmationNumber}, generating new one`);
  return generateConfirmationNumber(registrationType);
}

async function main() {
  try {
    console.log('🚀 Starting confirmation number migration on PRODUCTION database...\n');
    console.log('🔴 WARNING: This will modify PRODUCTION data!\n');
    
    // Step 1: Test connection and fetch ALL registrations (no limits)
    console.log('📋 Fetching ALL registrations from PRODUCTION database...');
    const { data: registrations, error: fetchError } = await supabase
      .from('registrations')
      .select('*');
    
    if (fetchError) {
      throw new Error(`Failed to fetch registrations: ${fetchError.message}`);
    }
    
    console.log(`✅ Found ${registrations.length} registrations\n`);
    
    if (registrations.length === 0) {
      console.log('ℹ️  No registrations found. Database might be empty or RLS policies are blocking access.');
      return;
    }
    
    // Step 2: Analyze and fix confirmation numbers
    const updates = [];
    let fixed = 0;
    let generated = 0;
    let alreadyCorrect = 0;
    
    console.log('📊 Analyzing confirmation numbers...');
    for (const registration of registrations) {
      const { registration_id, registration_type, confirmation_number } = registration;
      
      // Skip if already in correct format
      if (confirmation_number && /^(IND|LDG|DEL)-[0-9]{6}[A-Z]{2}$/.test(confirmation_number)) {
        alreadyCorrect++;
        continue;
      }
      
      const fixedNumber = fixConfirmationNumber(confirmation_number, registration_type);
      
      if (fixedNumber !== confirmation_number) {
        updates.push({
          registration_id,
          registration_type,
          old_number: confirmation_number,
          new_number: fixedNumber
        });
        
        if (!confirmation_number) {
          generated++;
        } else {
          fixed++;
        }
      }
    }
    
    console.log('\n📊 Analysis Results:');
    console.log(`   - Already correct: ${alreadyCorrect}`);
    console.log(`   - Need fixing: ${fixed}`);
    console.log(`   - Need generation: ${generated}`);
    console.log(`   - Total updates needed: ${updates.length}\n`);
    
    if (updates.length === 0) {
      console.log('✅ All confirmation numbers are already in correct format!');
      return;
    }
    
    // Show preview of changes
    console.log('📝 Preview of changes:');
    updates.slice(0, 5).forEach(update => {
      console.log(`   ${update.registration_type}: ${update.old_number || 'NULL'} → ${update.new_number}`);
    });
    if (updates.length > 5) {
      console.log(`   ... and ${updates.length - 5} more changes`);
    }
    console.log();
    
    // Confirmation prompt
    console.log('🔴 PRODUCTION DATABASE MODIFICATION');
    console.log('⚠️  This will permanently modify production data!');
    console.log('⚠️  Make sure you have a database backup before proceeding!');
    console.log('\nDo you want to continue? Type "YES" to proceed:');
    
    // Simple confirmation (in real usage, you'd use a proper prompt library)
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const answer = await new Promise(resolve => {
      rl.question('', resolve);
    });
    rl.close();
    
    if (answer !== 'YES') {
      console.log('❌ Operation cancelled by user.');
      return;
    }
    
    // Step 3: Apply updates
    console.log('\n🔄 Applying updates to PRODUCTION database...');
    let successCount = 0;
    let errorCount = 0;
    
    for (const update of updates) {
      try {
        const { error: updateError } = await supabase
          .from('registrations')
          .update({ confirmation_number: update.new_number })
          .eq('registration_id', update.registration_id);
        
        if (updateError) {
          console.error(`❌ Failed to update ${update.registration_id}: ${updateError.message}`);
          errorCount++;
        } else {
          console.log(`✅ ${update.registration_type}: ${update.old_number || 'NULL'} → ${update.new_number}`);
          successCount++;
        }
      } catch (err) {
        console.error(`❌ Error updating ${update.registration_id}: ${err.message}`);
        errorCount++;
      }
    }
    
    console.log('\n📈 Update Results:');
    console.log(`   - Successful updates: ${successCount}`);
    console.log(`   - Failed updates: ${errorCount}`);
    console.log(`   - Success rate: ${((successCount / updates.length) * 100).toFixed(1)}%`);
    
    if (errorCount === 0) {
      console.log('\n🎉 All confirmation numbers successfully migrated!');
      console.log('✅ You can now re-run the Supabase migration - it should succeed.');
    } else {
      console.log('\n⚠️  Some updates failed. Please check the errors above.');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('💥 Migration failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run the migration
if (require.main === module) {
  main();
}

module.exports = { generateConfirmationNumber, fixConfirmationNumber };