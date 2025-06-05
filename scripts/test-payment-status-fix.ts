import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function testPaymentStatusEnum() {
  console.log('Testing payment_status enum casting...\n');
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  // Test the enum casting function
  const { data: castTest, error: castError } = await supabase
    .rpc('test_payment_status_cast');
    
  if (castError) {
    console.error('❌ Cast test failed:', castError);
  } else {
    console.log('✅ Enum cast test results:');
    console.table(castTest);
  }
  
  // Test creating a simple ticket with payment_status
  console.log('\nTesting ticket insertion with payment_status...');
  
  const testRegistrationId = 'a0000000-0000-0000-0000-000000000001';
  const testAttendeeId = 'b0000000-0000-0000-0000-000000000001';
  const testEventId = 'e842bdb2-aff8-46d8-a347-bf50840fff13'; // From the error log
  
  // First, clean up any test data
  await supabase
    .from('tickets')
    .delete()
    .eq('registration_id', testRegistrationId);
    
  // Try inserting a ticket with payment_status
  const { data: ticket, error: ticketError } = await supabase
    .from('tickets')
    .insert({
      registration_id: testRegistrationId,
      attendee_id: testAttendeeId,
      event_id: testEventId,
      status: 'reserved',
      price_paid: 100,
      payment_status: 'unpaid' // This should work now
    })
    .select()
    .single();
    
  if (ticketError) {
    console.error('❌ Ticket insertion failed:', ticketError);
  } else {
    console.log('✅ Ticket created successfully:', ticket);
    
    // Clean up
    await supabase
      .from('tickets')
      .delete()
      .eq('ticket_id', ticket.ticket_id);
  }
  
  // Test the RPC function with minimal data
  console.log('\nTesting upsert_individual_registration RPC...');
  
  const testRpcData = {
    authUserId: 'd6813cca-36f8-46b0-a4a2-3db97b9d1db2', // From error log
    functionId: 'eebddef5-6833-43e3-8d32-700508b1c089', // From error log
    eventId: testEventId,
    primaryAttendee: {
      firstName: 'Test',
      lastName: 'User',
      attendeeType: 'guest',
      contactPreference: 'directly',
      email: 'test@example.com'
    },
    additionalAttendees: [],
    tickets: [{
      attendeeId: testAttendeeId,
      eventId: testEventId,
      price: 100
    }],
    billingDetails: {
      firstName: 'Test',
      lastName: 'User',
      emailAddress: 'test@example.com',
      mobileNumber: '0400000000',
      billingAddress: {
        addressLine1: '123 Test St',
        city: 'Sydney',
        state: 'NSW',
        postcode: '2000',
        country: 'Australia'
      }
    },
    totalAmount: 100,
    subtotal: 100,
    stripeFee: 0,
    agreeToTerms: true
  };
  
  const { data: rpcResult, error: rpcError } = await supabase
    .rpc('upsert_individual_registration', {
      p_registration_data: testRpcData
    });
    
  if (rpcError) {
    console.error('❌ RPC test failed:', rpcError);
    console.error('Error details:', rpcError.message);
  } else {
    console.log('✅ RPC test successful:', rpcResult);
    
    // Clean up test registration
    if (rpcResult?.registrationId) {
      await supabase
        .from('registrations')
        .delete()
        .eq('registration_id', rpcResult.registrationId);
        
      console.log('🧹 Test data cleaned up');
    }
  }
}

testPaymentStatusEnum()
  .then(() => {
    console.log('\n✅ All tests completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });