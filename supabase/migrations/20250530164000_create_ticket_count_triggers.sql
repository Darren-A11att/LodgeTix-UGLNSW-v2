-- ERROR: 22023: cannot add relation "ticket_availability_view" to publication
-- DETAIL:  This operation is not supported for views.

-- Create function to update event_ticket counts when tickets are created/updated/deleted
CREATE OR REPLACE FUNCTION update_event_ticket_counts()
RETURNS TRIGGER AS $$
BEGIN
    -- Update counts for the ticket type
    UPDATE event_tickets
    SET 
        reserved_count = (
            SELECT COUNT(*) 
            FROM tickets 
            WHERE ticket_type_id = COALESCE(NEW.ticket_type_id, OLD.ticket_type_id)
            AND status = 'reserved'
            AND reservation_expires_at > NOW()
        ),
        sold_count = (
            SELECT COUNT(*) 
            FROM tickets 
            WHERE ticket_type_id = COALESCE(NEW.ticket_type_id, OLD.ticket_type_id)
            AND status = 'sold'
        ),
        available_count = CASE 
            WHEN total_capacity IS NULL THEN NULL
            ELSE total_capacity - (
                SELECT COUNT(*) 
                FROM tickets 
                WHERE ticket_type_id = COALESCE(NEW.ticket_type_id, OLD.ticket_type_id)
                AND status IN ('reserved', 'sold')
                AND (status != 'reserved' OR reservation_expires_at > NOW())
            )
        END,
        updated_at = NOW()
    WHERE id = COALESCE(NEW.ticket_type_id, OLD.ticket_type_id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function to update event counts when tickets change
CREATE OR REPLACE FUNCTION update_event_counts()
RETURNS TRIGGER AS $$
BEGIN
    -- Update total counts for the event
    UPDATE events
    SET 
        total_tickets_sold = (
            SELECT COUNT(*) 
            FROM tickets 
            WHERE event_id = COALESCE(NEW.event_id, OLD.event_id)
            AND status = 'sold'
        ),
        updated_at = NOW()
    WHERE event_id = COALESCE(NEW.event_id, OLD.event_id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function to handle reservation expiry
CREATE OR REPLACE FUNCTION expire_ticket_reservations()
RETURNS void AS $$
BEGIN
    -- Update tickets with expired reservations
    UPDATE tickets
    SET 
        status = 'available',
        reservation_id = NULL,
        reservation_expires_at = NULL,
        updated_at = NOW()
    WHERE status = 'reserved' 
    AND reservation_expires_at < NOW();
    
    -- Update event_tickets counts for affected ticket types
    UPDATE event_tickets et
    SET 
        reserved_count = (
            SELECT COUNT(*) 
            FROM tickets t
            WHERE t.ticket_type_id = et.id
            AND t.status = 'reserved'
            AND t.reservation_expires_at > NOW()
        ),
        available_count = CASE 
            WHEN et.total_capacity IS NULL THEN NULL
            ELSE et.total_capacity - (
                SELECT COUNT(*) 
                FROM tickets t
                WHERE t.ticket_type_id = et.id
                AND t.status IN ('reserved', 'sold')
                AND (t.status != 'reserved' OR t.reservation_expires_at > NOW())
            )
        END,
        updated_at = NOW()
    WHERE et.id IN (
        SELECT DISTINCT ticket_type_id 
        FROM tickets 
        WHERE status = 'reserved' 
        AND reservation_expires_at < NOW()
    );
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to expire reservations (if using pg_cron)
-- This would need to be set up separately in your database
-- Example: SELECT cron.schedule('expire-ticket-reservations', '* * * * *', 'SELECT expire_ticket_reservations();');

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION update_event_ticket_counts() TO authenticated;
GRANT EXECUTE ON FUNCTION update_event_counts() TO authenticated;
GRANT EXECUTE ON FUNCTION expire_ticket_reservations() TO authenticated;

-- Enable real-time for underlying tables (views cannot be added to publications)
-- The ticket_availability_view will update when these tables change
-- Only add tables if they're not already in the publication
DO $$ 
BEGIN
    -- Check and add event_tickets if not already in publication
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'event_tickets'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE event_tickets;
    END IF;
    
    -- Check and add tickets if not already in publication
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'tickets'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE tickets;
    END IF;
END $$;

-- Create triggers to update counts when tickets change
CREATE TRIGGER update_event_ticket_counts_trigger
    AFTER INSERT OR UPDATE OR DELETE ON tickets
    FOR EACH ROW
    EXECUTE FUNCTION update_event_ticket_counts();

CREATE TRIGGER update_event_counts_trigger
    AFTER INSERT OR UPDATE OR DELETE ON tickets
    FOR EACH ROW
    EXECUTE FUNCTION update_event_counts();