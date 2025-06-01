import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '../route'
import { FunctionService } from '@/lib/services/function-service'

vi.mock('@/lib/services/function-service')

describe('Functions API Route', () => {
  let mockFunctionService: any

  beforeEach(() => {
    vi.clearAllMocks()
    mockFunctionService = {
      getAllFunctions: vi.fn(),
      getFeaturedFunctions: vi.fn()
    }
    vi.mocked(FunctionService).mockImplementation(() => mockFunctionService)
  })

  describe('GET /api/functions', () => {
    it('should return all functions', async () => {
      const mockFunctions = [
        {
          id: 'func-1',
          name: 'Grand Installation',
          slug: 'grand-installation',
          description: 'Annual event',
          startDate: '2025-06-01',
          endDate: '2025-06-03',
          events: [],
          packages: [],
          registrationCount: 0,
          minPrice: 150,
          durationDays: 3
        },
        {
          id: 'func-2',
          name: 'Quarterly Communication',
          slug: 'quarterly-communication',
          description: 'Regular meeting',
          startDate: '2025-07-01',
          endDate: '2025-07-01',
          events: [],
          packages: [],
          registrationCount: 0,
          minPrice: 50,
          durationDays: 1
        }
      ]

      mockFunctionService.getAllFunctions.mockResolvedValue(mockFunctions)

      const request = new Request('http://localhost:3000/api/functions')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockFunctions)
      expect(mockFunctionService.getAllFunctions).toHaveBeenCalledTimes(1)
    })

    it('should return featured functions when featured=true', async () => {
      const mockFeaturedFunctions = [
        {
          id: 'func-1',
          name: 'Grand Installation',
          slug: 'grand-installation',
          description: 'Annual event',
          startDate: '2025-06-01',
          endDate: '2025-06-03',
          events: [],
          packages: [],
          registrationCount: 0,
          minPrice: 150,
          durationDays: 3
        }
      ]

      mockFunctionService.getFeaturedFunctions.mockResolvedValue(mockFeaturedFunctions)

      const request = new Request('http://localhost:3000/api/functions?featured=true')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockFeaturedFunctions)
      expect(mockFunctionService.getFeaturedFunctions).toHaveBeenCalledTimes(1)
      expect(mockFunctionService.getAllFunctions).not.toHaveBeenCalled()
    })

    it('should handle errors gracefully', async () => {
      mockFunctionService.getAllFunctions.mockRejectedValue(new Error('Database error'))

      const request = new Request('http://localhost:3000/api/functions')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to fetch functions')
    })
  })
})