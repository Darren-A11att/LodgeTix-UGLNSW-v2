import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testColumnNameFixes() {
  console.log('Testing column name fixes...\n');
  
  const tests = [
    {
      name: 'Test event_tickets table access',
      test: async () => {
        const { data, error } = await supabase
          .from('event_tickets')
          .select('event_ticket_id, name, price')
          .limit(1);
        
        if (error) throw error;
        if (data && data.length > 0) {
          console.log('✓ event_tickets: event_ticket_id accessible');
          console.log(`  Sample: ${data[0].event_ticket_id} - ${data[0].name}`);
        }
      }
    },
    {
      name: 'Test tickets table access',
      test: async () => {
        const { data, error } = await supabase
          .from('tickets')
          .select('ticket_id, status, price_paid')
          .limit(1);
        
        if (error) throw error;
        if (data && data.length > 0) {
          console.log('✓ tickets: ticket_id accessible');
          console.log(`  Sample: ${data[0].ticket_id} - ${data[0].status}`);
        }
      }
    },
    {
      name: 'Test events table access',
      test: async () => {
        const { data, error } = await supabase
          .from('events')
          .select('event_id, title, slug')
          .limit(1);
        
        if (error) throw error;
        if (data && data.length > 0) {
          console.log('✓ events: event_id accessible');
          console.log(`  Sample: ${data[0].event_id} - ${data[0].title}`);
        }
      }
    },
    {
      name: 'Test registrations table access',
      test: async () => {
        const { data, error } = await supabase
          .from('registrations')
          .select('registration_id, status, created_at')
          .limit(1);
        
        if (error) throw error;
        if (data && data.length > 0) {
          console.log('✓ registrations: registration_id accessible');
          console.log(`  Sample: ${data[0].registration_id} - ${data[0].status}`);
        }
      }
    },
    {
      name: 'Test RPC function with correct column names',
      test: async () => {
        // Get a test event slug
        const { data: events } = await supabase
          .from('events')
          .select('slug')
          .eq('is_published', true)
          .limit(1);
        
        if (events && events.length > 0) {
          const { data, error } = await supabase.rpc('get_event_with_details', {
            p_event_slug: events[0].slug
          });
          
          if (error) throw error;
          if (data && data.tickets && data.tickets.length > 0) {
            console.log('✓ RPC function returns correct ticket structure');
            console.log(`  First ticket ID: ${data.tickets[0].id || data.tickets[0].event_ticket_id}`);
          } else {
            console.log('✓ RPC function executed (no tickets to verify)');
          }
        }
      }
    }
  ];
  
  // Run all tests
  for (const { name, test } of tests) {
    console.log(`\nRunning: ${name}`);
    try {
      await test();
    } catch (error: any) {
      console.error(`✗ Failed: ${error.message}`);
      if (error.code === '42703') {
        console.error('  Column not found error - fix still needed');
      }
    }
  }
  
  // Test query with joins
  console.log('\n\nTesting complex query with joins:');
  try {
    const { data, error } = await supabase
      .from('tickets')
      .select(`
        ticket_id,
        status,
        event:events!event_id (
          event_id,
          title
        ),
        attendee:attendees!attendee_id (
          attendee_id,
          first_name,
          last_name
        )
      `)
      .limit(1);
    
    if (error) throw error;
    if (data && data.length > 0) {
      console.log('✓ Complex joins work with correct column names');
      console.log(`  Ticket: ${data[0].ticket_id}`);
      console.log(`  Event: ${data[0].event?.title || 'N/A'}`);
      console.log(`  Attendee: ${data[0].attendee?.first_name || 'N/A'} ${data[0].attendee?.last_name || ''}`);
    }
  } catch (error: any) {
    console.error('✗ Complex query failed:', error.message);
  }
  
  console.log('\n\n✅ Column name fix testing complete!');
}

testColumnNameFixes();