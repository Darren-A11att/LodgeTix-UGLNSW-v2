import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  MapPin, 
  Mail, 
  Phone, 
  User,
  Users,
  Building2,
  CreditCard,
  CheckCircle2
} from 'lucide-react';
import { PrintButton } from '@/components/register/confirmation/print-button';

interface IndividualConfirmationPageProps {
  params: Promise<{
    slug: string;
    confirmationNumber: string;
  }>;
}

export default async function IndividualConfirmationPage({ params }: IndividualConfirmationPageProps) {
  const { slug, confirmationNumber } = await params;
  
  console.log('[IndividualConfirmationPage] Loading confirmation:', {
    slug,
    confirmationNumber
  });
  
  const supabase = await createClient();
  
  // Fetch registration using confirmation number view
  const { data: registration, error } = await supabase
    .from('individuals_registration_confirmation_view')
    .select('*')
    .eq('confirmation_number', confirmationNumber)
    .single();
  
  if (error || !registration) {
    console.error('[IndividualConfirmationPage] Registration not found:', error);
    redirect(`/functions/${slug}?error=confirmation_not_found`);
  }
  
  // Verify the function slug matches
  if (registration.function_slug !== slug) {
    console.error('[IndividualConfirmationPage] Function slug mismatch');
    redirect(`/functions/${registration.function_slug}/register/confirmation/individuals/${confirmationNumber}`);
  }
  
  // Verify payment is completed
  if (registration.payment_status !== 'completed' || registration.status !== 'completed') {
    console.error('[IndividualConfirmationPage] Payment not completed');
    redirect(`/functions/${slug}?error=payment_not_completed`);
  }
  
  console.log('[IndividualConfirmationPage] Registration found:', {
    registrationId: registration.registration_id,
    functionId: registration.function_id,
    attendeeCount: registration.total_attendees,
    ticketCount: registration.total_tickets,
    attendees: registration.attendees,
    tickets: registration.tickets
  });

  // Parse attendees and tickets from JSONB
  const attendees = registration.attendees || [];
  const tickets = registration.tickets || [];

  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-AU', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  // Format time
  const formatTime = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-AU', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    }).format(date);
  };

  // Group tickets by attendee
  const getTicketsForAttendee = (attendeeId: string) => {
    return tickets.filter((ticket: any) => ticket.attendeeId === attendeeId);
  };

  // Calculate totals
  const subtotal = registration.subtotal || 0;
  const stripeFee = registration.stripe_fee || 0;
  const totalAmount = registration.total_amount_paid || 0;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <CheckCircle2 className="h-12 w-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Registration Confirmed</h1>
          <p className="mt-2 text-lg text-gray-600">Thank you for your registration</p>
        </div>

        {/* Main Content Card */}
        <Card className="shadow-lg">
          <CardHeader className="bg-masonic-navy text-white">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl">{registration.function_name}</CardTitle>
                <p className="mt-1 text-masonic-lightblue">
                  {formatDate(registration.function_start_date)} - {formatDate(registration.function_end_date)}
                </p>
              </div>
              <PrintButton />
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            {/* Confirmation Number */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="text-center">
                <p className="text-sm font-medium text-green-800">Confirmation Number</p>
                <p className="text-2xl font-bold text-green-900 mt-1">{confirmationNumber}</p>
              </div>
            </div>

            {/* Contact Details Section */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Booking Contact */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Booking Contact
                </h3>
                <div className="space-y-2 text-sm">
                  <p className="font-medium">
                    {registration.billing_first_name} {registration.billing_last_name}
                  </p>
                  {registration.billing_email && (
                    <p className="flex items-center text-gray-600">
                      <Mail className="h-4 w-4 mr-2" />
                      {registration.billing_email}
                    </p>
                  )}
                  {registration.billing_phone && (
                    <p className="flex items-center text-gray-600">
                      <Phone className="h-4 w-4 mr-2" />
                      {registration.billing_phone}
                    </p>
                  )}
                  {registration.billing_street_address && (
                    <div className="text-gray-600 mt-2">
                      <p>{registration.billing_street_address}</p>
                      <p>
                        {registration.billing_city}, {registration.billing_state} {registration.billing_postal_code}
                      </p>
                      {registration.billing_country && <p>{registration.billing_country}</p>}
                    </div>
                  )}
                </div>
              </div>

              {/* Function Organiser */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <Building2 className="h-5 w-5 mr-2" />
                  Event Details
                </h3>
                <div className="space-y-2 text-sm">
                  <p className="font-medium">{registration.function_name}</p>
                  <p className="flex items-center text-gray-600">
                    <MapPin className="h-4 w-4 mr-2" />
                    {registration.function_location_name}
                  </p>
                  <div className="text-gray-600">
                    <p>{registration.function_location_address}</p>
                    <p>
                      {registration.function_location_city}, {registration.function_location_state} {registration.function_location_postal_code}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Registration Details */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Registration Details
              </h3>

              {/* Attendees */}
              <div className="space-y-4">
                {attendees.map((attendee: any, index: number) => {
                  const attendeeTickets = getTicketsForAttendee(attendee.attendeeId);
                  const attendeeTotal = attendeeTickets.reduce((sum: number, ticket: any) => sum + (ticket.ticketPrice || 0), 0);

                  return (
                    <Card key={attendee.attendeeId} className="border-gray-200">
                      <CardHeader className="bg-gray-50 py-3">
                        <div className="flex justify-between items-center">
                          <h4 className="font-medium text-gray-900">
                            {attendee.title} {attendee.firstName} {attendee.lastName}
                            {attendee.attendeeType === 'mason' && attendee.suffix && (
                              <span className="ml-2 text-sm text-gray-600">({attendee.suffix})</span>
                            )}
                          </h4>
                          {attendee.isPrimary && (
                            <Badge variant="secondary">Primary Attendee</Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="p-4">
                        {/* Attendee Details */}
                        <div className="grid md:grid-cols-2 gap-4 mb-4 text-sm">
                          <div>
                            <p className="text-gray-600">Type: <span className="font-medium text-gray-900">{attendee.attendeeType}</span></p>
                            {attendee.primaryEmail && (
                              <p className="text-gray-600">Email: <span className="font-medium text-gray-900">{attendee.primaryEmail}</span></p>
                            )}
                            {attendee.primaryPhone && (
                              <p className="text-gray-600">Phone: <span className="font-medium text-gray-900">{attendee.primaryPhone}</span></p>
                            )}
                          </div>
                          <div>
                            {attendee.dietaryRequirements && (
                              <p className="text-gray-600">Dietary: <span className="font-medium text-gray-900">{attendee.dietaryRequirements}</span></p>
                            )}
                            {attendee.specialNeeds && (
                              <p className="text-gray-600">Special Needs: <span className="font-medium text-gray-900">{attendee.specialNeeds}</span></p>
                            )}
                            {attendee.contactPreference && (
                              <p className="text-gray-600">Contact Preference: <span className="font-medium text-gray-900">{attendee.contactPreference}</span></p>
                            )}
                          </div>
                        </div>

                        {/* Tickets */}
                        {attendeeTickets.length > 0 && (
                          <div>
                            <h5 className="font-medium text-gray-900 mb-2">Tickets:</h5>
                            <div className="space-y-1">
                              {attendeeTickets.map((ticket: any) => (
                                <div key={ticket.ticketId} className="flex justify-between items-center text-sm">
                                  <span className="text-gray-600">{ticket.ticketName || 'Event Ticket'}</span>
                                  <span className="font-medium">${(ticket.ticketPrice || 0).toFixed(2)}</span>
                                </div>
                              ))}
                            </div>
                            <div className="mt-2 pt-2 border-t border-gray-200">
                              <div className="flex justify-between items-center text-sm font-medium">
                                <span>Attendee Total:</span>
                                <span>${attendeeTotal.toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            <Separator />

            {/* Order Summary */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <CreditCard className="h-5 w-5 mr-2" />
                Order Summary
              </h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal ({registration.total_tickets} tickets)</span>
                  <span className="font-medium">${subtotal.toFixed(2)}</span>
                </div>
                {stripeFee > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Processing Fee</span>
                    <span className="font-medium">${stripeFee.toFixed(2)}</span>
                  </div>
                )}
                <Separator className="my-2" />
                <div className="flex justify-between text-base font-semibold">
                  <span>Total Paid</span>
                  <span className="text-masonic-navy">${totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Footer Message */}
            <div className="text-center text-sm text-gray-600 pt-4">
              <p>A confirmation email has been sent to {registration.billing_email}</p>
              <p className="mt-1">Please save or print this confirmation for your records</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}