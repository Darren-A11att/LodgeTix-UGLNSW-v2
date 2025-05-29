# Ticket Selection Improvements

## Summary of Changes

### 1. Removed Hardcoded Event IDs
- **Issue**: The ticket selection step had a hardcoded Grand Proclamation parent event ID as a fallback
- **Fix**: Removed the hardcoded ID and now throw an error if eventId is not provided from the route
- **Impact**: Ensures the system always uses the correct event ID from the URL route

### 2. Database Table Consolidation
- **Issue**: Two overlapping tables (`eventtickets` and `ticket_definitions`) with duplicate fields and unclear relationships
- **Fix**: Created migration `20250529_consolidate_ticket_tables.sql` that:
  - Adds capacity tracking fields to `ticket_definitions` table
  - Migrates any existing data from `eventtickets` 
  - Provides proper inventory management functions
  - Creates a single source of truth for ticket information

### 3. Enhanced Ticket Availability Tracking
- **New Fields in `ticket_definitions`**:
  - `total_capacity` - Maximum tickets that can be sold (NULL = unlimited)
  - `available_count` - Currently available tickets (NULL = unlimited)
  - `reserved_count` - Tickets in carts but not purchased
  - `sold_count` - Tickets sold and paid for
  - `status` - Active/Inactive status
  - `updated_at` - Last modification timestamp

- **Helper Functions**:
  ```sql
  check_ticket_availability(ticket_id, quantity) -- Check if tickets available
  reserve_tickets(ticket_id, quantity) -- Move from available to reserved
  confirm_ticket_purchase(ticket_id, quantity) -- Move from reserved to sold
  release_reserved_tickets(ticket_id, quantity) -- Return reserved to available
  ```

### 4. Use Database Pricing for Packages
- **Issue**: Package prices were being calculated with a hardcoded 10% discount
- **Fix**: Updated `EventTicketsService` to:
  - Fetch actual price fields from the `eventpackages` table
  - Use the database `price` field instead of calculating
  - Include all pricing fields (original_price, discount_percentage, discount_amount, etc.)
  - Only fallback to calculated price if database price is not set

### 5. Display Ticket Availability in UI
- **Issue**: Users couldn't see if tickets were available before trying to select them
- **Fix**: Added availability display to all ticket tables showing:
  - "Inactive" for tickets with status != 'Active'
  - "Unlimited" for tickets with null availability
  - "Sold Out" for tickets with 0 availability
  - "X left" for limited availability tickets
  - Disabled checkbox selection for inactive or sold out tickets
  - Visual indicators (red text) for sold out tickets

### 6. Error Handling Improvements
- **Issue**: Missing eventId would silently fallback to a hardcoded value
- **Fix**: Now throws an explicit error if eventId is missing, ensuring issues are caught early

## Database Schema Updates

The consolidated `ticket_definitions` table now includes:
```sql
-- Existing fields
id, name, price, description, event_id, 
eligibility_attendee_types, eligibility_mason_rank, 
is_active, created_at

-- New capacity fields
total_capacity INTEGER      -- Total sellable tickets (NULL = unlimited)
available_count INTEGER     -- Currently available (NULL = unlimited)  
reserved_count INTEGER      -- In carts but not purchased
sold_count INTEGER          -- Sold and paid for
status VARCHAR(50)          -- Active/Inactive/Sold Out
updated_at TIMESTAMP        -- Last modification time
```

## Migration Strategy

1. **Run the consolidation migration** to update the schema
2. **Verify data migration** from `eventtickets` if it had any data
3. **Test the new functions** with sample transactions
4. **After verification**, drop the `eventtickets` table using:
   ```sql
   DROP TABLE IF EXISTS public.eventtickets;
   ```

## Next Steps

1. **Update registration completion** to use `confirm_ticket_purchase()` function
2. **Implement cart timeout** to release reserved tickets after X minutes
3. **Add reservation logic** during ticket selection to prevent overselling
4. **Create admin UI** to manage ticket capacity and status

## Benefits of Consolidation

- **Single source of truth** - No confusion about which table to use
- **Better inventory tracking** - Reserved vs available vs sold counts
- **Simpler queries** - No joins needed between ticket tables
- **Consistent data model** - App already uses ticket_definitions
- **Proper capacity management** - Prevents overselling with reservation system

## Notes

- The system now always uses live data from the database
- No offline support is implemented (as requested)
- Package pricing comes directly from the database with the enhanced pricing structure
- Availability is checked in real-time when the component loads
- The `eventtickets` table can be dropped after verifying the migration