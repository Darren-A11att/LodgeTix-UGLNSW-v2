# DONE Task 115: Update PaymentStep

## Objective
Update the PaymentStep to handle payment processing with the new attendee structure and improved validation.

## Dependencies
- Task 114 (OrderReviewStep)
- Stripe integration
- Payment form components

## Reference Files
- `components/register/registration-wizard/steps/PaymentStep.tsx`
- `components/register/payment/CheckoutForm.tsx`

## Steps

1. Update `components/register/registration-wizard/steps/PaymentStep.tsx`:
```typescript
import React, { useCallback, useState } from 'react';
import { useRegistrationStore } from '@/lib/registrationStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronLeft, 
  CreditCard, 
  Lock,
  AlertCircle,
  Loader2 
} from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { formatCurrency } from '@/lib/formatters';
import { BillingDetailsForm } from '../../forms/payment/BillingDetailsForm';

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface PaymentStepProps {
  onNext: () => void;
  onBack: () => void;
}

// Inner component that uses Stripe hooks
const PaymentForm: React.FC<{
  amount: number;
  onSuccess: (paymentIntentId: string) => void;
  onError: (error: string) => void;
}> = ({ amount, onSuccess, onError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { attendees } = useRegistrationStore();
  
  const [billingDetails, setBillingDetails] = useState({
    name: '',
    email: '',
    phone: '',
    address: {
      line1: '',
      line2: '',
      city: '',
      state: '',
      postal_code: '',
      country: 'AU',
    },
  });
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);

  // Pre-fill billing details from primary attendee
  useEffect(() => {
    const primaryAttendee = attendees.find(a => a.isPrimary);
    if (primaryAttendee) {
      setBillingDetails(prev => ({
        ...prev,
        name: `${primaryAttendee.firstName} ${primaryAttendee.lastName}`,
        email: primaryAttendee.primaryEmail || '',
        phone: primaryAttendee.primaryPhone || '',
      }));
    }
  }, [attendees]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setCardError(null);

    try {
      // Create payment intent
      const response = await fetch('/api/stripe/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: Math.round(amount * 100), // Convert to cents
          metadata: {
            attendeeCount: attendees.length,
            registrationType: useRegistrationStore.getState().registrationType,
          },
        }),
      });

      const { clientSecret } = await response.json();

      // Confirm payment
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
          billing_details: billingDetails,
        },
      });

      if (error) {
        setCardError(error.message || 'Payment failed');
        onError(error.message || 'Payment failed');
      } else if (paymentIntent) {
        onSuccess(paymentIntent.id);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Payment failed';
      setCardError(message);
      onError(message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Billing details */}
      <Card>
        <CardHeader>
          <CardTitle>Billing Information</CardTitle>
          <CardDescription>
            Enter the billing details for this payment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BillingDetailsForm
            billingDetails={billingDetails}
            onChange={setBillingDetails}
          />
        </CardContent>
      </Card>

      {/* Payment method */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Method</CardTitle>
          <CardDescription>
            Enter your card details securely
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-3 border rounded-md">
              <CardElement
                options={{
                  style: {
                    base: {
                      fontSize: '16px',
                      color: '#424770',
                      '::placeholder': {
                        color: '#aab7c4',
                      },
                    },
                    invalid: {
                      color: '#9e2146',
                    },
                  },
                }}
                onChange={(e) => {
                  if (e.error) {
                    setCardError(e.error.message);
                  } else {
                    setCardError(null);
                  }
                }}
              />
            </div>

            {cardError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{cardError}</AlertDescription>
              </Alert>
            )}

            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Lock className="w-4 h-4" />
              <span>Your payment information is encrypted and secure</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submit button */}
      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={!stripe || isProcessing}
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <CreditCard className="mr-2 h-4 w-4" />
            Pay {formatCurrency(amount)}
          </>
        )}
      </Button>
    </form>
  );
};

// Main payment step component
export const PaymentStep: React.FC<PaymentStepProps> = ({
  onNext,
  onBack,
}) => {
  const { 
    tickets,
    attendees,
    event,
    setPaymentStatus,
  } = useRegistrationStore();

  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Calculate payment amount
  const amount = tickets?.total || 0;
  const fees = amount * 0.03; // 3% processing fee
  const total = amount + fees;

  const handlePaymentSuccess = useCallback(async (paymentIntentId: string) => {
    try {
      // Update payment status in store
      setPaymentStatus({
        status: 'completed',
        paymentIntentId,
        amount: total,
        timestamp: new Date().toISOString(),
      });

      // Save registration to database
      await saveRegistration({
        attendees,
        tickets,
        event,
        paymentIntentId,
        amount: total,
      });

      setPaymentSuccess(true);
      
      // Navigate to confirmation after a short delay
      setTimeout(() => {
        onNext();
      }, 1500);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save registration';
      setPaymentError(message);
    }
  }, [attendees, tickets, event, total, setPaymentStatus, onNext]);

  const handlePaymentError = useCallback((error: string) => {
    setPaymentError(error);
    setPaymentStatus({
      status: 'failed',
      error,
      timestamp: new Date().toISOString(),
    });
  }, [setPaymentStatus]);

  if (paymentSuccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
          <Check className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-xl font-semibold">Payment Successful!</h3>
        <p className="text-gray-600">Redirecting to confirmation...</p>
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Step header */}
      <div>
        <h2 className="text-2xl font-bold">Payment</h2>
        <p className="text-gray-600 mt-1">
          Complete your registration with secure payment
        </p>
      </div>

      {/* Order summary */}
      <Card>
        <CardHeader>
          <CardTitle>Order Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Event</span>
              <span>{event?.name || 'Event'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Attendees</span>
              <span>{attendees.length}</span>
            </div>
            
            <Separator />
            
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>{formatCurrency(amount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Processing Fee</span>
              <span>{formatCurrency(fees)}</span>
            </div>
            
            <Separator />
            
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment error */}
      {paymentError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{paymentError}</AlertDescription>
        </Alert>
      )}

      {/* Payment form */}
      <Elements stripe={stripePromise}>
        <PaymentForm
          amount={total}
          onSuccess={handlePaymentSuccess}
          onError={handlePaymentError}
        />
      </Elements>

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t">
        <Button
          variant="outline"
          onClick={onBack}
          className="gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Review
        </Button>
      </div>

      {/* Security badges */}
      <div className="flex justify-center items-center gap-4 text-sm text-gray-600">
        <Badge variant="secondary" className="gap-1">
          <Lock className="w-3 h-3" />
          Secure Payment
        </Badge>
        <Badge variant="secondary">
          Powered by Stripe
        </Badge>
      </div>
    </div>
  );
};

// Helper function to save registration
async function saveRegistration(data: any) {
  const response = await fetch('/api/registrations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Failed to save registration');
  }

  return response.json();
}
```

2. Create payment validation helper:
```typescript
// Payment validation and security helper
export const usePaymentValidation = () => {
  const { attendees, tickets } = useRegistrationStore();

  const validatePaymentData = useCallback(() => {
    const errors: string[] = [];

    // Validate attendees
    if (attendees.length === 0) {
      errors.push('No attendees found');
    }

    // Validate tickets
    if (!tickets || Object.keys(tickets.selectedTickets).length === 0) {
      errors.push('No tickets selected');
    }

    // Validate primary attendee
    const primaryAttendee = attendees.find(a => a.isPrimary);
    if (!primaryAttendee) {
      errors.push('No primary contact found');
    }

    // Validate ticket assignments
    const unassignedAttendees = attendees.filter(
      a => !tickets?.ticketAssignments?.[a.attendeeId]
    );
    if (unassignedAttendees.length > 0) {
      errors.push('Some attendees have no tickets assigned');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }, [attendees, tickets]);

  return { validatePaymentData };
};
```

## Deliverables
- Updated PaymentStep component
- Stripe integration with Elements
- Billing details form
- Payment processing logic
- Success/error handling

## Success Criteria
- Secure payment processing
- Clear order summary
- Proper error handling
- Success confirmation
- Registration saved after payment