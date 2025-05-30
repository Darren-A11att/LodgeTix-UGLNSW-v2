import { createClient } from '@supabase/supabase-js'
import { Database } from '@/shared/types/database'
import { supabase, getServerClient } from '@/lib/supabase-singleton'

// Types for CRUD operations
export interface EventInput {
  id?: string;
  title: string;
  subtitle?: string;
  slug?: string;
  description: string;
  long_description?: string;
  event_start: string;
  event_end?: string;
  location: string;
  venue_id?: string;
  image_url?: string;
  banner_image_url?: string;
  is_featured?: boolean;
  is_published?: boolean;
  parent_event_id?: string;
  type?: string;
  dress_code?: string;
  regalia?: string;
  degree_type?: string;
  organizer_name?: string;
  organizer_contact?: string;
  package_info?: {
    package_id?: string;
    discount_percentage?: number;
    discount_amount?: number;
    package_price?: number;
    includes_all_events?: boolean;
  };
}

export interface TicketInput {
  id?: string;
  event_id: string;
  name: string;
  description?: string;
  price: number;
  quantity_total?: number;
  quantity_sold?: number;
  min_per_order?: number;
  max_per_order?: number;
  attendee_type?: string;
  is_active?: boolean;
  sort_order?: number;
}

export interface CrudResponse {
  success: boolean;
  event_id?: string;
  ticket_id?: string;
  ticket_ids?: string[];
  message?: string;
  error?: string;
  detail?: string;
  updates_applied?: number;
  child_events_deleted?: number;
  tickets_deleted?: number;
  assignments_deleted?: number;
  tickets_created?: number;
  events_updated?: number;
  events_archived?: number;
  source_event_id?: string;
  new_event_id?: string;
  tickets_cloned?: number;
  before_date?: string;
}

export class EventCrudService {
  private client: ReturnType<typeof createClient<Database>>;

  constructor(isServer: boolean = false) {
    this.client = isServer ? getServerClient() : supabase;
  }

  // ============================================
  // EVENT OPERATIONS
  // ============================================

  /**
   * Create a new event
   */
  async createEvent(event: EventInput): Promise<CrudResponse> {
    const { data, error } = await this.client.rpc('create_event', {
      p_event: event
    });

    if (error) {
      console.error('Error creating event:', error);
      throw error;
    }

    return data as CrudResponse;
  }

  /**
   * Update an existing event
   */
  async updateEvent(eventId: string, updates: Partial<EventInput>): Promise<CrudResponse> {
    const { data, error } = await this.client.rpc('update_event', {
      p_event_id: eventId,
      p_updates: updates
    });

    if (error) {
      console.error('Error updating event:', error);
      throw error;
    }

    return data as CrudResponse;
  }

  /**
   * Create or update an event (upsert)
   */
  async upsertEvent(event: EventInput): Promise<CrudResponse> {
    const { data, error } = await this.client.rpc('upsert_event', {
      p_event: event
    });

    if (error) {
      console.error('Error upserting event:', error);
      throw error;
    }

    return data as CrudResponse;
  }

  /**
   * Delete an event
   */
  async deleteEvent(eventId: string, cascade: boolean = false): Promise<CrudResponse> {
    const { data, error } = await this.client.rpc('delete_event', {
      p_event_id: eventId,
      p_cascade: cascade
    });

    if (error) {
      console.error('Error deleting event:', error);
      throw error;
    }

    return data as CrudResponse;
  }

  // ============================================
  // TICKET OPERATIONS
  // ============================================

  /**
   * Create a new ticket
   */
  async createTicket(ticket: TicketInput): Promise<CrudResponse> {
    const { data, error } = await this.client.rpc('create_ticket', {
      p_ticket: ticket
    });

    if (error) {
      console.error('Error creating ticket:', error);
      throw error;
    }

    return data as CrudResponse;
  }

  /**
   * Update an existing ticket
   */
  async updateTicket(ticketId: string, updates: Partial<TicketInput>): Promise<CrudResponse> {
    const { data, error } = await this.client.rpc('update_ticket', {
      p_ticket_id: ticketId,
      p_updates: updates
    });

    if (error) {
      console.error('Error updating ticket:', error);
      throw error;
    }

    return data as CrudResponse;
  }

  /**
   * Delete a ticket
   */
  async deleteTicket(ticketId: string, force: boolean = false): Promise<CrudResponse> {
    const { data, error } = await this.client.rpc('delete_ticket', {
      p_ticket_id: ticketId,
      p_force: force
    });

    if (error) {
      console.error('Error deleting ticket:', error);
      throw error;
    }

    return data as CrudResponse;
  }

  // ============================================
  // BATCH OPERATIONS
  // ============================================

  /**
   * Create multiple tickets for an event
   */
  async createTicketsBatch(eventId: string, tickets: TicketInput[]): Promise<CrudResponse> {
    const { data, error } = await this.client.rpc('create_tickets_batch', {
      p_event_id: eventId,
      p_tickets: tickets
    });

    if (error) {
      console.error('Error creating tickets batch:', error);
      throw error;
    }

    return data as CrudResponse;
  }

  /**
   * Clone an event with optional ticket cloning
   */
  async cloneEvent(
    sourceEventId: string, 
    newTitle: string, 
    newEventStart: string,
    includeTickets: boolean = true
  ): Promise<CrudResponse> {
    const { data, error } = await this.client.rpc('clone_event', {
      p_source_event_id: sourceEventId,
      p_new_title: newTitle,
      p_new_event_start: newEventStart,
      p_include_tickets: includeTickets
    });

    if (error) {
      console.error('Error cloning event:', error);
      throw error;
    }

    return data as CrudResponse;
  }

  /**
   * Update multiple events' published/featured status
   */
  async bulkUpdateEventStatus(
    eventIds: string[], 
    isPublished?: boolean, 
    isFeatured?: boolean
  ): Promise<CrudResponse> {
    const { data, error } = await this.client.rpc('bulk_update_event_status', {
      p_event_ids: eventIds,
      p_is_published: isPublished,
      p_is_featured: isFeatured
    });

    if (error) {
      console.error('Error bulk updating event status:', error);
      throw error;
    }

    return data as CrudResponse;
  }

  /**
   * Archive events older than specified date
   */
  async archiveOldEvents(beforeDate?: string): Promise<CrudResponse> {
    const { data, error } = await this.client.rpc('archive_old_events', {
      p_before_date: beforeDate
    });

    if (error) {
      console.error('Error archiving old events:', error);
      throw error;
    }

    return data as CrudResponse;
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  /**
   * Create a complete event with tickets in one operation
   */
  async createEventWithTickets(
    event: EventInput, 
    tickets: Omit<TicketInput, 'event_id'>[]
  ): Promise<{
    eventResult: CrudResponse;
    ticketsResult?: CrudResponse;
  }> {
    // First create the event
    const eventResult = await this.createEvent(event);
    
    if (!eventResult.success || !eventResult.event_id) {
      return { eventResult };
    }

    // Then create tickets if event was successful
    const ticketsWithEventId = tickets.map(ticket => ({
      ...ticket,
      event_id: eventResult.event_id!
    }));

    const ticketsResult = await this.createTicketsBatch(
      eventResult.event_id, 
      ticketsWithEventId
    );

    return { eventResult, ticketsResult };
  }

  /**
   * Update event and replace all tickets
   */
  async updateEventAndReplaceTickets(
    eventId: string,
    eventUpdates: Partial<EventInput>,
    newTickets: Omit<TicketInput, 'event_id'>[]
  ): Promise<{
    eventResult: CrudResponse;
    deleteResult?: CrudResponse;
    ticketsResult?: CrudResponse;
  }> {
    // Update the event
    const eventResult = await this.updateEvent(eventId, eventUpdates);
    
    if (!eventResult.success) {
      return { eventResult };
    }

    // Get existing tickets
    const { data: existingTickets } = await this.client
      .from('ticket_definitions')
      .select('id')
      .eq('event_id', eventId);

    // Delete existing tickets
    let deleteResult: CrudResponse | undefined;
    if (existingTickets && existingTickets.length > 0) {
      for (const ticket of existingTickets) {
        deleteResult = await this.deleteTicket(ticket.id, true);
      }
    }

    // Create new tickets
    const ticketsWithEventId = newTickets.map(ticket => ({
      ...ticket,
      event_id: eventId
    }));

    const ticketsResult = await this.createTicketsBatch(eventId, ticketsWithEventId);

    return { eventResult, deleteResult, ticketsResult };
  }

  /**
   * Safe delete event (checks for registrations first)
   */
  async safeDeleteEvent(eventId: string): Promise<CrudResponse> {
    // Check for existing registrations
    const { data: registrations } = await this.client
      .from('registrations')
      .select('registration_id')
      .eq('event_id', eventId)
      .limit(1);

    if (registrations && registrations.length > 0) {
      return {
        success: false,
        error: 'Cannot delete event with existing registrations',
        detail: 'Event has active registrations. Archive the event instead.'
      };
    }

    // Safe to delete with cascade
    return this.deleteEvent(eventId, true);
  }
}