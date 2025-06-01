# Database Configuration

## Overview
LodgeTix-UGLNSW-v2 uses Supabase as its database platform, which provides a PostgreSQL database with additional features including authentication, real-time subscriptions, and Row Level Security (RLS).

## Database Platform

### Supabase PostgreSQL
- **Version**: PostgreSQL 15
- **Platform**: Supabase (hosted PostgreSQL)
- **Connection Pooling**: Disabled by default (configurable)
- **Real-time**: Enabled
- **Storage**: Enabled with 50MB file size limit

### Key Features
1. **Row Level Security (RLS)**: Database-level access control
2. **Real-time Subscriptions**: Live data updates
3. **Built-in Authentication**: User management and sessions
4. **Storage**: File and media storage
5. **Edge Functions**: Serverless functions (Deno)

## Database Schema

### Core Tables

#### 1. **Events**
Central table for all event information:
```sql
- event_id (UUID, Primary Key)
- title (Text, Not Null)
- description (Text)
- slug (Text, Unique)
- event_start/event_end (Timestamptz)
- location_id (UUID, FK → locations)
- organiser_id (UUID, FK → organisations)
- parent_event_id (UUID, Self-referencing FK)
- max_attendees (BigInt)
- featured (Boolean)
- is_published (Boolean)
- reserved_count/sold_count (Integer)
```

#### 2. **Registrations**
Tracks all event registrations:
```sql
- registration_id (UUID, Primary Key)
- event_id (UUID, FK → events)
- contact_id (UUID, FK → contacts)
- registration_type (Text)
- status (Text)
- payment_status (Text)
- confirmation_number (Text)
- total_amount (Numeric)
- stripe_fee (Numeric)
- created_at/updated_at (Timestamptz)
```

#### 3. **Attendees**
Individual attendee information:
```sql
- attendee_id (UUID, Primary Key)
- registration_id (UUID, FK → registrations)
- attendee_type (Text)
- is_primary_contact (Boolean)
- first_name/last_name (Text)
- email (Text)
- phone_number (Text)
- mason_type (Text)
- lodge_name/lodge_number (Text)
- grand_lodge (Text)
- masonic_rank (Text)
```

#### 4. **Tickets**
Ticket assignments to attendees:
```sql
- ticket_id (UUID, Primary Key)
- attendee_id (UUID, FK → attendees)
- event_ticket_id (UUID, FK → event_tickets)
- ticket_number (Text)
- qr_code_url (Text)
- created_at (Timestamptz)
```

#### 5. **Event_Tickets**
Ticket types available for events:
```sql
- id (UUID, Primary Key)
- event_id (UUID, FK → events)
- name (Text)
- description (Text)
- price (Numeric)
- capacity (Integer)
- ticket_type (Text)
- stripe_product_id/stripe_price_id (Text)
```

#### 6. **Packages**
Event package definitions:
```sql
- id (UUID, Primary Key)
- name (Text)
- description (Text)
- price (Numeric)
- includes (UUID[])
- available_from/available_until (Timestamptz)
- stripe_product_id/stripe_price_id (Text)
```

#### 7. **Organisations**
Event organizers:
```sql
- organisation_id (UUID, Primary Key)
- name (Text)
- organisation_type (Text)
- stripe_onbehalfof (Text)
- stripe_customer_id (Text)
```

#### 8. **Lodges**
Masonic lodge information:
```sql
- lodge_id (UUID, Primary Key)
- lodge_name (Text)
- lodge_number (Text)
- grand_lodge_id (UUID, FK → grand_lodges)
- meeting_location (Text)
- is_active (Boolean)
```

#### 9. **Grand_Lodges**
Grand lodge jurisdictions:
```sql
- id (UUID, Primary Key)
- name (Text)
- abbreviation (Text)
- country (Text)
- is_active (Boolean)
```

### Supporting Tables
- **Customers**: Customer profiles linked to auth users
- **Contacts**: Contact information management
- **Locations**: Event venue information
- **Memberships**: Lodge membership records
- **Masonic_Profiles**: Mason-specific profile data
- **Registration_Payments**: Payment transaction records
- **User_Roles**: Role-based access control
- **Display_Scopes**: Event visibility controls
- **Eligibility_Criteria**: Registration eligibility rules

## Database Views

### 1. **Event_Display_View**
Aggregates event data with location and eligibility information

### 2. **Registration_Detail_View**
Comprehensive registration information with attendees and tickets

### 3. **Ticket_Availability_View**
Real-time ticket availability calculations

### 4. **Attendee_Complete_View**
Full attendee information with masonic details

### 5. **Event_Hierarchy_View**
Parent-child event relationships

### 6. **Auth_User_Customer_View**
Links Supabase auth users to customer profiles

## Remote Procedure Calls (RPCs)

### Core RPCs
1. **get_event_with_details**: Fetches complete event information
2. **create_registration_with_attendees**: Creates registration with attendees atomically
3. **reserve_tickets**: Reserves tickets with availability checking
4. **complete_payment**: Finalizes payment and updates status
5. **get_registration_summary**: Retrieves full registration details
6. **calculate_event_pricing**: Calculates pricing with discounts
7. **check_ticket_availability**: Real-time availability checking
8. **get_eligible_tickets**: Returns tickets based on user eligibility

## Row Level Security (RLS)

### RLS Implementation
All tables have RLS enabled with policies for:
- **Public Read**: Events, tickets, packages (published only)
- **Authenticated Write**: Registrations, attendees
- **Owner Access**: Users can access their own data
- **Admin Override**: Service role bypasses RLS

### Helper Functions
```sql
- is_admin(): Checks if user has admin role
- is_event_organiser(): Checks if user manages the event
- is_registration_owner(): Validates registration ownership
```

## Database Triggers

### 1. **Update Timestamps**
Automatically updates `updated_at` columns on row modifications

### 2. **Ticket Count Maintenance**
Updates `reserved_count` and `sold_count` on events when tickets are created/deleted

### 3. **Confirmation Number Generation**
Generates unique confirmation numbers for completed registrations

## Performance Optimization

### Indexes
```sql
- idx_events_capacity: For capacity queries
- idx_attendees_registration: For registration lookups
- idx_tickets_attendee: For attendee ticket queries
- idx_registrations_contact: For user registration queries
- idx_registrations_event_status: For event registration queries
```

### Query Optimization
- Materialized views for complex aggregations
- Partial indexes for filtered queries
- JSONB indexes for document fields

## Migration Management

### Migration Files
Located in `/supabase/migrations/`:
- Table creation scripts (e.g., `events.sql`, `registrations.sql`)
- View definitions (timestamped files)
- RPC functions (timestamped files)
- Index creation scripts
- RLS policy definitions

### Migration Naming Convention
- Base tables: `table_name.sql`
- Timestamped changes: `YYYYMMDDHHMMSS_description.sql`
- RPC functions: `*_create_rpc_*.sql`
- Views: `*_create_*_view.sql`

### Migration Process
1. Create SQL file in migrations folder
2. Test locally with Supabase CLI
3. Apply to staging environment
4. Apply to production via Supabase dashboard

## Local Development

### Supabase CLI Configuration
```toml
[db]
port = 54322
major_version = 15

[api]
port = 54321
schemas = ["public", "graphql_public"]

[studio]
port = 54323

[auth]
site_url = "http://127.0.0.1:3000"
jwt_expiry = 3600
enable_anonymous_sign_ins = false
```

### Local Database Access
```bash
# Start local Supabase
supabase start

# Access database
psql postgresql://postgres:postgres@localhost:54322/postgres

# Run migrations
supabase db push

# Generate types
supabase gen types typescript --local
```

## Security Configuration

### Authentication Settings
- JWT expiry: 1 hour
- Refresh token rotation: Enabled
- Anonymous sign-ins: Disabled (production)
- Minimum password length: 6 characters

### Rate Limiting
```toml
email_sent = 2/hour
sms_sent = 30/hour
anonymous_users = 30/hour
token_refresh = 150/5min
sign_in_sign_ups = 30/5min
```

## Backup and Recovery

### Backup Strategy
1. **Automated Backups**: Supabase Point-in-Time Recovery
2. **Manual Backups**: SQL dumps via Supabase dashboard
3. **Migration History**: Version controlled SQL files

### Recovery Procedures
1. Point-in-time recovery via Supabase dashboard
2. Manual restoration from SQL dumps
3. Re-run migrations from version control

## Monitoring

### Database Metrics
- Query performance via Supabase dashboard
- Connection pool usage
- Storage utilization
- Real-time subscription counts

### Alerts
- Slow query logging
- Failed authentication attempts
- Storage quota warnings
- Connection limit alerts

## Best Practices

### Development Guidelines
1. Always use UUID primary keys
2. Implement RLS policies for all tables
3. Create indexes for foreign keys
4. Use transactions for multi-table operations
5. Validate data at database level

### Performance Tips
1. Use database functions for complex queries
2. Implement pagination for large datasets
3. Cache frequently accessed data
4. Monitor and optimize slow queries
5. Use connection pooling in production

## Future Enhancements

1. **Read Replicas**: For scaling read operations
2. **Partitioning**: For large tables (registrations, tickets)
3. **Full-text Search**: PostgreSQL FTS for event search
4. **Time-series Data**: For analytics and reporting
5. **Graph Extensions**: For complex relationship queries