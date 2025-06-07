import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';

// Create mock client reference that will be populated
let mockSupabaseClient: any;
let rawRegistrationsData: any[] = [];
let rawPayloadsData: any[] = [];

// Mock dependencies first
vi.mock('@/utils/supabase/server', () => ({
  createClient: vi.fn().mockImplementation(async () => mockSupabaseClient)
}));

vi.mock('@/utils/supabase/server-with-token', () => ({
  createClientWithToken: vi.fn().mockImplementation(async () => ({
    supabase: mockSupabaseClient,
    user: { id: 'test-user-123' }
  }))
}));

// Import route handlers after mocks
import { POST as individualsPost } from '@/app/api/registrations/individuals/route';
import { POST as lodgePost } from '@/app/api/registrations/lodge/route';
import { POST as delegationPost } from '@/app/api/registrations/delegation/route';

/**
 * Complete test data representing the full UnifiedAttendeeData structure
 * that should be captured in raw_registrations
 */
const completeIndividualRegistrationData = {
  // API-level data
  eventId: "e842bdb2-aff8-46d8-a347-bf50840fff13",
  functionId: "eebddef5-6833-43e3-8d32-700508b1c089",
  functionSlug: "grand-proclamation-2025",
  customerId: "test-user-123",
  totalAmount: 100,
  subtotal: 95,
  stripeFee: 5,
  paymentIntentId: null,
  registrationType: "individual",
  
  // Billing details
  billingDetails: {
    firstName: "TestFirst",
    lastName: "TestLast",
    emailAddress: "test@example.com",
    mobileNumber: "0412345678",
    addressLine1: "123 Test Street",
    addressLine2: "Unit 1",
    suburb: "Test Suburb",
    postcode: "2000",
    country: { id: 14, name: "Australia", isoCode: "AU" },
    stateTerritory: { id: 3909, name: "New South Wales", isoCode: "NSW", countryCode: "AU" },
    businessName: "",
    billToPrimary: true
  },
  
  // Primary attendee with COMPLETE data structure
  primaryAttendee: {
    // Basic identification
    attendeeId: "019742f8-b1e1-757d-9ec6-e24ec9b8a1dc",
    attendeeType: "mason",
    isPrimary: true,
    isPartner: null,
    
    // Personal details
    title: "Bro",
    firstName: "TestFirst",
    lastName: "TestLast",
    suffix: "",
    
    // Contact information
    primaryEmail: "test@example.com",
    primaryPhone: "0412345678",
    contactPreference: "Directly",
    contactConfirmed: false,
    
    // Mason-specific data
    rank: "EAF",
    postNominals: "PDDGM",
    grand_lodge_id: "3e893fa6-2cc2-448c-be9c-e3858cc90e11",
    lodge_id: "4c1479ba-cbaa-2072-f77a-87882c81f1be",
    lodgeNameNumber: "The Leichhardt Lodge No. 133",
    grandLodgeOrganisationId: "3e893fa6-2cc2-448c-be9c-e3858cc90e11",
    lodgeOrganisationId: "4c1479ba-cbaa-2072-f77a-87882c81f1be",
    grandLodgeName: "United Grand Lodge of NSW & ACT",
    lodgeName: "The Leichhardt Lodge No. 133",
    
    // Grand Officer details
    grandOfficerStatus: "Present",
    presentGrandOfficerRole: "Grand Secretary",
    otherGrandOfficerRole: "",
    isGrandOfficer: true,
    grandOfficerRole: "Grand Secretary",
    
    // Requirements and preferences
    dietaryRequirements: "Vegetarian",
    specialNeeds: "Wheelchair access required",
    
    // Event-specific
    firstTime: false,
    tableAssignment: null,
    notes: "VIP guest",
    
    // Status tracking
    paymentStatus: "pending",
    isCheckedIn: false,
    
    // Relationship data
    relationship: "",
    partner: null,
    partnerOf: null,
    guestOfId: null,
    parentId: null,
    
    // Metadata
    createdAt: "2025-06-06T02:14:30.216Z",
    updatedAt: "2025-06-06T02:14:30.216Z"
  },
  
  // Additional attendees array (can be empty for individual)
  additionalAttendees: [],
  
  // Tickets array
  tickets: [{
    id: "019742f8-b1e1-757d-9ec6-e24ec9b8a1dc-d586ecc1-e410-4ef3-a59c-4a53a866bc33",
    price: 100,
    isPackage: false,
    attendeeId: "019742f8-b1e1-757d-9ec6-e24ec9b8a1dc",
    eventTicketId: "d586ecc1-e410-4ef3-a59c-4a53a866bc33"
  }],
  
  // Selected events
  selectedEvents: ["e842bdb2-aff8-46d8-a347-bf50840fff13"],
  
  // Terms and conditions
  agreeToTerms: true,
  billToPrimaryAttendee: false
};

/**
 * Complete lodge registration data
 */
const completeLodgeRegistrationData = {
  functionId: "eebddef5-6833-43e3-8d32-700508b1c089",
  packageId: "package-123",
  tableCount: 2,
  totalAmount: 500,
  subtotal: 475,
  stripeFee: 25,
  customerId: "test-user-123",
  
  // Lodge details with complete data
  lodgeDetails: {
    lodgeName: "Test Lodge No. 999",
    lodge_id: "lodge-uuid-123",
    grand_lodge_id: "grand-lodge-uuid-456",
    lodgeNumber: "999",
    meetingNight: "Second Tuesday",
    district: "District 5",
    secretary: {
      name: "Brother Secretary",
      email: "secretary@testlodge.org",
      phone: "0412000000"
    },
    masterOfLodge: {
      name: "Worshipful Master",
      email: "master@testlodge.org", 
      phone: "0413000000"
    },
    additionalInfo: "Founded 1925"
  },
  
  // Billing details
  billingDetails: {
    firstName: "Lodge",
    lastName: "Secretary",
    emailAddress: "secretary@testlodge.org",
    mobileNumber: "0412000000",
    addressLine1: "123 Lodge Street",
    suburb: "Lodge City",
    postcode: "2001",
    country: { code: 'AU', name: 'Australia' },
    stateTerritory: { code: 'NSW', name: 'New South Wales' },
    businessName: "Test Lodge No. 999",
    dietaryRequirements: "Halal meals for 3 attendees",
    specialNeeds: "One wheelchair accessible table"
  },
  
  agreeToTerms: true
};

/**
 * Complete delegation registration data  
 */
const completeDelegationRegistrationData = {
  functionId: "eebddef5-6833-43e3-8d32-700508b1c089",
  totalAmount: 1000,
  subtotal: 950,
  stripeFee: 50,
  customerId: "test-user-123",
  
  // Delegation details
  delegationDetails: {
    organisationName: "Test Masonic Organization",
    organisationType: "Grand Lodge",
    organisation_id: "org-uuid-789",
    representativeCount: 10,
    headOfDelegation: {
      title: "MW",
      firstName: "Grand",
      lastName: "Master",
      email: "grandmaster@org.org",
      phone: "0414000000",
      rank: "Grand Master"
    },
    secretary: {
      title: "RW",
      firstName: "Grand",
      lastName: "Secretary", 
      email: "secretary@org.org",
      phone: "0415000000",
      rank: "Grand Secretary"
    }
  },
  
  // All attendees in delegation
  attendees: [
    {
      attendeeId: "delegation-attendee-1",
      title: "MW",
      firstName: "Grand",
      lastName: "Master",
      rank: "Grand Master",
      attendeeType: "mason",
      isPrimary: true,
      organisation_id: "org-uuid-789",
      grand_lodge_id: "grand-lodge-uuid-456",
      primaryEmail: "grandmaster@org.org",
      primaryPhone: "0414000000"
    },
    {
      attendeeId: "delegation-attendee-2", 
      title: "RW",
      firstName: "Grand",
      lastName: "Secretary",
      rank: "Grand Secretary",
      attendeeType: "mason",
      isPrimary: false,
      organisation_id: "org-uuid-789",
      grand_lodge_id: "grand-lodge-uuid-456",
      primaryEmail: "secretary@org.org",
      primaryPhone: "0415000000"
    }
  ],
  
  // Billing details
  billingDetails: {
    firstName: "Grand",
    lastName: "Master",
    emailAddress: "grandmaster@org.org",
    mobileNumber: "0414000000",
    addressLine1: "789 Grand Lodge Street",
    suburb: "Capital City",
    postcode: "2002", 
    businessName: "Test Masonic Organization"
  },
  
  agreeToTerms: true
};

describe('Raw Registration Data Capture Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    rawRegistrationsData = [];
    rawPayloadsData = [];
    
    // Mock successful RPC responses
    mockSupabaseClient = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ 
          data: { user: { id: 'test-user-123' } }, 
          error: null 
        })
      },
      from: vi.fn((table: string) => {
        if (table === 'raw_registrations') {
          return {
            insert: vi.fn().mockImplementation((data) => {
              rawRegistrationsData.push(data);
              return Promise.resolve({ data: null, error: null });
            }),
            update: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            is: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis()
          };
        }
        if (table === 'raw_payloads') {
          return {
            insert: vi.fn().mockImplementation((data) => {
              rawPayloadsData.push(data);
              return Promise.resolve({ data: null, error: null });
            })
          };
        }
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
        if (table === 'customers') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: {
                customer_id: 'test-user-123',
                email: 'test@example.com',
                first_name: 'TestFirst',
                last_name: 'TestLast',
                phone: '0412345678',
                created_at: '2025-06-06T02:14:30.216Z',
                business_name: '',
                address_line1: '123 Test Street',
                city: 'Test Suburb',
                state: 'NSW',
                postal_code: '2000',
                country: 'AU'
              },
              error: null
            })
          };
        }
        if (table === 'individuals_registration_complete_view') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { attendees: [], total_tickets: 0, total_contacts_created: 0 },
              error: null
            })
          };
        }
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null })
        };
      }),
      rpc: vi.fn().mockResolvedValue({
        data: {
          success: true,
          registrationId: 'test-registration-123',
          confirmationNumber: 'CONF-123456'
        },
        error: null
      })
    };
  });

  describe('Individual Registration Data Capture', () => {
    it('should capture comprehensive registration data including pricing and server processing', async () => {
      const mockRequest = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: { 'authorization': 'Bearer test-token' },
        body: JSON.stringify(completeIndividualRegistrationData)
      });

      await individualsPost(mockRequest);

      // Should now have 3 entries: frontend_form, complete_processed, and final_result
      expect(rawRegistrationsData).toHaveLength(3);
      
      // Test frontend form data capture
      const frontendData = rawRegistrationsData.find(r => r.registration_type === 'individuals_frontend');
      expect(frontendData).toBeDefined();
      expect(frontendData.raw_data.source).toBe('frontend_form_submission');
      expect(frontendData.raw_data.form_data).toEqual(completeIndividualRegistrationData);
      
      // Test complete processed data capture
      const processedData = rawRegistrationsData.find(r => r.registration_type === 'individuals_complete');
      expect(processedData).toBeDefined();
      expect(processedData.raw_data.source).toBe('complete_server_processed_data');
      expect(processedData.raw_data.original_form_data).toEqual(completeIndividualRegistrationData);
      
      // Verify server-processed RPC data is captured
      const rpcData = processedData.raw_data.processed_registration_data;
      expect(rpcData.registrationType).toBe('individuals');
      expect(rpcData.totalAmount).toBe(100);
      expect(rpcData.subtotal).toBe(95);
      expect(rpcData.stripeFee).toBe(5);
      expect(rpcData.functionId).toBe("eebddef5-6833-43e3-8d32-700508b1c089");
      
      // Verify gap analysis metadata
      const gapAnalysis = processedData.raw_data.data_gaps_analysis;
      expect(gapAnalysis.has_pricing_data).toBe(true);
      expect(gapAnalysis.ticket_count).toBe(1);
      expect(gapAnalysis.attendee_count).toBe(1);
      
      // Test final result data capture
      const finalData = rawRegistrationsData.find(r => r.registration_type === 'individuals_final_result');
      expect(finalData).toBeDefined();
      expect(finalData.raw_data.source).toBe('final_registration_result');
      expect(finalData.raw_data.generated_data.final_registration_id).toBe('test-registration-123');
      expect(finalData.raw_data.generated_data.confirmation_number).toBe('CONF-123456');
    });

    it('should demonstrate data preservation vs original incomplete capture', async () => {
      // This test shows that our comprehensive capture now preserves data that was previously lost
      const mockRequest = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: { 'authorization': 'Bearer test-token' },
        body: JSON.stringify(completeIndividualRegistrationData)
      });

      await individualsPost(mockRequest);

      // Get the processed data that contains complete attendee information
      const processedData = rawRegistrationsData.find(r => r.registration_type === 'individuals_complete');
      const rpcAttendee = processedData.raw_data.processed_registration_data.primaryAttendee;
      
      // These fields are now PRESERVED in the processed data (previously lost)
      expect(rpcAttendee.postNominals).toBe("PDDGM");
      expect(rpcAttendee.lodgeNameNumber).toBe("The Leichhardt Lodge No. 133");
      expect(rpcAttendee.grandOfficerStatus).toBe("Present");
      expect(rpcAttendee.contactConfirmed).toBe(false);
      expect(rpcAttendee.createdAt).toBe("2025-06-06T02:14:30.216Z");
      
      // Verify comprehensive data structure
      expect(Object.keys(rpcAttendee)).toContain('grandLodgeOrganisationId');
      expect(Object.keys(rpcAttendee)).toContain('lodgeOrganisationId');
      expect(Object.keys(rpcAttendee)).toContain('grandLodgeName');
      expect(Object.keys(rpcAttendee)).toContain('presentGrandOfficerRole');
    });
  });

  describe('Lodge Registration Data Capture', () => {
    it('should capture comprehensive lodge registration data', async () => {
      const mockRequest = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: { 'authorization': 'Bearer test-token' },
        body: JSON.stringify(completeLodgeRegistrationData)
      });

      await lodgePost(mockRequest);

      // Should have 2 entries: initial form data and complete processed data
      expect(rawRegistrationsData).toHaveLength(2);
      
      // Test complete processed data capture
      const processedData = rawRegistrationsData.find(r => r.registration_type === 'lodge_complete');
      expect(processedData).toBeDefined();
      expect(processedData.raw_data.source).toBe('complete_lodge_server_processed_data');
      
      // Verify ALL lodge detail fields are preserved in processed data
      const capturedLodgeDetails = processedData.raw_data.original_form_data.lodgeDetails;
      expect(capturedLodgeDetails.meetingNight).toBe("Second Tuesday");
      expect(capturedLodgeDetails.district).toBe("District 5");
      expect(capturedLodgeDetails.secretary.name).toBe("Brother Secretary");
      expect(capturedLodgeDetails.masterOfLodge.name).toBe("Worshipful Master");
      expect(capturedLodgeDetails.additionalInfo).toBe("Founded 1925");
      
      // Verify lodge context metadata
      const lodgeContext = processedData.raw_data.lodge_context;
      expect(lodgeContext.lodge_name).toBe("Test Lodge No. 999");
      expect(lodgeContext.table_count).toBe(2);
      expect(lodgeContext.total_amount_paid).toBe(500);
      expect(lodgeContext.subtotal).toBe(475);
      expect(lodgeContext.stripe_fee).toBe(25);
    });
  });

  describe('Delegation Registration Data Capture', () => {
    it('should capture ALL delegation registration fields in raw_registrations', async () => {
      const mockRequest = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: { 'authorization': 'Bearer test-token' },
        body: JSON.stringify(completeDelegationRegistrationData)
      });

      await delegationPost(mockRequest);

      // Verify raw_registrations was called with complete data (now implemented)
      expect(rawRegistrationsData).toHaveLength(1);
      const capturedData = rawRegistrationsData[0];
      
      // Check that the raw_data contains the complete input
      expect(capturedData.raw_data).toEqual(completeDelegationRegistrationData);
      expect(capturedData.registration_type).toBe('delegation');
      
      // Verify delegation-specific fields
      const delegation = capturedData.raw_data.delegationDetails;
      expect(delegation.representativeCount).toBe(10);
      expect(delegation.headOfDelegation.rank).toBe("Grand Master");
      expect(delegation.secretary.rank).toBe("Grand Secretary");
      
      // Verify all attendees are captured
      expect(capturedData.raw_data.attendees).toHaveLength(2);
      const firstAttendee = capturedData.raw_data.attendees[0];
      expect(firstAttendee.rank).toBe("Grand Master");
      expect(firstAttendee.isPrimary).toBe(true);
    });
  });

  describe('Data Consistency Validation', () => {
    it('should preserve exact data types and structure in processed data', async () => {
      const mockRequest = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: { 'authorization': 'Bearer test-token' },
        body: JSON.stringify(completeIndividualRegistrationData)
      });

      await individualsPost(mockRequest);

      // Get the processed data entry
      const processedData = rawRegistrationsData.find(r => r.registration_type === 'individuals_complete');
      expect(processedData).toBeDefined();
      
      const rpcData = processedData.raw_data.processed_registration_data;
      
      // Verify data types are preserved in processed RPC data
      expect(typeof rpcData.totalAmount).toBe('number');
      expect(typeof rpcData.subtotal).toBe('number');
      expect(typeof rpcData.stripeFee).toBe('number');
      expect(typeof rpcData.primaryAttendee.contactConfirmed).toBe('boolean');
      expect(typeof rpcData.primaryAttendee.firstTime).toBe('boolean');
      expect(Array.isArray(rpcData.tickets)).toBe(true);
      expect(Array.isArray(rpcData.additionalAttendees)).toBe(true);
      
      // Verify pricing calculations are captured
      expect(rpcData.totalAmount).toBe(100);
      expect(rpcData.subtotal).toBe(95);
      expect(rpcData.stripeFee).toBe(5);
    });

    it('should capture credit card data in form submission but exclude from processed data', async () => {
      const dataWithCreditCard = {
        ...completeIndividualRegistrationData,
        paymentMethod: {
          cardNumber: "4111111111111111",
          expiryMonth: "12",
          expiryYear: "2025",
          cvc: "123"
        }
      };

      const mockRequest = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: { 'authorization': 'Bearer test-token' },
        body: JSON.stringify(dataWithCreditCard)
      });

      await individualsPost(mockRequest);

      // Frontend form should capture credit card data
      const frontendData = rawRegistrationsData.find(r => r.registration_type === 'individuals_frontend');
      expect(frontendData.raw_data.form_data.paymentMethod).toBeDefined();
      
      // Processed RPC data should not include credit card details (security)
      const processedData = rawRegistrationsData.find(r => r.registration_type === 'individuals_complete');
      expect(processedData.raw_data.processed_registration_data.paymentMethod).toBeUndefined();
    });
  });

  describe('Timestamp and Metadata Tracking', () => {
    it('should include comprehensive timestamps and metadata across all data capture stages', async () => {
      const mockRequest = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: { 'authorization': 'Bearer test-token' },
        body: JSON.stringify(completeIndividualRegistrationData)
      });

      await individualsPost(mockRequest);

      // Should have 3 data capture stages
      expect(rawRegistrationsData).toHaveLength(3);
      
      // Test frontend capture metadata
      const frontendData = rawRegistrationsData.find(r => r.registration_type === 'individuals_frontend');
      expect(frontendData.registration_type).toBe('individuals_frontend');
      expect(frontendData.created_at).toBeDefined();
      expect(new Date(frontendData.created_at)).toBeInstanceOf(Date);
      
      // Test processed data metadata with gap analysis
      const processedData = rawRegistrationsData.find(r => r.registration_type === 'individuals_complete');
      expect(processedData.raw_data.data_gaps_analysis.has_pricing_data).toBe(true);
      expect(processedData.raw_data.processing_context.auth_user_id).toBe('test-user-123');
      
      // Test final result metadata with customer data
      const finalData = rawRegistrationsData.find(r => r.registration_type === 'individuals_final_result');
      expect(finalData.raw_data.customer_record.customer_id).toBe('test-user-123');
      expect(finalData.raw_data.processing_summary.registration_successful).toBe(true);
      
      // Verify attendee timestamps are preserved in all stages
      expect(processedData.raw_data.original_form_data.primaryAttendee.createdAt).toBe("2025-06-06T02:14:30.216Z");
      expect(processedData.raw_data.original_form_data.primaryAttendee.updatedAt).toBe("2025-06-06T02:14:30.216Z");
    });
  });
});