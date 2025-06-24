import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cancelSquarePayment } from '@/lib/utils/square-client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('[Payment Cancel API] Received request:', body);
    
    const { paymentId, registrationId, reason } = body;

    // Validate required fields
    if (!paymentId || !registrationId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create Supabase client
    const supabase = await createClient();

    // Cancel the Square payment
    console.log('[Payment Cancel API] Cancelling Square payment:', paymentId);
    const response = await cancelSquarePayment(paymentId);
    
    if (response.result.errors && response.result.errors.length > 0) {
      console.error('[Payment Cancel API] Payment cancellation failed:', response.result.errors);
      
      return NextResponse.json(
        { success: false, error: 'Payment cancellation failed', errors: response.result.errors },
        { status: 400 }
      );
    }

    // Update registration to cancelled status
    const { error: updateError } = await supabase
      .from('registrations')
      .update({
        payment_status: 'cancelled',
        status: 'cancelled',
        cancellation_reason: reason || 'Payment authorization cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('registration_id', registrationId);

    if (updateError) {
      console.error('[Payment Cancel API] Failed to update registration:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to update registration status' },
        { status: 500 }
      );
    }

    console.log('[Payment Cancel API] Payment cancelled successfully');
    
    return NextResponse.json({
      success: true,
      message: 'Payment cancelled successfully'
    });

  } catch (error: any) {
    console.error('[Payment Cancel API] Fatal error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}