import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase'; // Assuming we might use admin client later for other reasons, though not for anon sign-in itself
import { supabase } from '@/lib/supabase'; // For supabase.auth.signInAnonymously()

const TURNSTILE_SECRET_KEY = process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY;
const TURNSTILE_VERIFY_ENDPOINT = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export async function POST(request: Request) {
  if (!TURNSTILE_SECRET_KEY) {
    console.error('CRITICAL: CLOUDFLARE_TURNSTILE_SECRET_KEY is not set.');
    return NextResponse.json({ success: false, error: 'Server configuration error.' }, { status: 500 });
  }

  try {
    const requestBody = await request.json();
    const token = requestBody.token; // Expecting { token: "cf-turnstile-response-value" }
    const ip = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || request.ip;

    if (!token) {
      return NextResponse.json({ success: false, error: 'Turnstile token is missing.' }, { status: 400 });
    }

    console.log(`Verifying Turnstile token: ${token.substring(0, 20)}... with IP: ${ip}`);

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

    const outcome = await turnstileResponse.json();
    console.log('Turnstile verification outcome:', outcome);

    if (outcome.success) {
      // Turnstile verification successful, now try to sign in anonymously with Supabase
      console.log('Turnstile success. Attempting Supabase anonymous sign-in...');
      const { data: authData, error: authError } = await supabase.auth.signInAnonymously();

      if (authError) {
        console.error('Supabase anonymous sign-in error after Turnstile success:', authError);
        return NextResponse.json({ success: false, turnstileVerified: true, error: `Supabase auth error: ${authError.message}` }, { status: 500 });
      }

      if (authData.user && authData.session) {
        console.log('Supabase anonymous sign-in successful. User:', authData.user.id);
        // You could return the user session/JWT if needed by the client immediately,
        // but usually, the client Supabase SDK will pick up the session cookie.
        return NextResponse.json({
          success: true,
          turnstileVerified: true,
          anonymousAuthUser: {
            id: authData.user.id,
            aud: authData.user.aud,
            is_anonymous: authData.user.is_anonymous,
          },
          message: 'Turnstile verified and anonymous session initiated.',
        });
      } else {
        console.error('Supabase anonymous sign-in did not return user or session.');
        return NextResponse.json({ success: false, turnstileVerified: true, error: 'Supabase anonymous sign-in failed to return user/session.' }, { status: 500 });
      }

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
    return NextResponse.json({ success: false, error: error.message || 'An unexpected error occurred.' }, { status: 500 });
  }
} 