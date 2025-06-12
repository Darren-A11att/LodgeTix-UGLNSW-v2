import { formatCurrency } from '@/lib/formatters';
import type { 
  AttendeeSelectionSummary, 
  OrderSummary,
  LodgeBulkSelection 
} from '@/lib/registration-metadata-types';

interface EnhancedTicketSummaryDataProps {
  attendeeSelections: Record<string, AttendeeSelectionSummary>;
  orderSummary: OrderSummary | null;
  lodgeBulkSelection: LodgeBulkSelection | null;
  attendees: any[]; // For backward compatibility
}

/**
 * Enhanced ticket summary data generator that reads from the new metadata structure
 * This will eventually replace the legacy ticket-summary-data.ts
 */
export function getEnhancedTicketSummaryData({ 
  attendeeSelections, 
  orderSummary,
  lodgeBulkSelection,
  attendees
}: EnhancedTicketSummaryDataProps) {
  const sections = [];
  
  // Handle lodge bulk orders
  if (lodgeBulkSelection && orderSummary?.registrationType === 'lodge') {
    const lodgeItems = [];
    
    // Add attendee count info
    lodgeItems.push({
      label: 'Total Attendees',
      value: `${orderSummary.totalAttendees} people`
    });
    
    // Add package info
    if (lodgeBulkSelection.packageMetadata) {
      lodgeItems.push({
        label: lodgeBulkSelection.packageMetadata.name,
        value: formatCurrency(lodgeBulkSelection.subtotal)
      });
      
      // Show what's included in the package
      if (lodgeBulkSelection.packageMetadata.includesDescription?.length > 0) {
        lodgeBulkSelection.packageMetadata.includesDescription.forEach(desc => {
          lodgeItems.push({
            label: `  • ${desc}`,
            value: 'Included',
            isSubItem: true
          });
        });
      }
    }
    
    sections.push({
      title: `Lodge Order (${lodgeBulkSelection.quantity} tickets)`,
      items: lodgeItems
    });
  } else {
    // Handle individual attendee selections
    const attendeeSummaries = Object.values(attendeeSelections);
    
    if (attendeeSummaries.length === 0 && attendees.length > 0) {
      // Show attendees who need tickets
      const attendeeItems = attendees.map(attendee => {
        const name = `${attendee.firstName || ''} ${attendee.lastName || ''}`.trim() || 'Unnamed Attendee';
        const type = attendee.attendeeType || 'guest';
        return {
          label: name,
          value: `${type} - No tickets selected`
        };
      });
      
      sections.push({
        title: 'Attendees Requiring Tickets',
        items: attendeeItems
      });
    } else {
      // Show selections for each attendee
      attendeeSummaries.forEach(summary => {
        const items = [];
        
        // Add packages
        summary.packages.forEach(pkg => {
          items.push({
            label: pkg.package.name,
            value: formatCurrency(pkg.subtotal),
            isPackage: true
          });
          
          // Show included tickets
          pkg.package.includedTicketNames?.forEach(ticketName => {
            items.push({
              label: `  • ${ticketName}`,
              value: 'Included',
              isSubItem: true
            });
          });
        });
        
        // Add individual tickets
        summary.individualTickets.forEach(ticket => {
          items.push({
            label: ticket.ticket.name,
            value: formatCurrency(ticket.subtotal)
          });
        });
        
        // Add attendee subtotal
        if (items.length > 0) {
          items.push({
            label: 'Subtotal',
            value: formatCurrency(summary.attendeeSubtotal),
            isHighlight: true
          });
          
          sections.push({
            title: summary.attendeeName || 'Unknown Attendee',
            items
          });
        }
      });
    }
  }
  
  // Add order total section with comprehensive pricing
  if (orderSummary && sections.length > 0) {
    const totalItems = [];
    
    // Subtotal
    totalItems.push({
      label: 'Subtotal',
      value: formatCurrency(orderSummary.subtotal)
    });
    
    // Processing fees if applicable
    if (orderSummary.processingFees > 0) {
      totalItems.push({
        label: 'Processing Fees',
        value: formatCurrency(orderSummary.processingFees)
      });
    }
    
    // Total
    totalItems.push({
      label: 'Total',
      value: formatCurrency(orderSummary.totalAmount),
      isHighlight: true
    });
    
    sections.push({
      title: 'Order Summary',
      items: totalItems
    });
  }
  
  // Build footer message
  let footer = null;
  if (orderSummary) {
    const ticketCount = orderSummary.totalTickets;
    const attendeeCount = orderSummary.totalAttendees;
    
    if (orderSummary.registrationType === 'lodge' && lodgeBulkSelection) {
      footer = `${ticketCount} tickets for ${attendeeCount} lodge members`;
    } else if (ticketCount > 0) {
      footer = `${ticketCount} ticket${ticketCount !== 1 ? 's' : ''} for ${attendeeCount} attendee${attendeeCount !== 1 ? 's' : ''}`;
    }
  }
  
  return {
    sections,
    footer,
    emptyMessage: attendees.length === 0 ? 'No attendees added yet' : 'No tickets selected yet',
    orderSummary
  };
}