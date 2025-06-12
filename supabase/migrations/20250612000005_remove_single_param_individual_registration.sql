-- Remove the single parameter version of upsert_individual_registration
-- Keep only the multiple parameters version that matches the API calls

DO $$
BEGIN
    -- Drop the single parameter function if it exists
    IF EXISTS (
        SELECT 1 
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
        AND p.proname = 'upsert_individual_registration'
        AND p.pronargs = 1  -- Single parameter (p_registration_data jsonb)
    ) THEN
        DROP FUNCTION public.upsert_individual_registration(p_registration_data jsonb);
        RAISE NOTICE 'Dropped single parameter upsert_individual_registration function';
    ELSE
        RAISE NOTICE 'Single parameter upsert_individual_registration function does not exist';
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error removing single parameter function: % %', SQLERRM, SQLSTATE;
END $$;