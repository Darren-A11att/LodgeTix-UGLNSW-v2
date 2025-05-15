# Supabase Database Functions Documentation

This document details all database functions defined in the LodgeTix-UGLNSW-v2 Supabase database. Database functions provide server-side logic for complex operations, ensuring consistency and performance for critical business processes.

## Functions Overview

The database contains the following categories of functions:

### Ticket Reservation System
- `reserve_tickets` - Reserves tickets for an event
- `reserve_tickets_simple` - Simplified version of ticket reservation
- `reserve_tickets_v2` - Updated version of ticket reservation
- `reserve_tickets_v3` - Latest version of ticket reservation
- `test_reserve_tickets` - Testing function for ticket reservation
- `complete_reservation` - Completes a ticket reservation
- `complete_reservation_simple` - Simplified version of reservation completion
- `cancel_reservation` - Cancels a ticket reservation
- `cancel_reservation_simple` - Simplified version of reservation cancellation
- `clear_expired_reservations` - Clears expired ticket reservations
- `schedule_reservation_cleanup` - Schedules cleanup of expired reservations

### Ticket Availability
- `get_ticket_availability` - Gets current ticket availability for an event
- `is_ticket_high_demand` - Checks if a ticket is in high demand

### Event Management
- `refresh_event_days` - Refreshes child events for multi-day events

### Utility Functions
- `hello_tickets` - Simple test function
- `to_camel_case` - Converts snake_case to camelCase
- `log_column_rename` - Logs column rename operations
- `log_table_rename` - Logs table rename operations

### Search Functions
- `search_grand_lodges` - Searches for grand lodges
- `search_lodges` - Searches for lodges

## Detailed Function Documentation

### Ticket Reservation Functions

#### reserve_tickets

Creates ticket reservations for a specified event.

**Function Name:** `reserve_tickets`  
**Returns:** Table of ticket reservations with IDs and expiration timestamps

**Arguments:**
| Argument | Type | Description |
|----------|------|-------------|
| p_event_id | uuid | Event ID |
| p_ticket_definition_id | uuid | Ticket definition ID |
| p_quantity | int | Number of tickets to reserve |
| p_reservation_minutes | int | Optional: Minutes to hold the reservation (default varies) |

**Return Columns:**
| Column | Type | Description |
|--------|------|-------------|
| ticket_id | uuid | Ticket ID |
| reservation_id | uuid | Reservation ID |
| expires_at | timestamp | When the reservation expires |

**Description:**  
This function attempts to reserve a specified number of tickets for an event. It checks available ticket inventory, creates reservation records, and updates ticket availability counters. If successful, it returns a table of created ticket reservations with their expiration timestamps.

**Business Rules:**
- Checks if sufficient tickets are available
- Creates time-limited reservations
- Updates available and reserved counts
- Generates unique reservation IDs
- Sets expiration timestamp

**Example Usage:**
```sql
SELECT * FROM reserve_tickets(
  '00000000-0000-0000-0000-000000000000', -- Event ID
  '00000000-0000-0000-0000-000000000000', -- Ticket definition ID
  2, -- Quantity
  30  -- Reserve for 30 minutes
);
```

#### reserve_tickets_simple

A simplified version of the ticket reservation function.

**Function Name:** `reserve_tickets_simple`  
**Returns:** Table of ticket reservations with IDs and expiration timestamps

**Arguments:**
| Argument | Type | Description |
|----------|------|-------------|
| p_event_id | uuid | Event ID |
| p_ticket_definition_id | uuid | Ticket definition ID |
| p_quantity | int | Number of tickets to reserve |
| p_reservation_minutes | int | Optional: Minutes to hold the reservation (default varies) |

**Return Columns:** Same as `reserve_tickets`

**Description:**  
This is a simplified version of the `reserve_tickets` function, possibly with fewer checks or constraints. It serves as an alternative implementation for ticket reservation.

#### reserve_tickets_v2 and reserve_tickets_v3

Updated versions of the ticket reservation function with potential improvements.

**Function Names:** `reserve_tickets_v2`, `reserve_tickets_v3`  
**Returns:** Table of ticket reservations with IDs and expiration timestamps

**Arguments:** Same as `reserve_tickets`

**Return Columns:** Same as `reserve_tickets`

**Description:**  
These functions represent newer versions of the ticket reservation logic, likely with enhancements, optimizations, or additional features compared to the original.

#### test_reserve_tickets

A testing function for ticket reservation.

**Function Name:** `test_reserve_tickets`  
**Returns:** Table of created ticket records

**Arguments:**
| Argument | Type | Description |
|----------|------|-------------|
| p_event_id | uuid | Event ID |
| p_ticket_definition_id | uuid | Ticket definition ID |
| p_quantity | int | Number of tickets to reserve |

**Return Columns:** Full ticket records from the Tickets table

**Description:**  
This function is used for testing ticket reservation logic. It creates test ticket reservations and returns the full ticket records for verification.

#### complete_reservation

Completes a ticket reservation by associating tickets with an attendee.

**Function Name:** `complete_reservation`  
**Returns:** Array of ticket IDs that were completed

**Arguments:**
| Argument | Type | Description |
|----------|------|-------------|
| p_reservation_id | uuid | Reservation ID |
| p_attendee_id | uuid | Attendee ID |

**Description:**  
This function converts reserved tickets to purchased tickets by associating them with an attendee. It updates the ticket status, clears the reservation, and updates ticket availability counters.

**Business Rules:**
- Verifies the reservation exists and hasn't expired
- Associates tickets with the specified attendee
- Updates ticket status from reserved to purchased
- Updates inventory counts (reserved, sold)
- Returns the IDs of completed tickets

**Example Usage:**
```sql
SELECT * FROM complete_reservation(
  '00000000-0000-0000-0000-000000000000', -- Reservation ID
  '00000000-0000-0000-0000-000000000000'  -- Attendee ID
);
```

#### complete_reservation_simple

A simplified version of the reservation completion function.

**Function Name:** `complete_reservation_simple`  
**Returns:** Array of ticket IDs that were completed

**Arguments:** Same as `complete_reservation`

**Description:**  
This is a simplified version of the `complete_reservation` function, possibly with fewer checks or simpler logic.

#### cancel_reservation

Cancels a ticket reservation and returns tickets to available inventory.

**Function Name:** `cancel_reservation`  
**Returns:** Number of tickets returned to inventory

**Arguments:**
| Argument | Type | Description |
|----------|------|-------------|
| p_reservation_id | uuid | Reservation ID |

**Description:**  
This function cancels an existing ticket reservation, updates the ticket status, and returns the tickets to available inventory. It returns the number of tickets that were returned to inventory.

**Business Rules:**
- Verifies the reservation exists
- Updates ticket status from reserved to available
- Updates inventory counts (reserved, available)
- Returns count of canceled tickets

**Example Usage:**
```sql
SELECT * FROM cancel_reservation('00000000-0000-0000-0000-000000000000');
```

#### cancel_reservation_simple

A simplified version of the reservation cancellation function.

**Function Name:** `cancel_reservation_simple`  
**Returns:** Boolean indicating success

**Arguments:** Same as `cancel_reservation`

**Description:**  
This is a simplified version of the `cancel_reservation` function, possibly with simpler logic and a boolean return value instead of a count.

#### clear_expired_reservations

Automatically clears expired ticket reservations.

**Function Name:** `clear_expired_reservations`  
**Returns:** Number of cleared reservations

**Arguments:** None

**Description:**  
This function identifies and cancels all expired ticket reservations across the system. It finds tickets with reservations that have passed their expiration timestamp, updates their status, and returns them to available inventory.

**Business Rules:**
- Identifies tickets with expired reservations
- Updates ticket status from reserved to available
- Updates inventory counts (reserved, available)
- Returns count of cleared reservations

**Example Usage:**
```sql
SELECT * FROM clear_expired_reservations();
```

#### schedule_reservation_cleanup

Schedules the regular execution of the expired reservation cleanup.

**Function Name:** `schedule_reservation_cleanup`  
**Returns:** void

**Arguments:** None

**Description:**  
This function likely sets up a scheduled job to regularly run the `clear_expired_reservations` function, ensuring that expired reservations are automatically cleaned up.

### Ticket Availability Functions

#### get_ticket_availability

Gets current ticket availability for a specific event and ticket type.

**Function Name:** `get_ticket_availability`  
**Returns:** JSON object with availability information

**Arguments:**
| Argument | Type | Description |
|----------|------|-------------|
| p_event_id | uuid | Event ID |
| p_ticket_definition_id | uuid | Ticket definition ID |

**Description:**  
This function retrieves current availability information for a specified ticket type at an event. It returns a JSON object containing data like total capacity, available tickets, reserved tickets, and sold tickets.

**Example Usage:**
```sql
SELECT * FROM get_ticket_availability(
  '00000000-0000-0000-0000-000000000000', -- Event ID
  '00000000-0000-0000-0000-000000000000'  -- Ticket definition ID
);
```

#### is_ticket_high_demand

Checks if a ticket type is in high demand based on availability percentage.

**Function Name:** `is_ticket_high_demand`  
**Returns:** Boolean

**Arguments:**
| Argument | Type | Description |
|----------|------|-------------|
| p_event_id | uuid | Event ID |
| p_ticket_definition_id | uuid | Ticket definition ID |
| p_threshold_percent | numeric | Optional: Threshold percentage to consider high demand |

**Description:**  
This function determines if a ticket type is in high demand by calculating the percentage of tickets that have been sold or reserved. If this percentage exceeds the threshold, it returns true.

**Example Usage:**
```sql
SELECT * FROM is_ticket_high_demand(
  '00000000-0000-0000-0000-000000000000', -- Event ID
  '00000000-0000-0000-0000-000000000000', -- Ticket definition ID
  80  -- Consider high demand if 80% or more tickets are sold/reserved
);
```

### Event Management Functions

#### refresh_event_days

Refreshes child events for multi-day events.

**Function Name:** `refresh_event_days`  
**Returns:** void

**Arguments:**
| Argument | Type | Description |
|----------|------|-------------|
| parent_id_uuid | uuid | Parent event ID |

**Description:**  
This function likely updates or regenerates the child events for a multi-day parent event. This could include synchronizing dates, updating information, or ensuring consistency between the parent and child events.

**Example Usage:**
```sql
SELECT * FROM refresh_event_days('00000000-0000-0000-0000-000000000000');
```

### Utility Functions

#### hello_tickets

A simple test function to verify database connectivity.

**Function Name:** `hello_tickets`  
**Returns:** String

**Arguments:**
| Argument | Type | Description |
|----------|------|-------------|
| name | string | Name to include in greeting |

**Description:**  
This is a simple test function that returns a greeting message. It's likely used for testing database connectivity and function execution.

**Example Usage:**
```sql
SELECT * FROM hello_tickets('World');
-- Might return: "Hello World from the Tickets system!"
```

#### to_camel_case

Converts snake_case string to camelCase.

**Function Name:** `to_camel_case`  
**Returns:** String

**Arguments:**
| Argument | Type | Description |
|----------|------|-------------|
| snake_str | string | Snake case string to convert |

**Description:**  
This utility function converts a string from snake_case (with underscores) to camelCase notation. It's useful for data transformation between database and application formats.

**Example Usage:**
```sql
SELECT to_camel_case('first_name'); -- Returns: "firstName"
```

#### log_column_rename

Logs column rename operations for audit purposes.

**Function Name:** `log_column_rename`  
**Returns:** void

**Arguments:**
| Argument | Type | Description |
|----------|------|-------------|
| table_name | string | Table being modified |
| old_column | string | Original column name |
| new_column | string | New column name |
| success | boolean | Optional: Whether rename was successful |

**Description:**  
This function logs column rename operations to an audit log or history table. It records the table being modified, the original column name, the new column name, and whether the operation was successful.

**Example Usage:**
```sql
SELECT * FROM log_column_rename(
  'Customers',
  'emailAddress',
  'email',
  true
);
```

#### log_table_rename

Logs table rename operations for audit purposes.

**Function Name:** `log_table_rename`  
**Returns:** void

**Arguments:**
| Argument | Type | Description |
|----------|------|-------------|
| old_name | string | Original table name |
| new_name | string | New table name |
| success | boolean | Optional: Whether rename was successful |

**Description:**  
This function logs table rename operations to an audit log or history table. It records the original table name, the new table name, and whether the operation was successful.

**Example Usage:**
```sql
SELECT * FROM log_table_rename(
  'CustomerProfiles',
  'Customers',
  true
);
```

### Search Functions

#### search_grand_lodges

Searches for grand lodges by name.

**Function Name:** `search_grand_lodges`  
**Returns:** Table of grand_lodges records

**Arguments:**
| Argument | Type | Description |
|----------|------|-------------|
| search_query | string | Search term |

**Description:**  
This function performs a case-insensitive search for grand lodges whose names contain the provided search term. It returns matching grand_lodges records ordered by name.

**Example Usage:**
```sql
SELECT * FROM search_grand_lodges('England');
```

#### search_lodges

Searches for lodges by name or number, optionally filtered by grand lodge.

**Function Name:** `search_lodges`  
**Returns:** Custom table with lodge and grand lodge information

**Arguments:**
| Argument | Type | Description |
|----------|------|-------------|
| search_query | string | Search term |
| grand_lodge_id_param | uuid | Optional: Filter by specific grand lodge |

**Return Columns:**
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Lodge ID |
| name | string | Lodge name |
| number | string | Lodge number |
| grand_lodge_id | uuid | Grand lodge ID |
| grand_lodge_name | string | Grand lodge name |
| created_at | timestamp | Creation timestamp |
| updated_at | timestamp | Update timestamp |

**Description:**  
This function performs a case-insensitive search for lodges whose names or numbers contain the provided search term. Results can be optionally filtered by a specific grand lodge. It returns lodge information along with the associated grand lodge name.

**Example Usage:**
```sql
-- Search all lodges containing "Friendship"
SELECT * FROM search_lodges('Friendship');

-- Search lodges containing "Friendship" in a specific grand lodge
SELECT * FROM search_lodges(
  'Friendship',
  '00000000-0000-0000-0000-000000000000' -- Grand lodge ID
);
```

## Best Practices for Using Database Functions

1. **Error Handling**: Always handle potential errors when calling database functions
2. **Transaction Management**: Use transactions for operations that call multiple functions
3. **Performance**: Be aware of function complexity and execution time
4. **Security**: Functions execute with the permissions of the caller, so ensure proper RLS policies
5. **Version Management**: When multiple versions of a function exist, understand the differences

## References

- [PostgreSQL Functions Documentation](https://www.postgresql.org/docs/current/sql-createfunction.html)
- [Supabase Documentation](https://supabase.com/docs)