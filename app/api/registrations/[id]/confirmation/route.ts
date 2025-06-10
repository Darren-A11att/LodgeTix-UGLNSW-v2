/**
 * Confirmation Number Polling Endpoint
 * GET /api/registrations/[id]/confirmation
 * 
 * This endpoint polls for a confirmation number after payment completion.
 * It handles all registration types and returns appropriate confirmation data.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.group('🔍 Polling for Confirmation Number');
    
    const registrationId = params.id;
    const maxAttempts = 10;
    const delayMs = 500;
    
    if (!registrationId) {
      console.error('Missing registration ID');
      console.groupEnd();
      return NextResponse.json(
        { error: 'Registration ID is required' },
        { status: 400 }
      );
    }
    
    // Validate registration ID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(registrationId)) {
      console.error(`Invalid registration ID format: ${registrationId}`);
      console.groupEnd();
      return NextResponse.json(
        { error: 'Invalid registration ID format' },
        { status: 400 }
      );
    }
    
    const supabase = await createClient();
    
    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('Authentication failed:', authError);
      console.groupEnd();
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Poll for confirmation number
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      console.log(`Poll attempt ${attempt + 1}/${maxAttempts}`);
      
      // Query registration table directly
      const { data, error } = await supabase
        .from('registrations')
        .select('confirmation_number, registration_type, auth_user_id')
        .eq('registration_id', registrationId)
        .single();
      
      if (error) {
        console.error('Error fetching registration:', error);
        console.groupEnd();
        return NextResponse.json(
          { error: 'Registration not found' },
          { status: 404 }
        );
      }
      
      // Verify user owns this registration
      if (data.auth_user_id !== user.id) {
        console.error('User does not own this registration');
        console.groupEnd();
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 403 }
        );
      }
      
      if (data?.confirmation_number) {
        // Confirmation number generated successfully
        console.log(`Confirmation number found: ${data.confirmation_number}`);
        console.groupEnd();
        
        return NextResponse.json({
          confirmationNumber: data.confirmation_number,
          registrationType: data.registration_type
        });
      }
      
      // Wait before next attempt (except on last attempt)
      if (attempt < maxAttempts - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
    
    // Timeout - confirmation number not generated in time
    console.error(`Confirmation number generation timeout for ${registrationId}`);
    console.groupEnd();
    
    // Fallback: Generate a temporary confirmation number
    const fallbackConfirmation = `TEMP-${registrationId.substring(0, 8).toUpperCase()}`;
    
    return NextResponse.json({
      confirmationNumber: fallbackConfirmation,
      isTemporary: true,
      message: 'Confirmation number generation delayed. Check your email for the official confirmation.'
    });
    
  } catch (error: any) {
    console.error('Error in confirmation polling:', error);
    console.groupEnd();
    
    return NextResponse.json(
      { error: 'Failed to retrieve confirmation number' },
      { status: 500 }
    );
  }
}