import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import PhoneInputWrapper from '../../../../shared/components/PhoneInputWrapper';
import { ContactPreference, MasonAttendee, UnifiedAttendeeData } from '@/lib/registration-types';

interface MasonContactInfoProps {
  mason: Pick<UnifiedAttendeeData, 'primaryPhone' | 'primaryEmail' | 'contactPreference'>;
  id: string;
  onChange: (
    id: string, 
    field: keyof Pick<UnifiedAttendeeData, 'primaryEmail' | 'contactPreference'>,
    value: UnifiedAttendeeData[keyof Pick<UnifiedAttendeeData, 'primaryEmail' | 'contactPreference'>]
  ) => void;
  handlePhoneChange: (value: string) => void;
  isPrimary: boolean;
  hideContactFields: boolean;
  showConfirmation: boolean;
  getConfirmationMessage: () => string;
}

const MasonContactInfo: React.FC<MasonContactInfoProps> = ({
  mason,
  id,
  onChange,
  handlePhoneChange,
  isPrimary,
  hideContactFields,
  showConfirmation,
  getConfirmationMessage,
}) => {
  const contactOptions: Array<{ value: ContactPreference | ""; label: string; disabled?: boolean }> = [
    { value: "", label: "Please Select", disabled: true },
    { value: "Directly", label: "Directly" },
    { value: "Primary Attendee", label: "Primary Attendee" },
    { value: "Provide Later", label: "Provide Later" },
    { value: "Mason/Guest", label: "Mason/Guest" }
  ];
  const [emailInteracted, setEmailInteracted] = useState(false);
  const [phoneInteracted, setPhoneInteracted] = useState(false);

  return (
    <>
      {/* Contact Section - Different for Primary vs Additional */}
      {isPrimary ? (
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor={`phone-${id}`}>
              Mobile Number *
            </label>
            <PhoneInputWrapper
              value={mason.primaryPhone ?? ''}
              onChange={handlePhoneChange}
              inputProps={{
                name: `phone-${id}`,
                id: `phone-${id}`,
              }}
              required={true}
              className={`${phoneInteracted ? 'interacted' : ''}`}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor={`email-${id}`}>
              Email Address *
            </label>
            <input
              type="email"
              id={`email-${id}`}
              name={`email-${id}`}
              value={mason.primaryEmail ?? ''}
              onChange={(e) => onChange(id, 'primaryEmail', e.target.value)}
              onBlur={() => setEmailInteracted(true)}
              required={true}
              className={`w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50
                         ${emailInteracted ? 'interacted' : ''}
                         [&.interacted:invalid]:border-red-500 [&.interacted:invalid]:text-red-600
                         focus:[&.interacted:invalid]:border-red-500 focus:[&.interacted:invalid]:ring-red-500`}

              title="Please enter a valid email address (e.g., user@example.com)"
            />
          </div>
        </div>
      ) : (
        /* Contact Preference Section for Additional Masons */
        <div className="mb-4">
          <div className="grid grid-cols-12 gap-4">
            {/* Contact dropdown */}
            <div className="col-span-4">
              <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor={`contactPreference-${id}`}>
                <span>Contact *</span>
                <span className="inline-block ml-1">
                  <div className="relative inline-block group">
                    <HelpCircle className="h-4 w-4 text-primary cursor-help" />
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 -translate-y-1 invisible group-hover:visible bg-white text-slate-700 text-xs p-2 rounded shadow-lg w-48 z-10">
                      Select how we should contact this attendee regarding event information
                    </div>
                  </div>
                </span>
              </label>
              <select
                id={`contactPreference-${id}`}
                name={`contactPreference-${id}`}
                value={mason.contactPreference || ""}
                onChange={(e) => onChange(id, 'contactPreference', e.target.value as ContactPreference | "")}
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                {contactOptions.map(option => (
                  <option key={option.label} value={option.value} disabled={option.disabled}>{option.label}</option>
                ))}
              </select>
            </div>
            
            {/* Render contact fields if not hidden (for non-primary with 'Directly' preference) */}
            {!hideContactFields && (
              <>
                {/* Phone input */}
                <div className="col-span-4">
                  <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor={`phone-${id}`}>
                    Mobile Number *
                  </label>
                  <PhoneInputWrapper
                    value={mason.primaryPhone ?? ''}
                    onChange={handlePhoneChange}
                    inputProps={{
                      name: `phone-${id}`,
                      id: `phone-${id}`,
                    }}
                    required={true}
                    className={`${phoneInteracted ? 'interacted' : ''}`}
                  />
                </div>
                
                {/* Email input */}
                <div className="col-span-4">
                  <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor={`email-${id}`}>
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id={`email-${id}`}
                    name={`email-${id}`}
                    value={mason.primaryEmail ?? ''}
                    onChange={(e) => onChange(id, 'primaryEmail', e.target.value)}
                    onBlur={() => setEmailInteracted(true)}
                    required={true}
                    className={`w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50
                               ${emailInteracted ? 'interacted' : ''}
                               [&.interacted:invalid]:border-red-500 [&.interacted:invalid]:text-red-600
                               focus:[&.interacted:invalid]:border-red-500 focus:[&.interacted:invalid]:ring-red-500`}

                    title="Please enter a valid email address (e.g., user@example.com)"
                  />
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default MasonContactInfo;