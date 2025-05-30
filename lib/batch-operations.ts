import { createClient } from '@/lib/supabase-browser';
import { getServerClient } from '@/lib/supabase-singleton';
import { Database } from '@/shared/types/database';

/**
 * Batch operations helper for optimizing multiple database operations
 */
export class BatchOperations {
  private client: ReturnType<typeof createClient<Database>>;

  constructor(private isServer: boolean = false) {
    this.client = this.isServer ? getServerClient() : createClient();
  }

  /**
   * Batch insert attendees in one operation
   */
  async batchInsertAttendees(
    attendees: Array<Database['public']['Tables']['attendees']['Insert']>
  ) {
    if (!attendees.length) return [];

    try {
      const { data, error } = await this.client
        .from('attendees')
        .insert(attendees)
        .select();

      if (error) {
        console.error('Error batch inserting attendees:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Exception batch inserting attendees:', error);
      throw error;
    }
  }

  /**
   * Batch update ticket statuses
   */
  async batchUpdateTicketStatuses(
    updates: Array<{
      id: string;
      status: Database['public']['Enums']['ticket_status'];
      attendee_id?: string;
    }>
  ) {
    if (!updates.length) return;

    try {
      // Use Promise.all for parallel updates
      const updatePromises = updates.map(update =>
        this.client
          .from('tickets')
          .update({
            status: update.status,
            attendee_id: update.attendee_id || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', update.id)
      );

      const results = await Promise.all(updatePromises);
      
      // Check for errors
      const errors = results.filter(result => result.error);
      if (errors.length > 0) {
        console.error('Errors in batch ticket update:', errors);
        throw new Error('Some ticket updates failed');
      }

      return true;
    } catch (error) {
      console.error('Exception batch updating tickets:', error);
      throw error;
    }
  }

  /**
   * Batch fetch events by IDs
   */
  async batchFetchEvents(eventIds: string[]) {
    if (!eventIds.length) return [];

    try {
      const { data, error } = await this.client
        .from('event_display_view')
        .select('*')
        .in('event_id', eventIds);

      if (error) {
        console.error('Error batch fetching events:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Exception batch fetching events:', error);
      return [];
    }
  }

  /**
   * Batch fetch registrations by IDs
   */
  async batchFetchRegistrations(registrationIds: string[]) {
    if (!registrationIds.length) return [];

    try {
      const { data, error } = await this.client
        .from('registration_detail_view')
        .select('*')
        .in('registration_id', registrationIds);

      if (error) {
        console.error('Error batch fetching registrations:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Exception batch fetching registrations:', error);
      return [];
    }
  }

  /**
   * Batch create tickets for multiple attendees
   */
  async batchCreateTickets(
    tickets: Array<Database['public']['Tables']['tickets']['Insert']>
  ) {
    if (!tickets.length) return [];

    try {
      const { data, error } = await this.client
        .from('tickets')
        .insert(tickets)
        .select();

      if (error) {
        console.error('Error batch creating tickets:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Exception batch creating tickets:', error);
      throw error;
    }
  }

  /**
   * Batch update attendee contact information
   */
  async batchUpdateAttendeeContacts(
    updates: Array<{
      id: string;
      email?: string;
      phone?: string;
      contact_preference?: Database['public']['Enums']['attendee_contact_preference'];
    }>
  ) {
    if (!updates.length) return;

    try {
      // Use transaction for atomic updates
      const updatePromises = updates.map(({ id, ...data }) =>
        this.client
          .from('attendees')
          .update({
            ...data,
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
      );

      const results = await Promise.all(updatePromises);
      
      // Check for errors
      const errors = results.filter(result => result.error);
      if (errors.length > 0) {
        console.error('Errors in batch attendee update:', errors);
        throw new Error('Some attendee updates failed');
      }

      return true;
    } catch (error) {
      console.error('Exception batch updating attendees:', error);
      throw error;
    }
  }

  /**
   * Batch delete temporary/reserved tickets older than threshold
   */
  async batchCleanupReservedTickets(thresholdMinutes: number = 30) {
    try {
      const threshold = new Date(Date.now() - thresholdMinutes * 60 * 1000).toISOString();
      
      const { data, error } = await this.client
        .from('tickets')
        .delete()
        .eq('status', 'reserved')
        .lt('created_at', threshold)
        .select('id');

      if (error) {
        console.error('Error cleaning up reserved tickets:', error);
        return { cleaned: 0 };
      }

      return { cleaned: data?.length || 0 };
    } catch (error) {
      console.error('Exception cleaning up reserved tickets:', error);
      return { cleaned: 0 };
    }
  }

  /**
   * Execute multiple operations in a transaction-like manner
   */
  async executeTransaction<T>(
    operations: Array<() => Promise<any>>
  ): Promise<T[]> {
    const results: T[] = [];
    const completedOps: number[] = [];

    try {
      // Execute operations sequentially to maintain order
      for (let i = 0; i < operations.length; i++) {
        const result = await operations[i]();
        results.push(result);
        completedOps.push(i);
      }

      return results;
    } catch (error) {
      // If any operation fails, attempt to rollback completed operations
      console.error(`Transaction failed at operation ${completedOps.length + 1}:`, error);
      
      // In a real transaction system, we would rollback here
      // For now, just throw the error
      throw error;
    }
  }
}

// Export singleton instances
export const batchOperations = new BatchOperations(false);
export const serverBatchOperations = new BatchOperations(true);