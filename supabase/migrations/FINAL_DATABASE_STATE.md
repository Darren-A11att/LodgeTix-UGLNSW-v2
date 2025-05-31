# Final Database State After All Migrations

This document represents the complete database schema after applying all migrations in chronological order.

## Custom Types / Enums

### Enums (inferred from usage patterns)
```sql
-- Attendee Type
CREATE TYPE public.attendee_type AS ENUM ('mason', 'guest', 'partner');

-- Contact Type
CREATE TYPE public.contact_type AS ENUM ('individual', 'organisation', 'mason', 'guest');

-- Customer Type
CREATE TYPE public.customer_type AS ENUM ('individual', 'organisation');

-- Organisation Type
CREATE TYPE public.organisation_type AS ENUM ('grand_lodge', 'lodge', 'masonic_organisation', 'other');

-- Payment Status
CREATE TYPE public.payment_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded', 'partially_refunded', 'expired');

-- Registration Type
CREATE TYPE public.registration_type AS ENUM ('individual', 'lodge', 'delegation');

-- Attendee Contact Preference
CREATE TYPE public.attendee_contact_preference AS ENUM ('email', 'phone', 'both', 'none');

-- Custom Composite Type for Package Items
CREATE TYPE public.package_item AS (
    item_type text,
    item_id uuid,
    quantity integer,
    description text
);
```

## Tables (Final State)

### 1. organisations
```sql
CREATE TABLE public.organisations (
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
```

### 2. locations
```sql
CREATE TABLE public.locations (
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
```

### 3. contacts
```sql
CREATE TABLE public.contacts (
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
```

### 4. customers
```sql
CREATE TABLE public.customers (
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
```

### 5. display_scopes
```sql
CREATE TABLE public.display_scopes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 6. eligibility_criteria
```sql
CREATE TABLE public.eligibility_criteria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    criteria TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    type TEXT
);
```

### 7. events
```sql
CREATE TABLE public.events (
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
```

### 8. grand_lodges
```sql
CREATE TABLE public.grand_lodges (
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
```

### 9. lodges
```sql
CREATE TABLE public.lodges (
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
```

### 10. masonic_profiles
```sql
CREATE TABLE public.masonic_profiles (
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
```

### 11. memberships
```sql
CREATE TABLE public.memberships (
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
```

### 12. registrations
```sql
CREATE TABLE public.registrations (
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
    CONSTRAINT check_valid_registration_type CHECK (registration_type IN ('individual', 'lodge', 'delegation')),
    CONSTRAINT check_valid_payment_status CHECK (payment_status IN ('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'))
);
```

### 13. attendees
```sql
CREATE TABLE public.attendees (
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
    is_partner BOOLEAN,  -- Changed from TEXT to BOOLEAN
    has_partner BOOLEAN DEFAULT false,
    contact_id UUID REFERENCES contacts(contact_id) ON DELETE SET NULL
);
```

### 14. packages
```sql
CREATE TABLE public.packages (
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
```

### 15. event_tickets
```sql
CREATE TABLE public.event_tickets (
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
```

### 16. tickets
```sql
CREATE TABLE public.tickets (
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
```

### 17. attendee_events
```sql
CREATE TABLE public.attendee_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attendee_id UUID NOT NULL REFERENCES attendees(attendee_id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES events(event_id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'confirmed'::character varying,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 18. user_roles
```sql
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    role VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role)
);
```

### 19. email_log
```sql
CREATE TABLE public.email_log (
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
```

### 20. documents
```sql
CREATE TABLE public.documents (
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
```

### 21. organisation_payouts (Stripe Connect)
```sql
CREATE TABLE public.organisation_payouts (
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
```

### 22. platform_transfers (Stripe Connect)
```sql
CREATE TABLE public.platform_transfers (
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
```

### 23. connected_account_payments (Stripe Connect)
```sql
CREATE TABLE public.connected_account_payments (
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
```

### 24. registration_payments (Table referenced but not explicitly created)
```sql
-- This appears to be referenced in complete_payment function but not explicitly created
-- It might be created elsewhere or might be a missing migration
CREATE TABLE public.registration_payments (
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
```

## Views

### 1. event_display_view
```sql
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
```

### 2. registration_detail_view
```sql
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
```

### 3. ticket_availability_view
```sql
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
```

### 4. attendee_complete_view
```sql
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
```

### 5. event_hierarchy_view
```sql
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
```

### 6. registration_payments (View)
```sql
CREATE VIEW public.registration_payments AS
SELECT
    r.registration_id,
    r.status as registration_status,
    r.payment_status,
    r.total_price_paid as total_price,
    r.total_amount_paid as total_paid,
    r.stripe_payment_intent_id as payment_intent_id,
    spi.status as stripe_payment_status,
    spi.amount::numeric / 100::numeric as stripe_amount
FROM
    registrations r
    LEFT JOIN stripe.payment_intents spi on r.stripe_payment_intent_id = spi.id;
```

### 7. registration_summary (View)
```sql
CREATE VIEW public.registration_summary AS
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
    LEFT JOIN customers c on r.contact_id = c.customer_id
    LEFT JOIN events e on r.event_id = e.event_id;
```

### 8. auth_user_customer_view
```sql
CREATE VIEW public.auth_user_customer_view AS
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
```

### 9. contacts_view
```sql
CREATE VIEW public.contacts_view AS
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
    mp.grand_lodge_id,
    array_agg(distinct om.organisation_id) filter (
        where
            om.organisation_id is not null
    ) as member_of_organisations,
    array_agg(distinct om.role_in_org) filter (
        where
            om.role_in_org is not null
    ) as organisation_roles
FROM
    contacts c
    LEFT JOIN masonic_profiles mp on c.contact_id = mp.contact_id
    LEFT JOIN organisationmemberships om on c.contact_id = om.contact_id
GROUP BY
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
    mp.grand_lodge_id;
```

### 10. memberships_view
```sql
CREATE VIEW public.memberships_view AS
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
```

### 11. registration_fee_summary
```sql
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
```

## Functions

### 1. get_event_with_details (Latest Version)
```sql
CREATE OR REPLACE FUNCTION public.get_event_with_details(p_event_slug TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
-- See full implementation in 20250601_update_get_event_with_details_add_missing_fields.sql
-- Returns complete event data including child events with all fields, packages, tickets, and location
$$;
```

### 2. get_eligible_tickets
```sql
CREATE OR REPLACE FUNCTION public.get_eligible_tickets(
    p_event_id UUID,
    p_registration_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
-- See full implementation in 20250530162121_create_rpc_get_eligible_tickets.sql
-- Determines which tickets each attendee can purchase based on eligibility criteria
$$;
```

### 3. check_ticket_eligibility (Helper Function)
```sql
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
-- Helper function for get_eligible_tickets
$$;
```

### 4. create_registration_with_attendees
```sql
CREATE OR REPLACE FUNCTION public.create_registration_with_attendees(
    p_registration_data JSON
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
-- Creates complete registration with attendees and masonic profiles atomically
$$;
```

### 5. reserve_tickets
```sql
CREATE OR REPLACE FUNCTION public.reserve_tickets(
    p_ticket_selections JSON
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
-- Reserves tickets with automatic expiry and availability checking
$$;
```

### 6. complete_payment (Latest Version with Fixed Enum)
```sql
CREATE OR REPLACE FUNCTION public.complete_payment(
    p_registration_id UUID,
    p_payment_intent_id TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
-- Completes payment, updates ticket status, generates confirmation number
-- Fixed to use 'completed' instead of 'paid' for payment_status enum
$$;
```

### 7. get_registration_summary
```sql
CREATE OR REPLACE FUNCTION public.get_registration_summary(
    p_registration_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
-- Returns comprehensive registration data for confirmations and admin views
$$;
```

### 8. calculate_event_pricing
```sql
CREATE OR REPLACE FUNCTION public.calculate_event_pricing(
    p_event_ids UUID[]
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
-- Batch calculates pricing information for multiple events
$$;
```

### 9. check_ticket_availability
```sql
CREATE OR REPLACE FUNCTION public.check_ticket_availability(
    p_event_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
-- Real-time availability check with reservation cleanup
$$;
```

### 10. cleanup_expired_reservations
```sql
CREATE OR REPLACE FUNCTION public.cleanup_expired_reservations()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
-- Cleans up expired ticket reservations and returns them to inventory
$$;
```

### 11. get_payment_processing_data
```sql
CREATE OR REPLACE FUNCTION get_payment_processing_data(p_registration_id UUID)
RETURNS JSON AS $$
-- Fetches comprehensive registration data for Stripe payment processing
$$;
```

### 12. update_event_ticket_counts (Trigger Function)
```sql
CREATE OR REPLACE FUNCTION update_event_ticket_counts()
RETURNS TRIGGER AS $$
-- Updates event_ticket counts when tickets are created/updated/deleted
$$;
```

### 13. update_event_counts (Trigger Function)
```sql
CREATE OR REPLACE FUNCTION update_event_counts()
RETURNS TRIGGER AS $$
-- Updates event counts when tickets change
$$;
```

### 14. expire_ticket_reservations
```sql
CREATE OR REPLACE FUNCTION expire_ticket_reservations()
RETURNS void AS $$
-- Expires ticket reservations and updates counts
$$;
```

### 15. update_updated_at_column (Trigger Function)
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';
```

### 16. get_event_location
```sql
CREATE OR REPLACE FUNCTION get_event_location(p_event_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
AS $$
    SELECT 
        COALESCE(
            l.name || COALESCE(', ' || l.city, '') || COALESCE(', ' || l.state, ''),
            'TBA'
        )
    FROM events e
    LEFT JOIN locations l ON e.location_id = l.location_id
    WHERE e.event_id = p_event_id;
$$;
```

### 17. inherit_parent_organiser_id (Trigger Function)
```sql
-- Function exists based on trigger definition but implementation not in provided files
CREATE OR REPLACE FUNCTION inherit_parent_organiser_id()
RETURNS TRIGGER AS $$
-- Inherits organiser_id from parent event if not specified
$$;
```

### 18. monitor_index_usage
```sql
CREATE OR REPLACE FUNCTION monitor_index_usage()
RETURNS TABLE (
    schemaname text,
    tablename text,
    indexname text,
    idx_scan bigint,
    idx_tup_read bigint,
    idx_tup_fetch bigint,
    table_size text,
    index_size text,
    usage_ratio numeric
) AS $$
-- Monitors index usage statistics for performance tuning
$$;
```

### 19. find_missing_indexes
```sql
CREATE OR REPLACE FUNCTION find_missing_indexes()
RETURNS TABLE (
    tablename text,
    attname text,
    n_distinct numeric,
    correlation numeric,
    null_frac numeric,
    avg_width integer,
    recommendation text
) AS $$
-- Identifies columns that might benefit from indexes
$$;
```

## Triggers

### 1. Events Table Triggers
```sql
-- Inherit organiser from parent event
CREATE TRIGGER inherit_organiser_on_insert BEFORE INSERT ON events 
FOR EACH ROW EXECUTE FUNCTION inherit_parent_organiser_id();

CREATE TRIGGER inherit_organiser_on_update BEFORE UPDATE ON events 
FOR EACH ROW WHEN (
    new.parent_event_id is distinct from old.parent_event_id
    or new.organiser_id is null and old.organiser_id is not null
)
EXECUTE FUNCTION inherit_parent_organiser_id();
```

### 2. Tickets Table Triggers
```sql
-- Update event_ticket counts
CREATE TRIGGER update_event_ticket_counts_trigger
AFTER INSERT OR UPDATE OR DELETE ON tickets
FOR EACH ROW
EXECUTE FUNCTION update_event_ticket_counts();

-- Update event counts
CREATE TRIGGER update_event_counts_trigger
AFTER INSERT OR UPDATE OR DELETE ON tickets
FOR EACH ROW
EXECUTE FUNCTION update_event_counts();
```

### 3. Updated_at Triggers
```sql
-- Contacts
CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Memberships
CREATE TRIGGER update_memberships_updated_at BEFORE UPDATE ON memberships 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Email Log
CREATE TRIGGER update_email_log_updated_at BEFORE UPDATE ON public.email_log 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Documents
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON public.documents 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## Indexes

### Performance Indexes (from 20250530163005_create_performance_indexes.sql)

#### Event Queries
- idx_events_slug
- idx_events_parent_published
- idx_events_featured_published
- idx_events_date_range
- idx_events_organiser
- idx_events_organiser_id
- idx_events_location_published
- idx_events_location_org
- idx_events_capacity
- idx_events_display_scope_id
- idx_events_location_id
- idx_events_parent_event_id
- idx_events_registration_availability_id
- idx_events_stripe_product_id

#### Ticket Queries
- idx_event_tickets_event_active
- idx_tickets_registration_status
- idx_tickets_type_event
- idx_tickets_reservation_expiry
- idx_tickets_attendee
- idx_tickets_reservation
- idx_tickets_status_event
- idx_tickets_package_id
- idx_tickets_ticket_type_id
- idx_tickets_attendee_id
- idx_tickets_event_id
- idx_tickets_registration_id
- idx_tickets_status
- idx_tickets_registration_price
- idx_tickets_registration_paid
- idx_tickets_event_status_created
- idx_event_tickets_event_id
- idx_event_tickets_eligibility_criteria
- idx_event_tickets_active
- idx_event_tickets_active_available
- idx_event_tickets_stripe_price_id

#### Registration Queries
- idx_registrations_contact_event
- idx_registrations_payment_status
- idx_registrations_type_status
- idx_registrations_stripe_intent
- idx_registrations_payment_intent
- idx_registrations_recent
- idx_registrations_created_at
- idx_registrations_customer_id
- idx_registrations_event_id
- idx_registrations_confirmation_number
- idx_registrations_organisation_id
- idx_registrations_event_status_created

#### Attendee Queries
- idx_attendees_registration
- idx_attendees_registration_primary
- idx_attendees_related
- idx_attendees_contact
- idx_attendees_contact_id
- idx_attendees_related_attendee_id
- idx_attendees_registration_id
- idx_attendees_is_primary
- idx_attendee_events_attendee_id
- idx_attendee_events_event_id

#### Reference Data Queries
- idx_masonic_profiles_contact
- idx_lodges_grand_lodge
- idx_contacts_auth_user
- idx_memberships_contact_active
- idx_contacts_source
- idx_contacts_organisation_id
- idx_contacts_auth_user_id
- idx_contacts_email
- idx_contacts_email_lower
- idx_grand_lodges_organisationid
- idx_lodges_grand_lodge_id
- idx_lodges_organisationid
- idx_masonic_profiles_lodge_id
- idx_masonicprofiles_grandlodgeid
- idx_masonic_profiles_contact_id
- idx_memberships_contact_id
- idx_memberships_profile_id
- idx_memberships_type_entity
- idx_memberships_is_active

#### Payment Queries
- idx_connected_payments_registration
- idx_organisation_payouts_stripe_id
- idx_organisation_payouts_created_at
- idx_platform_transfers_destination
- idx_connected_payments_account
- idx_connected_payments_registration

#### Customer Queries
- idx_customers_contact_id
- idx_customers_customer_type
- idx_customers_email
- idx_customers_phone
- idx_customers_created_at
- idx_customers_stripe_id

#### Package Queries
- idx_packages_event_id
- idx_packages_parent_event_id
- idx_packages_is_active
- idx_packages_eligibility_criteria

#### New Tables
- idx_email_log_registration_id
- idx_email_log_email_type
- idx_email_log_sent_at
- idx_email_log_status
- idx_email_log_registration_type_sent
- idx_documents_registration_id
- idx_documents_document_type
- idx_documents_expires_at

## Row Level Security (RLS)

RLS is enabled on:
- email_log
- documents

With policies for:
- Service role full access
- Users can view their own records

## Notes

1. The payment_status enum was fixed from using 'paid' to 'completed' in the complete_payment function
2. The is_partner field in attendees was changed from TEXT to BOOLEAN
3. Several views reference a stripe.payment_intents table which suggests Stripe webhook integration
4. The packages table uses a different structure than initially expected (no included_event_ids array, uses parent_event_id and event_id instead)
5. Some functions like inherit_parent_organiser_id are referenced in triggers but implementation not provided
6. The schema assumes auth.users table exists (Supabase Auth)
7. Some views reference tables that may not exist (organisationmemberships, lodge_registrations)