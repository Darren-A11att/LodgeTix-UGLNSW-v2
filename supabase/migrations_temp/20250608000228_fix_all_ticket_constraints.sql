-- Fix all ticket status constraints to be more permissive

-- Drop all existing status-related constraints
ALTER TABLE tickets DROP CONSTRAINT IF EXISTS check_valid_ticket_status;
ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_status_check;

-- Create a single, very permissive status constraint
ALTER TABLE tickets ADD CONSTRAINT tickets_status_check 
CHECK (
    status IS NULL OR 
    status IN (
        'Active', 'Cancelled', 'Refunded', 'Pending', 'Sold', 'Reserved', 'Checked In',
        'active', 'cancelled', 'refunded', 'pending', 'sold', 'reserved', 'checked_in',
        'available', 'unavailable', 'expired', 'transferred', 'voided', 'processing'
    )
);