-- Create extension for UUID generation if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Function to add a UUID column to the Events table
CREATE OR REPLACE FUNCTION add_uuid_column_to_events()
RETURNS VOID AS $$
BEGIN
  -- Add UUID column to Events table if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'Events' AND column_name = 'uuid_col'
  ) THEN
    ALTER TABLE "Events" ADD COLUMN uuid_col UUID;
  END IF;
  
  -- Add slug column to Events table if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'Events' AND column_name = 'slug'
  ) THEN
    ALTER TABLE "Events" ADD COLUMN slug TEXT;
  END IF;

  -- Create index on the new UUID column for performance
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE indexname = 'idx_events_uuid_col'
  ) THEN
    CREATE INDEX idx_events_uuid_col ON "Events"(uuid_col);
  END IF;
  
  -- Create index on the slug column
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE indexname = 'idx_events_slug'
  ) THEN
    CREATE INDEX idx_events_slug ON "Events"(slug);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to update ticket references to use the new event UUIDs
CREATE OR REPLACE FUNCTION update_ticket_event_references()
RETURNS VOID AS $$
BEGIN
  -- Add temporary UUID column to the tickets table
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'ticket_definitions' AND column_name = 'event_uuid'
  ) THEN
    ALTER TABLE "ticket_definitions" ADD COLUMN event_uuid UUID;
  END IF;

  -- Update the UUID column to reference the Events uuid_col
  UPDATE "ticket_definitions" t
  SET event_uuid = e.uuid_col
  FROM "Events" e
  WHERE t.event_id = e.id;
  
  -- Create index on the new event_uuid column
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE indexname = 'idx_ticket_definitions_event_uuid'
  ) THEN
    CREATE INDEX idx_ticket_definitions_event_uuid ON "ticket_definitions"(event_uuid);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to update registration references to use the new event UUIDs
CREATE OR REPLACE FUNCTION update_registration_event_references()
RETURNS VOID AS $$
BEGIN
  -- Add temporary UUID column to the Registrations table
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'Registrations' AND column_name = 'event_uuid'
  ) THEN
    ALTER TABLE "Registrations" ADD COLUMN event_uuid UUID;
  END IF;

  -- Update the UUID column to reference the Events uuid_col
  UPDATE "Registrations" r
  SET event_uuid = e.uuid_col
  FROM "Events" e
  WHERE r."eventId" = e.id::text;
  
  -- Create index on the new event_uuid column
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE indexname = 'idx_registrations_event_uuid'
  ) THEN
    CREATE INDEX idx_registrations_event_uuid ON "Registrations"(event_uuid);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to swap the ID column with the UUID column once everything is updated
CREATE OR REPLACE FUNCTION swap_event_id_with_uuid()
RETURNS VOID AS $$
BEGIN
  -- Store the old IDs for reference
  CREATE TABLE IF NOT EXISTS "LegacyEventIds" (
    legacy_id TEXT PRIMARY KEY,
    uuid UUID NOT NULL,
    slug TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
  
  -- Insert the mapping into the legacy table
  INSERT INTO "LegacyEventIds" (legacy_id, uuid, slug)
  SELECT id::text, uuid_col, slug
  FROM "Events"
  ON CONFLICT (legacy_id) DO NOTHING;
  
  -- Now perform the swap
  
  -- 1. Drop existing foreign key constraints
  ALTER TABLE "ticket_definitions" DROP CONSTRAINT IF EXISTS ticket_definitions_event_id_fkey;
  ALTER TABLE "Registrations" DROP CONSTRAINT IF EXISTS registrations_consolidated_eventId_fkey;
  
  -- 2. Rename ID column and make uuid_col the new primary key
  --    NOTE: This is a simplified example - in production, you would want to create
  --    a new table with the correct structure and migrate data
  ALTER TABLE "Events" DROP CONSTRAINT IF EXISTS events_pkey;
  ALTER TABLE "Events" RENAME COLUMN id TO legacy_id;
  ALTER TABLE "Events" RENAME COLUMN uuid_col TO id;
  ALTER TABLE "Events" ADD PRIMARY KEY (id);
  
  -- 3. Update the related tables to use the new UUIDs
  -- For ticket_definitions
  ALTER TABLE "ticket_definitions" DROP COLUMN IF EXISTS event_id;
  ALTER TABLE "ticket_definitions" RENAME COLUMN event_uuid TO event_id;
  ALTER TABLE "ticket_definitions" ADD CONSTRAINT ticket_definitions_event_id_fkey 
    FOREIGN KEY (event_id) REFERENCES "Events"(id);
  
  -- For registrations
  ALTER TABLE "Registrations" DROP COLUMN IF EXISTS "eventId";
  ALTER TABLE "Registrations" RENAME COLUMN event_uuid TO "eventId";
  ALTER TABLE "Registrations" ADD CONSTRAINT registrations_consolidated_eventId_fkey 
    FOREIGN KEY ("eventId") REFERENCES "Events"(id);
  
  -- 4. Add a unique constraint on the slug
  ALTER TABLE "Events" ADD CONSTRAINT events_slug_unique UNIQUE (slug);
  
  -- 5. Clean up the temporary schema changes
  DROP INDEX IF EXISTS idx_events_uuid_col;
  DROP INDEX IF EXISTS idx_ticket_definitions_event_uuid;
  DROP INDEX IF EXISTS idx_registrations_event_uuid;
END;
$$ LANGUAGE plpgsql;