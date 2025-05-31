# TODO: Add Database Performance Indexes

## Overview
Create indexes to optimize query performance based on common access patterns identified in the application.

## Critical Indexes to Add

### 1. Event Queries
```sql
-- Event lookup by slug (very common)
CREATE INDEX idx_events_slug ON events(slug);

-- Parent/child event queries
CREATE INDEX idx_events_parent_published ON events(parent_event_id, is_published);

-- Featured events query
CREATE INDEX idx_events_featured_published ON events(featured, is_published, event_start);

-- Event date filtering
CREATE INDEX idx_events_date_range ON events(event_start, event_end);
```

### 2. Ticket Queries
```sql
-- Ticket availability by event
CREATE INDEX idx_event_tickets_event_active ON event_tickets(event_id, is_active, status);

-- Ticket lookup by registration
CREATE INDEX idx_tickets_registration_status ON tickets(registration_id, status);

-- Ticket type lookup
CREATE INDEX idx_tickets_type_event ON tickets(ticket_type_id, event_id);

-- Reservation expiry checks
CREATE INDEX idx_tickets_reservation_expiry ON tickets(reservation_expires_at) 
WHERE status = 'reserved';
```

### 3. Registration Queries
```sql
-- Registration lookups
CREATE INDEX idx_registrations_contact_event ON registrations(contact_id, event_id);

-- Payment status filtering
CREATE INDEX idx_registrations_payment_status ON registrations(payment_status, created_at);

-- Registration type filtering
CREATE INDEX idx_registrations_type_status ON registrations(registration_type, status);
```

### 4. Attendee Queries
```sql
-- Attendee by registration (very common)
CREATE INDEX idx_attendees_registration ON attendees(registration_id);

-- Primary attendee lookup
CREATE INDEX idx_attendees_registration_primary ON attendees(registration_id, is_primary);

-- Partner relationships
CREATE INDEX idx_attendees_related ON attendees(related_attendee_id);
```

### 5. Reference Data Queries
```sql
-- Lodge lookup by grand lodge
CREATE INDEX idx_lodges_grand_lodge ON lodges(grand_lodge_id);

-- Contact lookup by auth user
CREATE INDEX idx_contacts_auth_user ON contacts(auth_user_id);

-- Membership queries
CREATE INDEX idx_memberships_contact_active ON memberships(contact_id, is_active);
```

## Composite Indexes for Views

### 1. Event Display View
```sql
-- Support event display view joins
CREATE INDEX idx_events_location_org ON events(event_id, location_id, organiser_id);
```

### 2. Registration Summary View  
```sql
-- Support registration summary joins
CREATE INDEX idx_tickets_registration_paid ON tickets(registration_id) 
WHERE status = 'sold';
```

## Monitoring & Maintenance

### 1. Query Analysis
- [ ] Enable pg_stat_statements
- [ ] Identify slow queries
- [ ] Analyze query plans
- [ ] Track index usage

### 2. Index Maintenance
- [ ] Schedule regular ANALYZE
- [ ] Monitor index bloat
- [ ] Rebuild fragmented indexes
- [ ] Remove unused indexes

### 3. Performance Testing
- [ ] Benchmark before/after indexes
- [ ] Test with realistic data volume
- [ ] Verify query plan improvements
- [ ] Monitor overall performance

## Implementation Steps

1. [ ] Create index migration file
2. [ ] Test indexes on development
3. [ ] Apply indexes during low traffic
4. [ ] Monitor performance impact
5. [ ] Adjust based on results

## Additional Optimizations

### 1. Partial Indexes
- [ ] Active records only
- [ ] Recent data optimization
- [ ] Status-specific indexes

### 2. Expression Indexes
- [ ] Lower case email lookups
- [ ] Date extraction indexes
- [ ] JSON field indexes

### 3. Statistics Targets
- [ ] Increase for large tables
- [ ] Optimize for skewed data
- [ ] Update after bulk operations

## Success Metrics
- [ ] Query response < 100ms
- [ ] No sequential scans on large tables
- [ ] Index hit rate > 95%
- [ ] Reduced database CPU usage