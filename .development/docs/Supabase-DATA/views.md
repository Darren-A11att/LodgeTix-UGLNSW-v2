# Supabase Database Views Documentation

This document provides information about all database views defined in the LodgeTix-UGLNSW-v2 Supabase database. Database views are virtual tables based on the result-set of a SQL statement, providing a powerful way to create reusable query logic and simplify complex data access patterns.

## Views Overview

The database currently contains the following views:

1. **registration_summary** - Provides a consolidated view of registration data with customer and event information

## Detailed View Documentation

### registration_summary

This view combines registration data with customer and event information to provide a consolidated summary of registrations.

**View Name:** `registration_summary`

#### Columns

| Column | Type | Description |
|--------|------|-------------|
| registrationId | uuid | Primary registration identifier |
| customerId | uuid | Customer who made the registration |
| customer_name | string | Full name of the customer |
| eventId | uuid | Event being registered for |
| event_title | string | Title of the event |
| registrationDate | timestamp | Date of registration |
| status | string | Registration status |
| paymentStatus | string | Status of payment |
| totalAmountPaid | number | Total amount paid |
| totalPricePaid | number | Total price of registration |
| primaryAttendeeId | uuid | Primary attendee ID |
| registrationType | string | Type of registration |
| createdAt | timestamp | Record creation timestamp |
| updatedAt | timestamp | Record update timestamp |

#### Source Tables

This view joins the following tables:
- `Registrations` - Base registration data
- `Customers` - Customer information
- `Events` - Event information

#### Definition

While the exact SQL definition is not visible in the provided schema, the view likely follows this pattern:

```sql
CREATE OR REPLACE VIEW registration_summary AS
SELECT 
    r.registrationId,
    r.customerId,
    CONCAT(c.firstName, ' ', c.lastName) AS customer_name,
    r.eventId,
    e.title AS event_title,
    r.registrationDate,
    r.status,
    r.paymentStatus,
    r.totalAmountPaid,
    r.totalPricePaid,
    r.primaryAttendeeId,
    r.registrationType,
    r.createdAt,
    r.updatedAt
FROM 
    "Registrations" r
LEFT JOIN 
    "Customers" c ON r.customerId = c.id
LEFT JOIN 
    "Events" e ON r.eventId = e.id;
```

#### Relationships

The view maintains the following relationships from the original tables:

1. `registration_summary.registrationId` → `Registrations.registrationId`
2. `registration_summary.customerId` → `Customers.id`
3. `registration_summary.eventId` → `Events.id`

These are preserved as foreign key relationships in the view:
- `registration_summary.eventId` references `Events.id`
- `registration_summary.customerId` references `Customers.id`

#### Purpose and Usage

This view serves several important purposes:

1. **Simplified Data Access** - Consolidates data from multiple tables, reducing the need for complex joins in application code
2. **Standardized Reporting** - Provides a consistent base for registration reports and dashboards
3. **Reduced Query Complexity** - Simplifies queries that need registration data with context
4. **Performance Optimization** - May improve performance for frequently executed complex queries

#### Example Queries

```sql
-- Get all registrations for a specific event with customer names
SELECT 
    registrationId,
    customer_name,
    paymentStatus,
    totalAmountPaid,
    registrationDate
FROM
    registration_summary
WHERE
    eventId = '00000000-0000-0000-0000-000000000000'
ORDER BY
    registrationDate DESC;

-- Get registration counts by status for each event
SELECT 
    event_title,
    status,
    COUNT(*) as registration_count
FROM
    registration_summary
GROUP BY
    event_title, status
ORDER BY
    event_title;

-- Find total revenue by event
SELECT 
    event_title,
    SUM(totalAmountPaid) as total_revenue,
    COUNT(*) as registration_count
FROM
    registration_summary
WHERE
    paymentStatus = 'completed'
GROUP BY
    event_title
ORDER BY
    total_revenue DESC;
```

## Benefits of Using Views

Database views provide several advantages in the application architecture:

1. **Abstraction** - Views hide the complexity of underlying table structures
2. **Security** - Views can restrict access to sensitive columns
3. **Consistency** - Views ensure consistent data retrieval logic
4. **Maintainability** - Views centralize complex query logic
5. **Compatibility** - Views can preserve backward compatibility when the underlying schema changes

## Recommended Practices for Views

When working with the existing views or creating new ones, consider these best practices:

1. **Documentation** - Always document the purpose and structure of views
2. **Performance** - Monitor view performance, especially for views with complex joins
3. **Maintenance** - Update views when underlying table structures change
4. **Indexes** - Ensure appropriate indexes exist on columns used in joining or filtering
5. **Simplicity** - Keep view definitions as simple as possible while meeting requirements

## References

- [PostgreSQL Views Documentation](https://www.postgresql.org/docs/current/tutorial-views.html)
- [Supabase Documentation](https://supabase.com/docs)