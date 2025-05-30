# LodgeTix Data Architecture Summary

## Document Overview

This summary consolidates all data architecture documentation for the LodgeTix platform:

1. **DATA_REQUIREMENTS.md** - Core entity definitions and business rules
2. **COMPONENT_DATA_REQUIREMENTS.md** - Component-specific data needs
3. **DATA_OPERATIONS_AND_RLS.md** - CRUD operations and security policies
4. **API_INTEGRATION_STRATEGY.md** - Supabase integration approach

## Quick Reference: Operations by Component

### Public Pages (No Auth Required)

| Component | Operations | RLS Required |
|-----------|------------|--------------|
| Homepage Featured Events | FETCH (filtered, limited) | Public read for published events |
| Events List | FETCH events, RPC for pricing | Public read for published events |
| Event Detail | FETCH event + relations, SUBSCRIBE to changes | Public read for published events |
| Ticket Availability | SUBSCRIBE to real-time updates | Public read for active tickets |

### Registration Flow (Anonymous Auth)

| Component | Operations | RLS Required |
|-----------|------------|--------------|
| Registration Start | INSERT registration, Auth anonymous | Users create own registrations |
| Attendee Forms | FETCH references, UPSERT attendees, DELETE removed | Users manage own attendees |
| Lodge Form | UPDATE registration, UPDATE customer | Users update own records |
| Ticket Selection | FETCH eligible, INSERT reserved, DELETE deselected | Users manage own tickets |
| Payment | RPC payment intent, UPDATE statuses | Users update own payment |
| Confirmation | FETCH confirmation, RPC generate QR | Users view own confirmation |

### Admin Operations (Auth Required)

| Component | Operations | RLS Required |
|-----------|------------|--------------|
| Event Management | Full CRUD on events/tickets | Org members manage their events |
| Registration View | FETCH with filters, UPDATE status | Org members view their registrations |
| Financial Reports | RPC aggregations | Org members access their data |

## Critical Data Flows

### 1. Ticket Reservation Flow
```
User Selects Ticket → INSERT with status='reserved' → Triggers update counts
→ Real-time broadcast to other users → Payment Success → UPDATE status='sold'
→ Payment Fail/Timeout → UPDATE status='cancelled' → Triggers restore counts
```

### 2. Registration State Machine
```
Anonymous → Draft → Type Selected → Attendees Added → Tickets Reserved 
→ Payment Processing → Confirmed/Failed
```

### 3. Event Hierarchy
```
Parent Event (Container) → Child Events (Actual events) → Tickets (Purchasable)
→ Packages (Bundle tickets across children)
```

## RLS Policy Summary

### Public Access (No Auth)
```sql
-- Events
CREATE POLICY "public_read_published_events" ON events
  FOR SELECT USING (is_published = true);

-- Tickets  
CREATE POLICY "public_read_active_tickets" ON event_tickets
  FOR SELECT USING (is_active = true AND status = 'Active');

-- Reference Data
CREATE POLICY "public_read_grand_lodges" ON grand_lodges
  FOR SELECT USING (true);
```

### User Access (Anonymous/Authenticated)
```sql
-- Own Data Only
CREATE POLICY "users_manage_own_registrations" ON registrations
  FOR ALL USING (auth.uid() = customer_id);

CREATE POLICY "users_manage_own_attendees" ON attendees
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM registrations r
      WHERE r.registration_id = attendees.registration_id
      AND r.customer_id = auth.uid()
    )
  );
```

### Organization Access
```sql
-- Manage Organization Resources
CREATE POLICY "org_members_manage_events" ON events
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM organisation_memberships om
      WHERE om.organisation_id = events.organisation_id
      AND om.user_id = auth.uid()
      AND om.role IN ('admin', 'organizer')
    )
  );
```

## Postgres Functions (RPC)

### Essential Functions
1. **get_eligible_tickets** - Complex eligibility logic
2. **get_registration_summary** - Aggregated registration data
3. **create_payment_intent** - Stripe integration
4. **calculate_event_min_prices** - Pricing aggregation
5. **get_event_availability** - Real-time capacity

### Why RPC vs Direct Queries
- **Use RPC**: Complex joins, business logic, aggregations, security
- **Use Direct**: Simple CRUD, single table, basic filters

## Performance Optimization

### Critical Indexes
```sql
-- Most Important
idx_events_slug -- Event lookups
idx_tickets_registration_status -- Ticket management
idx_event_tickets_event_active -- Availability checks
idx_attendees_registration -- Attendee queries
```

### Caching Strategy
- **Cache**: Reference data (lodges, ranks, titles)
- **Real-time**: Availability, registration data
- **Invalidate**: On event/ticket updates

## Supabase Features Used

### 1. Authentication
- Anonymous sessions for registration
- Full auth for admin/organizers

### 2. Real-time
- Ticket availability updates only
- Event changes for internal components

### 3. RPC Functions
- Complex queries and business logic
- Secure operations with SECURITY DEFINER

### 4. Edge Functions
- Stripe Connect sync ONLY
- Async processing after changes

### 5. Row Level Security
- Currently disabled (needs implementation)
- Policies defined for all tables

## Data Integrity Rules

### Foreign Key Constraints
- **CASCADE**: Tickets → Registration (delete tickets with registration)
- **RESTRICT**: Tickets → Ticket Type (can't delete types with tickets)
- **SET NULL**: Events → Organization (events remain if org deleted)

### Business Rules Enforced
1. All tickets MUST have ticket_type_id
2. Ticket counts managed by triggers
3. Registration type determines data requirements
4. Payment status gates ticket confirmation

## Next Steps

1. **Enable RLS**: Implement and test all policies
2. **Create Indexes**: Add performance indexes
3. **Build RPC Functions**: Implement complex queries
4. **Setup Monitoring**: Track slow queries
5. **Document APIs**: OpenAPI specs for each endpoint

This architecture ensures data integrity, security, and performance while supporting the complex requirements of Masonic event registration.