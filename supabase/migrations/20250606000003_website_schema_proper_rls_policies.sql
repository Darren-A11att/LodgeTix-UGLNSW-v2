-- Proper RLS Policies for Website Schema
-- Uses authentication and user roles, NOT service role

-- =====================================================
-- DROP OLD POLICIES
-- =====================================================
DROP POLICY IF EXISTS "Anyone can view active meta tags" ON website.meta_tags;
DROP POLICY IF EXISTS "Anyone can view active hero sections" ON website.hero_sections;
DROP POLICY IF EXISTS "Anyone can view active sponsors" ON website.sponsors;
DROP POLICY IF EXISTS "Anyone can view active location info" ON website.location_info;
DROP POLICY IF EXISTS "Anyone can view active CTA sections" ON website.cta_sections;
DROP POLICY IF EXISTS "Anyone can view active navigation links" ON website.navigation_links;
DROP POLICY IF EXISTS "Anyone can view active footer content" ON website.footer_content;
DROP POLICY IF EXISTS "Anyone can view active sponsor sections" ON website.sponsor_sections;
DROP POLICY IF EXISTS "Anyone can view active scripts" ON website.scripts;

-- =====================================================
-- HELPER FUNCTIONS FOR PERMISSIONS
-- =====================================================

-- Check if user is an organiser for a specific function
CREATE OR REPLACE FUNCTION website.user_can_edit_function_content(p_function_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Allow if user is an organiser for this function
    RETURN EXISTS (
        SELECT 1 
        FROM public.organisers o
        JOIN public.functions f ON f.organiser_id = o.organisation_id
        WHERE f.function_id = p_function_id
        AND o.user_id = auth.uid()
        AND o.is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is a super admin (can edit any content)
CREATE OR REPLACE FUNCTION website.user_is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if user has admin role in your system
    -- Adjust this based on your user/role structure
    RETURN EXISTS (
        SELECT 1 
        FROM public.profiles
        WHERE user_id = auth.uid()
        AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- META TAGS POLICIES
-- =====================================================
-- Public read
CREATE POLICY "Public can view active meta tags" 
    ON website.meta_tags 
    FOR SELECT 
    USING (is_active = true);

-- Authenticated users can manage content for their functions
CREATE POLICY "Organisers can insert meta tags" 
    ON website.meta_tags 
    FOR INSERT 
    WITH CHECK (
        auth.uid() IS NOT NULL AND 
        (website.user_can_edit_function_content(function_id) OR website.user_is_admin())
    );

CREATE POLICY "Organisers can update meta tags" 
    ON website.meta_tags 
    FOR UPDATE 
    USING (
        auth.uid() IS NOT NULL AND 
        (website.user_can_edit_function_content(function_id) OR website.user_is_admin())
    );

CREATE POLICY "Organisers can delete meta tags" 
    ON website.meta_tags 
    FOR DELETE 
    USING (
        auth.uid() IS NOT NULL AND 
        (website.user_can_edit_function_content(function_id) OR website.user_is_admin())
    );

-- =====================================================
-- HERO SECTIONS POLICIES
-- =====================================================
CREATE POLICY "Public can view active hero sections" 
    ON website.hero_sections 
    FOR SELECT 
    USING (is_active = true);

CREATE POLICY "Organisers can insert hero sections" 
    ON website.hero_sections 
    FOR INSERT 
    WITH CHECK (
        auth.uid() IS NOT NULL AND 
        (website.user_can_edit_function_content(function_id) OR website.user_is_admin())
    );

CREATE POLICY "Organisers can update hero sections" 
    ON website.hero_sections 
    FOR UPDATE 
    USING (
        auth.uid() IS NOT NULL AND 
        (website.user_can_edit_function_content(function_id) OR website.user_is_admin())
    );

CREATE POLICY "Organisers can delete hero sections" 
    ON website.hero_sections 
    FOR DELETE 
    USING (
        auth.uid() IS NOT NULL AND 
        (website.user_can_edit_function_content(function_id) OR website.user_is_admin())
    );

-- =====================================================
-- SPONSORS POLICIES
-- =====================================================
CREATE POLICY "Public can view active sponsors" 
    ON website.sponsors 
    FOR SELECT 
    USING (is_active = true);

CREATE POLICY "Organisers can insert sponsors" 
    ON website.sponsors 
    FOR INSERT 
    WITH CHECK (
        auth.uid() IS NOT NULL AND 
        (website.user_can_edit_function_content(function_id) OR website.user_is_admin())
    );

CREATE POLICY "Organisers can update sponsors" 
    ON website.sponsors 
    FOR UPDATE 
    USING (
        auth.uid() IS NOT NULL AND 
        (website.user_can_edit_function_content(function_id) OR website.user_is_admin())
    );

CREATE POLICY "Organisers can delete sponsors" 
    ON website.sponsors 
    FOR DELETE 
    USING (
        auth.uid() IS NOT NULL AND 
        (website.user_can_edit_function_content(function_id) OR website.user_is_admin())
    );

-- =====================================================
-- LOCATION INFO POLICIES
-- =====================================================
CREATE POLICY "Public can view active location info" 
    ON website.location_info 
    FOR SELECT 
    USING (is_active = true);

CREATE POLICY "Organisers can insert location info" 
    ON website.location_info 
    FOR INSERT 
    WITH CHECK (
        auth.uid() IS NOT NULL AND 
        (website.user_can_edit_function_content(function_id) OR website.user_is_admin())
    );

CREATE POLICY "Organisers can update location info" 
    ON website.location_info 
    FOR UPDATE 
    USING (
        auth.uid() IS NOT NULL AND 
        (website.user_can_edit_function_content(function_id) OR website.user_is_admin())
    );

CREATE POLICY "Organisers can delete location info" 
    ON website.location_info 
    FOR DELETE 
    USING (
        auth.uid() IS NOT NULL AND 
        (website.user_can_edit_function_content(function_id) OR website.user_is_admin())
    );

-- =====================================================
-- CTA SECTIONS POLICIES
-- =====================================================
CREATE POLICY "Public can view active CTA sections" 
    ON website.cta_sections 
    FOR SELECT 
    USING (is_active = true);

CREATE POLICY "Organisers can insert CTA sections" 
    ON website.cta_sections 
    FOR INSERT 
    WITH CHECK (
        auth.uid() IS NOT NULL AND 
        (website.user_can_edit_function_content(function_id) OR website.user_is_admin())
    );

CREATE POLICY "Organisers can update CTA sections" 
    ON website.cta_sections 
    FOR UPDATE 
    USING (
        auth.uid() IS NOT NULL AND 
        (website.user_can_edit_function_content(function_id) OR website.user_is_admin())
    );

CREATE POLICY "Organisers can delete CTA sections" 
    ON website.cta_sections 
    FOR DELETE 
    USING (
        auth.uid() IS NOT NULL AND 
        (website.user_can_edit_function_content(function_id) OR website.user_is_admin())
    );

-- =====================================================
-- NAVIGATION LINKS POLICIES (Global content - no function_id)
-- =====================================================
CREATE POLICY "Public can view active navigation links" 
    ON website.navigation_links 
    FOR SELECT 
    USING (is_active = true);

-- Only admins can manage global navigation
CREATE POLICY "Admins can insert navigation links" 
    ON website.navigation_links 
    FOR INSERT 
    WITH CHECK (
        auth.uid() IS NOT NULL AND website.user_is_admin()
    );

CREATE POLICY "Admins can update navigation links" 
    ON website.navigation_links 
    FOR UPDATE 
    USING (
        auth.uid() IS NOT NULL AND website.user_is_admin()
    );

CREATE POLICY "Admins can delete navigation links" 
    ON website.navigation_links 
    FOR DELETE 
    USING (
        auth.uid() IS NOT NULL AND website.user_is_admin()
    );

-- =====================================================
-- FOOTER CONTENT POLICIES (Global content)
-- =====================================================
CREATE POLICY "Public can view active footer content" 
    ON website.footer_content 
    FOR SELECT 
    USING (is_active = true);

CREATE POLICY "Admins can insert footer content" 
    ON website.footer_content 
    FOR INSERT 
    WITH CHECK (
        auth.uid() IS NOT NULL AND website.user_is_admin()
    );

CREATE POLICY "Admins can update footer content" 
    ON website.footer_content 
    FOR UPDATE 
    USING (
        auth.uid() IS NOT NULL AND website.user_is_admin()
    );

CREATE POLICY "Admins can delete footer content" 
    ON website.footer_content 
    FOR DELETE 
    USING (
        auth.uid() IS NOT NULL AND website.user_is_admin()
    );

-- =====================================================
-- SPONSOR SECTIONS POLICIES
-- =====================================================
CREATE POLICY "Public can view active sponsor sections" 
    ON website.sponsor_sections 
    FOR SELECT 
    USING (is_active = true);

CREATE POLICY "Organisers can insert sponsor sections" 
    ON website.sponsor_sections 
    FOR INSERT 
    WITH CHECK (
        auth.uid() IS NOT NULL AND 
        (website.user_can_edit_function_content(function_id) OR website.user_is_admin())
    );

CREATE POLICY "Organisers can update sponsor sections" 
    ON website.sponsor_sections 
    FOR UPDATE 
    USING (
        auth.uid() IS NOT NULL AND 
        (website.user_can_edit_function_content(function_id) OR website.user_is_admin())
    );

CREATE POLICY "Organisers can delete sponsor sections" 
    ON website.sponsor_sections 
    FOR DELETE 
    USING (
        auth.uid() IS NOT NULL AND 
        (website.user_can_edit_function_content(function_id) OR website.user_is_admin())
    );

-- =====================================================
-- SCRIPTS POLICIES (Global content)
-- =====================================================
CREATE POLICY "Public can view active scripts" 
    ON website.scripts 
    FOR SELECT 
    USING (is_active = true);

CREATE POLICY "Admins can insert scripts" 
    ON website.scripts 
    FOR INSERT 
    WITH CHECK (
        auth.uid() IS NOT NULL AND website.user_is_admin()
    );

CREATE POLICY "Admins can update scripts" 
    ON website.scripts 
    FOR UPDATE 
    USING (
        auth.uid() IS NOT NULL AND website.user_is_admin()
    );

CREATE POLICY "Admins can delete scripts" 
    ON website.scripts 
    FOR DELETE 
    USING (
        auth.uid() IS NOT NULL AND website.user_is_admin()
    );

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================
-- Grant usage on schema
GRANT USAGE ON SCHEMA website TO anon, authenticated;

-- Grant appropriate permissions
GRANT SELECT ON ALL TABLES IN SCHEMA website TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA website TO authenticated;

-- Grant sequence usage for authenticated users (for inserts)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA website TO authenticated;

-- =====================================================
-- NOTES ON USAGE
-- =====================================================
-- 1. Public (anon) users can only read active content
-- 2. Authenticated organisers can edit content for their functions
-- 3. Admin users can edit any content
-- 4. No service role key needed!
-- 5. All access is controlled through proper authentication

-- To make a user an admin, update their profile:
-- UPDATE public.profiles SET role = 'admin' WHERE user_id = 'user-uuid';

-- To make a user an organiser, add them to organisers table:
-- INSERT INTO public.organisers (user_id, organisation_id, is_active) 
-- VALUES ('user-uuid', 'org-uuid', true);