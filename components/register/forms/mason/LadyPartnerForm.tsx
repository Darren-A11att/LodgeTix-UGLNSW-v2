import React, { useState, useEffect, useCallback, useRef } from 'react';
import { HelpCircle, X } from "lucide-react";
import { PhoneInput } from '@/components/ui/phone-input';
import type { UnifiedAttendeeData } from '@/lib/registrationStore';
import { PARTNER_RELATIONSHIP_OPTIONS } from '@/lib/registration-types';

// Define the shape of the partner data this form expects
interface PartnerDataForForm {
  id: string;
  title: string;
  firstName: string;
  lastName: string;
  relationship: string;
  contactPreference: UnifiedAttendeeData['contactPreference']; 
  mobile?: string;
  email?: string;
  dietaryRequirements?: string;
  specialNeeds?: string;
}

interface LadyPartnerFormProps {
  partner: PartnerDataForForm;
  id: string;
  updateField: (id: string, field: keyof PartnerDataForForm, value: string | boolean) => void;
  relatedMasonName: string;
  onRemove?: () => void;
  primaryAttendeeData?: UnifiedAttendeeData;
  relatedMasonContactPreference?: UnifiedAttendeeData['contactPreference'] | undefined | null;
}

const LadyPartnerForm: React.FC<LadyPartnerFormProps> = ({
  partner,
  id,
  updateField,
  relatedMasonName,
  onRemove,
  primaryAttendeeData,
  relatedMasonContactPreference
}) => {
  const titles = [
    "Mrs",
    "Ms",
    "Miss",
    "Dr",
    "Rev",
    "Prof",
    "Hon",
    "Lady",
    "Madam",
    "Dame",
  ];

  // Interaction states
  const [relationshipInteracted, setRelationshipInteracted] = useState(false);
  const [titleInteracted, setTitleInteracted] = useState(false);
  const [firstNameInteracted, setFirstNameInteracted] = useState(false);
  const [lastNameInteracted, setLastNameInteracted] = useState(false);
  const [contactPreferenceInteracted, setContactPreferenceInteracted] = useState(false);
  const [phoneInteracted, setPhoneInteracted] = useState(false);
  const [emailInteracted, setEmailInteracted] = useState(false);
  const [dietaryInteracted, setDietaryInteracted] = useState(false);
  const [specialNeedsInteracted, setSpecialNeedsInteracted] = useState(false);

  // State to track the selected delegate label
  const [selectedDelegateLabel, setSelectedDelegateLabel] = useState<string | null>(null);
  
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
  const partnerRef = useRef(partner);
  
  // Update the ref when props change
  useEffect(() => {
    partnerRef.current = partner;
  }, [partner]);
  
  // Local state for conditional rendering and UI display
  const [contactPreference, setContactPreference] = useState(partner.contactPreference || '');
  const [mobile, setMobile] = useState(partner.mobile || '');

  // Initialize selectedDelegateLabel based on initial partner data
  useEffect(() => {    
    const initialPref = partner.contactPreference;
    
    if (initialPref === 'PrimaryAttendee') {
      const primaryName = primaryAttendeeData ? 
        `${primaryAttendeeData.firstName} ${primaryAttendeeData.lastName}`.trim() : null;
      
      if (primaryName) {
        setSelectedDelegateLabel(primaryName);
      } else {
        setSelectedDelegateLabel(relatedMasonName || null);
      }
    } else {
      setSelectedDelegateLabel(null);
    }
  }, [partner.contactPreference, relatedMasonName, primaryAttendeeData]);

  // Handle phone input change (special case for PhoneInput component)
  const handlePhoneChange = (value: string) => {
    setMobile(value);
    // We'll update the store on blur
  };

  const showContactFields = contactPreference === "Directly" || typeof contactPreference === 'undefined';

  const getConfirmationMessage = () => {
    const delegateName = selectedDelegateLabel;
    const currentPref = contactPreference;

    if (delegateName && currentPref === "PrimaryAttendee") {
      return `I confirm that ${delegateName} will be responsible for all communication with this attendee.`;
    }
    
    if (currentPref === "ProvideLater") {
      const contactPerson = primaryAttendeeData?.firstName && primaryAttendeeData?.lastName 
                          ? `${primaryAttendeeData.firstName} ${primaryAttendeeData.lastName}`.trim() 
                          : relatedMasonName;
      return `I confirm that ${contactPerson} will be responsible for all communication with this attendee until their contact details have been updated in their profile.`;
    }
    return "";
  };

  // Updated Function to generate contact options
  const getDynamicContactOptions = () => {
    const options: Array<{ value: string; label: string; disabled?: boolean }> = [
      { value: "", label: "Please Select", disabled: true },
      { value: "Directly", label: "Directly" },
      { value: "ProvideLater", label: "Provide Later" }, // Changed value to match store
    ];

    const primaryName = primaryAttendeeData?.firstName && primaryAttendeeData?.lastName
      ? `${primaryAttendeeData.firstName} ${primaryAttendeeData.lastName}`.trim()
      : "Primary Attendee"; // Fallback label

    // Check the related Mason's preference
    if (relatedMasonContactPreference === 'Directly') {
      // If related Mason is direct, show their name as the delegate option
      if (relatedMasonName) {
        options.push({ value: "delegate-related", label: relatedMasonName });
      } else {
         // Fallback if related name is missing but pref is Directly (unlikely)
         options.push({ value: "delegate-primary", label: primaryName });
      }
    } else {
      // If related Mason is NOT direct, show the Primary Attendee's name as the delegate option
       options.push({ value: "delegate-primary", label: primaryName });
    }

    return options;
  };
  
  // Updated Determine the value prop for the select based on state and delegate labels
  const getSelectValue = () => {
    const currentPref = partner.contactPreference;
    if (!currentPref) return "";

    if (currentPref === 'PrimaryAttendee') {
        // Determine which delegate option *should* be displayed based on related Mason's pref
        if (relatedMasonContactPreference === 'Directly') {
            return "delegate-related"; // Select the related Mason option
        } else {
            return "delegate-primary"; // Select the primary attendee option
        }
    }
    // Handle 'Directly' and 'ProvideLater' (ensure value matches option exactly)
    if (currentPref === 'Directly') return "Directly";
    if (currentPref === 'ProvideLater') return "ProvideLater"; // Match option value

    console.warn(`Unknown or unhandled contact preference value in getSelectValue: ${currentPref}`);
    return ""; // Fallback to "Please Select"
  };

  // Compare against actual store values
  const requiresConfirmation = contactPreference === "PrimaryAttendee" || contactPreference === "ProvideLater";

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

      <h4 className="text-lg font-bold mb-4 text-primary flex items-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 mr-2"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
            clipRule="evenodd"
          />
        </svg>
        Lady & Partner Details
      </h4>

      <div className="grid grid-cols-12 gap-4 mb-4">
        <div className="col-span-2">
          <label
            className="block text-sm font-medium text-slate-700 mb-1"
            htmlFor={`relationship-${id}`}
          >
            Relationship *
          </label>
          <select
            id={`relationship-${id}`}
            name={`relationship-${id}`}
            ref={relationshipRef}
            defaultValue={partner.relationship || ''}
            onBlur={() => {
              setRelationshipInteracted(true);
              const newValue = relationshipRef.current?.value || '';
              const currentValue = partnerRef.current.relationship || '';
              
              // Only update if value has changed
              if (newValue !== currentValue) {
                updateField(id, "relationship", newValue);
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
          <label
            className="block text-sm font-medium text-slate-700 mb-1"
            htmlFor={`ladyTitle-${id}`}
          >
            Title *
          </label>
          <select
            id={`ladyTitle-${id}`}
            name={`ladyTitle-${id}`}
            ref={titleRef}
            defaultValue={partner.title || ''}
            onBlur={() => {
              setTitleInteracted(true);
              const newValue = titleRef.current?.value || '';
              const currentValue = partnerRef.current.title || '';
              
              // Only update if value has changed
              if (newValue !== currentValue) {
                updateField(id, "title", newValue);
              }
            }}
            required
            className={`w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 
                       ${titleInteracted ? 'interacted' : ''} 
                       [&.interacted:invalid]:border-red-500 focus:[&.interacted:invalid]:border-red-500 focus:[&.interacted:invalid]:ring-red-500`}
          >
            <option value="" disabled>Please Select</option>
            {titles.map((title) => (
              <option key={title} value={title}>
                {title}
              </option>
            ))}
          </select>
        </div>

        <div className="col-span-4">
          <label
            className="block text-sm font-medium text-slate-700 mb-1"
            htmlFor={`ladyFirstName-${id}`}
          >
            First Name *
          </label>
          <input
            type="text"
            id={`ladyFirstName-${id}`}
            name={`ladyFirstName-${id}`}
            ref={firstNameRef}
            defaultValue={partner.firstName || ''}
            onBlur={() => {
              setFirstNameInteracted(true);
              const newValue = firstNameRef.current?.value || '';
              const currentValue = partnerRef.current.firstName || '';
              
              // Only update if value has changed
              if (newValue !== currentValue) {
                updateField(id, "firstName", newValue);
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
          <label
            className="block text-sm font-medium text-slate-700 mb-1"
            htmlFor={`ladyLastName-${id}`}
          >
            Last Name *
          </label>
          <input
            type="text"
            id={`ladyLastName-${id}`}
            name={`ladyLastName-${id}`}
            ref={lastNameRef}
            defaultValue={partner.lastName || ''}
            onBlur={() => {
              setLastNameInteracted(true);
              const newValue = lastNameRef.current?.value || '';
              const currentValue = partnerRef.current.lastName || '';
              
              // Only update if value has changed
              if (newValue !== currentValue) {
                updateField(id, "lastName", newValue);
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

      <div className="mb-3">
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-4">
            <label
              className="block text-sm font-medium text-slate-700 mb-1"
              htmlFor={`ladyContactPreference-${id}`}
            >
              Contact *
              <div className="relative inline-block ml-1 group align-middle">
                <HelpCircle className="h-4 w-4 text-primary cursor-help" />
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 -translate-y-1 invisible group-hover:visible bg-white text-slate-700 text-xs p-2 rounded shadow-lg w-48 z-10">
                  Select how we should contact this person regarding event information
                </div>
              </div>
            </label>
            <select
              id={`ladyContactPreference-${id}`}
              name={`ladyContactPreference-${id}`}
              ref={contactPreferenceRef}
              defaultValue={getSelectValue()}
              onChange={(e) => {
                setContactPreferenceInteracted(true);
                const selectedValue = e.target.value;
                const selectedIndex = e.target.selectedIndex;
                const selectedLabel = selectedIndex >= 0 ? e.target.options[selectedIndex].text : null;

                let storeValue: UnifiedAttendeeData['contactPreference'] = undefined;
                let delegateLabelUpdate: string | null = null;

                // Map dropdown selection for UI updates
                if (selectedValue === "delegate-primary" || selectedValue === "delegate-related") {
                    storeValue = "PrimaryAttendee";
                    delegateLabelUpdate = selectedLabel;
                }
                else if (selectedValue === "Directly") {
                    storeValue = "Directly";
                }
                else if (selectedValue === "ProvideLater") {
                    storeValue = "ProvideLater";
                }
                
                // Update local state for UI rendering
                setContactPreference(storeValue ?? 'Directly');
                setSelectedDelegateLabel(delegateLabelUpdate);
                
                // Immediately update the store
                if (storeValue !== partnerRef.current.contactPreference) {
                  updateField(id, "contactPreference", storeValue ?? 'Directly');
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
              {getDynamicContactOptions().map((option) => {
                const key = `${option.value}-${option.label}`;
                return (
                  <option key={key} value={option.value} disabled={option.disabled}>
                    {option.label}
                  </option>
                );
              })}
            </select>
          </div>

          {showContactFields ? (
            <>
              <div className="col-span-4">
                <label
                  className="block text-sm font-medium text-slate-700 mb-1"
                  htmlFor={`ladyMobile-${id}`}
                >
                  Mobile
                </label>
                <PhoneInput
                  name={`ladyMobile-${id}`}
                  value={mobile}
                  onChange={handlePhoneChange}
                  onBlur={() => {
                    setPhoneInteracted(true);
                    if (mobile !== partnerRef.current.mobile) {
                      updateField(id, "mobile", mobile);
                    }
                  }}
                  required={showContactFields}
                />
              </div>

              <div className="col-span-4">
                <label
                  className="block text-sm font-medium text-slate-700 mb-1"
                  htmlFor={`ladyEmail-${id}`}
                >
                  Email Address *
                </label>
                <input
                  type="email"
                  id={`ladyEmail-${id}`}
                  name={`email-${id}`}
                  ref={emailRef}
                  defaultValue={partner.email || ''}
                  onBlur={() => {
                    setEmailInteracted(true);
                    const newValue = emailRef.current?.value || '';
                    const currentValue = partnerRef.current.email || '';
                    
                    // Only update if value has changed
                    if (newValue !== currentValue) {
                      updateField(id, "email", newValue);
                    }
                  }}
                  required={showContactFields}
                  className={`w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 
                             ${emailInteracted ? 'interacted' : ''} 
                             [&.interacted:invalid]:border-red-500 [&.interacted:invalid]:text-red-600 
                             focus:[&.interacted:invalid]:border-red-500 focus:[&.interacted:invalid]:ring-red-500`}
                  title="Please enter a valid email address (e.g., user@example.com)"
                />
              </div>
            </>
          ) : (
            partner.contactPreference && partner.contactPreference !== "Directly" && (
              <div className="col-span-8 flex items-center pl-2">
                <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-md border border-slate-200">
                  {getConfirmationMessage()}
                </p>
              </div>
            )
          )}
        </div>
      </div>

      <div className="mb-4">
        <label
          className="block text-sm font-medium text-slate-700 mb-1"
          htmlFor={`ladyDietary-${id}`}
        >
          Dietary Requirements
        </label>
        <input
          type="text"
          id={`ladyDietary-${id}`}
          name={`dietaryRequirements-${id}`}
          ref={dietaryRequirementsRef}
          defaultValue={partner.dietaryRequirements || ''}
          onBlur={() => {
            setDietaryInteracted(true);
            const newValue = dietaryRequirementsRef.current?.value || '';
            const currentValue = partnerRef.current.dietaryRequirements || '';
            
            // Only update if value has changed
            if (newValue !== currentValue) {
              updateField(id, "dietaryRequirements", newValue);
            }
          }}
          placeholder="E.g., vegetarian, gluten-free, allergies"
          className={`w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 ${dietaryInteracted ? 'interacted' : ''}`}
        />
      </div>

      <div>
        <label
          className="block text-sm font-medium text-slate-700 mb-1"
          htmlFor={`ladySpecialNeeds-${id}`}
        >
          Special Needs or Accessibility Requirements
        </label>
        <textarea
          id={`ladySpecialNeeds-${id}`}
          name={`specialNeeds-${id}`}
          ref={specialNeedsRef}
          defaultValue={partner.specialNeeds || ''}
          onBlur={() => {
            setSpecialNeedsInteracted(true);
            const newValue = specialNeedsRef.current?.value || '';
            const currentValue = partnerRef.current.specialNeeds || '';
            
            // Only update if value has changed
            if (newValue !== currentValue) {
              updateField(id, "specialNeeds", newValue);
            }
          }}
          rows={2}
          className={`w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 ${specialNeedsInteracted ? 'interacted' : ''}`}
        ></textarea>
      </div>
    </div>
  );
};

export default LadyPartnerForm;