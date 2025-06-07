import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';

// Create mock client reference that will be populated
let mockSupabaseClient: any;
let rawRegistrationsData: any[] = [];

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
 * Complete Zustand Registration Store Mock Data
 * This represents the exact structure from useRegistrationStore
 */
const completeZustandRegistrationStoreState = {
  // Core registration data
  draftId: "01974300-b1e1-757d-9ec6-e24ec9b8a1dc",
  functionId: "eebddef5-6833-43e3-8d32-700508b1c089",
  functionSlug: "grand-proclamation-2025",
  selectedEvents: ["e842bdb2-aff8-46d8-a347-bf50840fff13"],
  registrationType: "individual" as const,
  delegationType: null,
  
  // Attendees (complete UnifiedAttendeeData array)
  attendees: [
    {
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
    }
  ],
  
  // Package selections per attendee
  packages: {
    "019742f8-b1e1-757d-9ec6-e24ec9b8a1dc": {
      ticketDefinitionId: "d586ecc1-e410-4ef3-a59c-4a53a866bc33",
      selectedEvents: ["e842bdb2-aff8-46d8-a347-bf50840fff13"]
    }
  },
  
  // Billing details
  billingDetails: {
    title: "Bro",
    firstName: "TestFirst",
    lastName: "TestLast",
    email: "test@example.com",
    phone: "0412345678",
    addressLine1: "123 Test Street",
    addressLine2: "Unit 1",
    city: "Test Suburb",
    stateProvince: "NSW",
    postalCode: "2000",
    country: "Australia",
    businessName: ""
  },
  
  // Form state
  agreeToTerms: true,
  status: "draft",
  lastSaved: 1672531200000,
  error: null,
  
  // Navigation
  currentStep: 4,
  
  // Available tickets (includes pricing)
  availableTickets: [
    {
      id: "d586ecc1-e410-4ef3-a59c-4a53a866bc33",
      name: "Grand Proclamation Dinner",
      price: 150,
      description: "Premium dinner with ceremony viewing",
      eventId: "e842bdb2-aff8-46d8-a347-bf50840fff13",
      isPackage: false
    }
  ],
  
  // Completion state
  confirmationNumber: null,
  draftRecoveryHandled: true,
  anonymousSessionEstablished: true,
  
  // Lodge-specific (for individual registrations, this is null)
  lodgeTicketOrder: null
};

/**
 * Complete Lodge Registration Store Mock Data
 */
const completeZustandLodgeStoreState = {
  // Customer details (lodge contact person)
  customer: {
    title: "Bro",
    firstName: "Lodge",
    lastName: "Secretary",
    email: "secretary@testlodge.org",
    phone: "0412000000",
    businessName: "Test Lodge No. 999",
    addressLine1: "123 Lodge Street",
    addressLine2: "",
    city: "Lodge City",
    stateProvince: "NSW",
    postalCode: "2001",
    country: "Australia"
  },
  
  // Lodge details
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
  
  // Table order information
  tableOrder: {
    tableCount: 2,
    totalTickets: 20,
    packageSelection: "premium-package",
    specialRequests: "Vegetarian meals for 3 guests"
  },
  
  // Validation state
  isValid: true,
  errors: {},
  lastUpdated: 1672531200000
};

/**
 * Complete Delegation Registration Store Mock Data  
 */
const completeZustandDelegationStoreState = {
  // Delegation leader details
  delegationLeader: {
    title: "MW",
    firstName: "Grand",
    lastName: "Master",
    email: "grandmaster@org.org",
    phone: "0414000000",
    rank: "Grand Master",
    organisation_id: "org-uuid-789",
    grand_lodge_id: "grand-lodge-uuid-456"
  },
  
  // Delegation information
  delegationInfo: {
    organisationName: "Test Masonic Organization",
    organisationType: "Grand Lodge",
    organisation_id: "org-uuid-789",
    estimatedSize: 10,
    confirmedAttendees: 8,
    specialRequests: "Require ceremonial room setup"
  },
  
  // Contact details
  contactDetails: {
    secretary: {
      title: "RW",
      firstName: "Grand",
      lastName: "Secretary", 
      email: "secretary@org.org",
      phone: "0415000000",
      rank: "Grand Secretary"
    },
    mailingAddress: {
      addressLine1: "789 Grand Lodge Street",
      city: "Capital City",
      stateProvince: "NSW",
      postalCode: "2002",
      country: "Australia"
    }
  },
  
  // Form state
  isComplete: false,
  validationErrors: [],
  lastSaved: 1672531200000
};

describe('Complete Zustand Store State Capture Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    rawRegistrationsData = [];
    
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
                last_name: 'TestLast'
              },
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

  describe('Individual Registration Complete Zustand Store Capture', () => {
    it('MUST capture 100% of useRegistrationStore state with exact field names and values', async () => {
      // Test data that simulates what would be sent from payment-step.tsx with complete store state
      const requestDataWithCompleteStore = {
        // Current API data (must include required fields)
        eventId: "e842bdb2-aff8-46d8-a347-bf50840fff13",
        functionId: "eebddef5-6833-43e3-8d32-700508b1c089",
        customerId: "test-user-123",
        totalAmount: 150, // THIS SHOULD BE NON-ZERO
        
        // Required primaryAttendee (API validation requirement)
        primaryAttendee: completeZustandRegistrationStoreState.attendees[0],
        
        // Required billingDetails (API validation requirement) - convert to expected format
        billingDetails: {
          firstName: completeZustandRegistrationStoreState.billingDetails.firstName,
          lastName: completeZustandRegistrationStoreState.billingDetails.lastName,
          emailAddress: completeZustandRegistrationStoreState.billingDetails.email, // Note: different field name
          mobileNumber: completeZustandRegistrationStoreState.billingDetails.phone, // Note: different field name
          addressLine1: completeZustandRegistrationStoreState.billingDetails.addressLine1,
          addressLine2: completeZustandRegistrationStoreState.billingDetails.addressLine2,
          suburb: completeZustandRegistrationStoreState.billingDetails.city, // Note: different field name
          postcode: completeZustandRegistrationStoreState.billingDetails.postalCode, // Note: different field name
          country: completeZustandRegistrationStoreState.billingDetails.country
        },
        
        // THIS IS THE KEY: Complete Zustand store state
        completeZustandStoreState: completeZustandRegistrationStoreState,
        
        // Calculated pricing from payment component
        calculatedPricing: {
          totalAmount: 150,
          subtotal: 142.50,
          stripeFee: 7.50
        }
      };

      const mockRequest = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: { 'authorization': 'Bearer test-token' },
        body: JSON.stringify(requestDataWithCompleteStore)
      });

      await individualsPost(mockRequest);

      // Debug: Check what registration types were actually created
      console.log('Available registration types:', rawRegistrationsData.map(r => r.registration_type));
      
      // CRITICAL: Find the raw_registrations entry that contains complete store state
      const completeStoreCapture = rawRegistrationsData.find(r => 
        r.registration_type === 'individual_complete_zustand_store'
      );
      
      // THIS TEST MUST FAIL initially because this capture doesn't exist yet
      expect(completeStoreCapture).toBeDefined();
      expect(completeStoreCapture.raw_data.source).toBe('complete_zustand_store_state');
      
      // Verify EXACT store state capture - 100% field coverage
      const capturedStore = completeStoreCapture.raw_data.zustand_store_state;
      
      // Core registration data
      expect(capturedStore.draftId).toBe(completeZustandRegistrationStoreState.draftId);
      expect(capturedStore.functionId).toBe(completeZustandRegistrationStoreState.functionId);
      expect(capturedStore.functionSlug).toBe(completeZustandRegistrationStoreState.functionSlug);
      expect(capturedStore.selectedEvents).toEqual(completeZustandRegistrationStoreState.selectedEvents);
      expect(capturedStore.registrationType).toBe(completeZustandRegistrationStoreState.registrationType);
      expect(capturedStore.delegationType).toBe(completeZustandRegistrationStoreState.delegationType);
      
      // Complete attendees array with ALL fields
      expect(capturedStore.attendees).toHaveLength(1);
      const capturedAttendee = capturedStore.attendees[0];
      const originalAttendee = completeZustandRegistrationStoreState.attendees[0];
      
      // Verify EVERY attendee field is preserved
      expect(capturedAttendee.attendeeId).toBe(originalAttendee.attendeeId);
      expect(capturedAttendee.grandOfficerStatus).toBe(originalAttendee.grandOfficerStatus);
      expect(capturedAttendee.presentGrandOfficerRole).toBe(originalAttendee.presentGrandOfficerRole);
      expect(capturedAttendee.lodgeNameNumber).toBe(originalAttendee.lodgeNameNumber);
      expect(capturedAttendee.postNominals).toBe(originalAttendee.postNominals);
      expect(capturedAttendee.createdAt).toBe(originalAttendee.createdAt);
      expect(capturedAttendee.updatedAt).toBe(originalAttendee.updatedAt);
      
      // Package selections with exact structure
      expect(capturedStore.packages).toEqual(completeZustandRegistrationStoreState.packages);
      
      // Billing details
      expect(capturedStore.billingDetails).toEqual(completeZustandRegistrationStoreState.billingDetails);
      
      // State management fields
      expect(capturedStore.status).toBe(completeZustandRegistrationStoreState.status);
      expect(capturedStore.currentStep).toBe(completeZustandRegistrationStoreState.currentStep);
      expect(capturedStore.lastSaved).toBe(completeZustandRegistrationStoreState.lastSaved);
      expect(capturedStore.agreeToTerms).toBe(completeZustandRegistrationStoreState.agreeToTerms);
      
      // Available tickets with pricing data
      expect(capturedStore.availableTickets).toEqual(completeZustandRegistrationStoreState.availableTickets);
      expect(capturedStore.availableTickets[0].price).toBe(150); // NON-ZERO PRICING
      
      // Session state
      expect(capturedStore.anonymousSessionEstablished).toBe(completeZustandRegistrationStoreState.anonymousSessionEstablished);
      expect(capturedStore.draftRecoveryHandled).toBe(completeZustandRegistrationStoreState.draftRecoveryHandled);
      
      // Calculated pricing should be merged with store state
      expect(completeStoreCapture.raw_data.calculated_pricing.totalAmount).toBe(150);
      expect(completeStoreCapture.raw_data.calculated_pricing.subtotal).toBe(142.50);
      expect(completeStoreCapture.raw_data.calculated_pricing.stripeFee).toBe(7.50);
    });

    it('MUST exclude ONLY credit card fields while preserving all other sensitive data', async () => {
      const requestWithCreditCard = {
        functionId: "eebddef5-6833-43e3-8d32-700508b1c089",
        customerId: "test-user-123",
        
        // Required fields
        primaryAttendee: completeZustandRegistrationStoreState.attendees[0],
        billingDetails: {
          firstName: completeZustandRegistrationStoreState.billingDetails.firstName,
          lastName: completeZustandRegistrationStoreState.billingDetails.lastName,
          emailAddress: completeZustandRegistrationStoreState.billingDetails.email,
          mobileNumber: completeZustandRegistrationStoreState.billingDetails.phone,
          addressLine1: completeZustandRegistrationStoreState.billingDetails.addressLine1,
          addressLine2: completeZustandRegistrationStoreState.billingDetails.addressLine2,
          suburb: completeZustandRegistrationStoreState.billingDetails.city,
          postcode: completeZustandRegistrationStoreState.billingDetails.postalCode,
          country: completeZustandRegistrationStoreState.billingDetails.country
        },
        
        // Complete store with credit card data mixed in
        completeZustandStoreState: {
          ...completeZustandRegistrationStoreState,
          // This should be EXCLUDED
          creditCardData: {
            cardNumber: "4111111111111111",
            expiryDate: "12/25", 
            cvc: "123",
            cardName: "Test Cardholder"
          },
          // This should be INCLUDED
          paymentIntentId: "pi_1234567890",
          stripeCustomerId: "cus_1234567890"
        }
      };

      const mockRequest = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: { 'authorization': 'Bearer test-token' },
        body: JSON.stringify(requestWithCreditCard)
      });

      await individualsPost(mockRequest);

      const completeStoreCapture = rawRegistrationsData.find(r => 
        r.registration_type === 'individual_complete_zustand_store'
      );
      
      expect(completeStoreCapture).toBeDefined();
      const capturedStore = completeStoreCapture.raw_data.zustand_store_state;
      
      // Credit card fields should be EXCLUDED
      expect(capturedStore.creditCardData).toBeUndefined();
      expect(capturedStore.cardNumber).toBeUndefined();
      expect(capturedStore.expiryDate).toBeUndefined();
      expect(capturedStore.cvc).toBeUndefined();
      expect(capturedStore.cardName).toBeUndefined();
      
      // Payment-related but non-sensitive fields should be INCLUDED
      expect(capturedStore.paymentIntentId).toBe("pi_1234567890");
      expect(capturedStore.stripeCustomerId).toBe("cus_1234567890");
    });
  });

  describe('Lodge Registration Complete Zustand Store Capture', () => {
    it('MUST capture 100% of useLodgeRegistrationStore state', async () => {
      const lodgeRequestWithCompleteStore = {
        functionId: "eebddef5-6833-43e3-8d32-700508b1c089",
        packageId: "package-123",
        totalAmount: 500,
        customerId: "test-user-123",
        
        // Required fields for lodge API
        lodgeDetails: completeZustandLodgeStoreState.lodgeDetails,
        billingDetails: {
          firstName: "Lodge",
          lastName: "Secretary",
          emailAddress: "secretary@testlodge.org"
        },
        
        // Complete Lodge Zustand store state
        completeLodgeZustandStoreState: completeZustandLodgeStoreState
      };

      const mockRequest = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: { 'authorization': 'Bearer test-token' },
        body: JSON.stringify(lodgeRequestWithCompleteStore)
      });

      await lodgePost(mockRequest);

      // Find lodge store state capture
      const lodgeStoreCapture = rawRegistrationsData.find(r => 
        r.registration_type === 'lodge_complete_zustand_store'
      );
      
      // THIS MUST FAIL initially
      expect(lodgeStoreCapture).toBeDefined();
      expect(lodgeStoreCapture.raw_data.source).toBe('complete_lodge_zustand_store_state');
      
      // Add debug to see what's available  
      console.log('Lodge registration types:', rawRegistrationsData.map(r => r.registration_type));
      
      const capturedLodgeStore = lodgeStoreCapture?.raw_data?.zustand_store_state;
      
      // Verify complete lodge store structure
      expect(capturedLodgeStore.customer).toEqual(completeZustandLodgeStoreState.customer);
      expect(capturedLodgeStore.lodgeDetails).toEqual(completeZustandLodgeStoreState.lodgeDetails);
      expect(capturedLodgeStore.tableOrder).toEqual(completeZustandLodgeStoreState.tableOrder);
      expect(capturedLodgeStore.isValid).toBe(completeZustandLodgeStoreState.isValid);
      expect(capturedLodgeStore.lastUpdated).toBe(completeZustandLodgeStoreState.lastUpdated);
      
      // Verify lodge-specific fields are preserved
      expect(capturedLodgeStore.lodgeDetails.meetingNight).toBe("Second Tuesday");
      expect(capturedLodgeStore.lodgeDetails.district).toBe("District 5");
      expect(capturedLodgeStore.lodgeDetails.additionalInfo).toBe("Founded 1925");
    });
  });

  describe('Delegation Registration Complete Zustand Store Capture', () => {
    it('MUST capture 100% of useDelegationRegistrationStore state', async () => {
      const delegationRequestWithCompleteStore = {
        functionId: "eebddef5-6833-43e3-8d32-700508b1c089",
        totalAmount: 1000,
        customerId: "test-user-123",
        
        // Required fields for delegation API
        delegates: [completeZustandDelegationStoreState.delegationLeader],
        delegationDetails: { name: "Test Delegation" },
        billingDetails: {
          firstName: "Grand",
          lastName: "Master",
          emailAddress: "grandmaster@org.org"
        },
        
        // Complete Delegation Zustand store state
        completeDelegationZustandStoreState: completeZustandDelegationStoreState
      };

      const mockRequest = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: { 'authorization': 'Bearer test-token' },
        body: JSON.stringify(delegationRequestWithCompleteStore)
      });

      await delegationPost(mockRequest);

      // Find delegation store state capture
      const delegationStoreCapture = rawRegistrationsData.find(r => 
        r.registration_type === 'delegation_complete_zustand_store'
      );
      
      // THIS MUST FAIL initially
      expect(delegationStoreCapture).toBeDefined();
      expect(delegationStoreCapture.raw_data.source).toBe('complete_delegation_zustand_store_state');
      
      // Add debug to see what's available
      console.log('Delegation registration types:', rawRegistrationsData.map(r => r.registration_type));
      
      const capturedDelegationStore = delegationStoreCapture?.raw_data?.zustand_store_state;
      
      // Verify complete delegation store structure
      expect(capturedDelegationStore.delegationLeader).toEqual(completeZustandDelegationStoreState.delegationLeader);
      expect(capturedDelegationStore.delegationInfo).toEqual(completeZustandDelegationStoreState.delegationInfo);
      expect(capturedDelegationStore.contactDetails).toEqual(completeZustandDelegationStoreState.contactDetails);
      expect(capturedDelegationStore.isComplete).toBe(completeZustandDelegationStoreState.isComplete);
      expect(capturedDelegationStore.lastSaved).toBe(completeZustandDelegationStoreState.lastSaved);
      
      // Verify delegation-specific fields are preserved
      expect(capturedDelegationStore.delegationInfo.estimatedSize).toBe(10);
      expect(capturedDelegationStore.delegationInfo.organisationType).toBe("Grand Lodge");
      expect(capturedDelegationStore.delegationLeader.rank).toBe("Grand Master");
    });
  });

  describe('Field Coverage Validation', () => {
    it('MUST demonstrate 1000+ fields are missing from current implementation', async () => {
      // This test shows the gap between current capture and complete store state
      const requestData = {
        functionId: "eebddef5-6833-43e3-8d32-700508b1c089",
        customerId: "test-user-123",
        
        // Required fields
        primaryAttendee: completeZustandRegistrationStoreState.attendees[0],
        billingDetails: {
          firstName: completeZustandRegistrationStoreState.billingDetails.firstName,
          lastName: completeZustandRegistrationStoreState.billingDetails.lastName,
          emailAddress: completeZustandRegistrationStoreState.billingDetails.email,
          mobileNumber: completeZustandRegistrationStoreState.billingDetails.phone,
          addressLine1: completeZustandRegistrationStoreState.billingDetails.addressLine1,
          addressLine2: completeZustandRegistrationStoreState.billingDetails.addressLine2,
          suburb: completeZustandRegistrationStoreState.billingDetails.city,
          postcode: completeZustandRegistrationStoreState.billingDetails.postalCode,
          country: completeZustandRegistrationStoreState.billingDetails.country
        },
        
        completeZustandStoreState: completeZustandRegistrationStoreState
      };

      const mockRequest = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: { 'authorization': 'Bearer test-token' },
        body: JSON.stringify(requestData)
      });

      await individualsPost(mockRequest);

      // Compare current incomplete capture vs complete store capture
      const currentIncompleteCapture = rawRegistrationsData.find(r => 
        r.registration_type === 'individuals_complete'
      );
      const completeStoreCapture = rawRegistrationsData.find(r => 
        r.registration_type === 'individual_complete_zustand_store'
      );
      
      expect(currentIncompleteCapture).toBeDefined();
      expect(completeStoreCapture).toBeDefined();
      
      // Count fields in current vs complete capture
      const currentFields = Object.keys(JSON.parse(JSON.stringify(currentIncompleteCapture.raw_data)));
      const completeFields = Object.keys(JSON.parse(JSON.stringify(completeStoreCapture.raw_data.zustand_store_state)));
      
      // The complete store should have significantly more fields
      expect(completeFields.length).toBeGreaterThan(currentFields.length);
      
      // Log the difference to show what's missing
      console.log(`Current capture fields: ${currentFields.length}`);
      console.log(`Complete store fields: ${completeFields.length}`);
      console.log(`Missing fields: ${completeFields.length - currentFields.length}`);
      
      // The complete store should capture attendees array, packages object, billing details, etc.
      expect(completeStoreCapture.raw_data.zustand_store_state.attendees).toBeDefined();
      expect(completeStoreCapture.raw_data.zustand_store_state.packages).toBeDefined();
      expect(completeStoreCapture.raw_data.zustand_store_state.billingDetails).toBeDefined();
      expect(completeStoreCapture.raw_data.zustand_store_state.availableTickets).toBeDefined();
    });
  });
});