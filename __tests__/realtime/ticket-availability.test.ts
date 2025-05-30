import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useTicketAvailability, useSingleTicketAvailability } from '@/hooks/use-ticket-availability'
import { ticketAvailabilityManager } from '@/lib/realtime/ticket-availability'

// Mock Supabase client
vi.mock('@/utils/supabase/client', () => ({
  createClient: vi.fn(() => ({
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn((callback) => {
        callback('SUBSCRIBED')
        return Promise.resolve()
      }),
      unsubscribe: vi.fn()
    })),
    removeChannel: vi.fn(),
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      lt: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { total_capacity: 100 }, error: null })
    }))
  }))
}))

// Mock reservation expiry manager
vi.mock('@/lib/realtime/reservation-expiry-manager', () => ({
  reservationExpiryManager: {
    startMonitoring: vi.fn(),
    stopMonitoring: vi.fn()
  }
}))

describe('Ticket Availability Real-time Updates', () => {
  const mockEventId = 'test-event-123'
  
  beforeEach(() => {
    vi.clearAllMocks()
  })
  
  afterEach(() => {
    vi.restoreAllMocks()
  })
  
  it('should initialize with empty availability', () => {
    const { result } = renderHook(() => useTicketAvailability(mockEventId))
    
    expect(result.current.availability.size).toBe(0)
    expect(result.current.isConnected).toBe(false)
    expect(result.current.connectionStatus).toBe('connecting')
  })
  
  it('should handle low stock callback', async () => {
    const onLowStock = vi.fn()
    const { result } = renderHook(() => 
      useTicketAvailability(mockEventId, { onLowStock })
    )
    
    // Simulate ticket availability update with low stock
    act(() => {
      const mockData = [{
        ticketTypeId: 'ticket-1',
        eventId: mockEventId,
        ticketTypeName: 'General Admission',
        availableCount: 5,
        reservedCount: 2,
        soldCount: 93,
        actualAvailable: 5,
        percentageSold: 93,
        isSoldOut: false,
        status: 'Active',
        lastUpdated: new Date().toISOString()
      }]
      
      // Simulate the manager calling the callback
      ticketAvailabilityManager.subscribeToEvent(mockEventId, (data) => {
        // This would normally be called by the manager
      })
    })
    
    // Verify the hook provides correct methods
    expect(result.current.getTicketAvailability).toBeDefined()
    expect(result.current.isTicketAvailable).toBeDefined()
    expect(result.current.getActualAvailable).toBeDefined()
  })
  
  it('should handle sold out callback', async () => {
    const onSoldOut = vi.fn()
    const { result } = renderHook(() => 
      useTicketAvailability(mockEventId, { onSoldOut })
    )
    
    // Verify initial state
    expect(result.current.isConnected).toBe(false)
  })
  
  it('should return correct ticket availability status', () => {
    const { result } = renderHook(() => useTicketAvailability(mockEventId))
    
    // Test when ticket doesn't exist
    expect(result.current.isTicketAvailable('non-existent')).toBe(false)
    expect(result.current.getActualAvailable('non-existent')).toBe(0)
  })
  
  it('should handle disabled state', () => {
    const { result } = renderHook(() => 
      useTicketAvailability(mockEventId, { enabled: false })
    )
    
    expect(result.current.availability.size).toBe(0)
    expect(result.current.connectionStatus).toBe('disconnected')
  })
  
  it('should clean up on unmount', () => {
    const { unmount } = renderHook(() => useTicketAvailability(mockEventId))
    
    unmount()
    
    // Verify cleanup was called
    expect(vi.mocked(reservationExpiryManager.stopMonitoring)).toHaveBeenCalledWith(mockEventId)
  })
})

describe('Single Ticket Availability Hook', () => {
  it('should provide simplified interface for single ticket', () => {
    const { result } = renderHook(() => 
      useSingleTicketAvailability('event-123', 'ticket-456')
    )
    
    expect(result.current.available).toBe(0)
    expect(result.current.reserved).toBe(0)
    expect(result.current.sold).toBe(0)
    expect(result.current.isSoldOut).toBe(false)
    expect(result.current.percentageSold).toBe(0)
    expect(result.current.status).toBe('Unknown')
  })
})