import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';

// Create mock client reference that will be populated
let mockSupabaseClient: any;

// Mock dependencies first
vi.mock('@/utils/supabase/server', () => ({
  createClient: vi.fn().mockImplementation(async () => mockSupabaseClient)
}));

vi.mock('stripe', () => ({
  default: vi.fn().mockImplementation(() => ({
    accounts: {
      retrieve: vi.fn().mockResolvedValue({ charges_enabled: true })
    },
    paymentIntents: {
      create: vi.fn().mockResolvedValue({
        id: 'pi_test123',
        status: 'succeeded'
      })
    },
    refunds: {
      create: vi.fn().mockResolvedValue({ id: 'refund_123' })
    }
  }))
}));

// Import route handlers after mocks
import { POST, PUT } from '@/app/api/functions/[functionId]/packages/[packageId]/lodge-registration/route';

describe('Lodge Registration API Updates', () => {
  const mockFunctionId = '123e4567-e89b-12d3-a456-426614174000';
  const mockPackageId = '223e4567-e89b-12d3-a456-426614174000';
  const mockContext = {
    params: Promise.resolve({
      functionId: mockFunctionId,
      packageId: mockPackageId
    })
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers(); // Reset to real timers before each test
    process.env.STRIPE_SECRET_KEY = 'sk_test_123';
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
    
    // Reset mock client before each test
    mockSupabaseClient = {
      auth: {
        getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
        signInAnonymously: vi.fn().mockResolvedValue({ data: { user: { id: 'anon-123' } }, error: null })
      },
      from: vi.fn((table: string) => ({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null })
      })),
      rpc: vi.fn()
    };
  });

  describe('Raw Payloads Logging', () => {
    it('should log raw payload as first operation', async () => {
      // Set up successful RPC response
      mockSupabaseClient.rpc = vi.fn().mockResolvedValue({
        data: {
          success: true,
          registration_id: 'reg-123',
          confirmationNumber: null
        },
        error: null
      });

      const mockRequest = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        body: JSON.stringify({
          tableCount: 2,
          bookingContact: {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com'
          },
          lodgeDetails: {
            lodgeName: 'Test Lodge',
            lodge_id: '123',
            organisation_id: '456'
          },
          amount: 195000,
          subtotal: 190000,
          stripeFee: 5000
        })
      });

      await POST(mockRequest, mockContext);

      // Verify raw_payloads was called
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('raw_payloads');
    });

    it('should log even if request fails', async () => {
      // Make RPC fail
      mockSupabaseClient.rpc = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'RPC failed' }
      });

      const mockRequest = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        body: JSON.stringify({
          tableCount: 2,
          bookingContact: { email: 'test@example.com', firstName: 'Test', lastName: 'User' },
          lodgeDetails: { lodgeName: 'Test', lodge_id: '123', organisation_id: '456' },
          amount: 1000,
          subtotal: 1000,
          stripeFee: 0
        })
      });

      const response = await POST(mockRequest, mockContext);
      
      // Should still log to raw_payloads even though request failed
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('raw_payloads');
      expect(response.status).toBe(500);
    });
  });

  describe('Organisation ID Handling', () => {
    it('should pass lodge organisation_id to RPC function', async () => {
      mockSupabaseClient.rpc = vi.fn().mockResolvedValue({
        data: {
          success: true,
          registration_id: 'reg-123',
          confirmation_number: null
        },
        error: null
      });

      const mockRequest = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        body: JSON.stringify({
          tableCount: 1,
          bookingContact: {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com'
          },
          lodgeDetails: {
            lodgeName: 'Test Lodge',
            lodge_id: 'lodge-123',
            organisation_id: 'org-456' // This should be passed through
          },
          amount: 195000,
          subtotal: 190000,
          stripeFee: 5000
        })
      });

      await POST(mockRequest, mockContext);

      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('upsert_lodge_registration', 
        expect.objectContaining({
          p_lodge_details: expect.objectContaining({
            organisation_id: 'org-456'
          })
        })
      );
    });
  });

  describe('Payment Flow Status Updates', () => {
    it('should create registration with pending status initially', async () => {
      mockSupabaseClient.rpc = vi.fn().mockResolvedValue({
        data: {
          success: true,
          registration_id: 'reg-123'
        },
        error: null
      });

      const mockRequest = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        body: JSON.stringify({
          tableCount: 1,
          bookingContact: { email: 'test@example.com', firstName: 'Test', lastName: 'User' },
          lodgeDetails: { lodgeName: 'Test Lodge', lodge_id: '123', organisation_id: '456' },
          amount: 195000,
          subtotal: 190000,
          stripeFee: 5000
        })
      });

      await POST(mockRequest, mockContext);

      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('upsert_lodge_registration',
        expect.objectContaining({
          p_payment_status: 'pending' // Should be pending without payment
        })
      );
    });

    it('should update to completed status after successful payment', { timeout: 10000 }, async () => {
      // Mock function data query for payment processing
      mockSupabaseClient.from = vi.fn((table: string) => {
        if (table === 'functions') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: {
                function_id: mockFunctionId,
                name: 'Test Function',
                slug: 'test-function',
                organiser_id: 'org-123',
                organisations: {
                  organisation_id: 'org-123',
                  name: 'Test Organisation',
                  stripe_onbehalfof: null
                }
              },
              error: null
            })
          };
        }
        return {
          insert: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null })
        };
      });
      
      mockSupabaseClient.rpc = vi.fn().mockResolvedValue({
        data: {
          success: true,
          registration_id: 'reg-123',
          confirmationNumber: 'LDG123456AB' // Include confirmation to skip polling
        },
        error: null
      });

      const mockRequest = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        body: JSON.stringify({
          tableCount: 1,
          bookingContact: { email: 'test@example.com', firstName: 'Test', lastName: 'User' },
          lodgeDetails: { lodgeName: 'Test Lodge', lodge_id: '123', organisation_id: '456' },
          paymentMethodId: 'pm_test123', // With payment method
          amount: 195000,
          subtotal: 190000,
          stripeFee: 5000
        })
      });

      await POST(mockRequest, mockContext);

      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('upsert_lodge_registration',
        expect.objectContaining({
          p_payment_status: 'completed' // Should be completed with payment
        })
      );
    });
  });

  describe('Confirmation Number Polling', () => {
    it('should poll for confirmation number after successful payment', { timeout: 20000 }, async () => {
      let pollCount = 0;
      mockSupabaseClient.from = vi.fn((table: string) => {
        if (table === 'lodge_registration_confirmation_view') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockImplementation(() => {
              pollCount++;
              // Return confirmation on 3rd poll
              if (pollCount >= 3) {
                return Promise.resolve({
                  data: { confirmation_number: 'LDG123456AB' },
                  error: null
                });
              }
              return Promise.resolve({ data: null, error: { code: 'PGRST116' } });
            })
          };
        }
        if (table === 'functions') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: {
                function_id: mockFunctionId,
                name: 'Test Function',
                slug: 'test-function',
                organiser_id: 'org-123',
                organisations: {
                  organisation_id: 'org-123',
                  name: 'Test Organisation',
                  stripe_onbehalfof: null
                }
              },
              error: null
            })
          };
        }
        return {
          insert: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null })
        };
      });

      mockSupabaseClient.rpc = vi.fn().mockResolvedValue({
        data: {
          success: true,
          registrationId: 'reg-123'
        },
        error: null
      });

      const mockRequest = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        body: JSON.stringify({
          tableCount: 1,
          bookingContact: { email: 'test@example.com', firstName: 'Test', lastName: 'User' },
          lodgeDetails: { lodgeName: 'Test Lodge', lodge_id: '123', organisation_id: '456' },
          paymentMethodId: 'pm_test123',
          amount: 195000,
          subtotal: 190000,
          stripeFee: 5000
        })
      });

      const response = await POST(mockRequest, mockContext);
      const data = await response.json();

      expect(data.confirmationNumber).toBe('LDG123456AB');
      expect(pollCount).toBeGreaterThanOrEqual(3);
    });

    it('should return error if no confirmation after 5 polls', { timeout: 20000 }, async () => {
      mockSupabaseClient.from = vi.fn((table: string) => {
        if (table === 'lodge_registration_confirmation_view') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
          };
        }
        if (table === 'functions') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: {
                function_id: mockFunctionId,
                name: 'Test Function',
                slug: 'test-function',
                organiser_id: 'org-123',
                organisations: {
                  organisation_id: 'org-123',
                  name: 'Test Organisation',
                  stripe_onbehalfof: null
                }
              },
              error: null
            })
          };
        }
        return {
          insert: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null })
        };
      });

      mockSupabaseClient.rpc = vi.fn().mockResolvedValue({
        data: {
          success: true,
          registrationId: 'reg-123'
        },
        error: null
      });

      const mockRequest = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        body: JSON.stringify({
          tableCount: 1,
          bookingContact: { email: 'test@example.com', firstName: 'Test', lastName: 'User' },
          lodgeDetails: { lodgeName: 'Test Lodge', lodge_id: '123', organisation_id: '456' },
          paymentMethodId: 'pm_test123',
          amount: 195000,
          subtotal: 190000,
          stripeFee: 5000
        })
      });

      const response = await POST(mockRequest, mockContext);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain('Confirmation number generation timeout');
    });
  });

  describe('Ticket Creation Requirements', () => {
    it('should indicate ticket creation is needed in RPC response', async () => {
      mockSupabaseClient.rpc = vi.fn().mockResolvedValue({
        data: {
          success: true,
          registration_id: 'reg-123',
          total_tickets: 20, // 2 tables * 10 tickets per table
          created_tickets: 0 // No tickets created yet
        },
        error: null
      });

      const mockRequest = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        body: JSON.stringify({
          tableCount: 2,
          bookingContact: { email: 'test@example.com', firstName: 'Test', lastName: 'User' },
          lodgeDetails: { lodgeName: 'Test Lodge', lodge_id: '123', organisation_id: '456' },
          amount: 390000,
          subtotal: 380000,
          stripeFee: 10000
        })
      });

      const response = await POST(mockRequest, mockContext);
      const data = await response.json();

      expect(data.totalTickets).toBe(20);
      expect(data.createdTickets).toBe(0);
    });
  });
});