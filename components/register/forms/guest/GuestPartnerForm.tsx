import React, { useState, useEffect, useCallback, useRef } from 'react';
import { HelpCircle, X } from 'lucide-react';
import { PhoneInput } from '@/components/ui/phone-input';
// Using UnifiedAttendeeData to get the correct ContactPreference type from the store definitions
import type { UnifiedAttendeeData } from '../../../../lib/registrationStore';
import { PARTNER_RELATIONSHIP_OPTIONS } from '@/lib/registration-types';

// Extract ContactPreference type, allowing undefined for local form state
type FormContactPreference = UnifiedAttendeeData['contactPreference'] | undefined;

// Define the possible values for contact preference that the store uses
type StoreContactPreferenceValue = UnifiedAttendeeData['contactPreference'];

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
  primaryAttendeeData?: UnifiedAttendeeData;
  updateField: (id: string, field: string, value: any) => void;
  onRemove: () => void;
  relatedGuestContactPreference?: UnifiedAttendeeData['contactPreference'] | undefined | null;
}

const GuestPartnerForm: React.FC<GuestPartnerFormProps> = ({
  partnerData,
  relatedGuestName,
  primaryAttendeeData,
  updateField,
  onRemove,
  relatedGuestContactPreference
}) => {
  const titles = ["Mr", "Mrs", "Ms", "Miss", "Dr", "Rev", "Prof"];

  const [relationshipInteracted, setRelationshipInteracted] = useState(false);
  const [titleInteracted, setTitleInteracted] = useState(false);
  const [firstNameInteracted, setFirstNameInteracted] = useState(false);
  const [lastNameInteracted, setLastNameInteracted] = useState(false);
  const [contactPreferenceInteracted, setContactPreferenceInteracted] = useState(false);
  const [emailInteracted, setEmailInteracted] = useState(false);
  const [phoneInteracted, setPhoneInteracted] = useState(false);

  // --- NEW STATE ---
  // Store the label of the selected delegate when contactPreference is 'PrimaryAttendee'
  const [selectedDelegateLabel, setSelectedDelegateLabel] = useState<string | null>(null);
  
  // Local state for input values to improve responsiveness
  // Create refs for form inputs
  const relationshipRef = useRef<HTMLSelectElement>(null);
  const titleRef = useRef<HTMLSelectElement>(null);
  const firstNameRef = useRef<HTMLInputElement>(null);
  const lastNameRef = useRef<HTMLInputElement>(null);
  const contactPreferenceRef = useRef<HTMLSelectElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const dietaryRequirementsRef = useRef<HTMLInputElement>(null);
  const specialNeedsRef = useRef<HTMLTextAreaElement>(null);
  
  // Create a ref to store the latest props
  const partnerRef = useRef(partnerData);
  
  // Update the ref when props change
  useEffect(() => {
    partnerRef.current = partnerData;
  }, [partnerData]);
  
  // Local state for conditional rendering and UI display
  const [contactPreference, setContactPreference] = useState<FormContactPreference>(partnerData.contactPreference);
  const [mobile, setMobile] = useState(partnerData.mobile || '');

  // --- Initialize selectedDelegateLabel based on initial data
  useEffect(() => {
    if (partnerData.contactPreference === 'PrimaryAttendee') {
      // Determine initial delegate label based on available data
      if (primaryAttendeeData?.firstName && primaryAttendeeData?.lastName) {
         // Default to related guest if name exists
         setSelectedDelegateLabel(relatedGuestName || null); 
      } else {
         setSelectedDelegateLabel(relatedGuestName || null);
      }
    } else {
      setSelectedDelegateLabel(null);
    }
  }, [partnerData.contactPreference, relatedGuestName, primaryAttendeeData]); 

  // Handle phone input change (special case for PhoneInput component)
  const handlePhoneChange = (value: string) => {
    setMobile(value);
    // We'll update the store on blur
  };

  const showContactFields = contactPreference === "Directly" || typeof contactPreference === 'undefined';

  const getConfirmationMessage = () => {
    const pref = contactPreference;
    // Use the stored delegate label if available
    const delegateName = selectedDelegateLabel; 
    
    if (pref === "PrimaryAttendee" && delegateName) {
      return `I confirm that ${delegateName} will be responsible for all communication with this attendee.`;
    }
    if (pref === "ProvideLater") {
       // Confirmation for Provide Later should probably mention the related guest by default
      return `I confirm that ${relatedGuestName} will be responsible for communication until details are provided.`;
    }
    return ""; // No message for "Directly" or undefined
  };

  // Updated Function to dynamically generate contact preference options for Guest Partners
  const getDynamicGuestPartnerContactOptions = () => {
    const options: Array<{ value: string; label: string; disabled?: boolean }> = [
      { value: "", label: "Please Select", disabled: true },
      { value: "Directly", label: "Directly" },
      { value: "ProvideLater", label: "Provide Later" }, // Value matches store
    ];

    const primaryName = primaryAttendeeData?.firstName && primaryAttendeeData?.lastName
      ? `${primaryAttendeeData.firstName} ${primaryAttendeeData.lastName}`.trim()
      : "Primary Attendee"; // Fallback label

    const attachedName = relatedGuestName ? relatedGuestName.trim() : null;

    // Check the related GUEST's preference
    if (relatedGuestContactPreference === 'Directly') {
      // If related Guest is direct, show their name as the delegate option
      if (attachedName) {
        options.push({ value: "delegate-related", label: attachedName });
      } else {
         // Fallback if related name missing but pref is Directly (unlikely)
         options.push({ value: "delegate-primary", label: primaryName });
      }
    } else {
      // If related Guest is NOT direct, show the Primary Attendee's name as the delegate option
       options.push({ value: "delegate-primary", label: primaryName });
    }

    // Removed debug log for performance
    return options;
  };
  
   // Updated Determine the value prop for the select based on state
   const getSelectValue = () => {
      const currentPref = partnerData.contactPreference;
      if (!currentPref) return "";

      if (currentPref === 'PrimaryAttendee') {
          // Determine which delegate option *should* be displayed based on related GUEST's pref
          if (relatedGuestContactPreference === 'Directly') {
              return "delegate-related"; // Select the related GUEST option
          } else {
              return "delegate-primary"; // Select the primary attendee option
          }
      }
      // Handle 'Directly' and 'ProvideLater' (ensure value matches option exactly)
      if (currentPref === 'Directly') return "Directly";
      if (currentPref === 'ProvideLater') return "ProvideLater";

      // Removing debug warning for performance
      return ""; // Fallback to "Please Select"
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
            ref={relationshipRef}
            defaultValue={partnerData.relationship || ''}
            onBlur={() => {
              setRelationshipInteracted(true);
              const newValue = relationshipRef.current?.value || '';
              const currentValue = partnerRef.current.relationship || '';
              
              // Only update if value has changed
              if (newValue !== currentValue) {
                updateField(partnerData.id, 'relationship', newValue);
              }
            }}
            required
            className={`w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 
                       ${relationshipInteracted ? 'interacted' : ''} 
                       [&.interacted:invalid]:border-red-500 focus:[&.interacted:invalid]:border-red-500 focus:[&.interacted:invalid]:ring-red-500`}
          >
            <option value="" disabled>Select...</option>
            {PARTNER_RELATIONSHIP_OPTIONS.map((rel) => (
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
            ref={titleRef}
            defaultValue={partnerData.title || ''}
            onBlur={() => {
              setTitleInteracted(true);
              const newValue = titleRef.current?.value || '';
              const currentValue = partnerRef.current.title || '';
              
              // Only update if value has changed
              if (newValue !== currentValue) {
                updateField(partnerData.id, 'title', newValue);
              }
            }}
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
            ref={firstNameRef}
            defaultValue={partnerData.firstName || ''}
            onBlur={() => {
              setFirstNameInteracted(true);
              const newValue = firstNameRef.current?.value || '';
              const currentValue = partnerRef.current.firstName || '';
              
              // Only update if value has changed
              if (newValue !== currentValue) {
                updateField(partnerData.id, 'firstName', newValue);
              }
            }}
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
            ref={lastNameRef}
            defaultValue={partnerData.lastName || ''}
            onBlur={() => {
              setLastNameInteracted(true);
              const newValue = lastNameRef.current?.value || '';
              const currentValue = partnerRef.current.lastName || '';
              
              // Only update if value has changed
              if (newValue !== currentValue) {
                updateField(partnerData.id, 'lastName', newValue);
              }
            }}
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
              ref={contactPreferenceRef}
              defaultValue={getSelectValue()} // Use the existing function to determine initial value
              onChange={(e) => { // Handle changes for UI updates
                  setContactPreferenceInteracted(true);
                  const selectedValue = e.target.value;
                  const selectedIndex = e.target.selectedIndex;
                  const selectedLabel = selectedIndex >= 0 ? e.target.options[selectedIndex].text : null;

                  let storeValue: UnifiedAttendeeData['contactPreference'] = undefined;
                  
                  // Map dropdown selection to store value for local state
                  if (selectedValue === "delegate-primary" || selectedValue === "delegate-related") {
                      storeValue = "PrimaryAttendee";
                  }
                  else if (selectedValue === "Directly") {
                      storeValue = "Directly";
                  }
                  else if (selectedValue === "ProvideLater") {
                      storeValue = "ProvideLater";
                  }
                  
                  // Update local state for UI rendering
                  setContactPreference(storeValue);
                  setSelectedDelegateLabel(selectedValue.startsWith("delegate") ? selectedLabel : null);
                  
                  // Immediately update the store (don't wait for onBlur)
                  if (storeValue !== partnerRef.current.contactPreference) {
                    updateField(partnerData.id, "contactPreference", storeValue ?? 'Directly');
                  }
              }}
              onBlur={() => {
                // Just mark as interacted for validation styling
                setContactPreferenceInteracted(true);
              }}
              required
              className={`w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 
                        ${contactPreferenceInteracted ? 'interacted' : ''} 
                        [&.interacted:invalid]:border-red-500 focus:[&.interacted:invalid]:border-red-500 focus:[&.interacted:invalid]:ring-red-500`}
            >
              {getDynamicGuestPartnerContactOptions().map(option => { 
                const key = `${option.value}-${option.label}`; // Key remains unique
                return <option key={key} value={option.value} disabled={option.disabled}>{option.label}</option>
              })}
            </select>
          </div>

          {showContactFields && (
            <>
              <div className="col-span-4">
                <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor={`g-partner-phone-${partnerData.id}`}>
                  Mobile Number *
                </label>
                <PhoneInput
                  name={`g-partner-phone-${partnerData.id}`}
                  value={mobile}
                  onChange={handlePhoneChange}
                  onBlur={() => {
                    setPhoneInteracted(true);
                    if (mobile !== partnerRef.current.mobile) {
                      updateField(partnerData.id, "primaryPhone", mobile);
                    }
                  }}
                  required={contactPreference === "Directly"}
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
                  ref={emailRef}
                  defaultValue={partnerData.email || ''}
                  onBlur={() => {
                    setEmailInteracted(true);
                    const newValue = emailRef.current?.value || '';
                    const currentValue = partnerRef.current.email || '';
                    
                    // Only update if value has changed
                    if (newValue !== currentValue) {
                      updateField(partnerData.id, "primaryEmail", newValue);
                    }
                  }}
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
        
        {/* Fixed contact confirmation message layout */}
        {contactPreference && contactPreference !== 'Directly' && (
          <div className="mt-2 mb-4 grid grid-cols-12">
            <div className="col-span-12">
              <div className="text-sm text-slate-600 bg-slate-100 p-3 rounded-md">
                {getConfirmationMessage()}
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Dietary Requirements */}
      <div className="mb-4">
        <label
          className="block text-sm font-medium text-slate-700 mb-1"
          htmlFor={`g-partner-dietary-${partnerData.id}`}
        >
          Dietary Requirements
        </label>
        <input
          type="text"
          id={`g-partner-dietary-${partnerData.id}`}
          name={`g-partner-dietary-${partnerData.id}`}
          ref={dietaryRequirementsRef}
          defaultValue={partnerData.dietaryRequirements || ''}
          onBlur={() => {
            const newValue = dietaryRequirementsRef.current?.value || '';
            const currentValue = partnerRef.current.dietaryRequirements || '';
            
            // Only update if value has changed
            if (newValue !== currentValue) {
              updateField(partnerData.id, "dietaryRequirements", newValue);
            }
          }}
          placeholder="E.g., vegetarian, gluten-free, allergies"
          className={`w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50`}
        />
      </div>

      {/* Special Needs */}
      <div className="mb-4">
        <label
          className="block text-sm font-medium text-slate-700 mb-1"
          htmlFor={`g-partner-specialNeeds-${partnerData.id}`}
        >
          Special Needs / Seating Request
        </label>
        <textarea
          id={`g-partner-specialNeeds-${partnerData.id}`}
          name={`g-partner-specialNeeds-${partnerData.id}`}
          ref={specialNeedsRef}
          defaultValue={partnerData.specialNeeds || ''}
          onBlur={() => {
            const newValue = specialNeedsRef.current?.value || '';
            const currentValue = partnerRef.current.specialNeeds || '';
            
            // Only update if value has changed
            if (newValue !== currentValue) {
              updateField(partnerData.id, "specialNeeds", newValue);
            }
          }}
          rows={2}
          className={`w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50`}
        /> 
      </div>
    </div>
  );
};

export default GuestPartnerForm;