# Real-time Ticket Availability Implementation

## Overview
This document describes the real-time ticket availability system implemented for LodgeTix. The system provides live updates for ticket availability, handles reservation expiry, and ensures users see accurate ticket counts without page refresh.

## Architecture

### Components

1. **TicketAvailabilityManager** (`/lib/realtime/ticket-availability.ts`)
   - Manages WebSocket connections to Supabase
   - Handles subscription lifecycle
   - Caches availability data
   - Implements reconnection logic with exponential backoff

2. **ReservationExpiryManager** (`/lib/realtime/reservation-expiry-manager.ts`)
   - Monitors ticket reservations
   - Automatically expires stale reservations
   - Updates ticket counts when reservations expire

3. **useTicketAvailability Hook** (`/hooks/use-ticket-availability.ts`)
   - React hook for consuming real-time updates
   - Provides availability data and connection status
   - Handles low stock and sold out notifications

4. **UI Components**
   - `ConnectionStatus`: Shows real-time connection state
   - `TicketAvailabilityIndicator`: Displays ticket availability with animations
   - `TicketAvailabilityBadge`: Compact availability display for tables

## Database Setup

### Views
- `ticket_availability_view`: Provides calculated availability with reservation handling

### Triggers
- `update_event_ticket_counts`: Updates counts when tickets change
- `update_event_counts`: Updates event-level statistics

### Functions
- `expire_ticket_reservations()`: Cleans up expired reservations

## Usage

### Basic Implementation
```typescript
import { useTicketAvailability } from '@/hooks/use-ticket-availability'

function TicketSelection({ eventId }) {
  const { 
    availability, 
    isConnected,
    isTicketAvailable,
    getActualAvailable 
  } = useTicketAvailability(eventId, {
    onLowStock: (name, count) => {
      toast.warning(`${name} - only ${count} left!`)
    },
    onSoldOut: (name) => {
      toast.error(`${name} is now sold out`)
    }
  })
  
  // Check if specific ticket is available
  const canPurchase = isTicketAvailable(ticketId)
  
  // Get actual available count
  const available = getActualAvailable(ticketId)
}
```

### Single Ticket Hook
```typescript
import { useSingleTicketAvailability } from '@/hooks/use-ticket-availability'

function TicketCard({ eventId, ticketId }) {
  const { 
    available, 
    isSoldOut,
    percentageSold,
    isConnected 
  } = useSingleTicketAvailability(eventId, ticketId)
  
  return (
    <div>
      {isSoldOut ? 'Sold Out' : `${available} available`}
    </div>
  )
}
```

## Features

### Real-time Updates
- Ticket availability updates instantly across all users
- Reservation counts update in real-time
- Sold out status reflects immediately

### Reservation Expiry
- Expired reservations automatically released
- Client-side monitoring every 30 seconds
- Server-side cleanup via triggers

### Connection Management
- Automatic reconnection with exponential backoff
- Connection status indicators
- Graceful degradation when offline

### Performance Optimization
- Channel limit management (max 10 channels)
- Subscription reuse for same events
- Debounced updates to prevent UI thrashing
- Cached data for offline access

### Error Handling
- Error boundaries for graceful failures
- Fallback to static data when disconnected
- User-friendly error messages

## Testing

Run tests with:
```bash
npm test __tests__/realtime/ticket-availability.test.ts
```

## Security Considerations

1. **Row Level Security**: Views respect RLS policies
2. **Subscription Permissions**: Only authenticated users can subscribe
3. **Data Filtering**: Sensitive data excluded from real-time updates
4. **Rate Limiting**: Connection limits prevent abuse

## Monitoring

Track these metrics:
- Connection success rate
- Average reconnection time
- Subscription count per user
- Message latency
- Error rates by type

## Future Enhancements

1. **Predictive Availability**: Show "selling fast" indicators
2. **Queue Management**: Virtual queue for high-demand events
3. **Analytics**: Real-time dashboard for event organizers
4. **Push Notifications**: Alert users when tickets become available
5. **Reservation Extensions**: Allow users to extend reservations