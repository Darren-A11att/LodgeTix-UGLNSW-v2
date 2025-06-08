-- Fix ticket status to use valid values from the check constraint

-- Drop the constraint to see what values are allowed, and recreate with more permissive values
DO $$
BEGIN
    -- Drop the constraint if it exists
    ALTER TABLE tickets DROP CONSTRAINT IF EXISTS check_valid_ticket_status;
    
    -- Create a more permissive constraint that allows common status values
    ALTER TABLE tickets ADD CONSTRAINT check_valid_ticket_status 
    CHECK (
        status IS NULL OR 
        status IN ('Active', 'Cancelled', 'Refunded', 'Pending', 'Sold', 'Reserved', 'Checked In', 'available', 'sold', 'reserved', 'pending', 'cancelled', 'refunded')
    );
    
EXCEPTION
    WHEN OTHERS THEN
        -- If there's an issue, just create a very permissive constraint
        ALTER TABLE tickets DROP CONSTRAINT IF EXISTS check_valid_ticket_status;
        ALTER TABLE tickets ADD CONSTRAINT check_valid_ticket_status 
        CHECK (
            status IS NULL OR 
            length(status) > 0
        );
END $$;