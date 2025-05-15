import React from 'react';

interface ContactConfirmationMessageProps {
  messageText: string;
}

const ContactConfirmationMessage: React.FC<ContactConfirmationMessageProps> = ({ messageText }) => {
  if (!messageText) {
    return null; // Don't render anything if the message is empty
  }

  return (
    <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-md border border-slate-200">
      {messageText}
    </p>
  );
};

export default ContactConfirmationMessage; 