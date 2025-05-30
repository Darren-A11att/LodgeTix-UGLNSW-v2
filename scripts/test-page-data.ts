// Set environment variables first
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://pwwpcjbbxotmiqrisjvf.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3d3BjamJieG90bWlxcmlzanZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU1NDg1NjgsImV4cCI6MjA2MTEyNDU2OH0.Ep3pzGlPgXbnTrcE84dIIbBxk-OsnXq7BSwL7vG-p3Q';

import { EventRPCService } from '../lib/api/event-rpc-service';

async function testPageData() {
  console.log('=== Testing Page Data Loading ===\n');
  
  try {
    // Initialize service as client-side to match the page
    const eventService = new EventRPCService(false);
    
    const slug = 'grand-communication-2025';
    console.log(`1. Fetching data for slug: ${slug}`);
    
    const eventData = await eventService.getEventDetailData(slug);
    
    if (!eventData) {
      console.log('❌ No data returned from EventRPCService');
      return;
    }
    
    console.log('\n✅ Data retrieved successfully!');
    console.log('\n2. Event Details:');
    console.log('   - Title:', eventData.title);
    console.log('   - Event Start:', eventData.event_start);
    console.log('   - Event End:', eventData.event_end);
    console.log('   - Location:', eventData.location);
    console.log('   - Venue Name:', eventData.venue_name);
    console.log('   - Venue City:', eventData.venue_city);
    console.log('   - Venue State:', eventData.venue_state);
    
    // Test date formatting like the page does
    console.log('\n3. Date Formatting Test:');
    if (eventData.event_start) {
      try {
        const eventDate = new Date(eventData.event_start);
        console.log('   - Raw date:', eventData.event_start);
        console.log('   - Parsed date:', eventDate);
        console.log('   - Is valid:', !isNaN(eventDate.getTime()));
        
        const formattedDate = eventDate.toLocaleDateString('en-AU', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        const formattedTime = eventDate.toLocaleTimeString('en-AU', {
          hour: 'numeric',
          minute: 'numeric',
          hour12: true
        });
        
        console.log('   - Formatted date:', formattedDate);
        console.log('   - Formatted time:', formattedTime);
      } catch (e) {
        console.error('   - Date formatting error:', e);
      }
    } else {
      console.log('   - No event_start date!');
    }
    
    console.log('\n4. Location Data:');
    console.log('   - Has location string:', !!eventData.location);
    console.log('   - Location value:', eventData.location || 'EMPTY');
    
    // Check what the page would show
    console.log('\n5. What the page would display:');
    console.log('   - Date:', eventData.event_start ? 'Should show date' : 'Would show TBD');
    console.log('   - Location:', eventData.location || 'Would show TBD');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testPageData();