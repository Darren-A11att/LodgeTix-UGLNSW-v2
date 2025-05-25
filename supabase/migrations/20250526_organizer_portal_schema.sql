-- Migration: Organizer Portal Schema
-- Description: Creates organizer-centric schema for portal authentication and management
-- Date: 2025-05-26

BEGIN;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create organizers table (main entity for organizer portal)
CREATE TABLE IF NOT EXISTS organizers (
    organizer_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_name TEXT NOT NULL,
    organization_slug TEXT UNIQUE NOT NULL,
    organization_type TEXT DEFAULT 'lodge' CHECK (organization_type IN ('lodge', 'grand_lodge', 'association', 'other')),
    contact_email TEXT NOT NULL,
    contact_phone TEXT,
    address_line_1 TEXT,
    address_line_2 TEXT,
    city TEXT,
    state TEXT,
    postal_code TEXT,
    country TEXT DEFAULT 'Australia',
    website_url TEXT,
    description TEXT,
    logo_url TEXT,
    stripe_account_id TEXT, -- Will link to Stripe Connect account
    stripe_onboarding_complete BOOLEAN DEFAULT FALSE,
    stripe_charges_enabled BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create host_organisations joiner table
-- Links general organisations (for registration) with host organizers (for events)
CREATE TABLE IF NOT EXISTS host_organisations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organizer_id UUID NOT NULL REFERENCES organizers(organizer_id) ON DELETE CASCADE,
    organisation_id UUID, -- References existing organisations table if it exists
    organisation_name TEXT NOT NULL, -- Fallback if no direct organisation link
    relationship_type TEXT DEFAULT 'primary' CHECK (relationship_type IN ('primary', 'partner', 'sponsor')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organizer_id, organisation_id)
);

-- Update user_roles to link to organizers
ALTER TABLE user_roles 
ADD COLUMN IF NOT EXISTS organizer_id UUID REFERENCES organizers(organizer_id) ON DELETE CASCADE;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_organizers_slug ON organizers(organization_slug);
CREATE INDEX IF NOT EXISTS idx_organizers_stripe_account ON organizers(stripe_account_id);
CREATE INDEX IF NOT EXISTS idx_organizers_active ON organizers(is_active);
CREATE INDEX IF NOT EXISTS idx_host_organisations_organizer ON host_organisations(organizer_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_organizer ON user_roles(organizer_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_organizer ON user_roles(user_id, organizer_id);

-- Set up updated_at trigger for organizers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_organizers_updated_at 
    BEFORE UPDATE ON organizers 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_host_organisations_updated_at 
    BEFORE UPDATE ON host_organisations 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- RPC Function: Get organizer with user authentication
CREATE OR REPLACE FUNCTION get_organizer_by_user_id(user_uuid UUID)
RETURNS TABLE (
    organizer_id UUID,
    organization_name TEXT,
    organization_slug TEXT,
    contact_email TEXT,
    stripe_account_id TEXT,
    stripe_charges_enabled BOOLEAN,
    user_role TEXT,
    user_name TEXT,
    user_email TEXT
) 
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.organizer_id,
        o.organization_name,
        o.organization_slug,
        o.contact_email,
        o.stripe_account_id,
        o.stripe_charges_enabled,
        ur.role as user_role,
        COALESCE(p.first_name || ' ' || p.last_name, split_part(auth.email, '@', 1)) as user_name,
        auth.email as user_email
    FROM organizers o
    INNER JOIN user_roles ur ON o.organizer_id = ur.organizer_id
    INNER JOIN auth.users auth ON ur.user_id = auth.id
    LEFT JOIN people p ON p.auth_user_id = auth.id
    WHERE ur.user_id = user_uuid
    AND o.is_active = TRUE
    AND ur.role IN ('organizer', 'admin')
    LIMIT 1;
END;
$$;

-- RPC Function: Create new organizer registration
CREATE OR REPLACE FUNCTION create_organizer_registration(
    user_uuid UUID,
    org_name TEXT,
    org_slug TEXT,
    contact_email TEXT,
    contact_phone TEXT DEFAULT NULL,
    user_role TEXT DEFAULT 'organizer'
)
RETURNS TABLE (
    success BOOLEAN,
    organizer_id UUID,
    message TEXT
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
    new_organizer_id UUID;
    existing_role_count INTEGER;
BEGIN
    -- Check if user already has an organizer role
    SELECT COUNT(*) INTO existing_role_count 
    FROM user_roles 
    WHERE user_id = user_uuid 
    AND role IN ('organizer', 'admin');
    
    IF existing_role_count > 0 THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, 'User already has an organizer role'::TEXT;
        RETURN;
    END IF;
    
    -- Check if organization slug is available
    IF EXISTS (SELECT 1 FROM organizers WHERE organization_slug = org_slug) THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, 'Organization slug already exists'::TEXT;
        RETURN;
    END IF;
    
    -- Create organizer
    INSERT INTO organizers (
        organization_name,
        organization_slug,
        contact_email,
        contact_phone
    ) VALUES (
        org_name,
        org_slug,
        contact_email,
        contact_phone
    ) RETURNING organizer_id INTO new_organizer_id;
    
    -- Create user role
    INSERT INTO user_roles (
        user_id,
        role,
        organizer_id
    ) VALUES (
        user_uuid,
        user_role,
        new_organizer_id
    );
    
    RETURN QUERY SELECT TRUE, new_organizer_id, 'Organizer registration successful'::TEXT;
END;
$$;

-- RPC Function: Search organizations for autocomplete
CREATE OR REPLACE FUNCTION search_organizations(search_term TEXT)
RETURNS TABLE (
    organizer_id UUID,
    organization_name TEXT,
    organization_slug TEXT,
    organization_type TEXT
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.organizer_id,
        o.organization_name,
        o.organization_slug,
        o.organization_type
    FROM organizers o
    WHERE o.is_active = TRUE
    AND (
        o.organization_name ILIKE '%' || search_term || '%'
        OR o.organization_slug ILIKE '%' || search_term || '%'
    )
    ORDER BY 
        CASE 
            WHEN o.organization_name ILIKE search_term || '%' THEN 1
            WHEN o.organization_name ILIKE '%' || search_term || '%' THEN 2
            ELSE 3
        END,
        o.organization_name
    LIMIT 20;
END;
$$;

-- RPC Function: Get organizer financial summary (for TODO-007)
CREATE OR REPLACE FUNCTION get_organizer_financial_summary(
    org_id UUID,
    start_date DATE DEFAULT NULL,
    end_date DATE DEFAULT NULL
)
RETURNS TABLE (
    event_id UUID,
    event_name TEXT,
    total_revenue DECIMAL,
    total_pending DECIMAL,
    completed_registrations BIGINT,
    pending_registrations BIGINT,
    ticket_type_breakdown JSONB
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
    -- This will be implemented when we have events linked to organizers
    -- Placeholder for now
    RETURN QUERY
    SELECT 
        NULL::UUID as event_id,
        'No events found'::TEXT as event_name,
        0::DECIMAL as total_revenue,
        0::DECIMAL as total_pending,
        0::BIGINT as completed_registrations,
        0::BIGINT as pending_registrations,
        '{}'::JSONB as ticket_type_breakdown
    WHERE FALSE; -- Return empty for now
END;
$$;

-- Enable Row Level Security
ALTER TABLE organizers ENABLE ROW LEVEL SECURITY;
ALTER TABLE host_organisations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for organizers table
CREATE POLICY "Users can view their own organizer" ON organizers
    FOR SELECT USING (
        organizer_id IN (
            SELECT ur.organizer_id 
            FROM user_roles ur 
            WHERE ur.user_id = auth.uid() 
            AND ur.role IN ('organizer', 'admin')
        )
    );

CREATE POLICY "Users can update their own organizer" ON organizers
    FOR UPDATE USING (
        organizer_id IN (
            SELECT ur.organizer_id 
            FROM user_roles ur 
            WHERE ur.user_id = auth.uid() 
            AND ur.role IN ('organizer', 'admin')
        )
    );

-- RLS Policies for host_organisations table
CREATE POLICY "Users can view their organizer's host organisations" ON host_organisations
    FOR SELECT USING (
        organizer_id IN (
            SELECT ur.organizer_id 
            FROM user_roles ur 
            WHERE ur.user_id = auth.uid() 
            AND ur.role IN ('organizer', 'admin')
        )
    );

-- Insert sample data for testing (optional)
INSERT INTO organizers (
    organization_name,
    organization_slug,
    contact_email,
    organization_type,
    city,
    state,
    country
) VALUES 
(
    'United Grand Lodge of NSW & ACT',
    'ugl-nsw-act',
    'secretary@uglnsw.org.au',
    'grand_lodge',
    'Sydney',
    'NSW',
    'Australia'
),
(
    'Lodge St Andrews No. 32',
    'lodge-st-andrews-32',
    'secretary@standrews32.org.au',
    'lodge',
    'Sydney',
    'NSW',
    'Australia'
) ON CONFLICT (organization_slug) DO NOTHING;

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON organizers TO authenticated;
GRANT ALL ON host_organisations TO authenticated;
GRANT EXECUTE ON FUNCTION get_organizer_by_user_id(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION create_organizer_registration(UUID, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION search_organizations(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_organizer_financial_summary(UUID, DATE, DATE) TO authenticated;

COMMIT;