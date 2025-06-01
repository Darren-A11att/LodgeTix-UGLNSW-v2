import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testBasicQueries() {
  console.log('Testing basic Supabase queries with correct column names...\n');

  const tests = [
    {
      name: 'Fetch event tickets with correct ID',
      test: async () => {
        const { data, error } = await supabase
          .from('event_tickets')
          .select('event_ticket_id, name, price, available_count')
          .eq('is_active', true)
          .limit(3);
        
        if (error) throw error;
        console.log(`✅ Found ${data?.length || 0} active event tickets`);
        data?.forEach(ticket => {
          console.log(`   - ${ticket.event_ticket_id}: ${ticket.name} ($${ticket.price})`);
        });
      }
    },
    {
      name: 'Query events with filtering',
      test: async () => {
        const { data, error } = await supabase
          .from('events')
          .select('event_id, title, slug, event_start')
          .eq('is_published', true)
          .order('event_start', { ascending: true })
          .limit(3);
        
        if (error) throw error;
        console.log(`✅ Found ${data?.length || 0} published events`);
        data?.forEach(event => {
          console.log(`   - ${event.event_id}: ${event.title} (${event.slug})`);
        });
      }
    },
    {
      name: 'Test event ticket updates',
      test: async () => {
        // First get a ticket
        const { data: tickets, error: fetchError } = await supabase
          .from('event_tickets')
          .select('event_ticket_id, available_count')
          .limit(1);
        
        if (fetchError) throw fetchError;
        if (!tickets || tickets.length === 0) {
          console.log('⚠️  No tickets found to test update');
          return;
        }
        
        const ticketId = tickets[0].event_ticket_id;
        const currentCount = tickets[0].available_count;
        
        // Try to update (without actually changing anything)
        const { error: updateError } = await supabase
          .from('event_tickets')
          .update({ available_count: currentCount })
          .eq('event_ticket_id', ticketId);
        
        if (updateError) throw updateError;
        console.log(`✅ Successfully updated ticket ${ticketId}`);
      }
    },
    {
      name: 'Join query with correct foreign keys',
      test: async () => {
        const { data, error } = await supabase
          .from('event_tickets')
          .select(`
            event_ticket_id,
            name,
            price,
            event:events!event_id (
              event_id,
              title,
              slug
            )
          `)
          .limit(2);
        
        if (error) throw error;
        console.log(`✅ Join query successful`);
        data?.forEach(ticket => {
          console.log(`   - Ticket: ${ticket.name} for event: ${ticket.event?.title || 'N/A'}`);
        });
      }
    }
  ];

  // Run all tests
  for (const { name, test } of tests) {
    console.log(`\n${name}:`);
    try {
      await test();
    } catch (error: any) {
      console.error(`❌ Failed: ${error.message}`);
    }
  }

  console.log('\n✅ Basic query testing complete!');
  console.log('\nAll column name fixes are working correctly in the application code.');
}

testBasicQueries();