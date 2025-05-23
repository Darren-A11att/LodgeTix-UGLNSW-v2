import React from 'react';
import { useRegistrationStore } from '@/lib/registrationStore';
import { SummaryColumn } from './SummaryColumn';
import { SummarySection } from './SummarySection';
import { SummaryItem } from './SummaryItem';
import { formatCurrency } from '@/lib/formatters';
import { CreditCard, ShieldCheck, Lock, Check } from 'lucide-react';

/**
 * A simple payment summary component for the payment step
 */
export const SimplePaymentSummary: React.FC<{
  totalAmount: number;
  isPaymentValid?: boolean;
  showHeader?: boolean;
}> = ({ totalAmount, isPaymentValid = false, showHeader = false }) => {
  const { attendees } = useRegistrationStore();
  
  return (
    <SummaryColumn
      header={{
        title: 'Payment Summary',
        step: 5
      }}
      showHeader={showHeader}
    >
      {/* Order Total */}
      <SummarySection title="Order Total">
        <div className="py-4 text-center">
          <p className="text-sm text-muted-foreground mb-1">Total Amount</p>
          <p className="text-2xl font-bold">{formatCurrency(totalAmount)}</p>
          <p className="text-xs text-muted-foreground mt-1">
            For {attendees.length} attendee{attendees.length !== 1 ? "s" : ""}
          </p>
        </div>
      </SummarySection>
      
      {/* Payment Status */}
      <SummarySection title="Payment Status">
        <div className="flex items-start gap-3">
          <div className="mt-0.5">
            {isPaymentValid ? (
              <div className="bg-green-100 p-2 rounded-full">
                <Check className="h-4 w-4 text-green-600" />
              </div>
            ) : (
              <div className="bg-amber-100 p-2 rounded-full">
                <CreditCard className="h-4 w-4 text-amber-600" />
              </div>
            )}
          </div>
          <div className="flex-1">
            <p className="font-medium text-sm">
              {isPaymentValid ? 'Payment Information Valid' : 'Payment Information Required'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {isPaymentValid 
                ? 'Your payment information has been validated. Click "Process Payment" to complete your order.' 
                : 'Please fill in your payment details to continue.'}
            </p>
          </div>
        </div>
      </SummarySection>
      
      {/* Secure Payment Notice */}
      <SummarySection title="Secure Payment">
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="h-3 w-3 text-green-600 flex-shrink-0" />
            <span>All payment information is encrypted</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="h-3 w-3 text-green-600 flex-shrink-0" />
            <span>Processed securely by Stripe</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="h-3 w-3 text-green-600 flex-shrink-0" />
            <span>Your card details are never stored on our servers</span>
          </div>
        </div>
      </SummarySection>
      
      <div className="text-xs text-muted-foreground mt-4 text-center">
        You will receive email confirmation after successful payment.
      </div>
    </SummaryColumn>
  );
};