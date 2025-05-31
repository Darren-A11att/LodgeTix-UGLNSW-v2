import { getBrowserClient } from '@/lib/supabase-singleton'

export class ReservationExpiryManager {
  private intervals: Map<string, NodeJS.Timeout> = new Map()
  private supabase = getBrowserClient()
  
  /**
   * Start monitoring reservations for a specific event
   */
  startMonitoring(eventId: string, onExpiry?: () => void) {
    // Clear any existing interval for this event
    this.stopMonitoring(eventId)
    
    // Check for expired reservations every 30 seconds
    const intervalId = setInterval(async () => {
      await this.checkAndExpireReservations(eventId, onExpiry)
    }, 30000) // 30 seconds
    
    this.intervals.set(eventId, intervalId)
    
    // Run immediately
    this.checkAndExpireReservations(eventId, onExpiry)
  }
  
  /**
   * Stop monitoring reservations for a specific event
   */
  stopMonitoring(eventId: string) {
    const intervalId = this.intervals.get(eventId)
    if (intervalId) {
      clearInterval(intervalId)
      this.intervals.delete(eventId)
    }
  }
  
  /**
   * Stop all monitoring
   */
  stopAll() {
    this.intervals.forEach(intervalId => clearInterval(intervalId))
    this.intervals.clear()
  }
  
  /**
   * Check and expire reservations for an event
   */
  private async checkAndExpireReservations(eventId: string, onExpiry?: () => void) {
    try {
      // Find expired reservations
      const { data: expiredTickets, error: fetchError } = await this.supabase
        .from('tickets')
        .select('ticket_id, ticket_type_id')
        .eq('event_id', eventId)
        .eq('status', 'reserved')
        .lt('reservation_expires_at', new Date().toISOString())
      
      if (fetchError) {
        console.error('[ReservationExpiryManager] Error fetching expired tickets:', fetchError)
        return
      }
      
      if (!expiredTickets || expiredTickets.length === 0) {
        return
      }
      
      console.log(`[ReservationExpiryManager] Found ${expiredTickets.length} expired reservations for event ${eventId}`)
      
      // Update expired tickets
      const ticketIds = expiredTickets.map(t => t.ticket_id)
      const { error: updateError } = await this.supabase
        .from('tickets')
        .update({
          status: 'available',
          reservation_id: null,
          reservation_expires_at: null,
          updated_at: new Date().toISOString()
        })
        .in('ticket_id', ticketIds)
        .eq('status', 'reserved') // Double-check status hasn't changed
      
      if (updateError) {
        console.error('[ReservationExpiryManager] Error updating expired tickets:', updateError)
        return
      }
      
      // Get unique ticket type IDs
      const ticketTypeIds = [...new Set(expiredTickets.map(t => t.ticket_type_id).filter(Boolean))]
      
      // Update event_tickets counts for affected ticket types
      for (const ticketTypeId of ticketTypeIds) {
        await this.updateTicketTypeCounts(ticketTypeId)
      }
      
      // Call the expiry callback
      if (onExpiry) {
        onExpiry()
      }
    } catch (error) {
      console.error('[ReservationExpiryManager] Unexpected error:', error)
    }
  }
  
  /**
   * Update counts for a specific ticket type
   */
  private async updateTicketTypeCounts(ticketTypeId: string) {
    try {
      // Get current counts
      const { data: counts, error: countError } = await this.supabase
        .from('tickets')
        .select('status')
        .eq('ticket_type_id', ticketTypeId)
        .in('status', ['reserved', 'sold'])
      
      if (countError) {
        console.error('[ReservationExpiryManager] Error counting tickets:', countError)
        return
      }
      
      const reservedCount = counts?.filter(t => 
        t.status === 'reserved'
      ).length || 0
      
      const soldCount = counts?.filter(t => t.status === 'sold').length || 0
      
      // Get total capacity
      const { data: ticketType, error: typeError } = await this.supabase
        .from('event_tickets')
        .select('total_capacity')
        .eq('id', ticketTypeId)
        .single()
      
      if (typeError) {
        console.error('[ReservationExpiryManager] Error fetching ticket type:', typeError)
        return
      }
      
      const totalCapacity = ticketType?.total_capacity
      const availableCount = totalCapacity ? totalCapacity - reservedCount - soldCount : null
      
      // Update counts
      const { error: updateError } = await this.supabase
        .from('event_tickets')
        .update({
          reserved_count: reservedCount,
          sold_count: soldCount,
          available_count: availableCount,
          updated_at: new Date().toISOString()
        })
        .eq('id', ticketTypeId)
      
      if (updateError) {
        console.error('[ReservationExpiryManager] Error updating ticket type counts:', updateError)
      }
    } catch (error) {
      console.error('[ReservationExpiryManager] Error in updateTicketTypeCounts:', error)
    }
  }
}

// Singleton instance
export const reservationExpiryManager = new ReservationExpiryManager()