# API Specifications - Supabase Stored Procedures (v2)
## Hierarchical Events with Stripe Connect

---

## 1. Overview

This document defines Supabase stored procedures for the hierarchical event system where Functions (parent events) contain multiple Child Events. All procedures support Stripe Connect for distributed payment processing.

## 2. Database Schema Updates

### 2.1 Core Tables
```sql
-- Functions (Parent Events)
CREATE TABLE functions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organizer_id UUID REFERENCES auth.users(id),
    stripe_account_id TEXT,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    banner_image TEXT,
    date_start DATE NOT NULL,
    date_end DATE NOT NULL,
    status TEXT DEFAULT 'draft', -- draft, published, closed, archived
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Events (Child Events)
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    function_id UUID REFERENCES functions(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    event_start TIMESTAMP NOT NULL,
    event_end TIMESTAMP NOT NULL,
    location TEXT,
    capacity INTEGER,
    status TEXT DEFAULT 'active', -- active, closed, archived
    display_order INTEGER DEFAULT 0,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Stripe Connect Accounts
CREATE TABLE organizer_stripe_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) UNIQUE,
    stripe_account_id TEXT UNIQUE NOT NULL,
    account_status TEXT, -- pending, active, restricted
    onboarding_completed BOOLEAN DEFAULT FALSE,
    charges_enabled BOOLEAN DEFAULT FALSE,
    payouts_enabled BOOLEAN DEFAULT FALSE,
    default_currency TEXT DEFAULT 'aud',
    platform_fee_percent DECIMAL DEFAULT 2.5,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## 3. Function Management Procedures

### 3.1 `sp_create_function`
Creates a new function with initial child events.

```sql
CREATE OR REPLACE FUNCTION sp_create_function(
    p_function_data JSONB,
    p_child_events JSONB[]
)
RETURNS TABLE (
    function_id UUID,
    function_slug TEXT,
    stripe_account_id TEXT,
    created_events INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_function_id UUID;
    v_slug TEXT;
    v_stripe_account_id TEXT;
    v_event_count INTEGER := 0;
BEGIN
    -- p_function_data: {
    --   name: string,
    --   description: text,
    --   date_start: date,
    --   date_end: date,
    --   banner_image: string,
    --   settings: object
    -- }
    -- p_child_events: [{
    --   name: string,
    --   description: text,
    --   event_start: timestamp,
    --   event_end: timestamp,
    --   location: string,
    --   capacity: integer,
    --   display_order: integer
    -- }]
    
    -- Check Stripe Connect status
    SELECT stripe_account_id INTO v_stripe_account_id
    FROM organizer_stripe_accounts
    WHERE user_id = auth.uid() AND charges_enabled = TRUE;
    
    IF v_stripe_account_id IS NULL THEN
        RAISE EXCEPTION 'Stripe Connect account required';
    END IF;
    
    -- Generate unique slug
    v_slug := generate_unique_slug(p_function_data->>'name');
    
    -- Create function
    INSERT INTO functions (
        organizer_id, stripe_account_id, name, slug, description,
        date_start, date_end, banner_image, settings
    ) VALUES (
        auth.uid(), v_stripe_account_id, 
        p_function_data->>'name', v_slug,
        p_function_data->>'description',
        (p_function_data->>'date_start')::DATE,
        (p_function_data->>'date_end')::DATE,
        p_function_data->>'banner_image',
        COALESCE(p_function_data->'settings', '{}')
    ) RETURNING id INTO v_function_id;
    
    -- Create child events
    FOR i IN 1..array_length(p_child_events, 1) LOOP
        INSERT INTO events (
            function_id, name, description, event_start, event_end,
            location, capacity, display_order
        ) VALUES (
            v_function_id,
            p_child_events[i]->>'name',
            p_child_events[i]->>'description',
            (p_child_events[i]->>'event_start')::TIMESTAMP,
            (p_child_events[i]->>'event_end')::TIMESTAMP,
            p_child_events[i]->>'location',
            (p_child_events[i]->>'capacity')::INTEGER,
            COALESCE((p_child_events[i]->>'display_order')::INTEGER, i)
        );
        v_event_count := v_event_count + 1;
    END LOOP;
    
    RETURN QUERY SELECT v_function_id, v_slug, v_stripe_account_id, v_event_count;
END;
$$;
```

### 3.2 `sp_manage_child_event`
CRUD operations for child events within a function.

```sql
CREATE OR REPLACE FUNCTION sp_manage_child_event(
    p_function_id UUID,
    p_operation TEXT, -- 'create', 'update', 'close', 'archive'
    p_event_id UUID DEFAULT NULL,
    p_event_data JSONB DEFAULT NULL
)
RETURNS TABLE (
    event_id UUID,
    operation_result TEXT,
    affected_registrations INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_event_id UUID;
    v_result TEXT;
    v_affected INTEGER := 0;
BEGIN
    -- Verify ownership
    IF NOT EXISTS (
        SELECT 1 FROM functions 
        WHERE id = p_function_id AND organizer_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;
    
    CASE p_operation
        WHEN 'create' THEN
            INSERT INTO events (
                function_id, name, description, event_start, event_end,
                location, capacity, display_order
            ) VALUES (
                p_function_id,
                p_event_data->>'name',
                p_event_data->>'description',
                (p_event_data->>'event_start')::TIMESTAMP,
                (p_event_data->>'event_end')::TIMESTAMP,
                p_event_data->>'location',
                (p_event_data->>'capacity')::INTEGER,
                COALESCE((p_event_data->>'display_order')::INTEGER, 999)
            ) RETURNING id INTO v_event_id;
            v_result := 'created';
            
        WHEN 'update' THEN
            -- Check for existing tickets before allowing time changes
            IF EXISTS (
                SELECT 1 FROM tickets t
                JOIN ticket_definitions td ON t.ticket_definition_id = td.id
                WHERE td.event_id = p_event_id
            ) THEN
                -- Restrict certain changes
                IF p_event_data ? 'event_start' OR p_event_data ? 'event_end' THEN
                    RAISE EXCEPTION 'Cannot change event times with existing tickets';
                END IF;
            END IF;
            
            UPDATE events SET
                name = COALESCE(p_event_data->>'name', name),
                description = COALESCE(p_event_data->>'description', description),
                location = COALESCE(p_event_data->>'location', location),
                capacity = COALESCE((p_event_data->>'capacity')::INTEGER, capacity),
                updated_at = NOW()
            WHERE id = p_event_id AND function_id = p_function_id
            RETURNING id INTO v_event_id;
            v_result := 'updated';
            
        WHEN 'close' THEN
            UPDATE events SET status = 'closed'
            WHERE id = p_event_id AND function_id = p_function_id
            RETURNING id INTO v_event_id;
            
            -- Count affected future registrations
            SELECT COUNT(*) INTO v_affected
            FROM tickets t
            JOIN ticket_definitions td ON t.ticket_definition_id = td.id
            WHERE td.event_id = p_event_id AND t.status = 'pending';
            
            v_result := 'closed';
            
        WHEN 'archive' THEN
            UPDATE events SET status = 'archived'
            WHERE id = p_event_id AND function_id = p_function_id
            RETURNING id INTO v_event_id;
            v_result := 'archived';
            
        ELSE
            RAISE EXCEPTION 'Invalid operation';
    END CASE;
    
    RETURN QUERY SELECT v_event_id, v_result, v_affected;
END;
$$;
```

### 3.3 `sp_duplicate_function`
Creates a copy of an existing function as a template.

```sql
CREATE OR REPLACE FUNCTION sp_duplicate_function(
    p_source_function_id UUID,
    p_new_name TEXT,
    p_date_offset INTERVAL
)
RETURNS UUID -- new function_id
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_new_function_id UUID;
    v_source_function RECORD;
    v_event RECORD;
    v_new_event_id UUID;
BEGIN
    -- Get source function
    SELECT * INTO v_source_function
    FROM functions
    WHERE id = p_source_function_id AND organizer_id = auth.uid();
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Function not found or unauthorized';
    END IF;
    
    -- Create new function
    INSERT INTO functions (
        organizer_id, stripe_account_id, name, slug, description,
        date_start, date_end, banner_image, settings, status
    ) VALUES (
        auth.uid(),
        v_source_function.stripe_account_id,
        p_new_name,
        generate_unique_slug(p_new_name),
        v_source_function.description,
        v_source_function.date_start + p_date_offset,
        v_source_function.date_end + p_date_offset,
        v_source_function.banner_image,
        v_source_function.settings,
        'draft'
    ) RETURNING id INTO v_new_function_id;
    
    -- Copy all child events
    FOR v_event IN SELECT * FROM events WHERE function_id = p_source_function_id LOOP
        INSERT INTO events (
            function_id, name, description, event_start, event_end,
            location, capacity, display_order, settings
        ) VALUES (
            v_new_function_id,
            v_event.name,
            v_event.description,
            v_event.event_start + p_date_offset,
            v_event.event_end + p_date_offset,
            v_event.location,
            v_event.capacity,
            v_event.display_order,
            v_event.settings
        ) RETURNING id INTO v_new_event_id;
        
        -- Copy ticket definitions
        INSERT INTO ticket_definitions (
            event_id, name, price, quantity, eligibility, description
        )
        SELECT 
            v_new_event_id, name, price, quantity, eligibility, description
        FROM ticket_definitions
        WHERE event_id = v_event.id;
    END LOOP;
    
    RETURN v_new_function_id;
END;
$$;
```

---

## 4. Stripe Connect Procedures

### 4.1 `sp_create_stripe_connect_account`
Initiates Stripe Connect onboarding.

```sql
CREATE OR REPLACE FUNCTION sp_create_stripe_connect_account(
    p_return_url TEXT,
    p_refresh_url TEXT
)
RETURNS TABLE (
    onboarding_url TEXT,
    account_id TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_account_id TEXT;
    v_onboarding_url TEXT;
BEGIN
    -- Check if account already exists
    SELECT stripe_account_id INTO v_account_id
    FROM organizer_stripe_accounts
    WHERE user_id = auth.uid();
    
    IF v_account_id IS NULL THEN
        -- Call Stripe API to create account (via Edge Function)
        SELECT 
            create_stripe_account(auth.uid(), p_return_url, p_refresh_url) 
        INTO v_account_id, v_onboarding_url;
        
        -- Store account reference
        INSERT INTO organizer_stripe_accounts (
            user_id, stripe_account_id, account_status
        ) VALUES (
            auth.uid(), v_account_id, 'pending'
        );
    ELSE
        -- Get fresh onboarding link for existing account
        SELECT 
            get_stripe_onboarding_link(v_account_id, p_return_url, p_refresh_url)
        INTO v_onboarding_url;
    END IF;
    
    RETURN QUERY SELECT v_onboarding_url, v_account_id;
END;
$$;
```

### 4.2 `sp_update_stripe_account_status`
Updates Stripe account status from webhook.

```sql
CREATE OR REPLACE FUNCTION sp_update_stripe_account_status(
    p_stripe_account_id TEXT,
    p_account_data JSONB
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE organizer_stripe_accounts SET
        account_status = p_account_data->>'status',
        charges_enabled = (p_account_data->>'charges_enabled')::BOOLEAN,
        payouts_enabled = (p_account_data->>'payouts_enabled')::BOOLEAN,
        onboarding_completed = (p_account_data->>'details_submitted')::BOOLEAN,
        metadata = p_account_data->'metadata',
        updated_at = NOW()
    WHERE stripe_account_id = p_stripe_account_id;
    
    RETURN FOUND;
END;
$$;
```

### 4.3 `sp_get_stripe_dashboard_url`
Generates Stripe dashboard login link.

```sql
CREATE OR REPLACE FUNCTION sp_get_stripe_dashboard_url()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_stripe_account_id TEXT;
    v_login_url TEXT;
BEGIN
    SELECT stripe_account_id INTO v_stripe_account_id
    FROM organizer_stripe_accounts
    WHERE user_id = auth.uid() AND charges_enabled = TRUE;
    
    IF v_stripe_account_id IS NULL THEN
        RAISE EXCEPTION 'No active Stripe account';
    END IF;
    
    -- Call Edge Function to create login link
    SELECT create_stripe_login_link(v_stripe_account_id) INTO v_login_url;
    
    RETURN v_login_url;
END;
$$;
```

---

## 5. Registration Management Procedures

### 5.1 `sp_get_function_registrations`
Retrieves registrations with cross-event attendee data.

```sql
CREATE OR REPLACE FUNCTION sp_get_function_registrations(
    p_function_id UUID,
    p_filters JSONB DEFAULT '{}',
    p_page INTEGER DEFAULT 1,
    p_page_size INTEGER DEFAULT 50
)
RETURNS TABLE (
    total_count INTEGER,
    registrations JSONB,
    event_summary JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Returns registration data with attendee event distribution
    RETURN QUERY
    WITH registration_data AS (
        SELECT 
            r.id,
            r.confirmation_number,
            r.created_at,
            r.status,
            r.total_amount,
            c.name as customer_name,
            c.email,
            COUNT(DISTINCT a.id) as attendee_count,
            jsonb_agg(DISTINCT e.name) as events_attending
        FROM registrations r
        JOIN customers c ON r.customer_id = c.id
        JOIN attendees a ON a.registration_id = r.id
        JOIN tickets t ON t.attendee_id = a.id
        JOIN ticket_definitions td ON t.ticket_definition_id = td.id
        JOIN events e ON td.event_id = e.id
        WHERE r.function_id = p_function_id
        GROUP BY r.id, c.name, c.email
    ),
    event_stats AS (
        SELECT 
            e.id,
            e.name,
            e.capacity,
            COUNT(t.id) as tickets_sold
        FROM events e
        LEFT JOIN ticket_definitions td ON td.event_id = e.id
        LEFT JOIN tickets t ON t.ticket_definition_id = td.id
        WHERE e.function_id = p_function_id
        GROUP BY e.id
    )
    SELECT 
        (SELECT COUNT(*) FROM registration_data)::INTEGER,
        jsonb_agg(registration_data.*),
        jsonb_agg(event_stats.*)
    FROM registration_data, event_stats;
END;
$$;
```

### 5.2 `sp_get_attendee_event_matrix`
Returns attendee distribution across child events.

```sql
CREATE OR REPLACE FUNCTION sp_get_attendee_event_matrix(
    p_function_id UUID
)
RETURNS TABLE (
    matrix_data JSONB,
    event_capacities JSONB,
    dietary_by_event JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH attendee_events AS (
        SELECT 
            a.id as attendee_id,
            p.first_name || ' ' || p.last_name as attendee_name,
            a.dietary_requirements,
            e.id as event_id,
            e.name as event_name,
            td.name as ticket_type
        FROM attendees a
        JOIN people p ON a.person_id = p.id
        JOIN registrations r ON a.registration_id = r.id
        JOIN tickets t ON t.attendee_id = a.id
        JOIN ticket_definitions td ON t.ticket_definition_id = td.id
        JOIN events e ON td.event_id = e.id
        WHERE r.function_id = p_function_id
    ),
    capacity_data AS (
        SELECT 
            e.id,
            e.name,
            e.capacity,
            COUNT(t.id) as sold,
            e.capacity - COUNT(t.id) as available
        FROM events e
        LEFT JOIN ticket_definitions td ON td.event_id = e.id
        LEFT JOIN tickets t ON t.ticket_definition_id = td.id
        WHERE e.function_id = p_function_id
        GROUP BY e.id
    )
    SELECT 
        jsonb_object_agg(
            attendee_id::TEXT,
            jsonb_build_object(
                'name', attendee_name,
                'events', jsonb_agg(
                    jsonb_build_object(
                        'event_id', event_id,
                        'event_name', event_name,
                        'ticket_type', ticket_type
                    )
                )
            )
        ),
        jsonb_agg(capacity_data.*),
        jsonb_object_agg(
            event_id::TEXT,
            dietary_requirements
        )
    FROM attendee_events, capacity_data
    GROUP BY attendee_id, attendee_name;
END;
$$;
```

---

## 6. Financial Procedures

### 6.1 `sp_process_stripe_payment`
Handles payment with platform fee.

```sql
CREATE OR REPLACE FUNCTION sp_process_stripe_payment(
    p_registration_id UUID,
    p_payment_intent_id TEXT,
    p_amount DECIMAL
)
RETURNS TABLE (
    success BOOLEAN,
    transfer_id TEXT,
    platform_fee DECIMAL
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_stripe_account_id TEXT;
    v_platform_fee DECIMAL;
    v_transfer_id TEXT;
BEGIN
    -- Get organizer's Stripe account
    SELECT osa.stripe_account_id, osa.platform_fee_percent
    INTO v_stripe_account_id, v_platform_fee
    FROM registrations r
    JOIN functions f ON r.function_id = f.id
    JOIN organizer_stripe_accounts osa ON f.organizer_id = osa.user_id
    WHERE r.id = p_registration_id;
    
    -- Calculate platform fee
    v_platform_fee := p_amount * (v_platform_fee / 100);
    
    -- Create transfer (via Edge Function)
    SELECT create_stripe_transfer(
        p_payment_intent_id,
        p_amount - v_platform_fee,
        v_stripe_account_id
    ) INTO v_transfer_id;
    
    -- Update registration
    UPDATE registrations SET
        payment_status = 'paid',
        stripe_transfer_id = v_transfer_id,
        platform_fee = v_platform_fee,
        updated_at = NOW()
    WHERE id = p_registration_id;
    
    RETURN QUERY SELECT TRUE, v_transfer_id, v_platform_fee;
END;
$$;
```

### 6.2 `sp_get_function_financials`
Returns comprehensive financial data.

```sql
CREATE OR REPLACE FUNCTION sp_get_function_financials(
    p_function_id UUID,
    p_date_from DATE DEFAULT NULL,
    p_date_to DATE DEFAULT NULL
)
RETURNS TABLE (
    summary JSONB,
    daily_revenue JSONB[],
    event_breakdown JSONB[],
    payout_history JSONB[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH financial_summary AS (
        SELECT 
            COUNT(DISTINCT r.id) as total_registrations,
            SUM(r.total_amount) as gross_revenue,
            SUM(r.platform_fee) as total_platform_fees,
            SUM(r.total_amount - r.platform_fee) as net_revenue,
            COUNT(DISTINCT CASE WHEN r.payment_status = 'refunded' THEN r.id END) as refunds
        FROM registrations r
        WHERE r.function_id = p_function_id
        AND (p_date_from IS NULL OR r.created_at >= p_date_from)
        AND (p_date_to IS NULL OR r.created_at <= p_date_to)
    ),
    daily_data AS (
        SELECT 
            DATE(created_at) as date,
            SUM(total_amount) as revenue,
            COUNT(*) as registrations
        FROM registrations
        WHERE function_id = p_function_id
        GROUP BY DATE(created_at)
        ORDER BY date DESC
    ),
    event_revenue AS (
        SELECT 
            e.name as event_name,
            COUNT(DISTINCT t.id) as tickets_sold,
            SUM(td.price) as revenue
        FROM events e
        JOIN ticket_definitions td ON td.event_id = e.id
        JOIN tickets t ON t.ticket_definition_id = td.id
        WHERE e.function_id = p_function_id
        GROUP BY e.id, e.name
    )
    SELECT 
        to_jsonb(financial_summary.*),
        array_agg(to_jsonb(daily_data.*)),
        array_agg(to_jsonb(event_revenue.*)),
        get_stripe_payouts(p_function_id) -- External function call
    FROM financial_summary, daily_data, event_revenue;
END;
$$;
```

---

## 7. Reporting Procedures

### 7.1 `sp_export_function_attendees`
Exports attendee data with event selections.

```sql
CREATE OR REPLACE FUNCTION sp_export_function_attendees(
    p_function_id UUID,
    p_event_ids UUID[] DEFAULT NULL,
    p_fields TEXT[] DEFAULT ARRAY['name', 'email', 'lodge', 'dietary']
)
RETURNS TABLE (
    export_data JSONB,
    metadata JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH attendee_export AS (
        SELECT 
            p.first_name || ' ' || p.last_name as name,
            c.email,
            COALESCE(m.lodge_name, 'Guest') as lodge,
            a.dietary_requirements,
            a.special_requirements,
            array_agg(DISTINCT e.name ORDER BY e.display_order) as events,
            r.confirmation_number
        FROM attendees a
        JOIN people p ON a.person_id = p.id
        JOIN registrations r ON a.registration_id = r.id
        JOIN customers c ON r.customer_id = c.id
        LEFT JOIN masons m ON p.id = m.person_id
        JOIN tickets t ON t.attendee_id = a.id
        JOIN ticket_definitions td ON t.ticket_definition_id = td.id
        JOIN events e ON td.event_id = e.id
        WHERE r.function_id = p_function_id
        AND (p_event_ids IS NULL OR e.id = ANY(p_event_ids))
        GROUP BY p.id, c.email, m.lodge_name, a.id, r.confirmation_number
    )
    SELECT 
        jsonb_agg(
            jsonb_build_object(
                'name', CASE WHEN 'name' = ANY(p_fields) THEN name END,
                'email', CASE WHEN 'email' = ANY(p_fields) THEN email END,
                'lodge', CASE WHEN 'lodge' = ANY(p_fields) THEN lodge END,
                'dietary', CASE WHEN 'dietary' = ANY(p_fields) THEN dietary_requirements END,
                'events', events,
                'confirmation', confirmation_number
            )
        ),
        jsonb_build_object(
            'total_attendees', COUNT(*),
            'export_date', NOW(),
            'function_id', p_function_id
        )
    FROM attendee_export;
END;
$$;
```

---

## 8. Communication Procedures

### 8.1 `sp_send_event_email`
Sends email to attendees of specific child events.

```sql
CREATE OR REPLACE FUNCTION sp_send_event_email(
    p_function_id UUID,
    p_event_ids UUID[],
    p_email_content JSONB
)
RETURNS TABLE (
    recipients INTEGER,
    email_job_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_job_id UUID;
    v_recipient_count INTEGER;
BEGIN
    -- Get unique recipients attending selected events
    WITH recipients AS (
        SELECT DISTINCT c.email, c.name
        FROM events e
        JOIN ticket_definitions td ON td.event_id = e.id
        JOIN tickets t ON t.ticket_definition_id = td.id
        JOIN attendees a ON t.attendee_id = a.id
        JOIN registrations r ON a.registration_id = r.id
        JOIN customers c ON r.customer_id = c.id
        WHERE e.function_id = p_function_id
        AND e.id = ANY(p_event_ids)
    )
    SELECT COUNT(*) INTO v_recipient_count FROM recipients;
    
    -- Create email job
    INSERT INTO email_jobs (
        function_id,
        event_ids,
        subject,
        body_html,
        body_text,
        recipient_count,
        scheduled_for,
        created_by
    ) VALUES (
        p_function_id,
        p_event_ids,
        p_email_content->>'subject',
        p_email_content->>'body_html',
        p_email_content->>'body_text',
        v_recipient_count,
        COALESCE((p_email_content->>'scheduled_for')::TIMESTAMP, NOW()),
        auth.uid()
    ) RETURNING id INTO v_job_id;
    
    RETURN QUERY SELECT v_recipient_count, v_job_id;
END;
$$;
```

---

## 9. Analytics Procedures

### 9.1 `sp_analyze_function_performance`
Analyzes performance across child events.

```sql
CREATE OR REPLACE FUNCTION sp_analyze_function_performance(
    p_function_id UUID
)
RETURNS TABLE (
    performance_metrics JSONB,
    recommendations JSONB[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH event_performance AS (
        SELECT 
            e.id,
            e.name,
            e.capacity,
            COUNT(t.id) as tickets_sold,
            ROUND((COUNT(t.id)::DECIMAL / e.capacity) * 100, 2) as occupancy_rate,
            AVG(td.price) as avg_ticket_price,
            SUM(td.price) as revenue
        FROM events e
        LEFT JOIN ticket_definitions td ON td.event_id = e.id
        LEFT JOIN tickets t ON t.ticket_definition_id = td.id
        WHERE e.function_id = p_function_id
        GROUP BY e.id
    ),
    recommendations AS (
        SELECT 
            CASE 
                WHEN occupancy_rate < 50 THEN 'Consider reducing capacity or increasing marketing'
                WHEN occupancy_rate > 90 THEN 'Consider increasing capacity for next time'
                ELSE 'Capacity well-matched to demand'
            END as recommendation,
            name as event_name
        FROM event_performance
    )
    SELECT 
        jsonb_object_agg(
            'events', jsonb_agg(event_performance.*)
        ),
        array_agg(
            jsonb_build_object(
                'event', event_name,
                'suggestion', recommendation
            )
        )
    FROM event_performance, recommendations;
END;
$$;
```

---

## 10. Error Handling & Logging

All procedures include comprehensive error handling:

```sql
EXCEPTION
    WHEN insufficient_privilege THEN
        RAISE EXCEPTION 'Access denied: %', SQLERRM;
    WHEN foreign_key_violation THEN
        RAISE EXCEPTION 'Invalid reference: %', SQLERRM;
    WHEN check_violation THEN
        RAISE EXCEPTION 'Validation failed: %', SQLERRM;
    WHEN OTHERS THEN
        -- Log to audit table
        INSERT INTO error_logs (
            user_id, 
            procedure_name, 
            error_message, 
            parameters
        ) VALUES (
            auth.uid(), 
            'procedure_name', 
            SQLERRM, 
            jsonb_build_object('params', p_*)
        );
        RAISE EXCEPTION 'Operation failed: %', SQLERRM;
```

---

## 11. Helper Functions

### 11.1 `generate_unique_slug`
```sql
CREATE OR REPLACE FUNCTION generate_unique_slug(p_name TEXT)
RETURNS TEXT AS $$
DECLARE
    v_slug TEXT;
    v_counter INTEGER := 0;
BEGIN
    v_slug := lower(regexp_replace(p_name, '[^a-zA-Z0-9]+', '-', 'g'));
    v_slug := trim(both '-' from v_slug);
    
    WHILE EXISTS (SELECT 1 FROM functions WHERE slug = v_slug || CASE WHEN v_counter > 0 THEN '-' || v_counter ELSE '' END) LOOP
        v_counter := v_counter + 1;
    END LOOP;
    
    RETURN v_slug || CASE WHEN v_counter > 0 THEN '-' || v_counter ELSE '' END;
END;
$$ LANGUAGE plpgsql;
```

### 11.2 RLS Policies for Hierarchical Access
```sql
-- Functions table
CREATE POLICY "Organizers manage own functions" ON functions
FOR ALL USING (organizer_id = auth.uid());

-- Events table (via function ownership)
CREATE POLICY "Organizers manage function events" ON events
FOR ALL USING (
    function_id IN (
        SELECT id FROM functions WHERE organizer_id = auth.uid()
    )
);

-- Financial data (via function ownership)
CREATE POLICY "Organizers view own financial data" ON registrations
FOR SELECT USING (
    function_id IN (
        SELECT id FROM functions WHERE organizer_id = auth.uid()
    )
);