import { formatCurrency } from '@/lib/formatters';

interface PaymentSummaryDataProps {
  totalAmount: number;
  isPaymentValid?: boolean;
  attendeeCount: number;
  ticketCount?: number;
  isProcessing?: boolean;
  error?: string | null;
}

export function getPaymentSummaryData({ 
  totalAmount, 
  isPaymentValid = false,
  attendeeCount,
  ticketCount = 0,
  isProcessing = false,
  error = null
}: PaymentSummaryDataProps) {
  const sections = [];
  
  // Order Summary section
  sections.push({
    title: 'Order Summary',
    items: [
      {
        label: 'Total Attendees',
        value: attendeeCount.toString()
      },
      {
        label: 'Total Tickets',
        value: ticketCount.toString()
      },
      {
        label: 'Amount Due',
        value: formatCurrency(totalAmount),
        isHighlight: true
      }
    ]
  });
  
  // Payment Status section
  let statusMessage = 'Payment Information Required';
  let statusDetails = 'Please fill in your payment details to continue.';
  
  if (error) {
    statusMessage = 'Payment Error';
    statusDetails = error;
  } else if (isProcessing) {
    statusMessage = 'Processing Payment...';
    statusDetails = 'Please wait while we process your payment.';
  } else if (isPaymentValid) {
    statusMessage = 'Payment Information Valid';
    statusDetails = 'Your payment information has been validated. Click "Process Payment" to complete your order.';
  }
  
  sections.push({
    title: 'Payment Status',
    items: [
      {
        label: 'Status',
        value: statusMessage
      },
      {
        label: 'Details',
        value: statusDetails
      }
    ]
  });
  
  // Secure Payment Notice section
  sections.push({
    title: 'Secure Payment',
    items: [
      {
        label: '✓',
        value: 'All payment information is encrypted'
      },
      {
        label: '✓',
        value: 'Processed securely by Stripe'
      },
      {
        label: '✓',
        value: 'Your card details are never stored on our servers'
      }
    ]
  });
  
  return {
    sections,
    footer: 'You will receive email confirmation after successful payment.',
    emptyMessage: 'No payment information available'
  };
}