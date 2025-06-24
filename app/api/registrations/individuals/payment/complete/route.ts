import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { completeSquarePayment } from '@/lib/utils/square-client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('[Payment Complete API] Received request:', body);
    
    const { paymentId, registrationId } = body;

    // Validate required fields
    if (!paymentId || !registrationId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create Supabase client
    const supabase = await createClient();

    // Complete the Square payment
    console.log('[Payment Complete API] Completing Square payment:', paymentId);
    const response = await completeSquarePayment(paymentId);
    
    if (!response.result.payment) {
      console.error('[Payment Complete API] Payment completion failed:', response.errors);
      
      // Update registration to failed status
      await supabase
        .from('registrations')
        .update({
          payment_status: 'failed',
          status: 'failed',
          updated_at: new Date().toISOString()
        })
        .eq('registration_id', registrationId);
      
      return NextResponse.json(
        { success: false, error: 'Payment completion failed' },
        { status: 400 }
      );
    }

    const payment = response.result.payment;
    console.log('[Payment Complete API] Payment status after completion:', payment.status);

    if (payment.status === 'COMPLETED') {
      // Update registration to completed
      const { error: updateError } = await supabase
        .from('registrations')
        .update({
          payment_status: 'completed',
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('registration_id', registrationId);

      if (updateError) {
        console.error('[Payment Complete API] Failed to update registration:', updateError);
        return NextResponse.json(
          { success: false, error: 'Failed to update registration status' },
          { status: 500 }
        );
      }

      // Trigger confirmation email by calling the edge function
      console.log('[Payment Complete API] Triggering confirmation email...');
      const { error: emailError } = await supabase.functions.invoke('send-confirmation-email', {
        body: {
          registrationId,
          type: 'individual'
        }
      });

      if (emailError) {
        console.error('[Payment Complete API] Failed to send confirmation email:', emailError);
        // Don't fail the payment completion if email fails
      }

      return NextResponse.json({
        success: true,
        paymentId: payment.id,
        status: 'completed',
        message: 'Payment completed successfully'
      });
    } else {
      // Payment completion didn't result in COMPLETED status
      await supabase
        .from('registrations')
        .update({
          payment_status: 'failed',
          status: 'failed',
          updated_at: new Date().toISOString()
        })
        .eq('registration_id', registrationId);

      return NextResponse.json(
        { 
          success: false, 
          error: 'Payment completion resulted in unexpected status',
          status: payment.status 
        },
        { status: 400 }
      );
    }

  } catch (error: any) {
    console.error('[Payment Complete API] Fatal error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}