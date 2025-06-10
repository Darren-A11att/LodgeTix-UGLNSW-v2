'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { useConfirmationData } from './confirmation-data-provider';

interface ClientConfirmationPageProps {
  confirmationNumber: string;
  fallbackData?: any;
}

export function ClientConfirmationPage({ confirmationNumber, fallbackData }: ClientConfirmationPageProps) {
  const localData = useConfirmationData(confirmationNumber);
  const rawRegistration = localData || fallbackData;

  if (!rawRegistration) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-600">Loading confirmation data...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Normalize data structure to handle both localStorage and database formats
  const registration = {
    ...rawRegistration,
    // Normalize function data structure
    functionData: rawRegistration.functionData || {
      name: rawRegistration.function_name,
      slug: rawRegistration.function_slug,
      description: rawRegistration.function_description,
      startDate: rawRegistration.function_start_date,
      endDate: rawRegistration.function_end_date,
      imageUrl: rawRegistration.function_image_url,
      location: {
        place_name: rawRegistration.function_location_name,
        street_address: rawRegistration.function_location_address,
        suburb: rawRegistration.function_location_city,
        state: rawRegistration.function_location_state,
        country: rawRegistration.function_location_country,
        postal_code: rawRegistration.function_location_postal_code
      },
      organiser: {
        id: rawRegistration.function_organiser_id,
        name: rawRegistration.organiser_name || 'United Grand Lodge of NSW & ACT',
        knownAs: rawRegistration.organiser_known_as,
        abbreviation: rawRegistration.organiser_abbreviation,
        website: rawRegistration.organiser_website
      }
    },
    // Normalize tickets array - fix price field mapping
    tickets: (rawRegistration.tickets || []).map((ticket: any) => ({
      ...ticket,
      ticketPrice: ticket.ticketPrice || ticket.ticket_price || 0,
      ticketName: ticket.ticketName || ticket.ticket_name || 'Event Ticket'
    })),
    // Ensure attendees array exists
    attendees: rawRegistration.attendees || [],
    // Normalize billing details
    billingDetails: rawRegistration.billingDetails || {
      firstName: rawRegistration.billing_first_name || rawRegistration.customer_first_name,
      lastName: rawRegistration.billing_last_name || rawRegistration.customer_last_name,
      emailAddress: rawRegistration.billing_email || rawRegistration.customer_email,
      mobileNumber: rawRegistration.billing_phone || rawRegistration.customer_phone,
      addressLine1: rawRegistration.billing_street_address,
      suburb: rawRegistration.billing_city,
      stateTerritory: { name: rawRegistration.billing_state },
      postcode: rawRegistration.billing_postal_code,
      country: { name: rawRegistration.billing_country }
    }
  };

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

  // Calculate totals from local data - handle both field name formats
  const subtotal = registration.subtotal || 0;
  const stripeFee = registration.stripeFee || registration.stripe_fee || 0;
  const totalAmount = registration.totalAmount || registration.total_amount_paid || 0;

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
                <CardTitle className="text-2xl">{registration.functionData?.name || 'Event Registration'}</CardTitle>
                <p className="mt-1 text-masonic-lightblue">
                  {formatDate(registration.functionData?.startDate)} - {formatDate(registration.functionData?.endDate)}
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
                    {registration.billingDetails?.firstName} {registration.billingDetails?.lastName}
                  </p>
                  {registration.billingDetails?.emailAddress && (
                    <p className="flex items-center text-gray-600">
                      <Mail className="h-4 w-4 mr-2" />
                      {registration.billingDetails.emailAddress}
                    </p>
                  )}
                  {registration.billingDetails?.mobileNumber && (
                    <p className="flex items-center text-gray-600">
                      <Phone className="h-4 w-4 mr-2" />
                      {registration.billingDetails.mobileNumber}
                    </p>
                  )}
                  {registration.billingDetails?.addressLine1 && (
                    <div className="text-gray-600 mt-2">
                      <p>{registration.billingDetails.addressLine1}</p>
                      <p>
                        {registration.billingDetails.suburb}, {registration.billingDetails.stateTerritory?.name} {registration.billingDetails.postcode}
                      </p>
                      {registration.billingDetails.country?.name && <p>{registration.billingDetails.country.name}</p>}
                    </div>
                  )}
                </div>
              </div>

              {/* Function Details */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <Building2 className="h-5 w-5 mr-2" />
                  Event Details
                </h3>
                <div className="space-y-2 text-sm">
                  <p className="font-medium">{registration.functionData?.name || 'Event'}</p>
                  {registration.functionData?.organiser?.name && (
                    <p className="text-gray-600">
                      <span className="font-medium">Organiser:</span> {registration.functionData.organiser.name}
                    </p>
                  )}
                  {registration.functionData?.location && (
                    <>
                      <p className="flex items-center text-gray-600">
                        <MapPin className="h-4 w-4 mr-2" />
                        {registration.functionData.location.place_name}
                      </p>
                      <div className="text-gray-600">
                        <p>{registration.functionData.location.street_address}</p>
                        <p>
                          {registration.functionData.location.suburb}, {registration.functionData.location.state} {registration.functionData.location.postal_code}
                        </p>
                        <p>{registration.functionData.location.country}</p>
                      </div>
                    </>
                  )}
                  {(registration.functionData?.startDate || registration.functionData?.endDate) && (
                    <p className="flex items-center text-gray-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      {formatDate(registration.functionData.startDate)} - {formatDate(registration.functionData.endDate)}
                    </p>
                  )}
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
                {registration.attendees?.map((attendee: any, index: number) => {
                  const attendeeTickets = registration.tickets?.filter((ticket: any) => ticket.attendeeId === attendee.attendeeId) || [];
                  const attendeeTotal = attendeeTickets.reduce((sum: number, ticket: any) => sum + (ticket.ticketPrice || 0), 0);

                  return (
                    <Card key={attendee.attendeeId || index} className="border-gray-200">
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
                              {attendeeTickets.map((ticket: any, ticketIndex: number) => (
                                <div key={ticket.ticketId || ticketIndex} className="flex justify-between items-center text-sm">
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
                  <span className="text-gray-600">Subtotal ({registration.tickets?.length || 0} tickets)</span>
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
              <p>A confirmation email has been sent to {registration.billingDetails?.emailAddress}</p>
              <p className="mt-1">Please save or print this confirmation for your records</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}