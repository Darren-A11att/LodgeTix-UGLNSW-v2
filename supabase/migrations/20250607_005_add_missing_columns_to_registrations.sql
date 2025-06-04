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
-- Using proper JSONB navigation syntax
UPDATE registrations
SET 
    organisation_name = CASE
        WHEN organisation_name IS NOT NULL THEN organisation_name
        WHEN jsonb_array_length(registration_data) > 0 AND registration_data->0->>'lodge_name' IS NOT NULL 
            THEN registration_data->0->>'lodge_name'
        WHEN jsonb_array_length(registration_data) > 0 AND registration_data->0->'lodge_details'->>'lodgeName' IS NOT NULL
            THEN registration_data->0->'lodge_details'->>'lodgeName'
        ELSE organisation_name
    END,
    organisation_number = CASE
        WHEN organisation_number IS NOT NULL THEN organisation_number
        WHEN jsonb_array_length(registration_data) > 0 AND registration_data->0->>'lodge_number' IS NOT NULL
            THEN registration_data->0->>'lodge_number'
        WHEN jsonb_array_length(registration_data) > 0 AND registration_data->0->'lodge_details'->>'lodgeNumber' IS NOT NULL
            THEN registration_data->0->'lodge_details'->>'lodgeNumber'
        ELSE organisation_number
    END,
    primary_attendee = CASE
        WHEN primary_attendee IS NOT NULL THEN primary_attendee
        WHEN jsonb_array_length(registration_data) > 0 AND registration_data->0->>'primary_attendee_name' IS NOT NULL
            THEN registration_data->0->>'primary_attendee_name'
        WHEN jsonb_array_length(registration_data) > 0 
            AND registration_data->0->'booking_contact' IS NOT NULL
            AND registration_data->0->'booking_contact'->>'firstName' IS NOT NULL
            THEN CONCAT(
                COALESCE(registration_data->0->'booking_contact'->>'firstName', ''),
                ' ',
                COALESCE(registration_data->0->'booking_contact'->>'lastName', '')
            )
        ELSE primary_attendee
    END,
    attendee_count = CASE
        WHEN attendee_count IS NOT NULL AND attendee_count > 0 THEN attendee_count
        WHEN jsonb_array_length(registration_data) > 0 AND registration_data->0->>'total_attendees' IS NOT NULL
            THEN (registration_data->0->>'total_attendees')::INTEGER
        WHEN jsonb_array_length(registration_data) > 0 AND registration_data->0->>'table_count' IS NOT NULL
            THEN (registration_data->0->>'table_count')::INTEGER * 10
        ELSE COALESCE(attendee_count, 0)
    END
WHERE registration_type = 'lodge' 
  AND registration_data IS NOT NULL
  AND jsonb_typeof(registration_data) = 'array';