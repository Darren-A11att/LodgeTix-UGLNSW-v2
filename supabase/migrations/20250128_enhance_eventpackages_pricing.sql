-- Migration to enhance eventpackages table with pricing, discounts, and package types

-- First, add the new columns to the eventpackages table
ALTER TABLE public.eventpackages 
ADD COLUMN IF NOT EXISTS price NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS original_price NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS discount_percentage NUMERIC(5,2) DEFAULT 0 CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10,2) GENERATED ALWAYS AS (
  CASE 
    WHEN original_price IS NOT NULL AND discount_percentage IS NOT NULL 
    THEN original_price * (discount_percentage / 100)
    ELSE 0
  END
) STORED,
ADD COLUMN IF NOT EXISTS package_type TEXT CHECK (package_type IN ('multi_buy', 'bulk_buy')),
ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1 CHECK (quantity > 0),
ADD COLUMN IF NOT EXISTS includes JSONB; -- Store ticket_definition_ids and quantities

-- Create or replace the package_ticket_includes table for better normalization
CREATE TABLE IF NOT EXISTS public.package_ticket_includes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  package_id UUID NOT NULL REFERENCES public.eventpackages(id) ON DELETE CASCADE,
  ticket_definition_id UUID NOT NULL REFERENCES public.ticket_definitions(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(package_id, ticket_definition_id)
);

-- Function to calculate original price from included tickets
CREATE OR REPLACE FUNCTION calculate_package_original_price(p_package_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  v_total_price NUMERIC := 0;
BEGIN
  SELECT COALESCE(SUM(td.price * pti.quantity), 0)
  INTO v_total_price
  FROM package_ticket_includes pti
  JOIN ticket_definitions td ON td.id = pti.ticket_definition_id
  WHERE pti.package_id = p_package_id;
  
  RETURN v_total_price;
END;
$$ LANGUAGE plpgsql;

-- Function to determine package type based on included tickets
CREATE OR REPLACE FUNCTION determine_package_type(p_package_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_unique_events INTEGER;
  v_max_quantity INTEGER;
  v_total_tickets INTEGER;
BEGIN
  -- Count unique events
  SELECT COUNT(DISTINCT td.event_id)
  INTO v_unique_events
  FROM package_ticket_includes pti
  JOIN ticket_definitions td ON td.id = pti.ticket_definition_id
  WHERE pti.package_id = p_package_id;
  
  -- Get max quantity and total tickets
  SELECT MAX(pti.quantity), SUM(pti.quantity)
  INTO v_max_quantity, v_total_tickets
  FROM package_ticket_includes pti
  WHERE pti.package_id = p_package_id;
  
  -- Determine type:
  -- Multi-buy: tickets to multiple events (unique events > 1)
  -- Bulk-buy: multiple tickets of same type (max quantity > 1 OR total > unique events)
  IF v_unique_events > 1 THEN
    RETURN 'multi_buy';
  ELSIF v_max_quantity > 1 OR v_total_tickets > v_unique_events THEN
    RETURN 'bulk_buy';
  ELSE
    RETURN NULL; -- Single ticket package
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to update package pricing and type
CREATE OR REPLACE FUNCTION update_package_pricing_and_type()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the package's original price, type, and quantity
  UPDATE eventpackages
  SET 
    original_price = calculate_package_original_price(NEW.package_id),
    package_type = determine_package_type(NEW.package_id),
    quantity = (
      SELECT SUM(quantity) 
      FROM package_ticket_includes 
      WHERE package_id = NEW.package_id
    ),
    -- Recalculate final price if discount exists
    price = CASE 
      WHEN discount_percentage > 0 THEN 
        calculate_package_original_price(NEW.package_id) * (1 - discount_percentage / 100)
      ELSE 
        COALESCE(price, calculate_package_original_price(NEW.package_id))
    END
  WHERE id = NEW.package_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update package pricing when includes change
CREATE TRIGGER update_package_on_includes_change
AFTER INSERT OR UPDATE OR DELETE ON package_ticket_includes
FOR EACH ROW
EXECUTE FUNCTION update_package_pricing_and_type();

-- Function to set package discount and update price
CREATE OR REPLACE FUNCTION set_package_discount(
  p_package_id UUID,
  p_discount_percentage NUMERIC
)
RETURNS VOID AS $$
BEGIN
  UPDATE eventpackages
  SET 
    discount_percentage = p_discount_percentage,
    price = original_price * (1 - p_discount_percentage / 100)
  WHERE id = p_package_id;
END;
$$ LANGUAGE plpgsql;

-- View for easy package information retrieval
CREATE OR REPLACE VIEW package_details AS
SELECT 
  p.id,
  p.name,
  p.description,
  p.includes_description,
  p.parent_event_id,
  p.original_price,
  p.discount_percentage,
  p.discount_amount,
  p.price AS total_price,
  p.package_type,
  p.quantity,
  p.created_at,
  -- Include ticket details as JSON
  COALESCE(
    json_agg(
      json_build_object(
        'ticket_definition_id', pti.ticket_definition_id,
        'ticket_name', td.name,
        'ticket_price', td.price,
        'quantity', pti.quantity,
        'event_id', td.event_id,
        'event_title', e.title
      ) ORDER BY td.name
    ) FILTER (WHERE pti.ticket_definition_id IS NOT NULL),
    '[]'::json
  ) AS included_tickets
FROM eventpackages p
LEFT JOIN package_ticket_includes pti ON pti.package_id = p.id
LEFT JOIN ticket_definitions td ON td.id = pti.ticket_definition_id
LEFT JOIN events e ON e.id = td.event_id
GROUP BY p.id;

-- Helper function to create a package with tickets
CREATE OR REPLACE FUNCTION create_package_with_tickets(
  p_name TEXT,
  p_description TEXT,
  p_parent_event_id UUID,
  p_includes_description TEXT[],
  p_ticket_includes JSONB, -- Array of {ticket_definition_id, quantity}
  p_discount_percentage NUMERIC DEFAULT 0,
  p_custom_price NUMERIC DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_package_id UUID;
  v_include JSONB;
BEGIN
  -- Create the package
  INSERT INTO eventpackages (
    name, 
    description, 
    parent_event_id, 
    includes_description,
    discount_percentage,
    price
  )
  VALUES (
    p_name, 
    p_description, 
    p_parent_event_id, 
    p_includes_description,
    p_discount_percentage,
    p_custom_price
  )
  RETURNING id INTO v_package_id;
  
  -- Add ticket includes
  FOR v_include IN SELECT * FROM jsonb_array_elements(p_ticket_includes)
  LOOP
    INSERT INTO package_ticket_includes (
      package_id,
      ticket_definition_id,
      quantity
    )
    VALUES (
      v_package_id,
      (v_include->>'ticket_definition_id')::UUID,
      COALESCE((v_include->>'quantity')::INTEGER, 1)
    );
  END LOOP;
  
  RETURN v_package_id;
END;
$$ LANGUAGE plpgsql;

-- Migrate existing includes data to the new structure
DO $$
DECLARE
  v_package RECORD;
  v_ticket_id UUID;
BEGIN
  FOR v_package IN SELECT id, includes FROM eventpackages WHERE includes IS NOT NULL
  LOOP
    IF jsonb_typeof(v_package.includes) = 'array' THEN
      FOR v_ticket_id IN SELECT jsonb_array_elements_text(v_package.includes)::UUID
      LOOP
        INSERT INTO package_ticket_includes (package_id, ticket_definition_id, quantity)
        VALUES (v_package.id, v_ticket_id, 1)
        ON CONFLICT (package_id, ticket_definition_id) DO NOTHING;
      END LOOP;
    END IF;
  END LOOP;
END $$;

-- Update all existing packages to calculate their pricing and type
UPDATE eventpackages
SET 
  original_price = calculate_package_original_price(id),
  package_type = determine_package_type(id),
  quantity = (
    SELECT COALESCE(SUM(quantity), 0) 
    FROM package_ticket_includes 
    WHERE package_id = eventpackages.id
  ),
  price = CASE 
    WHEN price IS NULL THEN calculate_package_original_price(id)
    ELSE price
  END
WHERE original_price IS NULL;

-- Grant permissions
GRANT SELECT ON package_details TO authenticated, anon;
GRANT ALL ON package_ticket_includes TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_package_original_price TO authenticated;
GRANT EXECUTE ON FUNCTION determine_package_type TO authenticated;
GRANT EXECUTE ON FUNCTION set_package_discount TO authenticated;
GRANT EXECUTE ON FUNCTION create_package_with_tickets TO authenticated;

-- Add helpful comments
COMMENT ON COLUMN eventpackages.price IS 'Final price after discount (if any)';
COMMENT ON COLUMN eventpackages.original_price IS 'Sum of all included ticket prices';
COMMENT ON COLUMN eventpackages.discount_percentage IS 'Discount percentage (0-100)';
COMMENT ON COLUMN eventpackages.discount_amount IS 'Calculated discount amount';
COMMENT ON COLUMN eventpackages.package_type IS 'multi_buy = tickets to multiple events, bulk_buy = multiple tickets of same type';
COMMENT ON COLUMN eventpackages.quantity IS 'Total number of tickets in the package';
COMMENT ON TABLE package_ticket_includes IS 'Junction table linking packages to ticket definitions with quantities';