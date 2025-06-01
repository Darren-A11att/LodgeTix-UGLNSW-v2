# TODO: Create Database Views for Complex Queries

## Overview
Create PostgreSQL views to simplify data access and reduce the number of API calls needed for common operations.

## Views to Create

### 1. event_display_view
**Purpose**: Combine event data with calculated fields for display
- [ ] Join events with locations for simple location string
- [ ] Join with organisations for organizer info
- [ ] Calculate min_price from event_tickets
- [ ] Calculate is_sold_out from ticket availability
- [ ] Aggregate total_capacity, sold_count, available_count
- [ ] Include parent event info for child events

### 2. registration_detail_view
**Purpose**: Complete registration information for management screens
- [ ] Join registrations with contacts for customer info
- [ ] Join with events for event details
- [ ] Count attendees per registration
- [ ] Sum tickets and amounts paid
- [ ] Include registration type and status

### 3. ticket_availability_view
**Purpose**: Real-time ticket availability per event
- [ ] Group tickets by event and type
- [ ] Show current availability counts
- [ ] Include eligibility criteria
- [ ] Calculate percentage sold

### 4. attendee_complete_view
**Purpose**: Full attendee information including masonic details
- [ ] Join attendees with contacts
- [ ] Join with masonic_profiles
- [ ] Include lodge and grand lodge information
- [ ] Show partner relationships

### 5. event_hierarchy_view
**Purpose**: Parent-child event relationships
- [ ] Self-join events table
- [ ] Include child event counts
- [ ] Aggregate capacity across children
- [ ] Show package availability

## Implementation Steps
1. [ ] Create SQL migration files in `/supabase/migrations/`
2. [ ] Test views with sample queries
3. [ ] Add indexes for view performance
4. [ ] Update TypeScript types for view results
5. [ ] Create Supabase client queries using views

## Performance Considerations
- [ ] Add indexes on join columns
- [ ] Consider materialized views for slow queries
- [ ] Monitor view query performance
- [ ] Add view refresh triggers if needed