/**
 * Test Suite: Comprehensive Metadata Capture
 * Tests the new Zustand store structure for capturing complete ticket/package metadata
 */

import { renderHook, act } from '@testing-library/react';
import { useRegistrationStore } from '@/lib/registrationStore';
import type { 
  FunctionTicketDefinition, 
  FunctionPackage 
} from '@/lib/services/function-tickets-service';

// Mock data for testing
const mockFunctionMetadata = {
  functionId: '123e4567-e89b-12d3-a456-426614174000',
  functionName: 'Grand Lodge Installation 2024',
  functionDescription: 'Annual installation ceremony and gala dinner',
  functionDates: {
    startDate: '2024-06-15T10:00:00Z',
    endDate: '2024-06-15T23:00:00Z'
  },
  organizationId: 'org_123',
  organizationName: 'United Grand Lodge of NSW & ACT'
};

const mockEventTicket: FunctionTicketDefinition = {
  id: 'et_123',
  name: 'Gala Dinner Ticket',
  description: 'Evening gala dinner with entertainment',
  price: 150.00,
  event_id: 'evt_456',
  event_title: 'Installation Gala Dinner',
  event_subtitle: 'Black Tie Event',
  event_slug: 'gala-dinner-2024',
  function_id: mockFunctionMetadata.functionId,
  is_active: true,
  total_capacity: 500,
  available_count: 125,
  reserved_count: 0,
  sold_count: 375,
  status: 'available',
  eligibility_criteria: null,
  eligibleAttendeeTypes: ['mason', 'guest']
};

const mockCeremonyTicket: FunctionTicketDefinition = {
  id: 'et_124',
  name: 'Installation Ceremony',
  description: 'Formal installation ceremony',
  price: 50.00,
  event_id: 'evt_457',
  event_title: 'Grand Master Installation',
  event_subtitle: 'Formal Ceremony',
  event_slug: 'installation-2024',
  function_id: mockFunctionMetadata.functionId,
  is_active: true,
  total_capacity: 800,
  available_count: 250,
  reserved_count: 50,
  sold_count: 500,
  status: 'available',
  eligibility_criteria: { attendeeTypes: ['mason'] },
  eligibleAttendeeTypes: ['mason']
};

const mockPackage: FunctionPackage = {
  id: 'pkg_789',
  name: 'Full Weekend Package',
  description: 'Includes ceremony and gala dinner',
  price: 180.00,
  original_price: 200.00,
  discount: 20.00,
  function_id: mockFunctionMetadata.functionId,
  is_active: true,
  qty: null,
  includes: ['et_123', 'et_124'],
  includes_description: ['Installation Ceremony', 'Gala Dinner with Entertainment'],
  eligibility_criteria: null,
  eligibleAttendeeTypes: ['mason'],
  eligibleRegistrationTypes: ['individual', 'delegation']
};

describe('Comprehensive Metadata Capture', () => {
  beforeEach(() => {
    // Reset store before each test
    const { clearRegistration } = useRegistrationStore.getState();
    act(() => {
      clearRegistration();
    });
  });

  describe('Function Metadata Capture', () => {
    it('should capture and store function metadata', () => {
      const { result } = renderHook(() => useRegistrationStore());
      
      act(() => {
        result.current.captureFunctionMetadata(mockFunctionMetadata);
      });

      expect(result.current.functionMetadata).toEqual({
        functionId: mockFunctionMetadata.functionId,
        functionName: mockFunctionMetadata.functionName,
        functionDescription: mockFunctionMetadata.functionDescription,
        functionDates: mockFunctionMetadata.functionDates,
        organizationId: mockFunctionMetadata.organizationId,
        organizationName: mockFunctionMetadata.organizationName,
        captureTimestamp: expect.any(String)
      });
    });
  });

  describe('Ticket Metadata Capture', () => {
    it('should capture complete ticket metadata with event details', () => {
      const { result } = renderHook(() => useRegistrationStore());
      
      // Mock additional event data that would come from the event table
      const eventData = {
        startDate: '2024-06-15T18:00:00Z',
        endDate: '2024-06-15T23:00:00Z',
        venue: 'Sydney Town Hall',
        venueAddress: '483 George St, Sydney NSW 2000'
      };

      act(() => {
        result.current.captureTicketMetadata(mockEventTicket, eventData);
      });

      const capturedMetadata = result.current.ticketMetadata[mockEventTicket.id];
      
      expect(capturedMetadata).toEqual({
        ticketId: mockEventTicket.id,
        name: mockEventTicket.name,
        description: mockEventTicket.description,
        price: mockEventTicket.price,
        event: {
          eventId: mockEventTicket.event_id,
          eventTitle: mockEventTicket.event_title,
          eventSubtitle: mockEventTicket.event_subtitle,
          eventSlug: mockEventTicket.event_slug,
          startDate: eventData.startDate,
          endDate: eventData.endDate,
          venue: eventData.venue,
          venueAddress: eventData.venueAddress
        },
        availability: {
          isActive: true,
          totalCapacity: 500,
          availableCount: 125,
          reservedCount: 0,
          soldCount: 375,
          status: 'available'
        },
        status: 'unpaid',
        selectionTimestamp: expect.any(String),
        functionId: mockEventTicket.function_id
      });
    });

    it('should determine correct availability status', () => {
      const { result } = renderHook(() => useRegistrationStore());
      
      // Test low stock scenario
      const lowStockTicket = { ...mockEventTicket, available_count: 8 };
      act(() => {
        result.current.captureTicketMetadata(lowStockTicket, {});
      });
      
      expect(result.current.ticketMetadata[lowStockTicket.id].availability.status).toBe('low_stock');
      
      // Test sold out scenario
      const soldOutTicket = { ...mockEventTicket, id: 'et_sold', available_count: 0 };
      act(() => {
        result.current.captureTicketMetadata(soldOutTicket, {});
      });
      
      expect(result.current.ticketMetadata[soldOutTicket.id].availability.status).toBe('sold_out');
    });
  });

  describe('Package Metadata Capture', () => {
    it('should capture package metadata with full included ticket details', () => {
      const { result } = renderHook(() => useRegistrationStore());
      
      // First capture the individual tickets that are included in the package
      act(() => {
        result.current.captureTicketMetadata(mockEventTicket, {
          startDate: '2024-06-15T18:00:00Z',
          endDate: '2024-06-15T23:00:00Z',
          venue: 'Sydney Town Hall'
        });
        result.current.captureTicketMetadata(mockCeremonyTicket, {
          startDate: '2024-06-15T10:00:00Z',
          endDate: '2024-06-15T12:00:00Z',
          venue: 'Grand Lodge Temple'
        });
      });
      
      // Now capture the package
      act(() => {
        result.current.capturePackageMetadata(mockPackage, [mockEventTicket, mockCeremonyTicket]);
      });
      
      const capturedPackage = result.current.packageMetadata[mockPackage.id];
      
      expect(capturedPackage).toEqual({
        packageId: mockPackage.id,
        name: mockPackage.name,
        description: mockPackage.description,
        price: mockPackage.price,
        originalPrice: mockPackage.original_price,
        discount: mockPackage.discount,
        includedTickets: expect.arrayContaining([
          expect.objectContaining({
            ticketId: mockEventTicket.id,
            name: mockEventTicket.name,
            event: expect.objectContaining({
              eventTitle: mockEventTicket.event_title
            })
          }),
          expect.objectContaining({
            ticketId: mockCeremonyTicket.id,
            name: mockCeremonyTicket.name,
            event: expect.objectContaining({
              eventTitle: mockCeremonyTicket.event_title
            })
          })
        ]),
        includesDescription: mockPackage.includes_description,
        status: 'unpaid',
        selectionTimestamp: expect.any(String),
        functionId: mockPackage.function_id
      });
    });
  });

  describe('Attendee Selection Management', () => {
    const attendeeId = 'att_123';
    const attendeeName = 'John Smith';
    const attendeeType = 'mason';

    beforeEach(() => {
      const { result } = renderHook(() => useRegistrationStore());
      
      // Setup: Add attendee and capture metadata
      act(() => {
        result.current.addMasonAttendee();
        const attendees = result.current.attendees;
        if (attendees.length > 0) {
          result.current.updateAttendee(attendees[0].attendeeId, {
            attendeeId,
            firstName: 'John',
            lastName: 'Smith'
          });
        }
        
        // Capture ticket and package metadata
        result.current.captureTicketMetadata(mockEventTicket, {});
        result.current.capturePackageMetadata(mockPackage, [mockEventTicket, mockCeremonyTicket]);
      });
    });

    it('should create ticket record when attendee selects individual ticket', () => {
      const { result } = renderHook(() => useRegistrationStore());
      
      act(() => {
        result.current.addAttendeeTicketSelection(attendeeId, mockEventTicket.id, 1);
      });
      
      const selection = result.current.attendeeSelections[attendeeId];
      const ticketRecord = selection.individualTickets[0];
      
      expect(ticketRecord).toEqual({
        ticketRecordId: expect.stringMatching(/^[a-f0-9-]{36}$/), // UUID format
        ticket: expect.objectContaining({
          ticketId: mockEventTicket.id,
          name: mockEventTicket.name,
          price: mockEventTicket.price
        }),
        quantity: 1,
        subtotal: 150.00,
        selectionTimestamp: expect.any(String),
        status: 'unpaid'
      });
      
      expect(selection.attendeeSubtotal).toBe(150.00);
    });

    it('should create multiple ticket records when attendee selects package', () => {
      const { result } = renderHook(() => useRegistrationStore());
      
      act(() => {
        result.current.addAttendeePackageSelection(attendeeId, mockPackage.id, 1);
      });
      
      const selection = result.current.attendeeSelections[attendeeId];
      const packageRecord = selection.packages[0];
      
      expect(packageRecord).toEqual({
        packageRecordId: expect.stringMatching(/^[a-f0-9-]{36}$/),
        package: expect.objectContaining({
          packageId: mockPackage.id,
          name: mockPackage.name,
          price: mockPackage.price
        }),
        quantity: 1,
        subtotal: 180.00,
        selectionTimestamp: expect.any(String),
        status: 'unpaid',
        // Should create ticket records for each included ticket
        generatedTicketRecords: expect.arrayContaining([
          expect.objectContaining({
            ticketRecordId: expect.stringMatching(/^[a-f0-9-]{36}$/),
            eventTicketId: 'et_123',
            fromPackageId: mockPackage.id
          }),
          expect.objectContaining({
            ticketRecordId: expect.stringMatching(/^[a-f0-9-]{36}$/),
            eventTicketId: 'et_124',
            fromPackageId: mockPackage.id
          })
        ])
      });
      
      expect(selection.attendeeSubtotal).toBe(180.00);
    });

    it('should remove selection and update totals', () => {
      const { result } = renderHook(() => useRegistrationStore());
      
      // Add selections
      act(() => {
        result.current.addAttendeeTicketSelection(attendeeId, mockEventTicket.id, 1);
        result.current.addAttendeePackageSelection(attendeeId, mockPackage.id, 1);
      });
      
      expect(result.current.attendeeSelections[attendeeId].attendeeSubtotal).toBe(330.00);
      
      // Remove ticket
      act(() => {
        const ticketRecordId = result.current.attendeeSelections[attendeeId].individualTickets[0].ticketRecordId;
        result.current.removeAttendeeSelection(attendeeId, ticketRecordId, 'ticket');
      });
      
      expect(result.current.attendeeSelections[attendeeId].attendeeSubtotal).toBe(180.00);
    });
  });

  describe('Order Summary Calculation', () => {
    it('should calculate complete order summary with all metadata', () => {
      const { result } = renderHook(() => useRegistrationStore());
      
      // Setup: Add function metadata, attendees, and selections
      act(() => {
        result.current.captureFunctionMetadata(mockFunctionMetadata);
        result.current.captureTicketMetadata(mockEventTicket, {});
        result.current.capturePackageMetadata(mockPackage, [mockEventTicket, mockCeremonyTicket]);
        
        // Add two attendees
        result.current.addMasonAttendee();
        result.current.addGuestAttendee();
        const attendees = result.current.attendees;
        
        // First attendee selects package
        result.current.addAttendeePackageSelection(attendees[0].attendeeId, mockPackage.id, 1);
        
        // Second attendee selects individual ticket
        result.current.addAttendeeTicketSelection(attendees[1].attendeeId, mockEventTicket.id, 1);
        
        // Update order summary
        result.current.updateOrderSummary();
      });
      
      const orderSummary = result.current.orderSummary;
      
      expect(orderSummary).toEqual({
        registrationId: undefined,
        functionId: mockFunctionMetadata.functionId,
        functionName: mockFunctionMetadata.functionName,
        registrationType: 'individuals',
        totalAttendees: 2,
        attendeeSummaries: expect.arrayContaining([
          expect.objectContaining({
            attendeeSubtotal: 180.00
          }),
          expect.objectContaining({
            attendeeSubtotal: 150.00
          })
        ]),
        subtotal: 330.00,
        processingFees: 0, // Will be calculated in payment step
        stripeFee: 0, // Will be calculated in payment step
        totalAmount: 330.00,
        currency: 'AUD',
        totalTickets: 3, // 2 from package + 1 individual
        totalPackages: 1,
        status: 'draft',
        paymentStatus: 'unpaid',
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        selectionCompleteTimestamp: expect.any(String)
      });
    });
  });

  describe('Registration Table Data', () => {
    it('should track registration table fields', () => {
      const { result } = renderHook(() => useRegistrationStore());
      
      act(() => {
        result.current.updateRegistrationTableData({
          function_id: mockFunctionMetadata.functionId,
          customer_id: 'cust_123',
          total_amount: 330.00,
          stripe_fee: 10.50,
          status: 'draft',
          payment_status: 'unpaid'
        });
      });
      
      expect(result.current.registrationTableData).toEqual({
        function_id: mockFunctionMetadata.functionId,
        customer_id: 'cust_123',
        booking_contact_id: null,
        event_id: null,
        total_amount: 330.00,
        stripe_fee: 10.50,
        status: 'draft',
        payment_status: 'unpaid',
        payment_intent_id: null,
        stripe_payment_intent_id: null,
        organization_id: null
      });
    });
  });

  describe('Lodge Bulk Orders', () => {
    it('should handle lodge bulk package selection without creating attendees', () => {
      const { result } = renderHook(() => useRegistrationStore());
      
      act(() => {
        result.current.setRegistrationType('lodge');
        result.current.captureFunctionMetadata(mockFunctionMetadata);
        result.current.capturePackageMetadata(mockPackage, [mockEventTicket, mockCeremonyTicket]);
        
        // Lodge selects package for 10 attendees (1 table)
        result.current.addLodgeBulkPackageSelection(mockPackage.id, 10);
      });
      
      const lodgeSelection = result.current.lodgeBulkSelection;
      
      expect(lodgeSelection).toEqual({
        selectionType: 'package',
        packageId: mockPackage.id,
        packageMetadata: expect.objectContaining({
          name: mockPackage.name,
          price: mockPackage.price
        }),
        quantity: 10,
        pricePerUnit: 180.00,
        subtotal: 1800.00,
        status: 'unpaid',
        selectionTimestamp: expect.any(String),
        // Should indicate future ticket generation
        willGenerateTickets: 20 // 10 attendees × 2 tickets per package
      });
      
      expect(result.current.orderSummary?.subtotal).toBe(1800.00);
    });
  });
});