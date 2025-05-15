# LodgeTix Supabase Database Documentation

This documentation provides a comprehensive overview of the LodgeTix Supabase database project (ID: `pwwpcjbbxotmiqrisjvf`). It covers the database schema, tables, relationships, enums, views, functions, and security policies.

## Table of Contents

1. [Database Schema Overview](#database-schema-overview)
2. [Documentation Files](#documentation-files)
3. [Key Concepts](#key-concepts)
4. [Entity Relationships](#entity-relationships)
5. [Usage Examples](#usage-examples)
6. [Development Notes](#development-notes)

## Database Schema Overview

The LodgeTix database is designed to support a Masonic event ticketing and registration system with these primary components:

- **Event Management**: Tables for events, locations, tickets, and packages
- **Registration System**: Tables for registrations, attendees, and ticket assignments
- **Masonic Data**: Tables for grand lodges, lodges, and Masonic profiles
- **Organization Structure**: Tables for organizations and memberships
- **User Management**: Tables for people, customers, and authentication
- **Value-Added Services**: Tables for additional event services
- **Fees and Pricing**: Tables for fee types and price tiers

## Documentation Files

This directory contains the following documentation files:

- [**tables.md**](./tables.md) - Detailed documentation of all tables, their columns, and relationships
- [**enums.md**](./enums.md) - Documentation of all enumerated types used in the database
- [**views.md**](./views.md) - Documentation of database views and their purposes
- [**functions.md**](./functions.md) - Documentation of database functions and their operations
- [**rls-policies.md**](./rls-policies.md) - Documentation of Row Level Security policies
- [**schema-comparison.md**](./schema-comparison.md) - Comparison between existing and proposed schema

## Key Concepts

### Event Management

The system is built around the concept of Events, with support for:
- Individual event tickets
- Package events (multiple events bundled together)
- Tiered pricing structures
- Event capacity management
- Masonic-specific event details

### Registration Flow

The registration process follows these stages:
1. Ticket selection
2. Attendee information collection
3. Optional value-added services selection
4. Billing details collection
5. Payment processing
6. Confirmation

### Attendee Types

The system supports different types of attendees:
- Masons (with Masonic-specific information)
- Guests
- Partners (both Lady Partners for Masons and Guest Partners)

### Ticket Reservation System

The database implements a ticket reservation system that:
- Temporarily holds tickets during the checkout process
- Automatically releases expired reservations
- Tracks ticket availability in real-time
- Prevents overbooking

## Entity Relationships

Key entity relationships in the database:

- **Events → Tickets**: Events have many ticket definitions
- **Registrations → Attendees**: Registrations have multiple attendees
- **Attendees → Tickets**: Attendees have tickets assigned to them
- **Events → Packages**: Events can be grouped into packages
- **People → MasonicProfiles**: People can have associated Masonic information
- **Grand Lodges → Lodges**: Hierarchical relationship between Masonic bodies
- **Organizations → Events**: Organizations host events

For a visual representation of the relationships, see the Entity Relationship Diagram in the [tables.md](./tables.md) file.

## Usage Examples

### Basic Queries

**Get all registrations for an event:**
```sql
SELECT r.*, c.firstName || ' ' || c.lastName as customerName
FROM "Registrations" r
JOIN "Customers" c ON r.customerId = c.id
WHERE r.eventId = '00000000-0000-0000-0000-000000000000';
```

**Get all attendees for a registration:**
```sql
SELECT a.*, p.first_name || ' ' || p.last_name as attendeeName
FROM "Attendees" a
LEFT JOIN people p ON a.person_id = p.person_id
WHERE a.registrationid = '00000000-0000-0000-0000-000000000000';
```

**Get all ticket assignments for an attendee:**
```sql
SELECT ata.*, td.name as ticketName, td.price as ticketPrice
FROM attendee_ticket_assignments ata
JOIN ticket_definitions td ON ata.ticket_definition_id = td.id
WHERE ata.attendee_id = '00000000-0000-0000-0000-000000000000';
```

### Using Database Functions

**Reserve tickets:**
```sql
SELECT * FROM reserve_tickets(
  '00000000-0000-0000-0000-000000000000', -- Event ID
  '00000000-0000-0000-0000-000000000000', -- Ticket definition ID
  2, -- Quantity
  30  -- Reserve for 30 minutes
);
```

**Complete a reservation:**
```sql
SELECT * FROM complete_reservation(
  '00000000-0000-0000-0000-000000000000', -- Reservation ID
  '00000000-0000-0000-0000-000000000000'  -- Attendee ID
);
```

**Check ticket availability:**
```sql
SELECT * FROM get_ticket_availability(
  '00000000-0000-0000-0000-000000000000', -- Event ID
  '00000000-0000-0000-0000-000000000000'  -- Ticket definition ID
);
```

## Development Notes

### General Guidelines

1. **UUID Usage**: All primary keys are UUIDs generated using `uuid_generate_v4()`
2. **Timestamps**: Most tables include `created_at` and `updated_at` fields
3. **Soft Deletes**: The system generally does not use hard deletes
4. **Naming Conventions**: There is a mix of PascalCase and snake_case table names
5. **SQL Functions**: Complex business logic is implemented in SQL functions

### Security Considerations

1. **Row Level Security**: Tables have RLS policies to control access
2. **Authentication**: Built on Supabase Auth
3. **Data Integrity**: Foreign key constraints enforce relationships

### Performance Optimization

1. **Indexes**: Key columns have indexes for query performance
2. **Views**: Views like `registration_summary` optimize common queries
3. **Functions**: Time-sensitive operations like reservations are handled with optimized functions

### Future Development

1. **Schema Standardization**: Work towards consistent naming conventions
2. **Additional Analytics**: Implement more robust event analytics
3. **Check-in System**: Develop a complete check-in system for events
4. **Payment Integration**: Enhance the payment tracking system

---

This documentation is maintained as part of the LodgeTix-UGLNSW-v2 project. For questions or issues, please contact the development team.