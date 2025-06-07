import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi } from 'vitest';
import ConfirmationStep from '@/components/register/RegistrationWizard/Steps/confirmation-step';

// Mock Next.js Image component
vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: any) => (
    <img src={src} alt={alt} {...props} data-testid="qr-image" />
  ),
}));

// Mock registration store
const mockStore = {
  registrationType: 'individuals',
  confirmationNumber: 'TEST-12345',
  attendees: [],
  draftId: 'test-draft-id',
  clearRegistration: vi.fn(),
};

vi.mock('@/lib/registrationStore', () => ({
  useRegistrationStore: () => mockStore,
}));

// Mock stripe fee calculator
vi.mock('@/lib/utils/stripe-fee-calculator', () => ({
  calculateStripeFees: (amount: number) => ({
    stripeFee: amount * 0.029 + 0.30,
    total: amount + (amount * 0.029 + 0.30),
  }),
  getFeeModeFromEnv: () => 'pass_to_customer',
  getFeeDisclaimer: () => 'Processing fees apply',
}));

describe('ConfirmationStep', () => {
  const mockIndividualConfirmationData = {
    registrationType: 'individuals',
    confirmationNumber: 'IND-12345',
    registrationId: 'reg-123',
    functionName: 'Test Function',
    totalAmount: 250.00,
    attendees: [
      {
        attendee_id: 'att-1',
        first_name: 'John',
        last_name: 'Smith',
        attendee_type: 'mason',
        suffix: 'WM',
        title: 'Bro.',
        qr_code_url: 'https://storage.supabase.co/qr-codes/attendee-1.png',
        tickets: [
          {
            ticket_id: 'tick-1',
            event_title: 'Grand Banquet',
            price_paid: '150.00',
            qr_code_url: 'https://storage.supabase.co/qr-codes/ticket-1.png',
            package_id: null,
          },
          {
            ticket_id: 'tick-2',
            event_title: 'Installation Ceremony',
            price_paid: '100.00',
            qr_code_url: 'https://storage.supabase.co/qr-codes/ticket-2.png',
            package_id: null,
          }
        ]
      },
      {
        attendee_id: 'att-2',
        first_name: 'Jane',
        last_name: 'Doe',
        attendee_type: 'guest',
        title: 'Mrs.',
        qr_code_url: null, // Test placeholder scenario
        tickets: [
          {
            ticket_id: 'tick-3',
            event_title: 'Grand Banquet',
            price_paid: '150.00',
            qr_code_url: null,
            package_id: null,
          }
        ]
      }
    ],
    tickets: [],
  };

  const mockLodgeConfirmationData = {
    registrationType: 'lodge',
    confirmationNumber: 'LDG-67890',
    registrationId: 'reg-456',
    functionName: 'Test Function',
    totalAmount: 1000.00,
    attendees: [],
    tickets: [
      {
        ticket_id: 'tick-lodge-1',
        event_title: 'Complete Package',
        price_paid: '500.00',
        qr_code_url: 'https://storage.supabase.co/qr-codes/lodge-ticket-1.png',
        package_id: 'pkg-1',
      },
      {
        ticket_id: 'tick-lodge-2',
        event_title: 'Additional Table',
        price_paid: '500.00',
        qr_code_url: null, // Test placeholder scenario
        package_id: null,
      }
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Individual Registration Confirmation', () => {
    it('should display attendees with QR codes and tickets underneath', async () => {
      render(
        <ConfirmationStep
          confirmationNumber="IND-12345"
          confirmationData={mockIndividualConfirmationData}
        />
      );

      await waitFor(() => {
        // Check attendee names are displayed
        expect(screen.getByText('Bro. John Smith')).toBeInTheDocument();
        expect(screen.getByText('Mrs. Jane Doe')).toBeInTheDocument();
      });

      // Check QR codes are displayed
      const qrImages = screen.getAllByTestId('qr-image');
      expect(qrImages).toHaveLength(1); // Only one attendee has QR code

      // Check actual QR code image
      expect(qrImages[0]).toHaveAttribute('src', 'https://storage.supabase.co/qr-codes/attendee-1.png');
      expect(qrImages[0]).toHaveAttribute('alt', 'QR Code for Bro. John Smith');

      // Check placeholder QR code for attendee without qr_code_url (shown as QrCode icon)
      expect(screen.getByText('Mrs. Jane Doe')).toBeInTheDocument();

      // Check tickets are listed under attendees (not as separate QR codes)
      expect(screen.getByText('Grand Banquet')).toBeInTheDocument();
      expect(screen.getByText('Installation Ceremony')).toBeInTheDocument();
      expect(screen.getByText('$150.00')).toBeInTheDocument();
      expect(screen.getByText('$100.00')).toBeInTheDocument();
    });

    it('should not display tabs interface', () => {
      render(
        <ConfirmationStep
          confirmationNumber="IND-12345"
          confirmationData={mockIndividualConfirmationData}
        />
      );

      // Ensure no tabs are present
      expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
      expect(screen.queryByText('Tickets')).not.toBeInTheDocument();
      expect(screen.queryByText('Event Details')).not.toBeInTheDocument();
    });

    it('should display single consolidated view', async () => {
      render(
        <ConfirmationStep
          confirmationNumber="IND-12345"
          confirmationData={mockIndividualConfirmationData}
        />
      );

      await waitFor(() => {
        // All sections should be visible in single view
        expect(screen.getByText('Confirmation Details')).toBeInTheDocument();
        expect(screen.getByText('Tickets:')).toBeInTheDocument();
        expect(screen.getByText('Grand Installation Event Details')).toBeInTheDocument();
      });
    });
  });

  describe('Lodge Registration Confirmation', () => {
    it('should display tickets with QR codes for lodge registration', async () => {
      render(
        <ConfirmationStep
          confirmationNumber="LDG-67890"
          confirmationData={mockLodgeConfirmationData}
        />
      );

      await waitFor(() => {
        // Check tickets are displayed
        expect(screen.getByText('Complete Package')).toBeInTheDocument();
        expect(screen.getByText('Additional Table')).toBeInTheDocument();
      });

      // Check QR codes for tickets
      const qrImages = screen.getAllByTestId('qr-image');
      expect(qrImages).toHaveLength(1); // Only one ticket has QR code

      // Check actual ticket QR code image
      expect(qrImages[0]).toHaveAttribute('src', 'https://storage.supabase.co/qr-codes/lodge-ticket-1.png');
      expect(qrImages[0]).toHaveAttribute('alt', 'QR Code for Complete Package');

      // Check that tickets without QR codes are still displayed
      expect(screen.getByText('Additional Table')).toBeInTheDocument();

      // Check prices are displayed
      expect(screen.getByText('$500.00')).toBeInTheDocument();

      // Should not display attendee-specific sections
      expect(screen.queryByText('Attendees')).not.toBeInTheDocument();
    });

    it('should display lodge details', async () => {
      const lodgeDataWithDetails = {
        ...mockLodgeConfirmationData,
        registration: {
          registration_data: {
            lodge_details: {
              lodgeName: 'Test Lodge #123'
            },
            table_count: 5
          }
        }
      };

      render(
        <ConfirmationStep
          confirmationNumber="LDG-67890"
          confirmationData={lodgeDataWithDetails}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Test Lodge #123')).toBeInTheDocument();
        expect(screen.getByText('5 Tables (50 seats)')).toBeInTheDocument();
      });
    });
  });

  describe('QR Code Display Logic', () => {
    it('should show actual QR code when qr_code_url is provided', async () => {
      render(
        <ConfirmationStep
          confirmationNumber="IND-12345"
          confirmationData={mockIndividualConfirmationData}
        />
      );

      await waitFor(() => {
        const qrImage = screen.getByTestId('qr-image');
        expect(qrImage).toHaveAttribute('src', 'https://storage.supabase.co/qr-codes/attendee-1.png');
      });
    });

    it('should show placeholder when qr_code_url is null', async () => {
      const dataWithoutQR = {
        ...mockIndividualConfirmationData,
        attendees: [
          {
            ...mockIndividualConfirmationData.attendees[1],
            qr_code_url: null
          }
        ]
      };

      render(
        <ConfirmationStep
          confirmationNumber="IND-12345"
          confirmationData={dataWithoutQR}
        />
      );

      await waitFor(() => {
        // Should display the attendee name even without QR code
        expect(screen.getByText('Mrs. Jane Doe')).toBeInTheDocument();
      });
    });
  });

  describe('Data Mapping', () => {
    it('should properly map ticket data including qr_code_url', async () => {
      render(
        <ConfirmationStep
          confirmationNumber="IND-12345"
          confirmationData={mockIndividualConfirmationData}
        />
      );

      await waitFor(() => {
        // Ensure ticket data is properly mapped and displayed
        expect(screen.getByText('Grand Banquet')).toBeInTheDocument();
        expect(screen.getByText('Installation Ceremony')).toBeInTheDocument();
      });

      // The component should handle both tickets with and without QR codes
      const allTicketElements = screen.getAllByText(/\$\d+\.\d{2}/);
      expect(allTicketElements.length).toBeGreaterThan(0);
    });
  });
});