-- Helper functions for RLS policies to improve performance and maintainability

-- Function to check if a user is an event organizer
CREATE OR REPLACE FUNCTION auth.is_event_organizer(event_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM events e
    JOIN contacts c ON c.organisation_id = e.organiser_id
    WHERE e.event_id = event_uuid
    AND c.auth_user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if a user owns a registration
CREATE OR REPLACE FUNCTION auth.owns_registration(reg_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM registrations r
    JOIN contacts c ON c.contact_id = r.contact_id
    WHERE r.registration_id = reg_uuid
    AND c.auth_user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's contact_id
CREATE OR REPLACE FUNCTION auth.get_user_contact_id()
RETURNS UUID AS $$
DECLARE
  contact_uuid UUID;
BEGIN
  SELECT contact_id INTO contact_uuid
  FROM contacts
  WHERE auth_user_id = auth.uid()
  LIMIT 1;
  
  RETURN contact_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's organization_ids
CREATE OR REPLACE FUNCTION auth.get_user_organisation_ids()
RETURNS SETOF UUID AS $$
BEGIN
  RETURN QUERY
  SELECT organisation_id
  FROM contacts
  WHERE auth_user_id = auth.uid()
  AND organisation_id IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if registration is editable
CREATE OR REPLACE FUNCTION auth.is_registration_editable(reg_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM registrations
    WHERE registration_id = reg_uuid
    AND payment_status = 'pending'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes to improve RLS performance
CREATE INDEX IF NOT EXISTS idx_contacts_auth_user_id ON contacts(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_organisation_id ON contacts(organisation_id);
CREATE INDEX IF NOT EXISTS idx_registrations_contact_id ON registrations(contact_id);
CREATE INDEX IF NOT EXISTS idx_registrations_payment_status ON registrations(payment_status);
CREATE INDEX IF NOT EXISTS idx_events_organiser_id ON events(organiser_id);
CREATE INDEX IF NOT EXISTS idx_events_is_published ON events(is_published);
CREATE INDEX IF NOT EXISTS idx_tickets_registration_id ON tickets(registration_id);
CREATE INDEX IF NOT EXISTS idx_tickets_event_id ON tickets(event_id);
CREATE INDEX IF NOT EXISTS idx_attendees_registration_id ON attendees(registration_id);

-- Grant execute permissions on helper functions
GRANT EXECUTE ON FUNCTION auth.is_event_organizer(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION auth.owns_registration(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION auth.get_user_contact_id() TO authenticated;
GRANT EXECUTE ON FUNCTION auth.get_user_organisation_ids() TO authenticated;
GRANT EXECUTE ON FUNCTION auth.is_registration_editable(UUID) TO authenticated;