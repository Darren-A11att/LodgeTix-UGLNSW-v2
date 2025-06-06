import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AttendeeWithPartner } from '../AttendeeWithPartner';
import { usePartnerManager } from '../lib/usePartnerManager';

// Mock the dependencies
vi.mock('../lib/usePartnerManager');
vi.mock('../../mason/Layouts/MasonForm', () => ({
  default: ({ attendeeId }: { attendeeId: string }) => <div data-testid={`mason-form-${attendeeId}`}>Mason Form</div>
}));
vi.mock('../../guest/Layouts/GuestForm', () => ({
  default: ({ attendeeId }: { attendeeId: string }) => <div data-testid={`guest-form-${attendeeId}`}>Guest Form</div>
}));

describe('AttendeeWithPartner', () => {
  const mockUsePartnerManager = vi.mocked(usePartnerManager);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('attendee type handling', () => {
    it('should render MasonForm for lowercase "mason" attendee type', async () => {
      mockUsePartnerManager.mockReturnValue({
        attendee: { 
          attendeeId: 'test-123',
          attendeeType: 'mason' // lowercase as per database
        },
        partner: null,
        hasPartner: false,
        togglePartner: jest.fn(),
        updatePartnerRelationship: jest.fn()
      } as any);

      render(<AttendeeWithPartner attendeeId="test-123" attendeeNumber={1} />);
      
      // Wait for lazy loading
      const masonForm = await screen.findByTestId('mason-form-test-123');
      expect(masonForm).toBeInTheDocument();
    });

    it('should render GuestForm for lowercase "guest" attendee type', async () => {
      mockUsePartnerManager.mockReturnValue({
        attendee: { 
          attendeeId: 'test-456',
          attendeeType: 'guest' // lowercase as per database
        },
        partner: null,
        hasPartner: false,
        togglePartner: jest.fn(),
        updatePartnerRelationship: jest.fn()
      } as any);

      render(<AttendeeWithPartner attendeeId="test-456" attendeeNumber={1} />);
      
      // Wait for lazy loading
      const guestForm = await screen.findByTestId('guest-form-test-456');
      expect(guestForm).toBeInTheDocument();
    });

    it('should handle deprecated "ladypartner" type by rendering MasonForm', async () => {
      mockUsePartnerManager.mockReturnValue({
        attendee: { 
          attendeeId: 'test-789',
          attendeeType: 'ladypartner', // deprecated type
          is_partner: true
        },
        partner: null,
        hasPartner: false,
        togglePartner: jest.fn(),
        updatePartnerRelationship: jest.fn()
      } as any);

      render(<AttendeeWithPartner attendeeId="test-789" attendeeNumber={1} />);
      
      // Should map to mason form
      const masonForm = await screen.findByTestId('mason-form-test-789');
      expect(masonForm).toBeInTheDocument();
    });

    it('should handle deprecated "guestpartner" type by rendering GuestForm', async () => {
      mockUsePartnerManager.mockReturnValue({
        attendee: { 
          attendeeId: 'test-999',
          attendeeType: 'guestpartner', // deprecated type
          is_partner: true
        },
        partner: null,
        hasPartner: false,
        togglePartner: jest.fn(),
        updatePartnerRelationship: jest.fn()
      } as any);

      render(<AttendeeWithPartner attendeeId="test-999" attendeeNumber={1} />);
      
      // Should map to guest form
      const guestForm = await screen.findByTestId('guest-form-test-999');
      expect(guestForm).toBeInTheDocument();
    });

    it('should show "add attendee" prompt for unknown attendee type', () => {
      mockUsePartnerManager.mockReturnValue({
        attendee: { 
          attendeeId: 'test-unknown',
          attendeeType: 'unknown' as any
        },
        partner: null,
        hasPartner: false,
        togglePartner: jest.fn(),
        updatePartnerRelationship: jest.fn()
      } as any);

      render(<AttendeeWithPartner attendeeId="test-unknown" attendeeNumber={1} />);
      
      expect(screen.getByText(/please add an attendee/i)).toBeInTheDocument();
      expect(screen.getByText(/select either mason or guest/i)).toBeInTheDocument();
    });

    it('should show "add attendee" prompt when attendee type is missing', () => {
      mockUsePartnerManager.mockReturnValue({
        attendee: { 
          attendeeId: 'test-missing',
          attendeeType: undefined as any
        },
        partner: null,
        hasPartner: false,
        togglePartner: jest.fn(),
        updatePartnerRelationship: jest.fn()
      } as any);

      render(<AttendeeWithPartner attendeeId="test-missing" attendeeNumber={1} />);
      
      expect(screen.getByText(/please add an attendee/i)).toBeInTheDocument();
      expect(screen.getByText(/select either mason or guest/i)).toBeInTheDocument();
    });

    it('should render nothing when attendee is null', () => {
      mockUsePartnerManager.mockReturnValue({
        attendee: null,
        partner: null,
        hasPartner: false,
        togglePartner: jest.fn(),
        updatePartnerRelationship: jest.fn()
      } as any);

      const { container } = render(<AttendeeWithPartner attendeeId="test-null" attendeeNumber={1} />);
      
      expect(container.firstChild).toBeNull();
    });
  });

  describe('partner functionality', () => {
    it('should show partner toggle when allowPartner is true and no partner exists', () => {
      mockUsePartnerManager.mockReturnValue({
        attendee: { 
          attendeeId: 'test-partner',
          attendeeType: 'mason'
        },
        partner: null,
        hasPartner: false,
        togglePartner: jest.fn(),
        updatePartnerRelationship: jest.fn()
      } as any);

      render(<AttendeeWithPartner attendeeId="test-partner" attendeeNumber={1} allowPartner={true} />);
      
      expect(screen.getByText('Add Partner')).toBeInTheDocument();
    });

    it('should not show partner toggle when allowPartner is false', () => {
      mockUsePartnerManager.mockReturnValue({
        attendee: { 
          attendeeId: 'test-no-partner',
          attendeeType: 'mason'
        },
        partner: null,
        hasPartner: false,
        togglePartner: jest.fn(),
        updatePartnerRelationship: jest.fn()
      } as any);

      render(<AttendeeWithPartner attendeeId="test-no-partner" attendeeNumber={1} allowPartner={false} />);
      
      expect(screen.queryByText('Add Partner')).not.toBeInTheDocument();
    });

    it('should render partner form as Guest when partner exists', async () => {
      mockUsePartnerManager.mockReturnValue({
        attendee: { 
          attendeeId: 'test-with-partner',
          attendeeType: 'mason'
        },
        partner: {
          attendeeId: 'partner-123',
          attendeeType: 'guest'
        },
        hasPartner: true,
        togglePartner: jest.fn(),
        updatePartnerRelationship: jest.fn()
      } as any);

      render(<AttendeeWithPartner attendeeId="test-with-partner" attendeeNumber={1} />);
      
      // Both forms should render
      const masonForm = await screen.findByTestId('mason-form-test-with-partner');
      const guestForm = await screen.findByTestId('guest-form-partner-123');
      
      expect(masonForm).toBeInTheDocument();
      expect(guestForm).toBeInTheDocument();
      expect(screen.getByText('Partner Details')).toBeInTheDocument();
    });
  });
});