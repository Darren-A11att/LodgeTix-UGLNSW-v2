-- =====================================================
-- REFRESH MATERIALIZED VIEWS (SAFE VERSION)
-- =====================================================
-- Only refreshes materialized views if they exist
-- Compatible with production databases that may not have them
-- =====================================================

-- Safely refresh materialized views only if they exist
DO $$
BEGIN
    -- Check and refresh mv_packages_static
    IF EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'mv_packages_static') THEN
        REFRESH MATERIALIZED VIEW mv_packages_static;
        ANALYZE mv_packages_static;
        RAISE NOTICE 'Refreshed mv_packages_static';
    ELSE
        RAISE NOTICE 'mv_packages_static does not exist - skipping';
    END IF;
    
    -- Check and refresh mv_packages_dynamic
    IF EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'mv_packages_dynamic') THEN
        REFRESH MATERIALIZED VIEW mv_packages_dynamic;
        ANALYZE mv_packages_dynamic;
        RAISE NOTICE 'Refreshed mv_packages_dynamic';
    ELSE
        RAISE NOTICE 'mv_packages_dynamic does not exist - skipping';
    END IF;
    
    -- Check and refresh mv_tickets_static
    IF EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'mv_tickets_static') THEN
        REFRESH MATERIALIZED VIEW mv_tickets_static;
        ANALYZE mv_tickets_static;
        RAISE NOTICE 'Refreshed mv_tickets_static';
    ELSE
        RAISE NOTICE 'mv_tickets_static does not exist - skipping';
    END IF;
    
    -- Check and refresh mv_tickets_dynamic
    IF EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'mv_tickets_dynamic') THEN
        REFRESH MATERIALIZED VIEW mv_tickets_dynamic;
        ANALYZE mv_tickets_dynamic;
        RAISE NOTICE 'Refreshed mv_tickets_dynamic';
    ELSE
        RAISE NOTICE 'mv_tickets_dynamic does not exist - skipping';
    END IF;
END $$;

-- Check if ultra-fast functions exist (for information only)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc p 
        JOIN pg_namespace n ON p.pronamespace = n.oid 
        WHERE n.nspname = 'public' 
        AND p.proname = 'get_function_packages_ultra_fast'
    ) THEN
        RAISE NOTICE 'Function get_function_packages_ultra_fast does not exist';
    ELSE
        RAISE NOTICE 'Function get_function_packages_ultra_fast exists';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc p 
        JOIN pg_namespace n ON p.pronamespace = n.oid 
        WHERE n.nspname = 'public' 
        AND p.proname = 'get_function_tickets_ultra_fast'
    ) THEN
        RAISE NOTICE 'Function get_function_tickets_ultra_fast does not exist';
    ELSE
        RAISE NOTICE 'Function get_function_tickets_ultra_fast exists';
    END IF;
END $$;