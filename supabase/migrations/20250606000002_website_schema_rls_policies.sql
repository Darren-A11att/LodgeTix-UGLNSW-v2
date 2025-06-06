-- Complete RLS Policies for Website Schema
-- This ensures public can only read, and only service role can write

-- =====================================================
-- GRANT SCHEMA USAGE
-- =====================================================
GRANT USAGE ON SCHEMA website TO anon, authenticated;

-- =====================================================
-- GRANT TABLE PERMISSIONS
-- =====================================================
-- Grant SELECT to anon and authenticated users
GRANT SELECT ON ALL TABLES IN SCHEMA website TO anon, authenticated;

-- Revoke all write permissions from anon and authenticated
REVOKE INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA website FROM anon, authenticated;

-- =====================================================
-- RLS POLICIES - META TAGS
-- =====================================================
-- Drop existing policy to recreate with better name
DROP POLICY IF EXISTS "Public can view active meta tags" ON website.meta_tags;

-- Public read access
CREATE POLICY "Anyone can view active meta tags" 
    ON website.meta_tags 
    FOR SELECT 
    USING (is_active = true);

-- No write policies - only service role can modify

-- =====================================================
-- RLS POLICIES - HERO SECTIONS
-- =====================================================
DROP POLICY IF EXISTS "Public can view active hero sections" ON website.hero_sections;

CREATE POLICY "Anyone can view active hero sections" 
    ON website.hero_sections 
    FOR SELECT 
    USING (is_active = true);

-- =====================================================
-- RLS POLICIES - SPONSORS
-- =====================================================
DROP POLICY IF EXISTS "Public can view active sponsors" ON website.sponsors;

CREATE POLICY "Anyone can view active sponsors" 
    ON website.sponsors 
    FOR SELECT 
    USING (is_active = true);

-- =====================================================
-- RLS POLICIES - LOCATION INFO
-- =====================================================
DROP POLICY IF EXISTS "Public can view active location info" ON website.location_info;

CREATE POLICY "Anyone can view active location info" 
    ON website.location_info 
    FOR SELECT 
    USING (is_active = true);

-- =====================================================
-- RLS POLICIES - CTA SECTIONS
-- =====================================================
DROP POLICY IF EXISTS "Public can view active CTA sections" ON website.cta_sections;

CREATE POLICY "Anyone can view active CTA sections" 
    ON website.cta_sections 
    FOR SELECT 
    USING (is_active = true);

-- =====================================================
-- RLS POLICIES - NAVIGATION LINKS
-- =====================================================
DROP POLICY IF EXISTS "Public can view active navigation links" ON website.navigation_links;

CREATE POLICY "Anyone can view active navigation links" 
    ON website.navigation_links 
    FOR SELECT 
    USING (is_active = true);

-- =====================================================
-- RLS POLICIES - FOOTER CONTENT
-- =====================================================
DROP POLICY IF EXISTS "Public can view active footer content" ON website.footer_content;

CREATE POLICY "Anyone can view active footer content" 
    ON website.footer_content 
    FOR SELECT 
    USING (is_active = true);

-- =====================================================
-- RLS POLICIES - SPONSOR SECTIONS
-- =====================================================
DROP POLICY IF EXISTS "Public can view active sponsor sections" ON website.sponsor_sections;

CREATE POLICY "Anyone can view active sponsor sections" 
    ON website.sponsor_sections 
    FOR SELECT 
    USING (is_active = true);

-- =====================================================
-- RLS POLICIES - SCRIPTS
-- =====================================================
DROP POLICY IF EXISTS "Public can view active scripts" ON website.scripts;

CREATE POLICY "Anyone can view active scripts" 
    ON website.scripts 
    FOR SELECT 
    USING (is_active = true);

-- =====================================================
-- OPTIONAL: Admin Write Access
-- =====================================================
-- If you want specific authenticated users to edit content,
-- uncomment and modify these policies:

-- -- Check if user is an organiser for this function
-- CREATE OR REPLACE FUNCTION website.is_function_organiser(p_function_id UUID)
-- RETURNS BOOLEAN AS $$
-- BEGIN
--     RETURN EXISTS (
--         SELECT 1 
--         FROM public.organisers o
--         JOIN public.functions f ON f.organiser_id = o.organisation_id
--         WHERE f.function_id = p_function_id
--         AND o.user_id = auth.uid()
--     );
-- END;
-- $$ LANGUAGE plpgsql SECURITY DEFINER;

-- -- Example: Organisers can manage their function's content
-- CREATE POLICY "Organisers can manage hero sections" 
--     ON website.hero_sections 
--     FOR ALL 
--     USING (website.is_function_organiser(function_id));

-- =====================================================
-- VERIFY PERMISSIONS
-- =====================================================
-- This query shows current permissions (run in SQL editor)
-- SELECT 
--     schemaname,
--     tablename,
--     tableowner,
--     has_table_privilege('anon', schemaname||'.'||tablename, 'SELECT') as anon_select,
--     has_table_privilege('anon', schemaname||'.'||tablename, 'INSERT') as anon_insert,
--     has_table_privilege('anon', schemaname||'.'||tablename, 'UPDATE') as anon_update,
--     has_table_privilege('anon', schemaname||'.'||tablename, 'DELETE') as anon_delete
-- FROM pg_tables 
-- WHERE schemaname = 'website'
-- ORDER BY tablename;

-- =====================================================
-- IMPORTANT NOTES
-- =====================================================
-- 1. Service role (postgres user) bypasses RLS entirely
-- 2. Anon users can only SELECT active records
-- 3. Authenticated users can only SELECT active records
-- 4. No one except service role can INSERT/UPDATE/DELETE
-- 5. To edit content:
--    - Use Supabase Dashboard (logged in as project owner)
--    - Use service role key in admin API
--    - Or uncomment the organiser policies above