# Event Packages Enhancement Documentation

## Overview

The `eventpackages` table has been enhanced to support comprehensive pricing, discounts, and automatic package type detection.

## New Features

### 1. Pricing Structure
- **original_price**: Automatically calculated sum of all included ticket prices
- **discount_percentage**: Percentage discount (0-100)
- **discount_amount**: Automatically calculated discount amount
- **price**: Final price after discount (total_price)

### 2. Package Types
Automatically determined based on package contents:
- **multi_buy**: Package includes tickets to multiple different events
- **bulk_buy**: Package includes multiple tickets of the same type (2+ quantity)

### 3. Quantity Tracking
- **quantity**: Total number of tickets included in the package

### 4. Better Ticket Association
- New `package_ticket_includes` table for managing ticket-package relationships
- Support for different quantities of each ticket type

## Usage Examples

### Creating a Multi-Buy Package (Multiple Events)
```sql
-- Create a package for Grand Installation ceremonies (multiple events)
SELECT create_package_with_tickets(
  'Grand Installation Full Package',
  'Access to all Grand Installation ceremonies',
  '307c2d85-72d5-48cf-ac94-082ca2a5d23d', -- parent event ID
  ARRAY['Ceremony Access', 'Gala Dinner', 'Welcome Reception'],
  '[
    {"ticket_definition_id": "ticket-id-1", "quantity": 1},
    {"ticket_definition_id": "ticket-id-2", "quantity": 1},
    {"ticket_definition_id": "ticket-id-3", "quantity": 1}
  ]'::jsonb,
  10.0, -- 10% discount
  NULL  -- Let it calculate the price automatically
);
```

### Creating a Bulk-Buy Package (Multiple Same Tickets)
```sql
-- Create a table package (10 seats at gala dinner)
SELECT create_package_with_tickets(
  'Gala Dinner Table (10 seats)',
  'Reserve a full table at the Gala Dinner',
  'event-id-here',
  ARRAY['10 Gala Dinner tickets'],
  '[
    {"ticket_definition_id": "gala-dinner-ticket-id", "quantity": 10}
  ]'::jsonb,
  15.0, -- 15% discount for bulk purchase
  NULL
);
```

### Updating Package Discount
```sql
-- Change discount on existing package
SELECT set_package_discount('package-id-here', 20.0); -- Set to 20% discount
```

### Querying Package Details
```sql
-- Get full package information with calculated prices
SELECT * FROM package_details WHERE parent_event_id = 'your-event-id';

-- Example output:
-- id: uuid
-- name: "Grand Installation Full Package"
-- original_price: 450.00 (sum of all tickets)
-- discount_percentage: 10.00
-- discount_amount: 45.00
-- total_price: 405.00
-- package_type: "multi_buy"
-- quantity: 3
-- included_tickets: [{"ticket_name": "Ceremony", "ticket_price": 150, ...}]
```

## Integration with Application Code

### TypeScript Interface Updates
```typescript
interface EventPackage {
  id: string;
  name: string;
  description: string | null;
  includes_description: string[] | null;
  price: number; // This is now the final price after discount
  original_price: number;
  discount_percentage: number;
  discount_amount: number;
  package_type: 'multi_buy' | 'bulk_buy' | null;
  quantity: number;
  parent_event_id: string | null;
  created_at: string;
}

interface PackageTicketInclude {
  ticket_definition_id: string;
  ticket_name: string;
  ticket_price: number;
  quantity: number;
  event_id: string;
  event_title: string;
}
```

### Using in Event Tickets Service
```typescript
// When fetching packages, you now get full pricing details
const packages = await supabase
  .from('package_details')
  .select('*')
  .eq('parent_event_id', eventId);

// Display savings to users
const savings = package.discount_amount;
const savingsPercentage = package.discount_percentage;
```

## Migration Notes

1. Existing packages will have their `original_price` calculated automatically
2. Package types will be determined based on their current ticket includes
3. If no custom price was set, the calculated original price becomes the default price
4. The `includes` JSONB column data is migrated to the new `package_ticket_includes` table

## Benefits

1. **Automatic Price Calculation**: No need to manually calculate package prices
2. **Flexible Discounting**: Easy to apply and modify discounts
3. **Clear Package Types**: Users can easily understand what type of deal they're getting
4. **Better Data Integrity**: Prices stay in sync with ticket price changes
5. **Enhanced Reporting**: Easy to analyze package performance and discount effectiveness