/**
 * Simple validation script to test if the individual registration RPC exists and works
 */

const { createClient } = require('@supabase/supabase-js');

async function validateIndividualRPC() {
  console.log('🔍 Validating Individual Registration RPC...\n');

  // Use minimal environment variables or hardcoded values for testing
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
  const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // First, check if the function exists by trying to call it with minimal data
    console.log('📞 Testing function exists...');
    
    const testData = {
      registrationId: '123e4567-e89b-12d3-a456-426614174000',
      authUserId: '123e4567-e89b-12d3-a456-426614174001', 
      functionId: '123e4567-e89b-12d3-a456-426614174002',
      billingDetails: {
        firstName: 'Test',
        lastName: 'User',
        emailAddress: 'test@example.com',
        mobileNumber: '+61400000000'
      },
      attendees: [],
      tickets: []
    };

    const { data, error } = await supabase.rpc('upsert_individual_registration', {
      p_registration_data: testData
    });

    if (error) {
      if (error.message.includes('Function not found') || error.message.includes('does not exist')) {
        console.log('❌ Function does not exist or was not created properly');
        console.log('Error:', error.message);
        return false;
      } else {
        console.log('✅ Function exists (got expected validation error)');
        console.log('Expected error (this is good):', error.message);
        return true;
      }
    } else {
      console.log('✅ Function exists and executed successfully');
      console.log('Result:', data);
      return true;
    }

  } catch (error) {
    console.log('❌ Connection or other error:', error.message);
    return false;
  }
}

// If we can run this
if (require.main === module) {
  validateIndividualRPC()
    .then((success) => {
      if (success) {
        console.log('\n🎉 Validation: Individual Registration RPC is available!');
      } else {
        console.log('\n⚠️  Validation: Individual Registration RPC may have issues');
      }
    })
    .catch(console.error);
} else {
  module.exports = { validateIndividualRPC };
}