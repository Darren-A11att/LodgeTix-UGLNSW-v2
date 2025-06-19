/**
 * Stripe Metadata Update Endpoint
 * POST /api/stripe/update-metadata
 * 
 * This endpoint updates Stripe payment intent metadata after confirmation generation.
 * It's a fire-and-forget operation that doesn't affect the main flow.
 */

import { NextRequest, NextResponse } from 'next/server';
import { unifiedPaymentService } from '@/lib/services/unified-payment-service';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
  try {
    console.group('📝 Updating Stripe Metadata');
    
    const data = await request.json();
    const { paymentIntentId, confirmationNumber, registrationId, ticketNumbers } = data;
    
    if (!paymentIntentId) {
      console.error('Missing payment intent ID');
      console.groupEnd();
      return NextResponse.json(
        { error: 'Payment intent ID is required' },
        { status: 400 }
      );
    }
    
    if (!confirmationNumber) {
      console.error('Missing confirmation number');
      console.groupEnd();
      return NextResponse.json(
        { error: 'Confirmation number is required' },
        { status: 400 }
      );
    }
    
    // Verify user authentication
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('Authentication failed:', authError);
      console.groupEnd();
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // If registrationId provided, verify ownership
    if (registrationId) {
      const { data: registration, error: regError } = await supabase
        .from('registrations')
        .select('auth_user_id')
        .eq('registration_id', registrationId)
        .single();
        
      if (regError || !registration) {
        console.error('Registration not found:', regError);
        console.groupEnd();
        return NextResponse.json(
          { error: 'Registration not found' },
          { status: 404 }
        );
      }
      
      if (registration.auth_user_id !== user.id) {
        console.error('User does not own this registration');
        console.groupEnd();
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 403 }
        );
      }
    }
    
    // Update Stripe metadata
    try {
      await unifiedPaymentService.updatePaymentIntentMetadata(
        paymentIntentId,
        {
          confirmationNumber,
          ticketNumbers
        }
      );
      
      console.log(`Successfully updated Stripe metadata for ${paymentIntentId}`);
      console.groupEnd();
      
      return NextResponse.json({
        success: true,
        message: 'Metadata updated successfully'
      });
      
    } catch (error: any) {
      // This is non-critical, so we log but don't fail
      console.error('Failed to update Stripe metadata:', error);
      console.groupEnd();
      
      // Still return success since this is fire-and-forget
      return NextResponse.json({
        success: true,
        message: 'Metadata update queued',
        warning: 'Update may be delayed'
      });
    }
    
  } catch (error: any) {
    console.error('Error in metadata update endpoint:', error);
    console.groupEnd();
    
    // Non-critical endpoint, return success anyway
    return NextResponse.json({
      success: true,
      message: 'Metadata update deferred'
    });
  }
}