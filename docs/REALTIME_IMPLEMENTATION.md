# Realtime Implementation Guide for LodgeTix

## 1. Real-time Ticket Availability

### Problem Solved
- Users see outdated availability
- Multiple users booking last tickets simultaneously
- No warning when tickets are running low

### Implementation

```typescript
// components/event/TicketAvailabilityProvider.tsx
import { createContext, useContext, useEffect, useState } from 'react'
import { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface TicketAvailability {
  ticketTypeId: string
  availableCount: number
  reservedCount: number
  soldCount: number
  lastUpdated: string
}

const TicketAvailabilityContext = createContext<{
  availability: Map<string, TicketAvailability>
  isLive: boolean
}>({
  availability: new Map(),
  isLive: false
})

export function TicketAvailabilityProvider({ 
  eventId, 
  children 
}: { 
  eventId: string
  children: React.ReactNode 
}) {
  const [availability, setAvailability] = useState<Map<string, TicketAvailability>>(new Map())
  const [isLive, setIsLive] = useState(false)
  
  useEffect(() => {
    // Initial load
    loadTicketAvailability()
    
    // Subscribe to changes
    const channel = supabase
      .channel(`event-tickets:${eventId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'event_tickets',
          filter: `event_id=eq.${eventId}`
        },
        (payload) => {
          // Update specific ticket type
          setAvailability(prev => {
            const updated = new Map(prev)
            updated.set(payload.new.id, {
              ticketTypeId: payload.new.id,
              availableCount: payload.new.available_count,
              reservedCount: payload.new.reserved_count,
              soldCount: payload.new.sold_count,
              lastUpdated: payload.new.updated_at
            })
            return updated
          })
          
          // Show notification if low availability
          if (payload.new.available_count < 10 && payload.new.available_count > 0) {
            showLowAvailabilityWarning(payload.new.name, payload.new.available_count)
          }
        }
      )
      .subscribe((status) => {
        setIsLive(status === 'SUBSCRIBED')
      })
    
    return () => {
      supabase.removeChannel(channel)
    }
  }, [eventId])
  
  async function loadTicketAvailability() {
    const { data, error } = await supabase
      .from('event_tickets')
      .select('id, available_count, reserved_count, sold_count, updated_at')
      .eq('event_id', eventId)
    
    if (data) {
      const availabilityMap = new Map<string, TicketAvailability>()
      data.forEach(ticket => {
        availabilityMap.set(ticket.id, {
          ticketTypeId: ticket.id,
          availableCount: ticket.available_count,
          reservedCount: ticket.reserved_count,
          soldCount: ticket.sold_count,
          lastUpdated: ticket.updated_at
        })
      })
      setAvailability(availabilityMap)
    }
  }
  
  return (
    <TicketAvailabilityContext.Provider value={{ availability, isLive }}>
      {children}
    </TicketAvailabilityContext.Provider>
  )
}

// Hook to use in components
export function useTicketAvailability(ticketTypeId: string) {
  const { availability, isLive } = useContext(TicketAvailabilityContext)
  return {
    available: availability.get(ticketTypeId)?.availableCount ?? 0,
    reserved: availability.get(ticketTypeId)?.reservedCount ?? 0,
    sold: availability.get(ticketTypeId)?.soldCount ?? 0,
    isLive
  }
}
```

### Usage in Ticket Selection

```typescript
// components/register/TicketOption.tsx
function TicketOption({ ticket }: { ticket: EventTicket }) {
  const { available, isLive } = useTicketAvailability(ticket.id)
  
  return (
    <div className="ticket-option">
      <h3>{ticket.name}</h3>
      <p className="price">${ticket.price}</p>
      
      {/* Real-time availability indicator */}
      <div className="availability">
        {isLive && <span className="live-indicator">LIVE</span>}
        
        {available === 0 ? (
          <span className="sold-out">SOLD OUT</span>
        ) : available < 10 ? (
          <span className="low-stock">Only {available} left!</span>
        ) : (
          <span className="in-stock">{available} available</span>
        )}
      </div>
      
      <button 
        disabled={available === 0}
        onClick={() => selectTicket(ticket)}
      >
        {available === 0 ? 'Sold Out' : 'Select'}
      </button>
    </div>
  )
}
```

## 2. Registration Queue Management

### Problem Solved
- Users don't know how many others are registering
- No social proof during registration
- Can't track abandoned registrations

### Implementation

```typescript
// hooks/useRegistrationPresence.ts
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRegistration } from '@/contexts/registration-context'

interface PresenceState {
  userId: string
  eventId: string
  step: string
  joinedAt: string
}

export function useRegistrationPresence(eventId: string) {
  const { currentStep, registrationId } = useRegistration()
  const [activeUsers, setActiveUsers] = useState<PresenceState[]>([])
  const [presenceChannel, setPresenceChannel] = useState<any>(null)
  
  useEffect(() => {
    const channel = supabase.channel(`registration:${eventId}`)
    
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        const users = Object.values(state).flat() as PresenceState[]
        setActiveUsers(users)
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', newPresences)
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', leftPresences)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            userId: registrationId,
            eventId,
            step: currentStep,
            joinedAt: new Date().toISOString()
          })
        }
      })
    
    setPresenceChannel(channel)
    
    // Update presence when step changes
    if (channel && currentStep) {
      channel.track({
        userId: registrationId,
        eventId,
        step: currentStep,
        joinedAt: new Date().toISOString()
      })
    }
    
    return () => {
      channel.untrack()
      supabase.removeChannel(channel)
    }
  }, [eventId, currentStep, registrationId])
  
  return {
    activeUsers: activeUsers.filter(u => u.userId !== registrationId),
    totalActive: activeUsers.length,
    byStep: activeUsers.reduce((acc, user) => {
      acc[user.step] = (acc[user.step] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }
}
```

### Social Proof Component

```typescript
// components/register/RegistrationActivity.tsx
export function RegistrationActivity({ eventId }: { eventId: string }) {
  const { totalActive, byStep } = useRegistrationPresence(eventId)
  
  if (totalActive <= 1) return null
  
  return (
    <div className="registration-activity">
      <div className="flex items-center gap-2">
        <div className="flex -space-x-2">
          {[...Array(Math.min(totalActive - 1, 5))].map((_, i) => (
            <div
              key={i}
              className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs"
            >
              {i + 1}
            </div>
          ))}
          {totalActive > 6 && (
            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-xs">
              +{totalActive - 6}
            </div>
          )}
        </div>
        
        <p className="text-sm text-muted-foreground">
          {totalActive - 1} other {totalActive === 2 ? 'person is' : 'people are'} registering for this event
        </p>
      </div>
      
      {/* Optional: Show where people are in the process */}
      {byStep.ticket_selection > 0 && (
        <p className="text-xs text-muted-foreground mt-1">
          {byStep.ticket_selection} selecting tickets now
        </p>
      )}
    </div>
  )
}
```

## 3. Admin Live Updates

### Problem Solved
- Event changes don't reflect immediately
- Users see stale information
- Manual page refreshes needed

### Implementation

```typescript
// hooks/useEventBroadcast.ts
export function useEventBroadcast(eventId: string) {
  const [lastUpdate, setLastUpdate] = useState<any>(null)
  
  useEffect(() => {
    const channel = supabase
      .channel(`event-updates:${eventId}`)
      .on('broadcast', { event: 'update' }, (payload) => {
        setLastUpdate(payload)
        
        // Handle different update types
        switch (payload.updateType) {
          case 'capacity_change':
            toast.info('Event capacity has been updated')
            break
          case 'info_update':
            toast.info('Event information has been updated')
            break
          case 'cancellation':
            toast.error('This event has been cancelled')
            // Redirect to events page
            break
        }
      })
      .subscribe()
    
    return () => {
      supabase.removeChannel(channel)
    }
  }, [eventId])
  
  // Admin broadcast function
  async function broadcastUpdate(updateType: string, data: any) {
    await supabase
      .channel(`event-updates:${eventId}`)
      .send({
        type: 'broadcast',
        event: 'update',
        payload: {
          updateType,
          data,
          timestamp: new Date().toISOString()
        }
      })
  }
  
  return { lastUpdate, broadcastUpdate }
}
```

## 4. Data Capture Implementation

### Every Interaction Logged

```typescript
// lib/analytics/interaction-tracker.ts
class InteractionTracker {
  private queue: any[] = []
  private flushInterval: NodeJS.Timer | null = null
  
  constructor() {
    // Batch writes every 5 seconds
    this.flushInterval = setInterval(() => {
      this.flush()
    }, 5000)
  }
  
  track(action: string, data: any) {
    this.queue.push({
      action,
      data,
      timestamp: new Date().toISOString(),
      session_id: getSessionId(),
      user_id: getUserId(),
      page_url: window.location.href,
      user_agent: navigator.userAgent
    })
    
    // Flush immediately if queue is large
    if (this.queue.length > 50) {
      this.flush()
    }
  }
  
  async flush() {
    if (this.queue.length === 0) return
    
    const items = [...this.queue]
    this.queue = []
    
    try {
      await supabase
        .from('user_interactions')
        .insert(items)
    } catch (error) {
      // Re-queue on failure
      this.queue.unshift(...items)
    }
  }
}

export const tracker = new InteractionTracker()

// Usage throughout the app
tracker.track('ticket_selected', { ticketId, eventId, price })
tracker.track('form_field_changed', { field, value })
tracker.track('payment_initiated', { amount, method })
```

## 5. Performance Considerations

### Connection Management

```typescript
// lib/realtime/connection-manager.ts
class RealtimeConnectionManager {
  private channels: Map<string, any> = new Map()
  private maxChannels = 10
  
  subscribe(channelName: string, options: any) {
    // Reuse existing channels
    if (this.channels.has(channelName)) {
      return this.channels.get(channelName)
    }
    
    // Enforce connection limit
    if (this.channels.size >= this.maxChannels) {
      const oldestChannel = this.channels.keys().next().value
      this.unsubscribe(oldestChannel)
    }
    
    const channel = supabase.channel(channelName, options)
    this.channels.set(channelName, channel)
    return channel
  }
  
  unsubscribe(channelName: string) {
    const channel = this.channels.get(channelName)
    if (channel) {
      supabase.removeChannel(channel)
      this.channels.delete(channelName)
    }
  }
  
  unsubscribeAll() {
    this.channels.forEach(channel => {
      supabase.removeChannel(channel)
    })
    this.channels.clear()
  }
}

export const realtimeManager = new RealtimeConnectionManager()
```

## Testing Realtime Features

```typescript
// __tests__/realtime/ticket-availability.test.ts
import { renderHook, act } from '@testing-library/react-hooks'
import { useTicketAvailability } from '@/hooks/useTicketAvailability'

// Mock Supabase realtime
jest.mock('@/lib/supabase', () => ({
  supabase: {
    channel: jest.fn(() => ({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn((cb) => {
        cb('SUBSCRIBED')
        return Promise.resolve()
      })
    }))
  }
}))

describe('Ticket Availability Realtime', () => {
  it('updates availability when realtime event received', async () => {
    const { result } = renderHook(() => useTicketAvailability('ticket-123'))
    
    // Simulate realtime update
    act(() => {
      // Trigger the postgres_changes callback
      const mockPayload = {
        new: {
          id: 'ticket-123',
          available_count: 5,
          reserved_count: 2,
          sold_count: 93
        }
      }
      // Trigger the update
    })
    
    expect(result.current.available).toBe(5)
    expect(result.current.isLive).toBe(true)
  })
})
```

This implementation provides a robust foundation for real-time features that enhance user experience while ensuring all data is captured in the database.