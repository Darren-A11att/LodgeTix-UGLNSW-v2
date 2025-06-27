-- Add 'bookingcontact' to the attendee_contact_preference enum type
ALTER TYPE attendee_contact_preference ADD VALUE IF NOT EXISTS 'bookingcontact';

-- Add comment for documentation
COMMENT ON TYPE attendee_contact_preference IS 'Contact preference options including bookingcontact for delegation registrations';