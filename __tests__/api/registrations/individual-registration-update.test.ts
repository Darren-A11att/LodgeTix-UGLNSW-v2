import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';

// Create mock client reference that will be populated
let mockSupabaseClient: any;
let mockCreateClientWithToken: any;

// Mock dependencies first
vi.mock('@/utils/supabase/server', () => ({
  createClient: vi.fn().mockImplementation(async () => mockSupabaseClient)
}));

vi.mock('@/utils/supabase/server-with-token', () => ({
  createClientWithToken: vi.fn().mockImplementation(async () => ({
    supabase: mockSupabaseClient,
    user: { id: '423e4567-e89b-12d3-a456-426614174000' }
  }))
}));

// Import route handlers after mocks
import { POST, PUT } from '@/app/api/registrations/individuals/route';

describe('Individual Registration API Updates', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    
    // Reset mock client before each test
    mockSupabaseClient = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ 
          data: { user: { id: '423e4567-e89b-12d3-a456-426614174000' } }, 
          error: null 
        })
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
    it('should log raw payload for individual registration', async () => {
      // Set up successful RPC response
      mockSupabaseClient.rpc = vi.fn().mockResolvedValue({
        data: {
          success: true,
          registrationId: '323e4567-e89b-12d3-a456-426614174000',
          confirmationNumber: 'IND-123456'
        },
        error: null
      });

      const mockRequest = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: {
          'authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          primaryAttendee: {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            attendeeType: 'mason',
            lodgeOrganisationId: 'org-456'
          },
          additionalAttendees: [],
          tickets: [],
          totalAmount: 19500,
          subtotal: 19000,
          stripeFee: 500,
          paymentIntentId: null,
          billingDetails: {
            firstName: 'John',
            lastName: 'Doe',
            emailAddress: 'john@example.com',
            mobileNumber: '0412345678'
          },
          eventId: '123e4567-e89b-12d3-a456-426614174000',
          functionId: '223e4567-e89b-12d3-a456-426614174000',
          customerId: '423e4567-e89b-12d3-a456-426614174000',
          billToPrimaryAttendee: true,
          agreeToTerms: true
        })
      });

      await POST(mockRequest);

      // Verify raw_registrations was called
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('raw_registrations');
    });
  });

  describe('Organisation ID Handling', () => {
    it('should extract organisation_id from primary attendee if Mason', async () => {
      mockSupabaseClient.rpc = vi.fn().mockResolvedValue({
        data: {
          success: true,
          registrationId: '323e4567-e89b-12d3-a456-426614174000',
          confirmationNumber: 'IND-123456'
        },
        error: null
      });

      const mockRequest = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: {
          'authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          primaryAttendee: {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            attendeeType: 'mason',
            lodgeOrganisationId: 'org-789' // This should be passed to RPC
          },
          additionalAttendees: [],
          tickets: [],
          totalAmount: 19500,
          subtotal: 19000,
          stripeFee: 500,
          billingDetails: {
            firstName: 'John',
            lastName: 'Doe',
            emailAddress: 'john@example.com'
          },
          functionId: '223e4567-e89b-12d3-a456-426614174000',
          customerId: '423e4567-e89b-12d3-a456-426614174000'
        })
      });

      await POST(mockRequest);

      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('upsert_individual_registration', 
        expect.objectContaining({
          p_registration_data: expect.objectContaining({
            primaryAttendee: expect.objectContaining({
              lodgeOrganisationId: 'org-789'
            })
          })
        })
      );
    });
  });

  describe('Payment Status Updates', () => {
    it('should update both status fields for payment completion', async () => {
      // Mock existing registration
      mockSupabaseClient.from = vi.fn((table: string) => {
        if (table === 'registrations') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: {
                registration_id: '323e4567-e89b-12d3-a456-426614174000',
                function_id: '223e4567-e89b-12d3-a456-426614174000',
                auth_user_id: '423e4567-e89b-12d3-a456-426614174000',
                confirmation_number: 'IND-123456',
                subtotal: 19000,
                stripe_fee: 500
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
          registrationId: '323e4567-e89b-12d3-a456-426614174000',
          confirmationNumber: 'IND-123456'
        },
        error: null
      });

      const mockRequest = new NextRequest('http://localhost:3000/api/test', {
        method: 'PUT',
        body: JSON.stringify({
          registrationId: '323e4567-e89b-12d3-a456-426614174000',
          paymentIntentId: 'pi_test123',
          totalAmountPaid: 19500
        })
      });

      await PUT(mockRequest);

      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('upsert_individual_registration',
        expect.objectContaining({
          p_registration_data: expect.objectContaining({
            paymentCompleted: true,
            paymentStatus: 'completed', // Both status fields set
            status: 'completed'
          })
        })
      );
    });
  });

  describe('Confirmation Number Polling', () => {
    it('should poll for confirmation number after payment', { timeout: 20000 }, async () => {
      let pollCount = 0;
      
      // Mock event data
      mockSupabaseClient.from = vi.fn((table: string) => {
        if (table === 'events') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { title: 'Test Event' },
              error: null
            })
          };
        }
        if (table === 'individuals_registration_confirmation_view') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockImplementation(() => {
              pollCount++;
              // Return confirmation on 2nd poll
              if (pollCount >= 2) {
                return Promise.resolve({
                  data: { confirmation_number: 'IND-789012' },
                  error: null
                });
              }
              return Promise.resolve({ data: null, error: { code: 'PGRST116' } });
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
          registrationId: '323e4567-e89b-12d3-a456-426614174000'
          // No confirmation number initially
        },
        error: null
      });

      const mockRequest = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: {
          'authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          primaryAttendee: {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            attendeeType: 'guest'
          },
          additionalAttendees: [],
          tickets: [],
          totalAmount: 19500,
          subtotal: 19000,
          stripeFee: 500,
          paymentIntentId: 'pi_test123', // With payment
          billingDetails: {
            firstName: 'John',
            lastName: 'Doe',
            emailAddress: 'john@example.com'
          },
          eventId: '123e4567-e89b-12d3-a456-426614174000',
          functionId: '223e4567-e89b-12d3-a456-426614174000',
          customerId: '423e4567-e89b-12d3-a456-426614174000'
        })
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.confirmationNumber).toBe('IND-789012');
      expect(pollCount).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Registration View Fetching', () => {
    it('should fetch complete registration view after creation', async () => {
      mockSupabaseClient.from = vi.fn((table: string) => {
        if (table === 'individuals_registration_complete_view') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: {
                registration_id: '323e4567-e89b-12d3-a456-426614174000',
                attendees: [{}, {}],
                total_tickets: 2,
                total_contacts_created: 1
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
          registrationId: '323e4567-e89b-12d3-a456-426614174000',
          confirmationNumber: 'IND-123456'
        },
        error: null
      });

      const mockRequest = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: {
          'authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          primaryAttendee: {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com'
          },
          additionalAttendees: [],
          tickets: [],
          totalAmount: 0,
          billingDetails: {
            firstName: 'John',
            lastName: 'Doe',
            emailAddress: 'john@example.com'
          },
          functionId: '223e4567-e89b-12d3-a456-426614174000',
          customerId: '423e4567-e89b-12d3-a456-426614174000'
        })
      });

      await POST(mockRequest);

      // Verify it attempted to fetch the registration view
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('individuals_registration_complete_view');
    });
  });
});