import { NextResponse } from 'next/server';

const TURNSTILE_SECRET_KEY = process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY;
const TURNSTILE_VERIFY_ENDPOINT = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export async function POST(request: Request) {
  console.log('🔧 API: verify-turnstile called');
  
  if (!TURNSTILE_SECRET_KEY) {
    console.error('CRITICAL: CLOUDFLARE_TURNSTILE_SECRET_KEY is not set.');
    return NextResponse.json({ 
      success: false, 
      error: 'Server configuration error.'
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
        error: 'Turnstile token is missing.'
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
      // Turnstile verification successful
      console.log('🔧 API: Turnstile verification successful');
      
      return NextResponse.json({
        success: true,
        turnstileVerified: true,
        message: 'Turnstile verification successful. Client can now create anonymous session.',
      });
    } else {
      console.warn('Turnstile verification failed.', outcome['error-codes']);
      return NextResponse.json(
        { 
          success: false, 
          turnstileVerified: false, 
          error: 'Turnstile verification failed.', 
          errorCodes: outcome['error-codes']
        },
        { status: 403 } // Forbidden
      );
    }
  } catch (error: any) {
    console.error('Error in verify-turnstile-and-anon-auth API route:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'An unexpected error occurred.'
    }, { status: 500 });
  }
} 