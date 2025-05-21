# Task: Refactor Remaining Wizard Steps

## Description
Refactor the remaining step components (ticket selection, order review, payment, confirmation) to work with the new layout system. Each component will be simplified to focus on content only, with layout, navigation, and headers handled by parent components.

## Steps
1. Update each step component to use the appropriate layout component
2. Remove section headers and navigation buttons from each component
3. Move titles and descriptions to the parent component
4. Implement appropriate layouts for each step type
5. Test to ensure all functionality is preserved

## Implementation Overview

For each step component, we'll follow a similar pattern:

1. **Ticket Selection Step**: Use `TwoColumnStepLayout` with main content and summary sidebar
2. **Order Review Step**: Use `OneColumnStepLayout` with a focused view of order details
3. **Payment Step**: Use `TwoColumnStepLayout` with payment form and order summary
4. **Confirmation Step**: Use `OneColumnStepLayout` with centered confirmation details

## Example Implementation for Ticket Selection Step

```tsx
// Modified components/register/RegistrationWizard/Steps/ticket-selection-step.tsx
import React from 'react';
import { useRegistrationStore } from '@/lib/registrationStore';
import { TwoColumnStepLayout } from '../Layouts/TwoColumnStepLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// ... other imports

const TicketSelectionStep: React.FC = () => {
  const { attendees } = useRegistrationStore();
  
  // Summary content for sidebar
  const renderSummary = () => {
    return (
      <div className="space-y-4">
        <h3 className="font-medium">Attendees</h3>
        <ul className="space-y-2">
          {attendees.map((attendee) => (
            <li key={attendee.attendeeId} className="text-sm">
              {attendee.firstName} {attendee.lastName}
            </li>
          ))}
        </ul>
      </div>
    );
  };
  
  return (
    <TwoColumnStepLayout
      summaryTitle="Registration Summary"
      summaryContent={renderSummary()}
    >
      <Card>
        <CardContent className="pt-6">
          {/* Ticket selection content */}
          <div className="space-y-6">
            {/* Ticket selection form content */}
            {/* No navigation buttons - those are handled by parent */}
          </div>
        </CardContent>
      </Card>
    </TwoColumnStepLayout>
  );
};

export default TicketSelectionStep;
```

## Example Implementation for Order Review Step

```tsx
// Modified components/register/RegistrationWizard/Steps/order-review-step.tsx
import React from 'react';
import { useRegistrationStore } from '@/lib/registrationStore';
import { OneColumnStepLayout } from '../Layouts/OneColumnStepLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// ... other imports

const OrderReviewStep: React.FC = () => {
  const { attendees, tickets } = useRegistrationStore();
  
  return (
    <OneColumnStepLayout>
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-8">
            {/* Attendee summary section */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Attendees</h3>
              {/* Attendee details */}
            </div>
            
            {/* Ticket summary section */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Tickets</h3>
              {/* Ticket details */}
            </div>
            
            {/* Order total */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Order Total</h3>
              {/* Order total calculation */}
            </div>
          </div>
        </CardContent>
      </Card>
    </OneColumnStepLayout>
  );
};

export default OrderReviewStep;
```

## Example Implementation for Payment Step

```tsx
// Modified components/register/RegistrationWizard/Steps/payment-step.tsx
import React from 'react';
import { useRegistrationStore } from '@/lib/registrationStore';
import { TwoColumnStepLayout } from '../Layouts/TwoColumnStepLayout';
import { Card, CardContent } from '@/components/ui/card';
import { CheckoutForm } from '../../RegistrationWizard/payment/CheckoutForm';
import { OrderSummary } from '../../RegistrationWizard/payment/OrderSummary';
// ... other imports

const PaymentStep: React.FC = () => {
  const { attendees, tickets, orderTotal } = useRegistrationStore();
  
  return (
    <TwoColumnStepLayout
      summaryTitle="Order Summary"
      summaryContent={<OrderSummary orderTotal={orderTotal} />}
    >
      <Card>
        <CardContent className="pt-6">
          <CheckoutForm />
        </CardContent>
      </Card>
    </TwoColumnStepLayout>
  );
};

export default PaymentStep;
```

## Example Implementation for Confirmation Step

```tsx
// Modified components/register/RegistrationWizard/Steps/confirmation-step.tsx
import React from 'react';
import { useRegistrationStore } from '@/lib/registrationStore';
import { OneColumnStepLayout } from '../Layouts/OneColumnStepLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
// ... other imports

const ConfirmationStep: React.FC = () => {
  const { confirmationNumber } = useRegistrationStore();
  
  return (
    <OneColumnStepLayout>
      <div className="space-y-8">
        {/* Success header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          
          <div>
            <h2 className="text-3xl font-bold text-green-600">Registration Complete!</h2>
            <p className="text-gray-600 mt-2">
              Your registration has been successfully processed
            </p>
          </div>

          <div className="flex items-center justify-center gap-2">
            <Badge variant="success" className="text-lg px-4 py-2">
              Registration ID: {confirmationNumber || 'REG-' + Date.now()}
            </Badge>
          </div>
        </div>

        {/* Registration details card */}
        <Card>
          <CardContent className="pt-6">
            {/* Confirmation details */}
          </CardContent>
        </Card>
      </div>
    </OneColumnStepLayout>
  );
};

export default ConfirmationStep;
```

## Testing Criteria
- Verify all steps display with the correct layout
- Confirm navigation between steps works correctly
- Check that all step content still functions properly
- Ensure responsive layouts work as expected on mobile and desktop
- Validate that all data flows correctly between steps 