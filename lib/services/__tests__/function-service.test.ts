import { describe, it, expect, vi, beforeEach } from 'vitest'
import { FunctionService } from '../function-service'
import { getSupabaseClient } from '@/lib/supabase-singleton'

vi.mock('@/lib/supabase-singleton', () => ({
  getSupabaseClient: vi.fn()
}))

describe('FunctionService', () => {
  let functionService: FunctionService
  let mockSupabase: any

  beforeEach(() => {
    mockSupabase = {
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        not: vi.fn().mockReturnThis()
      }))
    }
    
    vi.mocked(getSupabaseClient).mockReturnValue(mockSupabase)
    functionService = new FunctionService()
  })

  describe('getAllFunctions', () => {
    it('should fetch all published functions', async () => {
      const mockData = [{
        function_id: 'func-123',
        name: 'Grand Installation',
        slug: 'grand-installation',
        description: 'Annual Grand Installation',
        image_url: 'https://example.com/image.jpg',
        start_date: '2025-06-01',
        end_date: '2025-06-03',
        location_id: 'loc-123',
        organiser_id: 'org-123',
        metadata: {},
        events: [],
        packages: [],
        location: null
      }]

      const fromMock = mockSupabase.from()
      fromMock.single.mockResolvedValue({ data: mockData, error: null })

      const result = await functionService.getAllFunctions()

      expect(mockSupabase.from).toHaveBeenCalledWith('functions')
      expect(fromMock.eq).toHaveBeenCalledWith('is_published', true)
      expect(fromMock.order).toHaveBeenCalledWith('start_date', { ascending: true })
    })
  })

  describe('getFunctionBySlug', () => {
    it('should fetch a single function by slug', async () => {
      const mockData = {
        function_id: 'func-123',
        name: 'Grand Installation',
        slug: 'grand-installation',
        description: 'Annual Grand Installation',
        image_url: 'https://example.com/image.jpg',
        start_date: '2025-06-01',
        end_date: '2025-06-03',
        location_id: 'loc-123',
        organiser_id: 'org-123',
        metadata: {},
        events: [],
        packages: [],
        location: {
          location_id: 'loc-123',
          name: 'Sydney Masonic Centre',
          city: 'Sydney',
          state: 'NSW'
        }
      }

      const fromMock = mockSupabase.from()
      fromMock.single.mockResolvedValue({ data: mockData, error: null })

      const result = await functionService.getFunctionBySlug('grand-installation')

      expect(mockSupabase.from).toHaveBeenCalledWith('functions')
      expect(fromMock.eq).toHaveBeenCalledWith('slug', 'grand-installation')
      expect(fromMock.eq).toHaveBeenCalledWith('is_published', true)
      expect(result.id).toBe('func-123')
      expect(result.name).toBe('Grand Installation')
      expect(result.location?.name).toBe('Sydney Masonic Centre')
    })

    it('should throw error when function not found', async () => {
      const fromMock = mockSupabase.from()
      fromMock.single.mockResolvedValue({ data: null, error: { message: 'Not found' } })

      await expect(functionService.getFunctionBySlug('non-existent')).rejects.toThrow()
    })
  })

  describe('getEventsForFunction', () => {
    it('should fetch all events for a function', async () => {
      const mockEvents = [{
        event_id: 'event-123',
        slug: 'opening-ceremony',
        title: 'Opening Ceremony',
        function_id: 'func-123',
        event_start: '2025-06-01T10:00:00',
        event_end: '2025-06-01T12:00:00',
        is_published: true
      }]

      const mockFunction = {
        name: 'Grand Installation',
        slug: 'grand-installation'
      }

      const fromMock = mockSupabase.from()
      fromMock.single.mockResolvedValueOnce({ data: mockEvents, error: null })
        .mockResolvedValueOnce({ data: mockFunction, error: null })

      const result = await functionService.getEventsForFunction('func-123')

      expect(mockSupabase.from).toHaveBeenCalledWith('events')
      expect(fromMock.eq).toHaveBeenCalledWith('function_id', 'func-123')
      expect(fromMock.eq).toHaveBeenCalledWith('is_published', true)
      expect(result).toHaveLength(1)
      expect(result[0].title).toBe('Opening Ceremony')
    })
  })

  describe('getPackagesForFunction', () => {
    it('should fetch all packages for a function', async () => {
      const mockPackages = [{
        package_id: 'pkg-123',
        name: 'Full Weekend Package',
        description: 'Access to all events',
        full_price: 500,
        discount: 50,
        total_cost: 450,
        inclusions: ['All events', 'Meals', 'Accommodation'],
        function_id: 'func-123'
      }]

      const fromMock = mockSupabase.from()
      fromMock.single.mockResolvedValue({ data: mockPackages, error: null })

      const result = await functionService.getPackagesForFunction('func-123')

      expect(mockSupabase.from).toHaveBeenCalledWith('packages')
      expect(fromMock.eq).toHaveBeenCalledWith('function_id', 'func-123')
      expect(fromMock.eq).toHaveBeenCalledWith('is_active', true)
      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('Full Weekend Package')
      expect(result[0].totalCost).toBe(450)
    })
  })

  describe('getRegistrationCountForFunction', () => {
    it('should return registration count for a function', async () => {
      const fromMock = mockSupabase.from()
      fromMock.not.mockResolvedValue({ count: 25, error: null })

      const result = await functionService.getRegistrationCountForFunction('func-123')

      expect(mockSupabase.from).toHaveBeenCalledWith('registrations')
      expect(fromMock.eq).toHaveBeenCalledWith('function_id', 'func-123')
      expect(fromMock.not).toHaveBeenCalledWith('payment_status', 'eq', 'cancelled')
      expect(result).toBe(25)
    })

    it('should return 0 when no registrations found', async () => {
      const fromMock = mockSupabase.from()
      fromMock.not.mockResolvedValue({ count: null, error: null })

      const result = await functionService.getRegistrationCountForFunction('func-123')
      expect(result).toBe(0)
    })
  })
})