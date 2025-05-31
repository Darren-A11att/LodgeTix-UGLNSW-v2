import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import { getBrowserClient } from '@/lib/supabase-singleton'

export interface TicketAvailability {
  ticketTypeId: string
  eventId: string
  ticketTypeName: string
  availableCount: number
  reservedCount: number
  soldCount: number
  actualAvailable: number
  percentageSold: number
  isSoldOut: boolean
  status: string
  lastUpdated: string
}

export interface RealtimeManagerOptions {
  maxChannels?: number
  reconnectDelay?: number
  maxReconnectAttempts?: number
}

export class TicketAvailabilityManager {
  private channels: Map<string, RealtimeChannel> = new Map()
  private subscriptions: Map<string, Set<(data: TicketAvailability[]) => void>> = new Map()
  private availabilityCache: Map<string, Map<string, TicketAvailability>> = new Map()
  private connectionStatus: Map<string, 'connecting' | 'connected' | 'disconnected' | 'error'> = new Map()
  private reconnectTimers: Map<string, NodeJS.Timeout> = new Map()
  private reconnectAttempts: Map<string, number> = new Map()
  
  private options: Required<RealtimeManagerOptions> = {
    maxChannels: 10,
    reconnectDelay: 1000,
    maxReconnectAttempts: 5
  }
  
  private supabase = getBrowserClient()

  constructor(options?: RealtimeManagerOptions) {
    if (options) {
      this.options = { ...this.options, ...options }
    }
  }

  async subscribeToEvent(
    eventId: string, 
    callback: (availability: TicketAvailability[]) => void
  ): Promise<() => void> {
    console.log(`[TicketAvailability] Subscribing to event ${eventId}`)
    
    // Add callback to subscriptions
    if (!this.subscriptions.has(eventId)) {
      this.subscriptions.set(eventId, new Set())
    }
    this.subscriptions.get(eventId)!.add(callback)
    
    // If channel already exists and is connected, send current data
    if (this.channels.has(eventId) && this.connectionStatus.get(eventId) === 'connected') {
      const currentData = Array.from(this.availabilityCache.get(eventId)?.values() || [])
      callback(currentData)
      return () => this.unsubscribeCallback(eventId, callback)
    }
    
    // Create new channel if needed
    if (!this.channels.has(eventId)) {
      await this.createChannel(eventId)
    }
    
    // Load initial data
    await this.loadInitialData(eventId)
    
    // Return unsubscribe function
    return () => this.unsubscribeCallback(eventId, callback)
  }

  private async createChannel(eventId: string) {
    // Check channel limit
    if (this.channels.size >= this.options.maxChannels) {
      // Remove oldest channel
      const oldestChannelId = this.channels.keys().next().value
      if (oldestChannelId) {
        await this.removeChannel(oldestChannelId)
      }
    }
    
    console.log(`[TicketAvailability] Creating channel for event ${eventId}`)
    this.connectionStatus.set(eventId, 'connecting')
    
    const channel = this.supabase
      .channel(`ticket-availability:${eventId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'event_tickets',
          filter: `event_id=eq.${eventId}`
        },
        (payload: RealtimePostgresChangesPayload<any>) => {
          this.handleTicketChange(eventId, payload)
        }
      )
      .subscribe((status) => {
        console.log(`[TicketAvailability] Channel status for ${eventId}: ${status}`)
        
        if (status === 'SUBSCRIBED') {
          this.connectionStatus.set(eventId, 'connected')
          this.reconnectAttempts.set(eventId, 0)
          // Clear any reconnect timer
          const timer = this.reconnectTimers.get(eventId)
          if (timer) {
            clearTimeout(timer)
            this.reconnectTimers.delete(eventId)
          }
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          this.connectionStatus.set(eventId, 'error')
          this.handleReconnect(eventId)
        } else if (status === 'CLOSED') {
          this.connectionStatus.set(eventId, 'disconnected')
        }
      })
    
    this.channels.set(eventId, channel)
  }

  private async loadInitialData(eventId: string) {
    try {
      console.log(`[TicketAvailability] Loading initial data for event ${eventId}`)
      
      const { data, error } = await this.supabase
        .from('event_tickets')
        .select('*')
        .eq('event_id', eventId)
        .eq('is_active', true)
      
      if (error) {
        console.error('[TicketAvailability] Error loading initial data:', error)
        throw error
      }
      
      if (data) {
        const availabilityMap = new Map<string, TicketAvailability>()
        
        data.forEach(item => {
          const actualAvailable = Math.max(0, (item.available_count || 0) - (item.reserved_count || 0))
          const totalCapacity = item.total_capacity || 0
          const percentageSold = totalCapacity > 0 
            ? Math.round(((item.sold_count || 0) / totalCapacity) * 100)
            : 0
          
          const availability: TicketAvailability = {
            ticketTypeId: item.id,
            eventId: item.event_id,
            ticketTypeName: item.name,
            availableCount: item.available_count || 0,
            reservedCount: item.reserved_count || 0,
            soldCount: item.sold_count || 0,
            actualAvailable: actualAvailable,
            percentageSold: percentageSold,
            isSoldOut: actualAvailable === 0 || item.status === 'Sold Out',
            status: item.status || 'Active',
            lastUpdated: item.updated_at || new Date().toISOString()
          }
          
          availabilityMap.set(item.id, availability)
        })
        
        this.availabilityCache.set(eventId, availabilityMap)
        this.notifySubscribers(eventId)
      }
    } catch (error) {
      console.error('[TicketAvailability] Failed to load initial data:', error)
      this.connectionStatus.set(eventId, 'error')
    }
  }

  private handleAvailabilityChange(eventId: string, payload: RealtimePostgresChangesPayload<any>) {
    // This method is no longer used since we're subscribing directly to event_tickets
    // Keeping it for potential future use with a view
  }

  private handleTicketChange(eventId: string, payload: RealtimePostgresChangesPayload<any>) {
    console.log(`[TicketAvailability] Ticket change for event ${eventId}:`, payload.eventType)
    
    const cache = this.availabilityCache.get(eventId) || new Map()
    
    switch (payload.eventType) {
      case 'INSERT':
      case 'UPDATE':
        if (payload.new) {
          const actualAvailable = Math.max(0, (payload.new.available_count || 0) - (payload.new.reserved_count || 0))
          const totalCapacity = payload.new.total_capacity || 0
          const percentageSold = totalCapacity > 0 
            ? Math.round(((payload.new.sold_count || 0) / totalCapacity) * 100)
            : 0
          
          const availability: TicketAvailability = {
            ticketTypeId: payload.new.id,
            eventId: payload.new.event_id,
            ticketTypeName: payload.new.name,
            availableCount: payload.new.available_count || 0,
            reservedCount: payload.new.reserved_count || 0,
            soldCount: payload.new.sold_count || 0,
            actualAvailable: actualAvailable,
            percentageSold: percentageSold,
            isSoldOut: actualAvailable === 0 || payload.new.status === 'Sold Out',
            status: payload.new.status || 'Active',
            lastUpdated: payload.new.updated_at || new Date().toISOString()
          }
          
          cache.set(payload.new.id, availability)
          
          // Show alerts for low availability
          if (availability.actualAvailable < 10 && availability.actualAvailable > 0) {
            const oldAvailable = payload.old ? Math.max(0, (payload.old.available_count || 0) - (payload.old.reserved_count || 0)) : 0
            if (oldAvailable >= 10) {
              this.showLowAvailabilityAlert(availability.ticketTypeName, availability.actualAvailable)
            }
          } else if (availability.isSoldOut && payload.old) {
            const oldAvailable = Math.max(0, (payload.old.available_count || 0) - (payload.old.reserved_count || 0))
            if (oldAvailable > 0) {
              this.showSoldOutAlert(availability.ticketTypeName)
            }
          }
        }
        break
        
      case 'DELETE':
        if (payload.old) {
          cache.delete(payload.old.id)
        }
        break
    }
    
    this.availabilityCache.set(eventId, cache)
    this.notifySubscribers(eventId)
  }

  private notifySubscribers(eventId: string) {
    const subscribers = this.subscriptions.get(eventId)
    const data = Array.from(this.availabilityCache.get(eventId)?.values() || [])
    
    if (subscribers) {
      subscribers.forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error('[TicketAvailability] Error in subscriber callback:', error)
        }
      })
    }
  }

  private showLowAvailabilityAlert(ticketName: string, available: number) {
    // This can be replaced with a proper toast notification system
    console.warn(`[TicketAvailability] Low availability alert: ${ticketName} - only ${available} left!`)
  }

  private showSoldOutAlert(ticketName: string) {
    // This can be replaced with a proper toast notification system
    console.warn(`[TicketAvailability] Sold out alert: ${ticketName} is now sold out!`)
  }

  private async handleReconnect(eventId: string) {
    const attempts = this.reconnectAttempts.get(eventId) || 0
    
    if (attempts >= this.options.maxReconnectAttempts) {
      console.error(`[TicketAvailability] Max reconnect attempts reached for event ${eventId}`)
      this.connectionStatus.set(eventId, 'error')
      return
    }
    
    const delay = this.options.reconnectDelay * Math.pow(2, attempts) // Exponential backoff
    console.log(`[TicketAvailability] Reconnecting to event ${eventId} in ${delay}ms (attempt ${attempts + 1})`)
    
    const timer = setTimeout(async () => {
      this.reconnectAttempts.set(eventId, attempts + 1)
      
      // Remove old channel
      const oldChannel = this.channels.get(eventId)
      if (oldChannel) {
        await this.supabase.removeChannel(oldChannel)
        this.channels.delete(eventId)
      }
      
      // Create new channel
      await this.createChannel(eventId)
      await this.loadInitialData(eventId)
    }, delay)
    
    this.reconnectTimers.set(eventId, timer)
  }

  private unsubscribeCallback(eventId: string, callback: (data: TicketAvailability[]) => void) {
    const subscribers = this.subscriptions.get(eventId)
    if (subscribers) {
      subscribers.delete(callback)
      
      // If no more subscribers, remove channel
      if (subscribers.size === 0) {
        this.subscriptions.delete(eventId)
        this.removeChannel(eventId)
      }
    }
  }

  private async removeChannel(eventId: string) {
    console.log(`[TicketAvailability] Removing channel for event ${eventId}`)
    
    const channel = this.channels.get(eventId)
    if (channel) {
      await this.supabase.removeChannel(channel)
      this.channels.delete(eventId)
    }
    
    this.availabilityCache.delete(eventId)
    this.connectionStatus.delete(eventId)
    this.reconnectAttempts.delete(eventId)
    
    const timer = this.reconnectTimers.get(eventId)
    if (timer) {
      clearTimeout(timer)
      this.reconnectTimers.delete(eventId)
    }
  }

  getConnectionStatus(eventId: string): 'connecting' | 'connected' | 'disconnected' | 'error' | 'unknown' {
    return this.connectionStatus.get(eventId) || 'unknown'
  }

  getCurrentAvailability(eventId: string): TicketAvailability[] {
    return Array.from(this.availabilityCache.get(eventId)?.values() || [])
  }

  async cleanup() {
    console.log('[TicketAvailability] Cleaning up all channels')
    
    // Clear all timers
    this.reconnectTimers.forEach(timer => clearTimeout(timer))
    this.reconnectTimers.clear()
    
    // Remove all channels
    for (const eventId of this.channels.keys()) {
      await this.removeChannel(eventId)
    }
    
    this.subscriptions.clear()
    this.availabilityCache.clear()
    this.connectionStatus.clear()
    this.reconnectAttempts.clear()
  }
}

// Singleton instance
export const ticketAvailabilityManager = new TicketAvailabilityManager()