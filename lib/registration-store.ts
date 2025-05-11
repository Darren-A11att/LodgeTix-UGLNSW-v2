import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type {
  RegistrationType,
  MasonAttendee,
  Attendee,
  Ticket,
  // TODO: Define types for step-specific data if needed, e.g.:
  // AttendeeDetailsStepData,
  // TicketSelectionStepData,
  // PaymentDetailsStepData,
} from './registration-types'; // Ensure all necessary types are imported or defined

// Interface for the state of the entire wizard
export interface RegistrationWizardState {
  registrationId: string;          // Unique UUID for the entire registration
  confirmationNumber: string | null; // Human-readable confirmation number - RETAIN AS NULLABLE
  registrationType: RegistrationType | null;
  currentStep: number; // Example: 1 for RegistrationType, 2 for AttendeeDetails, etc.
  // Store data for each step in a structured way
  // This allows each step to manage its own data slice within the global store
  attendeeDetails: {
    primaryAttendee: MasonAttendee | null;
    additionalAttendees: Attendee[];
    // other fields specific to this step's data collection
  };
  ticketSelection: {
    tickets: Ticket[];
    // other fields for ticket selection
  };
  paymentDetails: {
    paymentIntentId: string | null; // Stores the payment intent ID for transaction reference
    paymentMethodId: string | null; // Reserved for future use if needed
    last4: string | null;           // For displaying payment information (e.g., "Billed to: John Smith")
    // We do NOT store clientSecret here as it's a security risk
    // cardName: string; // Removed
    // cardNumber: string; // Removed
    // expiryDate: string; // Removed
    // cvc: string; // Removed
  } | null;
  // Add more step data objects as needed
  // Example: guestDetails, eventSpecificQuestions, etc.

  // Potentially keep a flat list of all attendees if useful for summaries,
  // but primary data source should be within step-specific objects for clarity.
  // allAttendeesForReview: Attendee[]; 
}

// ADDED interface for data received after successful backend confirmation
export interface ConfirmedRegistrationDetails {
  confirmationNumber: string;
  // registrationId?: string; // Optional: if Supabase confirms/returns it
}

// Interface for the actions available on the store
export interface RegistrationWizardActions {
  setRegistrationType: (type: RegistrationType) => void;
  
  // Actions for AttendeeDetailsStep
  setPrimaryAttendee: (attendee: MasonAttendee | null) => void;
  addAdditionalAttendee: (attendee: Attendee) => void;
  updateAdditionalAttendee: (attendeeId: string, data: Partial<Attendee>) => void;
  removeAdditionalAttendee: (attendeeId: string) => void;
  // Consider if partner data should be managed via these actions or within Attendee objects

  // Actions for TicketSelectionStep
  addTicket: (ticket: Ticket) => void;
  removeTicket: (ticketId: string) => void; // Assuming ticket has an id
  updateTicket: (ticketId: string, data: Partial<Ticket>) => void;

  // Actions for PaymentDetailsStep
  setPaymentDetails: (details: RegistrationWizardState['paymentDetails'] | null) => void;

  // Navigation actions
  setCurrentStep: (step: number) => void;
  goToNextStep: () => void;
  goToPrevStep: () => void;
  
  // Reset action
  resetWizard: () => void;

  // Action to set confirmation number (and other details) after successful backend registration
  setConfirmedRegistrationDetails: (details: ConfirmedRegistrationDetails) => void;

  // TODO: Add more specific actions as needed for each step
  // For example, to update parts of a step without replacing the whole object:
  // updateAttendeeDetailsData: (data: Partial<RegistrationWizardState['attendeeDetails']>) => void;
}

const initialAttendeeDetailsState = {
  primaryAttendee: null,
  additionalAttendees: [],
};

const initialTicketSelectionState = {
  tickets: [],
};

const initialPaymentDetailsState: RegistrationWizardState['paymentDetails'] = null; // Keeps it simple, or can be an object with null fields

// Import the confirmation number generator
import { generateConfirmationNumber } from './confirmation-utils';

const initialState: RegistrationWizardState = {
  registrationId: '',           // Will be set when registration type is selected
  confirmationNumber: null,       // RETAIN AS NULL - Not set early
  registrationType: null,
  currentStep: 1, // Start at step 1
  attendeeDetails: initialAttendeeDetailsState,
  ticketSelection: initialTicketSelectionState,
  paymentDetails: initialPaymentDetailsState,
};

export const useRegistrationStore = create<RegistrationWizardState & RegistrationWizardActions>()(
  // devtools(
    persist(
      (set, get) => ({
        ...initialState,

        setRegistrationType: (type, eventCode?: string) => {
          const newRegistrationId = uuidv4();
          // const newConfirmationNumber = generateConfirmationNumber(eventCode); // ALREADY REMOVED

          set({
            registrationId: newRegistrationId,
            // confirmationNumber: newConfirmationNumber, // ALREADY REMOVED
            registrationType: type,
            currentStep: 2, // Advance to step 2 (e.g., Attendee Details)
            ticketSelection: initialTicketSelectionState, // Always reset tickets when type is set/changed
          });

          console.log(`New registration created: ${newRegistrationId}`); // ALREADY MODIFIED
        },

        // Attendee Details Actions
        setPrimaryAttendee: (attendee) =>
          set((state) => {
            const currentAdditionalAttendees = state.attendeeDetails.additionalAttendees;
            let validAttendeeIds: string[] = [];

            if (attendee) {
              validAttendeeIds.push(attendee.id);
            }
            currentAdditionalAttendees.forEach(add => validAttendeeIds.push(add.id));

            const updatedTickets = state.ticketSelection.tickets.filter(ticket => 
              validAttendeeIds.includes(ticket.attendeeId)
            );

            return {
              attendeeDetails: { ...state.attendeeDetails, primaryAttendee: attendee },
              ticketSelection: { ...state.ticketSelection, tickets: updatedTickets },
            };
          }),
        addAdditionalAttendee: (attendee) =>
          set((state) => ({
            attendeeDetails: {
              ...state.attendeeDetails,
              additionalAttendees: [...state.attendeeDetails.additionalAttendees, attendee],
            },
          })),
        updateAdditionalAttendee: (attendeeId, data) =>
          set((state) => ({
            attendeeDetails: {
              ...state.attendeeDetails,
              additionalAttendees: state.attendeeDetails.additionalAttendees.map((att) => {
                if (att.id === attendeeId) {
                  // Ensure the 'type' field from the original attendee is preserved.
                  // Destructure 'type' from 'data' to prevent it from being spread,
                  // then spread the rest of the data.
                  const { type, ...restOfData } = data; // data is Partial<Attendee>
                  return { ...att, ...restOfData }; 
                }
                return att;
              }),
            },
          })),
        removeAdditionalAttendee: (attendeeIdToRemove) =>
          set((state) => {
            const updatedAdditionalAttendees = state.attendeeDetails.additionalAttendees.filter(
              (att) => att.id !== attendeeIdToRemove
            );
            const updatedTickets = state.ticketSelection.tickets.filter(
              (ticket) => ticket.attendeeId !== attendeeIdToRemove
            );
            return {
              attendeeDetails: {
                ...state.attendeeDetails,
                additionalAttendees: updatedAdditionalAttendees,
              },
              ticketSelection: {
                ...state.ticketSelection,
                tickets: updatedTickets,
              },
            };
          }),

        // Ticket Selection Actions
        addTicket: (ticket) =>
          set((state) => ({
            ticketSelection: {
              ...state.ticketSelection,
              tickets: [...state.ticketSelection.tickets, ticket],
            },
          })),
        removeTicket: (ticketId) => {
          console.log("[Zustand Store] Attempting to remove ticketId:", ticketId); // Added log
          set((state) => {
            const originalTicketCount = state.ticketSelection.tickets.length;
            const newTickets = state.ticketSelection.tickets.filter((t) => t.id !== ticketId);
            console.log(
              "[Zustand Store] Tickets after removal attempt for", ticketId, 
              ":", newTickets.length, "remaining. Old length:", originalTicketCount,
              "Removed success:", newTickets.length < originalTicketCount // Added log for success
            ); 
            return {
              ticketSelection: {
                ...state.ticketSelection,
                tickets: newTickets,
              },
            };
          });
        },
        updateTicket: (ticketId, data) =>
          set((state) => ({
            ticketSelection: {
              ...state.ticketSelection,
              tickets: state.ticketSelection.tickets.map((t) =>
                t.id === ticketId ? { ...t, ...data } : t
              ),
            },
          })),
        
        // Payment Details Actions
        setPaymentDetails: (details) => set({ paymentDetails: details }),

        // Navigation Actions
        setCurrentStep: (step) => set({ currentStep: step }),
        goToNextStep: () => {
          // TODO: Add validation logic here before advancing if required by the step
          // For example, check if get().attendeeDetails.primaryAttendee exists before leaving step 2
          set((state) => ({ currentStep: state.currentStep + 1 }))
        },
        goToPrevStep: () => set((state) => ({ currentStep: state.currentStep > 1 ? state.currentStep - 1 : 1 })),
        
        // Reset Wizard
        resetWizard: () => {
          set(initialState);
        },

        // ADDED ACTION IMPLEMENTATION
        setConfirmedRegistrationDetails: (details) => set({
          confirmationNumber: details.confirmationNumber,
          // registrationId: details.registrationId || get().registrationId, // Example if also updating regId
        }),
      }),
      {
        name: "registration-storage", // name of the item in the storage (must be unique)
        // storage: createJSONStorage(() => sessionStorage), // (optional) by default, 'localStorage' is used
        // partialize: (state) => ({ currentStep: state.currentStep }), // Example: only persist currentStep
      }
    )
  // )
);

// Optional: Selector for easier access to specific parts of the state
export const selectRegistrationType = (state: RegistrationWizardState) => state.registrationType;
export const selectCurrentStep = (state: RegistrationWizardState) => state.currentStep;
export const selectAttendeeDetails = (state: RegistrationWizardState) => state.attendeeDetails;
// etc.

/**
 * NOTES on Zustand Store Design:
 * 
 * 1.  State Structure:
 *     - `registrationType`: Stores the type selected at the first step.
 *     - `currentStep`: Manages the active step in the wizard.
 *     - Step-specific data objects (`attendeeDetails`, `ticketSelection`, `paymentDetails`):
 *       This is a key change. Each major step in the wizard will have its own object
 *       in the store to hold its relevant data. This makes it easier for each step
 *       component to manage its slice of the state using react-hook-form and Zod.
 *       When a step is "submitted" (user clicks "Next"), its data is validated and then
 *       written to its corresponding object in the Zustand store.
 * 
 * 2.  Actions:
 *     - `setRegistrationType`: Sets the type and can auto-advance to the next step.
 *     - CRUD-like actions for each data slice (e.g., `setPrimaryAttendee`, `addTicket`).
 *     - Navigation actions: `setCurrentStep`, `goToNextStep`, `goToPrevStep`.
 *     - `resetWizard`: Resets the entire store to its initial state.
 * 
 * 3.  Persistence (`persist` middleware):
 *     - The entire store state is saved to `localStorage` under the key 'registration-wizard-storage'.
 *     - This ensures data is not lost on page refresh or if the user closes and reopens the tab.
 *     - The `partialize` option (commented out) can be used if you only want to persist specific
 *       parts of the state, which can be useful to avoid storing very large objects or sensitive
 *       data that shouldn't be persisted long-term in localStorage. For now, persisting all is fine.
 * 
 * 4.  Devtools (`devtools` middleware):
 *     - Allows inspecting the store state and action history using Redux DevTools browser extension.
 * 
 * 5.  Selectors (Optional but Recommended):
 *     - Simple functions to pick out specific pieces of state. This can make components cleaner
 *       as they don't need to destructure the entire state object.
 * 
 * 6.  Next Steps for this Store:
 *     - As we refactor each step of the wizard (AttendeeDetails, TicketSelection, etc.),
 *       we will define more detailed interfaces for their respective data objects
 *       (e.g., `AttendeeDetailsStepData`) and potentially add more granular actions if needed.
 *     - Validation logic for `goToNextStep` will be important. Before advancing, we might want
 *       to ensure the current step's data (if any is expected) is valid or present. This
 *       can be checked using `get()` within the action.
 */ 