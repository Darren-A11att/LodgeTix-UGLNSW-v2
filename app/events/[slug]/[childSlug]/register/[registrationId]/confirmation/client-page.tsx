'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CalendarDays, Check, Download, MapPin, TicketIcon, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface RegistrationData {
  registrationId: string;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  attendees: any[];
  tickets: any[];
  event: any;
}

export default function ConfirmationPageClient({ 
  eventData,
  initialRegistrationId 
}: {
  eventData: any;
  initialRegistrationId?: string;
}) {
  const searchParams = useSearchParams();
  const [registrationData, setRegistrationData] = useState<RegistrationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  // Get registration ID from URL params or props
  const registrationId = searchParams.get('registration_id') || initialRegistrationId;
  const paymentIntent = searchParams.get('payment_intent');
  const paymentStatus = searchParams.get('payment_intent_client_secret') ? 'processing' : null;

  useEffect(() => {
    if (registrationId) {
      fetchRegistrationData();
    } else {
      setLoading(false);
      setError('No registration ID provided');
    }
  }, [registrationId]);

  // Handle return from Stripe 3D Secure
  useEffect(() => {
    const verifyPaymentIfNeeded = async () => {
      // Check if we're returning from Stripe 3D Secure
      if (registrationId && (paymentIntent || paymentStatus === 'processing')) {
        setVerifying(true);
        try {
          // Call verify payment endpoint
          const response = await fetch(`/api/registrations/${registrationId}/verify-payment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          });

          if (response.ok) {
            const result = await response.json();
            console.log('Payment verification result:', result);
            
            // Refresh registration data
            await fetchRegistrationData();
          }
        } catch (error) {
          console.error('Error verifying payment:', error);
        } finally {
          setVerifying(false);
        }
      }
    };

    verifyPaymentIfNeeded();
  }, [registrationId, paymentIntent, paymentStatus]);

  const fetchRegistrationData = async () => {
    if (!registrationId) return;

    try {
      setLoading(true);
      // Fetch registration details from your API
      const response = await fetch(`/api/registrations/${registrationId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch registration data');
      }

      const data = await response.json();
      setRegistrationData(data);
    } catch (err) {
      console.error('Error fetching registration:', err);
      setError('Failed to load registration details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading registration details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b bg-white px-4 md:px-6">
          <Link href="/" className="flex items-center">
            <TicketIcon className="mr-2 h-5 w-5 text-blue-600" />
            <span className="font-bold">LodgeTix</span>
          </Link>
        </header>
        
        <main className="container mx-auto max-w-2xl px-4 py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          
          <div className="mt-8 text-center">
            <Button asChild>
              <Link href="/">Return to Home</Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  // Show payment verification status
  if (verifying) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Verifying payment status...</p>
        </div>
      </div>
    );
  }

  // Check if payment is still pending
  const isPaymentPending = registrationData?.paymentStatus === 'requires_action' || 
                           registrationData?.paymentStatus === 'processing';

  const totalPrice = registrationData?.totalAmount || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b bg-white px-4 md:px-6">
        <Link href="/" className="flex items-center">
          <TicketIcon className="mr-2 h-5 w-5 text-blue-600" />
          <span className="font-bold">LodgeTix</span>
        </Link>
      </header>

      <main className="container mx-auto max-w-2xl px-4 py-8">
        <div className="mb-8 text-center">
          <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${
            isPaymentPending ? 'bg-yellow-100' : 'bg-green-100'
          }`}>
            {isPaymentPending ? (
              <Loader2 className="h-8 w-8 text-yellow-600 animate-spin" />
            ) : (
              <Check className="h-8 w-8 text-green-600" />
            )}
          </div>
          <h1 className="mb-2 text-2xl font-bold">
            {isPaymentPending ? 'Payment Processing...' : 'Tickets Confirmed!'}
          </h1>
          <p className="text-gray-500">
            {isPaymentPending 
              ? 'Your payment is being processed. This page will update automatically.'
              : 'Your tickets have been purchased successfully.'
            }
          </p>
        </div>

        {isPaymentPending && (
          <Alert className="mb-8">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Payment Verification in Progress</AlertTitle>
            <AlertDescription>
              We're verifying your payment. This usually takes just a few moments.
              Please don't close this page.
            </AlertDescription>
          </Alert>
        )}

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Order Confirmation</CardTitle>
            <CardDescription>Order #{registrationId}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="mb-2 text-lg font-medium">{eventData?.title || 'Event'}</h3>
              <div className="space-y-2 text-sm text-gray-500">
                <div className="flex items-center">
                  <CalendarDays className="mr-2 h-4 w-4" />
                  <span>
                    {eventData?.date}, {eventData?.time || 'Time TBD'}
                  </span>
                </div>
                <div className="flex items-start">
                  <MapPin className="mr-2 mt-1 h-4 w-4 flex-shrink-0" />
                  <span>{eventData?.location}</span>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="mb-2 font-medium">Registration Details</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Attendees</span>
                  <span>{registrationData?.attendees?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Status</span>
                  <span className={`font-medium ${
                    isPaymentPending ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {isPaymentPending ? 'Processing' : 'Confirmed'}
                  </span>
                </div>
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-between font-bold">
              <p>Total</p>
              <p>${totalPrice.toFixed(2)}</p>
            </div>

            {!isPaymentPending && (
              <div className="rounded-lg bg-gray-100 p-4 text-sm">
                <p className="font-medium">Purchase Date: {new Date().toLocaleDateString()}</p>
                <p className="text-gray-500">A receipt has been sent to your email.</p>
              </div>
            )}
          </CardContent>
          {!isPaymentPending && (
            <CardFooter className="flex flex-col space-y-2">
              <Button className="w-full">
                <Download className="mr-2 h-4 w-4" /> Download Tickets
              </Button>
              <Button variant="outline" asChild>
                <Link href={`/events/${eventData?.slug || eventData?.id}`}>View Event Details</Link>
              </Button>
            </CardFooter>
          )}
        </Card>

        {!isPaymentPending && (
          <div className="text-center">
            <h2 className="mb-4 text-xl font-bold">What's Next?</h2>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border p-4">
                <h3 className="mb-2 font-medium">Add to Calendar</h3>
                <p className="mb-4 text-sm text-gray-500">Don't miss the ceremony!</p>
                <Button variant="outline" size="sm" className="w-full">
                  Add to Calendar
                </Button>
              </div>
              <div className="rounded-lg border p-4">
                <h3 className="mb-2 font-medium">Invite a Brother</h3>
                <p className="mb-4 text-sm text-gray-500">Share with your Lodge!</p>
                <Button variant="outline" size="sm" className="w-full">
                  Share Event
                </Button>
              </div>
              <div className="rounded-lg border p-4">
                <h3 className="mb-2 font-medium">Find Accommodation</h3>
                <p className="mb-4 text-sm text-gray-500">Book nearby lodging!</p>
                <Button variant="outline" size="sm" className="w-full">
                  Find Hotels
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}