import React, { useState, useMemo, useEffect, useRef } from 'react';
import { GuestAttendee, ContactPreference, MasonAttendee } from '@/lib/registration-types';
import { HelpCircle } from 'lucide-react';
import { PhoneInput } from '@/components/ui/phone-input';
import type { UnifiedAttendeeData } from '@/lib/registrationStore';

interface GuestContactInfoProps {
  guest: GuestAttendee | null;
  id: string;
  onChange: (
    id: string, 
    field: keyof Pick<GuestAttendee, 'contactPreference' | 'email'>, 
    value: GuestAttendee[keyof Pick<GuestAttendee, 'contactPreference' | 'email'>]
  ) => void;
  handlePhoneChange: (value: string) => void;
  hideContactFields: boolean;
  showConfirmation: boolean;
  getConfirmationMessage: () => string;
  isPrimaryGuest?: boolean;
  primaryAttendeeData?: UnifiedAttendeeData | null;
}

const GuestContactInfo: React.FC<GuestContactInfoProps> = ({
  guest,
  id,
  onChange,
  handlePhoneChange,
  hideContactFields,
  showConfirmation,
  getConfirmationMessage,
  isPrimaryGuest,
  primaryAttendeeData
}) => {
  // Create refs for form inputs
  const contactPreferenceRef = useRef<HTMLSelectElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null); // This will be used with PhoneInput
  
  // Create a ref to store the latest props
  const guestRef = useRef(guest);
  
  // Update the ref when props change
  useEffect(() => {
    if (guest) {
      guestRef.current = guest;
    }
  }, [guest]);
  
  // Local state for conditional rendering and tracking the current contact preference
  const [contactPreference, setContactPreference] = useState<string>(guest?.contactPreference || '');
  const [phone, setPhone] = useState<string>(guest?.mobile || '');
  const dynamicContactOptions = useMemo(() => {
    const options: Array<{ value: ContactPreference | ""; label: string; disabled?: boolean }> = [
      { value: "", label: "Please Select", disabled: true },
      { value: "Directly", label: "Directly" },
      { value: "Provide Later", label: "Provide Later" },
    ];

    // Only show the primary attendee as a contact option if their contactPreference is set to "Directly"
    const primaryName = primaryAttendeeData?.firstName && primaryAttendeeData?.lastName
      ? `${primaryAttendeeData.firstName} ${primaryAttendeeData.lastName}`.trim()
      : null;

    if (primaryName && primaryAttendeeData?.contactPreference === 'Directly') {
      options.push({ value: "Primary Attendee", label: primaryName });
    }

    return options;
  }, [primaryAttendeeData]);

  // Interaction states for styling
  const [contactPreferenceInteracted, setContactPreferenceInteracted] = useState(false);
  const [emailInteracted, setEmailInteracted] = useState(false);
  const [phoneInteracted, setPhoneInteracted] = useState(false);

  if (!guest) {
    return null;
  }

  // Handle the phone input's onChange (special case for PhoneInput component)
  const handleLocalPhoneChange = (value: string) => {
    setPhone(value);
    // Don't update store immediately - we'll do it on blur
  };
  
  // Handle contactPreference change to update UI immediately
  const handleContactPreferenceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as ContactPreference | "";
    setContactPreference(value); // Update local state for conditional rendering
    
    // Also update the store immediately so fields show/hide right away
    if (guest) {
      const currentValue = guestRef.current?.contactPreference || '';
      if (value !== currentValue) {
        onChange(id, 'contactPreference', value);
      }
    }
  };

  return (
    <div className="mb-3">
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-4">
          <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor={`contactPreference-${id}`}>
            Contact *
           {/* HelpCircle if needed */}
          </label>
          <select
            id={`contactPreference-${id}`}
            name={`contactPreference-${id}`}
            ref={contactPreferenceRef}
            defaultValue={guest?.contactPreference || ''}
            onChange={handleContactPreferenceChange}
            onBlur={() => {
              setContactPreferenceInteracted(true);
              if (guest) {
                const newValue = contactPreferenceRef.current?.value as ContactPreference | '' || '';
                const currentValue = guestRef.current?.contactPreference || '';
                
                // Only update if value has changed
                if (newValue !== currentValue) {
                  onChange(id, 'contactPreference', newValue);
                }
              }
            }}
            required
            className={`w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 
                      ${contactPreferenceInteracted ? 'interacted' : ''} 
                      [&.interacted:invalid]:border-red-500 focus:[&.interacted:invalid]:border-red-500 focus:[&.interacted:invalid]:ring-red-500`}
          >
            {dynamicContactOptions.map(option => (
              <option key={option.label} value={option.value} disabled={option.disabled}>{option.label}</option>
            ))}
          </select>
        </div>
        
        {showConfirmation && (
          <div className="col-span-8 flex items-center text-sm text-slate-700 bg-blue-50 p-3 rounded-md border border-blue-200">
            {getConfirmationMessage()} *
          </div>
        )}
        
        {!hideContactFields && (
          <>
            <div className="col-span-full md:col-span-4">
              <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor={`guestMobile-${id}`}>
                Mobile Number {guest.contactPreference === 'Directly' && ' *'}
              </label>
              <PhoneInput
                name={`guestMobile-${id}`}
                label=""
                value={phone}
                onChange={handleLocalPhoneChange}
                onBlur={() => {
                  setPhoneInteracted(true);
                  if (phone !== guest?.mobile) {
                    handlePhoneChange(phone);
                  }
                }}
                required={guest.contactPreference === 'Directly'}
              />
            </div>
            
            <div className="col-span-full md:col-span-4">
              <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor={`guestEmail-${id}`}>
                Email Address {guest.contactPreference === 'Directly' && ' *'}
              </label>
              <input
                type="email"
                id={`guestEmail-${id}`}
                name="email"
                ref={emailRef}
                defaultValue={guest?.email || ''}
                onBlur={() => {
                  setEmailInteracted(true);
                  if (guest) {
                    const newValue = emailRef.current?.value || '';
                    const currentValue = guestRef.current?.email || '';
                    
                    // Only update if value has changed
                    if (newValue !== currentValue) {
                      onChange(id, 'email', newValue);
                    }
                  }
                }}
                required={guest.contactPreference === 'Directly'}
                placeholder="Email Address"
                className={`w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 
                          ${emailInteracted ? 'interacted' : ''} 
                          [&.interacted:invalid]:border-red-500 [&.interacted:invalid]:text-red-600 
                          focus:[&.interacted:invalid]:border-red-500 focus:[&.interacted:invalid]:ring-red-500`}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default GuestContactInfo;