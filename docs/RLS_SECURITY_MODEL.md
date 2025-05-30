# LodgeTix RLS Security Model

## Overview

This document outlines the Row Level Security (RLS) implementation for LodgeTix, focusing on the principle of least privilege and secure multi-tenant access.

## Core Security Principles

1. **Least Privilege**: Users only get the minimum access required
2. **Explicit Deny by Default**: If not explicitly allowed, access is denied
3. **Role-Based Access**: Different roles have different permissions
4. **Data Isolation**: Users cannot access other users' private data

## Role Definitions

### 1. Anonymous Users (`anon`)
Unauthenticated visitors to the site.

**Can do:**
- ✅ View published events
- ✅ View public organizations, lodges, locations
- ✅ View ticket types and packages for published events
- ✅ Create registrations (guest checkout)
- ✅ Create contacts (guest checkout)

**Cannot do:**
- ❌ View unpublished events
- ❌ View other users' registrations or personal data
- ❌ Modify any existing data
- ❌ Delete anything
- ❌ Access attendee information
- ❌ Access user profiles

### 2. Authenticated Users (`authenticated`)
Logged-in users with an account.

**Basic permissions (all authenticated users):**
- ✅ Everything anonymous users can do
- ✅ View and manage their own contact information
- ✅ View and manage their own registrations
- ✅ View and manage their own attendees (for pending payments only)
- ✅ View their own tickets
- ✅ Create and manage their own masonic profile
- ✅ View their own memberships

**Additional permissions for Event Organizers:**
- ✅ Create, update, and delete (unpublished) events for their organization
- ✅ View all registrations for their events
- ✅ View all tickets for their events
- ✅ Manage ticket types and packages for their events

**Payment-based restrictions:**
- ✅ Can modify registrations and attendees when payment is `pending`
- ❌ Cannot modify after payment is `completed`

### 3. Service Role (`postgres`)
Backend services and admin operations.

**Can do:**
- ✅ Everything (bypasses all RLS)
- ✅ Used for system operations, migrations, admin tasks

## Table-by-Table Security

### Core Business Tables

| Table | Anonymous | Authenticated | Notes |
|-------|-----------|---------------|-------|
| **events** | SELECT (published only) | SELECT, INSERT*, UPDATE*, DELETE* | *Only organizers for their events |
| **registrations** | INSERT only | Full CRUD (own only) | Updates locked after payment |
| **tickets** | None | SELECT only | Created by system via RPC |
| **attendees** | None | Full CRUD (own only) | Locked after payment |
| **contacts** | INSERT only | Full CRUD (own only) | One per user |

### Organization Tables

| Table | Anonymous | Authenticated | Notes |
|-------|-----------|---------------|-------|
| **organisations** | SELECT | SELECT, UPDATE* | *Members only |
| **lodges** | SELECT | SELECT, UPDATE* | *Members only |
| **grand_lodges** | SELECT | SELECT | Read-only reference |
| **locations** | SELECT | SELECT, INSERT, UPDATE* | *Event organizers |

### Event Configuration Tables

| Table | Anonymous | Authenticated | Notes |
|-------|-----------|---------------|-------|
| **event_tickets** | SELECT (published) | SELECT, INSERT*, UPDATE*, DELETE* | *Organizers only |
| **packages** | SELECT (published) | SELECT, INSERT*, UPDATE* | *Organizers only |

### User-Specific Tables

| Table | Anonymous | Authenticated | Notes |
|-------|-----------|---------------|-------|
| **masonic_profiles** | None | Full CRUD (own only) | Private user data |
| **user_roles** | None | SELECT (own only) | Managed by admins |
| **memberships** | None | Full CRUD (own only) | Organization memberships |
| **attendee_events** | None | SELECT (own only) | Event participation |

## Common Scenarios

### 1. Guest Checkout Flow
```
Anonymous User:
1. Browse events (SELECT on events) ✅
2. View ticket options (SELECT on event_tickets) ✅
3. Create contact (INSERT on contacts) ✅
4. Create registration (INSERT on registrations) ✅
5. Cannot view others' data ✅
```

### 2. Registered User Flow
```
Authenticated User:
1. All anonymous permissions ✅
2. View own registrations (SELECT on registrations) ✅
3. Update pending registration (UPDATE on registrations WHERE payment_status = 'pending') ✅
4. Add/edit attendees (CRUD on attendees WHERE payment is pending) ✅
5. View own tickets (SELECT on tickets) ✅
6. Cannot modify after payment ✅
```

### 3. Event Organizer Flow
```
Organizer (authenticated + organizer role):
1. Create new event (INSERT on events) ✅
2. Update own events (UPDATE on events) ✅
3. Delete unpublished events (DELETE on events WHERE is_published = false) ✅
4. View all registrations for own events ✅
5. Manage ticket types and packages ✅
6. Cannot access other orgs' data ✅
```

## Security Best Practices

1. **Never expose service role keys** to client-side code
2. **Use RLS for all tables** containing user data
3. **Test policies thoroughly** before production
4. **Monitor failed access attempts** for security breaches
5. **Regular security audits** of RLS policies

## Testing RLS Policies

### Test as Anonymous User
```sql
SET ROLE anon;
SELECT * FROM events; -- Should only see published
INSERT INTO events (...); -- Should fail
UPDATE registrations SET ...; -- Should fail
```

### Test as Authenticated User
```sql
SET ROLE authenticated;
SET request.jwt.claims ->> 'sub' = 'user-uuid-here';
SELECT * FROM registrations; -- Should only see own
UPDATE contacts SET ... WHERE auth_user_id = 'user-uuid-here'; -- Should work
```

### Test as Service Role
```sql
SET ROLE postgres;
-- Can do anything
```

## Migration Notes

When applying these policies:
1. First apply `20250531_rls_helper_functions.sql` (helper functions)
2. Then apply `20250531_enable_rls_policies_v2.sql` (secure policies)
3. Test thoroughly in staging before production
4. Monitor for any access issues after deployment