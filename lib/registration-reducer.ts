import { v4 as uuidv4 } from "uuid"
import type { RegistrationState, RegistrationAction, MasonAttendee } from "./registration-types"

export const initialRegistrationState: RegistrationState = {
  registrationType: null,
  primaryAttendee: null,
  additionalAttendees: [],
  tickets: [],
  currentStep: 1,
  paymentDetails: null,
}

export function registrationReducer(state: RegistrationState, action: RegistrationAction): RegistrationState {
  switch (action.type) {
    case "SET_REGISTRATION_TYPE":
      return {
        ...state,
        registrationType: action.payload,
      }

    case "SET_PRIMARY_ATTENDEE": {
      const primaryAttendee: MasonAttendee = {
        ...action.payload,
        id: action.payload.id || uuidv4(),
      }
      return {
        ...state,
        primaryAttendee,
      }
    }

    case "ADD_ATTENDEE": {
      const newAttendee = {
        ...action.payload,
        id: action.payload.id || uuidv4(),
      }
      return {
        ...state,
        additionalAttendees: [...state.additionalAttendees, newAttendee],
      }
    }

    case "UPDATE_ATTENDEE": {
      const { id, data } = action.payload

      // Check if it's the primary attendee
      if (state.primaryAttendee && state.primaryAttendee.id === id) {
        return {
          ...state,
          primaryAttendee: {
            ...state.primaryAttendee,
            ...data,
          } as MasonAttendee,
        }
      }

      // Otherwise, update in additional attendees
      return {
        ...state,
        additionalAttendees: state.additionalAttendees.map((attendee) =>
          attendee.id === id ? { ...attendee, ...data } : attendee,
        ),
      }
    }

    case "REMOVE_ATTENDEE": {
      return {
        ...state,
        additionalAttendees: state.additionalAttendees.filter((attendee) => attendee.id !== action.payload),
        // Also remove any tickets associated with this attendee
        tickets: state.tickets.filter((ticket) => ticket.attendeeId !== action.payload),
      }
    }

    case "ADD_PARTNER": {
      const { attendeeId, partner } = action.payload
      const partnerWithId = {
        ...partner,
        id: partner.id || uuidv4(),
        relatedAttendeeId: attendeeId,
      }

      // Check if it's for the primary attendee
      if (state.primaryAttendee && state.primaryAttendee.id === attendeeId) {
        return {
          ...state,
          primaryAttendee: {
            ...state.primaryAttendee,
            hasPartner: true,
            partner: partnerWithId,
          } as MasonAttendee,
        }
      }

      // Otherwise, update in additional attendees
      return {
        ...state,
        additionalAttendees: state.additionalAttendees.map((attendee) =>
          attendee.id === attendeeId ? { ...attendee, hasPartner: true, partner: partnerWithId } : attendee,
        ),
      }
    }

    case "REMOVE_PARTNER": {
      const attendeeId = action.payload

      // Check if it's for the primary attendee
      if (state.primaryAttendee && state.primaryAttendee.id === attendeeId) {
        const { partner, ...rest } = state.primaryAttendee
        return {
          ...state,
          primaryAttendee: {
            ...rest,
            hasPartner: false,
          } as MasonAttendee,
        }
      }

      // Otherwise, update in additional attendees
      return {
        ...state,
        additionalAttendees: state.additionalAttendees.map((attendee) => {
          if (attendee.id === attendeeId) {
            const { partner, ...rest } = attendee
            return { ...rest, hasPartner: false }
          }
          return attendee
        }),
      }
    }

    case "ADD_TICKET": {
      const newTicket = {
        ...action.payload,
        id: action.payload.id || uuidv4(),
      }
      return {
        ...state,
        tickets: [...state.tickets, newTicket],
      }
    }

    case "REMOVE_TICKET": {
      return {
        ...state,
        tickets: state.tickets.filter((ticket) => ticket.id !== action.payload),
      }
    }

    case "SET_PAYMENT_DETAILS": {
      return {
        ...state,
        paymentDetails: action.payload,
      }
    }

    case "NEXT_STEP": {
      return {
        ...state,
        currentStep: state.currentStep + 1,
      }
    }

    case "PREV_STEP": {
      return {
        ...state,
        currentStep: Math.max(1, state.currentStep - 1),
      }
    }

    case "GO_TO_STEP": {
      return {
        ...state,
        currentStep: action.payload,
      }
    }

    case "RESET": {
      return initialRegistrationState
    }

    default:
      return state
  }
}
