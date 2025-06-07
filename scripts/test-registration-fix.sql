-- Test the updated RPC function
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'upsert_individual_registration'
LIMIT 1;

-- Check columns in registrations table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'registrations' 
AND column_name LIKE '%amount%'
ORDER BY column_name;

-- Check if total_amount_paid column exists
SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'registrations' 
    AND column_name = 'total_amount_paid'
) as total_amount_paid_exists;