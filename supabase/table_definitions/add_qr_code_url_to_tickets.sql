-- Add qr_code_url column to tickets table
ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS qr_code_url TEXT;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_tickets_qr_code_url ON tickets(qr_code_url) WHERE qr_code_url IS NOT NULL;

-- Add comment
COMMENT ON COLUMN tickets.qr_code_url IS 'URL to the stored QR code image for this ticket';