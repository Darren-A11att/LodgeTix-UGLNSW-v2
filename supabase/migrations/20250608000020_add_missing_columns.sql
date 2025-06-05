-- Add missing columns identified in field mapping audit

-- Add masonic_status column to attendees table
ALTER TABLE attendees ADD COLUMN IF NOT EXISTS masonic_status jsonb;

-- Add event_id column to registrations table
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS event_id uuid REFERENCES events(event_id);

-- Add booking_contact_id column to registrations table  
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS booking_contact_id uuid REFERENCES customers(customer_id);

-- Add comments for documentation
COMMENT ON COLUMN attendees.masonic_status IS 'JSON data for storing mason-specific information like grand lodge, lodge details, etc.';
COMMENT ON COLUMN registrations.event_id IS 'Reference to the specific event (if applicable)';
COMMENT ON COLUMN registrations.booking_contact_id IS 'Reference to the booking contact customer record';