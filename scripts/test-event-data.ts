import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Create a server-side Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testEventData() {
  console.log('Testing event data retrieval...\n');
  
  // 1. Test direct events table query
  console.log('1. Direct query to events table:');
  const { data: eventData, error: eventError } = await supabase
    .from('events')
    .select('event_id, slug, title, location_id, event_start')
    .eq('slug', 'grand-communication-2025')
    .single();
    
  if (eventError) {
    console.error('Error:', eventError);
  } else {
    console.log('Event data:', eventData);
  }
  
  // 2. Test event_display_view
  console.log('\n2. Query to event_display_view:');
  const { data: viewData, error: viewError } = await supabase
    .from('event_display_view')
    .select('event_id, slug, title, location_string, location_id, place_name, event_start')
    .eq('slug', 'grand-communication-2025')
    .single();
    
  if (viewError) {
    console.error('Error:', viewError);
  } else {
    console.log('View data:', viewData);
  }
  
  // 3. Test locations table directly if we have a location_id
  if (eventData?.location_id) {
    console.log('\n3. Query to locations table with location_id:', eventData.location_id);
    const { data: locationData, error: locationError } = await supabase
      .from('locations')
      .select('*')
      .eq('location_id', eventData.location_id)
      .single();
      
    if (locationError) {
      console.error('Error:', locationError);
    } else {
      console.log('Location data:', locationData);
    }
  }
  
  // 4. Test featured events
  console.log('\n4. Query for featured events:');
  const { data: featuredData, error: featuredError } = await supabase
    .from('event_display_view')
    .select('event_id, slug, title, featured, location_string, event_start')
    .eq('featured', true);
    
  if (featuredError) {
    console.error('Error:', featuredError);
  } else {
    console.log('Featured events:', featuredData);
  }
  
  // 5. Test all events
  console.log('\n5. Query for all published events:');
  const { data: allEvents, error: allError } = await supabase
    .from('event_display_view')
    .select('event_id, slug, title, featured, location_string, event_start')
    .eq('is_published', true)
    .limit(5);
    
  if (allError) {
    console.error('Error:', allError);
  } else {
    console.log('All published events:', allEvents);
  }
}

testEventData().catch(console.error);