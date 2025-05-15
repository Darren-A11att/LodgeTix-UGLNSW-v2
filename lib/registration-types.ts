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

export type ContactPreference = "" | "Directly" | "Primary Attendee" | "Provide Later" | "Mason/Guest"

export interface BaseAttendee {
  id: string
  firstName: string
  lastName: string
  dietaryRequirements?: string
  specialNeeds?: string
}

export interface MasonAttendee extends BaseAttendee {
  type: "mason"
  title: MasonicTitle
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
  contactPreference?: ContactPreference
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
  relatedAttendeeId?: string
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

// Legacy type to support components during migration
export type UnifiedAttendeeData = {
  id: string
  firstName: string
  lastName: string
  type: "mason" | "guest" | "partner"
  title?: string
  masonicTitle?: MasonicTitle
  mobile?: string
  email?: string
  primaryPhone?: string
  primaryEmail?: string
  contactPreference?: ContactPreference
  contactConfirmed?: boolean
  dietaryRequirements?: string
  specialNeeds?: string
  hasPartner?: boolean
  partner?: any
}

// Legacy type for MasonForm to reference during migration
export type MasonData = {
  title: string
  firstName: string
  lastName: string
  phone: string
  lodge: string
  dietary?: string
  attendeeType: string
  [key: string]: any
}

// Legacy type for LadyPartnerForm to reference during migration
export type OldLadyPartnerData = {
  id: string
  title: string
  firstName: string
  lastName: string
  relationship: string
  contactPreference: ContactPreference
  mobile?: string
  email?: string
  dietaryRequirements?: string
  specialNeeds?: string
  relatedAttendeeId: string
  [key: string]: any
}

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

// Define specific relationship options for partners
export const PARTNER_RELATIONSHIP_OPTIONS = ["Wife", "Partner", "Fiancée", "Husband", "Fiancé"] as const;
export type PartnerRelationship = typeof PARTNER_RELATIONSHIP_OPTIONS[number]; // Creates a union type: "Wife" | "Partner" | ...
