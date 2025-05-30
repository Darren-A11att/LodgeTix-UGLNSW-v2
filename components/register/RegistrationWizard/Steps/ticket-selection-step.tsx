"use client"

import { useState, useEffect } from "react"
import { useRegistrationStore } from '../../../../lib/registrationStore'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Package, Check, User, UserPlus, ShoppingCart, XCircle, ChevronLeft, ChevronRight, Loader2, Users } from "lucide-react"
import type { Attendee, Ticket, MasonAttendee, GuestAttendee, PartnerAttendee } from "@/lib/registration-types"
import { v7 as uuidv7 } from "uuid"
import { SectionHeader } from "../Shared/SectionHeader"
import { AlertModal } from "@/components/ui/alert-modal"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { TwoColumnStepLayout } from "../Layouts/TwoColumnStepLayout"
import { getTicketSummaryData } from '../Summary/summary-data/ticket-summary-data';
import { SummaryRenderer } from '../Summary/SummaryRenderer';
import { type TicketDefinition, type EventPackage, getEventTicketsService } from '@/lib/services/event-tickets-service'
import { api } from '@/lib/api-logger'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ValidationModal } from '@/components/ui/validation-modal'
import { calculateStripeFees, getFeeModeFromEnv, getFeeDisclaimer } from '@/lib/utils/stripe-fee-calculator'
import { Info } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useTicketAvailability } from '@/hooks/use-ticket-availability'
import { ConnectionStatus } from '@/components/ui/connection-status'
import { TicketAvailabilityIndicator, TicketAvailabilityBadge } from '@/components/ui/ticket-availability-indicator'
import { useToast } from '@/hooks/use-toast'
import { RealtimeErrorBoundary } from '@/components/ui/realtime-error-boundary'

// Define AttendeeType for eligibility checking, leveraging existing types
export type AttendeeType = Attendee['type'];

// Remove hardcoded parent event ID - we should always use the eventId from props/store

const TicketSelectionStep: React.FC = () => {
  const allStoreAttendees = useRegistrationStore((s) => s.attendees);
  const updateAttendeeStore = useRegistrationStore((s) => s.updateAttendee);
  const updatePackageSelection = useRegistrationStore((s) => s.updatePackageSelection);
  const packages = useRegistrationStore((s) => s.packages);
  const eventId = useRegistrationStore((s) => s.eventId);
  const registrationType = useRegistrationStore((s) => s.registrationType);
  const lodgeTicketOrder = useRegistrationStore((s) => s.lodgeTicketOrder);

  // State for dynamic ticket and package data
  const [ticketTypes, setTicketTypes] = useState<TicketDefinition[]>([])
  const [ticketPackages, setTicketPackages] = useState<EventPackage[]>([])
  const [isLoadingTickets, setIsLoadingTickets] = useState(true)
  const [ticketsError, setTicketsError] = useState<string | null>(null)
  const { toast } = useToast()
  
  // Real-time ticket availability
  const { 
    availability: realtimeAvailability, 
    isConnected, 
    connectionStatus,
    getTicketAvailability,
    isTicketAvailable 
  } = useTicketAvailability(eventId, {
    enabled: true,
    onLowStock: (ticketName, available) => {
      toast({
        title: "Low Stock Alert",
        description: `${ticketName} - only ${available} tickets left!`,
        variant: "warning"
      })
    },
    onSoldOut: (ticketName) => {
      toast({
        title: "Sold Out",
        description: `${ticketName} is now sold out`,
        variant: "destructive"
      })
    }
  })

  // Fetch tickets and packages on component mount
  useEffect(() => {
    async function fetchTicketsAndPackages() {
      try {
        setIsLoadingTickets(true)
        setTicketsError(null)
        
        // Always use the eventId from the store - it should be set from the route
        if (!eventId) {
          throw new Error('Event ID is required for ticket selection')
        }
        const targetEventId = eventId
        
        api.debug(`Fetching tickets for event: ${targetEventId}`)
        
        // Use the EventTicketsService to fetch tickets and packages
        const ticketsService = getEventTicketsService()
        const { tickets, packages } = await ticketsService.getEventTicketsAndPackages(targetEventId)
        
        // The service already returns data in the correct format
        setTicketTypes(tickets)
        setTicketPackages(packages)
        
        api.debug(`Loaded ${tickets.length} tickets and ${packages.length} packages`)
      } catch (error) {
        console.error('Full error details:', error)
        api.error('Error fetching tickets and packages:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          error: JSON.stringify(error, null, 2)
        })
        setTicketsError('Failed to load ticket options. Please try again.')
      } finally {
        setIsLoadingTickets(false)
      }
    }
    
    fetchTicketsAndPackages()
  }, [eventId])


  const primaryAttendee = allStoreAttendees.find(a => a.isPrimary) as unknown as MasonAttendee | GuestAttendee | undefined;
  const additionalAttendees = allStoreAttendees.filter(a => !a.isPrimary) as unknown as (MasonAttendee | GuestAttendee | PartnerAttendee)[];

  // --- Derive currentTickets for UI display from store state ---
  const derivedCurrentTickets: Ticket[] = (() => {
    // For lodge bulk orders, create tickets based on bulk selection
    if (registrationType === 'lodge' && lodgeTicketOrder && packages['lodge-bulk']) {
      const bulkSelection = packages['lodge-bulk'];
      const tickets: Ticket[] = [];
      
      if (bulkSelection.ticketDefinitionId) {
        const packageInfo = ticketPackages.find(p => p.id === bulkSelection.ticketDefinitionId);
        if (packageInfo) {
          // Create a bulk ticket for the package
          tickets.push({
            id: `lodge-bulk-${packageInfo.id}`,
            name: `${packageInfo.name} × ${lodgeTicketOrder.totalTickets} attendees`,
            price: packageInfo.price * lodgeTicketOrder.totalTickets,
            description: packageInfo.description || "",
            attendeeId: 'lodge-bulk',
            isPackage: true,
            includedTicketTypes: packageInfo.includes,
          });
        }
      } else if (bulkSelection.selectedEvents && bulkSelection.selectedEvents.length > 0) {
        // Create bulk tickets for individual selections
        bulkSelection.selectedEvents.forEach(eventId => {
          const ticketTypeInfo = ticketTypes.find(t => t.id === eventId);
          if (ticketTypeInfo) {
            tickets.push({
              id: `lodge-bulk-${ticketTypeInfo.id}`,
              name: `${ticketTypeInfo.name} × ${lodgeTicketOrder.totalTickets} attendees`,
              price: ticketTypeInfo.price * lodgeTicketOrder.totalTickets,
              description: ticketTypeInfo.description || "",
              attendeeId: 'lodge-bulk',
              isPackage: false,
            });
          }
        });
      }
      
      return tickets;
    }
    
    // Original logic for individual attendees
    return allStoreAttendees.flatMap((attendee) => {
    const attendeeIdentifier = (attendee as any).attendeeId;
    if (!attendeeIdentifier) return [];

    const selection = packages[attendeeIdentifier];

    if (selection?.ticketDefinitionId) { 
      const packageInfo = ticketPackages.find(p => p.id === selection.ticketDefinitionId);
      if (packageInfo) {
        // For UI display, show the package as a single item
        const derivedPackageTicket = {
          id: packageInfo.id, 
          name: packageInfo.name,
          price: packageInfo.price,
          description: packageInfo.description || "",
          attendeeId: attendeeIdentifier,
          isPackage: true,
          includedTicketTypes: packageInfo.includes,
        };
        return [derivedPackageTicket];
      }
    } else if (selection?.selectedEvents && selection.selectedEvents.length > 0) { 
      const individualTickets = selection.selectedEvents.map((eventId: string) => {
        const ticketTypeInfo = ticketTypes.find(t => t.id === eventId);
        if (ticketTypeInfo) {
          const derivedIndividualTicket = {
            id: `${attendeeIdentifier}-${ticketTypeInfo.id}`, 
            name: ticketTypeInfo.name,
            price: ticketTypeInfo.price,
            description: ticketTypeInfo.description || "",
            attendeeId: attendeeIdentifier,
            isPackage: false,
          };
          return derivedIndividualTicket;
        }
        return null;
      }).filter(Boolean) as Ticket[];
      return individualTickets;
    }
    return [];
    });
  })();

  // Main log for the tickets processed for UI rendering

  const currentTickets = derivedCurrentTickets;

  const goToNextStep = useRegistrationStore((s) => s.goToNextStep);
  const goToPrevStep = useRegistrationStore((s) => s.goToPrevStep);

  // Alert modal state
  const [alertModalOpen, setAlertModalOpen] = useState(false)
  const [alertModalData, setAlertModalData] = useState({
    title: "",
    description: "",
    variant: "default" as "default" | "destructive" | "success" | "warning"
  })
  
  // Validation modal state
  const [showValidationModal, setShowValidationModal] = useState(false)
  const [validationErrors, setValidationErrors] = useState<{ field: string; message: string }[]>([])

  const [expandedAttendee, setExpandedAttendee] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<string>('same-for-all')

  // Create a helper function to order attendees so partners appear after their associated Mason or Guest
  const getOrderedAttendees = (primary: MasonAttendee | GuestAttendee | undefined, additional: (MasonAttendee | GuestAttendee | PartnerAttendee)[], all: any[]): Attendee[] => {
    const ordered: Attendee[] = [];
    
    // Add primary attendee first if it exists
    if (primary) {
      ordered.push(primary as Attendee);
      
      // If primary attendee has a partner, add it immediately after
      if ((primary as any).partner) {
        const primaryPartner = additional.find(att => (att as any).attendeeId === (primary as any).partner);
        if (primaryPartner) {
          ordered.push(primaryPartner as Attendee);
        }
      }
    }
    
    // For remaining attendees, add each one followed by their partner if they have one
    const remainingAttendees = additional.filter(att => {
      // Skip attendees that are partners of others (they'll be added with their related attendee)
      if ((att as any).isPartner && ((att as any).attendeeId === (primary as any)?.partner || 
          additional.some(otherAtt => (otherAtt as any).partner === (att as any).attendeeId))) {
        return false;
      }
      // Skip primary's partner as it's already added
      if (primary && (primary as any).partner === (att as any).attendeeId) {
        return false;
      }
      return true;
    });
    
    // Add each remaining attendee followed by their partner
    for (const attendee of remainingAttendees) {
      ordered.push(attendee as Attendee);
      
      // If this attendee has a partner, add it immediately after
      if ((attendee as any).partner) {
        const partner = all.find(att => (att as any).attendeeId === (attendee as any).partner);
        if (partner) {
          ordered.push(partner as Attendee);
        }
      }
    }
    
    return ordered;
  };
  
  // Use the helper function to order attendees
  const allAttendees: Attendee[] = getOrderedAttendees(primaryAttendee, additionalAttendees, allStoreAttendees);
  
  // Filter out partner attendees as they don't need separate tickets
  const eligibleAttendees = allAttendees;

  const showAlert = (title: string, description: string, variant: "default" | "destructive" | "success" | "warning" = "default") => {
    setAlertModalData({ title, description, variant })
    setAlertModalOpen(true)
  }

  const handlePrevious = () => {
    goToPrevStep();
  }

  const ensureAllAttendeesHaveTickets = (): boolean => {
    if (eligibleAttendees.length === 0) {
      return false; 
    }
    return eligibleAttendees.every(attendee => getAttendeeTickets((attendee as any).attendeeId).length > 0);
  };

  const handleContinue = () => {
    // For lodge registrations with bulk orders, skip individual ticket validation
    if (registrationType === 'lodge' && lodgeTicketOrder) {
      // Check if any tickets are selected
      const hasSelection = packages['lodge-bulk']?.ticketDefinitionId || 
        (packages['lodge-bulk']?.selectedEvents && packages['lodge-bulk'].selectedEvents.length > 0);
      
      if (hasSelection) {
        goToNextStep();
      } else {
        // Show validation modal for lodge bulk orders
        setValidationErrors([
          { field: "Ticket Selection", message: "Please select at least one ticket or package for your lodge members" }
        ]);
        setShowValidationModal(true);
      }
      return;
    }
    
    if (ensureAllAttendeesHaveTickets()) {
      goToNextStep();
    } else {
      // Build list of attendees without tickets
      const attendeesWithoutTickets = eligibleAttendees
        .filter(attendee => getAttendeeTickets((attendee as any).attendeeId).length === 0)
        .map(attendee => ({
          field: `${attendee.firstName} ${attendee.lastName}`,
          message: "Requires at least one ticket or package selection"
        }));
      
      setValidationErrors(attendeesWithoutTickets);
      setShowValidationModal(true);
    }
  }

  const getAttendeeTickets = (attendeeIdentifier: string) => {
    return currentTickets.filter((ticket) => ticket.attendeeId === attendeeIdentifier)
  }

  const getAttendeeTicketTotal = (attendeeIdentifier: string) => {
    return getAttendeeTickets(attendeeIdentifier).reduce((sum, ticket) => sum + ticket.price, 0)
  }

  const isIndividualTicketDirectlySelected = (attendeeIdentifier: string, ticketTypeId: string) => {
    const packageSelection = packages[attendeeIdentifier];
    const isSelected = !packageSelection?.ticketDefinitionId && (packageSelection?.selectedEvents || []).includes(ticketTypeId);
    return isSelected;
  };
  

  const handleSelectPackage = (attendeeIdentifier: string, packageId: string) => {
    const selectedPackageInfo = ticketPackages.find((p) => p.id === packageId);
    if (!selectedPackageInfo) return;

    const attendee = allStoreAttendees.find(a => (a as any).attendeeId === attendeeIdentifier);
    if (!attendee) return;

    const isCurrentlySelected = packages[attendeeIdentifier]?.ticketDefinitionId === packageId;

    if (isCurrentlySelected) {
      // Deselect package
      updatePackageSelection(attendeeIdentifier, { 
        ticketDefinitionId: null, 
        selectedEvents: [] 
      });
    } else {
      // Select package
      updatePackageSelection(attendeeIdentifier, { 
        ticketDefinitionId: packageId, 
        selectedEvents: selectedPackageInfo.includes // Store included events for clarity/consistency
      });
    }
  };

  const handleToggleIndividualTicket = (attendeeIdentifier: string, ticketTypeId: string) => {
    const ticketTypeInfo = ticketTypes.find((t) => t.id === ticketTypeId);
    if (!ticketTypeInfo) return;

    const attendee = allStoreAttendees.find(a => (a as any).attendeeId === attendeeIdentifier);
    if (!attendee) return;

    const currentSelection = packages[attendeeIdentifier] || { ticketDefinitionId: null, selectedEvents: [] };
    
    // If the attendee currently has a package selected, we need to start with an empty selection
    // Otherwise, copy the current individual selections
    let newSelectedEvents = currentSelection.ticketDefinitionId 
      ? [] // Start fresh with no selected events if switching from package to individual
      : [...currentSelection.selectedEvents];

    const isCurrentlySelected = !currentSelection.ticketDefinitionId && newSelectedEvents.includes(ticketTypeId);

    if (isCurrentlySelected) {
      // Deselect individual ticket
      newSelectedEvents = newSelectedEvents.filter(id => id !== ticketTypeId);
    } else {
      // If switching from package to individual, select only this ticket
      // Otherwise, add this ticket to existing selections
      if (currentSelection.ticketDefinitionId) {
        newSelectedEvents = [ticketTypeId]; // Only this ticket when switching from package
      } else if (!newSelectedEvents.includes(ticketTypeId)) {
        newSelectedEvents.push(ticketTypeId); // Add to existing individual selections
      }
    }
    
    // Selecting an individual ticket always clears any package
    updatePackageSelection(attendeeIdentifier, { 
      ticketDefinitionId: null, 
      selectedEvents: newSelectedEvents 
    });
  };

  const isPackageSelectedForAttendee = (attendeeIdentifier: string, packageName: string) => {
    const packageInfo = ticketPackages.find(p => p.name === packageName);
    if (!packageInfo) return false;
    const packageSelection = packages[attendeeIdentifier];
    const isSelected = packageSelection?.ticketDefinitionId === packageInfo.id;
    return isSelected;
  };

  const renderAttendeeHeader = (attendee: any) => {
    const attendeeType = attendee.attendeeType?.toLowerCase() || '';
    
    if (attendeeType === "mason") {
      const mason = attendee as MasonAttendee
      return (
        <div className="flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-masonic-navy" />
          <span>
            {mason.title} {mason.firstName} {mason.lastName}
            <span className="ml-2 text-sm text-gray-500">{mason.grandRank || mason.rank}</span>
          </span>
        </div>
      )
    } else {
      const person = attendee as GuestAttendee | PartnerAttendee
      return (
        <div className="flex items-center gap-2">
          <User className="h-5 w-5 text-masonic-navy" />
          <span>
            {person.title} {person.firstName} {person.lastName}
            {/* Only show rank for Mason attendees, not for any partner types */}
          </span>
        </div>
      )
    }
  }

  // Calculate the total order amount
  const orderTotalAmount = currentTickets.reduce((sum, ticket) => sum + ticket.price, 0);
  
  // For lodge registrations, check if bulk selection has been made
  const hasLodgeBulkSelection = registrationType === 'lodge' && lodgeTicketOrder && 
    (packages['lodge-bulk']?.ticketDefinitionId || 
     (packages['lodge-bulk']?.selectedEvents && packages['lodge-bulk'].selectedEvents.length > 0));

  // Render summary content for right column - using simplified component
  const renderSummaryContent = () => {
    // For lodge bulk orders, show different summary
    if (registrationType === 'lodge' && lodgeTicketOrder) {
      const summaryData = getTicketSummaryData({
        currentTickets,
        orderTotalAmount,
        attendees: allStoreAttendees,
        lodgeTicketOrder // Pass lodge order info
      });
      
      return <SummaryRenderer {...summaryData} />;
    }
    
    const summaryData = getTicketSummaryData({
      currentTickets,
      orderTotalAmount,
      attendees: allStoreAttendees
    });
    
    return <SummaryRenderer {...summaryData} />;
  };

  // Show loading state
  if (isLoadingTickets) {
    return (
      <TwoColumnStepLayout
        summaryContent={<div className="animate-pulse">Loading ticket information...</div>}
        summaryTitle="Step Summary"
        currentStep={3}
        totalSteps={6}
        stepName="Ticket Selection"
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-masonic-navy" />
            <p className="text-gray-600">Loading available tickets and packages...</p>
          </div>
        </div>
      </TwoColumnStepLayout>
    );
  }

  // Show error state
  if (ticketsError) {
    return (
      <TwoColumnStepLayout
        summaryContent={<div className="text-red-600">Error loading tickets</div>}
        summaryTitle="Step Summary"
        currentStep={3}
        totalSteps={6}
        stepName="Ticket Selection"
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <XCircle className="h-8 w-8 mx-auto mb-4 text-red-600" />
            <p className="text-red-600 mb-4">{ticketsError}</p>
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()}
              className="border-masonic-navy text-masonic-navy"
            >
              Try Again
            </Button>
          </div>
        </div>
      </TwoColumnStepLayout>
    );
  }

  // For lodge registrations, render tabbed interface
  if (registrationType === 'lodge') {
    // Create placeholder attendees based on lodge ticket order if not already created
    const attendeeCount = lodgeTicketOrder?.totalTickets || 0;
    
    // If no attendees but we have a lodge order, we're in bulk order mode
    const isBulkMode = attendeeCount > 0 && allStoreAttendees.length === 1;
    
    return (
      <TwoColumnStepLayout
        summaryContent={renderSummaryContent()}
        summaryTitle="Step Summary"
        currentStep={3}
        totalSteps={6}
        stepName="Ticket Selection"
      >
        <div className="space-y-6">
          {/* Connection status indicator */}
          {isConnected && (
            <div className="flex justify-end -mt-4 mb-4">
              <ConnectionStatus status={connectionStatus} showText={true} size="sm" />
            </div>
          )}
          
          {/* Show lodge order info */}
          {lodgeTicketOrder && (
            <Alert className="border-blue-200 bg-blue-50">
              <AlertDescription>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>
                    Selecting tickets for {lodgeTicketOrder?.tableCount || 0} table{(lodgeTicketOrder?.tableCount || 0) > 1 ? 's' : ''} 
                    ({lodgeTicketOrder?.totalTickets || 0} attendees total)
                  </span>
                </div>
              </AlertDescription>
            </Alert>
          )}
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="same-for-all">Same Tickets for All</TabsTrigger>
              <TabsTrigger value="individual" disabled={isBulkMode}>
                Individual Tickets {isBulkMode && "(Attendee details required)"}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="same-for-all" className="space-y-6 mt-6">
              {/* Same Tickets for All tab content */}
              <div className="space-y-4">
                <div className="text-sm text-gray-600 mb-4">
                  Select packages or individual tickets that will be applied to all {lodgeTicketOrder?.totalTickets || 0} attendees.
                </div>
                
                {/* Package options */}
                <div>
                  <h3 className="font-semibold text-masonic-navy mb-3">Ticket Packages</h3>
                  <div className="grid gap-4 md:grid-cols-3">
                    {ticketPackages
                      .filter(pkg => pkg.eligibleAttendeeTypes.includes('mason' as AttendeeType))
                      .map((pkg) => {
                        // Check if this package is selected for bulk order
                        const isSelected = isBulkMode 
                          ? packages['lodge-bulk']?.ticketDefinitionId === pkg.id
                          : allStoreAttendees.length > 0 && allStoreAttendees.every(attendee => 
                              packages[attendee.attendeeId]?.ticketDefinitionId === pkg.id
                            );
                        
                        return (
                          <Card
                            key={pkg.id}
                            className={`cursor-pointer border-2 transition-all ${
                              isSelected
                                ? "border-masonic-gold bg-masonic-lightgold/10"
                                : "border-gray-200 hover:border-masonic-lightgold"
                            }`}
                            onClick={() => {
                              if (isBulkMode) {
                                // For bulk mode, store selection under a special key
                                updatePackageSelection('lodge-bulk', { 
                                  ticketDefinitionId: pkg.id, 
                                  selectedEvents: pkg.includes 
                                });
                              } else {
                                // Apply to all attendees
                                allStoreAttendees.forEach(attendee => {
                                  handleSelectPackage(attendee.attendeeId, pkg.id);
                                });
                              }
                            }}
                          >
                            <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium">{pkg.name}</h4>
                            <Badge className="bg-masonic-navy">${pkg.price}</Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{pkg.description}</p>
                          <div className="text-xs text-gray-500">
                            <div className="flex items-center gap-1 mb-1">
                              <Package className="h-3 w-3" />
                              <span>Includes:</span>
                            </div>
                            <ul className="space-y-1 pl-4">
                              {pkg.includes_description && pkg.includes_description.length > 0 ? (
                                // Use the descriptive text if available
                                pkg.includes_description.map((desc, idx) => (
                                  <li key={idx} className="flex items-center gap-1">
                                    <Check className="h-3 w-3 text-green-600" />
                                    <span>{desc}</span>
                                  </li>
                                ))
                              ) : (
                                // Fallback to looking up ticket names
                                pkg.includes.map((id) => {
                                  const ticket = ticketTypes.find((t) => t.id === id);
                                  return ticket ? (
                                    <li key={id} className="flex items-center gap-1">
                                      <Check className="h-3 w-3 text-green-600" />
                                      <span>{ticket.name}</span>
                                    </li>
                                  ) : null
                                })
                              )}
                            </ul>
                          </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                  </div>
                </div>

                {/* Individual tickets table */}
                <div>
                  <h3 className="font-semibold text-masonic-navy mb-3">Individual Tickets</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]"></TableHead>
                        <TableHead>Ticket</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            Availability
                            <ConnectionStatus status={connectionStatus} size="sm" />
                          </div>
                        </TableHead>
                        <TableHead className="text-right">Price</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ticketTypes
                        .filter(ticket => ticket.eligibleAttendeeTypes.includes('mason' as AttendeeType))
                        .map((ticket) => (
                        <TableRow key={ticket.id}>
                          <TableCell>
                            <Checkbox
                              id={`all-${ticket.id}`}
                              disabled={ticket.status !== 'Active' || !isTicketAvailable(ticket.id)}
                              checked={
                                isBulkMode 
                                  ? (packages['lodge-bulk']?.selectedEvents || []).includes(ticket.id)
                                  : allStoreAttendees.length > 0 && allStoreAttendees.every(attendee => 
                                      isIndividualTicketDirectlySelected(attendee.attendeeId, ticket.id)
                                    )
                              }
                              onCheckedChange={() => {
                                if (isBulkMode) {
                                  // Handle bulk mode selection
                                  const currentSelection = packages['lodge-bulk'] || { ticketDefinitionId: null, selectedEvents: [] };
                                  const isCurrentlySelected = currentSelection.selectedEvents.includes(ticket.id);
                                  
                                  let newSelectedEvents = currentSelection.ticketDefinitionId 
                                    ? [] // Clear if switching from package
                                    : [...currentSelection.selectedEvents];
                                  
                                  if (isCurrentlySelected) {
                                    newSelectedEvents = newSelectedEvents.filter(id => id !== ticket.id);
                                  } else {
                                    if (!newSelectedEvents.includes(ticket.id)) {
                                      newSelectedEvents.push(ticket.id);
                                    }
                                  }
                                  
                                  updatePackageSelection('lodge-bulk', { 
                                    ticketDefinitionId: null, 
                                    selectedEvents: newSelectedEvents 
                                  });
                                } else {
                                  // Original logic for individual attendees
                                  const isCurrentlySelected = allStoreAttendees.length > 0 && 
                                    allStoreAttendees.every(attendee => 
                                      isIndividualTicketDirectlySelected(attendee.attendeeId, ticket.id)
                                    );
                                  
                                  allStoreAttendees.forEach(attendee => {
                                    if (isCurrentlySelected) {
                                      // Deselect for all
                                      const currentSelection = packages[attendee.attendeeId] || { ticketDefinitionId: null, selectedEvents: [] };
                                      const newSelectedEvents = currentSelection.selectedEvents.filter(id => id !== ticket.id);
                                      updatePackageSelection(attendee.attendeeId, { 
                                        ticketDefinitionId: null, 
                                        selectedEvents: newSelectedEvents 
                                      });
                                    } else {
                                      // Select for all
                                      handleToggleIndividualTicket(attendee.attendeeId, ticket.id);
                                    }
                                  });
                                }
                              }}
                            />
                          </TableCell>
                          <TableCell className="font-medium">{ticket.name}</TableCell>
                          <TableCell>{ticket.description || 'No description available'}</TableCell>
                          <TableCell className="text-right">
                            <RealtimeErrorBoundary fallback={
                              <TicketAvailabilityBadge
                                available={ticket.available_count}
                                status={ticket.status}
                              />
                            }>
                              {(() => {
                                const liveData = getTicketAvailability(ticket.id)
                                const available = liveData?.actualAvailable ?? ticket.available_count
                                const isSoldOut = liveData?.isSoldOut ?? (ticket.available_count === 0)
                                
                                return (
                                  <TicketAvailabilityBadge
                                    available={available}
                                    status={ticket.status}
                                  />
                                )
                              })()}
                            </RealtimeErrorBoundary>
                          </TableCell>
                          <TableCell className="text-right">${ticket.price}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="individual" className="space-y-6 mt-6">
              {/* Individual Tickets tab content */}
              <div className="space-y-4">
                {isBulkMode ? (
                  <Alert className="border-yellow-300 bg-yellow-50">
                    <AlertDescription>
                      Individual ticket selection requires attendee details to be provided first. 
                      Please continue with "Same Tickets for All" or provide attendee details in the previous step.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <>
                    <div className="text-sm text-gray-600 mb-4">
                      Select tickets individually for each delegate.
                    </div>
                    
                    <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[250px]">Delegate</TableHead>
                      <TableHead>Tickets</TableHead>
                      <TableHead className="text-right w-[100px]">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {eligibleAttendees.map((attendee: any) => {
                      const attendeeTickets = getAttendeeTickets(attendee.attendeeId);
                      const attendeeTotal = getAttendeeTicketTotal(attendee.attendeeId);
                      
                      return (
                        <TableRow key={attendee.attendeeId}>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {attendee.title} {attendee.firstName} {attendee.lastName}
                              </div>
                              <div className="text-sm text-gray-500">
                                {attendee.attendeeType === "Mason" || attendee.attendeeType?.toLowerCase() === "mason" 
                                  ? (attendee.grandRank || attendee.rank || 'Mason')
                                  : attendee.isPartner 
                                    ? `Partner of ${attendee.partnerFirstName || 'Attendee'}` 
                                    : attendee.relationship || 'Guest'}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-2">
                              {/* Packages dropdown */}
                              <div>
                                <select
                                  className="w-full border rounded-md px-3 py-2 text-sm"
                                  value={packages[attendee.attendeeId]?.ticketDefinitionId || ''}
                                  onChange={(e) => {
                                    if (e.target.value) {
                                      handleSelectPackage(attendee.attendeeId, e.target.value);
                                    } else {
                                      updatePackageSelection(attendee.attendeeId, { 
                                        ticketDefinitionId: null, 
                                        selectedEvents: [] 
                                      });
                                    }
                                  }}
                                >
                                  <option value="">Select a package...</option>
                                  {ticketPackages
                                    .filter(pkg => {
                                      const mappedType = attendee.attendeeType?.toLowerCase() || '';
                                      const effectiveType = mappedType === 'mason' ? 'mason' : 'guest';
                                      return pkg.eligibleAttendeeTypes.includes(effectiveType as AttendeeType);
                                    })
                                    .map(pkg => (
                                      <option key={pkg.id} value={pkg.id}>
                                        {pkg.name} - ${pkg.price}
                                      </option>
                                    ))}
                                </select>
                              </div>
                              
                              {/* Individual tickets checkboxes */}
                              <div className="space-y-1">
                                {ticketTypes
                                  .filter(ticket => {
                                    const mappedType = attendee.attendeeType?.toLowerCase() || '';
                                    const effectiveType = mappedType === 'mason' ? 'mason' : 'guest';
                                    return ticket.eligibleAttendeeTypes.includes(effectiveType as AttendeeType);
                                  })
                                  .map(ticket => (
                                    <label key={ticket.id} className="flex items-center gap-2 text-sm">
                                      <Checkbox
                                        checked={isIndividualTicketDirectlySelected(attendee.attendeeId, ticket.id)}
                                        onCheckedChange={() => handleToggleIndividualTicket(attendee.attendeeId, ticket.id)}
                                        disabled={!!packages[attendee.attendeeId]?.ticketDefinitionId || ticket.status !== 'Active' || !isTicketAvailable(ticket.id)}
                                      />
                                      <span className={cn(
                                        packages[attendee.attendeeId]?.ticketDefinitionId || ticket.status !== 'Active' || !isTicketAvailable(ticket.id) ? "text-gray-400" : ""
                                      )}>
                                        {ticket.name} - ${ticket.price}
                                        {ticket.status !== 'Active' ? (
                                          <span className="text-gray-500 text-xs ml-1">(Inactive)</span>
                                        ) : !isTicketAvailable(ticket.id) ? (
                                          <span className="text-red-500 text-xs ml-1">(Sold Out)</span>
                                        ) : null}
                                      </span>
                                    </label>
                                  ))}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            ${attendeeTotal}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                  <tfoot>
                    <TableRow>
                      <TableCell colSpan={2} className="text-right font-semibold">
                        Grand Total
                      </TableCell>
                      <TableCell className="text-right font-bold text-lg">
                        ${orderTotalAmount}
                      </TableCell>
                    </TableRow>
                  </tfoot>
                </Table>
                  </>
                )}
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              className="gap-2 border-masonic-navy text-masonic-navy hover:bg-masonic-lightblue"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </Button>
            <Button
              onClick={handleContinue}
              variant={
                registrationType === 'lodge' && lodgeTicketOrder
                  ? (packages['lodge-bulk']?.ticketDefinitionId || (packages['lodge-bulk']?.selectedEvents && packages['lodge-bulk'].selectedEvents.length > 0)) ? "default" : "outline"
                  : (ensureAllAttendeesHaveTickets() && currentTickets.length > 0) ? "default" : "outline"
              }
              className={`gap-2 ${
                registrationType === 'lodge' && lodgeTicketOrder
                  ? (packages['lodge-bulk']?.ticketDefinitionId || (packages['lodge-bulk']?.selectedEvents && packages['lodge-bulk'].selectedEvents.length > 0))
                    ? "bg-masonic-navy hover:bg-masonic-blue text-white"
                    : "border-masonic-navy text-masonic-navy hover:bg-masonic-lightblue"
                  : (ensureAllAttendeesHaveTickets() && currentTickets.length > 0)
                    ? "bg-masonic-navy hover:bg-masonic-blue text-white"
                    : "border-masonic-navy text-masonic-navy hover:bg-masonic-lightblue"
              }`}
            >
              Continue
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <AlertModal
            isOpen={alertModalOpen}
            onClose={() => setAlertModalOpen(false)}
            title={alertModalData.title}
            description={alertModalData.description}
            variant={alertModalData.variant}
            actionLabel="OK"
          />
          
          <ValidationModal
            isOpen={showValidationModal}
            onClose={() => setShowValidationModal(false)}
            errors={validationErrors}
            title="Tickets Required"
            description="Please ensure each attendee has at least one ticket or package selected before continuing:"
          />
        </div>
      </TwoColumnStepLayout>
    );
  }
  
  // Default behavior for non-lodge registrations
  return (
    <TwoColumnStepLayout
      summaryContent={renderSummaryContent()}
      summaryTitle="Step Summary"
      currentStep={3}
      totalSteps={6}
      stepName="Ticket Selection"
    >
      <div className="space-y-6">
        {/* Connection status indicator */}
        {isConnected && (
          <div className="flex justify-end -mt-4 mb-4">
            <ConnectionStatus status={connectionStatus} showText={true} size="sm" />
          </div>
        )}
        
        <div className="space-y-4">
          {eligibleAttendees.map((attendee: any) => (
            <Card key={attendee.attendeeId} className={cn(
              "rounded-lg border bg-card text-card-foreground shadow-sm border-masonic-navy overflow-hidden"
            )}>
              <CardHeader 
                className={`bg-masonic-lightblue py-3 px-4 cursor-pointer ${expandedAttendee === attendee.attendeeId ? "" : "hover:bg-masonic-lightblue/90"}`}
                onClick={() => setExpandedAttendee(expandedAttendee === attendee.attendeeId ? null : attendee.attendeeId)}
              >
                <table className="w-full">
                  <tbody>
                    <tr className="align-middle">
                      <td className="w-[80%]">
                        <CardTitle className="text-lg">{renderAttendeeHeader(attendee)}</CardTitle>
                      </td>
                      <td className="w-[10%]">
                        <div className="flex justify-end">
                          <Badge variant="outline" className="bg-white">
                            {attendee.attendeeType === "Mason" || attendee.attendeeType?.toLowerCase() === "mason" 
                              ? "Mason" 
                              : attendee.isPartner 
                                ? "Partner" 
                                : "Guest"}
                          </Badge>
                        </div>
                      </td>
                      <td className="w-[10%] pr-2">
                        <div className="flex justify-end">
                          <div className={expandedAttendee === attendee.attendeeId ? "" : "rotate-180 transform"}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M6 15L12 9L18 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </div>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </CardHeader>
              <CardContent className="p-0">
                {expandedAttendee === attendee.attendeeId ? (
                  /* Show the expanded accordion with ticket selection UI */
                  <div>
                    
                    {/* The ticket selection content */}
                    <div className="px-4 py-3 border-t">
                      <div className="space-y-6">
                        {/* Package options */}
                        <div>
                          <h3 className="font-semibold text-masonic-navy mb-3">Ticket Packages</h3>
                          <div className="grid gap-4 md:grid-cols-3">
                            {ticketPackages
                              .filter(pkg => {
                                // Normalize attendee type to lowercase for consistent comparison
                                const mappedType = attendee.attendeeType?.toLowerCase() || '';
                                
                                // Map all partner types to 'guest' for eligibility
                                const effectiveType = mappedType === 'mason' ? 'mason' : 'guest';
                                
                                // Check if package is eligible for this attendee type
                                return pkg.eligibleAttendeeTypes.includes(effectiveType as AttendeeType);
                              })
                              .map((pkg) => (
                              <Card
                                key={pkg.id}
                                className={`cursor-pointer border-2 transition-all ${
                                  isPackageSelectedForAttendee(attendee.attendeeId, pkg.name)
                                    ? "border-masonic-gold bg-masonic-lightgold/10"
                                    : "border-gray-200 hover:border-masonic-lightgold"
                                }`}
                                onClick={() => handleSelectPackage(attendee.attendeeId, pkg.id)}
                              >
                                <CardContent className="p-4">
                                  <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-medium">{pkg.name}</h4>
                                    <div className="text-right">
                                      <Badge className="bg-masonic-navy">${pkg.price}</Badge>
                                      {getFeeModeFromEnv() === 'pass_to_customer' && (
                                        <p className="text-xs text-gray-500 mt-1">
                                          +${calculateStripeFees(pkg.price).stripeFee.toFixed(2)} fee
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  <p className="text-sm text-gray-600 mb-3">{pkg.description}</p>
                                  <div className="text-xs text-gray-500">
                                    <div className="flex items-center gap-1 mb-1">
                                      <Package className="h-3 w-3" />
                                      <span>Includes:</span>
                                    </div>
                                    <ul className="space-y-1 pl-4">
                                      {pkg.includes_description && pkg.includes_description.length > 0 ? (
                                        // Use the descriptive text if available
                                        pkg.includes_description.map((desc, idx) => (
                                          <li key={idx} className="flex items-start gap-1">
                                            <Check className="h-3 w-3 text-green-600 mt-0.5" />
                                            <span>{desc}</span>
                                          </li>
                                        ))
                                      ) : (
                                        // Fallback to looking up ticket names
                                        pkg.includes.map((id) => {
                                          const ticket = ticketTypes.find((t) => t.id === id);
                                          return ticket ? (
                                            <li key={id} className="flex items-start gap-1">
                                              <Check className="h-3 w-3 text-green-600 mt-0.5" />
                                              <div>
                                                <span>{ticket.name}</span>
                                                {ticket.event_title && (
                                                  <span className="text-xs text-gray-400 block">{ticket.event_title}</span>
                                                )}
                                              </div>
                                            </li>
                                          ) : null
                                        })
                                      )}
                                    </ul>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>

                        {/* Individual tickets table */}
                        <div>
                          <h3 className="font-semibold text-masonic-navy mb-3">Individual Tickets</h3>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-[50px]"></TableHead>
                                <TableHead>Ticket</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead className="text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    Availability
                                    {isConnected && <ConnectionStatus status={connectionStatus} size="sm" />}
                                  </div>
                                </TableHead>
                                <TableHead className="text-right">Price</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {ticketTypes
                                .filter(ticket => {
                                  // Normalize attendee type to lowercase for consistent comparison
                                  const mappedType = attendee.attendeeType?.toLowerCase() || '';
                                  
                                  // Map all partner types to 'guest' for eligibility
                                  const effectiveType = mappedType === 'mason' ? 'mason' : 'guest';
                                  
                                  // Check if ticket is eligible for this attendee type
                                  return ticket.eligibleAttendeeTypes.includes(effectiveType as AttendeeType);
                                })
                                .map((ticket) => (
                                <TableRow key={ticket.id}>
                                  <TableCell>
                                    <Checkbox
                                      id={`${attendee.attendeeId}-${ticket.id}`}
                                      disabled={ticket.status !== 'Active' || !isTicketAvailable(ticket.id)}
                                      checked={isIndividualTicketDirectlySelected(attendee.attendeeId, ticket.id)}
                                      onCheckedChange={() => handleToggleIndividualTicket(attendee.attendeeId, ticket.id)}
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <div>
                                      <div className="font-medium">{ticket.name}</div>
                                      {ticket.event_title && (
                                        <div className="text-xs text-gray-500">{ticket.event_title}</div>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell>{ticket.description || 'No description available'}</TableCell>
                                  <TableCell className="text-right">
                                    <RealtimeErrorBoundary fallback={
                                      <TicketAvailabilityIndicator
                                        available={ticket.available_count}
                                        status={ticket.status}
                                        showNumbers={true}
                                        size="sm"
                                        animate={false}
                                      />
                                    }>
                                      {(() => {
                                        const liveData = getTicketAvailability(ticket.id)
                                        const available = liveData?.actualAvailable ?? ticket.available_count
                                        const previousAvailable = ticket.available_count
                                        
                                        return (
                                          <TicketAvailabilityIndicator
                                            available={available}
                                            status={ticket.status}
                                            showNumbers={true}
                                            size="sm"
                                            animate={true}
                                            previousAvailable={previousAvailable}
                                          />
                                        )
                                      })()}
                                    </RealtimeErrorBoundary>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <div>
                                      <span>${ticket.price}</span>
                                      {getFeeModeFromEnv() === 'pass_to_customer' && (
                                        <p className="text-xs text-gray-500">
                                          +${calculateStripeFees(ticket.price).stripeFee.toFixed(2)} fee
                                        </p>
                                      )}
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>

                        {/* Selected tickets summary */}
                        <div>
                          <h3 className="font-semibold text-masonic-navy mb-3">Selected Tickets</h3>
                          {getAttendeeTickets(attendee.attendeeId).length === 0 ? (
                            <p className="text-gray-500 italic">No tickets selected</p>
                          ) : (
                            <div className="space-y-2">
                              {getAttendeeTickets(attendee.attendeeId).map((ticket) => (
                                <div
                                  key={ticket.id}
                                  className="flex justify-between items-center p-2 border rounded-md bg-gray-50"
                                >
                                  <div>
                                    <p className="font-medium">{ticket.name}</p>
                                    <p className="text-xs text-gray-500">{ticket.description}</p>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <div className="text-right">
                                      <span className="font-bold">${ticket.price}</span>
                                      {getFeeModeFromEnv() === 'pass_to_customer' && (
                                        <p className="text-xs text-gray-500">
                                          +${calculateStripeFees(ticket.price).stripeFee.toFixed(2)} fee
                                        </p>
                                      )}
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                      onClick={() => {
                                        if (ticket.isPackage) {
                                          // Remove the whole package
                                          updateAttendeeStore(ticket.attendeeId, { ticket: { ticketDefinitionId: null, selectedEvents: [] } } as any);
                                        } else {
                                          // Remove an individual ticket - find original ticketTypeId
                                          // The ticket.id for individual tickets is attendeeId-ticketTypeId
                                          const originalTicketTypeId = ticket.id.replace(`${ticket.attendeeId}-`, '');
                                          const foundAttendee = allStoreAttendees.find(a => (a as any).attendeeId === ticket.attendeeId);
                                          const existingAttendeeSelection = (foundAttendee as any)?.ticket;
                                          const updatedSelectedEvents = existingAttendeeSelection?.selectedEvents.filter((id: string) => id !== originalTicketTypeId) || [];
                                          updateAttendeeStore(ticket.attendeeId, { 
                                            ticket: { 
                                              ticketDefinitionId: null, // Ensure package is cleared if removing last individual ticket
                                              selectedEvents: updatedSelectedEvents 
                                            }
                                          } as any);
                                        }
                                      }}
                                    >
                                      ×
                                    </Button>
                                  </div>
                                </div>
                              ))}
                              <div className="border-t pt-2 space-y-1">
                                <div className="flex justify-between items-center px-2 text-sm">
                                  <span>Subtotal</span>
                                  <span>${getAttendeeTicketTotal(attendee.attendeeId)}</span>
                                </div>
                                {getFeeModeFromEnv() === 'pass_to_customer' && (
                                  <div className="flex justify-between items-center px-2 text-sm text-gray-600">
                                    <span className="flex items-center gap-1">
                                      Processing Fee
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger>
                                            <Info className="h-3 w-3" />
                                          </TooltipTrigger>
                                          <TooltipContent className="max-w-xs">
                                            <p className="text-sm">{getFeeDisclaimer()}</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    </span>
                                    <span>${calculateStripeFees(getAttendeeTicketTotal(attendee.attendeeId)).stripeFee.toFixed(2)}</span>
                                  </div>
                                )}
                                <div className="flex justify-between items-center p-2 font-bold">
                                  <span>Total</span>
                                  <span>${calculateStripeFees(getAttendeeTicketTotal(attendee.attendeeId)).total.toFixed(2)}</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Show the collapsed view with summary */
                  <div 
                    className="cursor-pointer"
                    onClick={() => setExpandedAttendee(attendee.attendeeId)}
                  >                  
                    {/* Show ticket summary for collapsed view */}
                    <div className="px-4 py-3 border-t">
                      {getAttendeeTickets(attendee.attendeeId).length === 0 ? (
                        <p className="text-gray-500 italic text-left py-2 text-sm">Click to expand and add tickets</p>
                      ) : (
                        <table className="w-full text-xs text-muted-foreground">
                          <tbody>
                            {getAttendeeTickets(attendee.attendeeId).map((ticket) => (
                              <tr key={ticket.id} className="align-middle">
                                <td className="font-medium py-1 align-middle w-[22.5%]">
                                  {ticket.name}
                                </td>
                                <td className="py-1 align-left w-[67.5%] text-left font-normal">
                                  {ticket.description}
                                </td>
                                <td className="text-right py-1 align-middle w-[10%]">${ticket.price}</td>
                              </tr>
                            ))}
                            <tr className="border-t align-left">
                              <td className="py-1 w-[22.5%]"></td>
                              <td className="py-1 w-[67.5%]">
                                <div className="flex justify-end pr-2">
                                  <span className="font-bold">TOTAL</span>
                                </div>
                              </td>
                              <td className="text-right font-bold py-1 align-middle w-[10%]">${getAttendeeTicketTotal(attendee.attendeeId)}</td>
                            </tr>
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            className="gap-2 border-masonic-navy text-masonic-navy hover:bg-masonic-lightblue"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </Button>
          <Button
            onClick={handleContinue}
            variant={(ensureAllAttendeesHaveTickets() && currentTickets.length > 0) ? "default" : "outline"}
            className={`gap-2 ${
              (ensureAllAttendeesHaveTickets() && currentTickets.length > 0)
                ? "bg-masonic-navy hover:bg-masonic-blue text-white"
                : "border-masonic-navy text-masonic-navy hover:bg-masonic-lightblue"
            }`}
          >
            Continue
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <AlertModal
          isOpen={alertModalOpen}
          onClose={() => setAlertModalOpen(false)}
          title={alertModalData.title}
          description={alertModalData.description}
          variant={alertModalData.variant}
          actionLabel="OK"
        />
        
        <ValidationModal
          isOpen={showValidationModal}
          onClose={() => setShowValidationModal(false)}
          errors={validationErrors}
          title="Tickets Required"
          description="Please ensure each attendee has at least one ticket or package selected before continuing:"
        />
      </div>
    </TwoColumnStepLayout>
  );
}

export default TicketSelectionStep;