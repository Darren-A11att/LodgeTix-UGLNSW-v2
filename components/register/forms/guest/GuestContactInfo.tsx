import React, { useState } from 'react';
import { GuestAttendee, ContactPreference } from '@/lib/registration-types';
import { HelpCircle } from 'lucide-react';
import PhoneInputWrapper from '../../../../shared/components/PhoneInputWrapper';

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
}

const GuestContactInfo: React.FC<GuestContactInfoProps> = ({
  guest,
  id,
  onChange,
  handlePhoneChange,
  hideContactFields,
  showConfirmation,
  getConfirmationMessage,
  isPrimaryGuest
}) => {
  const contactOptions: Array<{ value: ContactPreference | ""; label: string; disabled?: boolean }> = [
    { value: "", label: "Please Select", disabled: true },
    { value: "Directly", label: "Directly" },
    { value: "Primary Attendee", label: "Primary Attendee" },
    { value: "Provide Later", label: "Provide Later" }
  ];
  const [emailInteracted, setEmailInteracted] = useState(false);

  if (!guest) {
    return null;
  }

  const handleContactPreferenceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as ContactPreference | "";
    onChange(id, 'contactPreference', value);
  };

  return (
    <div className="mb-4">
      <div className="flex items-center mb-1">
        <label className="block text-sm font-medium text-slate-700" htmlFor={`contactPreference-${id}`}>
          Contact *
        </label>
        <div className="relative inline-block ml-2 group">
          <HelpCircle className="h-4 w-4 text-primary cursor-help" />
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 -translate-y-1 invisible group-hover:visible bg-white text-slate-700 text-xs p-2 rounded shadow-lg w-48 z-10">
            Select how we should contact this guest regarding event information
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-12 gap-4">
        <div className={showConfirmation ? "col-span-4" : "col-span-full md:col-span-6"}>
          <select
            id={`contactPreference-${id}`}
            name={`contactPreference-${id}`}
            value={guest.contactPreference || ""}
            onChange={handleContactPreferenceChange}
            required
            className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            {contactOptions.map(option => (
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
            <div className="col-span-full md:col-span-6">
              <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor={`guestMobile-${id}`}>
                Mobile Number {guest.contactPreference === 'Directly' && ' *'}
              </label>
              <PhoneInputWrapper
                value={guest.mobile || ''}
                onChange={handlePhoneChange}
                inputProps={{
                  name: `guestMobile-${id}`,
                  id: `guestMobile-${id}`,
                }}
                required={guest.contactPreference === 'Directly'}
              />
            </div>
            
            <div className="col-span-full md:col-span-6">
              <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor={`guestEmail-${id}`}>
                Email Address {guest.contactPreference === 'Directly' && ' *'}
              </label>
              <input
                type="email"
                id={`guestEmail-${id}`}
                name="email"
                value={guest.email || ''}
                onChange={(e) => onChange(id, 'email', e.target.value)}
                required={guest.contactPreference === 'Directly'}
                placeholder="Email Address"
                className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default GuestContactInfo;