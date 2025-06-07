import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pwwpcjbbxotmiqrisjvf.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function testLodgeRegistration() {
  console.log('🧪 Testing Lodge Registration API...');
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  
  // Test data for lodge registration
  const testPayload = {
    tableCount: 1,
    bookingContact: {
      title: 'Bro',
      firstName: 'John',
      lastName: 'Test',
      email: 'test@lodge.example.com',
      mobile: '0400123456',
      rank: 'EAF'
    },
    lodgeDetails: {
      lodgeName: 'Test Lodge No. 999',
      lodge_id: '11c66ae7-763d-2a2a-d226-10415d997a84', // Using existing lodge ID
      organisation_id: '11c66ae7-763d-2a2a-d226-10415d997a84',
      lodgeNumber: '999'
    },
    paymentMethodId: 'pm_test_123456',
    amount: 195000, // $1950 in cents
    subtotal: 190000, // Before fees
    stripeFee: 5000, // $50 in cents
    billingDetails: {
      title: 'Bro',
      firstName: 'John',
      lastName: 'Test',
      emailAddress: 'test@lodge.example.com',
      mobileNumber: '0400123456',
      addressLine1: 'Lodge Hall',
      suburb: 'Sydney',
      stateTerritory: { name: 'NSW' },
      postcode: '2000',
      country: { isoCode: 'AU' },
      businessName: 'Test Lodge No. 999'
    }
  };

  try {
    // Step 1: Test the RPC function directly
    console.log('🔍 Step 1: Testing upsert_lodge_registration RPC function directly...');
    
    const functionId = 'eebddef5-6833-43e3-8d32-700508b1c089'; // Grand Proclamation 2025
    const packageId = '794841e4-5f04-4899-96e2-c0afece4d5f2'; // Lodge package
    
    // Generate a test customer ID since we're not authenticated
    const testCustomerId = 'e88225e7-23b7-4faa-881c-734486852990'; // Use a UUID format
    
    const rpcPayload = {
      p_function_id: functionId,
      p_package_id: packageId,
      p_table_count: testPayload.tableCount,
      p_booking_contact: {
        ...testPayload.bookingContact,
        authUserId: testCustomerId // Add customer ID to booking contact
      },
      p_lodge_details: testPayload.lodgeDetails,
      p_payment_status: 'pending',
      p_stripe_payment_intent_id: null,
      p_registration_id: null,
      p_total_amount: testPayload.amount / 100, // Convert from cents to dollars
      p_subtotal: testPayload.subtotal / 100,
      p_stripe_fee: testPayload.stripeFee / 100,
      p_metadata: {
        billingDetails: testPayload.billingDetails,
        zustandStoreState: {
          registrationStore: {
            currentStep: 'payment',
            completedSteps: ['lodge-details', 'package-selection', 'billing-details', 'order-review'],
            isValid: true
          },
          capturedAt: new Date().toISOString(),
          version: '2.0.0',
          source: 'direct_test'
        }
      }
    };

    const { data: rpcResult, error: rpcError } = await supabase
      .rpc('upsert_lodge_registration', rpcPayload);
    
    if (rpcError) {
      console.error('❌ RPC function failed:', rpcError);
      return;
    }
    
    console.log('✅ RPC function succeeded!');
    console.log('📄 RPC Result:', JSON.stringify(rpcResult, null, 2));
    
    if (rpcResult && rpcResult.success) {
      console.log('🎉 SUCCESS: Lodge registration RPC is working!');
      console.log(`📝 Registration ID: ${rpcResult.registrationId}`);
      console.log(`🏢 Organisation: ${rpcResult.organisationName}`);
      console.log(`🎫 Created Tickets: ${rpcResult.createdTickets}`);
      
      // Step 2: Verify the registration was created in the database
      console.log('🔍 Step 2: Verifying registration in database...');
      
      const { data: registration, error: dbError } = await supabase
        .from('registrations')
        .select('registration_id, registration_type, organisation_name, attendee_count, status, payment_status')
        .eq('registration_id', rpcResult.registrationId)
        .single();
      
      if (dbError) {
        console.error('❌ Database verification failed:', dbError);
      } else {
        console.log('✅ Database verification successful:');
        console.log('  - Registration Type:', registration.registration_type);
        console.log('  - Organisation:', registration.organisation_name);
        console.log('  - Attendee Count:', registration.attendee_count);
        console.log('  - Status:', registration.status);
        console.log('  - Payment Status:', registration.payment_status);
      }
      
      // Step 3: Check if tickets were created
      console.log('🔍 Step 3: Verifying tickets were created...');
      
      const { data: tickets, error: ticketsError } = await supabase
        .from('tickets')
        .select('ticket_id, status, ticket_number, event_id')
        .eq('registration_id', rpcResult.registrationId);
      
      if (ticketsError) {
        console.error('❌ Tickets verification failed:', ticketsError);
      } else {
        console.log(`✅ Found ${tickets.length} tickets created`);
        tickets.forEach((ticket, index) => {
          console.log(`  Ticket ${index + 1}: ${ticket.ticket_number} (${ticket.status})`);
        });
      }
      
    } else {
      console.error('❌ FAILED: Lodge registration RPC returned failure');
      console.error('RPC result:', rpcResult);
    }

  } catch (error) {
    console.error('💥 Test failed with exception:', error);
  }
}

// Run the test
testLodgeRegistration().then(() => {
  console.log('🏁 Lodge registration test completed');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});