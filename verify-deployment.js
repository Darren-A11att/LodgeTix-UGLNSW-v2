// Verify that the business_number hotfix is deployed to both local and remote
const { createClient } = require('@supabase/supabase-js');

const localUrl = 'http://localhost:54321';
const localKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

// Get remote URL from environment variables
const remoteUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const remoteKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function testDatabase(name, url, key) {
  console.log(`\n🔍 Testing ${name} database...`);
  
  if (!url || !key) {
    console.log(`❌ ${name}: Missing credentials`);
    return false;
  }
  
  const supabase = createClient(url, key);
  
  try {
    // Test the hotfixed function
    const { data, error } = await supabase.rpc('upsert_lodge_registration', {
      p_function_id: '12345678-1234-1234-1234-123456789012',
      p_package_id: '87654321-4321-4321-4321-210987654321',
      p_table_count: 1,
      p_booking_contact: {
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        mobile: '0412345678'
      },
      p_lodge_details: {
        lodgeName: 'Test Lodge',
        lodgeNumber: '123'
      }
    });
    
    if (error) {
      if (error.message.includes('business_number')) {
        console.log(`❌ ${name}: business_number error still exists`);
        console.log(`   Error: ${error.message}`);
        return false;
      } else {
        console.log(`✅ ${name}: Hotfix successful (no business_number error)`);
        console.log(`   Expected error: ${error.message}`);
        return true;
      }
    }
    
    console.log(`✅ ${name}: Function call succeeded unexpectedly`);
    return true;
    
  } catch (err) {
    console.log(`❌ ${name}: Exception occurred: ${err.message}`);
    return false;
  }
}

async function main() {
  console.log('🚀 Verifying migration deployment status...');
  
  const localSuccess = await testDatabase('LOCAL', localUrl, localKey);
  const remoteSuccess = await testDatabase('REMOTE', remoteUrl, remoteKey);
  
  console.log('\n📊 DEPLOYMENT SUMMARY:');
  console.log(`Local Database:  ${localSuccess ? '✅ SUCCESS' : '❌ FAILED'}`);
  console.log(`Remote Database: ${remoteSuccess ? '✅ SUCCESS' : '❌ FAILED'}`);
  
  if (localSuccess && remoteSuccess) {
    console.log('\n🎉 ALL DEPLOYMENTS SUCCESSFUL');
    console.log('The business_number hotfix is deployed everywhere!');
    process.exit(0);
  } else {
    console.log('\n⚠️  SOME DEPLOYMENTS FAILED');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('❌ Verification script failed:', err);
  process.exit(1);
});