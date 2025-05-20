// Placeholder types for registration components
export interface AttendeeFormData {
  id: string
  type: 'mason' | 'guest' | 'partner'
  firstName: string
  lastName: string
  email: string
  phone: string
  // Add other fields as needed
}

export interface TicketSelection {
  id: string
  ticketTypeId: string
  attendeeId: string
  quantity: number
  // Add other fields as needed
}