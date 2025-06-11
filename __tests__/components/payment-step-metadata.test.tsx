/**
 * Test: Payment Step with Enhanced Metadata
 * Verifies that payment step properly displays ticket information from enhanced metadata
 */

import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { renderHook, act } from '@testing-library/react';
import PaymentStep from '@/components/register/RegistrationWizard/Steps/payment-step';
import { useRegistrationStore } from '@/lib/registrationStore';
import type { 
  FunctionTicketDefinition, 
  FunctionPackage 
} from '@/lib/services/function-tickets-service';

// Mock dependencies
vi.mock('@/lib/supabase-singleton', () => ({
  getBrowserClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user123' } } }),
      getSession: vi.fn().mockResolvedValue({ data: { session: { access_token: 'token123' } } })
    }
  }))
}));

vi.mock('@/lib/services/function-tickets-service', () => ({
  getFunctionTicketsService: vi.fn(() => ({
    getFunctionTicketsAndPackages: vi.fn().mockResolvedValue({
      tickets: [],
      packages: []
    })
  }))
}));

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn()
  }))
}));

// Mock Stripe
(global as any).Stripe = vi.fn();

const mockFunctionId = '123e4567-e89b-12d3-a456-426614174000';

describe('Payment Step with Enhanced Metadata', () => {
  beforeEach(() => {
    // Reset store
    const { clearRegistration } = useRegistrationStore.getState();
    act(() => {
      clearRegistration();
    });
    
    // Mock anonymous session as established
    act(() => {
      useRegistrationStore.setState({ anonymousSessionEstablished: true });
    });
    
    vi.clearAllMocks();
  });

  it('should display ticket summary from enhanced metadata', async () => {
    // Setup store with enhanced metadata
    const { result } = renderHook(() => useRegistrationStore());
    
    act(() => {
      result.current.setFunctionId(mockFunctionId);
      result.current.setRegistrationType('individuals');
      result.current.addMasonAttendee();
    });
    
    // Get attendee ID after state update
    const attendeeId = result.current.attendees[0].attendeeId;
    
    act(() => {
      
      // Capture metadata as would happen in ticket selection
      result.current.captureTicketMetadata({
        id: 'et_123',
        name: 'Gala Dinner Ticket',
        description: 'Evening gala dinner',
        price: 150.00,
        event_id: 'evt_456',
        event_title: 'Installation Gala Dinner',
        function_id: mockFunctionId,
        is_active: true,
        total_capacity: 500,
        available_count: 125
      } as FunctionTicketDefinition, {});
      
      result.current.capturePackageMetadata({
        id: 'pkg_789',
        name: 'Full Weekend Package',
        description: 'Includes ceremony and gala dinner',
        price: 180.00,
        function_id: mockFunctionId,
        includes: ['et_123']
      } as FunctionPackage, [{
        id: 'et_123',
        name: 'Gala Dinner Ticket',
        price: 150.00
      } as FunctionTicketDefinition]);
      
      // Make selection
      result.current.addAttendeePackageSelection(attendeeId, 'pkg_789', 1);
      result.current.updateOrderSummary();
    });
    
    // Render payment step
    const { container } = render(
      <PaymentStep 
        functionId={mockFunctionId}
        onNextStep={vi.fn()}
        onPrevStep={vi.fn()}
      />
    );
    
    // Wait for component to load
    await waitFor(() => {
      expect(screen.queryByText(/Loading payment information/)).not.toBeInTheDocument();
    });
    
    // Check if enhanced summary is displayed
    await waitFor(() => {
      // Should show attendee name and package
      expect(screen.getByText('Full Weekend Package')).toBeInTheDocument();
      expect(screen.getByText('$180.00')).toBeInTheDocument();
      
      // Should show included tickets
      expect(screen.getByText(/Gala Dinner Ticket/)).toBeInTheDocument();
      expect(screen.getByText('Included')).toBeInTheDocument();
      
      // Should show subtotal from orderSummary
      expect(screen.getByText('Subtotal:')).toBeInTheDocument();
      expect(screen.getByText('$180.00')).toBeInTheDocument();
    });
  });

  it('should handle lodge bulk selection metadata', async () => {
    // Setup store with lodge metadata
    const { result } = renderHook(() => useRegistrationStore());
    
    act(() => {
      result.current.setFunctionId(mockFunctionId);
      result.current.setRegistrationType('lodge');
      result.current.setLodgeTicketOrder({
        tableCount: 2,
        totalTickets: 20,
        galaDinnerTickets: 20,
        ceremonyTickets: 0,
        eventId: 'evt_456'
      });
      
      // Capture package metadata
      result.current.capturePackageMetadata({
        id: 'pkg_789',
        name: 'Full Weekend Package',
        price: 180.00,
        includes: ['et_123']
      } as FunctionPackage, []);
      
      // Make lodge bulk selection
      result.current.addLodgeBulkPackageSelection('pkg_789', 20);
    });
    
    // Render payment step
    render(
      <PaymentStep 
        functionId={mockFunctionId}
        onNextStep={vi.fn()}
        onPrevStep={vi.fn()}
      />
    );
    
    // Wait for component to load
    await waitFor(() => {
      expect(screen.queryByText(/Loading payment information/)).not.toBeInTheDocument();
    });
    
    // Check if lodge order is displayed
    await waitFor(() => {
      expect(screen.getByText(/Lodge Order \(20 tickets\)/)).toBeInTheDocument();
      expect(screen.getByText('20 people')).toBeInTheDocument();
      expect(screen.getByText('Full Weekend Package')).toBeInTheDocument();
    });
  });

  it('should fall back to legacy display when metadata not available', async () => {
    // Setup store without metadata
    const { result } = renderHook(() => useRegistrationStore());
    
    act(() => {
      result.current.setFunctionId(mockFunctionId);
      result.current.setRegistrationType('individuals');
      result.current.addMasonAttendee();
    });
    
    // Get attendee ID after state update
    const attendeeId = result.current.attendees[0].attendeeId;
    
    act(() => {
      // Don't capture metadata, just use old package structure
      result.current.updatePackageSelection(attendeeId, 'pkg_789');
    });
    
    // Render payment step
    render(
      <PaymentStep 
        functionId={mockFunctionId}
        onNextStep={vi.fn()}
        onPrevStep={vi.fn()}
      />
    );
    
    // Wait for component to load
    await waitFor(() => {
      expect(screen.queryByText(/Loading payment information/)).not.toBeInTheDocument();
    });
    
    // Should show basic summary
    expect(screen.getByText('Total Attendees:')).toBeInTheDocument();
    expect(screen.getByText('Total Tickets:')).toBeInTheDocument();
  });
});