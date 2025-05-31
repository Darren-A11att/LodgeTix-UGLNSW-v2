import { useEffect, useState, useCallback, useRef } from 'react'
import { ticketAvailabilityManager, type TicketAvailability } from '@/lib/realtime/ticket-availability'
import { reservationExpiryManager } from '@/lib/realtime/reservation-expiry-manager'

export interface UseTicketAvailabilityOptions {
  enabled?: boolean
  onLowStock?: (ticketName: string, available: number) => void
  onSoldOut?: (ticketName: string) => void
}

export interface UseTicketAvailabilityResult {
  availability: Map<string, TicketAvailability>
  isConnected: boolean
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error' | 'unknown'
  getTicketAvailability: (ticketTypeId: string) => TicketAvailability | undefined
  isTicketAvailable: (ticketTypeId: string) => boolean
  getActualAvailable: (ticketTypeId: string) => number
}

export function useTicketAvailability(
  eventId: string | null | undefined,
  options: UseTicketAvailabilityOptions = {}
): UseTicketAvailabilityResult {
  const { enabled = true, onLowStock, onSoldOut } = options
  
  const [availability, setAvailability] = useState<Map<string, TicketAvailability>>(new Map())
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error' | 'unknown'>('unknown')
  const previousAvailabilityRef = useRef<Map<string, TicketAvailability>>(new Map())
  const unsubscribeRef = useRef<(() => void) | null>(null)
  const statusIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!eventId || !enabled) {
      setAvailability(new Map())
      setConnectionStatus('disconnected')
      return
    }

    let mounted = true

    const handleAvailabilityUpdate = (data: TicketAvailability[]) => {
      if (!mounted) return

      const newAvailability = new Map<string, TicketAvailability>()
      data.forEach(item => {
        newAvailability.set(item.ticketTypeId, item)
      })

      // Check for changes and trigger callbacks
      if (onLowStock || onSoldOut) {
        newAvailability.forEach((current, ticketTypeId) => {
          const previous = previousAvailabilityRef.current.get(ticketTypeId)
          
          if (previous) {
            // Check for low stock transition
            if (current.actualAvailable < 10 && current.actualAvailable > 0 && 
                previous.actualAvailable >= 10) {
              onLowStock?.(current.ticketTypeName, current.actualAvailable)
            }
            
            // Check for sold out transition
            if (current.isSoldOut && !previous.isSoldOut) {
              onSoldOut?.(current.ticketTypeName)
            }
          }
        })
      }

      previousAvailabilityRef.current = newAvailability
      setAvailability(newAvailability)
    }

    // Subscribe to real-time updates
    const subscribe = async () => {
      try {
        setConnectionStatus('connecting')
        
        const unsubscribe = await ticketAvailabilityManager.subscribeToEvent(
          eventId,
          handleAvailabilityUpdate
        )
        
        if (mounted) {
          unsubscribeRef.current = unsubscribe
          
          // Check connection status
          const status = ticketAvailabilityManager.getConnectionStatus(eventId)
          setConnectionStatus(status)
          
          // Set up periodic status check - but less frequently to avoid performance issues
          statusIntervalRef.current = setInterval(() => {
            if (mounted) {
              const currentStatus = ticketAvailabilityManager.getConnectionStatus(eventId)
              setConnectionStatus(currentStatus)
            }
          }, 5000) // Check every 5 seconds instead of every second
        }
      } catch (error) {
        console.error('[useTicketAvailability] Failed to subscribe:', error)
        if (mounted) {
          setConnectionStatus('error')
        }
      }
    }

    subscribe()
    
    // Start monitoring reservation expiry
    if (eventId) {
      reservationExpiryManager.startMonitoring(eventId, () => {
        // Force a reload of ticket availability when reservations expire
        if (mounted) {
          const currentData = ticketAvailabilityManager.getCurrentAvailability(eventId)
          handleAvailabilityUpdate(currentData)
        }
      })
    }

    return () => {
      mounted = false
      
      // Clear status check interval
      if (statusIntervalRef.current) {
        clearInterval(statusIntervalRef.current)
        statusIntervalRef.current = null
      }
      
      // Unsubscribe from ticket availability
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
        unsubscribeRef.current = null
      }
      
      // Stop monitoring reservations
      if (eventId) {
        reservationExpiryManager.stopMonitoring(eventId)
      }
    }
  }, [eventId, enabled]) // Remove onLowStock and onSoldOut from dependencies to avoid re-subscribing

  const getTicketAvailability = useCallback((ticketTypeId: string): TicketAvailability | undefined => {
    return availability.get(ticketTypeId)
  }, [availability])

  const isTicketAvailable = useCallback((ticketTypeId: string): boolean => {
    const ticket = availability.get(ticketTypeId)
    return ticket ? !ticket.isSoldOut && ticket.actualAvailable > 0 : false
  }, [availability])

  const getActualAvailable = useCallback((ticketTypeId: string): number => {
    const ticket = availability.get(ticketTypeId)
    return ticket?.actualAvailable || 0
  }, [availability])

  return {
    availability,
    isConnected: connectionStatus === 'connected',
    connectionStatus,
    getTicketAvailability,
    isTicketAvailable,
    getActualAvailable
  }
}

// Hook for single ticket availability (convenience wrapper)
export function useSingleTicketAvailability(
  eventId: string | null | undefined,
  ticketTypeId: string | null | undefined,
  options: UseTicketAvailabilityOptions = {}
) {
  const { 
    availability, 
    isConnected, 
    connectionStatus, 
    getTicketAvailability 
  } = useTicketAvailability(eventId, options)
  
  const ticketData = ticketTypeId ? getTicketAvailability(ticketTypeId) : undefined
  
  return {
    available: ticketData?.actualAvailable || 0,
    reserved: ticketData?.reservedCount || 0,
    sold: ticketData?.soldCount || 0,
    isSoldOut: ticketData?.isSoldOut || false,
    percentageSold: ticketData?.percentageSold || 0,
    status: ticketData?.status || 'Unknown',
    isConnected,
    connectionStatus,
    ticketData
  }
}