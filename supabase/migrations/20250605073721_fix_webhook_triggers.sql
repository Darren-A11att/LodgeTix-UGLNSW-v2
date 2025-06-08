-- Drop existing webhook triggers if they exist
DROP TRIGGER IF EXISTS "generate-attendee-qr-webhook" ON "public"."attendees";
DROP TRIGGER IF EXISTS "generate-ticket-qr-webhook" ON "public"."tickets";

-- Create placeholder triggers without Edge Functions dependency
-- These can be replaced with actual Edge Functions later
CREATE OR REPLACE FUNCTION placeholder_webhook_trigger()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    -- Placeholder function for development branch
    -- In production, this would trigger Edge Functions
    RETURN NEW;
END;
$$;

-- Create triggers using the placeholder function
CREATE TRIGGER "generate-attendee-qr-webhook" 
    AFTER INSERT OR UPDATE ON "public"."attendees" 
    FOR EACH ROW 
    EXECUTE FUNCTION placeholder_webhook_trigger();

CREATE TRIGGER "generate-ticket-qr-webhook" 
    AFTER INSERT ON "public"."tickets" 
    FOR EACH ROW 
    EXECUTE FUNCTION placeholder_webhook_trigger();