import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createUserEncryptedStorage } from '@/lib/utils/user-encrypted-storage';

// Confirmation email tracking
export interface ConfirmationEmail {
  status: number; // HTTP status code (e.g., 200)
  emailId: string; // Email ID from response
  to: string; // Email address sent to
  sentAt: number; // Timestamp when sent
}

// Registration metadata for support/debugging
export interface RegistrationMetadata {
  registrationType: 'individuals' | 'lodge' | 'delegation';
  primaryAttendee?: {
    title?: string;
    firstName: string;
    lastName: string;
    rank?: string;
    grandRank?: string;
    isGrandOfficer?: boolean;
    grandOffice?: string;
    attendeeType: string;
  };
  attendees: Array<{
    attendeeId: string;
    title?: string;
    firstName: string;
    lastName: string;
    attendeeType: string;
    rank?: string;
    selectedTickets: Array<{
      ticketId: string;
      ticketName: string;
      price: number;
      isPackage: boolean;
    }>;
  }>;
  totalAttendees: number;
  totalAmount: number;
  subtotal: number;
}

// Completed registration record
export interface CompletedRegistration {
  completedAt: number; // Timestamp of completion
  registrationId: string;
  functionId: string;
  functionStartDate: string; // ISO date string
  confirmationNumber: string;
  paymentReference: {
    provider: 'square' | 'stripe' | string; // Extensible for future providers
    paymentId?: string; // Square payment ID
    paymentIntentId?: string; // Stripe payment intent ID
    transactionId?: string; // Generic transaction ID
  };
  paymentStatus: string; // As reported by payment provider
  userId: string; // Anonymous or authenticated user ID
  confirmationEmails: ConfirmationEmail[]; // Array to track multiple send attempts
  expiresAt: number; // 90 days after function start date
  metadata?: RegistrationMetadata; // Rich metadata for support/debugging
}

// Store state interface
interface CompletedRegistrationsState {
  registrations: CompletedRegistration[];
  
  // Actions
  addCompletedRegistration: (registration: Omit<CompletedRegistration, 'expiresAt'>) => void;
  addConfirmationEmail: (registrationId: string, email: ConfirmationEmail) => void;
  getRegistrationByConfirmation: (confirmationNumber: string) => CompletedRegistration | null;
  getRegistrationById: (registrationId: string) => CompletedRegistration | null;
  getAllRegistrations: () => CompletedRegistration[];
  clearExpiredRegistrations: () => void;
  clearAllRegistrations: () => void;
}

// Calculate expiry date (90 days after function start date)
const calculateExpiryDate = (functionStartDate: string): number => {
  const startDate = new Date(functionStartDate);
  const expiryDate = new Date(startDate);
  expiryDate.setDate(expiryDate.getDate() + 90);
  return expiryDate.getTime();
};

// Create the store
export const useCompletedRegistrationsStore = create<CompletedRegistrationsState>()(
  persist(
    (set, get) => ({
      registrations: [],

      addCompletedRegistration: (registration) => {
        const expiresAt = calculateExpiryDate(registration.functionStartDate);
        const newRegistration: CompletedRegistration = {
          ...registration,
          expiresAt
        };

        set((state) => {
          // Check if registration already exists
          const existingIndex = state.registrations.findIndex(
            r => r.registrationId === registration.registrationId
          );

          if (existingIndex >= 0) {
            // Update existing registration
            const updated = [...state.registrations];
            updated[existingIndex] = newRegistration;
            return { registrations: updated };
          } else {
            // Add new registration
            return { registrations: [...state.registrations, newRegistration] };
          }
        });

        console.log('✅ Completed registration stored:', {
          confirmationNumber: registration.confirmationNumber,
          registrationId: registration.registrationId,
          expiresAt: new Date(expiresAt).toISOString()
        });
      },

      addConfirmationEmail: (registrationId, email) => {
        set((state) => {
          const updated = state.registrations.map((reg) => {
            if (reg.registrationId === registrationId) {
              return {
                ...reg,
                confirmationEmails: [...reg.confirmationEmails, email]
              };
            }
            return reg;
          });
          return { registrations: updated };
        });

        console.log('📧 Confirmation email tracked:', {
          registrationId,
          emailId: email.emailId,
          to: email.to
        });
      },

      getRegistrationByConfirmation: (confirmationNumber) => {
        const registrations = get().registrations;
        return registrations.find(r => r.confirmationNumber === confirmationNumber) || null;
      },

      getRegistrationById: (registrationId) => {
        const registrations = get().registrations;
        return registrations.find(r => r.registrationId === registrationId) || null;
      },

      getAllRegistrations: () => {
        return get().registrations;
      },

      clearExpiredRegistrations: () => {
        const now = Date.now();
        set((state) => ({
          registrations: state.registrations.filter(reg => reg.expiresAt > now)
        }));
        console.log('🧹 Cleared expired registrations');
      },

      clearAllRegistrations: () => {
        set({ registrations: [] });
        console.log('🗑️ Cleared all completed registrations');
      }
    }),
    {
      name: 'lodgetix-completed-registrations',
      storage: createJSONStorage(() => createUserEncryptedStorage()),
      onRehydrateStorage: () => {
        return (state, error) => {
          if (error) {
            console.error('❌ Failed to load completed registrations:', error);
          } else if (state) {
            // Clear expired registrations on rehydration
            const now = Date.now();
            const expired = state.registrations.filter(r => r.expiresAt <= now);
            if (expired.length > 0) {
              console.log(`🧹 Clearing ${expired.length} expired registrations on startup`);
              state.clearExpiredRegistrations();
            }
            console.log(`✅ Loaded ${state.registrations.length} completed registrations`);
          }
        };
      }
    }
  )
);

// Selector helpers
export const selectCompletedRegistrations = (state: CompletedRegistrationsState) => state.registrations;
export const selectRegistrationByConfirmation = (confirmationNumber: string) => 
  (state: CompletedRegistrationsState) => state.getRegistrationByConfirmation(confirmationNumber);
export const selectRegistrationById = (registrationId: string) => 
  (state: CompletedRegistrationsState) => state.getRegistrationById(registrationId);