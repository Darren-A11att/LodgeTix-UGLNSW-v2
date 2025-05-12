import React, { useState } from 'react';
import 'react-phone-input-2/lib/style.css';
import { HelpCircle, X } from 'lucide-react';
import PhoneInputWrapper from '../../../../shared/components/PhoneInputWrapper';
// Using UnifiedAttendeeData to get the correct ContactPreference type from the store definitions
import type { UnifiedAttendeeData } from '../../../../lib/registrationStore'; 

// Extract ContactPreference type, allowing undefined for local form state
type FormContactPreference = UnifiedAttendeeData['contactPreference'] | undefined;

interface GuestPartnerFormProps {
  partnerData: {
    id: string;
    title: string;
    firstName: string;
    lastName: string;
    relationship: string;
    contactPreference: FormContactPreference;
    mobile?: string;
    email?: string;
    dietaryRequirements?: string;
    specialNeeds?: string;
  };
  relatedGuestName: string;
  primaryAttendeeData?: any; 
  updateField: (id: string, field: string, value: any) => void;
  onRemove: () => void;
}

const GuestPartnerForm: React.FC<GuestPartnerFormProps> = ({
  partnerData,
  relatedGuestName,
  primaryAttendeeData,
  updateField,
  onRemove,
}) => {
  const titles = ["Mr", "Mrs", "Ms", "Miss", "Dr", "Rev", "Prof"];
  const relationships = ["Partner", "Spouse", "Child", "Friend", "Other"];
  // Define options based on the actual values used in UnifiedAttendeeData for contactPreference
  const contactOptions: Array<{ value: UnifiedAttendeeData['contactPreference'] | ""; label: string; disabled?: boolean }> = [
    { value: "", label: "Please Select", disabled: true },
    { value: "Directly", label: "Directly" },
    { value: "PrimaryAttendee", label: "Related Guest" }, // Label updated for clarity
    { value: "ProvideLater", label: "Provide Later" },
  ];

  const [relationshipInteracted, setRelationshipInteracted] = useState(false);
  const [titleInteracted, setTitleInteracted] = useState(false);
  const [firstNameInteracted, setFirstNameInteracted] = useState(false);
  const [lastNameInteracted, setLastNameInteracted] = useState(false);
  const [contactPreferenceInteracted, setContactPreferenceInteracted] = useState(false);
  const [emailInteracted, setEmailInteracted] = useState(false);
  const [phoneInteracted, setPhoneInteracted] = useState(false);

  const handlePhoneChange = (value: string) => {
    updateField(partnerData.id, "primaryPhone", value); // Update primaryPhone to match UnifiedAttendeeData
  };

  const showContactFields = partnerData.contactPreference === "Directly" || typeof partnerData.contactPreference === 'undefined';

  const getConfirmationMessage = () => {
    if (partnerData.contactPreference === "PrimaryAttendee") {
      return `I confirm that ${relatedGuestName} will be responsible for all communication with this attendee.`;
    }
    // Add other messages as needed for "ProvideLater" etc.
    return "";
  };

  return (
    <div className="border-t border-slate-200 pt-6 mt-6 relative">
      {onRemove && (
          <button 
            type="button"
            onClick={onRemove}
            className="absolute top-6 right-0 text-red-500 hover:text-red-700 flex items-center text-sm"
            aria-label="Remove partner"
          >
            <X className="w-4 h-4 mr-1" />
            <span>Remove</span>
          </button>
      )}
      <h4 className="text-lg font-bold mb-4 text-masonic-gold">Partner of {relatedGuestName}</h4>
      
      <div className="grid grid-cols-12 gap-4 mb-4">
        <div className="col-span-2">
           <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor={`partnerRelationship-${partnerData.id}`}>
            Relationship *
          </label>
          <select
             id={`partnerRelationship-${partnerData.id}`}
            name="relationship"
            value={partnerData.relationship || ''}
            onChange={(e) => updateField(partnerData.id, 'relationship', e.target.value)}
            onBlur={() => setRelationshipInteracted(true)}
            required
            className={`w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 
                       ${relationshipInteracted ? 'interacted' : ''} 
                       [&.interacted:invalid]:border-red-500 focus:[&.interacted:invalid]:border-red-500 focus:[&.interacted:invalid]:ring-red-500`}
          >
            <option value="" disabled>Select...</option>
            {relationships.map((rel) => (
              <option key={rel} value={rel}>
                {rel}
              </option>
            ))}
          </select>
        </div>
        
        <div className="col-span-2">
           <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor={`partnerTitle-${partnerData.id}`}>
            Title *
          </label>
          <select
             id={`partnerTitle-${partnerData.id}`}
            name="title"
            value={partnerData.title || ''}
            onChange={(e) => updateField(partnerData.id, 'title', e.target.value)}
            onBlur={() => setTitleInteracted(true)}
            required
            className={`w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 
                       ${titleInteracted ? 'interacted' : ''} 
                       [&.interacted:invalid]:border-red-500 focus:[&.interacted:invalid]:border-red-500 focus:[&.interacted:invalid]:ring-red-500`}
          >
            <option value="" disabled>Select...</option>
            {titles.map((title) => (
              <option key={title} value={title}>
                {title}
              </option>
            ))}
          </select>
        </div>

        <div className="col-span-4">
           <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor={`partnerFirstName-${partnerData.id}`}>
            First Name *
          </label>
          <input
            type="text"
             id={`partnerFirstName-${partnerData.id}`}
            name="firstName"
            value={partnerData.firstName || ''}
            onChange={(e) => updateField(partnerData.id, 'firstName', e.target.value)}
            onBlur={() => setFirstNameInteracted(true)}
            required
            className={`w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 
                       ${firstNameInteracted ? 'interacted' : ''} 
                       [&.interacted:invalid]:border-red-500 [&.interacted:invalid]:text-red-600 
                       focus:[&.interacted:invalid]:border-red-500 focus:[&.interacted:invalid]:ring-red-500`}
          />
        </div>

        <div className="col-span-4">
           <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor={`partnerLastName-${partnerData.id}`}>
            Last Name *
          </label>
          <input
            type="text"
             id={`partnerLastName-${partnerData.id}`}
            name="lastName"
            value={partnerData.lastName || ''}
            onChange={(e) => updateField(partnerData.id, 'lastName', e.target.value)}
            onBlur={() => setLastNameInteracted(true)}
            required
            className={`w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 
                       ${lastNameInteracted ? 'interacted' : ''} 
                       [&.interacted:invalid]:border-red-500 [&.interacted:invalid]:text-red-600 
                       focus:[&.interacted:invalid]:border-red-500 focus:[&.interacted:invalid]:ring-red-500`}
          />
        </div>
      </div>

      {/* Contact Preference Section */}
      <div className="mb-3">
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-4">
            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor={`g-partner-contactPreference-${partnerData.id}`}>
              Contact *
               {/* HelpCircle if needed */}
            </label>
            <select
              id={`g-partner-contactPreference-${partnerData.id}`}
              name={`g-partner-contactPreference-${partnerData.id}`}
              value={partnerData.contactPreference || ""} 
              onChange={(e) => updateField(partnerData.id, "contactPreference", e.target.value as UnifiedAttendeeData['contactPreference'] | "")}
              onBlur={() => setContactPreferenceInteracted(true)} 
              required
              className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              {contactOptions.map(option => (
                <option key={option.label} value={option.value} disabled={option.disabled}>{option.label}</option>
              ))}
            </select>
          </div>

          {showContactFields && (
            <>
              <div className="col-span-4">
                <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor={`g-partner-phone-${partnerData.id}`}>
                  Mobile Number *
                </label>
                <PhoneInputWrapper
                  value={partnerData.mobile ?? ''}
                  onChange={handlePhoneChange}
                  inputProps={{
                    name: `g-partner-phone-${partnerData.id}`,
                    id: `g-partner-phone-${partnerData.id}`,
                  }}
                  required={partnerData.contactPreference === "Directly"} 
                  className={`${phoneInteracted ? 'interacted' : ''}`}
                />
              </div>
              <div className="col-span-4">
                <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor={`g-partner-email-${partnerData.id}`}>
                  Email Address *
                </label>
                <input
                  type="email"
                  id={`g-partner-email-${partnerData.id}`}
                  name={`g-partner-email-${partnerData.id}`}
                  value={partnerData.email ?? ''}
                  onChange={(e) => updateField(partnerData.id, "primaryEmail", e.target.value)} // Update primaryEmail
                  onBlur={() => setEmailInteracted(true)}
                  required={partnerData.contactPreference === "Directly"} 
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
        {partnerData.contactPreference && partnerData.contactPreference !== 'Directly' && partnerData.contactPreference !== '' && (
            <div className="mt-2 text-sm text-slate-600 bg-slate-100 p-3 rounded-md">
                <div className="flex items-center">
                    <HelpCircle className="h-4 w-4 mr-2 text-slate-500" />
                    <span>{getConfirmationMessage()}</span>
                </div>
            </div>
        )}
      </div>
      {/* ... Dietary and Special Needs ... */}
    </div>
  );
};

export default GuestPartnerForm;