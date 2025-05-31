import { createClient } from '@supabase/supabase-js';

// Use the environment variables directly
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://pwwpcjbbxotmiqrisjvf.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3d3BjamJieG90bWlxcmlzanZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU1NDg1NjgsImV4cCI6MjA2MTEyNDU2OH0.Ep3pzGlPgXbnTrcE84dIIbBxk-OsnXq7BSwL7vG-p3Q';

console.log('Testing RPC function get_event_with_details');
console.log('Supabase URL:', supabaseUrl);
console.log('---');

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testRPCFunction() {
  try {
    // Test with a known event slug
    const testSlug = 'grand-proclamation-2025'; // Using actual event slug from database
    
    console.log('Calling get_event_with_details with slug:', testSlug);
    
    const { data, error } = await supabase.rpc('get_event_with_details', {
      event_slug: testSlug
    });
    
    if (error) {
      console.error('Error calling RPC function:');
      console.error('Message:', error.message);
      console.error('Code:', error.code);
      console.error('Details:', error.details);
      console.error('Hint:', error.hint);
      console.error('Full error:', JSON.stringify(error, null, 2));
    } else {
      console.log('Success! Function returned:');
      console.log(JSON.stringify(data, null, 2));
    }
    
    // Also test the database connection by checking the functions table
    console.log('\n---');
    console.log('Checking database functions...');
    
    const { data: functions, error: functionsError } = await supabase
      .rpc('pg_catalog.pg_proc', {})
      .select('proname')
      .eq('proname', 'get_event_with_details');
    
    if (functionsError) {
      // Try an alternative approach
      const { data: tableCheck, error: tableError } = await supabase
        .from('events')
        .select('event_id')
        .limit(1);
        
      if (tableError) {
        console.error('Cannot access database:', tableError.message);
      } else {
        console.log('Database connection successful');
        console.log('Sample event ID:', tableCheck?.[0]?.event_id);
      }
    } else {
      console.log('Function exists in database:', functions);
    }
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

testRPCFunction();