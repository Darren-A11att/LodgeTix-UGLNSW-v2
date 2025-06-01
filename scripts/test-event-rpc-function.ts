import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testEventRPC() {
  console.log('Testing get_event_with_details RPC function...\n');

  try {
    // First, get an event slug to test with
    const { data: events, error: eventError } = await supabase
      .from('events')
      .select('slug, title, event_id')
      .eq('is_published', true)
      .limit(3);

    if (eventError) {
      console.error('Error fetching events:', eventError);
      return;
    }

    if (!events || events.length === 0) {
      console.log('No published events found to test');
      return;
    }

    console.log('Testing with events:');
    events.forEach(event => {
      console.log(`- ${event.slug}: ${event.title}`);
    });

    // Test the RPC function with the first event
    const testSlug = events[0].slug;
    console.log(`\nTesting RPC with slug: ${testSlug}`);

    const { data, error } = await supabase.rpc('get_event_with_details', {
      p_event_slug: testSlug
    });

    if (error) {
      console.error('\n❌ RPC Error:');
      console.error('Code:', error.code);
      console.error('Message:', error.message);
      console.error('Details:', error.details);
      console.error('Hint:', error.hint);
      return;
    }

    console.log('\n✅ RPC function executed successfully!');

    if (data) {
      console.log('\nEvent details retrieved:');
      console.log('- Event title:', data.event?.title);
      console.log('- Event ID:', data.event?.event_id);
      console.log('- Function name:', data.function?.name);
      console.log('- Location:', data.location?.place_name);
      console.log('- Organisation:', data.organisation?.name);
      console.log('- Packages count:', data.packages?.length || 0);
      console.log('- Tickets count:', data.tickets?.length || 0);
      
      if (data.tickets && data.tickets.length > 0) {
        console.log('\nFirst ticket:');
        const ticket = data.tickets[0];
        console.log('- ID:', ticket.id || ticket.event_ticket_id);
        console.log('- Name:', ticket.name);
        console.log('- Price:', ticket.price);
        console.log('- Available:', ticket.available_count);
        console.log('- Display order:', ticket.display_order);
      }

      console.log('\nSummary:');
      console.log('- Min price:', data.summary?.min_price);
      console.log('- Max price:', data.summary?.max_price);
      console.log('- Total capacity:', data.summary?.total_capacity);
      console.log('- Tickets sold:', data.summary?.tickets_sold);
      console.log('- Is sold out:', data.summary?.is_sold_out);
    }

  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

testEventRPC();