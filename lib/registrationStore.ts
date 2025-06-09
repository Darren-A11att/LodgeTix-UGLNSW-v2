import { create, StateCreator } from 'zustand';
import { persist } from 'zustand/middleware';
import { v7 as uuidv7 } from 'uuid';
import { TicketType } from '../shared/types/register';
import { TicketDefinitionType } from '../shared/types/ticket';
import { RegistrationType, UnifiedAttendeeData } from './registration-types';
import { generateUUID } from './uuid-slug-utils';

// Re-export UnifiedAttendeeData for backward compatibility
export type { UnifiedAttendeeData };

// Lodge ticket order interface
export interface LodgeTicketOrder {
  tableCount: number;
  totalTickets: number;
  galaDinnerTickets: number; // Deprecated - kept for backward compatibility
  ceremonyTickets: number; // Deprecated - kept for backward compatibility
  eventId: string;
  galaDinnerEventId: string; // Deprecated - kept for backward compatibility
  ceremonyEventId: string; // Deprecated - kept for backward compatibility
  // New flexible structure for dynamic ticket types
  includedTickets?: Array<{
    ticketId: string;
    ticketName: string;
    quantity: number;
    eventId: string;
  }>;
}

// --- Placeholder Types (Defined locally) ---
// Using RegistrationType from './registration-types'

// Enhanced ticket selection structure per the PRD requirements
export interface TicketSelectionItem {
  ticketId: string;
  quantity: number;
}

export interface PackageSelection {
  packageId: string;
  quantity: number;
  tickets: TicketSelectionItem[];
}

export interface AttendeeTicketSelections {
  packages: PackageSelection[];
  individualTickets: TicketSelectionItem[];
}

// Legacy interface for backward compatibility - will be phased out
export interface PackageSelectionType {
  ticketDefinitionId: string | null;
  selectedEvents: string[]; // Array of event IDs
}

// Placeholder type for billing details
// TODO: Define the actual structure needed
// Booking Contact type (maps to customers table)
export interface BillingDetailsType {
  title?: string;
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
  businessName?: string;
  businessNumber?: string;
}

// Alias for clarity - will transition to BookingContactType
export type BookingContactType = BillingDetailsType;

// Lodge-specific interfaces (from lodge registration store)
export interface LodgeCustomer {
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  addressLine1: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
}

export interface LodgeDetails {
  grand_lodge_id: string;
  lodge_id: string;
  lodgeName: string;
}

export interface LodgeTableOrder {
  tableCount: number;
  totalPrice: number;
}

// --- State Interface ---
export interface RegistrationState {
  draftId: string | null;
  functionId: string | null; // Function ID for the registration
  functionSlug: string | null; // Function slug for navigation
  selectedEvents: string[]; // Selected event IDs within the function
  registrationType: RegistrationType | null;
  delegationType: 'lodge' | 'grandLodge' | 'masonicOrder' | null; // Type of delegation when registrationType is 'delegation'
  attendees: UnifiedAttendeeData[];
  // Enhanced ticket selections per attendee
  ticketSelections: Record<string, AttendeeTicketSelections>; // attendeeId -> ticket selections
  // Legacy packages for backward compatibility
  packages: Record<string, PackageSelectionType>;
  billingDetails: BillingDetailsType | null;
  agreeToTerms: boolean; // Add agreeToTerms
  status: 'idle' | 'loading' | 'draft' | 'error' | 'saving' | 'completed'; // Added idle/saving/completed
  lastSaved: number | null;
  error: string | null;
  availableTickets: (TicketType | TicketDefinitionType)[]; // Add availableTickets
  currentStep: number; // Add currentStep for navigation
  confirmationNumber: string | null; // Add confirmationNumber for completion
  draftRecoveryHandled: boolean; // Flag to track if draft recovery has been handled in current session
  anonymousSessionEstablished: boolean; // Track if Turnstile verification and anonymous session is complete
  lodgeTicketOrder: LodgeTicketOrder | null; // Lodge bulk ticket order details
  
  // Lodge-specific state
  lodgeCustomer: LodgeCustomer;
  lodgeDetails: LodgeDetails;
  lodgeTableOrder: LodgeTableOrder;

  // --- Actions ---
  startNewRegistration: (type: RegistrationType) => string; // Returns new draftId
  addPrimaryAttendee: () => string; // Returns new attendeeId
  loadDraft: (id: string) => void; // Sets draftId, relies on middleware for loading
  clearRegistration: () => void;
  clearAllAttendees: () => void; // Clear all attendees but keep other state
  setRegistrationType: (type: RegistrationType) => void;
  addAttendee: (type: UnifiedAttendeeData['attendeeType']) => string; // Generic add attendee function
  addMasonAttendee: () => string; // Returns new attendeeId
  addGuestAttendee: (guestOfId?: string | null) => string; // Optional Mason ID, returns new attendeeId
  addPartnerAttendee: (attendeeId: string) => string | null; // Parent attendee ID, returns new partner ID or null if attendee not found
  updateAttendee: (attendeeId: string, updatedData: Partial<UnifiedAttendeeData>) => void;
  removeAttendee: (attendeeId: string) => void;
  // Enhanced ticket selection actions
  updateTicketSelections: (attendeeId: string, selections: AttendeeTicketSelections) => void;
  addPackageSelection: (attendeeId: string, packageSelection: PackageSelection) => void;
  removePackageSelection: (attendeeId: string, packageId: string) => void;
  addIndividualTicket: (attendeeId: string, ticket: TicketSelectionItem) => void;
  removeIndividualTicket: (attendeeId: string, ticketId: string) => void;
  clearAttendeeTicketSelections: (attendeeId: string) => void;
  // Legacy action for backward compatibility
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
  // Function methods
  setFunctionId: (id: string) => void; // Set the functionId for the current registration
  setFunctionSlug: (slug: string) => void; // Set the function slug
  setSelectedEvents: (eventIds: string[]) => void; // Set selected events within the function
  
  // Draft recovery methods
  setDraftRecoveryHandled: (handled: boolean) => void; // Set if draft recovery has been handled
  
  // Anonymous session methods
  setAnonymousSessionEstablished: (established: boolean) => void; // Set if anonymous session is established
  
  // Lodge ticket order methods
  setLodgeTicketOrder: (order: LodgeTicketOrder | null) => void; // Set lodge bulk ticket order
  
  // Delegation type methods
  setDelegationType: (type: 'lodge' | 'grandLodge' | 'masonicOrder' | null) => void; // Set delegation sub-type
  
  // Lodge-specific methods
  updateLodgeCustomer: (customer: Partial<LodgeCustomer>) => void;
  updateLodgeDetails: (details: Partial<LodgeDetails>) => void;
  updateLodgeTableOrder: (order: Partial<LodgeTableOrder>) => void;
  isLodgeFormValid: () => boolean;
  getLodgeValidationErrors: () => string[];
}

// --- Initial State ---
const initialRegistrationState: Omit<RegistrationState, 'startNewRegistration' | 'addPrimaryAttendee' | 'loadDraft' | 'clearRegistration' | 'clearAllAttendees' | 'setRegistrationType' | 'addAttendee' | 'addMasonAttendee' | 'addGuestAttendee' | 'addPartnerAttendee' | 'updateAttendee' | 'removeAttendee' | 'updateTicketSelections' | 'addPackageSelection' | 'removePackageSelection' | 'addIndividualTicket' | 'removeIndividualTicket' | 'clearAttendeeTicketSelections' | 'updatePackageSelection' | 'updateBillingDetails' | 'setAgreeToTerms' | '_updateStatus' | 'setCurrentStep' | 'goToNextStep' | 'goToPrevStep' | 'setConfirmationNumber' | 'setFunctionId' | 'setFunctionSlug' | 'setSelectedEvents' | 'setDraftRecoveryHandled' | 'setAnonymousSessionEstablished' | 'setLodgeTicketOrder' | 'setDelegationType' | 'updateLodgeCustomer' | 'updateLodgeDetails' | 'updateLodgeTableOrder' | 'isLodgeFormValid' | 'getLodgeValidationErrors'> = {
    draftId: null,
    functionId: null, // Initialize functionId as null
    functionSlug: null, // Initialize functionSlug as null
    selectedEvents: [], // Initialize selectedEvents as empty array
    registrationType: null,
    delegationType: null,
    attendees: [],
    ticketSelections: {}, // Initialize enhanced ticket selections
    packages: {}, // Legacy packages for backward compatibility
    billingDetails: null,
    agreeToTerms: false, // Init agreeToTerms
    status: 'idle',
    lastSaved: null,
    error: null,
    availableTickets: [], // Initialize availableTickets
    currentStep: 1, // Start at step 1
    confirmationNumber: null, // No confirmation until complete
    draftRecoveryHandled: false, // Initialize draft recovery flag
    anonymousSessionEstablished: false, // Initialize anonymous session flag
    lodgeTicketOrder: null, // Initialize lodge ticket order
    
    // Lodge-specific initial state
    lodgeCustomer: {
      firstName: '',
      lastName: '',
      email: '',
      mobile: '',
      addressLine1: '',
      city: '',
      state: '',
      postcode: '',
      country: 'Australia',
    },
    lodgeDetails: {
      grand_lodge_id: '',
      lodge_id: '',
      lodgeName: '',
    },
    lodgeTableOrder: {
      tableCount: 1,
      totalPrice: 0,
    },
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
  // Use UUID v7 for time-ordered UUIDs - important for database efficiency and consistency
  const newAttendeeId = generateUUID();
  return {
    attendeeId: newAttendeeId,
    attendeeType: attendeeType,
    isPrimary: options.isPrimary ?? false,
    isPartner: options.partnerOf ?? null, // Set to FK of related attendee or null
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
    firstTime: attendeeType === 'mason' ? false : undefined, // Only relevant for Mason
    rank: attendeeType === 'mason' ? '' : undefined, // Only relevant for Mason
    postNominals: attendeeType === 'mason' ? '' : undefined, // Only relevant for Mason
    grand_lodge_id: attendeeType === 'mason' ? null : undefined,
    lodge_id: attendeeType === 'mason' ? null : undefined,
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

// Development-only: Preserve state through hot reloads
const preserveStateInDevelopment = (storeName: string) => {
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    // Store reference to prevent loss during hot reload
    const globalKey = `__${storeName}_dev_backup__`;
    
    // Save state before potential hot reload
    const saveState = () => {
      try {
        const currentState = localStorage.getItem('lodgetix-registration-storage');
        if (currentState) {
          (window as any)[globalKey] = currentState;
          console.log('🔄 Dev: Backed up registration state for hot reload recovery');
        }
      } catch (error) {
        console.warn('Failed to backup state for hot reload:', error);
      }
    };
    
    // Restore state after hot reload if localStorage is empty but backup exists
    const restoreState = () => {
      try {
        const currentState = localStorage.getItem('lodgetix-registration-storage');
        const backupState = (window as any)[globalKey];
        
        if (!currentState && backupState) {
          localStorage.setItem('lodgetix-registration-storage', backupState);
          console.log('🔄 Dev: Restored registration state after hot reload');
          return true;
        }
      } catch (error) {
        console.warn('Failed to restore state after hot reload:', error);
      }
      return false;
    };
    
    // Save state only on beforeunload to prevent excessive logging
    window.addEventListener('beforeunload', saveState);
    
    // Also save state periodically but less frequently and with a flag to prevent multiple intervals
    const intervalKey = `__${storeName}_interval__`;
    if (!(window as any)[intervalKey]) {
      (window as any)[intervalKey] = setInterval(() => {
        try {
          const currentState = localStorage.getItem('lodgetix-registration-storage');
          if (currentState) {
            (window as any)[globalKey] = currentState;
            // Remove console log to prevent spam
          }
        } catch (error) {
          // Silently fail
        }
      }, 30000); // Every 30 seconds instead of 2 seconds
    }
    
    // Try to restore immediately
    const restored = restoreState();
    
    return () => {
      const interval = (window as any)[intervalKey];
      if (interval) {
        clearInterval(interval);
        delete (window as any)[intervalKey];
      }
      window.removeEventListener('beforeunload', saveState);
    };
  }
};

// --- Store Implementation ---
export const useRegistrationStore = create<RegistrationState>(
  persist(
    (set, get) => ({
      ...initialRegistrationState,

      _updateStatus: (status, error = null) => set({ status, error }),

      startNewRegistration: (type) => {
        // Using a full, proper UUID v7 for the draft ID
        // UUID v7 is already time-ordered, so we don't need to add timestamps
        const newDraftId = generateUUID();
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
          // IMPORTANT: No default contact preference
          // User must explicitly select this
          primaryAttendee.contactPreference = '';
          
          newAttendeeId = primaryAttendee.attendeeId;
          console.log(`[Store] Adding primary attendee (Type: mason, ID: ${primaryAttendee.attendeeId}, ContactPref: ${primaryAttendee.contactPreference})`); // DEBUG
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
        // Preserve anonymous session when clearing registration
        const currentAnonymousSession = get().anonymousSessionEstablished;
        set({ 
          ...initialRegistrationState,
          anonymousSessionEstablished: currentAnonymousSession, // Preserve session state
          delegationType: null, // Explicitly clear delegation type
          functionId: null,
          functionSlug: null,
          selectedEvents: []
        }); // Reset to initial state but keep session
        console.log('Registration state cleared.');
      },

      clearAllAttendees: () => {
        set(state => ({
          attendees: [],
          packages: {},
        }));
        console.log('[Store] Cleared all attendees and their package selections.');
      },

      setRegistrationType: (type) => {
        set({ registrationType: type });
      },

      // Generic attendee addition function
      addAttendee: (type) => {
        const normalizedType = type.toLowerCase();
        const newAttendee = createDefaultAttendee(normalizedType as UnifiedAttendeeData['attendeeType']);
        
        // No default contact preference - user must select
        // Ensure it's an empty string
        newAttendee.contactPreference = '';
        
        set(state => ({ attendees: [...state.attendees, newAttendee] }));
        console.log(`[Store] Added Generic Attendee (ID: ${newAttendee.attendeeId}, Type: ${newAttendee.attendeeType}, ContactPref: '${newAttendee.contactPreference}')`);
        return newAttendee.attendeeId;
      },

      addMasonAttendee: () => {
        const newMason = createDefaultAttendee('mason');
        set(state => ({ attendees: [...state.attendees, newMason] }));
        console.log(`[Store] Added Mason Attendee (ID: ${newMason.attendeeId}, Type: ${newMason.attendeeType})`);
        return newMason.attendeeId;
      },

      addGuestAttendee: (guestOfId = null) => {
        const newGuest = createDefaultAttendee('guest', { guestOfId });
        // Initial state is empty string which will show as "Please Select"
        set(state => ({ attendees: [...state.attendees, newGuest] }));
        console.log(`[Store] Added Guest Attendee (ID: ${newGuest.attendeeId}, GuestOf: ${guestOfId || 'None'}, ContactPref: ${newGuest.contactPreference})`);
        return newGuest.attendeeId;
      },

      addPartnerAttendee: (attendeeId) => {
        const state = get();
        const attendeeIndex = state.attendees.findIndex(att => att.attendeeId === attendeeId);

        if (attendeeIndex === -1) {
          console.error(`[Store] addPartnerAttendee: Attendee with ID ${attendeeId} not found.`);
          return null;
        }
        if (state.attendees[attendeeIndex].partner) {
          console.warn(`[Store] addPartnerAttendee: Attendee with ID ${attendeeId} already has a partner.`);
          return state.attendees[attendeeIndex].partner; // Return existing partner ID
        }

        // Create a Guest with isPartner set to the parent attendee's ID
        const newPartner = createDefaultAttendee('guest', { partnerOf: attendeeId });
        newPartner.isPartner = attendeeId; // Set the FK
        
        // No default values - let user fill them in
        
        const updatedAttendees = [...state.attendees];
        // Update the parent attendee's partner field
        updatedAttendees[attendeeIndex] = {
          ...updatedAttendees[attendeeIndex],
          partner: newPartner.attendeeId,
        };
        // Add the new partner
        updatedAttendees.push(newPartner);

        set({ attendees: updatedAttendees });
        console.log(`[Store] Added Partner (ID: ${newPartner.attendeeId}) for Attendee (ID: ${attendeeId})`);
        return newPartner.attendeeId;
      },

      updateAttendee: (attendeeId, updatedData) => {
        // Log grand_lodge_id updates specifically
        if ('grand_lodge_id' in updatedData) {
          console.log(`[Store] Updating attendee ${attendeeId} grand_lodge_id to:`, updatedData.grand_lodge_id);
        }
        
        set(state => ({
          attendees: state.attendees.map(att => 
            att.attendeeId === attendeeId ? { ...att, ...updatedData, updatedAt: new Date().toISOString() } : att // Add updatedAt timestamp
          )
        }));
        
        // Log the result if it was a grand_lodge_id update
        if ('grand_lodge_id' in updatedData) {
          const updatedAttendee = get().attendees.find(a => a.attendeeId === attendeeId);
          console.log(`[Store] After update, attendee ${attendeeId} grand_lodge_id is:`, updatedAttendee?.grand_lodge_id);
        }
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
          const isGuest = attendeeToRemove.attendeeType.toLowerCase() === 'guest';
          const isMason = attendeeToRemove.attendeeType.toLowerCase() === 'mason';
          
          // Check if it's a partner being removed
          if (isGuest && attendeeToRemove.isPartner) {
            // This is a partner (of either Mason or Guest)
            const relatedAttendeeId = attendeeToRemove.isPartner;
            const relatedAttendee = state.attendees.find(att => att.attendeeId === relatedAttendeeId);
            
            if (relatedAttendee) {
              if (relatedAttendee.attendeeType.toLowerCase() === 'mason') {
                masonIdToUpdate = relatedAttendeeId;
              } else if (relatedAttendee.attendeeType.toLowerCase() === 'guest') {
                guestIdToUpdate = relatedAttendeeId;
              }
            }
          } 
          // Check if it's a Mason/Guest with a partner
          else if ((isMason || isGuest) && attendeeToRemove.partner) {
            partnerIdToRemove = attendeeToRemove.partner;
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

      // Enhanced ticket selection actions
      updateTicketSelections: (attendeeId, selections) => {
        set(state => ({
          ticketSelections: {
            ...state.ticketSelections,
            [attendeeId]: selections,
          },
        }));
        console.log(`[Store] Updated ticket selections for attendee ${attendeeId}:`, selections);
      },

      addPackageSelection: (attendeeId, packageSelection) => {
        set(state => {
          const currentSelections = state.ticketSelections[attendeeId] || { packages: [], individualTickets: [] };
          const existingPackageIndex = currentSelections.packages.findIndex(p => p.packageId === packageSelection.packageId);
          
          let updatedPackages;
          if (existingPackageIndex >= 0) {
            // Update existing package
            updatedPackages = [...currentSelections.packages];
            updatedPackages[existingPackageIndex] = packageSelection;
          } else {
            // Add new package
            updatedPackages = [...currentSelections.packages, packageSelection];
          }
          
          return {
            ticketSelections: {
              ...state.ticketSelections,
              [attendeeId]: {
                ...currentSelections,
                packages: updatedPackages,
              },
            },
          };
        });
        console.log(`[Store] Added/updated package selection for attendee ${attendeeId}:`, packageSelection);
      },

      removePackageSelection: (attendeeId, packageId) => {
        set(state => {
          const currentSelections = state.ticketSelections[attendeeId];
          if (!currentSelections) return state;
          
          return {
            ticketSelections: {
              ...state.ticketSelections,
              [attendeeId]: {
                ...currentSelections,
                packages: currentSelections.packages.filter(p => p.packageId !== packageId),
              },
            },
          };
        });
        console.log(`[Store] Removed package selection ${packageId} for attendee ${attendeeId}`);
      },

      addIndividualTicket: (attendeeId, ticket) => {
        set(state => {
          const currentSelections = state.ticketSelections[attendeeId] || { packages: [], individualTickets: [] };
          const existingTicketIndex = currentSelections.individualTickets.findIndex(t => t.ticketId === ticket.ticketId);
          
          let updatedTickets;
          if (existingTicketIndex >= 0) {
            // Update existing ticket quantity
            updatedTickets = [...currentSelections.individualTickets];
            updatedTickets[existingTicketIndex] = ticket;
          } else {
            // Add new ticket
            updatedTickets = [...currentSelections.individualTickets, ticket];
          }
          
          return {
            ticketSelections: {
              ...state.ticketSelections,
              [attendeeId]: {
                ...currentSelections,
                individualTickets: updatedTickets,
              },
            },
          };
        });
        console.log(`[Store] Added/updated individual ticket for attendee ${attendeeId}:`, ticket);
      },

      removeIndividualTicket: (attendeeId, ticketId) => {
        set(state => {
          const currentSelections = state.ticketSelections[attendeeId];
          if (!currentSelections) return state;
          
          return {
            ticketSelections: {
              ...state.ticketSelections,
              [attendeeId]: {
                ...currentSelections,
                individualTickets: currentSelections.individualTickets.filter(t => t.ticketId !== ticketId),
              },
            },
          };
        });
        console.log(`[Store] Removed individual ticket ${ticketId} for attendee ${attendeeId}`);
      },

      clearAttendeeTicketSelections: (attendeeId) => {
        set(state => ({
          ticketSelections: {
            ...state.ticketSelections,
            [attendeeId]: { packages: [], individualTickets: [] },
          },
        }));
        console.log(`[Store] Cleared all ticket selections for attendee ${attendeeId}`);
      },

      // Legacy action for backward compatibility
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
      setConfirmationNumber: (number) => set({ 
        confirmationNumber: number,
        status: 'completed' // Mark as completed when confirmation number is set
      }),
      
      // Function actions
      setFunctionId: (id) => set({ functionId: id }),
      setFunctionSlug: (slug) => set({ functionSlug: slug }),
      setSelectedEvents: (eventIds) => set({ selectedEvents: eventIds }),
      
      // Draft recovery actions
      setDraftRecoveryHandled: (handled) => set({ draftRecoveryHandled: handled }),
      
      // Anonymous session actions
      setAnonymousSessionEstablished: (established) => set({ anonymousSessionEstablished: established }),
      
      // Lodge ticket order actions
      setLodgeTicketOrder: (order) => set({ lodgeTicketOrder: order }),
      
      // Delegation type actions
      setDelegationType: (type) => set({ delegationType: type }),
      
      // Lodge-specific actions
      updateLodgeCustomer: (customer) => set(state => ({
        lodgeCustomer: { ...state.lodgeCustomer, ...customer }
      })),
      
      updateLodgeDetails: (details) => set(state => ({
        lodgeDetails: { ...state.lodgeDetails, ...details }
      })),
      
      updateLodgeTableOrder: (order) => set(state => ({
        lodgeTableOrder: { ...state.lodgeTableOrder, ...order }
      })),
      
      isLodgeFormValid: () => {
        const state = get();
        const { lodgeCustomer, lodgeDetails } = state;
        
        // Check required fields
        return !!(
          lodgeCustomer.firstName &&
          lodgeCustomer.lastName &&
          lodgeCustomer.email &&
          lodgeCustomer.mobile &&
          lodgeDetails.grand_lodge_id &&
          lodgeDetails.lodge_id
        );
      },
      
      getLodgeValidationErrors: () => {
        const state = get();
        const { lodgeCustomer, lodgeDetails } = state;
        const errors: string[] = [];
        
        if (!lodgeCustomer.firstName) errors.push('First name is required');
        if (!lodgeCustomer.lastName) errors.push('Last name is required');
        if (!lodgeCustomer.email) errors.push('Email is required');
        if (!lodgeCustomer.mobile) errors.push('Mobile number is required');
        if (!lodgeDetails.grand_lodge_id) errors.push('Grand Lodge selection is required');
        if (!lodgeDetails.lodge_id) errors.push('Lodge selection is required');
        
        return errors;
      }

    }),
    {
      name: 'lodgetix-registration-storage', 
      partialize: (state) => ({
        draftId: state.draftId,
        functionId: state.functionId, // Persist function ID
        functionSlug: state.functionSlug, // Persist function slug
        selectedEvents: state.selectedEvents, // Persist selected events
        registrationType: state.registrationType,
        delegationType: state.delegationType, // Persist delegation type
        attendees: state.attendees,
        ticketSelections: state.ticketSelections, // Persist enhanced ticket selections
        packages: state.packages, // Keep legacy packages for backward compatibility
        billingDetails: state.billingDetails,
        // Don't persist agreeToTerms - it should always default to false
        status: state.status, // Persist status to track completed registrations
        confirmationNumber: state.confirmationNumber, // Persist confirmation number
        // Don't persist draftRecoveryHandled - it should reset on each session
        anonymousSessionEstablished: state.anonymousSessionEstablished, // Persist anonymous session state
        lodgeTicketOrder: state.lodgeTicketOrder, // Persist lodge ticket order
        // Lodge-specific persistence
        lodgeCustomer: state.lodgeCustomer,
        lodgeDetails: state.lodgeDetails,
        lodgeTableOrder: state.lodgeTableOrder,
        lastSaved: Date.now(),
      }),
      onRehydrateStorage: () => {
        return (state, error) => {
          if (error) {
            console.error('Registration store hydration failed:', error);
            console.error('This may cause loss of draft registration data');
          } else {
            console.log('Registration store hydration finished successfully.');
            if (state) {
              console.log('Hydrated state contains:', {
                draftId: state.draftId,
                registrationType: state.registrationType,
                attendeesCount: state.attendees?.length || 0,
                currentStep: state.currentStep,
                hasData: !!(state.draftId || state.registrationType || (state.attendees && state.attendees.length > 0))
              });
            } else {
              console.log('No previous registration data found in storage');
            }
          }
        };
      },
       // Optional: Add migration logic if state structure changes later
       // version: 1, 
       // migrate: (persistedState, version) => { ... }
    }
  ) as RegistrationStateCreator
);

// Initialize development state preservation
if (typeof window !== 'undefined') {
  preserveStateInDevelopment('lodgetix-registration');
}

// --- Basic Selectors ---
export const selectRegistrationType = (state: RegistrationState) => state.registrationType;
export const selectDelegationType = (state: RegistrationState) => state.delegationType;
export const selectCurrentStep = (state: RegistrationState) => state.currentStep;
export const selectAttendees = (state: RegistrationState) => state.attendees;
export const selectTicketSelections = (state: RegistrationState) => state.ticketSelections;
export const selectPackages = (state: RegistrationState) => state.packages; // Legacy selector
export const selectBillingDetails = (state: RegistrationState) => state.billingDetails;
export const selectAgreeToTerms = (state: RegistrationState) => state.agreeToTerms;
export const selectDraftId = (state: RegistrationState) => state.draftId;
export const selectLastSaved = (state: RegistrationState) => state.lastSaved;
export const selectConfirmationNumber = (state: RegistrationState) => state.confirmationNumber;
export const selectFunctionId = (state: RegistrationState) => state.functionId;
export const selectFunctionSlug = (state: RegistrationState) => state.functionSlug;
export const selectSelectedEvents = (state: RegistrationState) => state.selectedEvents;
export const selectDraftRecoveryHandled = (state: RegistrationState) => state.draftRecoveryHandled;
export const selectAnonymousSessionEstablished = (state: RegistrationState) => state.anonymousSessionEstablished;

// --- Enhanced Ticket Selection Selectors ---
export const selectAttendeeTicketSelections = (attendeeId: string) => (state: RegistrationState) => 
  state.ticketSelections[attendeeId] || { packages: [], individualTickets: [] };

export const selectAttendeeHasTicketSelections = (attendeeId: string) => (state: RegistrationState) => {
  const selections = state.ticketSelections[attendeeId];
  return selections && (selections.packages.length > 0 || selections.individualTickets.length > 0);
};

export const selectAllAttendeeTicketSelections = (state: RegistrationState) => {
  const allSelections: Record<string, AttendeeTicketSelections> = {};
  state.attendees.forEach(attendee => {
    allSelections[attendee.attendeeId] = state.ticketSelections[attendee.attendeeId] || 
      { packages: [], individualTickets: [] };
  });
  return allSelections;
}; 