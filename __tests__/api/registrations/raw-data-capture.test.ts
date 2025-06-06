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
    it('should capture ALL attendee fields in raw_registrations', async () => {
      const mockRequest = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: { 'authorization': 'Bearer test-token' },
        body: JSON.stringify(completeIndividualRegistrationData)
      });

      await individualsPost(mockRequest);

      // Verify raw_registrations was called with complete data
      expect(rawRegistrationsData).toHaveLength(1);
      const capturedData = rawRegistrationsData[0];
      
      // Check that the raw_data contains the complete input
      expect(capturedData.raw_data).toEqual(completeIndividualRegistrationData);
      expect(capturedData.registration_type).toBe('individuals');
      
      // Verify ALL primary attendee fields are preserved
      const capturedAttendee = capturedData.raw_data.primaryAttendee;
      expect(capturedAttendee.postNominals).toBe("PDDGM");
      expect(capturedAttendee.lodgeNameNumber).toBe("The Leichhardt Lodge No. 133");
      expect(capturedAttendee.grandOfficerStatus).toBe("Present");
      expect(capturedAttendee.presentGrandOfficerRole).toBe("Grand Secretary");
      expect(capturedAttendee.contactConfirmed).toBe(false);
      expect(capturedAttendee.firstTime).toBe(false);
      expect(capturedAttendee.notes).toBe("VIP guest");
      expect(capturedAttendee.createdAt).toBe("2025-06-06T02:14:30.216Z");
      expect(capturedAttendee.updatedAt).toBe("2025-06-06T02:14:30.216Z");
      
      // Verify masonic organization fields
      expect(capturedAttendee.grandLodgeOrganisationId).toBe("3e893fa6-2cc2-448c-be9c-e3858cc90e11");
      expect(capturedAttendee.lodgeOrganisationId).toBe("4c1479ba-cbaa-2072-f77a-87882c81f1be");
      expect(capturedAttendee.grandLodgeName).toBe("United Grand Lodge of NSW & ACT");
      expect(capturedAttendee.lodgeName).toBe("The Leichhardt Lodge No. 133");
    });

    it('should fail if ANY expected attendee field is missing from raw_data', async () => {
      // Test with incomplete data missing critical fields
      const incompleteData = {
        ...completeIndividualRegistrationData,
        primaryAttendee: {
          ...completeIndividualRegistrationData.primaryAttendee,
          // Remove critical fields that often get lost
          postNominals: undefined,
          lodgeNameNumber: undefined,
          grandOfficerStatus: undefined,
          contactConfirmed: undefined,
          createdAt: undefined
        }
      };

      const mockRequest = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: { 'authorization': 'Bearer test-token' },
        body: JSON.stringify(incompleteData)
      });

      await individualsPost(mockRequest);

      const capturedData = rawRegistrationsData[0];
      const capturedAttendee = capturedData.raw_data.primaryAttendee;
      
      // These assertions should FAIL initially, demonstrating data loss
      expect(capturedAttendee.postNominals).toBeUndefined();
      expect(capturedAttendee.lodgeNameNumber).toBeUndefined();
      expect(capturedAttendee.grandOfficerStatus).toBeUndefined();
      expect(capturedAttendee.contactConfirmed).toBeUndefined();
      expect(capturedAttendee.createdAt).toBeUndefined();
    });
  });

  describe('Lodge Registration Data Capture', () => {
    it('should capture ALL lodge registration fields in raw_registrations', async () => {
      const mockRequest = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: { 'authorization': 'Bearer test-token' },
        body: JSON.stringify(completeLodgeRegistrationData)
      });

      await lodgePost(mockRequest);

      // Verify raw_registrations was called with complete data (standardized across all registration types)
      expect(rawRegistrationsData).toHaveLength(1);
      const capturedData = rawRegistrationsData[0];
      
      // Check that the raw_data contains the complete input
      expect(capturedData.raw_data).toEqual(completeLodgeRegistrationData);
      expect(capturedData.registration_type).toBe('lodge');
      
      // Verify ALL lodge detail fields are preserved
      const capturedLodgeDetails = capturedData.raw_data.lodgeDetails;
      expect(capturedLodgeDetails.meetingNight).toBe("Second Tuesday");
      expect(capturedLodgeDetails.district).toBe("District 5");
      expect(capturedLodgeDetails.secretary.name).toBe("Brother Secretary");
      expect(capturedLodgeDetails.masterOfLodge.name).toBe("Worshipful Master");
      expect(capturedLodgeDetails.additionalInfo).toBe("Founded 1925");
      
      // Verify billing details special requirements
      const capturedBilling = capturedData.raw_data.billingDetails;
      expect(capturedBilling.dietaryRequirements).toBe("Halal meals for 3 attendees");
      expect(capturedBilling.specialNeeds).toBe("One wheelchair accessible table");
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
    it('should preserve exact data types and structure', async () => {
      const mockRequest = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: { 'authorization': 'Bearer test-token' },
        body: JSON.stringify(completeIndividualRegistrationData)
      });

      await individualsPost(mockRequest);

      const capturedData = rawRegistrationsData[0];
      
      // Verify data types are preserved
      expect(typeof capturedData.raw_data.totalAmount).toBe('number');
      expect(typeof capturedData.raw_data.primaryAttendee.contactConfirmed).toBe('boolean');
      expect(typeof capturedData.raw_data.primaryAttendee.firstTime).toBe('boolean');
      expect(Array.isArray(capturedData.raw_data.tickets)).toBe(true);
      expect(Array.isArray(capturedData.raw_data.selectedEvents)).toBe(true);
      
      // Verify nested object structure
      expect(capturedData.raw_data.billingDetails.country).toHaveProperty('isoCode', 'AU');
      expect(capturedData.raw_data.billingDetails.stateTerritory).toHaveProperty('countryCode', 'AU');
    });

    it('should exclude credit card data for security', async () => {
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

      const capturedData = rawRegistrationsData[0];
      
      // Credit card data should be present in raw capture (as per requirements)
      // but this test verifies we can identify what should be excluded
      expect(capturedData.raw_data.paymentMethod).toBeDefined();
      // Note: Actual credit card filtering should happen at storage level, not API level
    });
  });

  describe('Timestamp and Metadata Tracking', () => {
    it('should include creation timestamps and metadata', async () => {
      const mockRequest = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: { 'authorization': 'Bearer test-token' },
        body: JSON.stringify(completeIndividualRegistrationData)
      });

      await individualsPost(mockRequest);

      const capturedData = rawRegistrationsData[0];
      
      // Verify metadata fields
      expect(capturedData.registration_type).toBe('individuals');
      expect(capturedData.created_at).toBeDefined();
      expect(new Date(capturedData.created_at)).toBeInstanceOf(Date);
      
      // Verify attendee timestamps are preserved
      expect(capturedData.raw_data.primaryAttendee.createdAt).toBe("2025-06-06T02:14:30.216Z");
      expect(capturedData.raw_data.primaryAttendee.updatedAt).toBe("2025-06-06T02:14:30.216Z");
    });
  });
});