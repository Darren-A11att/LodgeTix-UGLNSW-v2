/**
 * Integration Test: Ticket Persistence with Metadata
 * Tests that enhanced metadata is properly persisted when saving ticket selections
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRegistrationStore } from '@/lib/registrationStore';
import type { 
  FunctionTicketDefinition, 
  FunctionPackage 
} from '@/lib/services/function-tickets-service';

// Mock fetch for API calls
global.fetch = vi.fn() as any;

// Mock data
const mockFunctionId = '123e4567-e89b-12d3-a456-426614174000';
const mockDraftId = '987e6543-e21b-12d3-a456-426614174999';

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

describe('Ticket Persistence with Enhanced Metadata', () => {
  beforeEach(() => {
    // Reset store
    const { clearRegistration } = useRegistrationStore.getState();
    act(() => {
      clearRegistration();
    });
    
    // Reset mock
    vi.resetAllMocks();
  });

  it('should persist enhanced metadata when saving ticket selections', async () => {
    const { result } = renderHook(() => useRegistrationStore());
    
    // Step 1: Set up registration with metadata
    act(() => {
      result.current.setFunctionId(mockFunctionId);
      result.current.setRegistrationType('individuals');
      result.current.addMasonAttendee();
      
      // Capture metadata
      result.current.captureFunctionMetadata({
        functionId: mockFunctionId,
        functionName: '2024 Grand Installation',
        functionSlug: 'grand-installation-2024',
        functionType: 'installation',
        startDate: '2024-06-15',
        endDate: '2024-06-16',
        description: 'Annual Grand Installation Weekend'
      });
      
      result.current.captureTicketMetadata(mockTicket, {
        startDate: '2024-06-15T18:00:00Z',
        endDate: '2024-06-15T23:00:00Z',
        venue: 'Sydney Town Hall'
      });
      
      result.current.capturePackageMetadata(mockPackage, [mockTicket]);
    });
    
    const attendeeId = result.current.attendees[0].attendeeId;
    
    // Step 2: Make selections
    act(() => {
      result.current.addAttendeePackageSelection(attendeeId, mockPackage.id, 1);
      result.current.updateOrderSummary();
    });
    
    // Step 3: Mock successful API response
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true })
    } as Response);
    
    // Step 4: Call persistence API
    const storeState = result.current;
    const response = await fetch(`/api/registrations/drafts/${mockDraftId}/tickets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        functionId: mockFunctionId,
        ticketSelections: { [attendeeId]: { packages: [{ packageId: mockPackage.id, quantity: 1 }], individualTickets: [] } },
        functionMetadata: storeState.functionMetadata,
        ticketMetadata: storeState.ticketMetadata,
        packageMetadata: storeState.packageMetadata,
        attendeeSelections: storeState.attendeeSelections,
        orderSummary: storeState.orderSummary,
        lodgeBulkSelection: storeState.lodgeBulkSelection
      })
    });
    
    // Verify API was called with enhanced metadata
    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, options] = vi.mocked(global.fetch).mock.calls[0];
    expect(url).toBe(`/api/registrations/drafts/${mockDraftId}/tickets`);
    
    const payload = JSON.parse(options.body);
    
    // Verify enhanced metadata was included
    expect(payload.functionMetadata).toBeDefined();
    expect(payload.functionMetadata.functionName).toBe('2024 Grand Installation');
    
    expect(payload.ticketMetadata).toBeDefined();
    expect(payload.ticketMetadata[mockTicket.id]).toBeDefined();
    expect(payload.ticketMetadata[mockTicket.id].event.venue).toBe('Sydney Town Hall');
    
    expect(payload.packageMetadata).toBeDefined();
    expect(payload.packageMetadata[mockPackage.id]).toBeDefined();
    expect(payload.packageMetadata[mockPackage.id].includedTickets).toHaveLength(1);
    
    expect(payload.attendeeSelections).toBeDefined();
    expect(payload.attendeeSelections[attendeeId]).toBeDefined();
    expect(payload.attendeeSelections[attendeeId].packages).toHaveLength(1);
    
    expect(payload.orderSummary).toBeDefined();
    expect(payload.orderSummary.totalPackages).toBe(1);
    expect(payload.orderSummary.subtotal).toBe(180.00);
  });

  it('should handle lodge bulk selection metadata', async () => {
    const { result } = renderHook(() => useRegistrationStore());
    
    // Set up lodge registration
    act(() => {
      result.current.setFunctionId(mockFunctionId);
      result.current.setRegistrationType('lodge');
      result.current.setLodgeTicketOrder({
        tableCount: 2,
        totalTickets: 20,
        galaDinnerTickets: 20,
        ceremonyTickets: 0,
        eventId: 'evt_456',
        galaDinnerEventId: 'evt_456',
        ceremonyEventId: ''
      });
      
      // Capture metadata
      result.current.capturePackageMetadata(mockPackage, [mockTicket]);
      result.current.addLodgeBulkPackageSelection(mockPackage.id, 20);
    });
    
    // Mock API response
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true })
    } as Response);
    
    // Call persistence API
    const storeState = result.current;
    const response = await fetch(`/api/registrations/drafts/${mockDraftId}/tickets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        functionId: mockFunctionId,
        ticketSelections: {},
        lodgeBulkSelection: storeState.lodgeBulkSelection,
        packageMetadata: storeState.packageMetadata,
        orderSummary: storeState.orderSummary
      })
    });
    
    // Verify lodge bulk selection was included
    const payload = JSON.parse(vi.mocked(global.fetch).mock.calls[0][1].body);
    
    expect(payload.lodgeBulkSelection).toBeDefined();
    expect(payload.lodgeBulkSelection.packageId).toBe(mockPackage.id);
    expect(payload.lodgeBulkSelection.quantity).toBe(20);
    expect(payload.lodgeBulkSelection.willGenerateTickets).toBe(20);
    expect(payload.lodgeBulkSelection.subtotal).toBe(3600); // 20 * 180
    
    expect(payload.orderSummary).toBeDefined();
    expect(payload.orderSummary.totalTickets).toBe(20);
    expect(payload.orderSummary.registrationType).toBe('lodge');
  });
});