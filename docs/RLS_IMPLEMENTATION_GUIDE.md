# Row Level Security (RLS) Implementation Guide

## Overview

This guide documents the RLS policies implemented for the LodgeTix database to secure multi-tenant access and protect user data.

## Database Roles

### 1. **postgres** (Service Role)
- Bypasses all RLS policies
- Used by backend services and admin operations
- Has full access to all data

### 2. **anon** (Anonymous Users)
- Public access without authentication
- Can view published events and public information
- Can create registrations and contacts for guest checkout

### 3. **authenticated** (Logged-in Users)
- Varies based on user relationships and roles
- Can manage their own data
- Additional permissions based on organization membership

## Key Security Principles

1. **Least Privilege**: Users only access what they own or are authorized for
2. **Guest Checkout Support**: Anonymous users can create registrations without accounts
3. **Organization-based Access**: Members can access their organization's data
4. **Event Privacy**: Only published events are publicly visible
5. **Payment Protection**: Users can only modify pending payments

## Table-by-Table Policies

### Core Tables

#### events
- **Public Access**: View published events only
- **Organizers**: Full CRUD on their organization's events
- **Delete Protection**: Can only delete unpublished events

#### registrations
- **Owner Access**: Users can view/update their own registrations
- **Payment Lock**: Updates only allowed for pending payments
- **Guest Checkout**: Anonymous users can create registrations
- **Organizer View**: Event organizers can view all registrations for their events

#### tickets
- **Read-Only**: Users can only view tickets (no direct modifications)
- **Owner Access**: View tickets for own registrations
- **Organizer Access**: View all tickets for their events

#### attendees
- **Full CRUD**: Users can manage attendees for their registrations
- **Payment Lock**: Modifications only for pending payments

#### contacts
- **Self-Management**: Users manage their own contact info
- **Guest Support**: Anonymous users can create contacts

### Organization Tables

#### organisations, lodges, grand_lodges
- **Public Read**: Everyone can view organizations
- **Member Updates**: Organization members can update their org

### Supporting Tables

#### event_tickets, packages
- **Public View**: Visible for published events
- **Organizer Management**: Full CRUD for event organizers

#### locations
- **Public Read**: Everyone can view locations
- **Creator Updates**: Location creators can update

## Helper Functions

The implementation includes helper functions to improve performance:

```sql
auth.is_event_organizer(event_uuid)  -- Check if user organizes an event
auth.owns_registration(reg_uuid)      -- Check if user owns a registration
auth.get_user_contact_id()           -- Get user's contact ID
auth.get_user_organisation_ids()     -- Get user's organization IDs
auth.is_registration_editable(reg_uuid) -- Check if registration can be edited
```

## Implementation Steps

### 1. Enable RLS
```sql
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
```

### 2. Apply Migration Files
Run in order:
1. `20250531_rls_helper_functions.sql` - Create helper functions and indexes
2. `20250531_enable_rls_policies.sql` - Enable RLS and create all policies

### 3. Test Implementation
Use `20250531_rls_test_scenarios.sql` to verify policies work correctly

### 4. Monitor Performance
- Check query performance with RLS enabled
- Use indexes created by helper functions migration
- Monitor slow queries and adjust policies as needed

## Common Scenarios

### Guest Checkout Flow
1. Anonymous user creates contact (allowed)
2. Creates registration linked to contact (allowed)
3. Views event details and tickets (allowed for published events)
4. Cannot view other users' data (blocked)

### Authenticated User Flow
1. User signs up/logs in
2. Creates or links contact record
3. Can view/manage own registrations
4. Can update pending registrations
5. Cannot modify completed payments

### Event Organizer Flow
1. Organizer logs in
2. Can create/edit events for their organization
3. Can view all registrations for their events
4. Can manage ticket types and packages
5. Cannot access other organizations' data

## Troubleshooting

### User Can't See Their Data
1. Check if contact record exists with correct auth_user_id
2. Verify registration is linked to correct contact_id
3. Use helper functions to debug: `SELECT auth.get_user_contact_id();`

### Policy Not Working
1. Verify RLS is enabled: `SELECT rowsecurity FROM pg_tables WHERE tablename = 'table_name';`
2. Check policy exists: `SELECT * FROM pg_policies WHERE tablename = 'table_name';`
3. Test with service role to confirm data exists

### Performance Issues
1. Check if indexes exist on foreign key columns
2. Use EXPLAIN ANALYZE to identify slow queries
3. Consider simplifying complex policy conditions

## Security Considerations

1. **Service Role Keys**: Never expose service role keys to client-side code
2. **Policy Bypass**: Only use service role for admin operations
3. **Audit Trail**: Consider adding audit logging for sensitive operations
4. **Regular Reviews**: Periodically review policies for security gaps

## Future Enhancements

1. **Role-based Policies**: Add specific policies for admin/moderator roles
2. **Audit Logging**: Track policy violations and access attempts
3. **Performance Optimization**: Add materialized views for complex permission checks
4. **Fine-grained Control**: Add column-level security for sensitive data