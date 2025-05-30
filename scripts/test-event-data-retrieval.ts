import { createClient } from '@supabase/supabase-js';

// Set environment variables for the test
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://pwwpcjbbxotmiqrisjvf.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3d3BjamJieG90bWlxcmlzanZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU1NDg1NjgsImV4cCI6MjA2MTEyNDU2OH0.Ep3pzGlPgXbnTrcE84dIIbBxk-OsnXq7BSwL7vG-p3Q';

import { EventRPCService } from '../lib/api/event-rpc-service';

// Use the environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Testing Complete Event Data Retrieval');
console.log('=====================================\n');

const supabase = createClient(supabaseUrl!, supabaseAnonKey!);
// Use browser client mode (false)
const eventService = new EventRPCService(false);

async function testEventDataRetrieval() {
  try {
    // Test with the grand-proclamation-2025 event
    const testSlug = 'grand-proclamation-2025';
    
    console.log('1. Testing RPC function directly...');
    console.log(`   Calling get_event_with_details with slug: ${testSlug}`);
    
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_event_with_details', {
      p_event_slug: testSlug
    });
    
    if (rpcError) {
      console.error('❌ RPC Error:', rpcError.message);
      return;
    }
    
    console.log('✅ RPC function returned successfully');
    console.log('   - Event title:', rpcData.event?.title);
    console.log('   - Child events count:', rpcData.child_events?.length || 0);
    console.log('   - Ticket types count:', rpcData.ticket_types?.length || 0);
    console.log('   - Packages count:', rpcData.packages?.length || 0);
    
    // Check child event fields
    if (rpcData.child_events && rpcData.child_events.length > 0) {
      console.log('\n   Child Event Sample:');
      const firstChild = rpcData.child_events[0];
      console.log('   - Title:', firstChild.title);
      console.log('   - Has description:', !!firstChild.description);
      console.log('   - Has image_url:', !!firstChild.image_url);
      console.log('   - Location:', firstChild.location_string);
    }
    
    // Check summary data
    if (rpcData.summary) {
      console.log('\n   Summary Data:');
      console.log('   - Min price:', rpcData.summary.min_price);
      console.log('   - Max price:', rpcData.summary.max_price);
      console.log('   - Total capacity:', rpcData.summary.total_capacity);
      console.log('   - Is sold out:', rpcData.summary.is_sold_out);
    }
    
    console.log('\n2. Testing EventRPCService data mapping...');
    const eventData = await eventService.getEventDetailData(testSlug);
    
    if (!eventData) {
      console.error('❌ EventRPCService returned null');
      return;
    }
    
    console.log('✅ EventRPCService returned data successfully');
    console.log('   - Event title:', eventData.title);
    console.log('   - Min price:', eventData.min_price);
    console.log('   - Max price:', eventData.max_price);
    console.log('   - Has tickets array:', !!eventData.tickets);
    console.log('   - Tickets count:', eventData.tickets?.length || 0);
    console.log('   - Has child_events array:', !!eventData.child_events);
    console.log('   - Child events count:', eventData.child_events?.length || 0);
    
    // Check mapped ticket structure
    if (eventData.tickets && eventData.tickets.length > 0) {
      console.log('\n   Mapped Ticket Sample:');
      const firstTicket = eventData.tickets[0];
      console.log('   - Name:', firstTicket.name);
      console.log('   - Price:', firstTicket.price);
      console.log('   - Quantity available:', firstTicket.quantity_available);
      console.log('   - Attendee type:', firstTicket.attendee_type);
    }
    
    // Check mapped child event structure
    if (eventData.child_events && eventData.child_events.length > 0) {
      console.log('\n   Mapped Child Event Sample:');
      const firstChild = eventData.child_events[0];
      console.log('   - ID:', firstChild.id);
      console.log('   - Title:', firstChild.title);
      console.log('   - Description:', firstChild.description || '(empty)');
      console.log('   - Image URL:', firstChild.image_url || '(none)');
      console.log('   - Is multi-day:', firstChild.is_multi_day);
    }
    
    console.log('\n✅ All data retrieval tests passed!');
    console.log('\nRecommended next steps:');
    console.log('1. Apply the migration to update the RPC function');
    console.log('2. Clear browser cache and Next.js cache');
    console.log('3. Restart the development server');
    
  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

// Run the test
testEventDataRetrieval();