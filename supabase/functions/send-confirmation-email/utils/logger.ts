interface LogEvent {
  registrationId: string
  emailType: string
  recipientEmail?: string
  status: 'pending' | 'sent' | 'failed'
  errorMessage?: string
  resendId?: string
  metadata?: Record<string, any>
}

export async function logEmailEvent(supabase: any, event: LogEvent): Promise<void> {
  try {
    // Log to console for debugging
    console.log(`Email event: ${event.status}`, {
      registrationId: event.registrationId,
      type: event.emailType,
      recipient: event.recipientEmail,
      error: event.errorMessage
    })
    
    // Could also log to a database table for tracking
    // This would require creating an email_logs table
    /*
    const { error } = await supabase
      .from('email_logs')
      .insert({
        registration_id: event.registrationId,
        email_type: event.emailType,
        recipient_email: event.recipientEmail,
        status: event.status,
        error_message: event.errorMessage,
        resend_id: event.resendId,
        metadata: event.metadata,
        created_at: new Date().toISOString()
      })
    
    if (error) {
      console.error('Failed to log email event:', error)
    }
    */
  } catch (error) {
    console.error('Error in email logging:', error)
  }
}