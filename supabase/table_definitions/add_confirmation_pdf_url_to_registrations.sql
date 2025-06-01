-- Add confirmation_pdf_url column to registrations table
ALTER TABLE registrations 
ADD COLUMN IF NOT EXISTS confirmation_pdf_url TEXT;

-- Add comment
COMMENT ON COLUMN registrations.confirmation_pdf_url IS 'URL to the stored confirmation PDF for this registration';