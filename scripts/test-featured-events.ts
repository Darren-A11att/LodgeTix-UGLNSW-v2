import { EventRPCService } from '../lib/api/event-rpc-service';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function testFeaturedEvents() {
  console.log('Testing featured events data retrieval...\n');
  
  // Initialize RPC service
  const eventService = new EventRPCService(false); // client-side
  
  try {
    // Test getFeaturedEvents
    console.log('1. Testing getFeaturedEvents():');
    const featuredEvents = await eventService.getFeaturedEvents(3);
    
    console.log(`Found ${featuredEvents.length} featured events:\n`);
    
    featuredEvents.forEach((event, index) => {
      console.log(`Event ${index + 1}:`);
      console.log(`  Title: ${event.title}`);
      console.log(`  Slug: ${event.slug}`);
      console.log(`  Location: ${event.location}`);
      console.log(`  Event Start: ${event.event_start}`);
      console.log(`  Featured: ${event.is_featured}`);
      console.log('');
    });
    
    // Test getEventCardsData with featured filter
    console.log('\n2. Testing getEventCardsData with featuredOnly:');
    const eventCards = await eventService.getEventCardsData({
      featuredOnly: true,
      limit: 3
    });
    
    console.log(`Found ${eventCards.length} featured event cards:\n`);
    
    eventCards.forEach((event, index) => {
      console.log(`Event Card ${index + 1}:`);
      console.log(`  Title: ${event.title}`);
      console.log(`  Slug: ${event.slug}`);
      console.log(`  Location: ${event.location}`);
      console.log(`  Event Start: ${event.event_start}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testFeaturedEvents().catch(console.error);