#!/usr/bin/env node

/**
 * Script to fix confirmation numbers in production database
 * 
 * This script:
 * 1. Fetches all registrations with their confirmation numbers
 * 2. Updates confirmation numbers to the correct hyphenated format
 * 3. Generates new confirmation numbers for null values
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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
  
  // If format is completely wrong, generate new one
  console.log(`⚠️  Invalid format for ${confirmationNumber}, generating new one`);
  return generateConfirmationNumber(registrationType);
}

async function main() {
  try {
    console.log('🚀 Starting confirmation number migration...\n');
    
    // Step 1: Fetch all registrations
    console.log('📋 Fetching registrations from database...');
    const { data: registrations, error: fetchError } = await supabase
      .from('registrations')
      .select('registration_id, registration_type, confirmation_number');
    
    if (fetchError) {
      throw new Error(`Failed to fetch registrations: ${fetchError.message}`);
    }
    
    console.log(`✅ Found ${registrations.length} registrations\n`);
    
    // Step 2: Analyze and fix confirmation numbers
    const updates = [];
    let fixed = 0;
    let generated = 0;
    let alreadyCorrect = 0;
    
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
    
    console.log('📊 Analysis Results:');
    console.log(`   - Already correct: ${alreadyCorrect}`);
    console.log(`   - Need fixing: ${fixed}`);
    console.log(`   - Need generation: ${generated}`);
    console.log(`   - Total updates needed: ${updates.length}\n`);
    
    if (updates.length === 0) {
      console.log('✅ All confirmation numbers are already in correct format!');
      return;
    }
    
    // Step 3: Apply updates
    console.log('🔄 Applying updates...');
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
          console.log(`✅ ${update.old_number || 'NULL'} → ${update.new_number}`);
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
    } else {
      console.log('\n⚠️  Some updates failed. Please check the errors above.');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('💥 Migration failed:', error.message);
    process.exit(1);
  }
}

// Run the migration
if (require.main === module) {
  main();
}

module.exports = { generateConfirmationNumber, fixConfirmationNumber };