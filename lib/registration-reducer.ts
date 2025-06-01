import type { RegistrationState, RegistrationAction, Attendee, PartnerAttendee } from "./registration-types"

export const initialRegistrationState: RegistrationState = {
  registrationType: null,
  primaryAttendee: null,
  additionalAttendees: [],
  tickets: [],
  currentStep: 0,
  paymentDetails: null,
}

export function registrationReducer(state: RegistrationState, action: RegistrationAction): RegistrationState {
  switch (action.type) {
    case "SET_REGISTRATION_TYPE":
      return { ...state, registrationType: action.payload }

    case "SET_PRIMARY_ATTENDEE":
      return { ...state, primaryAttendee: action.payload }

    case "ADD_ATTENDEE":
      return { ...state, additionalAttendees: [...state.additionalAttendees, action.payload] }

    case "UPDATE_ATTENDEE": {
      const updatedAttendees = state.additionalAttendees.map((attendee) =>
        attendee.attendee.attendee.attendee.attendee_id === action.payload.id ? { ...attendee, ...action.payload.data } : attendee
      ) as Attendee[]
      
      // Also update primary attendee if it matches
      let updatedPrimaryAttendee = state.primaryAttendee
      if (state.primaryAttendee?.id === action.payload.id) {
        updatedPrimaryAttendee = { ...state.primaryAttendee, ...action.payload.data } as typeof state.primaryAttendee
      }
      
      return { 
        ...state, 
        additionalAttendees: updatedAttendees,
        primaryAttendee: updatedPrimaryAttendee
      }
    }

    case "REMOVE_ATTENDEE":
      return { 
        ...state, 
        additionalAttendees: state.additionalAttendees.filter((attendee) => attendee.attendee.attendee.attendee.attendee_id !== action.payload) 
      }

    case "ADD_PARTNER": {
      const { attendeeId, partner } = action.payload
      
      // Update primary attendee's partner if applicable
      if (state.primaryAttendee?.id === attendeeId && (state.primaryAttendee.type === "mason" || state.primaryAttendee.type === "guest")) {
        return {
          ...state,
          primaryAttendee: {
            ...state.primaryAttendee,
            hasPartner: true,
            partner,
          },
        }
      }
      
      // Update additional attendees' partners
      const updatedAttendees = state.additionalAttendees.map((attendee) => {
        if (attendee.attendee.attendee.attendee.attendee_id === attendeeId && (attendee.type === "mason" || attendee.type === "guest")) {
          return {
            ...attendee,
            hasPartner: true,
            partner,
          }
        }
        return attendee
      }) as Attendee[]
      
      return { ...state, additionalAttendees: updatedAttendees }
    }

    case "REMOVE_PARTNER": {
      // Remove partner from primary attendee
      if (state.primaryAttendee?.id === action.payload && (state.primaryAttendee.type === "mason" || state.primaryAttendee.type === "guest")) {
        return {
          ...state,
          primaryAttendee: {
            ...state.primaryAttendee,
            hasPartner: false,
            partner: undefined,
          },
        }
      }
      
      // Remove partner from additional attendees
      const updatedAttendees = state.additionalAttendees.map((attendee) => {
        if (attendee.attendee.attendee.attendee.attendee_id === action.payload && (attendee.type === "mason" || attendee.type === "guest")) {
          return {
            ...attendee,
            hasPartner: false,
            partner: undefined,
          }
        }
        return attendee
      }) as Attendee[]
      
      return { ...state, additionalAttendees: updatedAttendees }
    }

    case "ADD_TICKET":
      return { ...state, tickets: [...state.tickets, action.payload] }

    case "REMOVE_TICKET":
      return { ...state, tickets: state.tickets.filter((ticket) => ticket.ticket_id !== action.payload) }

    case "SET_PAYMENT_DETAILS":
      return { ...state, paymentDetails: action.payload }

    case "NEXT_STEP":
      return { ...state, currentStep: state.currentStep + 1 }

    case "PREV_STEP":
      return { ...state, currentStep: Math.max(0, state.currentStep - 1) }

    case "GO_TO_STEP":
      return { ...state, currentStep: action.payload }

    case "CLEAR_PRIMARY_ATTENDEE":
      return { ...state, primaryAttendee: null }

    case "RESET":
      return initialRegistrationState

    default:
      return state
  }
}