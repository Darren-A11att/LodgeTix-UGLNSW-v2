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
   * Invoke the edge function to generate confirmation number
   */
  private async invokeConfirmationEdgeFunction(
    registrationId: string,
    registrationType: string,
    status: string,
    paymentStatus: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🚀 Invoking generate-confirmation edge function...');
      const supabase = createClient();
      
      // Invoke the edge function with the proper payload format
      const { data, error } = await supabase.functions.invoke('generate-confirmation', {
        body: {
          type: 'UPDATE',
          table: 'registrations',
          schema: 'public',
          record: {
            id: registrationId,
            registration_id: registrationId,
            registration_type: registrationType,
            status: status,
            payment_status: paymentStatus
          },
          old_record: {
            status: 'pending',
            payment_status: 'pending'
          }
        }
      });

      if (error) {
        console.error('❌ Edge function error:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Edge function response:', data);
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to invoke edge function:', error);
      return { success: false, error: 'Failed to invoke confirmation generation' };
    }
  }

  /**
   * Wait for confirmation number after successful payment
   */
  async waitForConfirmationNumber(
    registrationId: string
  ): Promise<PaymentCompletionResult> {
    console.log('⏳ Waiting for confirmation number generation...');
    
    const supabase = createClient();
    
    // First, get the registration details to invoke the edge function
    const { data: registration, error: fetchError } = await supabase
      .from('registrations')
      .select('registration_type, status, payment_status')
      .eq('registration_id', registrationId)
      .single();

    if (fetchError || !registration) {
      console.error('Error fetching registration:', fetchError);
      return {
        success: false,
        error: `Failed to fetch registration: ${fetchError?.message || 'Not found'}`
      };
    }

    // Invoke the edge function if payment is completed
    if (registration.status === 'completed' && registration.payment_status === 'completed') {
      const edgeResult = await this.invokeConfirmationEdgeFunction(
        registrationId,
        registration.registration_type,
        registration.status,
        registration.payment_status
      );

      if (!edgeResult.success) {
        console.error('Edge function invocation failed:', edgeResult.error);
        // Continue with polling anyway as the webhook might still trigger
      }
    }
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