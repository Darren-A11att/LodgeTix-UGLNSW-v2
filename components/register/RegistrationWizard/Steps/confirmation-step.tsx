"use client"

import { useRegistrationStore } from '../../../../lib/registrationStore'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import {
  AlertCircle,
  Calendar,
  Check,
  Clock,
  Download,
  ExternalLink,
  Mail,
  MapPin,
  Phone,
  Printer,
  QrCode,
  Share,
  Ticket as TicketIcon,
  User,
  CreditCard,
} from "lucide-react"
import Link from "next/link"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TwoColumnStepLayout } from "../Layouts/TwoColumnStepLayout"
import { getConfirmationSummaryData } from '../Summary/summary-data/confirmation-summary-data';
import { SummaryRenderer } from '../Summary/SummaryRenderer';
import { useState, useEffect, useMemo } from 'react'

// Placeholder ticket definitions (should be imported from a shared source eventually)
const ticketTypesMinimal = [
  { id: "installation", name: "Installation Ceremony", price: 75 },
  { id: "banquet", name: "Grand Banquet", price: 150 },
  { id: "brunch", name: "Farewell Brunch", price: 45 },
  { id: "tour", name: "City Tour", price: 60 },
];
const ticketPackagesMinimal = [
  { id: "complete", name: "Complete Package", price: 250, includes: ["installation", "banquet", "brunch", "tour"] },
  { id: "ceremony-banquet", name: "Ceremony & Banquet", price: 200, includes: ["installation", "banquet"] },
  { id: "social", name: "Social Package", price: 180, includes: ["banquet", "brunch", "tour"] },
];

function ConfirmationStep() {
  const store = useRegistrationStore()
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [registrationData, setRegistrationData] = useState<{
    registration: any;
    attendees: any[];
    tickets: any[];
  } | null>(null);

  const {
    registrationType,
    clearRegistration,
    confirmationNumber: storeConfirmationNumber,
    attendees: allStoreAttendees,
    draftId,
  } = store

  // Fetch registration data from Supabase
  useEffect(() => {
    const fetchRegistrationData = async () => {
      if (!draftId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch(`/api/registrations/${draftId}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch registration details");
        }
        
        const data = await response.json();
        setRegistrationData(data);
      } catch (error: any) {
        console.error("Error fetching registration:", error);
        setError("Failed to load registration details. Using locally stored data instead.");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRegistrationData();
  }, [draftId]);

  // Use Supabase data if available, otherwise fall back to store data
  const primaryAttendee = useMemo(() => {
    if (registrationData) {
      return registrationData.attendees.find(att => 
        att.attendeetype === 'primary' || 
        att.attendeeid === registrationData.registration.primaryAttendeeId
      );
    }
    return allStoreAttendees?.find(att => att.isPrimary);
  }, [registrationData, allStoreAttendees]);
  
  const additionalAttendees = useMemo(() => {
    if (registrationData) {
      return registrationData.attendees.filter(att => 
        att.attendeetype !== 'primary' && 
        att.attendeeid !== registrationData.registration.primaryAttendeeId
      );
    }
    return allStoreAttendees?.filter(att => !att.isPrimary) || [];
  }, [registrationData, allStoreAttendees]);

  // Map DB ticket data to the format expected by the UI
  const currentTickets = useMemo(() => {
    if (registrationData) {
      return registrationData.tickets.map(ticket => ({
        id: ticket.ticketid,
        name: ticket.ticket_name || "Ticket", // You'll need to join with ticket definitions for better names
        price: parseFloat(ticket.pricepaid) || 0,
        attendeeId: ticket.attendeeid,
        isPackage: !!ticket.packageId,
        description: ticket.description || "Event ticket",
      }));
    }
    
    // Fall back to store data
    return allStoreAttendees?.flatMap((attendee: any) => {
      if (!attendee.ticket) return [];
      const ticketData = attendee.ticket;
      if (!ticketData) return [];
      
      const { ticketDefinitionId, selectedEvents } = ticketData;
      const attendeeId = attendee.attendeeId;
      let tickets = [];
      if (ticketDefinitionId) {
        const pkgInfo = ticketPackagesMinimal.find(p => p.id === ticketDefinitionId);
        if (pkgInfo) {
          tickets.push({
            id: `${attendeeId}-${pkgInfo.id}`,
            name: pkgInfo.name,
            price: pkgInfo.price,
            attendeeId,
            isPackage: true,
            description: `Package: ${pkgInfo.name}`
          });
        }
      } else if (selectedEvents) {
        selectedEvents.forEach((eventId: string) => {
          const eventInfo = ticketTypesMinimal.find(e => e.id === eventId);
          if (eventInfo) {
            tickets.push({
              id: `${attendeeId}-${eventInfo.id}`,
              name: eventInfo.name,
              price: eventInfo.price,
              attendeeId,
              isPackage: false,
              description: eventInfo.name
            });
          }
        });
      }
      return tickets;
    }) || [];
  }, [registrationData, allStoreAttendees]);

  const handleReset = () => {
    clearRegistration()
  }

  const allAttendees = [
    ...(primaryAttendee ? [primaryAttendee] : []),
    ...additionalAttendees,
  ]

  const totalAmount = useMemo(() => {
    if (registrationData?.registration) {
      return parseFloat(registrationData.registration.totalPricePaid) || 0;
    }
    return currentTickets.reduce((sum, ticket) => sum + (ticket.price || 0), 0);
  }, [registrationData, currentTickets]);

  // Create alias for consistency with renderSummaryContent
  const totalAmountDerived = totalAmount;

  const totalTickets = currentTickets.length;

  // Create attendeesForDisplay array for summary rendering
  const attendeesForDisplay = useMemo(() => {
    const result: any[] = [];
    
    // Add primary attendee first
    if (primaryAttendee) {
      result.push(primaryAttendee);
    }
    
    // Add additional attendees
    result.push(...additionalAttendees);
    
    return result;
  }, [primaryAttendee, additionalAttendees]);

  // Use confirmation number from Supabase if available, otherwise from store
  const confirmationNumber = useMemo(() => {
    if (registrationData?.registration) {
      // Generate confirmation number from registration ID if not explicitly stored
      return `REG-${registrationData.registration.registrationId.substring(0, 8).toUpperCase()}`;
    }
    return storeConfirmationNumber;
  }, [registrationData, storeConfirmationNumber]);

  // Format date for display
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date)
  }

  const eventDate = new Date(2023, 10, 25) // November 25, 2023
  const registrationDate = useMemo(() => {
    if (registrationData?.registration) {
      return new Date(registrationData.registration.registrationDate || registrationData.registration.createdAt);
    }
    return new Date();
  }, [registrationData]);

  // Get attendee title based on their type
  const getAttendeeTitle = (att: any) => {
    // For Supabase data
    if (att.attendeetype) {
      return att.attendeetype.toLowerCase() === 'mason' ? att.rank : att.title;
    }
    // For store data (UnifiedAttendeeData)
    return att.attendeeType === 'Mason' ? att.rank : att.title;
  };

  // Prepare summary content
  const renderSummaryContent = () => {
    const summaryData = getConfirmationSummaryData({
      registrationId: draftId || '',
      paymentStatus: 'completed',
      totalAmount: totalAmountDerived,
      attendeeCount: attendeesForDisplay.length,
      ticketCount: currentTickets.length,
      confirmationNumber: draftId?.slice(0, 8).toUpperCase() || '',
      email: primaryAttendee?.email || primaryAttendee?.primaryEmail
    });
    
    return <SummaryRenderer {...summaryData} />;
  };

  // Loading state
  if (isLoading) {
    return (
      <TwoColumnStepLayout
        summaryContent={<div className="text-sm text-muted-foreground">Loading...</div>}
        summaryTitle="Step Summary"
        currentStep={6}
        totalSteps={6}
        stepName="Confirmation"
      >
        <div className="flex flex-col items-center justify-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-masonic-navy mb-4"></div>
          <p className="text-masonic-navy font-medium">Loading your registration details...</p>
        </div>
      </TwoColumnStepLayout>
    );
  }

  return (
    <TwoColumnStepLayout
      summaryContent={renderSummaryContent()}
      summaryTitle="Step Summary"
      currentStep={6}
      totalSteps={6}
      stepName="Confirmation"
    >
      <div className="space-y-8">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Button onClick={handleReset} className="w-full bg-masonic-gold hover:bg-masonic-gold/90 text-masonic-navy">
          Start New Registration
        </Button>

        <Tabs defaultValue="confirmation" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="confirmation">Confirmation</TabsTrigger>
            <TabsTrigger value="tickets">Tickets</TabsTrigger>
            <TabsTrigger value="details">Event Details</TabsTrigger>
          </TabsList>

          <TabsContent value="confirmation" className="mt-4 space-y-4">
            <Card className={cn(
              "rounded-lg border bg-card text-card-foreground shadow-sm border-masonic-navy"
            )}>
              <CardHeader className="bg-masonic-navy text-white">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <Check className="mr-2 h-5 w-5" /> Confirmation Details
                  </CardTitle>
                  <Badge variant="outline" className="bg-green-500/20 text-white">
                    Confirmed
                  </Badge>
                </div>
                <CardDescription className="text-gray-200">Please save this information for your records</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="rounded-lg bg-masonic-lightblue/30 p-4">
                  <p className="text-center">
                    <span className="block text-lg font-medium text-gray-600">Confirmation Number</span>
                    <span className="text-2xl font-bold text-masonic-navy">{confirmationNumber}</span>
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2 rounded-lg border p-3">
                    <h3 className="font-medium text-gray-700">Registration Type</h3>
                    <p className="capitalize text-masonic-navy">{registrationType?.replace("-", " ")}</p>
                  </div>

                  <div className="space-y-2 rounded-lg border p-3">
                    <h3 className="font-medium text-gray-700">Registration Date</h3>
                    <p className="text-masonic-navy">{formatDate(registrationDate)}</p>
                  </div>
                </div>

                <div className="space-y-2 rounded-lg border p-3">
                  <h3 className="font-medium text-gray-700">Primary Attendee</h3>
                  <p className="text-masonic-navy">
                    {getAttendeeTitle(primaryAttendee)} {primaryAttendee?.firstName} {primaryAttendee?.lastName}
                  </p>
                  {primaryAttendee?.primaryEmail && (
                    <div className="flex items-center text-sm text-gray-500">
                      <Mail className="mr-1 h-3 w-3" />
                      {primaryAttendee.primaryEmail}
                    </div>
                  )}
                  {primaryAttendee?.primaryPhone && (
                    <div className="flex items-center text-sm text-gray-500">
                      <Phone className="mr-1 h-3 w-3" />
                      {primaryAttendee.primaryPhone}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <h3 className="font-medium text-gray-700">Payment Information</h3>
                  <div className="rounded-lg border p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <CreditCard className="mr-2 h-4 w-4 text-gray-500" />
                        <span>
                          {totalAmount > 0 ? "Paid via Stripe" : "No payment required"}
                        </span>
                      </div>
                      <span className="font-bold">${totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <Alert className="border-amber-200 bg-amber-50">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-800">
                    A confirmation email has been sent to {primaryAttendee?.primaryEmail}. Please check your inbox.
                  </AlertDescription>
                </Alert>
              </CardContent>
              <CardFooter className="flex flex-col space-y-2 bg-gray-50 p-4">
                <div className="grid w-full gap-2 md:grid-cols-2">
                  <Button className="bg-masonic-navy hover:bg-masonic-blue">
                    <Download className="mr-2 h-4 w-4" /> Download Confirmation
                  </Button>
                  <Button variant="outline" className="border-masonic-navy text-masonic-navy hover:bg-masonic-lightblue">
                    <Printer className="mr-2 h-4 w-4" /> Print Confirmation
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="tickets" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TicketIcon className="mr-2 h-5 w-5" /> Your Tickets
                </CardTitle>
                <CardDescription>
                  Total tickets: {totalTickets} • Total amount: ${totalAmount.toFixed(2)}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[400px]" type="always">
                  <div className="space-y-4 p-4">
                    {currentTickets.map((ticket) => {
                      const attendee = allAttendees.find((a) => a.attendeeId === ticket.attendeeId);
                      if (!attendee) return null;
                      return (
                        <Card key={ticket.id} className="overflow-hidden border-masonic-lightgold">
                          <div className="flex flex-col md:flex-row">
                            <div className="flex items-center justify-center bg-masonic-navy p-4 text-white md:w-1/4">
                              <QrCode className="h-24 w-24" />
                            </div>
                            <div className="flex-1 p-4">
                              <div className="mb-2 flex items-center justify-between">
                                <h3 className="font-bold">{ticket.name}</h3>
                                <Badge className="bg-masonic-gold text-masonic-navy">${ticket.price.toFixed(2)}</Badge>
                              </div>
                              <Separator className="my-2" />
                              <div className="grid gap-2 md:grid-cols-2">
                                <div className="flex items-center text-sm">
                                  <User className="mr-1 h-4 w-4 text-gray-500" />
                                  <span>
                                    {getAttendeeTitle(attendee)} {attendee.firstName} {attendee.lastName}
                                  </span>
                                </div>
                                <div className="flex items-center text-sm">
                                  <Calendar className="mr-1 h-4 w-4 text-gray-500" />
                                  <span>{formatDate(eventDate)}</span>
                                </div>
                                <div className="flex items-center text-sm">
                                  <Clock className="mr-1 h-4 w-4 text-gray-500" />
                                  <span>10:00 AM</span>
                                </div>
                                <div className="flex items-center text-sm">
                                  <MapPin className="mr-1 h-4 w-4 text-gray-500" />
                                  <span>Sydney Masonic Centre</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="details" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Grand Installation Event Details</CardTitle>
                <CardDescription>Saturday, 25 November 2023 • Sydney Masonic Centre</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg bg-gray-50 p-4">
                  <h3 className="mb-2 font-medium">Event Schedule</h3>
                  <div className="space-y-2">
                    <div className="flex items-start">
                      <div className="mr-2 flex h-6 w-6 items-center justify-center rounded-full bg-masonic-navy text-xs text-white">
                        1
                      </div>
                      <div>
                        <p className="font-medium">Registration & Welcome</p>
                        <p className="text-sm text-gray-500">10:00 AM - 11:00 AM</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="mr-2 flex h-6 w-6 items-center justify-center rounded-full bg-masonic-navy text-xs text-white">
                        2
                      </div>
                      <div>
                        <p className="font-medium">Installation Ceremony</p>
                        <p className="text-sm text-gray-500">11:00 AM - 1:00 PM</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="mr-2 flex h-6 w-6 items-center justify-center rounded-full bg-masonic-navy text-xs text-white">
                        3
                      </div>
                      <div>
                        <p className="font-medium">Festive Board Luncheon</p>
                        <p className="text-sm text-gray-500">1:30 PM - 4:00 PM</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border p-4">
                  <h3 className="mb-2 font-medium">Venue Information</h3>
                  <p className="mb-2">Sydney Masonic Centre</p>
                  <p className="text-sm text-gray-500">66 Goulburn St, Sydney NSW 2000, Australia</p>
                  <div className="mt-2">
                    <Button variant="outline" size="sm" className="h-8">
                      <MapPin className="mr-1 h-3 w-3" /> View Map
                    </Button>
                  </div>
                </div>

                <div className="rounded-lg border p-4">
                  <h3 className="mb-2 font-medium">Dress Code</h3>
                  <p className="text-sm">Full Masonic Regalia for Masons. Formal attire for guests and partners.</p>
                </div>

                <div className="rounded-lg border p-4">
                  <h3 className="mb-2 font-medium">Contact Information</h3>
                  <p className="text-sm">For any queries regarding the event, please contact:</p>
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center text-sm">
                      <Mail className="mr-2 h-4 w-4 text-gray-500" />
                      <span>events@unifiedgrandlodge.org</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Phone className="mr-2 h-4 w-4 text-gray-500" />
                      <span>+61 2 9267 9100</span>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full bg-masonic-navy hover:bg-masonic-blue" asChild>
                  <Link href="/events/grand-installation">
                    <ExternalLink className="mr-2 h-4 w-4" /> View Full Event Details
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="text-center">
          <h2 className="mb-4 text-xl font-bold text-masonic-navy">What's Next?</h2>
          <div className="masonic-divider"></div>
          <p className="mb-6 text-gray-600">
            A confirmation email has been sent to {primaryAttendee?.primaryEmail} with all the details of your
            registration.
          </p>

          <div className="grid gap-6 md:grid-cols-3">
            <Card className="border-masonic-lightgold">
              <CardContent className="pt-6">
                <div className="mb-4 mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-masonic-navy text-white">
                  <Calendar className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-center font-medium">Add to Calendar</h3>
                <p className="mb-4 text-center text-sm text-gray-500">
                  Don't miss the event! Add it to your calendar now.
                </p>
                <Button
                  variant="outline"
                  className="w-full border-masonic-navy text-masonic-navy hover:bg-masonic-lightblue"
                >
                  Add to Calendar
                </Button>
              </CardContent>
            </Card>

            <Card className="border-masonic-lightgold">
              <CardContent className="pt-6">
                <div className="mb-4 mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-masonic-navy text-white">
                  <Share className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-center font-medium">Share with Others</h3>
                <p className="mb-4 text-center text-sm text-gray-500">Invite other Brethren to register for the event</p>
                <Button
                  variant="outline"
                  className="w-full border-masonic-navy text-masonic-navy hover:bg-masonic-lightblue"
                >
                  Share Event
                </Button>
              </CardContent>
            </Card>

            <Card className="border-masonic-lightgold">
              <CardContent className="pt-6">
                <div className="mb-4 mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-masonic-navy text-white">
                  <Download className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-center font-medium">Download Resources</h3>
                <p className="mb-4 text-center text-sm text-gray-500">Access event program and accommodation details</p>
                <Button
                  variant="outline"
                  className="w-full border-masonic-navy text-masonic-navy hover:bg-masonic-lightblue"
                >
                  View Resources
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex justify-center">
          <Button onClick={handleReset} className="bg-masonic-navy hover:bg-masonic-blue">
            Register Another Attendee
          </Button>
        </div>
      </div>
    </TwoColumnStepLayout>
  )
}

export default ConfirmationStep;
