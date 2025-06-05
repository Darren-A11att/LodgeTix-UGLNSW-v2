import { createClient } from '@supabase/supabase-js'
import { EmailInvocationResult } from '../types/webhook.ts'

interface AttendeePreferences {
  hasDirectContact: boolean
  hasPrimaryContact: boolean
  directContactCount: number
  primaryContactCount: number
}

export class EmailOrchestrator {
  constructor(private supabase: ReturnType<typeof createClient>) {}

  async orchestrateEmails(registrationId: string, registrationType: string): Promise<{
    confirmation: boolean
    directTickets: number
    primaryContact: boolean
    errors: string[]
  }> {
    const results = {
      confirmation: false,
      directTickets: 0,
      primaryContact: false,
      errors: [] as string[]
    }

    try {
      // 1. Send main confirmation email
      const confirmationResult = await this.invokeEmailFunction({
        type: this.getConfirmationEmailType(registrationType),
        registrationId
      })

      if (confirmationResult.success) {
        results.confirmation = true
      } else {
        results.errors.push(`Confirmation email failed: ${confirmationResult.error}`)
      }

      // 2. Check attendee preferences
      const preferences = await this.getAttendeePreferences(registrationId)

      // 3. Send direct contact emails if needed
      if (preferences.hasDirectContact) {
        const directResult = await this.invokeEmailFunction({
          type: 'ATTENDEE_DIRECT_TICKET',
          registrationId
        })

        if (directResult.success) {
          results.directTickets = preferences.directContactCount
        } else {
          results.errors.push(`Direct ticket emails failed: ${directResult.error}`)
        }
      }

      // 4. Send primary contact summary if needed
      if (preferences.hasPrimaryContact) {
        const primaryResult = await this.invokeEmailFunction({
          type: 'PRIMARY_CONTACT_TICKET',
          registrationId
        })

        if (primaryResult.success) {
          results.primaryContact = true
        } else {
          results.errors.push(`Primary contact email failed: ${primaryResult.error}`)
        }
      }

    } catch (error) {
      console.error('Email orchestration error:', error)
      results.errors.push(`Orchestration error: ${error.message}`)
    }

    return results
  }

  private async getAttendeePreferences(registrationId: string): Promise<AttendeePreferences> {
    const { data: attendees } = await this.supabase
      .from('attendees')
      .select('contact_preference, email')
      .eq('registration_id', registrationId)

    const directContacts = attendees?.filter(
      a => a.contact_preference === 'direct' && a.email
    ) || []
    
    const primaryContacts = attendees?.filter(
      a => a.contact_preference === 'primary'
    ) || []

    return {
      hasDirectContact: directContacts.length > 0,
      hasPrimaryContact: primaryContacts.length > 0,
      directContactCount: directContacts.length,
      primaryContactCount: primaryContacts.length
    }
  }

  private getConfirmationEmailType(registrationType: string): string {
    switch (registrationType) {
      case 'lodge':
        return 'LODGE_CONFIRMATION'
      case 'delegation':
        return 'DELEGATION_CONFIRMATION'
      default:
        return 'INDIVIDUAL_CONFIRMATION'
    }
  }

  private async invokeEmailFunction(payload: {
    type: string
    registrationId: string
  }): Promise<EmailInvocationResult> {
    try {
      const { data, error } = await this.supabase.functions.invoke(
        'send-confirmation-email',
        { body: payload }
      )

      if (error) {
        return {
          type: payload.type,
          success: false,
          error: error.message
        }
      }

      return {
        type: payload.type,
        success: data?.success || false,
        error: data?.error
      }
    } catch (error) {
      return {
        type: payload.type,
        success: false,
        error: error.message
      }
    }
  }
}