// Registration Types
export type RegistrationType = "myself-others" | "lodge" | "delegation"

export type MasonicTitle = "Bro" | "W Bro" | "VW Bro" | "RW Bro" | "MW Bro"
export type MasonicRank = "EAF" | "FCF" | "MM" | "IM" | "GL"
export type GrandOfficerStatus = "Past" | "Present"
export type PresentGrandOfficerRole =
  | "Grand Master"
  | "Deputy Grand Master"
  | "Assistant Grand Master"
  | "Grand Secretary"
  | "Grand Director of Ceremonies"
  | "Other"

export type ContactPreference = "Directly" | "Primary Attendee" | "Provide Later" | "Mason/Guest"

export interface BaseAttendee {
  id: string
  firstName: string
  lastName: string
  dietaryRequirements?: string
  specialNeeds?: string
}

export interface MasonAttendee extends BaseAttendee {
  type: "mason"
  masonicTitle: MasonicTitle
  rank: MasonicRank
  grandRank?: string
  grandOfficerStatus?: GrandOfficerStatus
  presentGrandOfficerRole?: PresentGrandOfficerRole
  otherGrandOfficerRole?: string
  grandLodge: string
  lodgeName: string
  lodgeNumber?: string
  mobile: string
  email: string
  sameLodgeAsPrimary?: boolean
  hasPartner: boolean
  partner?: PartnerAttendee
  isPrimaryAttendee?: boolean
}

export interface GuestAttendee extends BaseAttendee {
  type: "guest"
  title: string
  contactPreference: ContactPreference
  mobile?: string
  email?: string
  hasPartner: boolean
  partner?: PartnerAttendee
}

export interface PartnerAttendee extends BaseAttendee {
  type: "partner"
  relationship: string
  title: string
  contactPreference: ContactPreference
  mobile?: string
  email?: string
  relatedAttendeeId: string
}

export type Attendee = MasonAttendee | GuestAttendee | PartnerAttendee

export interface Ticket {
  id: string
  name: string
  price: number
  description: string
  attendeeId: string
  isPackage?: boolean
  includedTicketTypes?: string[]
}

export interface RegistrationState {
  registrationType: RegistrationType | null
  primaryAttendee: MasonAttendee | null
  additionalAttendees: Attendee[]
  tickets: Ticket[]
  currentStep: number
  paymentDetails: {
    cardName: string
    cardNumber: string
    expiryDate: string
    cvc: string
  } | null
}

export type RegistrationAction =
  | { type: "SET_REGISTRATION_TYPE"; payload: RegistrationType }
  | { type: "SET_PRIMARY_ATTENDEE"; payload: MasonAttendee }
  | { type: "ADD_ATTENDEE"; payload: Attendee }
  | { type: "UPDATE_ATTENDEE"; payload: { id: string; data: Partial<Attendee> } }
  | { type: "REMOVE_ATTENDEE"; payload: string }
  | { type: "ADD_PARTNER"; payload: { attendeeId: string; partner: PartnerAttendee } }
  | { type: "REMOVE_PARTNER"; payload: string }
  | { type: "ADD_TICKET"; payload: Ticket }
  | { type: "REMOVE_TICKET"; payload: string }
  | { type: "SET_PAYMENT_DETAILS"; payload: RegistrationState["paymentDetails"] }
  | { type: "NEXT_STEP" }
  | { type: "PREV_STEP" }
  | { type: "GO_TO_STEP"; payload: number }
  | { type: "CLEAR_PRIMARY_ATTENDEE" }
  | { type: "RESET" }
