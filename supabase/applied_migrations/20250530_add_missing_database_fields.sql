-- Migration: Add missing database fields referenced in code
-- Date: 2025-05-30

-- ============================================================================
-- 1. EVENTS TABLE ADDITIONS
-- ============================================================================

-- Add banner_image_url for hero images
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS banner_image_url TEXT;

-- Add long_description for detailed content
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS long_description TEXT;

-- Add location computed column
-- Note: Since we have location_id referencing locations table, we'll create a view or function instead
-- The actual location string can be computed from the locations table

COMMENT ON COLUMN public.events.banner_image_url IS 'URL for the event banner/hero image';
COMMENT ON COLUMN public.events.long_description IS 'Detailed description of the event (supports markdown)';

-- ============================================================================
-- 2. TICKETS TABLE ADDITIONS
-- ============================================================================

-- qr_code_url already exists (added in add_qr_code_url_to_tickets.sql)
-- Add qr_code_generated_at timestamp
ALTER TABLE public.tickets 
ADD COLUMN IF NOT EXISTS qr_code_generated_at TIMESTAMP WITH TIME ZONE;

-- Add confirmation_sent_at timestamp
ALTER TABLE public.tickets 
ADD COLUMN IF NOT EXISTS confirmation_sent_at TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN public.tickets.qr_code_generated_at IS 'Timestamp when QR code was generated';
COMMENT ON COLUMN public.tickets.confirmation_sent_at IS 'Timestamp when ticket confirmation was sent';

-- ============================================================================
-- 3. REGISTRATIONS TABLE ADDITIONS
-- ============================================================================

-- Add confirmation_sent_at timestamp
ALTER TABLE public.registrations 
ADD COLUMN IF NOT EXISTS confirmation_sent_at TIMESTAMP WITH TIME ZONE;

-- Add reminder_sent_at timestamp
ALTER TABLE public.registrations 
ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMP WITH TIME ZONE;

-- Add registration_metadata JSONB for flexible data
ALTER TABLE public.registrations 
ADD COLUMN IF NOT EXISTS registration_metadata JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.registrations.confirmation_sent_at IS 'Timestamp when registration confirmation email was sent';
COMMENT ON COLUMN public.registrations.reminder_sent_at IS 'Timestamp when registration reminder email was sent';
COMMENT ON COLUMN public.registrations.registration_metadata IS 'Flexible JSON storage for additional registration data';

-- ============================================================================
-- 4. CREATE EMAIL LOG TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.email_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id UUID REFERENCES registrations(registration_id),
  email_type VARCHAR(50) NOT NULL,
  recipient_email TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'sent',
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for email_log
CREATE INDEX IF NOT EXISTS idx_email_log_registration_id ON public.email_log(registration_id);
CREATE INDEX IF NOT EXISTS idx_email_log_email_type ON public.email_log(email_type);
CREATE INDEX IF NOT EXISTS idx_email_log_sent_at ON public.email_log(sent_at);
CREATE INDEX IF NOT EXISTS idx_email_log_status ON public.email_log(status);

COMMENT ON TABLE public.email_log IS 'Log of all emails sent by the system';
COMMENT ON COLUMN public.email_log.email_type IS 'Type of email (confirmation, reminder, etc.)';
COMMENT ON COLUMN public.email_log.status IS 'Email delivery status (sent, failed, bounced)';

-- ============================================================================
-- 5. CREATE DOCUMENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id UUID REFERENCES registrations(registration_id),
  document_type VARCHAR(50) NOT NULL,
  storage_path TEXT NOT NULL,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for documents
CREATE INDEX IF NOT EXISTS idx_documents_registration_id ON public.documents(registration_id);
CREATE INDEX IF NOT EXISTS idx_documents_document_type ON public.documents(document_type);
CREATE INDEX IF NOT EXISTS idx_documents_expires_at ON public.documents(expires_at) WHERE expires_at IS NOT NULL;

COMMENT ON TABLE public.documents IS 'Storage for generated documents (PDFs, etc.)';
COMMENT ON COLUMN public.documents.document_type IS 'Type of document (ticket_pdf, confirmation_pdf, etc.)';
COMMENT ON COLUMN public.documents.storage_path IS 'Path or URL to the stored document';
COMMENT ON COLUMN public.documents.expires_at IS 'When the document should be deleted or is no longer valid';

-- ============================================================================
-- 6. DATA TYPE FIXES
-- ============================================================================

-- Fix is_partner field in attendees table (change from TEXT to BOOLEAN)
-- First, we need to convert existing data
UPDATE public.attendees 
SET is_partner = NULL 
WHERE is_partner NOT IN ('true', 'false', 't', 'f', '1', '0');

-- Create a temporary column
ALTER TABLE public.attendees 
ADD COLUMN IF NOT EXISTS is_partner_bool BOOLEAN;

-- Convert existing data
UPDATE public.attendees 
SET is_partner_bool = CASE 
  WHEN is_partner IN ('true', 't', '1') THEN TRUE
  WHEN is_partner IN ('false', 'f', '0') THEN FALSE
  ELSE NULL
END;

-- Drop the old column and rename the new one
ALTER TABLE public.attendees DROP COLUMN IF EXISTS is_partner;
ALTER TABLE public.attendees RENAME COLUMN is_partner_bool TO is_partner;

COMMENT ON COLUMN public.attendees.is_partner IS 'Whether this attendee is a partner of another attendee';

-- ============================================================================
-- 7. ADD CHECK CONSTRAINTS
-- ============================================================================

-- Add check constraint for ticket status (if not already exists)
-- Note: There's already a check_valid_ticket_status constraint, so we'll skip this

-- Add check constraint for registration type
ALTER TABLE public.registrations 
DROP CONSTRAINT IF EXISTS check_valid_registration_type;

ALTER TABLE public.registrations 
ADD CONSTRAINT check_valid_registration_type 
CHECK (registration_type IN ('individual', 'lodge', 'delegation'));

-- Add check constraint for payment status
ALTER TABLE public.registrations 
DROP CONSTRAINT IF EXISTS check_valid_payment_status;

ALTER TABLE public.registrations 
ADD CONSTRAINT check_valid_payment_status 
CHECK (payment_status IN ('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'));

-- Add check constraint for email log status
ALTER TABLE public.email_log 
ADD CONSTRAINT check_valid_email_status 
CHECK (status IN ('sent', 'failed', 'bounced', 'pending', 'queued'));

-- ============================================================================
-- 8. ADD DEFAULT VALUES
-- ============================================================================

-- Set default values for counts (already done in events table)

-- Default timestamps to NOW() (already done in most tables)

-- Default status fields
ALTER TABLE public.tickets 
ALTER COLUMN status SET DEFAULT 'available';

ALTER TABLE public.registrations 
ALTER COLUMN status SET DEFAULT 'pending';

-- ============================================================================
-- 9. ADDITIONAL INDEXES
-- ============================================================================

-- Add composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_tickets_event_status_created 
ON public.tickets(event_id, status, created_at);

CREATE INDEX IF NOT EXISTS idx_registrations_event_status_created 
ON public.registrations(event_id, status, created_at);

CREATE INDEX IF NOT EXISTS idx_email_log_registration_type_sent 
ON public.email_log(registration_id, email_type, sent_at);

-- Add index for events location lookup (for computed location string)
CREATE INDEX IF NOT EXISTS idx_events_location_published 
ON public.events(location_id, is_published) 
WHERE is_published = true;

-- ============================================================================
-- 10. CREATE LOCATION COMPUTED FUNCTION
-- ============================================================================

-- Create a function to get location string for events
CREATE OR REPLACE FUNCTION get_event_location(p_event_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
AS $$
  SELECT 
    COALESCE(
      l.name || COALESCE(', ' || l.city, '') || COALESCE(', ' || l.state, ''),
      'TBA'
    )
  FROM events e
  LEFT JOIN locations l ON e.location_id = l.location_id
  WHERE e.event_id = p_event_id;
$$;

COMMENT ON FUNCTION get_event_location IS 'Returns formatted location string for an event';

-- ============================================================================
-- 11. UPDATE TRIGGERS FOR TIMESTAMPS
-- ============================================================================

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for new tables
CREATE TRIGGER update_email_log_updated_at 
BEFORE UPDATE ON public.email_log 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at 
BEFORE UPDATE ON public.documents 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 12. GRANT PERMISSIONS (adjust based on your security model)
-- ============================================================================

-- Grant permissions for authenticated users
GRANT SELECT ON public.email_log TO authenticated;
GRANT SELECT ON public.documents TO authenticated;

-- Grant insert permissions for service role (backend operations)
GRANT INSERT, UPDATE ON public.email_log TO service_role;
GRANT INSERT, UPDATE, DELETE ON public.documents TO service_role;

-- ============================================================================
-- 13. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE public.email_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for email_log
CREATE POLICY "Service role can manage email_log" ON public.email_log
FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Users can view their own email logs" ON public.email_log
FOR SELECT USING (
  registration_id IN (
    SELECT registration_id FROM registrations 
    WHERE contact_id IN (
      SELECT contact_id FROM contacts 
      WHERE auth_user_id = auth.uid()
    )
  )
);

-- Create RLS policies for documents
CREATE POLICY "Service role can manage documents" ON public.documents
FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Users can view their own documents" ON public.documents
FOR SELECT USING (
  registration_id IN (
    SELECT registration_id FROM registrations 
    WHERE contact_id IN (
      SELECT contact_id FROM contacts 
      WHERE auth_user_id = auth.uid()
    )
  )
);