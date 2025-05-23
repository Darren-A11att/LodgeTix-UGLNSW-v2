import React, { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TermsAndConditionsProps {
  agreed: boolean;
  onAgreeChange: (agreed: boolean) => void;
  termsText?: string;
  showFullTerms?: boolean;
  linkToTerms?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  className?: string;
}

export const TermsAndConditions: React.FC<TermsAndConditionsProps> = ({
  agreed,
  onAgreeChange,
  termsText,
  showFullTerms = false,
  linkToTerms,
  required = true,
  disabled = false,
  error,
  className,
}) => {
  const [showTermsModal, setShowTermsModal] = useState(false);

  const defaultTermsText = `
    By checking this box, you agree to our Terms and Conditions and Privacy Policy.
    Your personal information will be used solely for event registration and communication purposes.
  `;

  const fullTermsText = termsText || defaultTermsText;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-start space-x-2">
        <Checkbox
          id="terms-conditions"
          checked={agreed}
          onCheckedChange={(checked) => onAgreeChange(!!checked)}
          disabled={disabled}
          className={cn(error && "border-red-500")}
        />
        <div className="space-y-1">
          <Label
            htmlFor="terms-conditions"
            className={cn(
              "text-sm cursor-pointer",
              disabled && "opacity-50 cursor-not-allowed",
              error && "text-red-500"
            )}
          >
            I agree to the Terms and Conditions
            {required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          
          {linkToTerms && (
            <a
              href={linkToTerms}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              View Terms and Conditions
            </a>
          )}
          
          {showFullTerms && !linkToTerms && (
            <button
              type="button"
              onClick={() => setShowTermsModal(true)}
              className="text-sm text-blue-600 hover:underline"
            >
              View Terms and Conditions
            </button>
          )}
        </div>
      </div>
      
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
      
      {showFullTerms && showTermsModal && (
        <TermsModal
          termsText={fullTermsText}
          onClose={() => setShowTermsModal(false)}
        />
      )}
    </div>
  );
};

// Modal component for full terms display
const TermsModal: React.FC<{
  termsText: string;
  onClose: () => void;
}> = ({ termsText, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Terms and Conditions</h2>
        </div>
        
        <ScrollArea className="flex-1 p-4">
          <div className="prose prose-sm max-w-none">
            {termsText.split('\n').map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        </ScrollArea>
        
        <div className="p-4 border-t">
          <Button
            type="button"
            onClick={onClose}
            variant="default"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

// Event-specific terms
export const EventTermsAndConditions: React.FC<{
  eventId: string;
  agreed: boolean;
  onAgreeChange: (agreed: boolean) => void;
  error?: string;
}> = ({ eventId, agreed, onAgreeChange, error }) => {
  // Fetch event-specific terms based on eventId
  const termsText = `
    By registering for this event, you agree to:
    1. Attend the event at the specified date and time
    2. Follow the dress code requirements
    3. Respect the venue rules and regulations
    4. Allow photography/video for promotional purposes
    
    Cancellation Policy:
    - Full refund if cancelled 30+ days before event
    - 50% refund if cancelled 14-29 days before event
    - No refund if cancelled less than 14 days before event
  `;

  return (
    <TermsAndConditions
      agreed={agreed}
      onAgreeChange={onAgreeChange}
      termsText={termsText}
      showFullTerms={true}
      required={true}
      error={error}
    />
  );
};

// Privacy-focused terms
export const PrivacyAgreement: React.FC<{
  agreed: boolean;
  onAgreeChange: (agreed: boolean) => void;
}> = ({ agreed, onAgreeChange }) => {
  return (
    <TermsAndConditions
      agreed={agreed}
      onAgreeChange={onAgreeChange}
      termsText="I consent to the collection and processing of my personal data for event registration purposes."
      linkToTerms="/privacy-policy"
      required={true}
    />
  );
};

// Legacy-compatible version
export const LegacyTermsAndConditions: React.FC<{
  checked: boolean;
  onChange: (checked: boolean) => void;
}> = ({ checked, onChange }) => {
  return (
    <div className="p-4">
      <label className="flex items-start space-x-2 cursor-pointer">
        <input 
          type="checkbox" 
          checked={checked} 
          onChange={(e) => onChange(e.target.checked)}
          className="h-5 w-5 text-primary border-slate-300 rounded mt-0.5"
        />
        <div>
          <span className="text-sm font-medium text-slate-700">I agree to the Terms and Conditions</span>
          <div className="mt-3 text-xs text-slate-600 prose prose-sm max-w-none">
            <p className="mb-2">
              By registering for the Grand Proclamation event, you agree to the following terms:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>All registration information provided is accurate and complete.</li>
              <li>You understand that tickets are non-refundable but may be transferable subject to approval.</li>
              <li>Photography and video recording may take place during the event and may be used for promotional purposes.</li>
              <li>The United Grand Lodge of NSW & ACT reserves the right to modify the event program if necessary.</li>
              <li>You agree to follow all venue rules and COVID-19 safety requirements in place at the time of the event.</li>
            </ul>
          </div>
        </div>
      </label>
    </div>
  );
};

export default TermsAndConditions;