/**
 * Ticket Price Resolver Utility
 * 
 * Ensures that tickets inherit correct prices from event_tickets records
 * when being created from Zustand store selections.
 */

export interface TicketWithPrice {
  id: string;
  name: string;
  price: number;
  attendeeId: string;
  eventTicketId: string;
  isPackage?: boolean;
  isFromPackage?: boolean;
  packageId?: string;
  packageName?: string;
  description?: string;
}

export interface EventTicketRecord {
  id: string;
  name: string;
  price: number;
  description?: string;
  event_id: string;
  function_id: string;
}

export interface PackageRecord {
  id: string;
  name: string;
  price: number;
  description?: string;
  includes?: string[]; // Array of event ticket IDs
}

/**
 * Resolves ticket prices from event_tickets records
 * This ensures tickets get the correct price from the database, not from the Zustand store
 */
export function resolveTicketPrices(
  ticketsFromStore: Array<{
    id: string;
    name: string;
    price: number;
    attendeeId: string;
    isPackage?: boolean;
    eventTicketId?: string;
  }>,
  eventTickets: EventTicketRecord[],
  packages: PackageRecord[]
): TicketWithPrice[] {
  
  console.log('🎯 Resolving ticket prices:', {
    ticketsFromStoreCount: ticketsFromStore.length,
    eventTicketsCount: eventTickets.length,
    packagesCount: packages.length,
    ticketsFromStore: ticketsFromStore.map(t => ({ 
      id: t.id, 
      name: t.name, 
      storePice: t.price, 
      isPackage: t.isPackage 
    })),
    eventTicketPrices: eventTickets.map(et => ({ 
      id: et.id, 
      name: et.name, 
      price: et.price 
    })),
    packagePrices: packages.map(p => ({ 
      id: p.id, 
      name: p.name, 
      price: p.price 
    }))
  });

  return ticketsFromStore.map(ticket => {
    let resolvedPrice = ticket.price; // Fallback to store price
    let eventTicketId = ticket.eventTicketId || ticket.id.split('-').slice(1).join('-');
    
    if (ticket.isPackage) {
      // For packages, get price from package records
      // Handle both formats: "attendee-1-package-789" and "package-789"
      let packageId;
      if (ticket.id.includes('-') && ticket.id.split('-').length > 2) {
        packageId = ticket.id.split('-').slice(1).join('-'); // Remove attendeeId prefix
      } else {
        packageId = ticket.id; // Already just the package ID
      }
      
      const packageRecord = packages.find(p => p.id === packageId);
      
      if (packageRecord) {
        resolvedPrice = packageRecord.price;
        console.log(`🎯 ✅ Resolved package price: ${ticket.name} = $${resolvedPrice} (was $${ticket.price})`);
      } else {
        console.warn(`🎯 ❌ Package not found for ID: ${packageId}`);
      }
    } else {
      // For individual tickets, get price from event_tickets records
      // Handle both formats: "attendee-1-ticket-123" and "ticket-123"
      if (ticket.id.includes('-') && ticket.id.split('-').length > 2) {
        eventTicketId = ticket.id.split('-').slice(1).join('-');
      } else if (ticket.eventTicketId) {
        eventTicketId = ticket.eventTicketId;
      } else {
        eventTicketId = ticket.id;
      }
      
      const eventTicket = eventTickets.find(et => et.id === eventTicketId);
      
      if (eventTicket) {
        resolvedPrice = eventTicket.price;
        console.log(`🎯 ✅ Resolved event ticket price: ${ticket.name} = $${resolvedPrice} (was $${ticket.price})`);
      } else {
        console.warn(`🎯 ❌ Event ticket not found for ID: ${eventTicketId}`);
        console.warn(`🎯 Available event ticket IDs:`, eventTickets.map(et => et.id));
      }
    }
    
    return {
      id: ticket.id,
      name: ticket.name,
      price: resolvedPrice, // Use resolved price from database
      attendeeId: ticket.attendeeId,
      eventTicketId: eventTicketId,
      isPackage: ticket.isPackage || false,
      isFromPackage: false, // This will be set by package expansion logic
      description: ticket.name
    };
  });
}

/**
 * Enhanced package expansion that preserves pricing from database records
 */
export function expandPackagesWithPricing(
  ticketsFromStore: Array<any>,
  eventTickets: EventTicketRecord[],
  packages: PackageRecord[]
): TicketWithPrice[] {
  const expandedTickets: TicketWithPrice[] = [];
  
  console.log('🎯 Expanding packages with pricing:', {
    ticketsFromStoreCount: ticketsFromStore.length,
    eventTicketsCount: eventTickets.length,
    packagesCount: packages.length
  });
  
  ticketsFromStore.forEach(ticket => {
    if (ticket.isPackage) {
      // Find the package info
      // Handle both formats: "attendee-1-package-789" and "package-789"
      let packageId;
      if (ticket.id.includes('-') && ticket.id.split('-').length > 2) {
        packageId = ticket.id.split('-').slice(1).join('-'); // Remove attendeeId prefix
      } else {
        packageId = ticket.id; // Already just the package ID
      }
      
      const packageInfo = packages.find(p => p.id === packageId);
      
      if (packageInfo) {
        if (packageInfo.includes && packageInfo.includes.length > 0) {
          // Expand package into individual tickets with correct pricing
          packageInfo.includes.forEach(eventTicketId => {
            const eventTicket = eventTickets.find(et => et.id === eventTicketId);
            
            if (eventTicket) {
              expandedTickets.push({
                id: `${ticket.attendeeId}-${eventTicket.id}`,
                name: eventTicket.name,
                price: eventTicket.price, // ✅ Use price from event_tickets record
                attendeeId: ticket.attendeeId,
                eventTicketId: eventTicket.id,
                isPackage: false,
                isFromPackage: true,
                packageId: packageInfo.id,
                packageName: packageInfo.name,
                description: eventTicket.description || eventTicket.name
              });
              
              console.log(`🎯 ✅ Expanded package ticket: ${eventTicket.name} = $${eventTicket.price} (from package ${packageInfo.name})`);
            } else {
              console.warn(`🎯 ❌ Event ticket ${eventTicketId} not found for package ${packageInfo.name}`);
            }
          });
        } else {
          // Package as single item with package pricing
          expandedTickets.push({
            id: ticket.id,
            name: packageInfo.name,
            price: packageInfo.price, // ✅ Use price from package record
            attendeeId: ticket.attendeeId,
            eventTicketId: packageInfo.id,
            isPackage: true,
            isFromPackage: false,
            packageId: packageInfo.id,
            packageName: packageInfo.name,
            description: packageInfo.description || packageInfo.name
          });
          
          console.log(`🎯 ✅ Added package as single ticket: ${packageInfo.name} = $${packageInfo.price}`);
        }
      } else {
        console.warn(`🎯 ❌ Package not found for ID: ${packageId}`);
      }
    } else {
      // Individual ticket - resolve price from event_tickets
      // Handle both formats: "attendee-1-ticket-123" and "ticket-123"
      let eventTicketId;
      if (ticket.id.includes('-') && ticket.id.split('-').length > 2) {
        eventTicketId = ticket.id.split('-').slice(1).join('-');
      } else if (ticket.eventTicketId) {
        eventTicketId = ticket.eventTicketId;
      } else {
        eventTicketId = ticket.id;
      }
      
      const eventTicket = eventTickets.find(et => et.id === eventTicketId);
      
      if (eventTicket) {
        expandedTickets.push({
          id: ticket.id,
          name: eventTicket.name,
          price: eventTicket.price, // ✅ Use price from event_tickets record
          attendeeId: ticket.attendeeId,
          eventTicketId: eventTicket.id,
          isPackage: false,
          isFromPackage: false,
          description: eventTicket.description || eventTicket.name
        });
        
        console.log(`🎯 ✅ Added individual ticket: ${eventTicket.name} = $${eventTicket.price}`);
      } else {
        console.warn(`🎯 ❌ Event ticket not found for ID: ${eventTicketId}`);
        // Fallback: use ticket as-is but log the issue
        expandedTickets.push({
          id: ticket.id,
          name: ticket.name,
          price: ticket.price || 0,
          attendeeId: ticket.attendeeId,
          eventTicketId: eventTicketId,
          isPackage: false,
          isFromPackage: false,
          description: ticket.name
        });
      }
    }
  });
  
  const totalPrice = expandedTickets.reduce((sum, t) => sum + t.price, 0);
  console.log(`🎯 📊 Package expansion complete:`, {
    originalTickets: ticketsFromStore.length,
    expandedTickets: expandedTickets.length,
    totalPrice: totalPrice,
    ticketBreakdown: expandedTickets.map(t => ({ 
      name: t.name, 
      price: t.price, 
      isFromPackage: t.isFromPackage 
    }))
  });
  
  return expandedTickets;
}

/**
 * Validates that all tickets have non-zero prices
 */
export function validateTicketPricing(tickets: TicketWithPrice[]): {
  isValid: boolean;
  zerotickets: TicketWithPrice[];
  totalValue: number;
} {
  const zeroTickets = tickets.filter(t => t.price === 0);
  const totalValue = tickets.reduce((sum, t) => sum + t.price, 0);
  
  if (zeroTickets.length > 0) {
    console.error('🎯 ❌ Found tickets with $0 price:', zeroTickets.map(t => ({
      id: t.id,
      name: t.name,
      attendeeId: t.attendeeId,
      eventTicketId: t.eventTicketId
    })));
  }
  
  return {
    isValid: zeroTickets.length === 0,
    zerotickets: zeroTickets,
    totalValue
  };
}