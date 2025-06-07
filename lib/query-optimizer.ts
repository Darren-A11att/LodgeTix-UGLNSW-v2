import { PostgrestQueryBuilder } from '@supabase/postgrest-js';

/**
 * Query optimizer utility for selecting only needed columns and optimizing queries
 */
export class QueryOptimizer {
  /**
   * Select only specific columns from a query
   */
  static selectColumns<T extends PostgrestQueryBuilder<any, any, any>>(
    query: T,
    columns: string[]
  ): T {
    return query.select(columns.join(',')) as T;
  }

  /**
   * Add pagination to a query
   */
  static paginate<T extends PostgrestQueryBuilder<any, any, any>>(
    query: T,
    page: number = 1,
    pageSize: number = 20
  ): T {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    return query.range(from, to) as T;
  }

  /**
   * Add common filters for event queries
   */
  static filterActiveEvents<T extends PostgrestQueryBuilder<any, any, any>>(
    query: T,
    includeUnpublished: boolean = false
  ): T {
    const now = new Date().toISOString();
    
    if (!includeUnpublished) {
      query = query.eq('is_published', true) as T;
    }
    
    return query.gte('event_end', now) as T;
  }

  /**
   * Optimize event listing queries
   */
  static optimizeEventListQuery<T extends PostgrestQueryBuilder<any, any, any>>(
    query: T,
    options: {
      columns?: string[];
      includeTickets?: boolean;
      includeVenue?: boolean;
      limit?: number;
    } = {}
  ): T {
    const defaultColumns = [
      'event_id',
      'slug',
      'title',
      'subtitle',
      'event_start',
      'event_end',
      'location',
      'image_url',
      'min_price',
      'is_sold_out'
    ];

    const columns = options.columns || defaultColumns;
    
    if (options.includeTickets) {
      columns.push('total_capacity', 'tickets_sold');
    }
    
    if (options.includeVenue) {
      columns.push('venue_name', 'venue_address');
    }

    query = this.selectColumns(query, columns);
    
    if (options.limit) {
      query = query.limit(options.limit) as T;
    }

    return query;
  }

  /**
   * Optimize registration queries
   */
  static optimizeRegistrationQuery<T extends PostgrestQueryBuilder<any, any, any>>(
    query: T,
    options: {
      includeAttendees?: boolean;
      includeTickets?: boolean;
      includePayment?: boolean;
    } = {}
  ): T {
    const columns = [
      'registration_id',
      'confirmation_number',
      'event_id',
      'event_title',
      'registration_type',
      'status',
      'created_at'
    ];

    if (options.includeAttendees) {
      columns.push('attendee_count');
    }

    if (options.includePayment) {
      columns.push('payment_status', 'total_amount_paid', 'amount_paid');
    }

    if (options.includeTickets) {
      // This would need a join or separate query
      columns.push('ticket_count');
    }

    return this.selectColumns(query, columns);
  }

  /**
   * Create an efficient count query
   */
  static createCountQuery<T extends PostgrestQueryBuilder<any, any, any>>(
    query: T
  ): T {
    return query.select('*', { count: 'exact', head: true }) as T;
  }

  /**
   * Add efficient sorting with indexes
   */
  static addIndexedSort<T extends PostgrestQueryBuilder<any, any, any>>(
    query: T,
    column: string,
    ascending: boolean = true
  ): T {
    return query.order(column, { ascending, nullsFirst: false }) as T;
  }

  /**
   * Optimize search queries with proper indexes
   */
  static optimizeSearchQuery<T extends PostgrestQueryBuilder<any, any, any>>(
    query: T,
    searchColumns: string[],
    searchTerm: string
  ): T {
    if (!searchTerm || !searchColumns.length) return query;

    const searchPattern = `%${searchTerm}%`;
    const orConditions = searchColumns.map(col => `${col}.ilike.${searchPattern}`).join(',');
    
    return query.or(orConditions) as T;
  }

  /**
   * Add efficient joins using views
   */
  static useOptimizedView<T extends PostgrestQueryBuilder<any, any, any>>(
    client: any,
    viewName: string,
    columns?: string[]
  ): T {
    let query = client.from(viewName);
    
    if (columns && columns.length > 0) {
      query = query.select(columns.join(','));
    } else {
      query = query.select('*');
    }
    
    return query as T;
  }

  /**
   * Create a query plan analyzer (for development)
   */
  static async analyzeQuery(
    client: any,
    query: string
  ): Promise<{ plan: any; stats: any }> {
    try {
      // Run EXPLAIN ANALYZE on the query
      const { data, error } = await client.rpc('analyze_query', {
        query_text: `EXPLAIN (ANALYZE, BUFFERS) ${query}`
      });

      if (error) {
        console.error('Error analyzing query:', error);
        return { plan: null, stats: null };
      }

      return {
        plan: data,
        stats: this.extractQueryStats(data)
      };
    } catch (error) {
      console.error('Exception analyzing query:', error);
      return { plan: null, stats: null };
    }
  }

  /**
   * Extract statistics from query plan
   */
  private static extractQueryStats(plan: any): any {
    // Parse the execution plan to extract useful stats
    return {
      totalTime: 0,
      rowsReturned: 0,
      blocksRead: 0,
      indexesUsed: []
    };
  }
}

/**
 * Query builder helper for common patterns
 */
export class QueryBuilder {
  /**
   * Build an optimized event listing query
   */
  static buildEventListingQuery(
    client: any,
    options: {
      featured?: boolean;
      limit?: number;
      offset?: number;
      orderBy?: string;
      ascending?: boolean;
    } = {}
  ) {
    let query = QueryOptimizer.useOptimizedView(client, 'event_display_view');
    
    query = QueryOptimizer.filterActiveEvents(query);
    
    if (options.featured) {
      query = query.eq('is_featured', true);
    }
    
    if (options.orderBy) {
      query = QueryOptimizer.addIndexedSort(query, options.orderBy, options.ascending);
    } else {
      query = QueryOptimizer.addIndexedSort(query, 'event_start', true);
    }
    
    if (options.limit) {
      query = query.limit(options.limit);
    }
    
    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
    }
    
    return query;
  }

  /**
   * Build an optimized registration search query
   */
  static buildRegistrationSearchQuery(
    client: any,
    searchTerm: string,
    filters: {
      status?: string;
      eventId?: string;
      dateFrom?: string;
      dateTo?: string;
    } = {}
  ) {
    let query = QueryOptimizer.useOptimizedView(client, 'registration_detail_view');
    
    if (searchTerm) {
      query = QueryOptimizer.optimizeSearchQuery(
        query,
        ['confirmation_number', 'customer_email', 'customer_first_name', 'customer_last_name'],
        searchTerm
      );
    }
    
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    
    if (filters.eventId) {
      query = query.eq('event_id', filters.eventId);
    }
    
    if (filters.dateFrom) {
      query = query.gte('created_at', filters.dateFrom);
    }
    
    if (filters.dateTo) {
      query = query.lte('created_at', filters.dateTo);
    }
    
    return QueryOptimizer.addIndexedSort(query, 'created_at', false);
  }
}

// Export utilities
export const queryOptimizer = QueryOptimizer;
export const queryBuilder = QueryBuilder;