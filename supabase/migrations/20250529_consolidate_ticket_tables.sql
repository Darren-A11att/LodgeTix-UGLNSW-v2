-- Migration to consolidate eventtickets and ticket_definitions tables
-- This combines capacity tracking from eventtickets into ticket_definitions

-- First, let's add the missing capacity fields to ticket_definitions
ALTER TABLE public.ticket_definitions 
ADD COLUMN IF NOT EXISTS total_capacity INTEGER,
ADD COLUMN IF NOT EXISTS available_count INTEGER,
ADD COLUMN IF NOT EXISTS reserved_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS sold_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Active',
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add check constraints for capacity fields
DO $$
BEGIN
    -- Drop existing constraint if it exists
    ALTER TABLE public.ticket_definitions DROP CONSTRAINT IF EXISTS check_capacity_counts;
    
    -- Add the constraint
    ALTER TABLE public.ticket_definitions
    ADD CONSTRAINT check_capacity_counts 
    CHECK (
      (total_capacity IS NULL OR total_capacity >= 0) AND
      (available_count IS NULL OR available_count >= 0) AND
      (reserved_count >= 0) AND
      (sold_count >= 0) AND
      (total_capacity IS NULL OR (reserved_count + sold_count + COALESCE(available_count, 0) <= total_capacity))
    );
END $$;

-- Add trigger for updated_at
DROP TRIGGER IF EXISTS set_ticket_definitions_updated_at ON ticket_definitions;
CREATE TRIGGER set_ticket_definitions_updated_at 
BEFORE UPDATE ON ticket_definitions 
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ticket_definitions_status 
ON public.ticket_definitions(status) 
WHERE status = 'Active';

CREATE INDEX IF NOT EXISTS idx_ticket_definitions_availability 
ON public.ticket_definitions(event_id, status, available_count) 
WHERE status = 'Active';

-- Migrate data from eventtickets to ticket_definitions if needed
-- This assumes eventtickets might have capacity data we want to preserve
DO $$
DECLARE
  v_ticket RECORD;
  v_definition_id UUID;
BEGIN
  -- Check if eventtickets has any data
  IF EXISTS (SELECT 1 FROM eventtickets LIMIT 1) THEN
    RAISE NOTICE 'Found data in eventtickets table, attempting to migrate capacity information...';
    
    -- For each eventticket, try to match with ticket_definitions
    FOR v_ticket IN 
      SELECT * FROM eventtickets 
      WHERE status = 'Active'
    LOOP
      -- Try to find matching ticket_definition by event and price
      SELECT id INTO v_definition_id
      FROM ticket_definitions
      WHERE event_id = v_ticket.event_uuid::uuid
        AND price = v_ticket.price
      LIMIT 1;
      
      IF v_definition_id IS NOT NULL THEN
        -- Update the ticket_definition with capacity info
        UPDATE ticket_definitions
        SET 
          total_capacity = v_ticket.total_capacity,
          available_count = v_ticket.available_count,
          reserved_count = v_ticket.reserved_count,
          sold_count = v_ticket.sold_count,
          status = v_ticket.status,
          updated_at = v_ticket.updated_at
        WHERE id = v_definition_id;
        
        RAISE NOTICE 'Updated ticket_definition % with capacity data', v_definition_id;
      END IF;
    END LOOP;
  END IF;
END $$;

-- Update the previous migration's columns to match the new structure
-- Remove the columns we added in the previous migration since we're using different names
ALTER TABLE public.ticket_definitions 
DROP COLUMN IF EXISTS available_quantity,
DROP COLUMN IF EXISTS max_quantity;

-- Drop existing functions if they exist to avoid conflicts
-- Using CASCADE to drop dependent objects if any
DROP FUNCTION IF EXISTS check_ticket_availability(UUID, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS reserve_tickets(UUID, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS confirm_ticket_purchase(UUID, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS release_reserved_tickets(UUID, INTEGER) CASCADE;

-- Also drop any other signatures of these functions that might exist
DO $$
BEGIN
    -- Drop all functions with these names regardless of signature
    DROP FUNCTION IF EXISTS check_ticket_availability CASCADE;
    DROP FUNCTION IF EXISTS reserve_tickets CASCADE;
    DROP FUNCTION IF EXISTS confirm_ticket_purchase CASCADE;
    DROP FUNCTION IF EXISTS release_reserved_tickets CASCADE;
    DROP FUNCTION IF EXISTS decrement_ticket_availability CASCADE;
EXCEPTION
    WHEN undefined_function THEN
        -- Functions don't exist, which is fine
        NULL;
END $$;

-- Helper functions for the new structure
CREATE OR REPLACE FUNCTION check_ticket_availability(
  p_ticket_definition_id UUID,
  p_requested_quantity INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  v_available_count INTEGER;
  v_status VARCHAR(50);
BEGIN
  SELECT available_count, status
  INTO v_available_count, v_status
  FROM ticket_definitions
  WHERE id = p_ticket_definition_id;
  
  -- Check if ticket is active
  IF v_status != 'Active' THEN
    RETURN false;
  END IF;
  
  -- If available_count is NULL, tickets are unlimited
  IF v_available_count IS NULL THEN
    RETURN true;
  END IF;
  
  -- Check if enough tickets are available
  RETURN v_available_count >= p_requested_quantity;
END;
$$ LANGUAGE plpgsql;

-- Function to reserve tickets (moves from available to reserved)
CREATE OR REPLACE FUNCTION reserve_tickets(
  p_ticket_definition_id UUID,
  p_quantity INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  v_updated_count INTEGER;
BEGIN
  UPDATE ticket_definitions
  SET 
    available_count = CASE 
      WHEN available_count IS NULL THEN NULL
      ELSE available_count - p_quantity
    END,
    reserved_count = reserved_count + p_quantity,
    updated_at = NOW()
  WHERE id = p_ticket_definition_id
    AND status = 'Active'
    AND (available_count IS NULL OR available_count >= p_quantity);
  
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  
  RETURN v_updated_count > 0;
END;
$$ LANGUAGE plpgsql;

-- Function to confirm ticket purchase (moves from reserved to sold)
CREATE OR REPLACE FUNCTION confirm_ticket_purchase(
  p_ticket_definition_id UUID,
  p_quantity INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  v_updated_count INTEGER;
BEGIN
  UPDATE ticket_definitions
  SET 
    reserved_count = reserved_count - p_quantity,
    sold_count = sold_count + p_quantity,
    updated_at = NOW()
  WHERE id = p_ticket_definition_id
    AND reserved_count >= p_quantity;
  
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  
  RETURN v_updated_count > 0;
END;
$$ LANGUAGE plpgsql;

-- Function to release reserved tickets (moves from reserved back to available)
CREATE OR REPLACE FUNCTION release_reserved_tickets(
  p_ticket_definition_id UUID,
  p_quantity INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  v_updated_count INTEGER;
BEGIN
  UPDATE ticket_definitions
  SET 
    available_count = CASE 
      WHEN available_count IS NULL THEN NULL
      ELSE available_count + p_quantity
    END,
    reserved_count = reserved_count - p_quantity,
    updated_at = NOW()
  WHERE id = p_ticket_definition_id
    AND reserved_count >= p_quantity;
  
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  
  RETURN v_updated_count > 0;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION check_ticket_availability(UUID, INTEGER) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION reserve_tickets(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION confirm_ticket_purchase(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION release_reserved_tickets(UUID, INTEGER) TO authenticated;

-- Add helpful comments
COMMENT ON COLUMN ticket_definitions.total_capacity IS 'Total number of tickets that can be sold. NULL means unlimited.';
COMMENT ON COLUMN ticket_definitions.available_count IS 'Number of tickets currently available for purchase. NULL means unlimited.';
COMMENT ON COLUMN ticket_definitions.reserved_count IS 'Number of tickets currently reserved (in carts but not purchased).';
COMMENT ON COLUMN ticket_definitions.sold_count IS 'Number of tickets sold and paid for.';
COMMENT ON COLUMN ticket_definitions.status IS 'Ticket status: Active, Inactive, Sold Out, etc.';

-- Create a view for ticket availability summary
CREATE OR REPLACE VIEW ticket_availability AS
SELECT 
  td.id,
  td.name,
  td.price,
  td.description,
  td.event_id,
  e.title as event_title,
  td.total_capacity,
  td.available_count,
  td.reserved_count,
  td.sold_count,
  td.status,
  CASE 
    WHEN td.status != 'Active' THEN 'Inactive'
    WHEN td.available_count = 0 THEN 'Sold Out'
    WHEN td.available_count IS NULL THEN 'Unlimited'
    ELSE 'Available'
  END as availability_status,
  td.eligibility_attendee_types,
  td.eligibility_mason_rank,
  td.created_at,
  td.updated_at
FROM ticket_definitions td
LEFT JOIN events e ON e.id = td.event_id;

GRANT SELECT ON ticket_availability TO authenticated, anon;

-- Note: The eventtickets table can be dropped after verifying the migration
-- DO NOT DROP IT YET - first verify all data is migrated correctly
-- After verification, you can run: DROP TABLE IF EXISTS public.eventtickets;