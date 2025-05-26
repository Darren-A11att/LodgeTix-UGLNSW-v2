import { supabase } from '@/lib/supabase';

export interface EventTicket {
  event_ticket_id: string;
  event_id: string;
  ticket_type: string;
  ticket_name: string;
  ticket_description: string;
  price: number;
  max_quantity: number;
  is_active: boolean;
}

export interface TicketPackage {
  package_id: string;
  package_name: string;
  package_description: string;
  price: number;
  included_tickets: string[]; // Array of event_ticket_ids
  is_active: boolean;
}

export const ticketService = {
  /**
   * Fetch all active event tickets for a specific event
   */
  async getEventTickets(eventId: string): Promise<EventTicket[]> {
    try {
      // Since eventtickets doesn't have ticket names, return empty array
      // The actual ticket definitions are hardcoded in the UI for now
      console.log('EventTickets table does not have ticket definitions, using hardcoded values');
      return [];
    } catch (error) {
      console.error('Error in getEventTickets:', error);
      return [];
    }
  },

  /**
   * Fetch all active ticket packages for a specific event
   */
  async getTicketPackages(eventId: string): Promise<TicketPackage[]> {
    try {
      // Return empty array since ticket_packages table doesn't exist
      // The actual packages are hardcoded in the UI for now
      console.log('Ticket packages table does not exist, using hardcoded values');
      return [];
    } catch (error) {
      console.error('Error in getTicketPackages:', error);
      return [];
    }
  },

  /**
   * Get tickets by their IDs
   */
  async getTicketsByIds(ticketIds: string[]): Promise<EventTicket[]> {
    if (!ticketIds.length) return [];

    const { data, error } = await supabase
      .from('eventtickets')
      .select('*')
      .in('event_ticket_id', ticketIds);

    if (error) {
      console.error('Error fetching tickets by IDs:', error);
      return [];
    }

    return data || [];
  }
};

/**
 * Default packages if ticket_packages table doesn't exist
 */
function getDefaultPackages(eventId: string): TicketPackage[] {
  // These would need to be created based on actual event ticket IDs
  return [
    {
      package_id: 'pkg-complete',
      package_name: 'Complete Package',
      package_description: 'Includes all events',
      price: 250,
      included_tickets: [], // Will be populated with actual ticket IDs
      is_active: true
    },
    {
      package_id: 'pkg-ceremony-banquet',
      package_name: 'Ceremony & Banquet',
      package_description: 'Installation ceremony and grand banquet',
      price: 200,
      included_tickets: [],
      is_active: true
    },
    {
      package_id: 'pkg-social',
      package_name: 'Social Package',
      package_description: 'All social events',
      price: 180,
      included_tickets: [],
      is_active: true
    }
  ];
}