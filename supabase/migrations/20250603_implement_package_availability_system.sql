-- Migration: Implement Package Availability System
-- Description: Adds automatic calculation of package availability based on included event_tickets

-- 1. Add available_count column to packages table if it doesn't exist
ALTER TABLE packages 
ADD COLUMN IF NOT EXISTS available_count INTEGER DEFAULT 0;

-- 2. Create function to calculate package availability
CREATE OR REPLACE FUNCTION calculate_package_availability(p_package_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_available_count INTEGER;
  v_package_exists BOOLEAN;
  v_package_qty INTEGER;
BEGIN
  -- Check if package exists and get its qty
  SELECT EXISTS(SELECT 1 FROM packages WHERE package_id = p_package_id), 
         COALESCE(qty, 1)
  INTO v_package_exists, v_package_qty
  FROM packages 
  WHERE package_id = p_package_id;
  
  IF NOT v_package_exists THEN
    RETURN 0;
  END IF;

  -- Calculate minimum available packages based on included items
  -- For each included event_ticket, divide its available_count by the package quantity
  -- Take the minimum to ensure all items are available
  WITH item_availability AS (
    SELECT 
      pi.event_ticket_id,
      COALESCE(pi.quantity, 1) as item_quantity,
      COALESCE(et.available_count, 0) as ticket_available,
      FLOOR(COALESCE(et.available_count, 0)::DECIMAL / (COALESCE(pi.quantity, 1) * v_package_qty)) as max_packages
    FROM packages p, 
         LATERAL unnest(p.included_items) AS pi(event_ticket_id, quantity)
    LEFT JOIN event_tickets et ON et.event_ticket_id = pi.event_ticket_id
    WHERE p.package_id = p_package_id
      AND COALESCE(pi.quantity, 0) > 0
  )
  SELECT COALESCE(MIN(max_packages), 0)::INTEGER
  INTO v_available_count
  FROM item_availability;
  
  -- Return 0 if no included items or null result
  RETURN COALESCE(v_available_count, 0);
END;
$$ LANGUAGE plpgsql STABLE;

-- 3. Create function to update package status based on availability
-- This will be called when packages are updated (e.g., included_items change)
CREATE OR REPLACE FUNCTION update_package_availability_on_change()
RETURNS TRIGGER AS $$
DECLARE
  v_available_count INTEGER;
BEGIN
  -- Calculate new availability for the package
  v_available_count := calculate_package_availability(NEW.package_id);
  
  -- Update the available_count
  NEW.available_count := v_available_count;
  
  -- Force inactive if sold out
  IF v_available_count = 0 AND NEW.is_active = true THEN
    NEW.is_active := FALSE;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Create function to update all package availability when event_ticket changes
CREATE OR REPLACE FUNCTION update_packages_on_ticket_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Update all packages that include this event_ticket
  WITH affected_packages AS (
    SELECT DISTINCT p.package_id
    FROM packages p, 
         LATERAL unnest(p.included_items) AS pi(event_ticket_id, quantity)
    WHERE pi.event_ticket_id = NEW.event_ticket_id
  )
  UPDATE packages p
  SET 
    available_count = calculate_package_availability(p.package_id),
    is_active = CASE 
      WHEN calculate_package_availability(p.package_id) > 0 THEN p.is_active
      ELSE FALSE
    END,
    updated_at = NOW()
  WHERE p.package_id IN (SELECT package_id FROM affected_packages);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Create triggers for automatic updates

-- Trigger when packages are updated (for included_items changes)
DROP TRIGGER IF EXISTS update_package_availability_on_change ON packages;
CREATE TRIGGER update_package_availability_on_change
BEFORE INSERT OR UPDATE OF included_items, qty ON packages
FOR EACH ROW
EXECUTE FUNCTION update_package_availability_on_change();

-- Trigger when event_tickets availability changes
DROP TRIGGER IF EXISTS update_packages_on_ticket_availability_change ON event_tickets;
CREATE TRIGGER update_packages_on_ticket_availability_change
AFTER UPDATE OF available_count ON event_tickets
FOR EACH ROW
EXECUTE FUNCTION update_packages_on_ticket_change();

-- 6. Create view for package availability with status
CREATE OR REPLACE VIEW package_availability_view AS
SELECT 
  p.*,
  p.available_count,
  CASE 
    WHEN p.available_count = 0 THEN 'SOLD_OUT'
    WHEN p.available_count > 0 AND p.available_count <= 10 THEN 'LIMITED'
    ELSE 'AVAILABLE'
  END as availability_status,
  -- Include details about constraints
  (
    SELECT JSON_AGG(
      JSON_BUILD_OBJECT(
        'event_ticket_id', et.event_ticket_id,
        'event_name', e.title,
        'ticket_name', et.name,
        'ticket_available', et.available_count,
        'package_quantity', pi.quantity,
        'package_qty', p.qty,
        'max_packages_from_this_ticket', FLOOR(COALESCE(et.available_count, 0)::DECIMAL / (COALESCE(pi.quantity, 1) * COALESCE(p.qty, 1)))
      )
      ORDER BY FLOOR(COALESCE(et.available_count, 0)::DECIMAL / (COALESCE(pi.quantity, 1) * COALESCE(p.qty, 1)))
    )
    FROM unnest(p.included_items) AS pi(event_ticket_id, quantity)
    JOIN event_tickets et ON et.event_ticket_id = pi.event_ticket_id
    JOIN events e ON et.event_id = e.event_id
  ) as included_items_availability
FROM packages p;

-- 7. Create function to bulk update all package availability (for initial population and maintenance)
CREATE OR REPLACE FUNCTION refresh_all_package_availability()
RETURNS TABLE(pkg_id UUID, pkg_name TEXT, old_count INTEGER, new_count INTEGER) AS $$
BEGIN
  RETURN QUERY
  UPDATE packages p
  SET 
    available_count = calc.new_available,
    is_active = CASE 
      WHEN calc.new_available > 0 THEN p.is_active
      ELSE FALSE
    END,
    updated_at = NOW()
  FROM (
    SELECT 
      package_id,
      available_count as old_available,
      calculate_package_availability(package_id) as new_available
    FROM packages
  ) calc
  WHERE p.package_id = calc.package_id
  AND (p.available_count IS DISTINCT FROM calc.new_available)
  RETURNING p.package_id, p.name, calc.old_available, p.available_count;
END;
$$ LANGUAGE plpgsql;

-- 8. Create index for performance
-- Index for GIN search on included_items array
CREATE INDEX IF NOT EXISTS idx_packages_included_items ON packages USING GIN (included_items);
CREATE INDEX IF NOT EXISTS idx_packages_available_count ON packages(available_count) WHERE is_active = true;

-- 9. Add check constraint to ensure data integrity
ALTER TABLE packages 
ADD CONSTRAINT check_available_count_non_negative 
CHECK (available_count >= 0);

-- 10. Initialize all package availability counts
SELECT * FROM refresh_all_package_availability();

-- 11. Create RPC function for checking package availability before purchase
CREATE OR REPLACE FUNCTION check_package_availability(p_package_id UUID, p_requested_quantity INTEGER)
RETURNS TABLE(
  is_available BOOLEAN,
  available_count INTEGER,
  constraint_details JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.available_count >= p_requested_quantity,
    p.available_count,
    p.included_items_availability::JSONB
  FROM package_availability_view p
  WHERE p.package_id = p_package_id;
END;
$$ LANGUAGE plpgsql STABLE;

-- 12. Create function to reserve package items
CREATE OR REPLACE FUNCTION reserve_package_items(
  p_package_id UUID, 
  p_quantity INTEGER,
  p_registration_id UUID
)
RETURNS TABLE(
  success BOOLEAN,
  message TEXT,
  reserved_tickets JSONB
) AS $$
DECLARE
  v_package RECORD;
  v_item RECORD;
  v_reserved_tickets JSONB = '[]'::JSONB;
  v_ticket_id UUID;
  v_needed_quantity INTEGER;
BEGIN
  -- Get package details
  SELECT * INTO v_package FROM packages WHERE package_id = p_package_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 'Package not found', NULL::JSONB;
    RETURN;
  END IF;
  
  -- Check availability
  IF v_package.available_count < p_quantity THEN
    RETURN QUERY SELECT FALSE, 'Insufficient package availability', NULL::JSONB;
    RETURN;
  END IF;
  
  -- Reserve tickets for each included item
  FOR v_item IN 
    SELECT * FROM unnest(v_package.included_items) AS item(event_ticket_id, quantity)
  LOOP
    v_ticket_id := v_item.event_ticket_id;
    v_needed_quantity := v_item.quantity * v_package.qty * p_quantity;
    
    -- Update event_ticket reservation
    UPDATE event_tickets
    SET 
      available_count = available_count - v_needed_quantity,
      reserved_count = reserved_count + v_needed_quantity
    WHERE event_ticket_id = v_ticket_id
      AND available_count >= v_needed_quantity;
    
    IF NOT FOUND THEN
      -- Rollback will happen automatically due to transaction
      RETURN QUERY SELECT FALSE, format('Insufficient availability for ticket %s', v_ticket_id), NULL::JSONB;
      RETURN;
    END IF;
    
    -- Track reserved tickets
    v_reserved_tickets := v_reserved_tickets || jsonb_build_object(
      'event_ticket_id', v_ticket_id,
      'quantity', v_needed_quantity
    );
  END LOOP;
  
  RETURN QUERY SELECT TRUE, 'Package items reserved successfully', v_reserved_tickets;
END;
$$ LANGUAGE plpgsql;

-- 13. Add comment documentation
COMMENT ON FUNCTION calculate_package_availability IS 'Calculates how many packages can be sold based on the availability of included event_tickets. Returns the minimum number of complete packages that can be created.';
COMMENT ON FUNCTION update_package_availability_on_change IS 'Trigger function that updates package availability when packages are modified.';
COMMENT ON FUNCTION update_packages_on_ticket_change IS 'Trigger function that updates all affected packages when event_ticket availability changes.';
COMMENT ON FUNCTION refresh_all_package_availability IS 'Utility function to recalculate all package availability. Returns changed packages.';
COMMENT ON FUNCTION check_package_availability IS 'RPC function to verify package availability before purchase, with detailed constraint information.';
COMMENT ON FUNCTION reserve_package_items IS 'Reserves the underlying event_tickets when a package is purchased. Ensures atomic reservation of all included items.';
COMMENT ON COLUMN packages.available_count IS 'Calculated number of packages available based on included event_tickets. Automatically maintained by triggers.';