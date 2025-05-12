import { create, StateCreator } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { TicketType } from '../shared/types/register';
import { TicketDefinitionType } from '../shared/types/ticket';

// --- Define Unified Attendee Data Structure ---
// Combining all possible fields needed for any attendee type
export interface UnifiedAttendeeData {
  // Core IDs
  attendeeId: string; 
  registrationId?: string; // Overall registration ID (optional? Might be set later)
  personId?: string; // If linking to a separate persons table
  relatedAttendeeId?: string; // Link to primary Mason/Guest for partners

  // Type & Role
  attendeeType: 'mason' | 'lady_partner' | 'guest' | 'guest_partner' | 'delegation_member' | 'individual' | 'lodge_contact' | 'delegation_contact'; // Expanded types
  isPrimary?: boolean; // Added isPrimary flag

  // Personal Info
  title?: string;
  firstName: string; 
  lastName: string; 
  primaryEmail?: string;
  primaryPhone?: string;
  dietaryRequirements?: string;
  specialNeeds?: string;
  relationship?: string; // Partner/Guest relationship to primary

  // Contact Prefs
  contactPreference?: 'Directly' | 'PrimaryAttendee' | 'ProvideLater';
  contactConfirmed?: boolean;

  // Mason Specific
  memberNumber?: string;
  rank?: string; 
  grandRank?: string;
  grandLodgeId?: string | null;
  lodgeId?: string | null;
  lodgeNameNumber?: string | null; // Display name for the lodge (formatted)
  grandOfficer?: string; // Current or Past grand officer status
  grandOffice?: string; // The specific grand office title
  grandOfficeOther?: string; // For "Other" grand office specification
  pastGrandOffice?: string;
  isPastGrandMaster?: boolean;
  honours?: string;
  
  // Ticket/Event Info (Example structure)
  ticketDefinitionId?: string | null;
  selectedEvents?: string[];
  eventTitle?: string; // Title for specific events like Ladies Lunch

  // Flags/Other
  hasLadyPartner?: boolean; // Might be derivable from attendees array
  hasGuestPartner?: boolean; // Might be derivable

  // Add ticket field using PackageSelectionType
  ticket?: PackageSelectionType;
}

// --- Placeholder Types (Defined locally) ---
// Using RegistrationType defined here until shared types are stable
export type RegistrationType = 'individual' | 'lodge' | 'delegation';

// Placeholder type for package/ticket selections per attendee
// TODO: Define the actual structure based on package data
export interface PackageSelectionType {
  ticketDefinitionId: string | null;
  selectedEvents: string[]; // Array of event IDs
}

// Placeholder type for billing details
// TODO: Define the actual structure needed
export interface BillingDetailsType {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  stateProvince: string;
  postalCode: string;
  country: string;
}

// --- State Interface ---
export interface RegistrationState {
  draftId: string | null;
  registrationType: RegistrationType | null;
  attendees: UnifiedAttendeeData[];
  // Using Record<attendeeId, PackageSelectionType> for packages
  packages: Record<string, PackageSelectionType>;
  billingDetails: BillingDetailsType | null;
  agreeToTerms: boolean; // Add agreeToTerms
  status: 'idle' | 'loading' | 'draft' | 'error' | 'saving'; // Added idle/saving
  lastSaved: number | null;
  error: string | null;
  availableTickets: (TicketType | TicketDefinitionType)[]; // Add availableTickets
  currentStep: number; // Add currentStep for navigation
  confirmationNumber: string | null; // Add confirmationNumber for completion

  // --- Actions ---
  startNewRegistration: (type: RegistrationType) => string; // Returns new draftId
  addPrimaryAttendee: () => void; // New action
  loadDraft: (id: string) => void; // Sets draftId, relies on middleware for loading
  clearRegistration: () => void;
  setRegistrationType: (type: RegistrationType) => void;
  addAttendee: (attendee: Omit<UnifiedAttendeeData, 'attendeeId'>) => string; // Returns new attendeeId
  updateAttendee: (attendeeId: string, updatedData: Partial<UnifiedAttendeeData>) => void;
  removeAttendee: (attendeeId: string) => void;
  updatePackageSelection: (attendeeId: string, selection: PackageSelectionType) => void;
  updateBillingDetails: (details: BillingDetailsType) => void;
  setAgreeToTerms: (agreed: boolean) => void; // Add action
  _updateStatus: (status: RegistrationState['status'], error?: string | null) => void; // Internal helper
  // Navigation methods
  setCurrentStep: (step: number) => void;
  goToNextStep: () => void;
  goToPrevStep: () => void;
  // Confirmation methods
  setConfirmationNumber: (number: string) => void;
}

// --- Initial State ---
const initialRegistrationState: Omit<RegistrationState, 'startNewRegistration' | 'addPrimaryAttendee' | 'loadDraft' | 'clearRegistration' | 'setRegistrationType' | 'addAttendee' | 'updateAttendee' | 'removeAttendee' | 'updatePackageSelection' | 'updateBillingDetails' | 'setAgreeToTerms' | '_updateStatus' | 'setCurrentStep' | 'goToNextStep' | 'goToPrevStep' | 'setConfirmationNumber'> = {
    draftId: null,
    registrationType: null,
    attendees: [],
    packages: {},
    billingDetails: null,
    agreeToTerms: false, // Init agreeToTerms
    status: 'idle',
    lastSaved: null,
    error: null,
    availableTickets: [], // Initialize availableTickets
    currentStep: 1, // Start at step 1
    confirmationNumber: null, // No confirmation until complete
};

type RegistrationStateCreator = StateCreator<RegistrationState>;

// --- Store Implementation ---
export const useRegistrationStore = create<RegistrationState>(
  persist(
    (set, get) => ({
      ...initialRegistrationState,

      _updateStatus: (status, error = null) => set({ status, error }),

      startNewRegistration: (type) => {
        const newDraftId = `draft_${Date.now()}_${uuidv4().substring(0, 7)}`;
        console.log(`[Store] Starting new registration (Type: ${type}). Draft ID: ${newDraftId}. Clearing previous state.`); // DEBUG
        // Reset state, set new draftId and type, keep attendees empty for now
        set({
          draftId: newDraftId,
          registrationType: type,
          attendees: [], // Start with empty attendees
          packages: {}, 
          billingDetails: null, 
          agreeToTerms: false, 
          status: 'draft',
          lastSaved: null, 
          error: null, 
          availableTickets: [], 
        });
        return newDraftId;
      },

      addPrimaryAttendee: () => {
        set(state => {
          // Only add if attendees array is currently empty
          if (state.attendees.length > 0) {
            console.warn("[Store] addPrimaryAttendee called but attendees array is not empty.");
            return state; 
          }
          if (!state.registrationType) {
            console.error("[Store] addPrimaryAttendee called but registrationType is null.");
            return state;
          }

          // Determine primary attendee type based on registration type
          let primaryAttendeeType: UnifiedAttendeeData['attendeeType'];
          switch (state.registrationType) {
            case 'lodge':
              primaryAttendeeType = 'lodge_contact';
              break;
            case 'delegation':
              primaryAttendeeType = 'delegation_contact';
              break;
            case 'individual':
            default: 
              primaryAttendeeType = 'mason';
              break;
          }

          // Create the primary attendee object
          const newAttendeeId = uuidv4();
          const primaryAttendee: UnifiedAttendeeData = {
            attendeeId: newAttendeeId,
            attendeeType: primaryAttendeeType,
            isPrimary: true,
            firstName: '', 
            lastName: '', 
            // Default contactPreference to 'Directly' if the primary attendee is a Mason
            contactPreference: primaryAttendeeType === 'mason' ? 'Directly' : undefined,
            ticket: { ticketDefinitionId: null, selectedEvents: [] }, 
          };
          
          console.log(`[Store] Adding primary attendee (Type: ${primaryAttendeeType})`); // DEBUG
          return { attendees: [primaryAttendee] };
        });
      },

      loadDraft: (id) => {
        // Middleware handles loading data for this ID on hydration.
        // This action mainly signals intent and sets the active ID.
        const currentState = get();
        if (currentState.draftId !== id) {
             console.log(`Attempting to load draft: ${id}. Current state draftId: ${currentState.draftId}`);
             // If the middleware loaded a different draft, reset state before setting new ID
             set({ ...initialRegistrationState, draftId: id, status: 'loading' }); 
        } else {
             // Already loaded or loading this draft
             set({ status: 'draft' }); 
        }
        // After middleware hydrates, status should ideally become 'draft' 
        // We might need a way to detect hydration completion?
      },

      clearRegistration: () => {
        set({ ...initialRegistrationState }); // Reset to initial state
        console.log('Registration state cleared.');
      },

      setRegistrationType: (type) => {
        set({ registrationType: type });
      },

      addAttendee: (attendeeData) => {
        const newAttendeeId = uuidv4();
        const newAttendee: UnifiedAttendeeData = {
          ...attendeeData,
          attendeeId: newAttendeeId, 
          // Initialize ticket field
          ticket: { ticketDefinitionId: null, selectedEvents: [] }, 
        };

        // Explicitly set defaults for partners
        if (newAttendee.attendeeType === 'lady_partner' || newAttendee.attendeeType === 'guest_partner') {
          newAttendee.title = attendeeData.title ?? ''; // Ensure title is empty string if not provided
          newAttendee.relationship = attendeeData.relationship ?? ''; // Ensure relationship is empty string if not provided
          newAttendee.contactPreference = attendeeData.contactPreference ?? undefined; // Use undefined to match type
        }
        
        // Ensure required fields have defaults if somehow missing (defensive)
        if (!newAttendee.firstName) newAttendee.firstName = '';
        if (!newAttendee.lastName) newAttendee.lastName = '';
        
        set(state => ({
          attendees: [...state.attendees, newAttendee],
          // Don't need separate package init if ticket is on attendee
          // packages: { 
          //     ...state.packages, 
          //     [newAttendeeId]: { ticketDefinitionId: null, selectedEvents: [] } 
          // }
        }));
        return newAttendeeId;
      },

      updateAttendee: (attendeeId, updatedData) => {
        set(state => {
          const attendeeIndex = state.attendees.findIndex(att => att.attendeeId === attendeeId);
          if (attendeeIndex === -1) {
            console.warn(`[Store] updateAttendee: Attendee with ID ${attendeeId} not found.`);
            return state; // Return current state if attendee not found
          }

          // Deep copy the attendees array for modification
          const newAttendees = [...state.attendees];
          const attendeeToUpdate = { ...newAttendees[attendeeIndex] };

          // Initialize ticket object if it doesn't exist
          if (!attendeeToUpdate.ticket) {
            attendeeToUpdate.ticket = { ticketDefinitionId: null, selectedEvents: [] };
          }

          // Handle ticket update specifically
          if (updatedData.ticket) {
            const ticketUpdate = updatedData.ticket as PackageSelectionType;
            const currentTicketState = attendeeToUpdate.ticket || { ticketDefinitionId: null, selectedEvents: [] };

            let newTicketDefinitionId = currentTicketState.ticketDefinitionId;
            let newSelectedEvents = currentTicketState.selectedEvents;

            if (ticketUpdate.ticketDefinitionId !== undefined) {
              // Case 1: A package ID is being explicitly set (could be a string or null)
              newTicketDefinitionId = ticketUpdate.ticketDefinitionId;
              if (newTicketDefinitionId) { // A package is being selected
                // Find the package definition (assuming ticketPackages is accessible or passed in)
                // For now, this part relies on external data or needs adjustment if ticketPackages isn't in scope
                // Let's assume selectedEvents are directly provided with package or handled by caller for now
                // This was: const pkg = ticketPackages.find(p => p.id === newTicketDefinitionId);
                // This was: newSelectedEvents = pkg ? pkg.includes : []; 
                // If selecting a package, its events should ideally come with it or be cleared to be re-derived by UI
                // Forcing selectedEvents from the update if package is set, or empty if clearing to individual
                 newSelectedEvents = ticketUpdate.selectedEvents || []; // Expect selectedEvents to be correct from caller or empty for new package
              } else { // Package is being cleared (ticketDefinitionId is null)
                newSelectedEvents = ticketUpdate.selectedEvents || []; // Use provided individual events or clear
              }
            } else if (ticketUpdate.selectedEvents !== undefined) {
              // Case 2: Only individual events are being updated (package implicitly cleared)
              newTicketDefinitionId = null;
              newSelectedEvents = ticketUpdate.selectedEvents;
            }

            attendeeToUpdate.ticket = {
              ticketDefinitionId: newTicketDefinitionId,
              selectedEvents: newSelectedEvents,
            };
            
            // Remove ticket from updatedData to prevent shallow merge override by the main spread below
            delete updatedData.ticket; 
          }

          // Merge the rest of the updatedData (excluding ticket)
          newAttendees[attendeeIndex] = { ...attendeeToUpdate, ...updatedData };

          return { attendees: newAttendees };
        });
      },

      removeAttendee: (attendeeId) => {
        set(state => {
          console.log(`[Store] Attempting to remove attendeeId: ${attendeeId}`); // Log input ID
          // Also remove any partners related to this attendee
          const attendeeToRemove = state.attendees.find(att => att.attendeeId === attendeeId);
          const relatedPartners = state.attendees.filter(att => att.relatedAttendeeId === attendeeId);
          const idsToRemove = new Set([attendeeId, ...relatedPartners.map(p => p.attendeeId)]);

          const updatedAttendees = state.attendees.filter(att => !idsToRemove.has(att.attendeeId));
          console.log('[Store] Attendees list AFTER filtering:', updatedAttendees); // Log filtered list

          // Also remove associated package data if it exists separately
          const updatedPackages = { ...state.packages };
          idsToRemove.forEach(id => {
            delete updatedPackages[id];
          });

          console.log(`[Store] Removing attendee(s): ${Array.from(idsToRemove).join(', ')}`); // DEBUG

          return {
            attendees: updatedAttendees,
            packages: updatedPackages
          };
        });
      },

      updatePackageSelection: (attendeeId, selection) => {
        set(state => ({
          packages: {
            ...state.packages,
            [attendeeId]: selection,
          },
        }));
      },

      updateBillingDetails: (details) => {
        set({ billingDetails: details });
      },

      setAgreeToTerms: (agreed) => set({ agreeToTerms: agreed }), // Implement action

      // Navigation actions
      setCurrentStep: (step) => set({ currentStep: step }),
      goToNextStep: () => set(state => ({ currentStep: state.currentStep + 1 })),
      goToPrevStep: () => set(state => ({ currentStep: Math.max(1, state.currentStep - 1) })),

      // Confirmation actions
      setConfirmationNumber: (number) => set({ confirmationNumber: number })

    }),
    {
      name: 'lodgetix-registration-storage', 
      partialize: (state) => ({
        draftId: state.draftId,
        registrationType: state.registrationType,
        attendees: state.attendees,
        packages: state.packages,
        billingDetails: state.billingDetails,
        agreeToTerms: state.agreeToTerms, // Persist agreeToTerms
        lastSaved: Date.now(),
      }),
      onRehydrateStorage: () => {
        // We can't reliably use set/get here. Status logic needs to be handled
        // externally after hydration, e.g., in a component effect.
        console.log('Registration store hydration finished.');
      },
       // Optional: Add migration logic if state structure changes later
       // version: 1, 
       // migrate: (persistedState, version) => { ... }
    }
  ) as RegistrationStateCreator
);

// --- Basic Selectors ---
export const selectRegistrationType = (state: RegistrationState) => state.registrationType;
export const selectCurrentStep = (state: RegistrationState) => state.currentStep;
export const selectAttendees = (state: RegistrationState) => state.attendees;
export const selectPackages = (state: RegistrationState) => state.packages;
export const selectBillingDetails = (state: RegistrationState) => state.billingDetails;
export const selectAgreeToTerms = (state: RegistrationState) => state.agreeToTerms;
export const selectDraftId = (state: RegistrationState) => state.draftId;
export const selectLastSaved = (state: RegistrationState) => state.lastSaved;
export const selectConfirmationNumber = (state: RegistrationState) => state.confirmationNumber; 