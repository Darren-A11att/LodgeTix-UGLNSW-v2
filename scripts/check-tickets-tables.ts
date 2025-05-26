// Check ticket-related tables in the database
import { createClient } from '@supabase/supabase-js'

// Read environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://pwwpcjbbxotmiqrisjvf.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3d3BjamJieG90bWlxcmlzanZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU1NDg1NjgsImV4cCI6MjA2MTEyNDU2OH0.Ep3pzGlPgXbnTrcE84dIIbBxk-OsnXq7BSwL7vG-p3Q'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

const GRAND_PROCLAMATION_PARENT_ID = "307c2d85-72d5-48cf-ac94-082ca2a5d23d"

async function checkTables() {
  console.log('Checking ticket-related tables...\n')
  
  try {
    // 1. Check if parent event exists
    console.log('1. Checking parent event...')
    const { data: parentEvent, error: parentError } = await supabase
      .from('events')
      .select('id, title, slug')
      .eq('id', GRAND_PROCLAMATION_PARENT_ID)
      .single()
    
    if (parentError) {
      console.error('Error fetching parent event:', parentError)
    } else {
      console.log('✅ Parent event found:', parentEvent)
    }
    
    // 2. Check child events
    console.log('\n2. Checking child events...')
    const { data: childEvents, error: childError } = await supabase
      .from('events')
      .select('id, title, slug, parent_event_id')
      .eq('parent_event_id', GRAND_PROCLAMATION_PARENT_ID)
    
    if (childError) {
      console.error('Error fetching child events:', childError)
    } else {
      console.log(`✅ Found ${childEvents?.length || 0} child events:`)
      childEvents?.forEach(event => {
        console.log(`   - ${event.title} (${event.id})`)
      })
    }
    
    // 3. Check ticket_definitions table structure
    console.log('\n3. Checking ticket_definitions table...')
    const { data: sampleTicket, error: ticketError } = await supabase
      .from('ticket_definitions')
      .select('*')
      .limit(1)
      .single()
    
    if (ticketError && ticketError.code !== 'PGRST116') { // PGRST116 means no rows
      console.error('Error accessing ticket_definitions:', ticketError)
    } else if (sampleTicket) {
      console.log('✅ ticket_definitions table structure:')
      console.log('   Columns:', Object.keys(sampleTicket))
    } else {
      console.log('⚠️  ticket_definitions table is empty')
    }
    
    // 4. Check tickets for child events
    if (childEvents && childEvents.length > 0) {
      console.log('\n4. Checking tickets for child events...')
      const eventIds = childEvents.map(e => e.id)
      
      const { data: tickets, error: ticketsError } = await supabase
        .from('ticket_definitions')
        .select('id, name, price, event_id, is_active')
        .in('event_id', eventIds)
      
      if (ticketsError) {
        console.error('Error fetching tickets:', ticketsError)
      } else {
        console.log(`✅ Found ${tickets?.length || 0} tickets:`)
        tickets?.forEach(ticket => {
          const event = childEvents.find(e => e.id === ticket.event_id)
          console.log(`   - ${ticket.name} ($${ticket.price}) for ${event?.title || 'Unknown'} - Active: ${ticket.is_active}`)
        })
      }
    }
    
    // 5. Check eventpackages table
    console.log('\n5. Checking eventpackages table...')
    const { data: packages, error: packagesError } = await supabase
      .from('eventpackages')
      .select('*')
      .eq('parent_event_id', GRAND_PROCLAMATION_PARENT_ID)
    
    if (packagesError) {
      console.error('Error fetching packages:', packagesError)
    } else {
      console.log(`✅ Found ${packages?.length || 0} packages:`)
      packages?.forEach(pkg => {
        console.log(`   - ${pkg.name}: ${pkg.description}`)
      })
    }
    
    // 6. Alternative table names to check
    console.log('\n6. Checking alternative table names...')
    const tableNames = ['Tickets', 'TicketDefinitions', 'EventTickets', 'eventtickets']
    
    for (const tableName of tableNames) {
      try {
        const { count, error } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true })
        
        if (!error) {
          console.log(`   ✅ Table "${tableName}" exists with ${count} rows`)
        }
      } catch (e) {
        // Table doesn't exist
      }
    }
    
  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

// Run the check
checkTables()
  .then(() => {
    console.log('\n✅ Check complete!')
    process.exit(0)
  })
  .catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
  })