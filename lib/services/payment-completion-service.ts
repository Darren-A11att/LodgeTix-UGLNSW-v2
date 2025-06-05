import { createClient } from '@/utils/supabase/client';

export interface PaymentCompletionResult {
  success: boolean;
  confirmationNumber?: string;
  registrationType?: 'individuals' | 'lodge' | 'delegation';
  error?: string;
}

/**
 * Service to handle post-payment completion tasks
 * Waits for Edge Function to generate confirmation number
 */
export class PaymentCompletionService {
  private maxAttempts = 30; // 30 seconds timeout
  private pollingInterval = 1000; // 1 second

  /**
   * Wait for confirmation number after successful payment
   */
  async waitForConfirmationNumber(
    registrationId: string
  ): Promise<PaymentCompletionResult> {
    console.log('⏳ Waiting for confirmation number generation...');
    
    const supabase = createClient();
    let attempts = 0;

    while (attempts < this.maxAttempts) {
      try {
        const { data, error } = await supabase
          .from('registrations')
          .select('confirmation_number, status, payment_status, registration_type')
          .eq('registration_id', registrationId)
          .single();

        if (error) {
          console.error('Error checking registration:', error);
          return {
            success: false,
            error: `Failed to check registration status: ${error.message}`
          };
        }

        // Check if confirmation number is generated
        if (data?.confirmation_number) {
          console.log('✅ Confirmation number received:', data.confirmation_number);
          console.log('📋 Registration type:', data.registration_type);
          return {
            success: true,
            confirmationNumber: data.confirmation_number,
            registrationType: data.registration_type as 'individuals' | 'lodge' | 'delegation'
          };
        }

        // Check if payment failed
        if (data?.payment_status === 'failed' || data?.status === 'failed') {
          return {
            success: false,
            error: 'Payment failed'
          };
        }

        console.log(`⏳ Attempt ${attempts + 1}/${this.maxAttempts} - Waiting for confirmation number...`);
        
        // Wait before next attempt
        await new Promise(resolve => setTimeout(resolve, this.pollingInterval));
        attempts++;

      } catch (error) {
        console.error('Unexpected error:', error);
        return {
          success: false,
          error: 'Unexpected error while waiting for confirmation'
        };
      }
    }

    // Timeout reached
    console.error('❌ Timeout waiting for confirmation number');
    return {
      success: false,
      error: 'Timeout waiting for confirmation number. Please check your email for confirmation details.'
    };
  }

  /**
   * Subscribe to real-time updates for confirmation number
   * Alternative to polling - uses Supabase realtime
   */
  async subscribeToConfirmationNumber(
    registrationId: string,
    onConfirmation: (confirmationNumber: string, registrationType?: string) => void,
    onError: (error: string) => void
  ): Promise<() => void> {
    const supabase = createClient();
    
    // First check if confirmation number already exists
    const { data: existing } = await supabase
      .from('registrations')
      .select('confirmation_number, registration_type')
      .eq('registration_id', registrationId)
      .single();

    if (existing?.confirmation_number) {
      onConfirmation(existing.confirmation_number, existing.registration_type);
      return () => {}; // No-op cleanup
    }

    // Subscribe to changes
    const subscription = supabase
      .channel(`registration-${registrationId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'registrations',
          filter: `registration_id=eq.${registrationId}`
        },
        (payload) => {
          console.log('📡 Registration update received:', payload);
          
          if (payload.new.confirmation_number) {
            onConfirmation(payload.new.confirmation_number, payload.new.registration_type);
          } else if (payload.new.payment_status === 'failed') {
            onError('Payment failed');
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Subscription status:', status);
      });

    // Return cleanup function
    return () => {
      console.log('🔌 Unsubscribing from registration updates');
      subscription.unsubscribe();
    };
  }
}

// Singleton instance
let paymentCompletionService: PaymentCompletionService | null = null;

export function getPaymentCompletionService(): PaymentCompletionService {
  if (!paymentCompletionService) {
    paymentCompletionService = new PaymentCompletionService();
  }
  return paymentCompletionService;
}