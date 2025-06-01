import Stripe from 'stripe';
import { createClient } from '@/utils/supabase/server';
import { 
  buildProductMetadata, 
  buildPriceMetadata,
  buildCustomerMetadata,
  CustomerMetadataParams 
} from '@/lib/utils/stripe-metadata';
import type { Database } from '@/shared/types/database';

type Event = Database['public']['Tables']['events']['Row'];
type EventTicket = Database['public']['Tables']['event_tickets']['Row'];
type Attendee = Database['public']['Tables']['attendees']['Row'];
type Organisation = Database['public']['Tables']['organisations']['Row'];

// Initialize Stripe
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  throw new Error("STRIPE_SECRET_KEY environment variable is required");
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2025-04-30.basil',
});

// Client will be created in each function to ensure proper authentication

/**
 * Sync an event to a Stripe Product
 */
export async function syncEventToStripeProduct(
  event: Event, 
  connectedAccountId: string
): Promise<string | null> {
  try {
    const supabase = await createClient();
    
    // Check if product already exists
    if (event.stripe_product_id) {
      try {
        // Try to retrieve the existing product
        await stripe.products.retrieve(
          event.stripe_product_id,
          { stripeAccount: connectedAccountId }
        );
        
        // If we get here, product exists - update it
        await stripe.products.update(
          event.stripe_product_id,
          {
            name: event.title,
            description: event.description?.substring(0, 500),
            images: event.image_url ? [event.image_url] : undefined,
            metadata: buildProductMetadata({
              eventId: event.event_id,
              eventType: event.type || undefined,
              eventSlug: event.slug,
              organisationId: event.organiser_id || '',
              eventStart: event.event_start ? new Date(event.event_start) : undefined,
              eventEnd: event.event_end ? new Date(event.event_end) : undefined,
              locationId: event.location_id || undefined,
              maxAttendees: event.max_attendees || undefined,
              isMultiDay: event.is_multi_day || false,
              isPublished: event.is_published || true,
              isFeatured: event.featured || false,
            })
          },
          { stripeAccount: connectedAccountId }
        );
        
        return event.stripe_product_id;
      } catch (error: any) {
        // Product doesn't exist, continue to create new one
        console.log(`Product ${event.stripe_product_id} not found, creating new one`);
      }
    }
    
    // Create new product
    const product = await stripe.products.create(
      {
        name: event.title,
        description: event.description?.substring(0, 500),
        
        metadata: buildProductMetadata({
          eventId: event.event_id,
          eventType: event.type || undefined,
          eventSlug: event.slug,
          organisationId: event.organiser_id || '',
          eventStart: event.event_start ? new Date(event.event_start) : undefined,
          eventEnd: event.event_end ? new Date(event.event_end) : undefined,
          locationId: event.location_id || undefined,
          maxAttendees: event.max_attendees || undefined,
          isMultiDay: event.is_multi_day || false,
          isPublished: event.is_published || true,
          isFeatured: event.featured || false,
        }),
        
        // Add images if available
        images: event.image_url ? [event.image_url] : [],
        
        // Set as service since these are event tickets
        type: 'service',
        
        // Category for reporting - entertainment events
        tax_code: 'txcd_90020000',
      },
      { stripeAccount: connectedAccountId }
    );
    
    // Store Stripe product ID in database
    const { error } = await supabase
      .from('events')
      .update({ stripe_product_id: product.id })
      .eq('event_id', event.event_id);
      
    if (error) {
      console.error('Error updating event with Stripe product ID:', error);
      return null;
    }
    
    console.log(`Created Stripe product ${product.id} for event ${event.event_id}`);
    return product.id;
    
  } catch (error) {
    console.error('Error syncing event to Stripe product:', error);
    return null;
  }
}

/**
 * Sync a ticket to a Stripe Price
 */
export async function syncTicketToStripePrice(
  ticket: EventTicket,
  productId: string,
  connectedAccountId: string
): Promise<string | null> {
  try {
    const supabase = await createClient();
    
    // Check if price already exists
    if (ticket.stripe_price_id) {
      try {
        // Try to retrieve the existing price
        const existingPrice = await stripe.prices.retrieve(
          ticket.stripe_price_id,
          { stripeAccount: connectedAccountId }
        );
        
        // Prices are immutable in Stripe, so if amount changed, we need to create a new one
        if (existingPrice.unit_amount !== Math.round(Number(ticket.price) * 100)) {
          console.log(`Price changed for ticket ${ticket.event_ticket_id}, creating new price`);
          // Archive the old price
          await stripe.prices.update(
            ticket.stripe_price_id,
            { active: false },
            { stripeAccount: connectedAccountId }
          );
        } else {
          // Price hasn't changed, just update metadata
          await stripe.prices.update(
            ticket.stripe_price_id,
            {
              nickname: ticket.name,
              metadata: buildPriceMetadata({
                ticketId: ticket.event_ticket_id,
                ticketType: ticket.name,
                eventId: ticket.event_id,
                maxQuantity: ticket.total_capacity || undefined,
                minQuantity: 1,
                eligibility: 'all', // You might want to parse this from eligibility_criteria
              })
            },
            { stripeAccount: connectedAccountId }
          );
          
          return ticket.stripe_price_id;
        }
      } catch (error: any) {
        // Price doesn't exist, continue to create new one
        console.log(`Price ${ticket.stripe_price_id} not found, creating new one`);
      }
    }
    
    // Create new price
    const price = await stripe.prices.create(
      {
        product: productId,
        currency: 'aud',
        unit_amount: Math.round(Number(ticket.price) * 100),
        
        nickname: ticket.name,
        
        metadata: buildPriceMetadata({
          ticketId: ticket.event_ticket_id,
          ticketType: ticket.name,
          eventId: ticket.event_id,
          maxQuantity: ticket.total_capacity || undefined,
          minQuantity: 1,
          eligibility: 'all', // You might want to parse this from eligibility_criteria
        })
      },
      { stripeAccount: connectedAccountId }
    );
    
    // Store Stripe price ID in database
    const { error } = await supabase
      .from('event_tickets')
      .update({ stripe_price_id: price.id })
      .eq('event_ticket_id', ticket.event_ticket_id);
      
    if (error) {
      console.error('Error updating ticket with Stripe price ID:', error);
      return null;
    }
    
    console.log(`Created Stripe price ${price.id} for ticket ${ticket.event_ticket_id}`);
    return price.id;
    
  } catch (error) {
    console.error('Error syncing ticket to Stripe price:', error);
    return null;
  }
}

/**
 * Create or update a Stripe Customer
 */
export async function createOrUpdateStripeCustomer(
  attendee: Attendee,
  connectedAccountId: string
): Promise<Stripe.Customer | null> {
  try {
    const customerData: Stripe.CustomerCreateParams | Stripe.CustomerUpdateParams = {
      email: attendee.email || undefined,
      name: `${attendee.first_name} ${attendee.last_name}`,
      phone: attendee.phone || undefined,
      
      // Note: Attendees table doesn't have address fields
      // Address information would need to come from the contacts table
      address: undefined,
      
      metadata: buildCustomerMetadata({
        attendeeId: attendee.attendee_id,
        registrationId: attendee.registration_id,
        attendeeType: attendee.attendee_type,
        isPrimary: attendee.is_primary_contact || false,
        masonType: attendee.mason_type || undefined,
        lodgeName: attendee.lodge_name || undefined,
        lodgeNumber: attendee.lodge_number || undefined,
        grandLodge: attendee.grand_lodge || undefined,
        masonicRank: attendee.masonic_rank || undefined,
        dietaryRequirements: attendee.dietary_requirements || undefined,
        accessibilityNeeds: attendee.accessibility_requirements || undefined,
        createdAt: attendee.created_at,
      })
    };
    
    // Check if customer exists by email
    if (attendee.email) {
      const existingCustomers = await stripe.customers.list(
        {
          email: attendee.email,
          limit: 1
        },
        { stripeAccount: connectedAccountId }
      );
      
      if (existingCustomers.data.length > 0) {
        // Update existing customer
        const updatedCustomer = await stripe.customers.update(
          existingCustomers.data[0].id,
          customerData as Stripe.CustomerUpdateParams,
          { stripeAccount: connectedAccountId }
        );
        
        console.log(`Updated Stripe customer ${updatedCustomer.id} for attendee ${attendee.attendee_id}`);
        return updatedCustomer;
      }
    }
    
    // Create new customer
    const newCustomer = await stripe.customers.create(
      customerData as Stripe.CustomerCreateParams,
      { stripeAccount: connectedAccountId }
    );
    
    console.log(`Created Stripe customer ${newCustomer.id} for attendee ${attendee.attendee_id}`);
    return newCustomer;
    
  } catch (error) {
    console.error('Error creating/updating Stripe customer:', error);
    return null;
  }
}

/**
 * Sync all tickets for an event
 */
export async function syncEventTickets(
  eventId: string,
  connectedAccountId: string
): Promise<void> {
  try {
    const supabase = await createClient();
    
    // Get the event
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('event_id', eventId)
      .single();
      
    if (eventError || !event) {
      console.error('Error fetching event:', eventError);
      return;
    }
    
    // Ensure event has a Stripe product
    let productId = event.stripe_product_id;
    if (!productId) {
      productId = await syncEventToStripeProduct(event, connectedAccountId);
      if (!productId) {
        console.error('Failed to create Stripe product for event');
        return;
      }
    }
    
    // Get all tickets for the event
    const { data: tickets, error: ticketsError } = await supabase
      .from('event_tickets')
      .select('*')
      .eq('event_id', eventId)
      .eq('is_active', true);
      
    if (ticketsError || !tickets) {
      console.error('Error fetching tickets:', ticketsError);
      return;
    }
    
    // Sync each ticket
    for (const ticket of tickets) {
      await syncTicketToStripePrice(ticket, productId, connectedAccountId);
    }
    
    console.log(`Synced ${tickets.length} tickets for event ${eventId}`);
    
  } catch (error) {
    console.error('Error syncing event tickets:', error);
  }
}

