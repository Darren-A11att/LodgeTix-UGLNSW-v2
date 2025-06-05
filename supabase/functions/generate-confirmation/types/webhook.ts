export interface WebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE'
  table: string
  record: RegistrationRecord
  old_record?: RegistrationRecord
  schema: string
}

export interface RegistrationRecord {
  id: string
  status: 'pending' | 'completed' | 'cancelled'
  payment_status: 'pending' | 'completed' | 'failed'
  confirmation_number: string | null
  registration_type: 'individual' | 'lodge' | 'delegation'
  function_id: string
  customer_id: string
  total_amount: number
  stripe_payment_intent_id: string
  booking_contact_email?: string
  booking_contact_first_name?: string
  booking_contact_last_name?: string
  created_at: string
  updated_at: string
}

export interface GenerateConfirmationResponse {
  success: boolean
  confirmationNumber?: string
  emailsSent?: {
    confirmation: boolean
    directTickets: number
    primaryContact: boolean
  }
  errors?: string[]
}

export interface EmailInvocationResult {
  type: string
  success: boolean
  error?: string
}