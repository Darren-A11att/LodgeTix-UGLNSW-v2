import { createClient } from '@supabase/supabase-js';

// Set environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://pwwpcjbbxotmiqrisjvf.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3d3BjamJieG90bWlxcmlzanZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU1NDg1NjgsImV4cCI6MjA2MTEyNDU2OH0.Ep3pzGlPgXbnTrcE84dIIbBxk-OsnXq7BSwL7vG-p3Q';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function debugEventData() {
  console.log('=== Debugging Event Data Retrieval ===\n');
  
  // Test with grand-communication-2025
  const slug = 'grand-communication-2025';
  
  // 1. Check if the event exists
  console.log('1. Checking if event exists in database...');
  const { data: eventCheck, error: eventError } = await supabase
    .from('events')
    .select('event_id, slug, title, event_start, event_end, location_id')
    .eq('slug', slug)
    .single();
    
  if (eventError) {
    console.error('Error fetching event:', eventError);
    return;
  }
  
  console.log('Event found:', eventCheck);
  
  // 2. Check if location exists
  if (eventCheck.location_id) {
    console.log('\n2. Checking location data...');
    const { data: locationData, error: locationError } = await supabase
      .from('locations')
      .select('*')
      .eq('location_id', eventCheck.location_id)
      .single();
      
    if (locationError) {
      console.error('Error fetching location:', locationError);
    } else {
      console.log('Location found:', locationData);
    }
  }
  
  // 3. Test the RPC function
  console.log('\n3. Testing get_event_with_details RPC function...');
  const { data: rpcData, error: rpcError } = await supabase.rpc('get_event_with_details', {
    p_event_slug: slug
  });
  
  if (rpcError) {
    console.error('RPC Error:', rpcError);
    return;
  }
  
  console.log('\nRPC Response Structure:');
  console.log('- Has event object:', !!rpcData.event);
  console.log('- Has location object:', !!rpcData.location);
  console.log('- Has summary object:', !!rpcData.summary);
  
  if (rpcData.event) {
    console.log('\nEvent object contains:');
    console.log('- event_start:', rpcData.event.event_start);
    console.log('- event_end:', rpcData.event.event_end);
    console.log('- location_id:', rpcData.event.location_id);
    console.log('- title:', rpcData.event.title);
  }
  
  if (rpcData.location) {
    console.log('\nLocation object contains:');
    console.log('- location_string:', rpcData.location.location_string);
    console.log('- place_name:', rpcData.location.place_name);
  }
  
  // 4. Test what EventRPCService would produce
  console.log('\n4. Simulating EventRPCService mapping...');
  const eventData = rpcData.event;
  const location = rpcData.location;
  
  const mappedData = {
    ...eventData,
    location: location?.location_string || eventData?.location || '',
    event_start: eventData?.event_start,
    event_end: eventData?.event_end
  };
  
  console.log('\nMapped data:');
  console.log('- event_start:', mappedData.event_start);
  console.log('- location:', mappedData.location);
  console.log('- title:', mappedData.title);
  
  // 5. Test date parsing
  console.log('\n5. Testing date parsing...');
  if (mappedData.event_start) {
    try {
      const date = new Date(mappedData.event_start);
      console.log('- Parsed date:', date);
      console.log('- Is valid date:', !isNaN(date.getTime()));
      console.log('- Formatted:', date.toLocaleDateString('en-AU'));
    } catch (e) {
      console.error('Date parsing error:', e);
    }
  } else {
    console.log('- event_start is null/undefined!');
  }
}

debugEventData().catch(console.error);