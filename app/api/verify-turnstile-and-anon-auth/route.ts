import { NextResponse } from 'next/server';
import { getServerClient } from '@/lib/supabase-unified';

const TURNSTILE_SECRET_KEY = process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY;
const TURNSTILE_VERIFY_ENDPOINT = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export async function POST(request: Request) {
  console.log('🔧 API: verify-turnstile-and-anon-auth called');
  
  if (!TURNSTILE_SECRET_KEY) {
    console.error('CRITICAL: CLOUDFLARE_TURNSTILE_SECRET_KEY is not set.');
    return NextResponse.json({ 
      success: false, 
      error: 'Server configuration error.',
      auth: null 
    }, { status: 500 });
  }

  try {
    console.log('🔧 API: Parsing request body...');
    const requestBody = await request.json();
    console.log('🔧 API: Request body parsed:', requestBody);
    
    const token = requestBody.token; // Expecting { token: "cf-turnstile-response-value" }
    const ip = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || request.ip;

    if (!token) {
      console.log('🔧 API: No token provided');
      return NextResponse.json({ 
        success: false, 
        error: 'Turnstile token is missing.',
        auth: null 
      }, { status: 400 });
    }

    console.log(`🔧 API: Verifying Turnstile token: ${token.substring(0, 20)}... with IP: ${ip}`);

    // Handle demo token for localhost development
    const isDemoToken = token === 'XXXX.DUMMY.TOKEN.XXXX';
    const isLocalhost = process.env.NODE_ENV === 'development';

    let outcome;
    if (isDemoToken && isLocalhost) {
      console.log('🔧 Development: Demo token detected, bypassing Cloudflare verification');
      outcome = { success: true };
    } else {
      const formData = new FormData();
      formData.append('secret', TURNSTILE_SECRET_KEY);
      formData.append('response', token);
      if (ip) {
        formData.append('remoteip', ip);
      }

      const turnstileResponse = await fetch(TURNSTILE_VERIFY_ENDPOINT, {
        method: 'POST',
        body: formData,
      });

      outcome = await turnstileResponse.json();
      console.log('Turnstile verification outcome:', outcome);
    }

    if (outcome.success) {
      // Turnstile verification successful, now try to sign in anonymously with Supabase
      console.log('🔧 API: Turnstile success. Attempting Supabase anonymous sign-in...');
      
      try {
        const { data: authData, error: authError } = await getServerClient().auth.signInAnonymously();
        console.log('🔧 API: Supabase auth response:', { authData, authError });

        if (authError) {
          console.error('🔧 API: Supabase anonymous sign-in error after Turnstile success:', authError);
          return NextResponse.json({ 
            success: false, 
            turnstileVerified: true, 
            error: `Supabase auth error: ${authError.message}`,
            auth: null 
          }, { status: 500 });
        }

        if (authData.user && authData.session) {
        console.log('Supabase anonymous sign-in successful. User:', authData.user.id);
        return NextResponse.json({
          success: true,
          turnstileVerified: true,
          anonymousAuthUser: {
            id: authData.user.id,
            aud: authData.user.aud,
            is_anonymous: authData.user.is_anonymous,
          },
          auth: {
            verified: true,
            userId: authData.user.id
          },
          message: 'Turnstile verified and anonymous session initiated.',
        });
        } else {
          console.error('🔧 API: Supabase anonymous sign-in did not return user or session.');
          return NextResponse.json({ 
            success: false, 
            turnstileVerified: true, 
            error: 'Supabase anonymous sign-in failed to return user/session.',
            auth: null 
          }, { status: 500 });
        }
      } catch (supabaseError: any) {
        console.error('🔧 API: Exception during Supabase auth:', supabaseError);
        return NextResponse.json({ 
          success: false, 
          turnstileVerified: true, 
          error: `Auth service error: ${supabaseError.message}`,
          auth: null 
        }, { status: 500 });
      }

    } else {
      console.warn('Turnstile verification failed.', outcome['error-codes']);
      return NextResponse.json(
        { 
          success: false, 
          turnstileVerified: false, 
          error: 'Turnstile verification failed.', 
          errorCodes: outcome['error-codes'],
          auth: null
        },
        { status: 403 } // Forbidden
      );
    }
  } catch (error: any) {
    console.error('Error in verify-turnstile-and-anon-auth API route:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'An unexpected error occurred.',
      auth: null
    }, { status: 500 });
  }
} 