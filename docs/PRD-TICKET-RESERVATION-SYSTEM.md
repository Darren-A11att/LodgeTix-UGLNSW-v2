# PRD: 30-Minute Ticket Reservation System

## Overview
Implement a ticket reservation system that temporarily holds tickets for 30 minutes during the selection process, with background cleanup tasks to manage inventory and expiration.

## Requirements

### 1. Reservation Mechanism
- Reserve tickets for 30 minutes when selected
- Create tickets in `tickets` table with `status = 'reserved'`
- Set `reservation_expires_at` timestamp to 30 minutes from selection
- Convert to `status = 'confirmed'` on payment completion
- Release reservations on expiration

### 2. Inventory Management
Update `event_tickets` table counts:
- `available_count`: Decrease when reserved, increase when reservation expires
- `reserved_count`: Increase when reserved, decrease when confirmed/expired
- `sold_count`: Increase when confirmed

### 3. Background Cleanup
Implement edge functions for:
- Periodic cleanup of expired reservations (every 5 minutes)
- Automatic inventory count updates
- Cleanup of orphaned reservation records

### 4. Business Logic
- 30-minute reservation window
- First-come-first-served basis
- No double-booking prevention
- Reservation release on session abandonment

## Database Schema Changes

### Tickets Table Enhancement
Add columns:
- `reservation_expires_at`: TIMESTAMP (nullable)
- `reserved_at`: TIMESTAMP (nullable)
- Update `status` enum to include 'reserved'

### Background Task Tracking
New table: `reservation_cleanup_logs`
- Track cleanup operations
- Monitor inventory consistency
- Audit trail for reservation management

## Implementation Components

### Edge Functions
1. **Reservation Cleanup Function**
   - Runs every 5 minutes
   - Identifies expired reservations
   - Updates ticket status and inventory counts
   
2. **Inventory Sync Function**
   - Validates inventory count consistency
   - Reconciles discrepancies
   - Logs inconsistencies for monitoring

### API Enhancements
- Reservation creation on ticket selection
- Reservation extension capabilities
- Inventory checking before reservation

## Success Criteria

1. ✅ Tickets reserved for exactly 30 minutes
2. ✅ Inventory counts accurately reflect reservations
3. ✅ Background cleanup runs reliably
4. ✅ No double-booking scenarios
5. ✅ Performance impact minimal
6. ✅ Audit trail for all reservation operations

## Future Considerations
- Dynamic reservation windows based on event popularity
- User notification of reservation expiry
- Reservation extension requests
- Priority queuing for high-demand events