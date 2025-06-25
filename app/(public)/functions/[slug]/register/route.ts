import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { v4 as uuidv4 } from 'uuid';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = await createClient();
  
  // Get the function details
  const { data: functionData, error } = await supabase
    .from('functions')
    .select('function_id, name, slug, is_published')
    .eq('slug', slug)
    .eq('is_published', true)
    .single();

  if (error || !functionData) {
    // If function not found, redirect to functions page
    return NextResponse.redirect(new URL('/functions', request.url));
  }

  // Generate a unique registration ID that doesn't exist in the database
  let registrationId: string;
  let attempts = 0;
  const maxAttempts = 10; // Safety limit to prevent infinite loops
  
  do {
    registrationId = uuidv4();
    
    // Check if this UUID already exists in the registrations table
    const { data: existing, error } = await supabase
      .from('registrations')
      .select('registration_id')
      .eq('registration_id', registrationId)
      .single();
    
    // If no error and no data found, the UUID is unique
    if (error?.code === 'PGRST116') { // "no rows returned" error
      console.log(`[Register Route] Generated unique UUID: ${registrationId}`);
      break;
    }
    
    // If we found an existing registration, try again
    if (existing) {
      console.log(`[Register Route] UUID collision detected: ${registrationId}, regenerating...`);
      attempts++;
    }
  } while (attempts < maxAttempts);
  
  if (attempts >= maxAttempts) {
    console.error('[Register Route] Failed to generate unique UUID after maximum attempts');
    return NextResponse.redirect(new URL('/functions', request.url));
  }

  // Redirect to the registration wizard with the new registration ID
  return NextResponse.redirect(new URL(`/functions/${slug}/register/${registrationId}`, request.url));
}