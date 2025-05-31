// Set environment variables first
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://pwwpcjbbxotmiqrisjvf.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3d3BjamJieG90bWlxcmlzanZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU1NDg1NjgsImV4cCI6MjA2MTEyNDU2OH0.Ep3pzGlPgXbnTrcE84dIIbBxk-OsnXq7BSwL7vG-p3Q';

import { createClient } from '@supabase/supabase-js';

async function testLocationIssue() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  
  console.log('=== Testing Location Issue ===\n');
  
  // Get the Grand Proclamation event
  const { data: event, error } = await supabase
    .from('event_display_view')
    .select('*')
    .eq('slug', 'grand-proclamation-2025')
    .single();
    
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log('Grand Proclamation 2025 data from event_display_view:');
  console.log('- Event ID:', event.event_id);
  console.log('- Title:', event.title);
  console.log('- Location ID:', event.location_id);
  console.log('- Location String:', event.location_string);
  console.log('- Place Name:', event.place_name);
  console.log('- Street Address:', event.street_address);
  console.log('- Suburb:', event.suburb);
  console.log('- State:', event.state);
  console.log('- Postal Code:', event.postal_code);
  
  // Check if the location has been updated
  if (event.location_id) {
    const { data: location } = await supabase
      .from('locations')
      .select('*')
      .eq('location_id', event.location_id)
      .single();
      
    console.log('\nLocation record:');
    console.log(location);
  }
}

testLocationIssue().catch(console.error);