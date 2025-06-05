import { EmailType, RegistrationEmailData, AttendeeEmailData, EmailRequestPayload } from '../types/email.ts'

interface EmailRecipient {
  email: string
  name: string
}

export function getEmailSubject(type: EmailType, data: any): string {
  const functionName = data.functionDetails?.name || 'Event'
  
  switch (type) {
    case EmailType.INDIVIDUAL_CONFIRMATION:
      return `Registration Confirmed - ${functionName}`
    
    case EmailType.LODGE_CONFIRMATION:
      return `Lodge Registration Confirmed - ${functionName}`
    
    case EmailType.DELEGATION_CONFIRMATION:
      return `Delegation Registration Confirmed - ${functionName}`
    
    case EmailType.ATTENDEE_DIRECT_TICKET:
      return `Your Tickets - ${functionName}`
    
    case EmailType.PRIMARY_CONTACT_TICKET:
      return `Ticket Distribution Required - ${functionName}`
    
    default:
      return `Confirmation - ${functionName}`
  }
}

export async function determineRecipients(
  payload: EmailRequestPayload, 
  data: any
): Promise<EmailRecipient[]> {
  const recipients: EmailRecipient[] = []
  
  // Override recipient if specified
  if (payload.recipientEmail) {
    return [{
      email: payload.recipientEmail,
      name: 'Test Recipient'
    }]
  }
  
  switch (payload.type) {
    case EmailType.INDIVIDUAL_CONFIRMATION:
    case EmailType.LODGE_CONFIRMATION:
    case EmailType.DELEGATION_CONFIRMATION:
      // Send to customer
      if (data.customerDetails?.email) {
        recipients.push({
          email: data.customerDetails.email,
          name: `${data.customerDetails.firstName} ${data.customerDetails.lastName}`
        })
      }
      
      // Also send to booking contact if different
      if (data.bookingContact?.email && 
          data.bookingContact.email !== data.customerDetails?.email) {
        recipients.push({
          email: data.bookingContact.email,
          name: `${data.bookingContact.firstName} ${data.bookingContact.lastName}`
        })
      }
      break
    
    case EmailType.ATTENDEE_DIRECT_TICKET:
      // Send to attendees with direct contact preference
      const directAttendees = data.attendees?.filter(
        (a: AttendeeEmailData) => a.contactPreference === 'direct' && a.email
      ) || []
      
      directAttendees.forEach((attendee: AttendeeEmailData) => {
        recipients.push({
          email: attendee.email!,
          name: `${attendee.firstName} ${attendee.lastName}`
        })
      })
      break
    
    case EmailType.PRIMARY_CONTACT_TICKET:
      // Send summary of all attendees to primary contact
      if (data.bookingContact?.email) {
        recipients.push({
          email: data.bookingContact.email,
          name: `${data.bookingContact.firstName} ${data.bookingContact.lastName}`
        })
      } else if (data.customerDetails?.email) {
        recipients.push({
          email: data.customerDetails.email,
          name: `${data.customerDetails.firstName} ${data.customerDetails.lastName}`
        })
      }
      break
  }
  
  // Remove duplicates
  const uniqueRecipients = recipients.reduce((acc: EmailRecipient[], current) => {
    const exists = acc.find(r => r.email === current.email)
    if (!exists) {
      acc.push(current)
    }
    return acc
  }, [])
  
  return uniqueRecipients
}

export function shouldSendDirectTickets(attendees: AttendeeEmailData[]): boolean {
  return attendees.some(a => a.contactPreference === 'direct' && a.email)
}

export function shouldSendPrimaryContactSummary(attendees: AttendeeEmailData[]): boolean {
  return attendees.some(a => a.contactPreference === 'primary')
}

export function groupAttendeesByContact(attendees: AttendeeEmailData[]): {
  direct: AttendeeEmailData[]
  primary: AttendeeEmailData[]
} {
  return {
    direct: attendees.filter(a => a.contactPreference === 'direct'),
    primary: attendees.filter(a => a.contactPreference === 'primary')
  }
}