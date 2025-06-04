-- Add missing columns to registrations table for lodge registration support
-- These columns allow storing lodge-specific information directly in the table
-- instead of only in the JSONB registration_data field

-- Add organisation_name column
ALTER TABLE registrations
ADD COLUMN IF NOT EXISTS organisation_name TEXT;

-- Add organisation_number column  
ALTER TABLE registrations
ADD COLUMN IF NOT EXISTS organisation_number TEXT;

-- Add primary_attendee column (stores name as text, not ID)
ALTER TABLE registrations
ADD COLUMN IF NOT EXISTS primary_attendee TEXT;

-- Add attendee_count column
ALTER TABLE registrations
ADD COLUMN IF NOT EXISTS attendee_count INTEGER DEFAULT 0;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_registrations_organisation_name ON registrations(organisation_name);
CREATE INDEX IF NOT EXISTS idx_registrations_attendee_count ON registrations(attendee_count);

-- Add comments
COMMENT ON COLUMN registrations.organisation_name IS 'Name of the organisation/lodge for lodge registrations';
COMMENT ON COLUMN registrations.organisation_number IS 'Number/ID of the organisation/lodge for lodge registrations';
COMMENT ON COLUMN registrations.primary_attendee IS 'Name of the primary attendee/representative (text, not foreign key)';
COMMENT ON COLUMN registrations.attendee_count IS 'Total number of attendees for the registration';

-- Migrate existing data from registration_data JSONB to new columns
UPDATE registrations
SET 
    organisation_name = COALESCE(
        organisation_name,
        registration_data->0->>'lodge_name',
        registration_data->0->'lodge_details'->>'lodgeName'
    ),
    organisation_number = COALESCE(
        organisation_number,
        registration_data->0->>'lodge_number',
        registration_data->0->'lodge_details'->>'lodgeNumber'
    ),
    primary_attendee = COALESCE(
        primary_attendee,
        registration_data->0->>'primary_attendee_name',
        registration_data->0->'booking_contact'->>'firstName' || ' ' || registration_data->0->'booking_contact'->>'lastName'
    ),
    attendee_count = COALESCE(
        attendee_count,
        (registration_data->0->>'total_attendees')::INTEGER,
        (registration_data->0->>'table_count')::INTEGER * 10 -- Default 10 per table
    )
WHERE registration_type = 'lodge' 
  AND (organisation_name IS NULL OR primary_attendee IS NULL OR attendee_count = 0);