-- Migration: Create Organizer Portal Schema
-- This creates all the tables needed for the organizer portal functionality

-- =====================================================
-- ORGANIZER PORTAL TABLES
-- =====================================================

BEGIN;

-- 1. Organizers table - stores organizer user profiles
CREATE TABLE IF NOT EXISTS public.organizers (
    organizer_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    job_position VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT organizers_email_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT organizers_user_id_unique UNIQUE (user_id),
    CONSTRAINT organizers_email_unique UNIQUE (email)
);

-- 2. User Roles table - links organizers to organizations with roles
CREATE TABLE IF NOT EXISTS public.user_roles (
    role_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizer_id UUID NOT NULL REFERENCES public.organizers(organizer_id) ON DELETE CASCADE,
    organisation_id UUID NOT NULL REFERENCES public.host_organisations(organisation_id) ON DELETE CASCADE,
    role_name VARCHAR(50) NOT NULL CHECK (role_name IN ('admin', 'editor', 'viewer')),
    permissions TEXT[] DEFAULT ARRAY[]::TEXT[],
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT user_roles_organizer_org_unique UNIQUE (organizer_id, organisation_id)
);

-- =====================================================
-- RPC FUNCTIONS FOR ORGANIZER PORTAL
-- =====================================================

-- Function to get organizer by user ID
CREATE OR REPLACE FUNCTION public.get_organizer_by_user_id(user_uuid UUID)
RETURNS TABLE (
    organizer_id UUID,
    user_id UUID,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(50),
    job_position VARCHAR(100),
    is_active BOOLEAN,
    organisation_id UUID,
    organisation_name VARCHAR(255),
    role_name VARCHAR(50),
    permissions TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.organizer_id,
        o.user_id,
        o.first_name,
        o.last_name,
        o.email,
        o.phone,
        o.job_position,
        o.is_active,
        ho.organisation_id,
        ho.name as organisation_name,
        ur.role_name,
        ur.permissions
    FROM public.organizers o
    JOIN public.user_roles ur ON o.organizer_id = ur.organizer_id
    JOIN public.host_organisations ho ON ur.organisation_id = ho.organisation_id
    WHERE o.user_id = user_uuid
      AND o.is_active = true
      AND ur.is_active = true
    LIMIT 1;
END;
$$;

-- Function to get organizer events with counts
CREATE OR REPLACE FUNCTION public.get_organizer_events_with_counts(org_id UUID)
RETURNS TABLE (
    event_id UUID,
    title VARCHAR(255),
    description TEXT,
    event_start TIMESTAMPTZ,
    event_end TIMESTAMPTZ,
    location VARCHAR(255),
    status VARCHAR(50),
    registration_count BIGINT,
    attendee_count BIGINT,
    revenue NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.event_id,
        e.title,
        e.description,
        e.event_start,
        e.event_end,
        e.location,
        e.status,
        COALESCE(COUNT(DISTINCT r.registration_id), 0) as registration_count,
        COALESCE(SUM(r.attendee_count), 0) as attendee_count,
        COALESCE(SUM(CASE WHEN r.payment_status = 'paid' THEN r.total_amount_paid ELSE 0 END), 0) as revenue
    FROM public.events e
    LEFT JOIN public.registrations r ON e.event_id = r.event_id
    WHERE e.host_organisation_id = org_id
    GROUP BY e.event_id, e.title, e.description, e.event_start, e.event_end, e.location, e.status
    ORDER BY e.event_start DESC;
END;
$$;

-- Function to get event registrations with attendee details
CREATE OR REPLACE FUNCTION public.get_event_registrations(
    event_uuid UUID,
    search_term TEXT DEFAULT NULL,
    payment_status_filter VARCHAR(50) DEFAULT NULL,
    limit_count INT DEFAULT 50,
    offset_count INT DEFAULT 0
)
RETURNS TABLE (
    registration_id UUID,
    customer_id UUID,
    customer_first_name VARCHAR(100),
    customer_last_name VARCHAR(100),
    customer_email VARCHAR(255),
    customer_phone VARCHAR(50),
    payment_status VARCHAR(50),
    registration_status VARCHAR(50),
    registration_type VARCHAR(50),
    registration_date TIMESTAMPTZ,
    total_amount_paid NUMERIC,
    total_price_paid NUMERIC,
    stripe_payment_intent_id VARCHAR(255),
    attendee_count BIGINT,
    attendees JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.registration_id,
        r.customer_id,
        c.first_name as customer_first_name,
        c.last_name as customer_last_name,
        c.email as customer_email,
        c.phone as customer_phone,
        r.payment_status,
        r.registration_status,
        r.registration_type,
        r.created_at as registration_date,
        r.total_amount_paid,
        r.total_price_paid,
        r.stripe_payment_intent_id,
        r.attendee_count,
        COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'attendee_id', a.attendee_id,
                    'attendee_type', a.attendee_type,
                    'first_name', a.first_name,
                    'last_name', a.last_name,
                    'dietary_requirements', a.dietary_requirements,
                    'special_needs', a.special_needs,
                    'relationship', a.relationship,
                    'contact_preference', a.contact_preference
                )
            ) FILTER (WHERE a.attendee_id IS NOT NULL),
            '[]'::jsonb
        ) as attendees
    FROM public.registrations r
    JOIN public.customers c ON r.customer_id = c.customer_id
    LEFT JOIN public.attendees a ON r.registration_id = a.registration_id
    WHERE r.event_id = event_uuid
      AND (search_term IS NULL OR 
           LOWER(c.first_name || ' ' || c.last_name || ' ' || c.email) LIKE LOWER('%' || search_term || '%') OR
           LOWER(a.first_name || ' ' || a.last_name) LIKE LOWER('%' || search_term || '%'))
      AND (payment_status_filter IS NULL OR r.payment_status = payment_status_filter)
    GROUP BY r.registration_id, r.customer_id, c.first_name, c.last_name, c.email, c.phone,
             r.payment_status, r.registration_status, r.registration_type, r.created_at,
             r.total_amount_paid, r.total_price_paid, r.stripe_payment_intent_id, r.attendee_count
    ORDER BY r.created_at DESC
    LIMIT limit_count OFFSET offset_count;
END;
$$;

-- Function to get event registration statistics
CREATE OR REPLACE FUNCTION public.get_event_registration_stats(event_uuid UUID)
RETURNS TABLE (
    total_registrations BIGINT,
    total_attendees BIGINT,
    paid_registrations BIGINT,
    pending_registrations BIGINT,
    failed_registrations BIGINT,
    total_revenue NUMERIC,
    average_order_value NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_registrations,
        COALESCE(SUM(r.attendee_count), 0) as total_attendees,
        COUNT(*) FILTER (WHERE r.payment_status = 'paid') as paid_registrations,
        COUNT(*) FILTER (WHERE r.payment_status = 'pending') as pending_registrations,
        COUNT(*) FILTER (WHERE r.payment_status = 'failed') as failed_registrations,
        COALESCE(SUM(CASE WHEN r.payment_status = 'paid' THEN r.total_amount_paid ELSE 0 END), 0) as total_revenue,
        CASE 
            WHEN COUNT(*) > 0 THEN 
                COALESCE(SUM(CASE WHEN r.payment_status = 'paid' THEN r.total_amount_paid ELSE 0 END), 0) / COUNT(*)
            ELSE 0 
        END as average_order_value
    FROM public.registrations r
    WHERE r.event_id = event_uuid;
END;
$$;

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on organizer tables
ALTER TABLE public.organizers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Policy: Organizers can only see their own record
CREATE POLICY "Organizers can view own record" ON public.organizers
    FOR SELECT USING (user_id = auth.uid());

-- Policy: Organizers can update their own record
CREATE POLICY "Organizers can update own record" ON public.organizers
    FOR UPDATE USING (user_id = auth.uid());

-- Policy: Organizers can insert their own record
CREATE POLICY "Organizers can insert own record" ON public.organizers
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Policy: User roles are viewable by the organizer they belong to
CREATE POLICY "User roles viewable by organizer" ON public.user_roles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.organizers o 
            WHERE o.organizer_id = user_roles.organizer_id 
              AND o.user_id = auth.uid()
        )
    );

-- Policy: Allow inserting user roles for own organizer record
CREATE POLICY "User roles insertable by organizer" ON public.user_roles
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.organizers o 
            WHERE o.organizer_id = user_roles.organizer_id 
              AND o.user_id = auth.uid()
        )
    );

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Indexes on organizers table
CREATE INDEX IF NOT EXISTS idx_organizers_user_id ON public.organizers(user_id);
CREATE INDEX IF NOT EXISTS idx_organizers_email ON public.organizers(email);
CREATE INDEX IF NOT EXISTS idx_organizers_active ON public.organizers(is_active) WHERE is_active = true;

-- Indexes on user_roles table
CREATE INDEX IF NOT EXISTS idx_user_roles_organizer_id ON public.user_roles(organizer_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_organisation_id ON public.user_roles(organisation_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_active ON public.user_roles(is_active) WHERE is_active = true;

-- Composite index for role lookups
CREATE INDEX IF NOT EXISTS idx_user_roles_organizer_org ON public.user_roles(organizer_id, organisation_id);

-- =====================================================
-- GRANTS AND PERMISSIONS
-- =====================================================

-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON public.organizers TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.user_roles TO authenticated;

-- Grant EXECUTE on RPC functions
GRANT EXECUTE ON FUNCTION public.get_organizer_by_user_id(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_organizer_events_with_counts(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_event_registrations(UUID, TEXT, VARCHAR(50), INT, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_event_registration_stats(UUID) TO authenticated;

COMMIT;

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Verify tables were created
SELECT 
    table_name,
    CASE 
        WHEN table_name IN ('organizers', 'user_roles') THEN '✅ Created'
        ELSE '❌ Missing'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('organizers', 'user_roles')
ORDER BY table_name;

-- Verify RPC functions were created
SELECT 
    routine_name,
    '✅ Created' as status
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name LIKE 'get_organizer%'
ORDER BY routine_name;