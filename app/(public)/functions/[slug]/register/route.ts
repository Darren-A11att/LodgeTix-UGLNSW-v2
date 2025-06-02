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

  // Generate a new registration ID - the wizard will create the actual record
  const registrationId = uuidv4();

  // Redirect to the registration wizard with the new registration ID
  return NextResponse.redirect(new URL(`/functions/${slug}/register/${registrationId}`, request.url));
}