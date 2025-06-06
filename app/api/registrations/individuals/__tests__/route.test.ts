import { describe, it, expect, beforeEach, vi } from 'vitest'
import { POST } from '../route'
import { createClient } from '@/utils/supabase/server'

// Mock Supabase
vi.mock('@/utils/supabase/server', () => ({
  createClient: vi.fn()
}))

describe('Individual Registration API - Data Normalization', () => {
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
          bookingContactId: 'booking-123'
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

  it('should create a customer record from billing details', async () => {
    // Setup mock responses
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'customers') {
        return {
          insert: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { customer_id: 'cust-123' },
            error: null
          })
        }
      }
      return mockSupabase
    })

    await POST(mockRequest)

    // Verify customer creation
    expect(mockSupabase.from).toHaveBeenCalledWith('customers')
    const customerInsertCall = mockSupabase.from.mock.results.find(
      (result: any) => result.value.insert
    )
    
    expect(customerInsertCall.value.insert).toHaveBeenCalledWith({
      customer_id: expect.any(String), // Should use generated UUID
      customer_type: 'booking_contact',
      first_name: 'John',
      last_name: 'Smith',
      email: 'john.smith@example.com',
      phone: '0438 871 124',
      business_name: 'Smith Enterprises',
      address_line1: '100 Harris Street',
      city: 'Chiswick',
      state: 'New South Wales',
      postal_code: '2046',
      country: 'Australia'
    })
  })

  it('should create contact records for all attendees', async () => {
    // Setup mock responses
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'contacts') {
        return {
          insert: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { contact_id: 'contact-123' },
            error: null
          })
        }
      }
      return mockSupabase
    })

    await POST(mockRequest)

    // Verify contact creation for primary attendee
    expect(mockSupabase.from).toHaveBeenCalledWith('contacts')
    const contactInsertCall = mockSupabase.from.mock.results.find(
      (result: any) => result.value.insert
    )
    
    expect(contactInsertCall.value.insert).toHaveBeenCalledWith({
      contact_id: expect.any(String),
      type: 'individual',
      first_name: 'John',
      last_name: 'Smith',
      title: 'Bro',
      email: 'john.smith@example.com',
      mobile_number: '0438 871 124',
      contact_preference: 'Directly',
      dietary_requirements: 'Vegetarian',
      special_needs: 'Wheelchair access',
      auth_user_id: 'd6813cca-36f8-46b0-a4a2-3db97b9d1db2'
    })
  })

  it('should create masonic profile for mason attendees', async () => {
    // Setup mock responses
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'masonic_profiles') {
        return {
          insert: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { profile_id: 'profile-123' },
            error: null
          })
        }
      }
      return mockSupabase
    })

    await POST(mockRequest)

    // Verify masonic profile creation
    expect(mockSupabase.from).toHaveBeenCalledWith('masonic_profiles')
    const profileInsertCall = mockSupabase.from.mock.results.find(
      (result: any) => result.value.insert
    )
    
    expect(profileInsertCall.value.insert).toHaveBeenCalledWith({
      contact_id: expect.any(String),
      rank: 'MM',
      grand_lodge_id: '3e893fa6-2cc2-448c-be9c-e3858cc90e11',
      lodge_id: '4c1479ba-cbaa-2072-f77a-87882c81f1be',
      lodge_name: 'The Leichhardt Lodge No. 133',
      post_nominals: 'PM',
      first_time_attendee: false
    })
  })

  it('should create attendee records with masonic_status JSONB', async () => {
    // Setup mock responses
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'attendees') {
        return {
          insert: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { attendee_id: '019742f8-b1e1-757d-9ec6-e24ec9b8a1dc' },
            error: null
          })
        }
      }
      return mockSupabase
    })

    await POST(mockRequest)

    // Verify attendee creation
    expect(mockSupabase.from).toHaveBeenCalledWith('attendees')
    const attendeeInsertCall = mockSupabase.from.mock.results.find(
      (result: any) => result.value.insert
    )
    
    expect(attendeeInsertCall.value.insert).toHaveBeenCalledWith({
      attendee_id: '019742f8-b1e1-757d-9ec6-e24ec9b8a1dc',
      registration_id: expect.any(String),
      attendee_type: 'mason',
      contact_preference: 'directly',
      title: 'Bro',
      first_name: 'John',
      last_name: 'Smith',
      primary_email: 'john.smith@example.com',
      primary_phone: '0438 871 124',
      is_primary: true,
      dietary_requirements: 'Vegetarian',
      special_needs: 'Wheelchair access',
      contact_id: expect.any(String),
      auth_user_id: 'd6813cca-36f8-46b0-a4a2-3db97b9d1db2',
      masonic_status: {
        rank: 'MM',
        grand_lodge_id: '3e893fa6-2cc2-448c-be9c-e3858cc90e11',
        lodge_id: '4c1479ba-cbaa-2072-f77a-87882c81f1be',
        lodge_name: 'The Leichhardt Lodge No. 133',
        post_nominals: 'PM',
        first_time: false
      }
    })
  })

  it('should create ticket records with proper pricing', async () => {
    // Setup mock to return ticket price
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'event_tickets') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { 
              id: 'd586ecc1-e410-4ef3-a59c-4a53a866bc33',
              price: 150.00,
              title: 'Meet & Greet Cocktail Party'
            },
            error: null
          })
        }
      }
      if (table === 'tickets') {
        return {
          insert: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { ticket_id: 'ticket-123' },
            error: null
          })
        }
      }
      return mockSupabase
    })

    await POST(mockRequest)

    // Verify ticket creation
    expect(mockSupabase.from).toHaveBeenCalledWith('tickets')
    const ticketInsertCall = mockSupabase.from.mock.results.find(
      (result: any) => result.value.insert
    )
    
    expect(ticketInsertCall.value.insert).toHaveBeenCalledWith({
      ticket_id: expect.any(String),
      attendee_id: '019742f8-b1e1-757d-9ec6-e24ec9b8a1dc',
      event_id: 'e842bdb2-aff8-46d8-a347-bf50840fff13',
      registration_id: expect.any(String),
      event_ticket_id: 'd586ecc1-e410-4ef3-a59c-4a53a866bc33',
      ticket_type_id: 'd586ecc1-e410-4ef3-a59c-4a53a866bc33',
      price_paid: 150.00,
      original_price: 150.00,
      ticket_price: 150.00,
      currency: 'AUD',
      status: 'sold',
      ticket_status: 'sold',
      payment_status: 'pending',
      purchased_at: expect.any(String)
    })
  })

  it('should create registration record with all monetary fields', async () => {
    // Setup mock responses
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'registrations') {
        return {
          insert: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { 
              registration_id: 'reg-123',
              confirmation_number: 'IND123456AB'
            },
            error: null
          })
        }
      }
      return mockSupabase
    })

    await POST(mockRequest)

    // Verify registration creation
    expect(mockSupabase.from).toHaveBeenCalledWith('registrations')
    const registrationInsertCall = mockSupabase.from.mock.results.find(
      (result: any) => result.value.insert
    )
    
    expect(registrationInsertCall.value.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        registration_id: expect.any(String),
        customer_id: expect.any(String),
        function_id: 'eebddef5-6833-43e3-8d32-700508b1c089',
        event_id: 'e842bdb2-aff8-46d8-a347-bf50840fff13',
        registration_type: 'individuals',
        status: 'pending',
        payment_status: 'pending',
        subtotal: 150.00,
        stripe_fee: 4.43,
        total_amount_paid: 154.43,
        total_price_paid: 154.43,
        attendee_count: 1,
        auth_user_id: 'd6813cca-36f8-46b0-a4a2-3db97b9d1db2',
        agree_to_terms: true,
        registration_data: expect.any(Object),
        primary_attendee_id: '019742f8-b1e1-757d-9ec6-e24ec9b8a1dc',
        booking_contact_id: expect.any(String)
      })
    )
  })

  it('should handle transaction rollback on failure', async () => {
    // Mock a failure in customer creation
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'customers') {
        return {
          insert: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error' }
          })
        }
      }
      return mockSupabase
    })

    const response = await POST(mockRequest)
    const result = await response.json()

    expect(response.status).toBe(500)
    expect(result.error).toContain('Failed to create registration')
  })

  it('should map contact preferences correctly', async () => {
    // Test with different contact preferences
    const requestWithPreference = {
      ...mockRequest,
      json: vi.fn().mockResolvedValue({
        ...await mockRequest.json(),
        primaryAttendee: {
          ...await mockRequest.json().then((d: any) => d.primaryAttendee),
          contactPreference: 'PrimaryAttendee'
        }
      })
    }

    await POST(requestWithPreference)

    // Verify lowercase conversion for enum
    const attendeeInsertCall = mockSupabase.from.mock.results.find(
      (result: any) => result.value.insert
    )
    
    expect(attendeeInsertCall.value.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        contact_preference: 'primaryattendee' // Should be lowercase
      })
    )
  })

  it('should create contact record for booking contact', async () => {
    // Setup mock responses
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'contacts') {
        return {
          insert: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { contact_id: 'contact-456' },
            error: null
          })
        }
      }
      return mockSupabase
    })

    await POST(mockRequest)

    // Should create two contacts - one for attendee, one for booking
    const contactCalls = mockSupabase.from.mock.calls.filter(
      (call: any) => call[0] === 'contacts'
    )
    
    expect(contactCalls).toHaveLength(2)
    
    // Verify booking contact creation
    const bookingContactCall = contactCalls[1]
    expect(bookingContactCall[0]).toBe('contacts')
  })
})