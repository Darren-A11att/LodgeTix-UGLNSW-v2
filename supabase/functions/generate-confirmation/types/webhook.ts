export interface WebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE'
  table: string
  record: RegistrationRecord
  old_record?: RegistrationRecord
  schema: string
}

export interface RegistrationRecord {
  id: string
  registration_id?: string // Support both id and registration_id for compatibility
  status: 'pending' | 'completed' | 'cancelled'
  payment_status: 'pending' | 'completed' | 'failed'
  confirmation_number: string | null
  registration_type: 'individual' | 'lodge' | 'delegation' | 'individuals' // Support both formats
  function_id: string
  customer_id: string
  created_at: string
  updated_at: string
}

export interface GenerateConfirmationResponse {
  success: boolean
  confirmationNumber?: string
  message?: string
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