import { create, StateCreator } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { TicketType } from '../shared/types/register';
import { TicketDefinitionType } from '../shared/types/ticket';
import { UnifiedAttendeeData } from '../shared/types/supabase';

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
  addPrimaryAttendee: () => string; // Returns new attendeeId
  loadDraft: (id: string) => void; // Sets draftId, relies on middleware for loading
  clearRegistration: () => void;
  setRegistrationType: (type: RegistrationType) => void;
  addMasonAttendee: () => string; // Returns new attendeeId
  addGuestAttendee: (guestOfId?: string | null) => string; // Optional Mason ID, returns new attendeeId
  addLadyPartnerAttendee: (masonAttendeeId: string) => string | null; // Mason ID, returns new partner ID or null if mason not found
  addGuestPartnerAttendee: (guestAttendeeId: string) => string | null; // Guest ID, returns new partner ID or null if guest not found
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
const initialRegistrationState: Omit<RegistrationState, 'startNewRegistration' | 'addPrimaryAttendee' | 'loadDraft' | 'clearRegistration' | 'setRegistrationType' | 'addMasonAttendee' | 'addGuestAttendee' | 'addLadyPartnerAttendee' | 'addGuestPartnerAttendee' | 'updateAttendee' | 'removeAttendee' | 'updatePackageSelection' | 'updateBillingDetails' | 'setAgreeToTerms' | '_updateStatus' | 'setCurrentStep' | 'goToNextStep' | 'goToPrevStep' | 'setConfirmationNumber'> = {
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

type ConceptualAttendeeType = UnifiedAttendeeData['attendeeType'] | 'lady_partner' | 'guest_partner';

// --- Helper Function for Default Attendee Data ---
const createDefaultAttendee = (
  attendeeType: UnifiedAttendeeData['attendeeType'],
  options: {
    isPrimary?: boolean;
    partnerOf?: string | null; // Mason/Guest attendeeId for partners
    guestOfId?: string | null; // Mason attendeeId for guests
  } = {}
): UnifiedAttendeeData => {
  const newAttendeeId = uuidv4();
  return {
    attendeeId: newAttendeeId,
    attendeeType: attendeeType,
    isPrimary: options.isPrimary ?? false,
    isPartner: options.partnerOf ? true : false, // Explicitly set isPartner based on partnerOf
    // --- Initialize all fields based on our defaults list ---
    orderId: undefined,
    eventId: undefined, // Assuming this is set later if needed
    title: '',
    firstName: '',
    lastName: '',
    lodgeNameNumber: '',
    primaryEmail: '',
    primaryPhone: '',
    dietaryRequirements: '',
    specialNeeds: '',
    contactPreference: '', // Default empty string
    contactConfirmed: false,
    isCheckedIn: false,
    firstTime: attendeeType === 'Mason' ? false : undefined, // Only relevant for Mason
    rank: attendeeType === 'Mason' ? '' : undefined, // Only relevant for Mason
    postNominals: attendeeType === 'Mason' ? '' : undefined, // Only relevant for Mason
    grandLodgeId: null,
    lodgeId: null,
    tableAssignment: null,
    notes: '',
    paymentStatus: 'pending',
    parentId: undefined, // Consider removing if partner/guestOfId cover all relations
    relationship: '', // Default empty string
    // --- Relationship FKs ---
    partner: null, // Will be set when a partner is added
    partnerOf: options.partnerOf ?? null,
    guestOfId: options.guestOfId ?? null,
    // --- Derived/Backend Fields (Initialize as undefined/null) ---
    grandLodgeName: undefined,
    lodgeName: undefined,
    createdAt: undefined,
    updatedAt: undefined,
  };
};

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
        let newAttendeeId: string | null = null;
        
        set(state => {
          if (state.attendees.length > 0) {
            console.warn("[Store] addPrimaryAttendee called but attendees array is not empty.");
            return state; 
          }
          if (!state.registrationType) {
            console.error("[Store] addPrimaryAttendee called but registrationType is null.");
            return state;
          }

          // For now, assume primary is always mason. Refine if needed.
          const primaryAttendee = createDefaultAttendee('mason', { isPrimary: true });
          // Set primary mason contact preference default
          // Primary mason gets 'Directly' contact preference by default
          primaryAttendee.contactPreference = 'Directly';
          
          newAttendeeId = primaryAttendee.attendeeId;
          console.log(`[Store] Adding primary attendee (Type: mason, ID: ${primaryAttendee.attendeeId})`); // DEBUG
          return { attendees: [primaryAttendee] };
        });
        
        return newAttendeeId || '';
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

      addMasonAttendee: () => {
        const newMason = createDefaultAttendee('Mason');
        set(state => ({ attendees: [...state.attendees, newMason] }));
        console.log(`[Store] Added Mason Attendee (ID: ${newMason.attendeeId}, Type: ${newMason.attendeeType})`);
        return newMason.attendeeId;
      },

      addGuestAttendee: (guestOfId = null) => {
        const newGuest = createDefaultAttendee('Guest', { guestOfId });
        // Initial state is empty string which will show as "Please Select"
        set(state => ({ attendees: [...state.attendees, newGuest] }));
        console.log(`[Store] Added Guest Attendee (ID: ${newGuest.attendeeId}, GuestOf: ${guestOfId || 'None'}, ContactPref: ${newGuest.contactPreference})`);
        return newGuest.attendeeId;
      },

      addLadyPartnerAttendee: (masonAttendeeId) => {
        const state = get();
        const masonIndex = state.attendees.findIndex(att => att.attendeeId === masonAttendeeId && att.attendeeType.toLowerCase() === 'mason');

        if (masonIndex === -1) {
          console.error(`[Store] addLadyPartnerAttendee: Mason with ID ${masonAttendeeId} not found.`);
          return null;
        }
        if (state.attendees[masonIndex].partner) {
          console.warn(`[Store] addLadyPartnerAttendee: Mason with ID ${masonAttendeeId} already has a partner.`);
          // Optionally remove old partner first, or just return null/existing partner ID
          return state.attendees[masonIndex].partner; // Return existing partner ID
        }

        const newPartner = createDefaultAttendee('LadyPartner', { partnerOf: masonAttendeeId });
        // Initial state is empty string which will show as "Please Select"
        
        const updatedAttendees = [...state.attendees];
        // Update the Mason's partner field
        updatedAttendees[masonIndex] = {
          ...updatedAttendees[masonIndex],
          partner: newPartner.attendeeId,
        };
        // Add the new partner
        updatedAttendees.push(newPartner);

        set({ attendees: updatedAttendees });
        console.log(`[Store] Added Lady Partner (ID: ${newPartner.attendeeId}) for Mason (ID: ${masonAttendeeId})`);
        return newPartner.attendeeId;
      },
      
      addGuestPartnerAttendee: (guestAttendeeId) => {
         const state = get();
        const guestIndex = state.attendees.findIndex(att => att.attendeeId === guestAttendeeId && att.attendeeType.toLowerCase() === 'guest');

        if (guestIndex === -1) {
          console.error(`[Store] addGuestPartnerAttendee: Guest with ID ${guestAttendeeId} not found.`);
          return null;
        }
         if (state.attendees[guestIndex].partner) {
          console.warn(`[Store] addGuestPartnerAttendee: Guest with ID ${guestAttendeeId} already has a partner.`);
          return state.attendees[guestIndex].partner; // Return existing partner ID
        }

        const newPartner = createDefaultAttendee('GuestPartner', { partnerOf: guestAttendeeId });
        // Initial state is empty string which will show as "Please Select"
        
        const updatedAttendees = [...state.attendees];
        // Update the Guest's partner field
        updatedAttendees[guestIndex] = {
          ...updatedAttendees[guestIndex],
          partner: newPartner.attendeeId,
        };
        // Add the new partner
        updatedAttendees.push(newPartner);

        set({ attendees: updatedAttendees });
        console.log(`[Store] Added Guest Partner (ID: ${newPartner.attendeeId}) for Guest (ID: ${guestAttendeeId})`);
        return newPartner.attendeeId;
      },

      updateAttendee: (attendeeId, updatedData) => {
        set(state => ({
          attendees: state.attendees.map(att => 
            att.attendeeId === attendeeId ? { ...att, ...updatedData, updatedAt: new Date().toISOString() } : att // Add updatedAt timestamp
          )
        }));
        // Debounce/Throttle logic will be handled in the UI component calling this
        // console.log(`[Store] Updated attendee ${attendeeId}`, updatedData); // DEBUG: Can be noisy
      },

      removeAttendee: (attendeeIdToRemove) => {
        set(state => {
          const attendeeToRemove = state.attendees.find(att => att.attendeeId === attendeeIdToRemove);
          if (!attendeeToRemove) return state; // Not found

          let partnerIdToRemove: string | null = null;
          let masonIdToUpdate: string | null = null;
          let guestIdToUpdate: string | null = null;
          let idsToKeep = [...state.attendees.map(a => a.attendeeId)];
          let updatedAttendees = [...state.attendees]; // Create a mutable copy

          // --- Determine linked IDs and necessary updates ---
          if (attendeeToRemove.attendeeType.toLowerCase() === 'mason' && attendeeToRemove.partner) {
            partnerIdToRemove = attendeeToRemove.partner;
          } else if (attendeeToRemove.attendeeType.toLowerCase() === 'guest' && attendeeToRemove.partner) {
            partnerIdToRemove = attendeeToRemove.partner;
          } else if (attendeeToRemove.attendeeType.toLowerCase() === 'ladypartner' && attendeeToRemove.partnerOf) {
            masonIdToUpdate = attendeeToRemove.partnerOf;
          } else if (attendeeToRemove.attendeeType.toLowerCase() === 'guestpartner' && attendeeToRemove.partnerOf) {
            guestIdToUpdate = attendeeToRemove.partnerOf;
          }

          // Filter out the primary attendee being removed
          idsToKeep = idsToKeep.filter(id => id !== attendeeIdToRemove);
          console.log(`[Store] Removing attendee ${attendeeIdToRemove} (${attendeeToRemove.attendeeType})`);

          // Filter out the linked partner if necessary
          if (partnerIdToRemove) {
            idsToKeep = idsToKeep.filter(id => id !== partnerIdToRemove);
            console.log(`[Store] Also removing linked partner ${partnerIdToRemove}`);
          }

          // Filter the attendees list
          updatedAttendees = updatedAttendees.filter(att => idsToKeep.includes(att.attendeeId));

          // Update the partner FK on the remaining Mason/Guest if a partner was removed
          if (masonIdToUpdate) {
            const masonIndex = updatedAttendees.findIndex(att => att.attendeeId === masonIdToUpdate);
            if (masonIndex !== -1) {
              updatedAttendees[masonIndex] = { ...updatedAttendees[masonIndex], partner: null };
              console.log(`[Store] Cleared partner link on Mason ${masonIdToUpdate}`);
            }
          }
          if (guestIdToUpdate) {
            const guestIndex = updatedAttendees.findIndex(att => att.attendeeId === guestIdToUpdate);
            if (guestIndex !== -1) {
              updatedAttendees[guestIndex] = { ...updatedAttendees[guestIndex], partner: null };
               console.log(`[Store] Cleared partner link on Guest ${guestIdToUpdate}`);
            }
          }
          
          // Update guestOfId for remaining Guests if their Mason host was removed
          if (attendeeToRemove.attendeeType.toLowerCase() === 'mason') {
              updatedAttendees = updatedAttendees.map(att => {
                  if (att.attendeeType.toLowerCase() === 'guest' && att.guestOfId === attendeeIdToRemove) {
                      console.log(`[Store] Clearing guestOfId link for Guest ${att.attendeeId}`);
                      return { ...att, guestOfId: null };
                  }
                  return att;
              });
          }

          return { attendees: updatedAttendees };
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