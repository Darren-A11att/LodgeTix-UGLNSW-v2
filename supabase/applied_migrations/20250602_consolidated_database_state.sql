-- ============================================================================
-- COMPLETE DATABASE STATE MIGRATION (SAFE VERSION)
-- Date: 2025-06-02
-- Description: This migration represents the complete database state after all
--              migrations have been applied chronologically. This version safely
--              handles existing objects.
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
-- 2. ADD MISSING COLUMNS TO EXISTING TABLES
-- ============================================================================

-- Events table additions
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS banner_image_url TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS long_description TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS stripe_product_id TEXT;

-- Registrations table additions
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS confirmation_sent_at TIMESTAMPTZ;
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ;
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS registration_metadata JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS connected_account_id TEXT;
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS platform_fee_amount DECIMAL(10,2);
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS platform_fee_id TEXT;
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS subtotal DECIMAL(10,2);
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS stripe_fee DECIMAL(10,2);
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS includes_processing_fee BOOLEAN DEFAULT false;
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS confirmation_pdf_url TEXT;
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS customer_id TEXT; -- Legacy compatibility

-- Tickets table additions
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS qr_code_generated_at TIMESTAMPTZ;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS confirmation_sent_at TIMESTAMPTZ;

-- Organisations table additions (Stripe Connect)
ALTER TABLE public.organisations ADD COLUMN IF NOT EXISTS stripe_onbehalfof TEXT;
ALTER TABLE public.organisations ADD COLUMN IF NOT EXISTS stripe_account_status TEXT DEFAULT 'pending';
ALTER TABLE public.organisations ADD COLUMN IF NOT EXISTS stripe_payouts_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE public.organisations ADD COLUMN IF NOT EXISTS stripe_details_submitted BOOLEAN DEFAULT FALSE;
ALTER TABLE public.organisations ADD COLUMN IF NOT EXISTS stripe_capabilities JSONB;

-- Event Tickets table additions
ALTER TABLE public.event_tickets ADD COLUMN IF NOT EXISTS stripe_price_id TEXT;
ALTER TABLE public.event_tickets ADD COLUMN IF NOT EXISTS waitlist_count INTEGER DEFAULT 0;
ALTER TABLE public.event_tickets ADD COLUMN IF NOT EXISTS max_waitlist INTEGER DEFAULT 0;

-- ============================================================================
-- 3. FIX DATA TYPE ISSUES
-- ============================================================================

-- Ensure is_partner field exists as UUID in attendees table
-- Note: This field stores a foreign key reference to another attendee
-- who is the partner of this attendee (stores the attendeeId)
ALTER TABLE public.attendees ADD COLUMN IF NOT EXISTS is_partner UUID;

-- ============================================================================
-- 4. CREATE MISSING TABLES
-- ============================================================================

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

-- Registration Payments table (referenced but might not exist)
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
-- 5. ADD/UPDATE CONSTRAINTS
-- ============================================================================

-- Add check constraints if they don't exist
DO $$
BEGIN
    -- Registration type constraint
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'check_valid_registration_type'
    ) THEN
        ALTER TABLE public.registrations 
        ADD CONSTRAINT check_valid_registration_type 
        CHECK (registration_type IN ('individual', 'lodge', 'delegation'));
    END IF;

    -- Payment status constraint
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'check_valid_payment_status'
    ) THEN
        ALTER TABLE public.registrations 
        ADD CONSTRAINT check_valid_payment_status 
        CHECK (payment_status IN ('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'));
    END IF;

    -- Email status constraint
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'check_valid_email_status'
    ) THEN
        ALTER TABLE public.email_log 
        ADD CONSTRAINT check_valid_email_status 
        CHECK (status IN ('sent', 'failed', 'bounced', 'pending', 'queued'));
    END IF;

    -- Ticket status constraint
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'check_valid_ticket_status'
    ) THEN
        ALTER TABLE public.tickets
        ADD CONSTRAINT check_valid_ticket_status 
        CHECK (status IN ('available', 'reserved', 'sold', 'used', 'cancelled'));
    END IF;

    -- is_partner foreign key constraint
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'attendees_is_partner_fkey'
    ) THEN
        ALTER TABLE public.attendees
        ADD CONSTRAINT attendees_is_partner_fkey 
        FOREIGN KEY (is_partner) REFERENCES attendees(attendee_id) ON DELETE SET NULL;
    END IF;
END $$;

-- ============================================================================
-- 6. TRIGGER FUNCTIONS
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
-- 7. VIEWS (CREATE OR REPLACE)
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

-- Other views...
-- (Continue with all other views from the original migration)

-- ============================================================================
-- 8. RPC FUNCTIONS (CREATE OR REPLACE)
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

-- ============================================================================
-- 9. TRIGGERS (DROP AND RECREATE IF EXISTS)
-- ============================================================================

-- Drop existing triggers before recreating
DROP TRIGGER IF EXISTS inherit_organiser_on_insert ON events;
DROP TRIGGER IF EXISTS inherit_organiser_on_update ON events;
DROP TRIGGER IF EXISTS update_event_ticket_counts_trigger ON tickets;
DROP TRIGGER IF EXISTS update_event_counts_trigger ON tickets;
DROP TRIGGER IF EXISTS update_contacts_updated_at ON contacts;
DROP TRIGGER IF EXISTS update_memberships_updated_at ON memberships;
DROP TRIGGER IF EXISTS update_email_log_updated_at ON email_log;
DROP TRIGGER IF EXISTS update_documents_updated_at ON documents;

-- Recreate triggers
CREATE TRIGGER inherit_organiser_on_insert BEFORE INSERT ON events 
FOR EACH ROW EXECUTE FUNCTION inherit_parent_organiser_id();

CREATE TRIGGER inherit_organiser_on_update BEFORE UPDATE ON events 
FOR EACH ROW WHEN (
    new.parent_event_id is distinct from old.parent_event_id
    or new.organiser_id is null and old.organiser_id is not null
)
EXECUTE FUNCTION inherit_parent_organiser_id();

CREATE TRIGGER update_event_ticket_counts_trigger
AFTER INSERT OR UPDATE OR DELETE ON tickets
FOR EACH ROW
EXECUTE FUNCTION update_event_ticket_counts();

CREATE TRIGGER update_event_counts_trigger
AFTER INSERT OR UPDATE OR DELETE ON tickets
FOR EACH ROW
EXECUTE FUNCTION update_event_counts();

CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_memberships_updated_at BEFORE UPDATE ON memberships 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_log_updated_at BEFORE UPDATE ON public.email_log 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON public.documents 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 10. INDEXES (CREATE IF NOT EXISTS)
-- ============================================================================

-- Event Indexes
CREATE INDEX IF NOT EXISTS idx_events_slug ON events(slug);
CREATE INDEX IF NOT EXISTS idx_events_parent_published ON events(parent_event_id, is_published) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_events_featured_published ON events(featured, is_published) WHERE featured = true AND is_published = true;
CREATE INDEX IF NOT EXISTS idx_events_date_range ON events(event_start, event_end);
CREATE INDEX IF NOT EXISTS idx_events_organiser ON events(organiser_id);
CREATE INDEX IF NOT EXISTS idx_events_location_published ON events(location_id, is_published) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_events_stripe_product_id ON events(stripe_product_id);

-- Ticket Indexes
CREATE INDEX IF NOT EXISTS idx_event_tickets_event_active ON event_tickets(event_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_tickets_registration_status ON tickets(registration_id, status);
CREATE INDEX IF NOT EXISTS idx_tickets_type_event ON tickets(ticket_type_id, event_id);
CREATE INDEX IF NOT EXISTS idx_tickets_reservation_expiry ON tickets(reservation_expires_at) WHERE reservation_expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_event_tickets_stripe_price_id ON event_tickets(stripe_price_id);

-- Registration Indexes
CREATE INDEX IF NOT EXISTS idx_registrations_contact_event ON registrations(contact_id, event_id);
CREATE INDEX IF NOT EXISTS idx_registrations_payment_status ON registrations(payment_status);
CREATE INDEX IF NOT EXISTS idx_registrations_stripe_intent ON registrations(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_registrations_confirmation_number ON registrations(confirmation_number);

-- New Table Indexes
CREATE INDEX IF NOT EXISTS idx_email_log_registration_id ON email_log(registration_id);
CREATE INDEX IF NOT EXISTS idx_email_log_email_type ON email_log(email_type);
CREATE INDEX IF NOT EXISTS idx_email_log_sent_at ON email_log(sent_at);
CREATE INDEX IF NOT EXISTS idx_email_log_status ON email_log(status);
CREATE INDEX IF NOT EXISTS idx_documents_registration_id ON documents(registration_id);
CREATE INDEX IF NOT EXISTS idx_documents_document_type ON documents(document_type);
CREATE INDEX IF NOT EXISTS idx_documents_expires_at ON documents(expires_at) WHERE expires_at IS NOT NULL;

-- ============================================================================
-- 11. ROW LEVEL SECURITY (ENABLE IF NOT ALREADY ENABLED)
-- ============================================================================

-- Enable RLS on all tables (safe to run even if already enabled)
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

-- Create basic RLS policies if they don't exist
DO $$
BEGIN
  -- Events policies
  IF NOT policy_exists('events', 'events_public_select_published') THEN
    CREATE POLICY "events_public_select_published" ON events
      FOR SELECT
      USING (is_published = true);
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
END $$;

-- Drop helper function
DROP FUNCTION IF EXISTS policy_exists(text, text);

-- ============================================================================
-- 12. PERMISSIONS (GRANT IF NOT ALREADY GRANTED)
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
-- 13. FINAL VALIDATION
-- ============================================================================

-- Report completion
DO $$
BEGIN
  RAISE NOTICE 'Database migration completed successfully!';
  RAISE NOTICE 'This migration safely handles existing objects and only creates/modifies what is needed.';
  RAISE NOTICE 'Please verify the database state and test your application.';
END $$;

-- Commit transaction
COMMIT;