import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { syncEventToStripeProduct, syncEventTickets } from '@/lib/services/stripe-sync-service';

export async function POST(request: Request) {
  try {
    const { eventId } = await request.json();
    
    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }
    
    const supabase = await createClient();
    
    // Get event with organization data
    const { data: event, error } = await supabase
      .from('events')
      .select(`
        *,
        organisations!events_organiser_id_fkey(
          organisation_id,
          name,
          stripe_onbehalfof
        )
      `)
      .eq('event_id', eventId)
      .single();
      
    if (error || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }
    
    if (!event.organisations?.stripe_onbehalfof) {
      return NextResponse.json({ 
        error: 'Organization does not have Stripe Connect enabled' 
      }, { status: 400 });
    }
    
    const connectedAccountId = event.organisations.stripe_onbehalfof;
    
    // Sync event to Stripe product
    const productId = await syncEventToStripeProduct(event, connectedAccountId);
    
    if (!productId) {
      return NextResponse.json({ 
        error: 'Failed to sync event to Stripe' 
      }, { status: 500 });
    }
    
    // Sync all tickets
    await syncEventTickets(eventId, connectedAccountId);
    
    return NextResponse.json({
      success: true,
      productId,
      message: 'Event and tickets synced to Stripe successfully'
    });
    
  } catch (error: any) {
    console.error('Error in sync-event endpoint:', error);
    return NextResponse.json({
      error: error.message || 'Failed to sync event to Stripe'
    }, { status: 500 });
  }
}