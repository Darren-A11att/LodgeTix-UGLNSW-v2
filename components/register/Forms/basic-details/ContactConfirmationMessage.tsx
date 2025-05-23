import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-react';
import { getConfirmationMessage } from '../attendee/utils/businessLogic';

interface ContactConfirmationMessageProps {
  contactPreference: string;
  primaryAttendeeName: string;
}

export const ContactConfirmationMessage: React.FC<ContactConfirmationMessageProps> = ({
  contactPreference,
  primaryAttendeeName,
}) => {
  const message = getConfirmationMessage(contactPreference, primaryAttendeeName);

  if (!message) return null;

  return (
    <Alert 
      className="bg-blue-50 border-blue-200 contact-confirmation-message" 
      data-preference={contactPreference}
    >
      <InfoIcon className="h-4 w-4 text-blue-600" />
      <AlertDescription className="text-blue-900">
        {message}
      </AlertDescription>
    </Alert>
  );
};