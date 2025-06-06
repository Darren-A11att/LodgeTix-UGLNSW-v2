import { describe, it, expect, beforeEach, vi } from 'vitest'
import { POST } from '../route'
import { createClient } from '@/utils/supabase/server'

// Mock Supabase
vi.mock('@/utils/supabase/server', () => ({
  createClient: vi.fn()
}))

describe('Individual Registration API - RPC Integration', () => {
  let mockSupabase: any
  let mockRequest: any

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks()

    // Setup mock Supabase client
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockReturnThis(),
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'd6813cca-36f8-46b0-a4a2-3db97b9d1db2' } },
          error: null
        })
      },
      rpc: vi.fn().mockResolvedValue({
        data: {
          success: true,
          registrationId: 'reg-123',
          customerId: 'd6813cca-36f8-46b0-a4a2-3db97b9d1db2',
          bookingContactId: 'booking-123',
          confirmationNumber: null
        },
        error: null
      })
    }

    ;(createClient as any).mockResolvedValue(mockSupabase)

    // Setup mock request with complete registration data
    mockRequest = {
      headers: {
        get: vi.fn().mockReturnValue(null) // No auth header in tests
      },
      url: 'http://localhost:3000/api/registrations/individuals',
      json: vi.fn().mockResolvedValue({
        eventId: "e842bdb2-aff8-46d8-a347-bf50840fff13",
        functionId: "eebddef5-6833-43e3-8d32-700508b1c089",
        registrationType: "individuals",
        customerId: "d6813cca-36f8-46b0-a4a2-3db97b9d1db2",
        authUserId: "d6813cca-36f8-46b0-a4a2-3db97b9d1db2",
        billingDetails: {
          firstName: "John",
          lastName: "Smith",
          emailAddress: "john.smith@example.com",
          mobileNumber: "0438 871 124",
          addressLine1: "100 Harris Street",
          suburb: "Chiswick",
          stateTerritory: {
            id: 3909,
            name: "New South Wales",
            isoCode: "NSW",
            countryCode: "AU"
          },
          postcode: "2046",
          country: {
            id: 14,
            name: "Australia",
            isoCode: "AU"
          },
          businessName: "Smith Enterprises"
        },
        primaryAttendee: {
          attendeeId: "019742f8-b1e1-757d-9ec6-e24ec9b8a1dc",
          attendeeType: "mason",
          isPrimary: true,
          title: "Bro",
          firstName: "John",
          lastName: "Smith",
          primaryEmail: "john.smith@example.com",
          primaryPhone: "0438 871 124",
          contactPreference: "Directly",
          rank: "MM",
          grand_lodge_id: "3e893fa6-2cc2-448c-be9c-e3858cc90e11",
          lodge_id: "4c1479ba-cbaa-2072-f77a-87882c81f1be",
          lodgeNameNumber: "The Leichhardt Lodge No. 133",
          postNominals: "PM",
          firstTime: false,
          dietaryRequirements: "Vegetarian",
          specialNeeds: "Wheelchair access"
        },
        tickets: [
          {
            id: "019742f8-b1e1-757d-9ec6-e24ec9b8a1dc-d586ecc1-e410-4ef3-a59c-4a53a866bc33",
            attendeeId: "019742f8-b1e1-757d-9ec6-e24ec9b8a1dc",
            eventTicketId: "d586ecc1-e410-4ef3-a59c-4a53a866bc33",
            isPackage: false,
            price: 150.00
          }
        ],
        subtotal: 150.00,
        stripeFee: 4.43,
        totalAmount: 154.43,
        agreeToTerms: true
      })
    }
  })

  it('should call upsert_individual_registration RPC with correct data structure', async () => {
    await POST(mockRequest)

    // Verify RPC was called
    expect(mockSupabase.rpc).toHaveBeenCalledWith('upsert_individual_registration', {
      p_registration_data: expect.objectContaining({
        registrationId: null,
        functionId: 'eebddef5-6833-43e3-8d32-700508b1c089',
        eventId: 'e842bdb2-aff8-46d8-a347-bf50840fff13',
        registrationType: 'individuals',
        authUserId: 'd6813cca-36f8-46b0-a4a2-3db97b9d1db2',
        primaryAttendee: expect.objectContaining({
          attendeeId: '019742f8-b1e1-757d-9ec6-e24ec9b8a1dc',
          firstName: 'John',
          lastName: 'Smith'
        }),
        billingDetails: expect.objectContaining({
          firstName: 'John',
          lastName: 'Smith',
          emailAddress: 'john.smith@example.com'
        }),
        tickets: expect.arrayContaining([
          expect.objectContaining({
            attendeeId: '019742f8-b1e1-757d-9ec6-e24ec9b8a1dc',
            eventTicketId: 'd586ecc1-e410-4ef3-a59c-4a53a866bc33'
          })
        ]),
        totalAmount: 154.43,
        subtotal: 150.00,
        stripeFee: 4.43,
        agreeToTerms: true
      })
    })
  })

  it('should include masonic data in primaryAttendee object', async () => {
    await POST(mockRequest)

    const rpcCall = mockSupabase.rpc.mock.calls[0]
    const registrationData = rpcCall[1].p_registration_data
    
    expect(registrationData.primaryAttendee).toMatchObject({
      attendeeType: 'mason',
      rank: 'MM',
      grand_lodge_id: '3e893fa6-2cc2-448c-be9c-e3858cc90e11',
      lodge_id: '4c1479ba-cbaa-2072-f77a-87882c81f1be',
      lodgeNameNumber: 'The Leichhardt Lodge No. 133',
      postNominals: 'PM',
      firstTime: false
    })
  })

  it('should handle successful RPC response', async () => {
    const response = await POST(mockRequest)
    const result = await response.json()

    expect(response.status).toBe(200)
    expect(result).toMatchObject({
      success: true,
      registrationId: 'reg-123',
      registrationData: {
        registration_id: 'reg-123',
        customer_id: 'd6813cca-36f8-46b0-a4a2-3db97b9d1db2',
        booking_contact_id: 'booking-123'
      }
    })
  })

  it('should handle RPC errors gracefully', async () => {
    mockSupabase.rpc.mockResolvedValueOnce({
      data: null,
      error: { message: 'Database error' }
    })

    const response = await POST(mockRequest)
    const result = await response.json()

    expect(response.status).toBe(500)
    expect(result.error).toContain('Failed to create registration')
  })

  it('should validate required fields before RPC call', async () => {
    // Test without functionId
    const invalidRequest = {
      ...mockRequest,
      json: vi.fn().mockResolvedValue({
        ...await mockRequest.json(),
        functionId: null
      })
    }

    const response = await POST(invalidRequest)
    const result = await response.json()

    expect(response.status).toBe(400)
    expect(result.error).toBe('Function ID is required for registration')
    expect(mockSupabase.rpc).not.toHaveBeenCalled()
  })

  it('should handle additional attendees in RPC data', async () => {
    const requestWithAdditional = {
      ...mockRequest,
      json: vi.fn().mockResolvedValue({
        ...await mockRequest.json(),
        additionalAttendees: [{
          attendeeId: 'guest-123',
          attendeeType: 'guest',
          firstName: 'Jane',
          lastName: 'Doe',
          title: 'Ms',
          primaryEmail: 'jane.doe@example.com',
          contactPreference: 'PrimaryAttendee'
        }]
      })
    }

    await POST(requestWithAdditional)

    const rpcCall = mockSupabase.rpc.mock.calls[0]
    const registrationData = rpcCall[1].p_registration_data
    
    expect(registrationData.additionalAttendees).toHaveLength(1)
    expect(registrationData.additionalAttendees[0]).toMatchObject({
      firstName: 'Jane',
      lastName: 'Doe'
    })
  })

  it('should map billing details correctly for RPC', async () => {
    await POST(mockRequest)

    const rpcCall = mockSupabase.rpc.mock.calls[0]
    const billingDetails = rpcCall[1].p_registration_data.billingDetails
    
    expect(billingDetails).toMatchObject({
      firstName: 'John',
      lastName: 'Smith',
      emailAddress: 'john.smith@example.com',
      mobileNumber: '0438 871 124',
      addressLine1: '100 Harris Street',
      suburb: 'Chiswick',
      postcode: '2046',
      businessName: 'Smith Enterprises'
    })
    
    // State and country should be passed as objects
    expect(billingDetails.stateTerritory).toMatchObject({
      name: 'New South Wales'
    })
    expect(billingDetails.country).toMatchObject({
      name: 'Australia'
    })
  })

  it('should handle payment completion correctly', async () => {
    const requestWithPayment = {
      ...mockRequest,
      json: vi.fn().mockResolvedValue({
        ...await mockRequest.json(),
        paymentIntentId: 'pi_123456',
        paymentCompleted: true
      })
    }

    // Mock the confirmation view for payment polling
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'individuals_registration_confirmation_view') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { confirmation_number: 'IND123456AB' },
            error: null
          })
        }
      }
      return mockSupabase
    })

    await POST(requestWithPayment)

    const rpcCall = mockSupabase.rpc.mock.calls[0]
    const registrationData = rpcCall[1].p_registration_data
    
    expect(registrationData.paymentIntentId).toBe('pi_123456')
    expect(registrationData.paymentCompleted).toBe(false) // Always false in initial call
  })
})