/**
 * Optimized services with caching, batching, and view-based queries
 * Import these instead of the original services for better performance
 */

// Cache manager for manual cache control
export { cacheManager, CacheKeys } from '../cache-manager';

// Optimized services
export { homepageService } from './homepage-service-optimized';
export { eventService } from './event-service-optimized';
export { FunctionService } from './function-service';
export { 
  registrationService, 
  serverRegistrationService,
  RegistrationServiceOptimized 
} from './registration-service-optimized';
export { 
  ticketService, 
  serverTicketService,
  TicketServiceOptimized 
} from './ticket-service-optimized';
export { 
  staticDataService, 
  serverStaticDataService,
  StaticDataService 
} from './static-data-service';

// Batch operations
export { batchOperations, serverBatchOperations, BatchOperations } from '../batch-operations';

// Query optimization utilities
export { queryOptimizer, queryBuilder } from '../query-optimizer';

// Optimized API functions
// Note: grandLodges-optimized and lodges-optimized have been removed
// Use the standard grandLodges and lodges modules instead

// Re-export types
export type { GrandLodge, Lodge, Country } from './static-data-service';
export type { Event, Ticket } from './event-service-optimized';

/**
 * Performance monitoring utilities
 */
export const performanceMonitor = {
  /**
   * Log API call performance
   */
  logApiCall: (operation: string, startTime: number) => {
    const duration = Date.now() - startTime;
    console.log(`[API Performance] ${operation}: ${duration}ms`);
    
    // You could send this to a monitoring service
    if (duration > 1000) {
      console.warn(`[API Performance] Slow operation detected: ${operation} took ${duration}ms`);
    }
  },

  /**
   * Get cache statistics
   */
  getCacheStats: () => {
    return cacheManager.getStats();
  },

  /**
   * Clear all caches (use sparingly)
   */
  clearAllCaches: () => {
    cacheManager.clearAll();
    console.log('[Cache] All caches cleared');
  }
};

/**
 * Prefetch strategies for common workflows
 */
export const prefetchStrategies = {
  /**
   * Prefetch data for homepage
   */
  homepage: async () => {
    const start = Date.now();
    await Promise.all([
      homepageService.getHeroFunction(),
      homepageService.getEventTimeline(),
      homepageService.getFeaturedEvents()
    ]);
    performanceMonitor.logApiCall('Homepage prefetch', start);
  },

  /**
   * Prefetch data for registration flow
   */
  registration: async (eventId: string) => {
    const start = Date.now();
    await Promise.all([
      eventService.getEventByIdOrSlug(eventId),
      staticDataService.prefetchRegistrationData(),
      ticketService.getEventTickets(eventId)
    ]);
    performanceMonitor.logApiCall('Registration prefetch', start);
  },

  /**
   * Prefetch static data on app initialization
   */
  appInit: async () => {
    const start = Date.now();
    await staticDataService.batchFetchStaticData();
    performanceMonitor.logApiCall('App init prefetch', start);
  }
};

/**
 * Real-time subscription manager
 */
export const subscriptionManager = {
  subscriptions: new Map<string, any>(),

  /**
   * Subscribe to ticket availability for an event
   */
  subscribeToTickets: (eventId: string, callback: (payload: any) => void) => {
    const key = `tickets:${eventId}`;
    if (subscriptionManager.subscriptions.has(key)) {
      return subscriptionManager.subscriptions.get(key);
    }

    const subscription = ticketService.subscribeToTicketAvailability(eventId, callback);
    subscriptionManager.subscriptions.set(key, subscription);
    return subscription;
  },

  /**
   * Unsubscribe from a specific subscription
   */
  unsubscribe: (key: string) => {
    const subscription = subscriptionManager.subscriptions.get(key);
    if (subscription) {
      subscription.unsubscribe();
      subscriptionManager.subscriptions.delete(key);
    }
  },

  /**
   * Unsubscribe from all subscriptions
   */
  unsubscribeAll: () => {
    subscriptionManager.subscriptions.forEach(sub => sub.unsubscribe());
    subscriptionManager.subscriptions.clear();
  }
};