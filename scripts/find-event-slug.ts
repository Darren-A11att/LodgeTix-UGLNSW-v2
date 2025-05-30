import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pwwpcjbbxotmiqrisjvf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3d3BjamJieG90bWlxcmlzanZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU1NDg1NjgsImV4cCI6MjA2MTEyNDU2OH0.Ep3pzGlPgXbnTrcE84dIIbBxk-OsnXq7BSwL7vG-p3Q';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function findEventSlug() {
  const { data, error } = await supabase
    .from('events')
    .select('slug, title')
    .limit(5);
    
  if (error) {
    console.error('Error fetching events:', error);
  } else {
    console.log('Available event slugs:');
    data?.forEach(event => {
      console.log(`- ${event.slug} (${event.title})`);
    });
  }
}

findEventSlug();
EOF < /dev/null