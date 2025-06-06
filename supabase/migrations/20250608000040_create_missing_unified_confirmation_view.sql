-- Create the missing registration_confirmation_unified_view
-- This view is needed by the confirmation API to determine registration type

-- 1. Create a unified view that can fetch any registration type by confirmation number
CREATE OR REPLACE VIEW public.registration_confirmation_unified_view AS
SELECT 
    registration_id,
    confirmation_number,
    registration_type,
    function_id,
    function_slug,
    payment_status,
    status
FROM registration_confirmation_base_view;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_registrations_confirmation_type 
ON registrations(confirmation_number, registration_type) 
WHERE confirmation_number IS NOT NULL;

-- Grant access to the view
GRANT SELECT ON public.registration_confirmation_unified_view TO anon, authenticated, service_role;

-- Add comment
COMMENT ON VIEW public.registration_confirmation_unified_view IS 
'Unified view to quickly identify registration type by confirmation number';