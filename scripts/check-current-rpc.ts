import { createClient } from '@supabase/supabase-js';

// Set environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://pwwpcjbbxotmiqrisjvf.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3d3BjamJieG90bWlxcmlzanZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU1NDg1NjgsImV4cCI6MjA2MTEyNDU2OH0.Ep3pzGlPgXbnTrcE84dIIbBxk-OsnXq7BSwL7vG-p3Q';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkCurrentRPC() {
  console.log('=== Checking Current RPC Function ===\n');
  
  // Check if we can query the information_schema
  const { data, error } = await supabase
    .from('information_schema.routines')
    .select('routine_name, routine_definition')
    .eq('routine_name', 'get_event_with_details')
    .single();
    
  if (error) {
    console.log('Cannot access information_schema, trying alternative approach...\n');
    
    // Try a simple test of the function with a different slug
    const slugs = ['grand-communication-2025', 'grand-proclamation-2025'];
    
    for (const slug of slugs) {
      console.log(`Testing with slug: ${slug}`);
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_event_with_details', {
        p_event_slug: slug
      });
      
      if (rpcError) {
        console.error(`- Error: ${rpcError.message}`);
      } else {
        console.log(`- Success! Returned data structure:`);
        console.log(`  - Has event: ${!!rpcData?.event}`);
        console.log(`  - Has location: ${!!rpcData?.location}`);
        console.log(`  - Has child_events: ${!!rpcData?.child_events} (count: ${rpcData?.child_events?.length || 0})`);
        console.log(`  - Has packages: ${!!rpcData?.packages} (count: ${rpcData?.packages?.length || 0})`);
        console.log(`  - Has ticket_types: ${!!rpcData?.ticket_types} (count: ${rpcData?.ticket_types?.length || 0})`);
      }
      console.log('');
    }
  } else {
    console.log('Function definition:', data?.routine_definition);
  }
}

checkCurrentRPC().catch(console.error);