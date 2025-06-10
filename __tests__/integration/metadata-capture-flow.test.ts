/**
 * Integration Test: Metadata Capture Flow
 * Tests the full flow of metadata capture from ticket selection through to payment
 */

import { renderHook, act } from '@testing-library/react';
import { useRegistrationStore } from '@/lib/registrationStore';
import type { 
  FunctionTicketDefinition, 
  FunctionPackage 
} from '@/lib/services/function-tickets-service';

// Mock data
const mockFunctionId = '123e4567-e89b-12d3-a456-426614174000';

const mockTicket: FunctionTicketDefinition = {
  id: 'et_123',
  name: 'Gala Dinner Ticket',
  description: 'Evening gala dinner',
  price: 150.00,
  event_id: 'evt_456',
  event_title: 'Installation Gala Dinner',
  event_subtitle: 'Black Tie Event',
  event_slug: 'gala-dinner-2024',
  function_id: mockFunctionId,
  is_active: true,
  total_capacity: 500,
  available_count: 125,
  reserved_count: 0,
  sold_count: 375,
  status: 'available',
  eligibility_criteria: null,
  eligibleAttendeeTypes: ['mason', 'guest']
};

const mockPackage: FunctionPackage = {
  id: 'pkg_789',
  name: 'Full Weekend Package',
  description: 'Includes ceremony and gala dinner',
  price: 180.00,
  original_price: 200.00,
  discount: 20.00,
  function_id: mockFunctionId,
  is_active: true,
  qty: null,
  includes: ['et_123'],
  includes_description: ['Gala Dinner'],
  eligibility_criteria: null,
  eligibleAttendeeTypes: ['mason'],
  eligibleRegistrationTypes: ['individual', 'delegation']
};

describe('Metadata Capture Integration Flow', () => {
  beforeEach(() => {
    // Reset store
    const { clearRegistration } = useRegistrationStore.getState();
    act(() => {
      clearRegistration();
    });
  });

  it('should capture complete metadata through selection flow', () => {
    const { result } = renderHook(() => useRegistrationStore());
    
    // Step 1: Set up registration
    act(() => {
      result.current.setFunctionId(mockFunctionId);
      result.current.setRegistrationType('individuals');
      result.current.addMasonAttendee();
    });
    
    const attendeeId = result.current.attendees[0].attendeeId;
    
    // Step 2: Capture ticket metadata (simulating fetch)
    act(() => {
      result.current.captureTicketMetadata(mockTicket, {
        startDate: '2024-06-15T18:00:00Z',
        endDate: '2024-06-15T23:00:00Z',
        venue: 'Sydney Town Hall'
      });
      result.current.capturePackageMetadata(mockPackage, [mockTicket]);
    });
    
    // Verify metadata was captured
    expect(result.current.ticketMetadata[mockTicket.id]).toBeDefined();
    expect(result.current.packageMetadata[mockPackage.id]).toBeDefined();
    
    // Step 3: Select a package
    act(() => {
      // Using both old and new actions as per implementation
      result.current.updatePackageSelection(attendeeId, {
        ticketDefinitionId: mockPackage.id,
        selectedEvents: mockPackage.includes
      });
      result.current.addPackageSelection(attendeeId, {
        packageId: mockPackage.id,
        quantity: 1,
        tickets: mockPackage.includes.map(id => ({ ticketId: id, quantity: 1 }))
      });
      result.current.addAttendeePackageSelection(attendeeId, mockPackage.id, 1);
    });
    
    // Verify selection was captured
    expect(result.current.attendeeSelections[attendeeId]).toBeDefined();
    expect(result.current.attendeeSelections[attendeeId].packages).toHaveLength(1);
    expect(result.current.attendeeSelections[attendeeId].attendeeSubtotal).toBe(180.00);
    
    // Step 4: Update order summary
    act(() => {
      result.current.updateOrderSummary();
    });
    
    // Verify order summary
    const orderSummary = result.current.orderSummary;
    expect(orderSummary).toBeDefined();
    expect(orderSummary?.functionId).toBe(mockFunctionId);
    expect(orderSummary?.totalAttendees).toBe(1);
    expect(orderSummary?.subtotal).toBe(180.00);
    expect(orderSummary?.totalPackages).toBe(1);
    expect(orderSummary?.totalTickets).toBe(1); // Package includes 1 ticket
    
    // Step 5: Verify complete state for payment
    const completeState = result.current;
    
    // Verify all metadata is available
    expect(completeState.functionMetadata).toBeNull(); // Not set in this test
    expect(Object.keys(completeState.ticketMetadata)).toHaveLength(1);
    expect(Object.keys(completeState.packageMetadata)).toHaveLength(1);
    expect(Object.keys(completeState.attendeeSelections)).toHaveLength(1);
    expect(completeState.orderSummary).toBeDefined();
    
    // Verify backward compatibility
    expect(completeState.packages[attendeeId]).toBeDefined();
    expect(completeState.packages[attendeeId].ticketDefinitionId).toBe(mockPackage.id);
    expect(completeState.ticketSelections[attendeeId]).toBeDefined();
  });

  it('should handle individual ticket selections', () => {
    const { result } = renderHook(() => useRegistrationStore());
    
    // Setup
    act(() => {
      result.current.setFunctionId(mockFunctionId);
      result.current.setRegistrationType('individuals');
      result.current.addMasonAttendee();
      result.current.captureTicketMetadata(mockTicket, {});
    });
    
    const attendeeId = result.current.attendees[0].attendeeId;
    
    // Select individual ticket
    act(() => {
      result.current.updatePackageSelection(attendeeId, {
        ticketDefinitionId: null,
        selectedEvents: [mockTicket.id]
      });
      result.current.addIndividualTicket(attendeeId, {
        ticketId: mockTicket.id,
        quantity: 1
      });
      result.current.addAttendeeTicketSelection(attendeeId, mockTicket.id, 1);
      result.current.updateOrderSummary();
    });
    
    // Verify
    expect(result.current.attendeeSelections[attendeeId].individualTickets).toHaveLength(1);
    expect(result.current.attendeeSelections[attendeeId].attendeeSubtotal).toBe(150.00);
    expect(result.current.orderSummary?.subtotal).toBe(150.00);
    expect(result.current.orderSummary?.totalTickets).toBe(1);
  });

  it('should handle lodge bulk selections', () => {
    const { result } = renderHook(() => useRegistrationStore());
    
    // Setup lodge registration
    act(() => {
      result.current.setFunctionId(mockFunctionId);
      result.current.setRegistrationType('lodge');
      result.current.setLodgeTicketOrder({
        tableCount: 1,
        totalTickets: 10,
        galaDinnerTickets: 10,
        ceremonyTickets: 0,
        eventId: 'evt_456',
        galaDinnerEventId: 'evt_456',
        ceremonyEventId: ''
      });
      result.current.capturePackageMetadata(mockPackage, [mockTicket]);
    });
    
    // Make bulk selection
    act(() => {
      result.current.addLodgeBulkPackageSelection(mockPackage.id, 10);
    });
    
    // Verify
    expect(result.current.lodgeBulkSelection).toBeDefined();
    expect(result.current.lodgeBulkSelection?.quantity).toBe(10);
    expect(result.current.lodgeBulkSelection?.subtotal).toBe(1800.00);
    expect(result.current.lodgeBulkSelection?.willGenerateTickets).toBe(10);
    expect(result.current.orderSummary?.subtotal).toBe(1800.00);
    expect(result.current.orderSummary?.totalTickets).toBe(10);
  });
});