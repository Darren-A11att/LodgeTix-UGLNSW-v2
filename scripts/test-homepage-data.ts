// Set environment variables first
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://pwwpcjbbxotmiqrisjvf.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3d3BjamJieG90bWlxcmlzanZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU1NDg1NjgsImV4cCI6MjA2MTEyNDU2OH0.Ep3pzGlPgXbnTrcE84dIIbBxk-OsnXq7BSwL7vG-p3Q';

import { getGrandInstallationEvent } from '../lib/services/homepage-service';

async function testHomepageData() {
  console.log('=== Testing Homepage Data ===\n');
  
  const event = await getGrandInstallationEvent();
  
  if (!event) {
    console.log('No event found');
    return;
  }
  
  console.log('Event data returned:');
  console.log('- ID:', event.id);
  console.log('- Slug:', event.slug);
  console.log('- Title:', event.title);
  console.log('- Date:', event.date);
  console.log('- Time:', event.time);
  console.log('- Location:', event.location);
  console.log('- Event Start (raw):', event.event_start);
  
  // Test the format functions directly
  const { formatEventDate, formatEventTime } = require('../lib/event-facade');
  
  console.log('\nTesting format functions with event data:');
  console.log('- formatEventDate result:', formatEventDate(event));
  console.log('- formatEventTime result:', formatEventTime(event));
}

testHomepageData().catch(console.error);