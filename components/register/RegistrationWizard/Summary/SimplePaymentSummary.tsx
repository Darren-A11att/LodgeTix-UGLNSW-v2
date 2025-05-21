import React from 'react';
import { useRegistrationStore } from '@/lib/registrationStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { CreditCard, ShieldCheck, Lock, Check } from 'lucide-react';

/**
 * A simple payment summary component for the payment step
 */
export const SimplePaymentSummary: React.FC<{
  totalAmount: number;
  isPaymentValid?: boolean;
}> = ({ totalAmount, isPaymentValid = false }) => {
  const { attendees } = useRegistrationStore();
  
  return (
    <Card className="border-masonic-gold">
      <CardHeader className="bg-masonic-gold/10">
        <CardTitle>Payment Summary</CardTitle>
        <CardDescription>
          {attendees.length} attendee{attendees.length !== 1 ? "s" : ""}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 py-4">
        {/* Order Total */}
        <div className="py-3 border bg-white rounded-md">
          <div className="text-center">
            <p className="text-sm text-gray-600">Total Amount</p>
            <p className="text-2xl font-bold text-masonic-navy">${totalAmount.toFixed(2)}</p>
          </div>
        </div>
        
        {/* Payment Status */}
        <div className="flex items-center p-3 bg-gray-50 rounded-md">
          <div className="mr-3">
            {isPaymentValid ? (
              <div className="bg-green-100 p-2 rounded-full">
                <Check className="h-5 w-5 text-green-600" />
              </div>
            ) : (
              <div className="bg-amber-100 p-2 rounded-full">
                <CreditCard className="h-5 w-5 text-amber-600" />
              </div>
            )}
          </div>
          <div>
            <p className="font-medium text-sm">
              {isPaymentValid ? 'Payment Information Valid' : 'Payment Information Required'}
            </p>
            <p className="text-xs text-gray-500">
              {isPaymentValid 
                ? 'Your payment information has been validated. Click "Process Payment" to complete your order.' 
                : 'Please fill in your payment details to continue.'}
            </p>
          </div>
        </div>
        
        {/* Secure Payment Notice */}
        <div className="space-y-2 py-3">
          <div className="flex items-center mb-1">
            <Lock className="h-4 w-4 mr-2 text-masonic-navy" />
            <h4 className="text-sm font-medium">Secure Payment</h4>
          </div>
          <ul className="space-y-2 pl-6 text-xs text-gray-600">
            <li className="flex items-center">
              <ShieldCheck className="h-3 w-3 mr-1 text-green-600 flex-shrink-0" />
              <span>All payment information is encrypted</span>
            </li>
            <li className="flex items-center">
              <ShieldCheck className="h-3 w-3 mr-1 text-green-600 flex-shrink-0" />
              <span>Processed securely by Stripe</span>
            </li>
            <li className="flex items-center">
              <ShieldCheck className="h-3 w-3 mr-1 text-green-600 flex-shrink-0" />
              <span>Your card details are never stored on our servers</span>
            </li>
          </ul>
        </div>
      </CardContent>
      <CardFooter className="bg-gray-50 p-4 text-center text-sm text-gray-600">
        <p>You will receive email confirmation after successful payment.</p>
      </CardFooter>
    </Card>
  );
};