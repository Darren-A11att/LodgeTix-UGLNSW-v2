// Seed Events into the new events.events table
import { createClient } from '@supabase/supabase-js'
import { getEvents } from '@/lib/event-utils'

// Initialize Supabase client with service role for schema access
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    db: {
      schema: 'events' // Use the events schema
    }
  }
)

// Define the event structure for the new schema
interface EventsSchemaEvent {
  id?: string
  slug: string
  title: string
  subtitle?: string
  description: string
  event_start: string
  event_end?: string
  location: any
  category?: string
  type?: string
  degree_type?: string
  dress_code?: string
  regalia?: string
  regalia_description?: string
  image_url?: string
  organizer_id?: string
  organizer_name?: string
  organizer_contact?: any
  is_published: boolean
  featured: boolean
  eligibility_requirements?: string[]
  sections?: any
  attendance?: any
  documents?: any
  related_events?: string[]
  legacy_id: string
  parent_event_id?: string
}

async function seedEventsSchema() {
  console.log('Starting migration to events.events table...')
  
  // Get hard-coded events
  const hardCodedEvents = getEvents()
  console.log(`Found ${hardCodedEvents.length} events to migrate`)
  
  // Process each event
  for (const event of hardCodedEvents) {
    console.log(`Migrating event: ${event.title} (${event.slug})`)
    
    try {
      // Parse date and time
      const eventDate = new Date(event.date)
      const eventStart = new Date(event.date)
      const eventEnd = new Date(event.date)
      
      // Set times if available
      if (event.time) {
        const [hours, minutes] = event.time.split(':')
        eventStart.setHours(parseInt(hours), parseInt(minutes))
        eventEnd.setHours(parseInt(hours) + 3, parseInt(minutes)) // Default 3 hour duration
      }
      
      // Transform to new schema format
      const transformedEvent: EventsSchemaEvent = {
        slug: event.slug,
        title: event.title,
        description: event.description,
        event_start: eventStart.toISOString(),
        event_end: eventEnd.toISOString(),
        location: {
          name: event.location,
          address: null,
          city: null,
          state: null,
          postal_code: null,
          country: null
        },
        category: event.category,
        type: event.category,
        degree_type: event.degreeType,
        dress_code: event.dressCode,
        regalia: event.regalia,
        image_url: event.imageUrl,
        organizer_name: event.organizer,
        is_published: event.status === 'Published',
        featured: true,
        legacy_id: event.id
      }
      
      // Insert into events.events
      const { data, error } = await supabase
        .from('events')
        .upsert(transformedEvent, { 
          onConflict: 'slug',
          ignoreDuplicates: false 
        })
        .select()
        .single()
      
      if (error) {
        console.error(`Error migrating event ${event.slug}:`, error)
      } else {
        console.log(`Successfully migrated event: ${event.slug}`)
      }
      
    } catch (err) {
      console.error(`Failed to process event ${event.slug}:`, err)
    }
  }
  
  console.log('Migration to events.events completed!')
}

// Seed from the markdown file with full event data
async function seedFromEventDataFile() {
  console.log('Seeding from events data file...')
  
  // This would read from the events-data-updated.md file
  // and parse the JSON blocks to get full event information
  // Including sections, documents, schedules, etc.
  
  const fs = require('fs')
  const path = require('path')
  
  try {
    const dataPath = path.join(__dirname, '../docs/Application-Data/events-data-updated.md')
    const fileContent = fs.readFileSync(dataPath, 'utf-8')
    
    // Extract JSON blocks
    const jsonBlocks = fileContent.match(/```json([\s\S]*?)```/g) || []
    
    for (const block of jsonBlocks) {
      const jsonString = block.replace(/```json\n/, '').replace(/\n```/, '')
      try {
        const event = JSON.parse(jsonString)
        
        // Only process event objects (not mappings)
        if (event.title && event.slug && event.startDate) {
          await seedFullEvent(event)
        }
      } catch (parseError) {
        console.error('Error parsing JSON:', parseError)
      }
    }
  } catch (error) {
    console.error('Error reading file:', error)
  }
}

async function seedFullEvent(eventData: any) {
  console.log(`Seeding full event: ${eventData.title}`)
  
  const eventStart = new Date(`${eventData.startDate} ${eventData.startTime}`)
  const eventEnd = eventData.endDate 
    ? new Date(`${eventData.endDate} ${eventData.endTime}`)
    : new Date(`${eventData.startDate} ${eventData.endTime}`)
  
  const transformedEvent: EventsSchemaEvent = {
    id: eventData.id,
    slug: eventData.slug,
    title: eventData.title,
    subtitle: eventData.subtitle,
    description: eventData.description,
    event_start: eventStart.toISOString(),
    event_end: eventEnd.toISOString(),
    location: eventData.location,
    category: eventData.category,
    type: eventData.category,
    degree_type: eventData.degreeType,
    dress_code: eventData.dressCode,
    regalia: eventData.regalia,
    regalia_description: eventData.regaliaDescription,
    image_url: eventData.imageSrc,
    organizer_id: eventData.organizerId,
    organizer_name: eventData.organizerName,
    organizer_contact: eventData.organizerContact,
    is_published: eventData.isPublished !== false,
    featured: true,
    eligibility_requirements: eventData.eligibilityRequirements,
    sections: eventData.sections,
    attendance: eventData.attendance,
    documents: eventData.documents,
    related_events: eventData.relatedEvents?.map((e: any) => e.id),
    legacy_id: eventData.legacyId || eventData.id,
    parent_event_id: eventData.parentEventId
  }
  
  const { error } = await supabase
    .from('events')
    .upsert(transformedEvent, { onConflict: 'id' })
    .select()
    .single()
  
  if (error) {
    console.error(`Error seeding event ${eventData.slug}:`, error)
  } else {
    console.log(`Successfully seeded event: ${eventData.slug}`)
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2)
  
  if (args.includes('--full')) {
    // Seed from the complete event data file
    await seedFromEventDataFile()
  } else {
    // Just migrate hard-coded events
    await seedEventsSchema()
  }
}

main()
  .then(() => {
    console.log('Seeding completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })