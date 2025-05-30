import { createClient } from '@/utils/supabase/client';
import { RegistrationState, UnifiedAttendeeData, BillingDetailsType, PackageSelectionType } from '@/lib/registrationStore';
import { generateUUID } from '@/lib/uuid-slug-utils';

/**
 * Transform registration store data to RPC format
 */
export function transformToRPCRegistrationData(
  registrationData: RegistrationState,
  customerId: string,
  eventId: string,
  registrationId?: string,
  rawPayload?: any
) {
  // Map registration type to match database enum
  const registrationTypeMap: Record<string, string> = {
    'individual': 'individuals',
    'lodge': 'lodge',
    'delegation': 'delegation'
  };
  
  return {
    registration_id: registrationId || generateUUID(),
    customer_id: customerId,
    event_id: eventId || registrationData.eventId,
    registration_type: registrationData.registrationType ? (registrationTypeMap[registrationData.registrationType] || registrationData.registrationType) : 'individual',
    status: 'unpaid',
    payment_status: 'pending',
    total_amount_paid: 0,
    agree_to_terms: registrationData.agreeToTerms,
    registration_data: [rawPayload || {
      // Fallback: store the complete registration state if no raw payload provided
      ...registrationData,
      billingDetails: registrationData.billingDetails,
      draftId: registrationData.draftId,
      lodgeTicketOrder: registrationData.lodgeTicketOrder,
      registrationDate: new Date().toISOString()
    }]
  };
}

/**
 * Transform attendees to RPC format
 */
export function transformToRPCAttendeesData(attendees: UnifiedAttendeeData[], eventTitle?: string) {
  // Find primary attendee for useSameLodge inheritance
  const primaryAttendee = attendees.find(a => a.isPrimary);
  
  return attendees.map(attendee => {
    // Handle useSameLodge - inherit from primary attendee
    let finalGrandLodgeId = attendee.grand_lodge_id;
    let finalLodgeId = attendee.lodge_id;
    let finalLodgeNameNumber = attendee.lodgeNameNumber;
    
    if (attendee.useSameLodge && primaryAttendee && !attendee.isPrimary) {
      finalGrandLodgeId = primaryAttendee.grand_lodge_id || finalGrandLodgeId;
      finalLodgeId = primaryAttendee.lodge_id || finalLodgeId;
      finalLodgeNameNumber = primaryAttendee.lodgeNameNumber || finalLodgeNameNumber;
    }
    
    // Determine if contact details should be included based on preference
    const includeContactDetails = attendee.isPrimary || 
      attendee.contactPreference?.toLowerCase() === 'directly';
    
    // Map contact preference to lowercase
    const contactPreferenceMap: Record<string, string> = {
      'Directly': 'directly',
      'PrimaryAttendee': 'primaryattendee',
      'ProvideLater': 'providelater'
    };
    
    // For Mason: title is masonicTitle, suffix is rank or grand rank
    // For Guest: title is regular title, no suffix
    const isMason = attendee.attendeeType === 'Mason';
    const personTitle = isMason ? attendee.masonicTitle : attendee.title;
    const personSuffix = isMason ? (attendee.grandOfficerStatus === 'Past' ? attendee.presentGrandOfficerRole : attendee.rank) : attendee.suffix;
    
    const baseAttendeeData = {
      // Use snake_case as expected by the RPC function
      attendee_id: attendee.attendeeId,
      attendee_type: attendee.attendeeType.toLowerCase(), // 'mason' or 'guest'
      is_primary: attendee.isPrimary,
      is_partner: attendee.isPartner,
      has_partner: !!attendee.partner,
      dietary_requirements: attendee.dietaryRequirements || null,
      special_needs: attendee.specialNeeds || null,
      contact_preference: contactPreferenceMap[attendee.contactPreference || 'Directly'] || 'directly',
      relationship: attendee.relationship || null,
      related_attendee_id: attendee.partner || attendee.partnerOf || null,
      event_title: eventTitle || null,
      
      // Include contact info in attendee record
      title: personTitle || null,
      first_name: attendee.firstName,
      last_name: attendee.lastName,
      suffix: personSuffix || null,
      email: includeContactDetails ? (attendee.primaryEmail || null) : null,
      phone: includeContactDetails ? (attendee.primaryPhone || null) : null,
      
      person: {
        first_name: attendee.firstName,
        last_name: attendee.lastName,
        title: personTitle || null,
        suffix: personSuffix || null,
        primary_email: includeContactDetails ? (attendee.primaryEmail || null) : null,
        primary_phone: includeContactDetails ? (attendee.primaryPhone || null) : null,
        dietary_requirements: attendee.dietaryRequirements || null,
        special_needs: attendee.specialNeeds || null,
        has_partner: !!attendee.partner,
        is_partner: attendee.isPartner,
        relationship: attendee.relationship || null
      }
    };

    // Add Mason-specific data if applicable
    if (attendee.attendeeType === 'Mason') {
      // Map Grand Officer fields correctly
      let grandRank = null;
      let grandOfficer = null;
      let grandOffice = null;
      
      if (attendee.rank === 'GL' && attendee.grandOfficerStatus) {
        grandOfficer = attendee.grandOfficerStatus; // 'Present' or 'Past'
        
        if (attendee.grandOfficerStatus === 'Past' && attendee.presentGrandOfficerRole) {
          // For Past officers, the role goes in grand_rank
          grandRank = attendee.presentGrandOfficerRole;
        } else if (attendee.grandOfficerStatus === 'Present' && attendee.presentGrandOfficerRole) {
          // For Present officers
          if (attendee.presentGrandOfficerRole === 'Other' && attendee.otherGrandOfficerRole) {
            // Custom role goes in grand_office
            grandRank = attendee.otherGrandOfficerRole;
            grandOffice = attendee.otherGrandOfficerRole;
          } else {
            // Standard role goes in grand_rank and grand_office
            grandRank = attendee.presentGrandOfficerRole;
            grandOffice = attendee.presentGrandOfficerRole;
          }
        }
      }
      
      return {
        ...baseAttendeeData,
        masonic_profile: {
          rank: attendee.rank || null,
          masonic_title: attendee.masonicTitle || attendee.title || null, // Fall back to title if masonicTitle not set
          grand_rank: grandRank,
          grand_officer: grandOfficer,
          grand_office: grandOffice,
          notes: null // Always null as requested
        },
        // Lodge information (with inheritance if useSameLodge)
        grandlodge_org_id: finalGrandLodgeId || null,
        lodge_org_id: finalLodgeId || null,
        // Legacy fields for backward compatibility
        lodge_name_number: finalLodgeNameNumber || null
      };
    }

    return baseAttendeeData;
  });
}

/**
 * Transform packages/tickets to RPC format
 */
export function transformToRPCTicketsData(
  packages: Record<string, PackageSelectionType>,
  attendees: UnifiedAttendeeData[],
  ticketTypes: any[] = [],
  ticketPackages: any[] = []
) {
  const tickets: any[] = [];

  // Process each attendee's package selection
  Object.entries(packages).forEach(([attendeeId, selection]) => {
    if (!selection) return;

    if (selection.ticketDefinitionId) {
      // This is a package selection
      const packageInfo = ticketPackages.find(p => p.id === selection.ticketDefinitionId);
      
      tickets.push({
        attendee_id: attendeeId,
        event_ticket_id: selection.ticketDefinitionId,
        package_id: selection.ticketDefinitionId, // Store package ID
        ticket_type: 'package',
        quantity: 1,
        price_at_assignment: packageInfo?.price || 0,
        price_paid: packageInfo?.price || 0, // Also include price_paid for tickets table
        metadata: {
          package_name: packageInfo?.name || 'Package',
          package_description: packageInfo?.description || null
        }
      });
    } else if (selection.selectedEvents && selection.selectedEvents.length > 0) {
      // These are individual ticket selections
      selection.selectedEvents.forEach(ticketId => {
        const ticketInfo = ticketTypes.find(t => t.id === ticketId);
        
        tickets.push({
          attendee_id: attendeeId,
          event_ticket_id: ticketId,
          ticket_definition_id: ticketId, // Store ticket definition ID
          ticket_type: 'individual',
          quantity: 1,
          price_at_assignment: ticketInfo?.price || 0,
          price_paid: ticketInfo?.price || 0, // Also include price_paid for tickets table
          metadata: {
            ticket_name: ticketInfo?.name || 'Ticket',
            ticket_description: ticketInfo?.description || null
          }
        });
      });
    }
  });

  return tickets;
}

/**
 * Call the create_registration RPC function
 */
export async function createRegistrationViaRPC(
  registrationData: RegistrationState,
  customerId: string,
  eventId: string,
  ticketTypes: any[] = [],
  ticketPackages: any[] = [],
  rawPayload?: any,
  eventTitle?: string
) {
  try {
    const supabase = createClient();
    
    // Generate registration ID
    const registrationId = generateUUID();
    
    // Transform data to RPC format
    const rpcData = {
      registration_data: transformToRPCRegistrationData(
        registrationData,
        customerId,
        eventId,
        registrationId,
        rawPayload // Pass the complete raw payload for backup
      ),
      attendees_data: transformToRPCAttendeesData(registrationData.attendees, eventTitle),
      tickets_data: transformToRPCTicketsData(
        registrationData.packages,
        registrationData.attendees,
        ticketTypes,
        ticketPackages
      )
    };

    console.log('📝 RPC Registration Data:', JSON.stringify(rpcData, null, 2));

    // Call RPC function
    const { data, error } = await supabase.rpc('create_registration', rpcData);

    if (error) {
      console.error('❌ RPC Error:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to create registration',
        registrationId: null 
      };
    }

    // Parse RPC response
    const result = data as any;
    
    if (!result.success) {
      console.error('❌ RPC returned error:', result);
      return {
        success: false,
        error: result.error || 'Registration creation failed',
        detail: result.detail,
        registrationId: null
      };
    }

    console.log('✅ RPC Success:', result);

    // Use confirmation number from database (auto-generated by trigger) or fallback
    const confirmationNumber = result.confirmation_number || 
                             result.registration?.confirmation_number ||
                             `REG-${registrationId.substring(0, 8).toUpperCase()}`;

    return {
      success: true,
      registrationId: result.registration_id || registrationId,
      confirmationNumber,
      registrationData: result.registration_data || result,
      attendeeResults: result.attendees_created,
      ticketResults: result.tickets_created,
      error: null
    };

  } catch (error: any) {
    console.error('❌ RPC Exception:', error);
    return {
      success: false,
      error: error.message || 'An unexpected error occurred',
      registrationId: null
    };
  }
}

/**
 * Feature flag to control RPC usage
 */
export const USE_RPC_REGISTRATION = process.env.NEXT_PUBLIC_USE_RPC_REGISTRATION === 'true';