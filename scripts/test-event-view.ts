import { createClient } from '@supabase/supabase-js';

// Set environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://pwwpcjbbxotmiqrisjvf.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3d3BjamJieG90bWlxcmlzanZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU1NDg1NjgsImV4cCI6MjA2MTEyNDU2OH0.Ep3pzGlPgXbnTrcE84dIIbBxk-OsnXq7BSwL7vG-p3Q';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testEventView() {
  console.log('=== Testing event_display_view ===\n');
  
  const slug = 'grand-communication-2025';
  
  // Test the view
  const { data: eventData, error } = await supabase
    .from('event_display_view')
    .select('*')
    .eq('slug', slug)
    .single();
    
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log('Event Data:');
  console.log('- Title:', eventData.title);
  console.log('- Event Start:', eventData.event_start);
  console.log('- Event End:', eventData.event_end);
  console.log('- Location ID:', eventData.location_id);
  console.log('- Location String:', eventData.location_string);
  console.log('- Place Name:', eventData.place_name);
  console.log('- Street Address:', eventData.street_address);
  console.log('- Suburb:', eventData.suburb);
  console.log('- State:', eventData.state);
  console.log('- Postal Code:', eventData.postal_code);
  
  // Test date parsing
  if (eventData.event_start) {
    const date = new Date(eventData.event_start);
    console.log('\nDate Parsing:');
    console.log('- Raw:', eventData.event_start);
    console.log('- Parsed:', date);
    console.log('- Is Valid:', !isNaN(date.getTime()));
    console.log('- Formatted:', date.toLocaleDateString('en-AU'));
  }
  
  // Check why location_string might be null
  console.log('\nLocation String Calculation:');
  const parts = [eventData.place_name, eventData.suburb, eventData.state, eventData.postal_code];
  console.log('- Parts:', parts);
  console.log('- Filtered:', parts.filter(Boolean));
  console.log('- Would produce:', parts.filter(Boolean).join(', '));
}

testEventView().catch(console.error);