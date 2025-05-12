import React, { useState } from 'react';
import "react-phone-input-2/lib/style.css";
import { HelpCircle, X } from "lucide-react";
import PhoneInputWrapper from "../../../../shared/components/PhoneInputWrapper";
import { MasonAttendee, ContactPreference } from "@/lib/registration-types";

// Define the shape of the partner data this form expects
// This should align with what MasonForm.tsx's transformedPartnerData provides
interface PartnerDataForForm {
  id: string;
  title: string;
  firstName: string;
  lastName: string;
  relationship: string;
  contactPreference: ContactPreference | undefined;
  mobile?: string;
  email?: string;
  dietaryRequirements?: string;
  specialNeeds?: string;
  relatedAttendeeId: string; // For context, not directly edited here usually
}

interface LadyPartnerFormProps {
  partner: PartnerDataForForm;
  id: string;
  updateField: (id: string, field: keyof PartnerDataForForm, value: string | boolean) => void;
  relatedMasonName: string;
  onRemove?: () => void;
  primaryAttendeeData?: MasonAttendee;
}

const LadyPartnerForm: React.FC<LadyPartnerFormProps> = ({
  partner,
  id,
  updateField,
  relatedMasonName,
  onRemove,
  primaryAttendeeData,
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
  const relationships = ["Wife", "Partner", "Fiancée", "Husband", "Fiancé"];
  const contactOptions: Array<{ value: ContactPreference | ""; label: string; disabled?: boolean }> = [
    { value: "", label: "Please Select", disabled: true },
    { value: "Directly", label: "Directly" },
    { value: "Primary Attendee", label: "Primary Attendee" },
    { value: "Provide Later", label: "Provide Later" },
    { value: "Mason/Guest", label: "Mason/Guest" }
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

  const handlePhoneChange = (value: string) => {
    updateField(id, "mobile", value);
  };

  const showContactFields = partner.contactPreference === "Directly" || typeof partner.contactPreference === 'undefined';

  const getConfirmationMessage = () => {
    if (partner.contactPreference === "Primary Attendee" || partner.contactPreference === "Mason/Guest" ) {
      return `I confirm that ${relatedMasonName} will be responsible for all communication with this attendee.`;
    }
    if (partner.contactPreference === "Provide Later") {
      // If primaryAttendeeData is available and has a name, use it. Otherwise, use relatedMasonName as a fallback.
      const contactPerson = primaryAttendeeData?.firstName && primaryAttendeeData?.lastName 
                            ? `${primaryAttendeeData.firstName} ${primaryAttendeeData.lastName}`.trim() 
                            : relatedMasonName;
      return `I confirm that ${contactPerson} will be responsible for all communication with this attendee until their contact details have been updated in their profile.`;
    }
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
            value={partner.relationship}
            onChange={(e) => updateField(id, "relationship", e.target.value)}
            onBlur={() => setRelationshipInteracted(true)}
            required
            className={`w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 
                       ${relationshipInteracted ? 'interacted' : ''} 
                       [&.interacted:invalid]:border-red-500 focus:[&.interacted:invalid]:border-red-500 focus:[&.interacted:invalid]:ring-red-500`}
          >
            <option value="" disabled>Please Select</option>
            {relationships.map((rel) => (
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
            value={partner.title}
            onChange={(e) => updateField(id, "title", e.target.value)}
            onBlur={() => setTitleInteracted(true)}
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
            value={partner.firstName}
            onChange={(e) => updateField(id, "firstName", e.target.value)}
            onBlur={() => setFirstNameInteracted(true)}
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
            value={partner.lastName}
            onChange={(e) => updateField(id, "lastName", e.target.value)}
            onBlur={() => setLastNameInteracted(true)}
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
              htmlFor={`contactPreference-${id}`}
            >
              Contact *{" "}
              <span className="inline-block ml-1">
                <div className="relative inline-block group">
                  <HelpCircle className="h-4 w-4 text-primary cursor-help" />
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 -translate-y-1 invisible group-hover:visible bg-white text-slate-700 text-xs p-2 rounded shadow-lg w-60 z-10">
                    Please specify how we should contact your Lady or Partner for event-related information. Choosing 'Directly' will allow you to provide their contact details.
                  </div>
                </div>
              </span>
            </label>
            <select
              id={`contactPreference-${id}`}
              name={`contactPreference-${id}`}
              value={partner.contactPreference || ""}
              onChange={(e) =>
                updateField(id, "contactPreference", e.target.value as ContactPreference | "")
              }
              onBlur={() => setContactPreferenceInteracted(true)}
              required
              className={`w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 
                         ${contactPreferenceInteracted ? 'interacted' : ''} 
                         [&.interacted:invalid]:border-red-500 focus:[&.interacted:invalid]:border-red-500 focus:[&.interacted:invalid]:ring-red-500`}
            >
              {contactOptions.map((option) => (
                <option key={option.label} value={option.value} disabled={option.disabled}>
                  {option.label}
                </option>
              ))}
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
                <PhoneInputWrapper
                  value={partner.mobile || ""}
                  onChange={handlePhoneChange}
                  inputProps={{
                    name: `ladyMobile-${id}`,
                    id: `ladyMobile-${id}`,
                    required: showContactFields,
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
                  value={partner.email ?? ''}
                  onChange={(e) =>
                    updateField(id, "email", e.target.value)
                  }
                  onBlur={() => setEmailInteracted(true)}
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
          value={partner.dietaryRequirements ?? ''}
          onChange={(e) => updateField(id, "dietaryRequirements", e.target.value)}
          onBlur={() => setDietaryInteracted(true)}
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
          value={partner.specialNeeds ?? ''}
          onChange={(e) => updateField(id, "specialNeeds", e.target.value)}
          onBlur={() => setSpecialNeedsInteracted(true)}
          rows={2}
          className={`w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 ${specialNeedsInteracted ? 'interacted' : ''}`}
        ></textarea>
      </div>
    </div>
  );
};

export default LadyPartnerForm;
