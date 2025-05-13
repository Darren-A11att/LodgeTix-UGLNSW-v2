/**
 * Migration script to convert string ID events to UUID-based events with slugs
 * 
 * This script:
 * 1. Reads all events from the existing data source
 * 2. Generates a UUID for each event
 * 3. Creates a mapping between legacy IDs and new UUIDs
 * 4. Uses the legacy ID as the initial slug (or generates one from the title)
 * 5. Updates all related records (tickets, registrations, etc.)
 * 6. Generates a mapping file for client-side fallback
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Ensure you have these environment variables set
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY; // Use service key for admin access

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables must be set.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Generate a URL-friendly slug from a title
 */
function generateSlug(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove non-word chars
    .replace(/[\s_-]+/g, '-')  // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, '');  // Remove leading/trailing hyphens
}

/**
 * Main migration function
 */
async function migrateEvents() {
  console.log('Starting event migration to UUID/slug system...');
  
  try {
    // 1. Fetch all existing events
    const { data: events, error: fetchError } = await supabase
      .from('Events')
      .select('*');
    
    if (fetchError) {
      throw new Error(`Error fetching events: ${fetchError.message}`);
    }
    
    console.log(`Found ${events.length} events to migrate`);
    
    // 2. Create mapping between legacy IDs and new UUIDs
    const mapping = {};
    const updates = [];
    
    for (const event of events) {
      const legacyId = event.id;
      const newUuid = uuidv4();
      const slug = event.slug || generateSlug(event.title);
      
      mapping[legacyId] = {
        uuid: newUuid,
        slug
      };
      
      // Prepare the update operation
      updates.push({
        id: legacyId,
        newId: newUuid,
        slug
      });
    }
    
    // 3. Start a transaction for the migration
    // Note: This is a simplified version. In production, you'd want to use a proper transaction
    
    // 3.1 Create temporary UUID column and populate it
    console.log('Adding UUID column to Events table...');
    await supabase.rpc('add_uuid_column_to_events');
    
    // 3.2 Update each event with its new UUID and slug
    console.log('Updating events with UUIDs and slugs...');
    for (const update of updates) {
      const { error: updateError } = await supabase
        .from('Events')
        .update({ 
          uuid_col: update.newId,
          slug: update.slug 
        })
        .eq('id', update.id);
        
      if (updateError) {
        throw new Error(`Error updating event ${update.id}: ${updateError.message}`);
      }
    }
    
    // 3.3 Update related tables to reference the new UUIDs
    console.log('Updating related tables...');
    
    // Update Tickets
    await supabase.rpc('update_ticket_event_references');
    
    // Update Registrations
    await supabase.rpc('update_registration_event_references');
    
    // Other tables that reference events...
    
    // 3.4 Swap the ID column with the UUID column
    console.log('Finalizing migration - swapping ID column...');
    await supabase.rpc('swap_event_id_with_uuid');
    
    // 4. Create a mapping file for client-side reference
    const mappingFilePath = path.join(__dirname, '..', 'lib', 'legacy-event-id-mapping.json');
    fs.writeFileSync(mappingFilePath, JSON.stringify(mapping, null, 2));
    
    console.log('Migration completed successfully!');
    console.log(`Mapping file created at ${mappingFilePath}`);
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
migrateEvents();