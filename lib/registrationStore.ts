import { create, StateCreator } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { v7 as uuidv7 } from 'uuid';
import { createUserEncryptedStorage } from '@/lib/utils/user-encrypted-storage';
import { TicketType } from '../shared/types/register';
import { TicketDefinitionType } from '../shared/types/ticket';
import { RegistrationType, UnifiedAttendeeData } from './registration-types';
import { generateUUID } from './uuid-slug-utils';
import type { 
  FunctionMetadata,
  TicketMetadata,
  PackageMetadata,
  AttendeeSelectionSummary,
  OrderSummary,
  RegistrationTableData,
  LodgeBulkSelection,
  EnhancedTicketSelection,
  EnhancedPackageSelection
} from './registration-metadata-types';
import { determineAvailabilityStatus } from './registration-metadata-types';
import type { FunctionTicketDefinition, FunctionPackage } from './services/function-tickets-service';

// Preloaded tickets data interface
export interface PreloadedTicketsData {
  tickets: FunctionTicketDefinition[];
  packages: FunctionPackage[];
  functionId: string;
  registrationType: RegistrationType;
  timestamp: number; // When the data was preloaded
  isValid: boolean; // Whether the data is still valid/fresh
}

// Re-export UnifiedAttendeeData for backward compatibility
export type { UnifiedAttendeeData };

// Consolidated lodge order interface
export interface LodgeOrder {
  // Core order data
  packageId: string;
  catalogObjectId?: string;
  packageQuantity: number;  // Number of packages selected by user
  itemQuantity: number;     // Number of items per package
  packagePrice: number;     // Price per package in dollars
  packageName?: string;
  
  // Calculated values
  totalAttendees: number;   // packageQuantity × itemQuantity
  subtotal: number;         // packageQuantity × packagePrice
  
  // Optional metadata
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

// Legacy interface for backward compatibility - REMOVED
// PackageSelectionType has been eliminated in favor of enhanced metadata structures

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

// Deprecated - kept for migration
export interface LodgeTableOrder {
  tableCount: number;
  totalPrice: number;
}

// --- State Interface ---
export interface RegistrationState {
  draftId: string | null;
  registrationId: string | null; // The actual registration ID from the database
  functionId: string | null; // Function ID for the registration
  functionSlug: string | null; // Function slug for navigation
  selectedEvents: string[]; // Selected event IDs within the function
  registrationType: RegistrationType | null;
  delegationType: 'lodge' | 'grandLodge' | 'masonicOrder' | null; // Type of delegation when registrationType is 'delegation'
  attendees: UnifiedAttendeeData[];
  
  // NEW: Comprehensive metadata storage
  functionMetadata: FunctionMetadata | null;
  ticketMetadata: Record<string, TicketMetadata>; // ticketId -> metadata
  packageMetadata: Record<string, PackageMetadata>; // packageId -> metadata
  attendeeSelections: Record<string, AttendeeSelectionSummary>; // attendeeId -> summary
  orderSummary: OrderSummary | null;
  
  // NEW: Registration table mapping
  registrationTableData: RegistrationTableData;
  
  // NEW: Lodge bulk selection (no attendees yet)
  lodgeBulkSelection: LodgeBulkSelection | null;
  
  // Enhanced ticket selections - primary structure
  ticketSelections: Record<string, AttendeeTicketSelections>; // attendeeId -> ticket selections
  // REMOVED: packages - now using enhanced attendeeSelections structure
  
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
  
  // Preloaded tickets data for performance optimization
  preloadedTicketsData: PreloadedTicketsData | null;
  
  // Lodge-specific state
  lodgeCustomer: LodgeCustomer;
  lodgeDetails: LodgeDetails;
  lodgeOrder: LodgeOrder | null; // Consolidated lodge order (replaces lodgeTicketOrder and lodgeTableOrder)

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
  // REMOVED: updatePackageSelection - use enhanced actions instead
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
  setDraftId: (id: string) => void; // Set the draft ID directly (for using registrationId as draftId)
  
  // Anonymous session methods
  setAnonymousSessionEstablished: (established: boolean) => void; // Set if anonymous session is established
  
  // Delegation type methods
  setDelegationType: (type: 'lodge' | 'grandLodge' | 'masonicOrder' | null) => void; // Set delegation sub-type
  
  // Lodge-specific methods
  updateLodgeCustomer: (customer: Partial<LodgeCustomer>) => void;
  updateLodgeDetails: (details: Partial<LodgeDetails>) => void;
  setLodgeOrder: (order: LodgeOrder | null) => void; // Consolidated lodge order setter
  isLodgeFormValid: () => boolean;
  getLodgeValidationErrors: () => string[];
  
  // NEW: Enhanced-only migration actions
  addEnhancedPackageSelection: (attendeeId: string, packageId: string, quantity: number) => boolean;
  addEnhancedIndividualTicket: (attendeeId: string, ticketId: string, quantity: number) => boolean;
  removeEnhancedSelection: (attendeeId: string, itemId: string, itemType: 'package' | 'ticket') => boolean;
  addEnhancedLodgeBulkPackage: (packageId: string, quantity: number) => boolean;
  addEnhancedLodgeBulkTickets: (selections: Array<{ ticketId: string; quantity: number }>) => boolean;
  
  // Enhanced validation functions
  validateEnhancedStructures: () => { isValid: boolean; errors: string[]; warnings: string[] };
  isEnhancedDataComplete: (attendeeId?: string) => boolean;
  
  
  // NEW: Comprehensive metadata actions
  captureFunctionMetadata: (metadata: Omit<FunctionMetadata, 'captureTimestamp'>) => void;
  captureTicketMetadata: (ticket: FunctionTicketDefinition, eventData?: Partial<{ startDate: string; endDate: string; venue: string; venueAddress: string; description: string; status: string }>) => void;
  capturePackageMetadata: (pkg: FunctionPackage, includedTickets: FunctionTicketDefinition[]) => void;
  addAttendeeTicketSelection: (attendeeId: string, ticketId: string, quantity: number) => void;
  addAttendeePackageSelection: (attendeeId: string, packageId: string, quantity: number) => void;
  removeAttendeeSelection: (attendeeId: string, itemId: string, itemType: 'package' | 'ticket') => void;
  updateOrderSummary: () => void;
  updateRegistrationTableData: (data: Partial<RegistrationTableData>) => void;
  addLodgeBulkPackageSelection: (packageId: string, quantity: number) => void;
  addLodgeBulkTicketSelections: (selections: Array<{ ticketId: string; quantity: number }>) => void;
  
  // Preloaded tickets data actions
  setPreloadedTicketsData: (data: Omit<PreloadedTicketsData, 'timestamp' | 'isValid'>) => void;
  getPreloadedTicketsData: () => PreloadedTicketsData | null;
  clearPreloadedTicketsData: () => void;
  isPreloadedDataValid: (functionId: string, registrationType: RegistrationType) => boolean;
}

// --- Initial State ---
const initialRegistrationState: Omit<RegistrationState, 'startNewRegistration' | 'addPrimaryAttendee' | 'loadDraft' | 'clearRegistration' | 'clearAllAttendees' | 'setRegistrationType' | 'addAttendee' | 'addMasonAttendee' | 'addGuestAttendee' | 'addPartnerAttendee' | 'updateAttendee' | 'removeAttendee' | 'updateTicketSelections' | 'addPackageSelection' | 'removePackageSelection' | 'addIndividualTicket' | 'removeIndividualTicket' | 'clearAttendeeTicketSelections' | 'updateBillingDetails' | 'setAgreeToTerms' | '_updateStatus' | 'setCurrentStep' | 'goToNextStep' | 'goToPrevStep' | 'setConfirmationNumber' | 'setFunctionId' | 'setFunctionSlug' | 'setSelectedEvents' | 'setDraftRecoveryHandled' | 'setDraftId' | 'setAnonymousSessionEstablished' | 'setLodgeTicketOrder' | 'setDelegationType' | 'updateLodgeCustomer' | 'updateLodgeDetails' | 'updateLodgeTableOrder' | 'isLodgeFormValid' | 'getLodgeValidationErrors' | 'addEnhancedPackageSelection' | 'addEnhancedIndividualTicket' | 'removeEnhancedSelection' | 'addEnhancedLodgeBulkPackage' | 'addEnhancedLodgeBulkTickets' | 'validateEnhancedStructures' | 'isEnhancedDataComplete' | 'captureFunctionMetadata' | 'captureTicketMetadata' | 'capturePackageMetadata' | 'addAttendeeTicketSelection' | 'addAttendeePackageSelection' | 'removeAttendeeSelection' | 'updateOrderSummary' | 'updateRegistrationTableData' | 'addLodgeBulkPackageSelection' | 'addLodgeBulkTicketSelections'> = {
    draftId: null,
    registrationId: null, // Initialize registrationId as null
    functionId: null, // Initialize functionId as null
    functionSlug: null, // Initialize functionSlug as null
    selectedEvents: [], // Initialize selectedEvents as empty array
    registrationType: null,
    delegationType: null,
    attendees: [],
    
    // NEW: Initialize metadata storage
    functionMetadata: null,
    ticketMetadata: {},
    packageMetadata: {},
    attendeeSelections: {},
    orderSummary: null,
    registrationTableData: {
      function_id: null,
      customer_id: null,
      booking_contact_id: null,
      event_id: null,
      total_amount: 0,
      stripe_fee: 0,
      status: 'draft',
      payment_status: 'unpaid',
      stripe_payment_intent_id: null,
      organization_id: null
    },
    lodgeBulkSelection: null,
    
    ticketSelections: {}, // Initialize enhanced ticket selections
    // REMOVED: packages - using enhanced attendeeSelections structure
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
    
    // Preloaded tickets data initialization
    preloadedTicketsData: null,
    
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
    lodgeOrder: null, // Initialize as null
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
          // REMOVED: packages - using enhanced attendeeSelections structure
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
             // Also set registrationId to maintain compatibility
             set({ ...initialRegistrationState, draftId: id, registrationId: id, status: 'loading' }); 
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
          selectedEvents: [],
          // Reset all new metadata fields
          functionMetadata: null,
          ticketMetadata: {},
          packageMetadata: {},
          attendeeSelections: {},
          orderSummary: null,
          registrationTableData: initialRegistrationState.registrationTableData,
          lodgeBulkSelection: null
        }); // Reset to initial state but keep session
        
        // Clear stale localStorage data from previous registrations
        try {
          localStorage.removeItem('recent_registration');
          console.log('Cleared stale localStorage data from previous registrations');
        } catch (error) {
          console.warn('Could not clear localStorage:', error);
        }
        
        console.log('Registration state cleared.');
      },

      clearAllAttendees: () => {
        set(state => ({
          attendees: [],
          // REMOVED: packages - using enhanced attendeeSelections structure
          attendeeSelections: {}, // Clear enhanced selections instead
        }));
        console.log('[Store] Cleared all attendees and their enhanced selections.');
      },

      setRegistrationType: (type) => {
        const currentType = get().registrationType;
        
        // Clear lodge order when switching away from lodge registration
        if (currentType === 'lodges' && type !== 'lodges') {
          set({ 
            registrationType: type,
            lodgeOrder: null
          });
        } else {
          set({ registrationType: type });
        }
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
      // REMOVED: updatePackageSelection - use addEnhancedPackageSelection instead

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
      setDraftId: (id) => {
        console.log(`[Store] Setting draft ID to: ${id}`);
        // Also set registrationId to maintain compatibility
        set({ draftId: id, registrationId: id, status: 'draft' });
      },
      
      // Anonymous session actions
      setAnonymousSessionEstablished: (established) => set({ anonymousSessionEstablished: established }),
      
      // Delegation type actions
      setDelegationType: (type) => set({ delegationType: type }),
      
      // Lodge-specific actions
      updateLodgeCustomer: (customer) => set(state => ({
        lodgeCustomer: { ...state.lodgeCustomer, ...customer }
      })),
      
      updateLodgeDetails: (details) => set(state => ({
        lodgeDetails: { ...state.lodgeDetails, ...details }
      })),
      
      setLodgeOrder: (order) => set({ lodgeOrder: order }),
      
      isLodgeFormValid: () => {
        const state = get();
        const { lodgeCustomer, lodgeDetails, lodgeOrder } = state;
        
        // Check required fields including lodge order
        return !!(
          lodgeCustomer.firstName &&
          lodgeCustomer.lastName &&
          lodgeCustomer.email &&
          lodgeCustomer.mobile &&
          lodgeDetails.grand_lodge_id &&
          lodgeDetails.lodge_id &&
          lodgeOrder // Lodge order must be set
        );
      },
      
      getLodgeValidationErrors: () => {
        const state = get();
        const { lodgeCustomer, lodgeDetails, lodgeOrder } = state;
        const errors: string[] = [];
        
        if (!lodgeCustomer.firstName) errors.push('First name is required');
        if (!lodgeCustomer.lastName) errors.push('Last name is required');
        if (!lodgeCustomer.email) errors.push('Email is required');
        if (!lodgeCustomer.mobile) errors.push('Mobile number is required');
        if (!lodgeDetails.grand_lodge_id) errors.push('Grand Lodge selection is required');
        if (!lodgeDetails.lodge_id) errors.push('Lodge selection is required');
        if (!lodgeOrder) errors.push('Package selection is required');
        
        return errors;
      },
      
      // NEW: Comprehensive metadata actions
      captureFunctionMetadata: (metadata) => set({
        functionMetadata: {
          ...metadata,
          captureTimestamp: new Date().toISOString()
        }
      }),
      
      captureTicketMetadata: (ticket, eventData = {}) => set(state => {
        const ticketMetadata: TicketMetadata = {
          ticketId: ticket.id,
          name: ticket.name,
          description: ticket.description,
          price: ticket.price,
          event: {
            eventId: ticket.event_id,
            eventTitle: ticket.event_title,
            eventSubtitle: ticket.event_subtitle,
            eventSlug: ticket.event_slug,
            startDate: eventData.startDate || null,
            endDate: eventData.endDate || null,
            venue: eventData.venue || null,
            venueAddress: eventData.venueAddress || null,
            description: eventData.description || null,
            status: eventData.status || null
          },
          availability: {
            isActive: ticket.is_active ?? true,
            totalCapacity: ticket.total_capacity,
            availableCount: ticket.available_count,
            reservedCount: ticket.reserved_count,
            soldCount: ticket.sold_count,
            status: determineAvailabilityStatus(ticket.available_count)
          },
          status: 'unpaid',
          selectionTimestamp: new Date().toISOString(),
          functionId: ticket.function_id
        };
        
        return {
          ticketMetadata: {
            ...state.ticketMetadata,
            [ticket.id]: ticketMetadata
          }
        };
      }),
      
      capturePackageMetadata: (pkg, includedTickets) => set(state => {
        // Get full metadata for included tickets
        const includedTicketsMetadata = includedTickets.map(ticket => {
          // Use existing captured metadata if available, otherwise create new
          return state.ticketMetadata[ticket.id] || {
            ticketId: ticket.id,
            name: ticket.name,
            description: ticket.description,
            price: ticket.price,
            event: {
              eventId: ticket.event_id,
              eventTitle: ticket.event_title,
              eventSubtitle: ticket.event_subtitle,
              eventSlug: ticket.event_slug,
              startDate: null,
              endDate: null,
              venue: null,
              venueAddress: null,
              description: null,
              status: null
            },
            availability: {
              isActive: ticket.is_active ?? true,
              totalCapacity: ticket.total_capacity,
              availableCount: ticket.available_count,
              reservedCount: ticket.reserved_count,
              soldCount: ticket.sold_count,
              status: determineAvailabilityStatus(ticket.available_count)
            },
            status: 'unpaid',
            selectionTimestamp: new Date().toISOString(),
            functionId: ticket.function_id
          };
        });
        
        const packageMetadata: PackageMetadata = {
          packageId: pkg.id,
          name: pkg.name,
          description: pkg.description,
          price: pkg.price,
          originalPrice: pkg.original_price,
          discount: pkg.discount,
          includedTickets: includedTicketsMetadata,
          includesDescription: pkg.includes_description,
          includedTicketNames: pkg.includedTicketNames, // Preserve resolved ticket names from service
          status: 'unpaid',
          selectionTimestamp: new Date().toISOString(),
          functionId: pkg.function_id
        };
        
        return {
          packageMetadata: {
            ...state.packageMetadata,
            [pkg.id]: packageMetadata
          }
        };
      }),
      
      addAttendeeTicketSelection: (attendeeId, ticketId, quantity) => set(state => {
        const ticketMetadata = state.ticketMetadata[ticketId];
        if (!ticketMetadata) {
          console.error(`Ticket metadata not found for ticket ${ticketId}`);
          return state;
        }
        
        const attendee = state.attendees.find(a => a.attendeeId === attendeeId);
        if (!attendee) {
          console.error(`Attendee not found: ${attendeeId}`);
          return state;
        }
        
        const ticketRecord: EnhancedTicketSelection = {
          ticketRecordId: uuidv7(),
          ticket: ticketMetadata,
          quantity,
          subtotal: ticketMetadata.price * quantity,
          selectionTimestamp: new Date().toISOString(),
          status: 'unpaid',
          attendeeId
        };
        
        const existingSelection = state.attendeeSelections[attendeeId] || {
          attendeeId,
          attendeeName: `${attendee.firstName} ${attendee.lastName}`,
          attendeeType: attendee.attendeeType,
          packages: [],
          individualTickets: [],
          attendeeSubtotal: 0,
          status: 'unpaid'
        };
        
        const updatedSelection: AttendeeSelectionSummary = {
          ...existingSelection,
          individualTickets: [...existingSelection.individualTickets, ticketRecord],
          attendeeSubtotal: existingSelection.attendeeSubtotal + ticketRecord.subtotal
        };
        
        return {
          attendeeSelections: {
            ...state.attendeeSelections,
            [attendeeId]: updatedSelection
          }
        };
      }),
      
      addAttendeePackageSelection: (attendeeId, packageId, quantity) => set(state => {
        const packageMetadata = state.packageMetadata[packageId];
        if (!packageMetadata) {
          console.error(`Package metadata not found for package ${packageId}`);
          return state;
        }
        
        const attendee = state.attendees.find(a => a.attendeeId === attendeeId);
        if (!attendee) {
          console.error(`Attendee not found: ${attendeeId}`);
          return state;
        }
        
        // CRITICAL DEBUGGING: Log package metadata structure
        console.log(`[TICKET EXPANSION DEBUG] Package ${packageId} metadata:`, {
          packageName: packageMetadata.name,
          includedTicketsCount: packageMetadata.includedTickets?.length || 0,
          includedTickets: packageMetadata.includedTickets?.map(t => ({
            ticketId: t.ticketId,
            name: t.name,
            eventId: t.event?.eventId
          })) || []
        });
        
        // Generate ticket records for each included ticket
        const generatedTicketRecords = packageMetadata.includedTickets.map(ticket => ({
          ticketRecordId: uuidv7(),
          eventTicketId: ticket.ticketId,
          fromPackageId: packageId
        }));
        
        // CRITICAL DEBUGGING: Log generated ticket records
        console.log(`[TICKET EXPANSION DEBUG] Generated ${generatedTicketRecords.length} ticket records:`, generatedTicketRecords);
        
        const packageRecord: EnhancedPackageSelection = {
          packageRecordId: uuidv7(),
          package: packageMetadata,
          quantity,
          subtotal: packageMetadata.price * quantity,
          selectionTimestamp: new Date().toISOString(),
          status: 'unpaid',
          generatedTicketRecords
        };
        
        // CRITICAL DEBUGGING: Log created package record
        console.log(`[TICKET EXPANSION DEBUG] Created package record:`, {
          packageRecordId: packageRecord.packageRecordId,
          packageName: packageRecord.package.name,
          generatedTicketRecordsCount: packageRecord.generatedTicketRecords.length,
          generatedTicketRecords: packageRecord.generatedTicketRecords
        });
        
        const existingSelection = state.attendeeSelections[attendeeId] || {
          attendeeId,
          attendeeName: `${attendee.firstName} ${attendee.lastName}`,
          attendeeType: attendee.attendeeType,
          packages: [],
          individualTickets: [],
          attendeeSubtotal: 0,
          status: 'unpaid'
        };
        
        const updatedSelection: AttendeeSelectionSummary = {
          ...existingSelection,
          packages: [...existingSelection.packages, packageRecord],
          attendeeSubtotal: existingSelection.attendeeSubtotal + packageRecord.subtotal
        };
        
        // CRITICAL DEBUGGING: Log final attendee selection
        console.log(`[TICKET EXPANSION DEBUG] Updated attendee selection:`, {
          attendeeId: updatedSelection.attendeeId,
          attendeeName: updatedSelection.attendeeName,
          packagesCount: updatedSelection.packages.length,
          totalGeneratedTickets: updatedSelection.packages.reduce((sum, pkg) => sum + pkg.generatedTicketRecords.length, 0)
        });
        
        return {
          attendeeSelections: {
            ...state.attendeeSelections,
            [attendeeId]: updatedSelection
          }
        };
      }),
      
      removeAttendeeSelection: (attendeeId, itemId, itemType) => set(state => {
        const selection = state.attendeeSelections[attendeeId];
        if (!selection) return state;
        
        let updatedSelection = { ...selection };
        
        if (itemType === 'ticket') {
          const ticketIndex = selection.individualTickets.findIndex(t => t.ticketRecordId === itemId);
          if (ticketIndex >= 0) {
            const removedTicket = selection.individualTickets[ticketIndex];
            updatedSelection.individualTickets = selection.individualTickets.filter(t => t.ticketRecordId !== itemId);
            updatedSelection.attendeeSubtotal -= removedTicket.subtotal;
          }
        } else {
          const packageIndex = selection.packages.findIndex(p => p.packageRecordId === itemId);
          if (packageIndex >= 0) {
            const removedPackage = selection.packages[packageIndex];
            updatedSelection.packages = selection.packages.filter(p => p.packageRecordId !== itemId);
            updatedSelection.attendeeSubtotal -= removedPackage.subtotal;
          }
        }
        
        return {
          attendeeSelections: {
            ...state.attendeeSelections,
            [attendeeId]: updatedSelection
          }
        };
      }),
      
      updateOrderSummary: () => set(state => {
        const attendeeSummaries = Object.values(state.attendeeSelections);
        const subtotal = attendeeSummaries.reduce((sum, summary) => sum + summary.attendeeSubtotal, 0);
        
        // Count total tickets (from packages and individual)
        let totalTickets = 0;
        let totalPackages = 0;
        
        // CRITICAL DEBUGGING: Log ticket counting process
        console.log(`[ORDER SUMMARY DEBUG] Processing ${attendeeSummaries.length} attendee summaries`);
        
        attendeeSummaries.forEach((summary, index) => {
          const attendeePackageTickets = summary.packages.reduce((sum, pkg) => sum + pkg.generatedTicketRecords.length, 0);
          const attendeeIndividualTickets = summary.individualTickets.length;
          
          console.log(`[ORDER SUMMARY DEBUG] Attendee ${index + 1} (${summary.attendeeName}):`, {
            packages: summary.packages.length,
            individualTickets: attendeeIndividualTickets,
            packageTickets: attendeePackageTickets,
            packageDetails: summary.packages.map(pkg => ({
              packageName: pkg.package.name,
              generatedTickets: pkg.generatedTicketRecords.length
            }))
          });
          
          totalPackages += summary.packages.length;
          totalTickets += summary.individualTickets.length;
          
          // Add tickets from packages
          summary.packages.forEach(pkg => {
            totalTickets += pkg.generatedTicketRecords.length;
          });
        });
        
        console.log(`[ORDER SUMMARY DEBUG] Final ticket count - Total: ${totalTickets}, Packages: ${totalPackages}`);
        
        // Add lodge bulk selection if present
        if (state.lodgeBulkSelection) {
          totalTickets += state.lodgeBulkSelection.willGenerateTickets;
          if (state.lodgeBulkSelection.selectionType === 'package') {
            totalPackages += 1;
          }
        }
        
        const orderSummary: OrderSummary = {
          registrationId: state.draftId || undefined,
          functionId: state.functionId || '',
          functionName: state.functionMetadata?.functionName || '',
          registrationType: state.registrationType || 'individuals',
          totalAttendees: state.attendees.length,
          attendeeSummaries,
          subtotal: state.lodgeBulkSelection ? state.lodgeBulkSelection.subtotal : subtotal,
          processingFees: 0, // Will be calculated in payment step
          stripeFee: 0, // Will be calculated in payment step
          totalAmount: state.lodgeBulkSelection ? state.lodgeBulkSelection.subtotal : subtotal,
          currency: 'AUD',
          totalTickets,
          totalPackages,
          status: state.status === 'completed' ? 'completed' : state.status === 'error' ? 'cancelled' : 'draft',
          paymentStatus: 'unpaid',
          createdAt: state.orderSummary?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          selectionCompleteTimestamp: new Date().toISOString()
        };
        
        return { orderSummary };
      }),
      
      updateRegistrationTableData: (data) => set(state => ({
        registrationTableData: {
          ...state.registrationTableData,
          ...data
        }
      })),
      
      addLodgeBulkPackageSelection: (packageId, quantity) => set(state => {
        const packageMetadata = state.packageMetadata[packageId];
        if (!packageMetadata) {
          console.error(`Package metadata not found for package ${packageId}`);
          return state;
        }
        
        const pricePerUnit = packageMetadata.price;
        const subtotal = pricePerUnit * quantity;
        const willGenerateTickets = packageMetadata.includedTickets.length * quantity;
        
        const lodgeBulkSelection: LodgeBulkSelection = {
          selectionType: 'package',
          packageId,
          packageMetadata,
          quantity,
          pricePerUnit,
          subtotal,
          status: 'unpaid',
          selectionTimestamp: new Date().toISOString(),
          willGenerateTickets
        };
        
        // Also update order summary
        const orderSummary: OrderSummary = {
          registrationId: state.draftId || undefined,
          functionId: state.functionId || '',
          functionName: state.functionMetadata?.functionName || '',
          registrationType: 'lodge',
          totalAttendees: quantity,
          attendeeSummaries: [], // No attendees yet for lodge
          subtotal,
          processingFees: 0,
          stripeFee: 0,
          totalAmount: subtotal,
          currency: 'AUD',
          totalTickets: willGenerateTickets,
          totalPackages: 1,
          status: 'draft',
          paymentStatus: 'unpaid',
          createdAt: state.orderSummary?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          selectionCompleteTimestamp: new Date().toISOString()
        };
        
        return {
          lodgeBulkSelection,
          orderSummary
        };
      }),
      
      addLodgeBulkTicketSelections: (selections) => set(state => {
        // Implementation for bulk individual ticket selection (if needed)
        console.log('Lodge bulk ticket selections not fully implemented yet');
        return state;
      }),

      // === NEW: Enhanced-only migration actions ===
      
      addEnhancedPackageSelection: (attendeeId, packageId, quantity) => {
        const state = get();
        
        // Enhanced-only validation
        if (!state.packageMetadata[packageId]) {
          console.error(`[Enhanced Store] Package metadata not found for package ${packageId}. Cannot proceed with enhanced-only operation.`);
          return false;
        }
        
        if (!state.attendees.find(a => a.attendeeId === attendeeId)) {
          console.error(`[Enhanced Store] Attendee not found: ${attendeeId}. Cannot proceed with enhanced-only operation.`);
          return false;
        }
        
        // Use existing enhanced action but with validation and logging
        console.log(`[Enhanced Store] Adding enhanced package selection - AttendeeId: ${attendeeId}, PackageId: ${packageId}, Quantity: ${quantity}`);
        
        const success = (() => {
          try {
            // Call existing enhanced action
            get().addAttendeePackageSelection(attendeeId, packageId, quantity);
            
            // Trigger order summary update
            get().updateOrderSummary();
            
            console.log(`[Enhanced Store] Successfully added enhanced package selection - Generated tickets: ${state.packageMetadata[packageId].includedTickets.length * quantity}`);
            return true;
          } catch (error) {
            console.error(`[Enhanced Store] Failed to add enhanced package selection:`, error);
            return false;
          }
        })();
        
        // Log validation status
        const validation = get().validateEnhancedStructures();
        if (!validation.isValid) {
          console.warn(`[Enhanced Store] Enhanced structures validation issues after package selection:`, validation.errors);
        }
        
        return success;
      },
      
      addEnhancedIndividualTicket: (attendeeId, ticketId, quantity) => {
        const state = get();
        
        // Enhanced-only validation
        if (!state.ticketMetadata[ticketId]) {
          console.error(`[Enhanced Store] Ticket metadata not found for ticket ${ticketId}. Cannot proceed with enhanced-only operation.`);
          return false;
        }
        
        if (!state.attendees.find(a => a.attendeeId === attendeeId)) {
          console.error(`[Enhanced Store] Attendee not found: ${attendeeId}. Cannot proceed with enhanced-only operation.`);
          return false;
        }
        
        console.log(`[Enhanced Store] Adding enhanced individual ticket - AttendeeId: ${attendeeId}, TicketId: ${ticketId}, Quantity: ${quantity}`);
        
        const success = (() => {
          try {
            // Call existing enhanced action
            get().addAttendeeTicketSelection(attendeeId, ticketId, quantity);
            
            // Trigger order summary update
            get().updateOrderSummary();
            
            console.log(`[Enhanced Store] Successfully added enhanced individual ticket - Subtotal: ${state.ticketMetadata[ticketId].price * quantity}`);
            return true;
          } catch (error) {
            console.error(`[Enhanced Store] Failed to add enhanced individual ticket:`, error);
            return false;
          }
        })();
        
        // Log validation status
        const validation = get().validateEnhancedStructures();
        if (!validation.isValid) {
          console.warn(`[Enhanced Store] Enhanced structures validation issues after ticket selection:`, validation.errors);
        }
        
        return success;
      },
      
      removeEnhancedSelection: (attendeeId, itemId, itemType) => {
        const state = get();
        
        if (!state.attendeeSelections[attendeeId]) {
          console.error(`[Enhanced Store] No selections found for attendee: ${attendeeId}`);
          return false;
        }
        
        console.log(`[Enhanced Store] Removing enhanced selection - AttendeeId: ${attendeeId}, ItemId: ${itemId}, Type: ${itemType}`);
        
        const success = (() => {
          try {
            // Call existing enhanced action
            get().removeAttendeeSelection(attendeeId, itemId, itemType);
            
            // Trigger order summary update
            get().updateOrderSummary();
            
            console.log(`[Enhanced Store] Successfully removed enhanced ${itemType} selection`);
            return true;
          } catch (error) {
            console.error(`[Enhanced Store] Failed to remove enhanced selection:`, error);
            return false;
          }
        })();
        
        return success;
      },
      
      addEnhancedLodgeBulkPackage: (packageId, quantity) => {
        const state = get();
        
        // Enhanced-only validation
        if (!state.packageMetadata[packageId]) {
          console.error(`[Enhanced Store] Package metadata not found for package ${packageId}. Cannot proceed with enhanced lodge bulk operation.`);
          return false;
        }
        
        if (state.registrationType !== 'lodge') {
          console.error(`[Enhanced Store] Lodge bulk operations only available for lodge registration type. Current type: ${state.registrationType}`);
          return false;
        }
        
        console.log(`[Enhanced Store] Adding enhanced lodge bulk package - PackageId: ${packageId}, Quantity: ${quantity}`);
        
        const success = (() => {
          try {
            // Call existing enhanced action
            get().addLodgeBulkPackageSelection(packageId, quantity);
            
            console.log(`[Enhanced Store] Successfully added enhanced lodge bulk package - Will generate ${state.packageMetadata[packageId].includedTickets.length * quantity} tickets`);
            return true;
          } catch (error) {
            console.error(`[Enhanced Store] Failed to add enhanced lodge bulk package:`, error);
            return false;
          }
        })();
        
        // Log validation status
        const validation = get().validateEnhancedStructures();
        if (!validation.isValid) {
          console.warn(`[Enhanced Store] Enhanced structures validation issues after lodge bulk package:`, validation.errors);
        }
        
        return success;
      },
      
      addEnhancedLodgeBulkTickets: (selections) => {
        const state = get();
        
        // Enhanced-only validation
        for (const selection of selections) {
          if (!state.ticketMetadata[selection.ticketId]) {
            console.error(`[Enhanced Store] Ticket metadata not found for ticket ${selection.ticketId}. Cannot proceed with enhanced lodge bulk operation.`);
            return false;
          }
        }
        
        if (state.registrationType !== 'lodge') {
          console.error(`[Enhanced Store] Lodge bulk operations only available for lodge registration type. Current type: ${state.registrationType}`);
          return false;
        }
        
        console.log(`[Enhanced Store] Adding enhanced lodge bulk tickets - Selections:`, selections);
        
        const success = (() => {
          try {
            // Call existing action (when implemented)
            get().addLodgeBulkTicketSelections(selections);
            
            console.log(`[Enhanced Store] Successfully added enhanced lodge bulk tickets`);
            return true;
          } catch (error) {
            console.error(`[Enhanced Store] Failed to add enhanced lodge bulk tickets:`, error);
            return false;
          }
        })();
        
        return success;
      },
      
      // === Enhanced validation functions ===
      
      validateEnhancedStructures: () => {
        const state = get();
        const errors: string[] = [];
        const warnings: string[] = [];
        
        // Validate function metadata exists
        if (!state.functionMetadata) {
          errors.push('Function metadata not captured');
        }
        
        // Validate attendee selections have corresponding metadata
        Object.entries(state.attendeeSelections).forEach(([attendeeId, selection]) => {
          // Validate package selections have metadata
          selection.packages.forEach((pkg, index) => {
            if (!state.packageMetadata[pkg.package.packageId]) {
              errors.push(`Package metadata missing for selection ${index} of attendee ${attendeeId}`);
            }
          });
          
          // Validate ticket selections have metadata
          selection.individualTickets.forEach((ticket, index) => {
            if (!state.ticketMetadata[ticket.ticket.ticketId]) {
              errors.push(`Ticket metadata missing for selection ${index} of attendee ${attendeeId}`);
            }
          });
          
          // Validate attendee exists
          if (!state.attendees.find(a => a.attendeeId === attendeeId)) {
            errors.push(`Attendee ${attendeeId} has selections but doesn't exist in attendees array`);
          }
        });
        
        // Validate order summary consistency
        if (state.orderSummary) {
          const calculatedAttendees = state.attendees.length;
          if (state.orderSummary.totalAttendees !== calculatedAttendees) {
            warnings.push(`Order summary attendee count (${state.orderSummary.totalAttendees}) doesn't match actual attendees (${calculatedAttendees})`);
          }
        } else {
          warnings.push('Order summary not generated');
        }
        
        // Validate lodge bulk selection (if present) has metadata
        if (state.lodgeBulkSelection) {
          if (state.lodgeBulkSelection.selectionType === 'package' && state.lodgeBulkSelection.packageId) {
            if (!state.packageMetadata[state.lodgeBulkSelection.packageId]) {
              errors.push('Lodge bulk package selection missing metadata');
            }
          }
        }
        
        const isValid = errors.length === 0;
        
        console.log(`[Enhanced Store] Validation completed - Valid: ${isValid}, Errors: ${errors.length}, Warnings: ${warnings.length}`);
        
        return { isValid, errors, warnings };
      },
      
      isEnhancedDataComplete: (attendeeId) => {
        const state = get();
        
        if (attendeeId) {
          // Check specific attendee
          const selection = state.attendeeSelections[attendeeId];
          const attendee = state.attendees.find(a => a.attendeeId === attendeeId);
          
          return !!(
            attendee && 
            selection && 
            state.functionMetadata &&
            (selection.packages.length > 0 || selection.individualTickets.length > 0)
          );
        } else {
          // Check overall registration
          return !!(
            state.functionMetadata &&
            (Object.keys(state.attendeeSelections).length > 0 || state.lodgeBulkSelection) &&
            state.orderSummary
          );
        }
      },
      
      // === Preloaded tickets data actions ===
      
      setPreloadedTicketsData: (data) => set(state => {
        const now = Date.now();
        const preloadedData: PreloadedTicketsData = {
          ...data,
          timestamp: now,
          isValid: true
        };
        
        console.log(`[Store] Preloaded tickets data set for function ${data.functionId}, type ${data.registrationType}`);
        console.log(`[Store] Preloaded ${data.tickets.length} tickets and ${data.packages.length} packages`);
        
        return {
          preloadedTicketsData: preloadedData
        };
      }),
      
      getPreloadedTicketsData: () => {
        const state = get();
        const data = state.preloadedTicketsData;
        
        if (!data) {
          return null;
        }
        
        // Check if data is still valid (within 5 minutes)
        const now = Date.now();
        const maxAge = 5 * 60 * 1000; // 5 minutes
        const isStale = (now - data.timestamp) > maxAge;
        
        if (isStale) {
          console.log(`[Store] Preloaded tickets data is stale (${(now - data.timestamp) / 1000}s old), returning null`);
          // Clear stale data
          get().clearPreloadedTicketsData();
          return null;
        }
        
        return data;
      },
      
      clearPreloadedTicketsData: () => set(state => {
        console.log(`[Store] Clearing preloaded tickets data`);
        return {
          preloadedTicketsData: null
        };
      }),
      
      isPreloadedDataValid: (functionId, registrationType) => {
        const data = get().getPreloadedTicketsData();
        return !!(
          data && 
          data.functionId === functionId && 
          data.registrationType === registrationType &&
          data.isValid
        );
      },

    }),
    {
      name: 'lodgetix-registration-storage',
      storage: createJSONStorage(() => createUserEncryptedStorage()),
      partialize: (state) => ({
        draftId: state.draftId,
        functionId: state.functionId, // Persist function ID
        functionSlug: state.functionSlug, // Persist function slug
        selectedEvents: state.selectedEvents, // Persist selected events
        registrationType: state.registrationType,
        delegationType: state.delegationType, // Persist delegation type
        attendees: state.attendees,
        ticketSelections: state.ticketSelections, // Persist enhanced ticket selections
        billingDetails: state.billingDetails,
        // Don't persist agreeToTerms - it should always default to false
        status: state.status, // Persist status to track completed registrations
        confirmationNumber: state.confirmationNumber, // Persist confirmation number
        // Don't persist draftRecoveryHandled - it should reset on each session
        anonymousSessionEstablished: state.anonymousSessionEstablished, // Persist anonymous session state
        // Lodge-specific persistence
        lodgeCustomer: state.lodgeCustomer,
        lodgeDetails: state.lodgeDetails,
        lodgeOrder: state.lodgeOrder, // Persist consolidated lodge order
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
export const selectRegistrationId = (state: RegistrationState) => state.registrationId;
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

// === NEW: Enhanced-only selectors ===

export const selectEnhancedAttendeeSelections = (state: RegistrationState) => state.attendeeSelections;

export const selectEnhancedAttendeeSelection = (attendeeId: string) => (state: RegistrationState) => 
  state.attendeeSelections[attendeeId];

export const selectEnhancedOrderSummary = (state: RegistrationState) => state.orderSummary;

export const selectFunctionMetadata = (state: RegistrationState) => state.functionMetadata;

export const selectTicketMetadata = (state: RegistrationState) => state.ticketMetadata;

export const selectPackageMetadata = (state: RegistrationState) => state.packageMetadata;

export const selectLodgeBulkSelection = (state: RegistrationState) => state.lodgeBulkSelection;

export const selectRegistrationTableData = (state: RegistrationState) => state.registrationTableData;

export const selectEnhancedValidationStatus = (state: RegistrationState) => {
  // Use the store's validation method
  const store = useRegistrationStore.getState();
  return store.validateEnhancedStructures();
};

export const selectIsEnhancedDataComplete = (attendeeId?: string) => (state: RegistrationState) => {
  // Use the store's completion check method
  const store = useRegistrationStore.getState();
  return store.isEnhancedDataComplete(attendeeId);
};

export const selectEnhancedTotalValue = (state: RegistrationState) => {
  if (state.lodgeBulkSelection) {
    return state.lodgeBulkSelection.subtotal;
  }
  
  return Object.values(state.attendeeSelections).reduce(
    (total, selection) => total + selection.attendeeSubtotal, 
    0
  );
};

export const selectEnhancedTicketCount = (state: RegistrationState) => {
  if (state.lodgeBulkSelection) {
    return state.lodgeBulkSelection.willGenerateTickets;
  }
  
  let totalTickets = 0;
  Object.values(state.attendeeSelections).forEach(selection => {
    totalTickets += selection.individualTickets.length;
    selection.packages.forEach(pkg => {
      totalTickets += pkg.generatedTicketRecords.length;
    });
  });
  
  return totalTickets;
};

export const selectEnhancedPackageCount = (state: RegistrationState) => {
  if (state.lodgeBulkSelection && state.lodgeBulkSelection.selectionType === 'package') {
    return 1;
  }
  
  return Object.values(state.attendeeSelections).reduce(
    (total, selection) => total + selection.packages.length,
    0
  );
}; 