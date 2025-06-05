// Database types would be imported here if needed
// import { Database } from '../../../shared/types/database.ts'

export enum EmailType {
  INDIVIDUAL_CONFIRMATION = 'INDIVIDUAL_CONFIRMATION',
  LODGE_CONFIRMATION = 'LODGE_CONFIRMATION',
  DELEGATION_CONFIRMATION = 'DELEGATION_CONFIRMATION',
  ATTENDEE_DIRECT_TICKET = 'ATTENDEE_DIRECT_TICKET',
  PRIMARY_CONTACT_TICKET = 'PRIMARY_CONTACT_TICKET'
}

export interface RegistrationEmailData {
  registrationId: string
  confirmationNumber: string
  registrationType: 'individual' | 'lodge' | 'delegation'
  functionDetails: {
    id: string
    name: string
    slug: string
    dateRange: string
    location: string
    venueName: string
  }
  customerDetails: {
    id: string
    email: string
    firstName: string
    lastName: string
    phone?: string
  }
  bookingContact?: {
    firstName: string
    lastName: string
    email: string
    phone: string
    role?: string
  }
  paymentDetails: {
    totalAmount: number
    stripeFee: number
    subtotal: number
    paymentIntentId: string
    receiptUrl?: string
  }
  confirmationPdfUrl?: string
}

export interface AttendeeEmailData {
  id: string
  customerId: string
  title: string
  firstName: string
  lastName: string
  email?: string
  phone?: string
  attendeeType: 'mason' | 'guest'
  dietaryRequirements?: string
  accessibilityRequirements?: string
  contactPreference: 'primary' | 'direct'
  tickets: TicketEmailData[]
  partner?: {
    title: string
    firstName: string
    lastName: string
    relationship: string
  }
}

export interface TicketEmailData {
  id: string
  eventName: string
  eventDate: string
  eventTime: string
  venueName: string
  venueAddress: string
  ticketType: string
  qrCodeUrl: string
  seatNumber?: string
  tableNumber?: string
}

export interface LodgeEmailData extends RegistrationEmailData {
  lodgeDetails: {
    id: string
    name: string
    number: string
    grandLodge: string
  }
  packageDetails: {
    id: string
    name: string
    description: string
    attendeeCount: number
    pricePerPerson: number
    totalPrice: number
  }
  attendees: AttendeeEmailData[]
}

export interface EmailRequestPayload {
  type: EmailType
  registrationId: string
  recipientEmail?: string // Optional override for specific recipient
  testMode?: boolean
}

export interface EmailMetadata {
  id: string
  registrationId: string
  emailType: EmailType
  recipientEmail: string
  sentAt: string
  status: 'pending' | 'sent' | 'failed'
  errorMessage?: string
  resendId?: string
  opened?: boolean
  openedAt?: string
}

export interface EmailResponse {
  success: boolean
  emailId?: string
  error?: string
}