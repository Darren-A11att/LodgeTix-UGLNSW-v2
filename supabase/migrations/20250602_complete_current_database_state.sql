-- ============================================================================
-- COMPLETE DATABASE STATE MIGRATION
-- Date: 2025-06-02
-- Description: This migration represents the complete database state after all
--              migrations have been applied chronologically. Use this to ensure
--              your database is in the current expected state.
-- ============================================================================

-- Start transaction
BEGIN;

-- ============================================================================
-- 1. CUSTOM TYPES AND ENUMS
-- ============================================================================

-- Attendee Type
DO $$ BEGIN
    CREATE TYPE public.attendee_type AS ENUM ('mason', 'guest', 'partner');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Contact Type  
DO $$ BEGIN
    CREATE TYPE public.contact_type AS ENUM ('individual', 'organisation', 'mason', 'guest');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Customer Type
DO $$ BEGIN
    CREATE TYPE public.customer_type AS ENUM ('individual', 'organisation');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Organisation Type
DO $$ BEGIN
    CREATE TYPE public.organisation_type AS ENUM ('grand_lodge', 'lodge', 'masonic_organisation', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Payment Status
DO $$ BEGIN
    CREATE TYPE public.payment_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded', 'partially_refunded', 'expired');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Registration Type
DO $$ BEGIN
    CREATE TYPE public.registration_type AS ENUM ('individual', 'lodge', 'delegation');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Attendee Contact Preference
DO $$ BEGIN
    CREATE TYPE public.attendee_contact_preference AS ENUM ('email', 'phone', 'both', 'none');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Package Item Composite Type
DO $$ BEGIN
    CREATE TYPE public.package_item AS (
        item_type text,
        item_id uuid,
        quantity integer,
        description text
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- 2. BASE TABLES
-- ============================================================================

-- Organisations table
CREATE TABLE IF NOT EXISTS public.organisations (
    organisation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type public.organisation_type NOT NULL,
    street_address VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100),
    website VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    known_as TEXT,
    abbreviation TEXT,
    stripe_onbehalfof TEXT,
    stripe_account_status TEXT DEFAULT 'pending',
    stripe_payouts_enabled BOOLEAN DEFAULT FALSE,
    stripe_details_submitted BOOLEAN DEFAULT FALSE,
    stripe_capabilities JSONB,
    CONSTRAINT organisations_organisationid_key UNIQUE (organisation_id)
);

-- Locations table
CREATE TABLE IF NOT EXISTS public.locations (
    location_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_or_area VARCHAR(255),
    place_name VARCHAR(255) NOT NULL,
    street_address VARCHAR(255),
    suburb VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100),
    latitude NUMERIC(9,6),
    longitude NUMERIC(9,6),
    capacity INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Display scopes table
CREATE TABLE IF NOT EXISTS public.display_scopes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Eligibility criteria table
CREATE TABLE IF NOT EXISTS public.eligibility_criteria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    criteria TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    type TEXT
);

-- Events table
CREATE TABLE IF NOT EXISTS public.events (
    event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    type TEXT,
    is_purchasable_individually BOOLEAN DEFAULT true,
    max_attendees BIGINT,
    featured BOOLEAN DEFAULT false,
    image_url TEXT,
    event_includes TEXT[],
    important_information TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    is_multi_day BOOLEAN DEFAULT false,
    parent_event_id UUID REFERENCES events(event_id) ON DELETE RESTRICT,
    registration_availability_id UUID REFERENCES eligibility_criteria(id),
    display_scope_id UUID REFERENCES display_scopes(id),
    slug TEXT NOT NULL UNIQUE,
    event_start TIMESTAMPTZ,
    event_end TIMESTAMPTZ,
    location_id UUID REFERENCES locations(location_id) ON DELETE SET NULL,
    subtitle TEXT,
    is_published BOOLEAN DEFAULT true,
    regalia TEXT,
    regalia_description TEXT,
    dress_code TEXT,
    degree_type TEXT,
    sections JSONB,
    attendance JSONB,
    documents JSONB,
    related_events UUID[],
    organiser_id UUID REFERENCES organisations(organisation_id) ON DELETE SET NULL,
    reserved_count INTEGER NOT NULL DEFAULT 0,
    sold_count INTEGER NOT NULL DEFAULT 0,
    banner_image_url TEXT,
    long_description TEXT,
    stripe_product_id TEXT,
    CONSTRAINT events_slug_key UNIQUE (slug),
    CONSTRAINT events_id_uuid_unique UNIQUE (event_id),
    CONSTRAINT check_sold_count_non_negative CHECK (sold_count >= 0),
    CONSTRAINT check_reserved_count_non_negative CHECK (reserved_count >= 0)
);

-- Grand Lodges table
CREATE TABLE IF NOT EXISTS public.grand_lodges (
    grand_lodge_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    country TEXT,
    abbreviation TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    country_code_iso3 TEXT,
    state_region TEXT,
    state_region_code TEXT,
    organisation_id UUID REFERENCES organisations(organisation_id),
    CONSTRAINT grand_lodges_id_uuid_unique UNIQUE (grand_lodge_id)
);

-- Lodges table
CREATE TABLE IF NOT EXISTS public.lodges (
    lodge_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    number NUMERIC,
    display_name TEXT,
    district TEXT,
    meeting_place TEXT,
    area_type TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    grand_lodge_id UUID REFERENCES grand_lodges(grand_lodge_id) ON DELETE RESTRICT,
    state_region TEXT,
    organisation_id UUID REFERENCES organisations(organisation_id)
);

-- Contacts table
CREATE TABLE IF NOT EXISTS public.contacts (
    contact_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    suffix_1 TEXT,
    suffix_2 TEXT,
    suffix_3 TEXT,
    contact_preference TEXT,
    mobile_number TEXT,
    email TEXT NOT NULL,
    address_line_1 TEXT,
    address_line_2 TEXT,
    suburb_city TEXT,
    state TEXT,
    country TEXT,
    postcode TEXT,
    dietary_requirements TEXT,
    special_needs TEXT,
    type public.contact_type NOT NULL,
    has_partner BOOLEAN DEFAULT false,
    is_partner BOOLEAN DEFAULT false,
    organisation_id UUID REFERENCES organisations(organisation_id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    auth_user_id UUID,
    billing_organisation_name VARCHAR(255),
    billing_email VARCHAR(255),
    billing_phone VARCHAR(255),
    billing_street_address VARCHAR(255),
    billing_city VARCHAR(255),
    billing_state VARCHAR(255),
    billing_postal_code VARCHAR(255),
    billing_country VARCHAR(255),
    stripe_customer_id VARCHAR(255),
    business_name TEXT,
    source_type TEXT,
    source_id UUID
);

-- Customers table
CREATE TABLE IF NOT EXISTS public.customers (
    customer_id UUID PRIMARY KEY,
    organisation_id UUID,
    first_name TEXT,
    last_name TEXT,
    business_name TEXT,
    email TEXT,
    phone TEXT,
    billing_organisation_name VARCHAR,
    billing_email VARCHAR,
    billing_phone VARCHAR,
    billing_street_address VARCHAR,
    billing_city VARCHAR,
    billing_state VARCHAR,
    billing_postal_code VARCHAR,
    billing_country VARCHAR,
    address_line1 TEXT,
    address_line2 TEXT,
    city TEXT,
    state TEXT,
    postal_code TEXT,
    country TEXT,
    stripe_customer_id VARCHAR,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    contact_id UUID REFERENCES contacts(contact_id) ON DELETE SET NULL,
    customer_type public.customer_type
);

-- Masonic Profiles table
CREATE TABLE IF NOT EXISTS public.masonic_profiles (
    masonic_profile_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    masonic_title VARCHAR(50),
    rank VARCHAR(50),
    grand_rank VARCHAR(50),
    grand_officer VARCHAR(50),
    grand_office VARCHAR(100),
    lodge_id UUID REFERENCES organisations(organisation_id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    grand_lodge_id UUID REFERENCES organisations(organisation_id),
    contact_id UUID REFERENCES contacts(contact_id) ON DELETE SET NULL,
    CONSTRAINT masonic_profiles_contact_id_unique UNIQUE (contact_id),
    CONSTRAINT check_masonic_affiliation CHECK ((lodge_id IS NOT NULL) OR (grand_lodge_id IS NOT NULL))
);

-- Memberships table
CREATE TABLE IF NOT EXISTS public.memberships (
    membership_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id UUID NOT NULL REFERENCES contacts(contact_id) ON DELETE CASCADE,
    profile_id UUID REFERENCES masonic_profiles(masonic_profile_id) ON DELETE SET NULL,
    role VARCHAR(50) DEFAULT 'member'::character varying,
    permissions TEXT[] DEFAULT ARRAY['read'::text, 'update_own_data'::text],
    membership_type VARCHAR(50) NOT NULL,
    membership_entity_id UUID NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_membership UNIQUE (contact_id, membership_type, membership_entity_id)
);

-- Registrations table
CREATE TABLE IF NOT EXISTS public.registrations (
    registration_id UUID PRIMARY KEY,
    contact_id UUID REFERENCES contacts(contact_id) ON DELETE SET NULL,
    event_id UUID,
    registration_date TIMESTAMPTZ,
    status VARCHAR(50),
    total_amount_paid NUMERIC,
    total_price_paid NUMERIC,
    payment_status public.payment_status DEFAULT 'pending'::payment_status,
    agree_to_terms BOOLEAN DEFAULT false,
    stripe_payment_intent_id TEXT,
    primary_attendee_id UUID,
    registration_type public.registration_type,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    registration_data JSONB,
    confirmation_number TEXT,
    organisation_id UUID REFERENCES organisations(organisation_id) ON UPDATE CASCADE ON DELETE SET NULL,
    confirmation_sent_at TIMESTAMPTZ,
    reminder_sent_at TIMESTAMPTZ,
    registration_metadata JSONB DEFAULT '{}'::jsonb,
    connected_account_id TEXT,
    platform_fee_amount DECIMAL(10,2),
    platform_fee_id TEXT,
    subtotal DECIMAL(10,2),
    stripe_fee DECIMAL(10,2),
    includes_processing_fee BOOLEAN DEFAULT false,
    confirmation_pdf_url TEXT,
    CONSTRAINT check_valid_registration_type CHECK (registration_type IN ('individual', 'lodge', 'delegation')),
    CONSTRAINT check_valid_payment_status CHECK (payment_status IN ('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'))
);

-- Add missing column for legacy compatibility
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS customer_id TEXT;

-- Attendees table
CREATE TABLE IF NOT EXISTS public.attendees (
    attendee_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_id UUID NOT NULL REFERENCES registrations(registration_id),
    attendee_type public.attendee_type NOT NULL,
    dietary_requirements TEXT,
    special_needs TEXT,
    contact_preference public.attendee_contact_preference NOT NULL,
    related_attendee_id UUID REFERENCES attendees(attendee_id) ON DELETE SET NULL,
    relationship VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    title TEXT,
    first_name TEXT,
    last_name TEXT,
    suffix TEXT,
    email TEXT,
    phone TEXT,
    is_primary BOOLEAN DEFAULT false,
    is_partner BOOLEAN, -- Changed from TEXT to BOOLEAN
    has_partner BOOLEAN DEFAULT false,
    contact_id UUID REFERENCES contacts(contact_id) ON DELETE SET NULL
);

-- Packages table
CREATE TABLE IF NOT EXISTS public.packages (
    package_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_event_id UUID REFERENCES events(event_id) ON DELETE CASCADE,
    event_id UUID REFERENCES events(event_id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    original_price NUMERIC(10,2),
    discount NUMERIC(10,2) DEFAULT 0,
    package_price NUMERIC(10,2) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    includes_description TEXT[],
    qty INTEGER DEFAULT 1,
    included_items package_item[],
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    eligibility_criteria JSONB DEFAULT '{"rules": []}'::jsonb
);

-- Event Tickets table
CREATE TABLE IF NOT EXISTS public.event_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(event_id),
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC NOT NULL,
    total_capacity INTEGER,
    available_count INTEGER,
    reserved_count INTEGER DEFAULT 0,
    sold_count INTEGER DEFAULT 0,
    status VARCHAR DEFAULT 'Active'::character varying,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    eligibility_criteria JSONB DEFAULT '{"rules": []}'::jsonb,
    stripe_price_id TEXT,
    waitlist_count INTEGER DEFAULT 0,
    max_waitlist INTEGER DEFAULT 0
);

-- Tickets table
CREATE TABLE IF NOT EXISTS public.tickets (
    ticket_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attendee_id UUID REFERENCES attendees(attendee_id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES events(event_id) ON DELETE CASCADE,
    price_paid NUMERIC(10,2) NOT NULL,
    seat_info VARCHAR(100),
    status VARCHAR(50) NOT NULL DEFAULT 'available'::character varying,
    checked_in_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    reservation_id UUID,
    reservation_expires_at TIMESTAMPTZ,
    original_price NUMERIC(10,2),
    currency VARCHAR(3) DEFAULT 'AUD'::character varying,
    payment_status VARCHAR(50) DEFAULT 'Unpaid'::character varying,
    purchased_at TIMESTAMPTZ,
    package_id UUID REFERENCES packages(package_id) ON DELETE SET NULL,
    id UUID,
    registration_id UUID REFERENCES registrations(registration_id) ON DELETE CASCADE,
    ticket_type_id UUID REFERENCES event_tickets(id) ON DELETE RESTRICT,
    ticket_price NUMERIC,
    ticket_status VARCHAR(50),
    is_partner_ticket BOOLEAN DEFAULT false,
    qr_code_url TEXT,
    qr_code_generated_at TIMESTAMPTZ,
    confirmation_sent_at TIMESTAMPTZ,
    payment_intent_id TEXT,
    ticket_number TEXT,
    qr_code TEXT,
    CONSTRAINT tickets_attendeeid_eventid_key UNIQUE (attendee_id, event_id),
    CONSTRAINT check_valid_ticket_status CHECK (status IN ('available', 'reserved', 'sold', 'used', 'cancelled'))
);

-- Attendee Events table
CREATE TABLE IF NOT EXISTS public.attendee_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attendee_id UUID NOT NULL REFERENCES attendees(attendee_id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES events(event_id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'confirmed'::character varying,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User Roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    role VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role)
);

-- Email Log table
CREATE TABLE IF NOT EXISTS public.email_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_id UUID REFERENCES registrations(registration_id),
    email_type VARCHAR(50) NOT NULL,
    recipient_email TEXT NOT NULL,
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'sent',
    error_message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT check_valid_email_status CHECK (status IN ('sent', 'failed', 'bounced', 'pending', 'queued'))
);

-- Documents table
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_id UUID REFERENCES registrations(registration_id),
    document_type VARCHAR(50) NOT NULL,
    storage_path TEXT NOT NULL,
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stripe Connect tables
CREATE TABLE IF NOT EXISTS public.organisation_payouts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    payout_id TEXT NOT NULL UNIQUE,
    organisation_stripe_id TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT NOT NULL,
    status TEXT NOT NULL,
    arrival_date TIMESTAMPTZ NOT NULL,
    method TEXT,
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.platform_transfers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    transfer_id TEXT NOT NULL UNIQUE,
    source_transaction TEXT,
    destination_account TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT NOT NULL,
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.connected_account_payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    payment_intent_id TEXT NOT NULL,
    connected_account_id TEXT NOT NULL,
    registration_id UUID REFERENCES registrations(registration_id),
    amount DECIMAL(10,2) NOT NULL,
    platform_fee DECIMAL(10,2),
    currency TEXT NOT NULL,
    status TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Registration Payments table (referenced but not explicitly created in migrations)
CREATE TABLE IF NOT EXISTS public.registration_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_id UUID REFERENCES registrations(registration_id),
    amount DECIMAL(10,2),
    currency VARCHAR(3),
    payment_method VARCHAR(50),
    payment_status VARCHAR(50),
    stripe_payment_intent_id TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 3. TRIGGER FUNCTIONS
-- ============================================================================

-- Update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Update event ticket counts
CREATE OR REPLACE FUNCTION update_event_ticket_counts()
RETURNS TRIGGER AS $$
DECLARE
    v_ticket_type_id UUID;
    v_event_id UUID;
BEGIN
    -- Determine the ticket_type_id and event_id based on operation
    IF TG_OP = 'DELETE' THEN
        v_ticket_type_id := OLD.ticket_type_id;
        v_event_id := OLD.event_id;
    ELSE
        v_ticket_type_id := NEW.ticket_type_id;
        v_event_id := NEW.event_id;
    END IF;
    
    -- Update event_tickets counts
    UPDATE event_tickets
    SET 
        sold_count = (
            SELECT COUNT(*) 
            FROM tickets 
            WHERE ticket_type_id = v_ticket_type_id 
            AND status = 'sold'
        ),
        reserved_count = (
            SELECT COUNT(*) 
            FROM tickets 
            WHERE ticket_type_id = v_ticket_type_id 
            AND status = 'reserved'
            AND reservation_expires_at > NOW()
        ),
        available_count = GREATEST(
            0,
            total_capacity - (
                SELECT COUNT(*) 
                FROM tickets 
                WHERE ticket_type_id = v_ticket_type_id 
                AND status IN ('sold', 'reserved')
            )
        )
    WHERE id = v_ticket_type_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update event counts
CREATE OR REPLACE FUNCTION update_event_counts()
RETURNS TRIGGER AS $$
DECLARE
    v_event_id UUID;
BEGIN
    -- Determine event_id based on operation
    IF TG_OP = 'DELETE' THEN
        v_event_id := OLD.event_id;
    ELSE
        v_event_id := NEW.event_id;
    END IF;
    
    -- Update events counts
    UPDATE events
    SET 
        sold_count = (
            SELECT COUNT(*) 
            FROM tickets 
            WHERE event_id = v_event_id 
            AND status = 'sold'
        ),
        reserved_count = (
            SELECT COUNT(*) 
            FROM tickets 
            WHERE event_id = v_event_id 
            AND status = 'reserved'
            AND reservation_expires_at > NOW()
        )
    WHERE event_id = v_event_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Inherit parent organiser_id
CREATE OR REPLACE FUNCTION inherit_parent_organiser_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.parent_event_id IS NOT NULL AND NEW.organiser_id IS NULL THEN
        SELECT organiser_id INTO NEW.organiser_id
        FROM events
        WHERE event_id = NEW.parent_event_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Get event location
CREATE OR REPLACE FUNCTION get_event_location(p_event_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
AS $$
    SELECT 
        COALESCE(
            l.place_name || COALESCE(', ' || l.suburb, '') || COALESCE(', ' || l.state, ''),
            'TBA'
        )
    FROM events e
    LEFT JOIN locations l ON e.location_id = l.location_id
    WHERE e.event_id = p_event_id;
$$;

-- ============================================================================
-- 4. VIEWS
-- ============================================================================

-- Event Display View
CREATE OR REPLACE VIEW public.event_display_view AS
SELECT 
    e.event_id,
    e.slug,
    e.title,
    e.subtitle,
    e.description,
    e.type,
    e.event_start,
    e.event_end,
    e.is_multi_day,
    e.featured,
    e.image_url,
    e.event_includes,
    e.important_information,
    e.is_published,
    e.is_purchasable_individually,
    e.max_attendees,
    e.regalia,
    e.regalia_description,
    e.dress_code,
    e.degree_type,
    e.sections,
    e.attendance,
    e.documents,
    e.related_events,
    e.created_at,
    e.parent_event_id,
    e.reserved_count,
    e.sold_count,
    
    -- Location details
    e.location_id,
    CASE 
        WHEN l.room_or_area IS NOT NULL THEN 
            l.room_or_area || ', ' || l.place_name || ', ' || l.suburb || ', ' || l.state || ' ' || l.postal_code
        ELSE 
            l.place_name || ', ' || l.suburb || ', ' || l.state || ' ' || l.postal_code
    END AS location_string,
    l.place_name,
    l.street_address,
    l.suburb,
    l.state,
    l.postal_code,
    l.latitude,
    l.longitude,
    l.capacity AS location_capacity,
    
    -- Organisation details
    e.organiser_id,
    o.name AS organiser_name,
    o.abbreviation AS organiser_abbreviation,
    o.type AS organiser_type,
    
    -- Parent event details
    pe.title AS parent_event_title,
    pe.slug AS parent_event_slug,
    
    -- Calculated fields
    COALESCE(
        (SELECT MIN(et.price) 
         FROM event_tickets et 
         WHERE et.event_id = e.event_id 
           AND et.is_active = true 
           AND et.status = 'Active'),
        0
    ) AS min_price,
    
    COALESCE(
        (SELECT SUM(et.total_capacity) 
         FROM event_tickets et 
         WHERE et.event_id = e.event_id 
           AND et.is_active = true),
        0
    ) AS total_capacity,
    
    COALESCE(
        (SELECT SUM(et.sold_count) 
         FROM event_tickets et 
         WHERE et.event_id = e.event_id),
        0
    ) AS tickets_sold,
    
    COALESCE(
        (SELECT SUM(et.available_count) 
         FROM event_tickets et 
         WHERE et.event_id = e.event_id 
           AND et.is_active = true),
        0
    ) AS tickets_available,
    
    CASE 
        WHEN EXISTS (
            SELECT 1 
            FROM event_tickets et 
            WHERE et.event_id = e.event_id 
              AND et.is_active = true 
              AND et.available_count > 0
        ) THEN false
        ELSE true
    END AS is_sold_out,
    
    (SELECT COUNT(*) 
     FROM events ce 
     WHERE ce.parent_event_id = e.event_id) AS child_event_count

FROM events e
LEFT JOIN locations l ON e.location_id = l.location_id
LEFT JOIN organisations o ON e.organiser_id = o.organisation_id
LEFT JOIN events pe ON e.parent_event_id = pe.event_id;

-- Registration Detail View
CREATE OR REPLACE VIEW public.registration_detail_view AS
SELECT 
    r.registration_id,
    r.confirmation_number,
    r.registration_date,
    r.status,
    r.payment_status,
    r.total_amount_paid,
    r.total_price_paid,
    r.agree_to_terms,
    r.stripe_payment_intent_id,
    r.registration_type,
    r.created_at,
    r.updated_at,
    r.registration_data,
    
    -- Contact (customer) information
    r.contact_id,
    c.first_name AS customer_first_name,
    c.last_name AS customer_last_name,
    c.email AS customer_email,
    c.mobile_number AS customer_phone,
    COALESCE(c.first_name || ' ' || c.last_name, c.email) AS customer_name,
    
    -- Event details
    r.event_id,
    e.title AS event_title,
    e.slug AS event_slug,
    e.event_start,
    e.event_end,
    e.type AS event_type,
    
    -- Organisation details
    r.organisation_id,
    o.name AS organisation_name,
    o.abbreviation AS organisation_abbreviation,
    
    -- Count attendees
    (SELECT COUNT(*) 
     FROM attendees a 
     WHERE a.registration_id = r.registration_id) AS attendee_count,
    
    -- Count tickets
    (SELECT COUNT(*) 
     FROM tickets t 
     WHERE t.registration_id = r.registration_id) AS ticket_count,
    
    -- Sum ticket amounts
    (SELECT COALESCE(SUM(t.price_paid), 0) 
     FROM tickets t 
     WHERE t.registration_id = r.registration_id) AS total_ticket_amount,
    
    -- Get primary attendee info
    r.primary_attendee_id,
    pa.first_name AS primary_attendee_first_name,
    pa.last_name AS primary_attendee_last_name,
    pa.email AS primary_attendee_email,
    
    -- Count partners
    (SELECT COUNT(*) 
     FROM attendees a 
     WHERE a.registration_id = r.registration_id 
       AND a.is_partner IS NOT NULL) AS partner_count,
    
    -- List of ticket types purchased
    (SELECT ARRAY_AGG(DISTINCT et.name ORDER BY et.name) 
     FROM tickets t
     JOIN event_tickets et ON t.ticket_type_id = et.id
     WHERE t.registration_id = r.registration_id) AS ticket_types

FROM registrations r
LEFT JOIN contacts c ON r.contact_id = c.contact_id
LEFT JOIN events e ON r.event_id = e.event_id
LEFT JOIN organisations o ON r.organisation_id = o.organisation_id
LEFT JOIN attendees pa ON r.primary_attendee_id = pa.attendee_id;

-- Ticket Availability View
CREATE OR REPLACE VIEW public.ticket_availability_view AS
SELECT 
    et.id AS ticket_type_id,
    et.event_id,
    et.name AS ticket_type_name,
    et.description,
    et.price,
    et.total_capacity,
    et.available_count,
    et.reserved_count,
    et.sold_count,
    et.status,
    et.is_active,
    et.eligibility_criteria,
    et.created_at,
    et.updated_at,
    
    -- Event information
    e.title AS event_title,
    e.slug AS event_slug,
    e.event_start,
    e.event_end,
    e.is_published AS event_is_published,
    
    -- Calculate percentage sold
    CASE 
        WHEN et.total_capacity IS NULL OR et.total_capacity = 0 THEN 0
        ELSE ROUND((et.sold_count::numeric / et.total_capacity::numeric) * 100, 2)
    END AS percentage_sold,
    
    -- Calculate if ticket type is sold out
    CASE 
        WHEN et.available_count IS NULL OR et.available_count = 0 THEN true
        ELSE false
    END AS is_sold_out,
    
    -- Count active reservations
    (SELECT COUNT(*) 
     FROM tickets t 
     WHERE t.ticket_type_id = et.id 
       AND t.reservation_id IS NOT NULL 
       AND t.reservation_expires_at > NOW()
       AND t.status = 'reserved') AS active_reservations,
    
    -- Calculate actual available
    CASE 
        WHEN et.available_count IS NULL THEN 0
        ELSE GREATEST(
            0, 
            et.available_count - (
                SELECT COUNT(*) 
                FROM tickets t 
                WHERE t.ticket_type_id = et.id 
                  AND t.reservation_id IS NOT NULL 
                  AND t.reservation_expires_at > NOW()
                  AND t.status = 'reserved'
            )
        )
    END AS actual_available,
    
    -- Group by ticket category if specified in eligibility criteria
    et.eligibility_criteria->>'category' AS ticket_category,
    
    -- Extract eligibility rules
    et.eligibility_criteria->'rules' AS eligibility_rules,
    
    -- Check if ticket requires special eligibility
    CASE 
        WHEN jsonb_array_length(et.eligibility_criteria->'rules') > 0 THEN true
        ELSE false
    END AS has_eligibility_requirements

FROM event_tickets et
JOIN events e ON et.event_id = e.event_id
WHERE et.is_active = true;

-- Attendee Complete View
CREATE OR REPLACE VIEW public.attendee_complete_view AS
SELECT 
    a.attendee_id,
    a.registration_id,
    a.attendee_type,
    a.dietary_requirements,
    a.special_needs,
    a.contact_preference,
    a.created_at,
    a.updated_at,
    a.is_primary,
    a.has_partner,
    
    -- Basic attendee info
    a.title,
    a.first_name,
    a.last_name,
    a.suffix,
    a.email,
    a.phone,
    COALESCE(a.first_name || ' ' || a.last_name, a.email) AS full_name,
    
    -- Contact details
    a.contact_id,
    c.address_line_1 AS contact_address_line_1,
    c.address_line_2 AS contact_address_line_2,
    c.suburb_city AS contact_city,
    c.state AS contact_state,
    c.postcode AS contact_postcode,
    c.country AS contact_country,
    
    -- Partner relationship
    a.related_attendee_id,
    a.relationship,
    a.is_partner,
    ra.first_name AS partner_first_name,
    ra.last_name AS partner_last_name,
    COALESCE(ra.first_name || ' ' || ra.last_name, ra.email) AS partner_full_name,
    
    -- Masonic profile information
    mp.masonic_profile_id,
    mp.masonic_title,
    mp.rank,
    mp.grand_rank,
    mp.grand_officer,
    mp.grand_office,
    
    -- Lodge information
    mp.lodge_id,
    lo.name AS lodge_name,
    lo.abbreviation AS lodge_abbreviation,
    l.number AS lodge_number,
    lo.type AS lodge_type,
    
    -- Grand Lodge information
    mp.grand_lodge_id,
    glo.name AS grand_lodge_name,
    glo.abbreviation AS grand_lodge_abbreviation,
    
    -- Registration information
    r.event_id,
    r.registration_type,
    r.confirmation_number,
    r.payment_status,
    
    -- Event information
    e.title AS event_title,
    e.slug AS event_slug,
    e.event_start,
    e.event_end,
    
    -- Tickets for this attendee
    (SELECT COUNT(*) 
     FROM tickets t 
     WHERE t.attendee_id = a.attendee_id) AS ticket_count,
    
    -- Ticket details
    (SELECT ARRAY_AGG(
        jsonb_build_object(
            'ticket_id', t.ticket_id,
            'event_id', t.event_id,
            'ticket_type_name', et.name,
            'price_paid', t.price_paid,
            'status', t.status,
            'is_partner_ticket', t.is_partner_ticket
        ) ORDER BY et.name
    )
     FROM tickets t
     LEFT JOIN event_tickets et ON t.ticket_type_id = et.id
     WHERE t.attendee_id = a.attendee_id) AS tickets,
    
    -- Check if attendee has checked in
    EXISTS (
        SELECT 1 
        FROM tickets t 
        WHERE t.attendee_id = a.attendee_id 
          AND t.checked_in_at IS NOT NULL
    ) AS has_checked_in

FROM attendees a
LEFT JOIN contacts c ON a.contact_id = c.contact_id
LEFT JOIN attendees ra ON a.related_attendee_id = ra.attendee_id
LEFT JOIN masonic_profiles mp ON c.contact_id = mp.contact_id
LEFT JOIN organisations lo ON mp.lodge_id = lo.organisation_id
LEFT JOIN lodges l ON lo.organisation_id = l.organisation_id
LEFT JOIN organisations glo ON mp.grand_lodge_id = glo.organisation_id
LEFT JOIN registrations r ON a.registration_id = r.registration_id
LEFT JOIN events e ON r.event_id = e.event_id;

-- Event Hierarchy View
CREATE OR REPLACE VIEW public.event_hierarchy_view AS
WITH RECURSIVE event_tree AS (
    -- Base case: top-level events (no parent)
    SELECT 
        e.event_id,
        e.slug,
        e.title,
        e.subtitle,
        e.type,
        e.event_start,
        e.event_end,
        e.parent_event_id,
        e.is_published,
        e.is_purchasable_individually,
        e.max_attendees,
        e.reserved_count,
        e.sold_count,
        e.featured,
        e.image_url,
        e.location_id,
        e.organiser_id,
        0 AS level,
        ARRAY[e.event_id] AS path,
        e.event_id AS root_event_id
    FROM events e
    WHERE e.parent_event_id IS NULL
    
    UNION ALL
    
    -- Recursive case: child events
    SELECT 
        e.event_id,
        e.slug,
        e.title,
        e.subtitle,
        e.type,
        e.event_start,
        e.event_end,
        e.parent_event_id,
        e.is_published,
        e.is_purchasable_individually,
        e.max_attendees,
        e.reserved_count,
        e.sold_count,
        e.featured,
        e.image_url,
        e.location_id,
        e.organiser_id,
        et.level + 1,
        et.path || e.event_id,
        et.root_event_id
    FROM events e
    INNER JOIN event_tree et ON e.parent_event_id = et.event_id
)
SELECT 
    et.*,
    
    -- Parent event information
    pe.title AS parent_title,
    pe.slug AS parent_slug,
    pe.type AS parent_type,
    
    -- Count direct children
    (SELECT COUNT(*) 
     FROM events ce 
     WHERE ce.parent_event_id = et.event_id) AS direct_child_count,
    
    -- Count all descendants
    (SELECT COUNT(*) 
     FROM event_tree et2 
     WHERE et.event_id = ANY(et2.path) 
       AND et2.event_id != et.event_id) AS total_descendant_count,
    
    -- Aggregate capacity across direct children
    (SELECT COALESCE(SUM(ce.max_attendees), 0) 
     FROM events ce 
     WHERE ce.parent_event_id = et.event_id) AS children_total_capacity,
    
    -- Aggregate sold count across direct children
    (SELECT COALESCE(SUM(ce.sold_count), 0) 
     FROM events ce 
     WHERE ce.parent_event_id = et.event_id) AS children_sold_count,
    
    -- Check if this event is part of a package
    EXISTS (
        SELECT 1 
        FROM packages p 
        WHERE p.event_id = et.event_id OR p.parent_event_id = et.event_id
    ) AS is_in_package,
    
    -- Get package details if event is part of packages
    (SELECT ARRAY_AGG(
        jsonb_build_object(
            'package_id', p.package_id,
            'package_name', p.name,
            'package_price', p.package_price,
            'is_active', p.is_active
        )
    )
     FROM packages p 
     WHERE (p.event_id = et.event_id OR p.parent_event_id = et.event_id)
       AND p.is_active = true) AS packages,
    
    -- Calculate total available tickets
    CASE 
        WHEN EXISTS (SELECT 1 FROM events ce WHERE ce.parent_event_id = et.event_id) THEN
            (SELECT COALESCE(SUM(tav.actual_available), 0)
             FROM events ce
             JOIN ticket_availability_view tav ON ce.event_id = tav.event_id
             WHERE ce.parent_event_id = et.event_id)
        ELSE
            (SELECT COALESCE(SUM(tav.actual_available), 0)
             FROM ticket_availability_view tav
             WHERE tav.event_id = et.event_id)
    END AS total_available_tickets,
    
    -- Path as readable string
    (SELECT STRING_AGG(e2.title, ' > ' ORDER BY array_position(et.path, e2.event_id))
     FROM events e2
     WHERE e2.event_id = ANY(et.path)) AS path_display

FROM event_tree et
LEFT JOIN events pe ON et.parent_event_id = pe.event_id
ORDER BY et.path;

-- Registration Summary View
CREATE OR REPLACE VIEW public.registration_summary AS
SELECT
    r.registration_id,
    r.contact_id as customer_id,
    COALESCE(
        (c.first_name || ' '::text) || c.last_name,
        c.business_name
    ) as customer_name,
    r.event_id,
    e.title as event_title,
    r.registration_date,
    r.status,
    r.payment_status,
    r.total_amount_paid,
    r.total_price_paid,
    r.registration_type,
    r.primary_attendee_id,
    r.created_at,
    r.updated_at
FROM
    registrations r
    LEFT JOIN contacts c on r.contact_id = c.contact_id
    LEFT JOIN events e on r.event_id = e.event_id;

-- Auth User Customer View
CREATE OR REPLACE VIEW public.auth_user_customer_view AS
SELECT
    u.id as auth_user_id,
    u.email as auth_email,
    u.created_at as user_created,
    c.contact_id,
    c.first_name,
    c.last_name,
    c.email as contact_email,
    cust.customer_id,
    cust.customer_type,
    CASE
        WHEN cust.customer_id is not null THEN 'Customer'::text
        WHEN c.contact_id is not null THEN 'Contact Only'::text
        ELSE 'Auth User Only'::text
    END as user_type
FROM
    auth.users u
    LEFT JOIN contacts c on u.id = c.auth_user_id
    LEFT JOIN customers cust on c.contact_id = cust.contact_id
ORDER BY
    u.created_at desc;

-- Contacts View
CREATE OR REPLACE VIEW public.contacts_view AS
SELECT
    c.contact_id,
    c.auth_user_id,
    c.title,
    c.first_name,
    c.last_name,
    c.suffix_1,
    c.suffix_2,
    c.suffix_3,
    c.email,
    c.mobile_number,
    c.address_line_1,
    c.address_line_2,
    c.suburb_city,
    c.state,
    c.country,
    c.postcode,
    c.dietary_requirements,
    c.special_needs,
    c.type,
    c.has_partner,
    c.is_partner,
    c.organisation_id,
    c.business_name,
    c.billing_organisation_name,
    c.billing_email,
    c.billing_phone,
    c.stripe_customer_id,
    c.source_type,
    c.created_at,
    c.updated_at,
    mp.masonic_title,
    mp.rank,
    mp.grand_rank,
    mp.grand_officer,
    mp.grand_office,
    mp.lodge_id,
    mp.grand_lodge_id
FROM
    contacts c
    LEFT JOIN masonic_profiles mp on c.contact_id = mp.contact_id;

-- Memberships View
CREATE OR REPLACE VIEW public.memberships_view AS
SELECT
    m.membership_id,
    m.contact_id,
    c.first_name,
    c.last_name,
    c.email,
    m.profile_id,
    mp.masonic_title,
    m.role,
    m.permissions,
    m.membership_type,
    m.membership_entity_id,
    CASE
        WHEN m.membership_type::text = 'lodge'::text THEN l.name
        WHEN m.membership_type::text = 'grand_lodge'::text THEN gl.name
        WHEN m.membership_type::text = 'organisation'::text THEN o.name::text
        ELSE 'Unknown'::text
    END as entity_name,
    m.is_active,
    m.created_at
FROM
    memberships m
    JOIN contacts c on m.contact_id = c.contact_id
    LEFT JOIN masonic_profiles mp on m.profile_id = mp.masonic_profile_id
    LEFT JOIN lodges l on m.membership_type::text = 'lodge'::text
    AND m.membership_entity_id = l.lodge_id
    LEFT JOIN grand_lodges gl on m.membership_type::text = 'grand_lodge'::text
    AND m.membership_entity_id = gl.grand_lodge_id
    LEFT JOIN organisations o on m.membership_type::text = 'organisation'::text
    AND m.membership_entity_id = o.organisation_id;

-- Registration Fee Summary View
CREATE OR REPLACE VIEW public.registration_fee_summary AS
SELECT 
    r.registration_id,
    r.confirmation_number,
    r.subtotal as ticket_subtotal,
    r.stripe_fee as processing_fee,
    r.total_amount_paid as total_charged,
    r.platform_fee_amount as marketplace_fee,
    (r.subtotal - COALESCE(r.platform_fee_amount, 0)) as organization_receives,
    r.created_at,
    r.payment_status,
    e.title as event_title,
    o.name as organization_name,
    o.stripe_onbehalfof as connected_account_id
FROM registrations r
LEFT JOIN events e ON r.event_id = e.event_id
LEFT JOIN organisations o ON e.organiser_id = o.organisation_id;

-- ============================================================================
-- 5. RPC FUNCTIONS
-- ============================================================================

-- Get Event With Details (Latest Version)
CREATE OR REPLACE FUNCTION public.get_event_with_details(p_event_slug TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_result JSON;
    v_event_id UUID;
BEGIN
    -- Input validation
    IF p_event_slug IS NULL OR p_event_slug = '' THEN
        RAISE EXCEPTION 'Event slug is required';
    END IF;

    -- Get the event ID from slug
    SELECT event_id INTO v_event_id
    FROM events
    WHERE slug = p_event_slug
    LIMIT 1;

    IF v_event_id IS NULL THEN
        RAISE EXCEPTION 'Event not found with slug: %', p_event_slug;
    END IF;

    -- Build the complete event response
    SELECT json_build_object(
        'event', row_to_json(e.*),
        'child_events', COALESCE(
            (SELECT json_agg(
                json_build_object(
                    'event_id', ce.event_id,
                    'slug', ce.slug,
                    'title', ce.title,
                    'subtitle', ce.subtitle,
                    'description', ce.description,
                    'image_url', ce.image_url,
                    'event_start', ce.event_start,
                    'event_end', ce.event_end,
                    'min_price', ce.min_price,
                    'is_sold_out', ce.is_sold_out,
                    'location_string', ce.location_string,
                    'featured', ce.featured,
                    'is_multi_day', ce.is_multi_day,
                    'type', ce.type,
                    'parent_event_id', ce.parent_event_id,
                    'is_published', ce.is_published,
                    'regalia', ce.regalia,
                    'regalia_description', ce.regalia_description,
                    'dress_code', ce.dress_code,
                    'degree_type', ce.degree_type,
                    'sections', ce.sections,
                    'attendance', ce.attendance,
                    'documents', ce.documents,
                    'related_events', ce.related_events,
                    'created_at', ce.created_at,
                    'reserved_count', ce.reserved_count,
                    'sold_count', ce.sold_count,
                    'location_id', ce.location_id,
                    'organiser_id', ce.organiser_id,
                    'max_attendees', ce.max_attendees,
                    'event_includes', ce.event_includes,
                    'important_information', ce.important_information,
                    'is_purchasable_individually', ce.is_purchasable_individually
                )
                ORDER BY ce.event_start
            )
            FROM event_display_view ce
            WHERE ce.parent_event_id = v_event_id
              AND ce.is_published = true
            ), '[]'::json
        ),
        'packages', COALESCE(
            (SELECT json_agg(
                json_build_object(
                    'package_id', p.package_id,
                    'name', p.name,
                    'description', p.description,
                    'package_price', p.package_price,
                    'status', CASE WHEN p.is_active THEN 'Active' ELSE 'Inactive' END,
                    'attendee_limit', p.qty,
                    'eligibility_criteria', p.eligibility_criteria,
                    'included_events', json_build_array(
                        json_build_object(
                            'event_id', p.event_id,
                            'title', pe.title,
                            'slug', pe.slug
                        )
                    )
                )
                ORDER BY p.package_price
            )
            FROM packages p
            LEFT JOIN events pe ON pe.event_id = p.event_id
            WHERE p.parent_event_id = v_event_id
              AND p.is_active = true
            ), '[]'::json
        ),
        'ticket_types', COALESCE(
            (SELECT json_agg(
                json_build_object(
                    'ticket_type_id', t.ticket_type_id,
                    'ticket_type_name', t.ticket_type_name,
                    'description', t.description,
                    'price', t.price,
                    'total_capacity', t.total_capacity,
                    'available_count', t.available_count,
                    'actual_available', t.actual_available,
                    'is_sold_out', t.is_sold_out,
                    'percentage_sold', t.percentage_sold,
                    'status', t.status,
                    'eligibility_criteria', t.eligibility_criteria,
                    'has_eligibility_requirements', t.has_eligibility_requirements,
                    'ticket_category', t.ticket_category
                )
                ORDER BY t.price, t.ticket_type_name
            )
            FROM ticket_availability_view t
            WHERE t.event_id = v_event_id
              AND t.is_active = true
            ), '[]'::json
        ),
        'location', CASE 
            WHEN e.location_id IS NOT NULL THEN
                json_build_object(
                    'location_id', e.location_id,
                    'place_name', e.place_name,
                    'street_address', e.street_address,
                    'suburb', e.suburb,
                    'state', e.state,
                    'postal_code', e.postal_code,
                    'latitude', e.latitude,
                    'longitude', e.longitude,
                    'location_string', e.location_string,
                    'location_capacity', e.location_capacity
                )
            ELSE NULL
        END,
        'organisation', json_build_object(
            'organisation_id', e.organiser_id,
            'name', e.organiser_name,
            'abbreviation', e.organiser_abbreviation,
            'type', e.organiser_type
        ),
        'parent_event', CASE
            WHEN e.parent_event_id IS NOT NULL THEN
                json_build_object(
                    'event_id', e.parent_event_id,
                    'title', e.parent_event_title,
                    'slug', e.parent_event_slug
                )
            ELSE NULL
        END,
        'summary', json_build_object(
            'min_price', e.min_price,
            'max_price', COALESCE(
                (SELECT MAX(et.price) 
                 FROM event_tickets et 
                 WHERE et.event_id = e.event_id 
                   AND et.is_active = true 
                   AND et.status = 'Active'),
                e.min_price
            ),
            'total_capacity', e.total_capacity,
            'tickets_sold', e.tickets_sold,
            'tickets_available', e.tickets_available,
            'is_sold_out', e.is_sold_out,
            'child_event_count', e.child_event_count
        )
    ) INTO v_result
    FROM event_display_view e
    WHERE e.event_id = v_event_id;

    RETURN v_result;

EXCEPTION
    WHEN OTHERS THEN
        -- Log error details for debugging
        RAISE EXCEPTION 'Error in get_event_with_details: % %', SQLERRM, SQLSTATE;
END;
$$;

-- Check Ticket Eligibility Helper Function
CREATE OR REPLACE FUNCTION public.check_ticket_eligibility(
    p_attendee_type TEXT,
    p_rank TEXT,
    p_grand_rank TEXT,
    p_grand_officer BOOLEAN,
    p_lodge_id UUID,
    p_grand_lodge_id UUID,
    p_registration_type TEXT,
    p_eligibility_rules JSONB
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    v_rule JSONB;
    v_field TEXT;
    v_operator TEXT;
    v_value TEXT;
    v_values TEXT[];
    v_attendee_value TEXT;
    v_is_eligible BOOLEAN := true;
BEGIN
    -- If no eligibility rules, ticket is available to all
    IF p_eligibility_rules IS NULL OR jsonb_array_length(p_eligibility_rules) = 0 THEN
        RETURN true;
    END IF;
    
    -- Check each eligibility rule
    FOR v_rule IN SELECT * FROM jsonb_array_elements(p_eligibility_rules)
    LOOP
        v_field := v_rule->>'field';
        v_operator := v_rule->>'operator';
        v_value := v_rule->>'value';
        
        -- Get the attendee's value for this field
        CASE v_field
            WHEN 'attendee_type' THEN v_attendee_value := p_attendee_type;
            WHEN 'rank' THEN v_attendee_value := p_rank;
            WHEN 'grand_rank' THEN v_attendee_value := p_grand_rank;
            WHEN 'grand_officer' THEN v_attendee_value := CASE WHEN p_grand_officer THEN 'true' ELSE 'false' END;
            WHEN 'registration_type' THEN v_attendee_value := p_registration_type;
            WHEN 'lodge_id' THEN v_attendee_value := p_lodge_id::TEXT;
            WHEN 'grand_lodge_id' THEN v_attendee_value := p_grand_lodge_id::TEXT;
            ELSE v_attendee_value := NULL;
        END CASE;
        
        -- Apply the operator
        CASE v_operator
            WHEN 'equals' THEN
                IF v_attendee_value IS DISTINCT FROM v_value THEN
                    v_is_eligible := false;
                END IF;
            WHEN 'not_equals' THEN
                IF v_attendee_value IS NOT DISTINCT FROM v_value THEN
                    v_is_eligible := false;
                END IF;
            WHEN 'in' THEN
                -- Parse the comma-separated list
                v_values := string_to_array(v_value, ',');
                IF NOT (v_attendee_value = ANY(v_values)) THEN
                    v_is_eligible := false;
                END IF;
            WHEN 'not_in' THEN
                v_values := string_to_array(v_value, ',');
                IF v_attendee_value = ANY(v_values) THEN
                    v_is_eligible := false;
                END IF;
            WHEN 'exists' THEN
                IF v_attendee_value IS NULL THEN
                    v_is_eligible := false;
                END IF;
            WHEN 'not_exists' THEN
                IF v_attendee_value IS NOT NULL THEN
                    v_is_eligible := false;
                END IF;
        END CASE;
        
        -- If any rule fails, attendee is not eligible
        IF NOT v_is_eligible THEN
            RETURN false;
        END IF;
    END LOOP;
    
    RETURN true;
END;
$$;

-- Get Eligible Tickets
CREATE OR REPLACE FUNCTION public.get_eligible_tickets(
    p_event_id UUID,
    p_registration_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_result JSON;
    v_attendees_data JSON;
    v_tickets_data JSON;
    v_attendee RECORD;
    v_ticket RECORD;
    v_eligible_tickets JSONB := '[]'::jsonb;
    v_is_eligible BOOLEAN;
BEGIN
    -- Get all attendees for this registration with their masonic profiles
    SELECT json_agg(
        json_build_object(
            'attendee_id', a.attendee_id,
            'attendee_type', a.attendee_type,
            'first_name', a.first_name,
            'last_name', a.last_name,
            'is_primary', a.is_primary,
            'rank', mp.rank,
            'grand_rank', mp.grand_rank,
            'grand_officer', CASE WHEN mp.grand_officer IS NOT NULL THEN true ELSE false END,
            'lodge_id', mp.lodge_id,
            'grand_lodge_id', mp.grand_lodge_id,
            'eligible_tickets', '[]'::json
        )
    ) INTO v_attendees_data
    FROM attendees a
    LEFT JOIN contacts c ON a.contact_id = c.contact_id
    LEFT JOIN masonic_profiles mp ON c.contact_id = mp.contact_id
    WHERE a.registration_id = p_registration_id;
    
    -- Get all available tickets for this event
    SELECT json_agg(
        json_build_object(
            'ticket_type_id', et.id,
            'name', et.name,
            'description', et.description,
            'price', et.price,
            'available_count', et.available_count,
            'eligibility_rules', COALESCE(et.eligibility_criteria->'rules', '[]'::jsonb)
        )
    ) INTO v_tickets_data
    FROM event_tickets et
    WHERE et.event_id = p_event_id
      AND et.is_active = true
      AND et.status = 'Active'
      AND (et.available_count IS NULL OR et.available_count > 0);
    
    -- For each attendee, determine which tickets they can purchase
    IF v_attendees_data IS NOT NULL AND v_tickets_data IS NOT NULL THEN
        FOR v_attendee IN SELECT * FROM json_array_elements(v_attendees_data)
        LOOP
            v_eligible_tickets := '[]'::jsonb;
            
            -- Get registration type
            DECLARE
                v_registration_type TEXT;
            BEGIN
                SELECT registration_type INTO v_registration_type
                FROM registrations
                WHERE registration_id = p_registration_id;
                
                FOR v_ticket IN SELECT * FROM json_array_elements(v_tickets_data)
                LOOP
                    -- Check if attendee meets eligibility criteria
                    v_is_eligible := check_ticket_eligibility(
                        v_attendee->>'attendee_type',
                        v_attendee->>'rank',
                        v_attendee->>'grand_rank',
                        (v_attendee->>'grand_officer')::boolean,
                        (v_attendee->>'lodge_id')::uuid,
                        (v_attendee->>'grand_lodge_id')::uuid,
                        v_registration_type,
                        v_ticket->'eligibility_rules'
                    );
                    
                    IF v_is_eligible THEN
                        v_eligible_tickets := v_eligible_tickets || jsonb_build_object(
                            'ticket_type_id', v_ticket->>'ticket_type_id',
                            'name', v_ticket->>'name',
                            'description', v_ticket->>'description',
                            'price', (v_ticket->>'price')::numeric,
                            'available_count', v_ticket->>'available_count'
                        );
                    END IF;
                END LOOP;
            END;
            
            -- Update attendee with their eligible tickets
            v_attendees_data := jsonb_set(
                v_attendees_data::jsonb,
                ARRAY[(array_position(
                    ARRAY(SELECT json_array_elements_text(v_attendees_data)),
                    v_attendee::text
                ) - 1)::text, 'eligible_tickets'],
                v_eligible_tickets
            )::json;
        END LOOP;
    END IF;
    
    -- Build result
    v_result := json_build_object(
        'success', true,
        'event_id', p_event_id,
        'registration_id', p_registration_id,
        'attendees', COALESCE(v_attendees_data, '[]'::json)
    );
    
    RETURN v_result;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$;

-- Complete Payment (with fixed enum value)
CREATE OR REPLACE FUNCTION public.complete_payment(
    p_registration_id UUID,
    p_payment_intent_id TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_result JSON;
    v_confirmation_number TEXT;
    v_event_id UUID;
    v_total_amount NUMERIC;
    v_ticket_count INTEGER;
BEGIN
    -- Start transaction
    BEGIN
        -- Generate confirmation number if not exists
        SELECT confirmation_number, event_id 
        INTO v_confirmation_number, v_event_id
        FROM registrations
        WHERE registration_id = p_registration_id;
        
        IF v_confirmation_number IS NULL THEN
            v_confirmation_number := 'LTX-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));
            
            UPDATE registrations
            SET confirmation_number = v_confirmation_number
            WHERE registration_id = p_registration_id;
        END IF;
        
        -- Update registration payment status
        UPDATE registrations
        SET 
            payment_status = 'completed', -- Fixed: using 'completed' instead of 'paid'
            stripe_payment_intent_id = p_payment_intent_id,
            updated_at = NOW()
        WHERE registration_id = p_registration_id;
        
        -- Update all tickets to sold status
        UPDATE tickets
        SET 
            status = 'sold',
            payment_status = 'Paid',
            purchased_at = NOW(),
            reservation_id = NULL,
            reservation_expires_at = NULL,
            updated_at = NOW()
        WHERE registration_id = p_registration_id
          AND status IN ('reserved', 'available');
        
        -- Get ticket count and total
        SELECT COUNT(*), SUM(price_paid)
        INTO v_ticket_count, v_total_amount
        FROM tickets
        WHERE registration_id = p_registration_id;
        
        -- Record payment in registration_payments
        INSERT INTO registration_payments (
            registration_id,
            amount,
            currency,
            payment_method,
            payment_status,
            stripe_payment_intent_id,
            created_at
        ) VALUES (
            p_registration_id,
            v_total_amount,
            'AUD',
            'card',
            'completed',
            p_payment_intent_id,
            NOW()
        );
        
        -- Update ticket counts for event_tickets
        UPDATE event_tickets et
        SET 
            sold_count = (
                SELECT COUNT(*) 
                FROM tickets t 
                WHERE t.ticket_type_id = et.id 
                  AND t.status = 'sold'
            ),
            available_count = GREATEST(
                0,
                et.total_capacity - (
                    SELECT COUNT(*) 
                    FROM tickets t 
                    WHERE t.ticket_type_id = et.id 
                      AND t.status IN ('sold', 'reserved')
                )
            )
        WHERE et.event_id = v_event_id;
        
        -- Update event counts
        UPDATE events e
        SET 
            sold_count = (
                SELECT COUNT(*) 
                FROM tickets t 
                WHERE t.event_id = e.event_id 
                  AND t.status = 'sold'
            )
        WHERE e.event_id = v_event_id;
        
        -- Build success response
        v_result := json_build_object(
            'success', true,
            'registration_id', p_registration_id,
            'confirmation_number', v_confirmation_number,
            'payment_intent_id', p_payment_intent_id,
            'ticket_count', v_ticket_count,
            'total_amount', v_total_amount
        );
        
        RETURN v_result;
        
    EXCEPTION
        WHEN OTHERS THEN
            -- Rollback is automatic
            RETURN json_build_object(
                'success', false,
                'error', SQLERRM,
                'detail', SQLSTATE
            );
    END;
END;
$$;

-- ============================================================================
-- 6. TRIGGERS
-- ============================================================================

-- Events table triggers
CREATE TRIGGER inherit_organiser_on_insert BEFORE INSERT ON events 
FOR EACH ROW EXECUTE FUNCTION inherit_parent_organiser_id();

CREATE TRIGGER inherit_organiser_on_update BEFORE UPDATE ON events 
FOR EACH ROW WHEN (
    new.parent_event_id is distinct from old.parent_event_id
    or new.organiser_id is null and old.organiser_id is not null
)
EXECUTE FUNCTION inherit_parent_organiser_id();

-- Tickets table triggers
CREATE TRIGGER update_event_ticket_counts_trigger
AFTER INSERT OR UPDATE OR DELETE ON tickets
FOR EACH ROW
EXECUTE FUNCTION update_event_ticket_counts();

CREATE TRIGGER update_event_counts_trigger
AFTER INSERT OR UPDATE OR DELETE ON tickets
FOR EACH ROW
EXECUTE FUNCTION update_event_counts();

-- Updated_at triggers
CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_memberships_updated_at BEFORE UPDATE ON memberships 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_log_updated_at BEFORE UPDATE ON public.email_log 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON public.documents 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 7. INDEXES
-- ============================================================================

-- Event Indexes
CREATE INDEX IF NOT EXISTS idx_events_slug ON events(slug);
CREATE INDEX IF NOT EXISTS idx_events_parent_published ON events(parent_event_id, is_published) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_events_featured_published ON events(featured, is_published) WHERE featured = true AND is_published = true;
CREATE INDEX IF NOT EXISTS idx_events_date_range ON events(event_start, event_end);
CREATE INDEX IF NOT EXISTS idx_events_organiser ON events(organiser_id);
CREATE INDEX IF NOT EXISTS idx_events_location_published ON events(location_id, is_published) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_events_location_org ON events(location_id, organiser_id);
CREATE INDEX IF NOT EXISTS idx_events_capacity ON events(max_attendees);
CREATE INDEX IF NOT EXISTS idx_events_display_scope_id ON events(display_scope_id);
CREATE INDEX IF NOT EXISTS idx_events_location_id ON events(location_id);
CREATE INDEX IF NOT EXISTS idx_events_parent_event_id ON events(parent_event_id);
CREATE INDEX IF NOT EXISTS idx_events_registration_availability_id ON events(registration_availability_id);
CREATE INDEX IF NOT EXISTS idx_events_stripe_product_id ON events(stripe_product_id);

-- Ticket Indexes
CREATE INDEX IF NOT EXISTS idx_event_tickets_event_active ON event_tickets(event_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_tickets_registration_status ON tickets(registration_id, status);
CREATE INDEX IF NOT EXISTS idx_tickets_type_event ON tickets(ticket_type_id, event_id);
CREATE INDEX IF NOT EXISTS idx_tickets_reservation_expiry ON tickets(reservation_expires_at) WHERE reservation_expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tickets_attendee ON tickets(attendee_id);
CREATE INDEX IF NOT EXISTS idx_tickets_reservation ON tickets(reservation_id) WHERE reservation_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tickets_status_event ON tickets(status, event_id);
CREATE INDEX IF NOT EXISTS idx_tickets_package_id ON tickets(package_id);
CREATE INDEX IF NOT EXISTS idx_tickets_ticket_type_id ON tickets(ticket_type_id);
CREATE INDEX IF NOT EXISTS idx_tickets_attendee_id ON tickets(attendee_id);
CREATE INDEX IF NOT EXISTS idx_tickets_event_id ON tickets(event_id);
CREATE INDEX IF NOT EXISTS idx_tickets_registration_id ON tickets(registration_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_registration_price ON tickets(registration_id, price_paid);
CREATE INDEX IF NOT EXISTS idx_tickets_registration_paid ON tickets(registration_id) WHERE status = 'sold';
CREATE INDEX IF NOT EXISTS idx_tickets_event_status_created ON tickets(event_id, status, created_at);
CREATE INDEX IF NOT EXISTS idx_event_tickets_event_id ON event_tickets(event_id);
CREATE INDEX IF NOT EXISTS idx_event_tickets_eligibility_criteria ON event_tickets USING gin(eligibility_criteria);
CREATE INDEX IF NOT EXISTS idx_event_tickets_active ON event_tickets(is_active);
CREATE INDEX IF NOT EXISTS idx_event_tickets_active_available ON event_tickets(is_active, available_count) WHERE is_active = true AND available_count > 0;
CREATE INDEX IF NOT EXISTS idx_event_tickets_stripe_price_id ON event_tickets(stripe_price_id);

-- Registration Indexes
CREATE INDEX IF NOT EXISTS idx_registrations_contact_event ON registrations(contact_id, event_id);
CREATE INDEX IF NOT EXISTS idx_registrations_payment_status ON registrations(payment_status);
CREATE INDEX IF NOT EXISTS idx_registrations_type_status ON registrations(registration_type, status);
CREATE INDEX IF NOT EXISTS idx_registrations_stripe_intent ON registrations(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_registrations_payment_intent ON registrations(stripe_payment_intent_id) WHERE stripe_payment_intent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_registrations_recent ON registrations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_registrations_created_at ON registrations(created_at);
CREATE INDEX IF NOT EXISTS idx_registrations_customer_id ON registrations(customer_id);
CREATE INDEX IF NOT EXISTS idx_registrations_event_id ON registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_registrations_confirmation_number ON registrations(confirmation_number);
CREATE INDEX IF NOT EXISTS idx_registrations_organisation_id ON registrations(organisation_id);
CREATE INDEX IF NOT EXISTS idx_registrations_event_status_created ON registrations(event_id, status, created_at);

-- Attendee Indexes
CREATE INDEX IF NOT EXISTS idx_attendees_registration ON attendees(registration_id);
CREATE INDEX IF NOT EXISTS idx_attendees_registration_primary ON attendees(registration_id, is_primary) WHERE is_primary = true;
CREATE INDEX IF NOT EXISTS idx_attendees_related ON attendees(related_attendee_id) WHERE related_attendee_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_attendees_contact ON attendees(contact_id);
CREATE INDEX IF NOT EXISTS idx_attendees_contact_id ON attendees(contact_id);
CREATE INDEX IF NOT EXISTS idx_attendees_related_attendee_id ON attendees(related_attendee_id);
CREATE INDEX IF NOT EXISTS idx_attendees_registration_id ON attendees(registration_id);
CREATE INDEX IF NOT EXISTS idx_attendees_is_primary ON attendees(is_primary);
CREATE INDEX IF NOT EXISTS idx_attendee_events_attendee_id ON attendee_events(attendee_id);
CREATE INDEX IF NOT EXISTS idx_attendee_events_event_id ON attendee_events(event_id);

-- Reference Data Indexes
CREATE INDEX IF NOT EXISTS idx_masonic_profiles_contact ON masonic_profiles(contact_id);
CREATE INDEX IF NOT EXISTS idx_lodges_grand_lodge ON lodges(grand_lodge_id);
CREATE INDEX IF NOT EXISTS idx_contacts_auth_user ON contacts(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_contact_active ON memberships(contact_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_contacts_source ON contacts(source_type, source_id) WHERE source_type IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contacts_organisation_id ON contacts(organisation_id);
CREATE INDEX IF NOT EXISTS idx_contacts_auth_user_id ON contacts(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_email_lower ON contacts(lower(email));
CREATE INDEX IF NOT EXISTS idx_grand_lodges_organisationid ON grand_lodges(organisation_id);
CREATE INDEX IF NOT EXISTS idx_lodges_grand_lodge_id ON lodges(grand_lodge_id);
CREATE INDEX IF NOT EXISTS idx_lodges_organisationid ON lodges(organisation_id);
CREATE INDEX IF NOT EXISTS idx_masonic_profiles_lodge_id ON masonic_profiles(lodge_id);
CREATE INDEX IF NOT EXISTS idx_masonicprofiles_grandlodgeid ON masonic_profiles(grand_lodge_id);
CREATE INDEX IF NOT EXISTS idx_masonic_profiles_contact_id ON masonic_profiles(contact_id);
CREATE INDEX IF NOT EXISTS idx_memberships_contact_id ON memberships(contact_id);
CREATE INDEX IF NOT EXISTS idx_memberships_profile_id ON memberships(profile_id);
CREATE INDEX IF NOT EXISTS idx_memberships_type_entity ON memberships(membership_type, membership_entity_id);
CREATE INDEX IF NOT EXISTS idx_memberships_is_active ON memberships(is_active);

-- Payment Indexes
CREATE INDEX IF NOT EXISTS idx_connected_payments_registration ON connected_account_payments(registration_id);
CREATE INDEX IF NOT EXISTS idx_organisation_payouts_stripe_id ON organisation_payouts(organisation_stripe_id);
CREATE INDEX IF NOT EXISTS idx_organisation_payouts_created_at ON organisation_payouts(created_at);
CREATE INDEX IF NOT EXISTS idx_platform_transfers_destination ON platform_transfers(destination_account);
CREATE INDEX IF NOT EXISTS idx_connected_payments_account ON connected_account_payments(connected_account_id);

-- Customer Indexes
CREATE INDEX IF NOT EXISTS idx_customers_contact_id ON customers(contact_id);
CREATE INDEX IF NOT EXISTS idx_customers_customer_type ON customers(customer_type);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON customers(created_at);
CREATE INDEX IF NOT EXISTS idx_customers_stripe_id ON customers(stripe_customer_id);

-- Package Indexes
CREATE INDEX IF NOT EXISTS idx_packages_event_id ON packages(event_id);
CREATE INDEX IF NOT EXISTS idx_packages_parent_event_id ON packages(parent_event_id);
CREATE INDEX IF NOT EXISTS idx_packages_is_active ON packages(is_active);
CREATE INDEX IF NOT EXISTS idx_packages_eligibility_criteria ON packages USING gin(eligibility_criteria);

-- New Table Indexes
CREATE INDEX IF NOT EXISTS idx_email_log_registration_id ON email_log(registration_id);
CREATE INDEX IF NOT EXISTS idx_email_log_email_type ON email_log(email_type);
CREATE INDEX IF NOT EXISTS idx_email_log_sent_at ON email_log(sent_at);
CREATE INDEX IF NOT EXISTS idx_email_log_status ON email_log(status);
CREATE INDEX IF NOT EXISTS idx_email_log_registration_type_sent ON email_log(registration_id, email_type, sent_at);
CREATE INDEX IF NOT EXISTS idx_documents_registration_id ON documents(registration_id);
CREATE INDEX IF NOT EXISTS idx_documents_document_type ON documents(document_type);
CREATE INDEX IF NOT EXISTS idx_documents_expires_at ON documents(expires_at) WHERE expires_at IS NOT NULL;

-- ============================================================================
-- 8. ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE organisations ENABLE ROW LEVEL SECURITY;
ALTER TABLE masonic_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE lodges ENABLE ROW LEVEL SECURITY;
ALTER TABLE grand_lodges ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendee_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Helper function to check if policy exists
CREATE OR REPLACE FUNCTION policy_exists(p_table_name text, p_policy_name text)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = p_table_name 
    AND policyname = p_policy_name
  );
END;
$$ LANGUAGE plpgsql;

-- Create RLS policies (checking for existence first)
DO $$
BEGIN
  -- Events policies
  IF NOT policy_exists('events', 'events_public_select_published') THEN
    CREATE POLICY "events_public_select_published" ON events
      FOR SELECT
      USING (is_published = true);
  END IF;

  IF NOT policy_exists('events', 'events_auth_select_org') THEN
    CREATE POLICY "events_auth_select_org" ON events
      FOR SELECT TO authenticated
      USING (
        organiser_id IN (
          SELECT organisation_id FROM contacts 
          WHERE auth_user_id = auth.uid()
        )
      );
  END IF;

  IF NOT policy_exists('events', 'events_auth_insert') THEN
    CREATE POLICY "events_auth_insert" ON events
      FOR INSERT TO authenticated
      WITH CHECK (
        organiser_id IN (
          SELECT organisation_id FROM contacts 
          WHERE auth_user_id = auth.uid()
        )
      );
  END IF;

  IF NOT policy_exists('events', 'events_auth_update') THEN
    CREATE POLICY "events_auth_update" ON events
      FOR UPDATE TO authenticated
      USING (
        organiser_id IN (
          SELECT organisation_id FROM contacts 
          WHERE auth_user_id = auth.uid()
        )
      );
  END IF;

  IF NOT policy_exists('events', 'events_auth_delete') THEN
    CREATE POLICY "events_auth_delete" ON events
      FOR DELETE TO authenticated
      USING (
        organiser_id IN (
          SELECT organisation_id FROM contacts 
          WHERE auth_user_id = auth.uid()
        ) AND 
        is_published = false
      );
  END IF;

  -- Email log policies
  IF NOT policy_exists('email_log', 'Service role can manage email_log') THEN
    CREATE POLICY "Service role can manage email_log" ON public.email_log
    FOR ALL USING (auth.role() = 'service_role');
  END IF;

  IF NOT policy_exists('email_log', 'Users can view their own email logs') THEN
    CREATE POLICY "Users can view their own email logs" ON public.email_log
    FOR SELECT USING (
      registration_id IN (
        SELECT registration_id FROM registrations 
        WHERE contact_id IN (
          SELECT contact_id FROM contacts 
          WHERE auth_user_id = auth.uid()
        )
      )
    );
  END IF;

  -- Documents policies
  IF NOT policy_exists('documents', 'Service role can manage documents') THEN
    CREATE POLICY "Service role can manage documents" ON public.documents
    FOR ALL USING (auth.role() = 'service_role');
  END IF;

  IF NOT policy_exists('documents', 'Users can view their own documents') THEN
    CREATE POLICY "Users can view their own documents" ON public.documents
    FOR SELECT USING (
      registration_id IN (
        SELECT registration_id FROM registrations 
        WHERE contact_id IN (
          SELECT contact_id FROM contacts 
          WHERE auth_user_id = auth.uid()
        )
      )
    );
  END IF;

  -- Add other policies as needed...
  
END $$;

-- ============================================================================
-- 9. PERMISSIONS
-- ============================================================================

-- Grant permissions (will fail gracefully if insufficient privileges)
DO $$
BEGIN
  -- Public data accessible to everyone
  GRANT SELECT ON events TO anon, authenticated;
  GRANT SELECT ON organisations TO anon, authenticated;
  GRANT SELECT ON event_tickets TO anon, authenticated;
  GRANT SELECT ON packages TO anon, authenticated;
  GRANT SELECT ON lodges TO anon, authenticated;
  GRANT SELECT ON grand_lodges TO anon, authenticated;
  GRANT SELECT ON locations TO anon, authenticated;

  -- Authenticated users need more permissions
  GRANT ALL ON customers TO authenticated;
  GRANT ALL ON registrations TO authenticated;
  GRANT ALL ON attendees TO authenticated;
  GRANT ALL ON tickets TO authenticated;
  GRANT ALL ON contacts TO authenticated;
  GRANT UPDATE ON organisations TO authenticated;
  GRANT ALL ON masonic_profiles TO authenticated;
  GRANT INSERT, UPDATE, DELETE ON event_tickets TO authenticated;
  GRANT INSERT, UPDATE ON packages TO authenticated;
  GRANT SELECT ON user_roles TO authenticated;
  GRANT UPDATE ON lodges TO authenticated;
  GRANT INSERT, UPDATE ON locations TO authenticated;
  GRANT SELECT ON attendee_events TO authenticated;
  GRANT ALL ON memberships TO authenticated;
  GRANT INSERT, UPDATE, DELETE ON events TO authenticated;
  
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE NOTICE 'Insufficient privileges to grant permissions. Please run these grants through Supabase dashboard or as superuser.';
END $$;

-- ============================================================================
-- 10. FINAL VALIDATION AND CLEANUP
-- ============================================================================

-- Drop helper function
DROP FUNCTION IF EXISTS policy_exists(text, text);

-- Commit transaction
COMMIT;

-- Report completion
DO $$
BEGIN
  RAISE NOTICE 'Database migration completed successfully!';
  RAISE NOTICE 'All tables, views, functions, triggers, indexes, and RLS policies have been created.';
  RAISE NOTICE 'Please verify the database state and run any necessary data migrations.';
END $$;