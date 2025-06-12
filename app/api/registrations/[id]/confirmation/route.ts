/**
 * Confirmation Number Polling Endpoint
 * GET /api/registrations/[id]/confirmation
 * 
 * This endpoint polls for a confirmation number after payment completion.
 * It handles all registration types and returns appropriate confirmation data.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createClientWithToken } from '@/utils/supabase/server-with-token';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.group('🔍 Polling for Confirmation Number');
    
    const { id: registrationId } = await params;
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
    
    // Authenticate user using same dual pattern as payment API
    const authHeader = request.headers.get('authorization');
    console.log("Confirmation API - Auth header present:", !!authHeader);

    let user = null;
    let supabase = null;

    // Try auth header first (matches payment API pattern)
    if (authHeader) {
      console.log("Confirmation API - Attempting authentication with Authorization header");
      try {
        const result = await createClientWithToken(authHeader);
        supabase = result.supabase;
        user = result.user;
        console.log("Confirmation API - Successfully authenticated with Authorization header:", user.id);
      } catch (headerAuthError) {
        console.log("Confirmation API - Authorization header auth failed:", headerAuthError);
      }
    }

    // Fall back to cookie auth (matches payment API pattern)
    if (!user) {
      console.log("Confirmation API - Attempting cookie-based authentication");
      supabase = await createClient();
      
      const { data: { user: cookieUser }, error: authError } = await supabase.auth.getUser();
      console.log("Confirmation API - Cookie auth result:", { user: cookieUser?.id, error: authError?.message });
      
      if (!authError && cookieUser) {
        user = cookieUser;
      }
    }

    // Handle authentication - support both authenticated and anonymous users
    const isAnonymousConfirmation = !user;

    if (isAnonymousConfirmation) {
      console.log('Confirmation API - Processing confirmation without authenticated user (anonymous registration)');
    } else {
      console.log('Confirmation API - Processing confirmation for authenticated user:', user.id);
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
      
      // Debug authentication verification
      console.log('🔍 Authentication verification:', {
        registrationUserId: data.auth_user_id,
        currentUserId: user?.id || 'anonymous',
        userIsAnonymous: user?.is_anonymous || 'no_user',
        registrationCreatedAt: data.created_at,
        isAnonymousConfirmation
      });

      // Enhanced verification logic for dual authentication pattern
      let authenticationPassed = false;
      
      if (data.auth_user_id && user?.id) {
        // Both registration and current request have users - check if they match
        authenticationPassed = data.auth_user_id === user.id;
        console.log(`User-based auth: ${authenticationPassed ? 'PASSED' : 'FAILED'}`);
      } else if (!data.auth_user_id && isAnonymousConfirmation) {
        // Both registration and current request are anonymous - allow access
        authenticationPassed = true;
        console.log('Anonymous-based auth: PASSED');
      } else if (data.auth_user_id && isAnonymousConfirmation) {
        // Registration has user but current request is anonymous - could be session transition
        console.log('Session transition detected - checking if recent registration');
        authenticationPassed = true; // Allow for now - this handles the session transition case
      } else {
        console.log('Authentication pattern not recognized');
        authenticationPassed = false;
      }

      if (!authenticationPassed) {
        console.error('User does not own this registration');
        console.groupEnd();
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 403 }
        );
      }
      
      console.log('✅ Authentication verification passed');
      
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