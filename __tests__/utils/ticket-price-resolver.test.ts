import { describe, it, expect } from 'vitest';
import { 
  resolveTicketPrices, 
  expandPackagesWithPricing, 
  validateTicketPricing,
  type EventTicketRecord,
  type PackageRecord 
} from '@/lib/utils/ticket-price-resolver';

describe('Ticket Price Resolver', () => {
  const eventTicketRecords: EventTicketRecord[] = [
    {
      id: 'ticket-123',
      name: 'Dinner Ticket',
      price: 150,
      description: 'Premium dinner',
      event_id: 'event-123',
      function_id: 'function-123'
    },
    {
      id: 'ticket-456',
      name: 'Lunch Ticket',
      price: 85,
      description: 'Light lunch',
      event_id: 'event-456',
      function_id: 'function-123'
    }
  ];

  const packageRecords: PackageRecord[] = [
    {
      id: 'package-789',
      name: 'Full Package',
      price: 200,
      description: 'Includes dinner and lunch',
      includes: ['ticket-123', 'ticket-456']
    },
    {
      id: 'package-single',
      name: 'Single Event Package',
      price: 180,
      description: 'Single package item',
      includes: []
    }
  ];

  describe('resolveTicketPrices', () => {
    it('should resolve individual ticket prices from database', () => {
      const ticketsFromStore = [
        {
          id: 'ticket-123', // Direct ticket ID for testing
          name: 'Dinner Ticket',
          price: 0, // Wrong price from store
          attendeeId: 'attendee-1',
          isPackage: false,
          eventTicketId: 'ticket-123'
        }
      ];

      const resolved = resolveTicketPrices(ticketsFromStore, eventTicketRecords, packageRecords);
      
      expect(resolved).toHaveLength(1);
      expect(resolved[0].price).toBe(150); // ✅ Resolved from database
      expect(resolved[0].name).toBe('Dinner Ticket');
      expect(resolved[0].attendeeId).toBe('attendee-1');
    });

    it('should resolve package prices from database', () => {
      const ticketsFromStore = [
        {
          id: 'package-789', // Direct package ID format for testing
          name: 'Full Package',
          price: 50, // Wrong price from store
          attendeeId: 'attendee-1',
          isPackage: true
        }
      ];

      const resolved = resolveTicketPrices(ticketsFromStore, eventTicketRecords, packageRecords);
      
      expect(resolved).toHaveLength(1);
      expect(resolved[0].price).toBe(200); // ✅ Resolved from database
      expect(resolved[0].name).toBe('Full Package');
      expect(resolved[0].isPackage).toBe(true);
    });

    it('should fallback to store price when database record not found', () => {
      const ticketsFromStore = [
        {
          id: 'attendee-1-unknown-ticket',
          name: 'Unknown Ticket',
          price: 99, // Fallback price
          attendeeId: 'attendee-1',
          isPackage: false,
          eventTicketId: 'unknown-ticket'
        }
      ];

      const resolved = resolveTicketPrices(ticketsFromStore, eventTicketRecords, packageRecords);
      
      expect(resolved).toHaveLength(1);
      expect(resolved[0].price).toBe(99); // Falls back to store price
    });
  });

  describe('expandPackagesWithPricing', () => {
    it('should expand packages into individual tickets with correct database pricing', () => {
      const ticketsFromStore = [
        {
          id: 'package-789', // Direct package ID for testing
          name: 'Full Package',
          price: 0, // Wrong price from store
          attendeeId: 'attendee-1',
          isPackage: true
        }
      ];

      const expanded = expandPackagesWithPricing(ticketsFromStore, eventTicketRecords, packageRecords);
      
      expect(expanded).toHaveLength(2); // Package expanded into 2 tickets
      
      // Check first expanded ticket
      expect(expanded[0].name).toBe('Dinner Ticket');
      expect(expanded[0].price).toBe(150); // ✅ Database price
      expect(expanded[0].isFromPackage).toBe(true);
      expect(expanded[0].packageName).toBe('Full Package');
      
      // Check second expanded ticket
      expect(expanded[1].name).toBe('Lunch Ticket');
      expect(expanded[1].price).toBe(85); // ✅ Database price
      expect(expanded[1].isFromPackage).toBe(true);
      expect(expanded[1].packageName).toBe('Full Package');
    });

    it('should handle packages without includes as single tickets', () => {
      const ticketsFromStore = [
        {
          id: 'package-single', // Direct package ID for testing
          name: 'Single Event Package',
          price: 0, // Wrong price from store
          attendeeId: 'attendee-1',
          isPackage: true
        }
      ];

      const expanded = expandPackagesWithPricing(ticketsFromStore, eventTicketRecords, packageRecords);
      
      expect(expanded).toHaveLength(1);
      expect(expanded[0].name).toBe('Single Event Package');
      expect(expanded[0].price).toBe(180); // ✅ Database price
      expect(expanded[0].isPackage).toBe(true);
      expect(expanded[0].isFromPackage).toBe(false);
    });

    it('should process individual tickets with database pricing', () => {
      const ticketsFromStore = [
        {
          id: 'ticket-123', // Direct ticket ID for testing
          name: 'Dinner Ticket',
          price: 0, // Wrong price from store
          attendeeId: 'attendee-1',
          isPackage: false,
          eventTicketId: 'ticket-123'
        }
      ];

      const expanded = expandPackagesWithPricing(ticketsFromStore, eventTicketRecords, packageRecords);
      
      expect(expanded).toHaveLength(1);
      expect(expanded[0].name).toBe('Dinner Ticket');
      expect(expanded[0].price).toBe(150); // ✅ Database price
      expect(expanded[0].isPackage).toBe(false);
      expect(expanded[0].isFromPackage).toBe(false);
    });
  });

  describe('validateTicketPricing', () => {
    it('should identify tickets with zero prices', () => {
      const tickets = [
        {
          id: 'ticket-1',
          name: 'Valid Ticket',
          price: 150,
          attendeeId: 'attendee-1',
          eventTicketId: 'ticket-123',
          isPackage: false
        },
        {
          id: 'ticket-2',
          name: 'Zero Price Ticket',
          price: 0, // ❌ Invalid
          attendeeId: 'attendee-1',
          eventTicketId: 'ticket-456',
          isPackage: false
        }
      ];

      const validation = validateTicketPricing(tickets);
      
      expect(validation.isValid).toBe(false);
      expect(validation.zerotickets).toHaveLength(1);
      expect(validation.zerotickets[0].name).toBe('Zero Price Ticket');
      expect(validation.totalValue).toBe(150);
    });

    it('should validate all tickets have non-zero prices', () => {
      const tickets = [
        {
          id: 'ticket-1',
          name: 'Valid Ticket 1',
          price: 150,
          attendeeId: 'attendee-1',
          eventTicketId: 'ticket-123',
          isPackage: false
        },
        {
          id: 'ticket-2',
          name: 'Valid Ticket 2',
          price: 85,
          attendeeId: 'attendee-1',
          eventTicketId: 'ticket-456',
          isPackage: false
        }
      ];

      const validation = validateTicketPricing(tickets);
      
      expect(validation.isValid).toBe(true);
      expect(validation.zerotickets).toHaveLength(0);
      expect(validation.totalValue).toBe(235);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty ticket arrays', () => {
      const resolved = resolveTicketPrices([], eventTicketRecords, packageRecords);
      expect(resolved).toHaveLength(0);

      const expanded = expandPackagesWithPricing([], eventTicketRecords, packageRecords);
      expect(expanded).toHaveLength(0);

      const validation = validateTicketPricing([]);
      expect(validation.isValid).toBe(true);
      expect(validation.totalValue).toBe(0);
    });

    it('should handle malformed ticket IDs gracefully', () => {
      const ticketsFromStore = [
        {
          id: 'malformed-id', // No attendeeId prefix
          name: 'Malformed Ticket',
          price: 100,
          attendeeId: 'attendee-1',
          isPackage: false
        }
      ];

      const resolved = resolveTicketPrices(ticketsFromStore, eventTicketRecords, packageRecords);
      
      expect(resolved).toHaveLength(1);
      expect(resolved[0].price).toBe(100); // Falls back to store price
    });
  });

  describe('Integration Scenarios', () => {
    it('should correctly process mixed individual tickets and packages', () => {
      const ticketsFromStore = [
        // Individual ticket
        {
          id: 'ticket-123', // Direct ticket ID for testing
          name: 'Dinner Ticket',
          price: 0, // Wrong price
          attendeeId: 'attendee-1',
          isPackage: false,
          eventTicketId: 'ticket-123'
        },
        // Package that expands
        {
          id: 'package-789', // Direct package ID for testing
          name: 'Full Package',
          price: 0, // Wrong price
          attendeeId: 'attendee-2',
          isPackage: true
        }
      ];

      const expanded = expandPackagesWithPricing(ticketsFromStore, eventTicketRecords, packageRecords);
      
      expect(expanded).toHaveLength(3); // 1 individual + 2 from package expansion
      
      // Individual ticket
      expect(expanded[0].price).toBe(150);
      expect(expanded[0].isFromPackage).toBe(false);
      
      // Package expansion tickets
      expect(expanded[1].price).toBe(150); // Dinner from package
      expect(expanded[1].isFromPackage).toBe(true);
      expect(expanded[2].price).toBe(85); // Lunch from package
      expect(expanded[2].isFromPackage).toBe(true);

      const validation = validateTicketPricing(expanded);
      expect(validation.isValid).toBe(true);
      expect(validation.totalValue).toBe(385); // 150 + 150 + 85
    });
  });
});