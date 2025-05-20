import React, { useState, useCallback, useMemo } from 'react';
import { useDebouncedCallback } from 'use-debounce';
// import { GuestPartnerData } from '../../../../shared/types/register'; // Old, to be removed or replaced
import { X } from 'lucide-react';
import GuestBasicInfo from './GuestBasicInfo';
import GuestContactInfo from './GuestContactInfo';
import GuestAdditionalInfo from './GuestAdditionalInfo';
// Partner components moved to GuestFormContainer
import type { GuestAttendee, PartnerAttendee, Attendee, ContactPreference as OldContactPreference, BaseAttendee, MasonAttendee } from '../../../../lib/registration-types'; // Updated types
import { useRegistrationStore, RegistrationState } from '../../../../lib/registrationStore'; // Updated store imports
import { PhoneInput } from '@/components/ui/phone-input';
import { v4 as uuidv4 } from 'uuid';
import type { UnifiedAttendeeData } from '../../../../lib/registrationStore';

// Define the contact preference type used by the store
type StoreContactPreference = NonNullable<UnifiedAttendeeData['contactPreference']>;

// Define ConceptualAttendeeType locally for use in addAttendee parameter
type ConceptualAttendeeType = UnifiedAttendeeData['attendeeType'] | 'lady_partner' | 'guest_partner';

// Define a minimal OldGuestPartnerData for GuestPartnerForm props
interface OldGuestPartnerDataForForm {
  id: string;
  title: string;
  firstName: string;
  lastName: string;
  relationship: string;
  contactPreference: StoreContactPreference; // Use the extracted store type
  mobile?: string;
  email?: string;
  dietaryRequirements?: string;
  specialNeeds?: string;
  relatedAttendeeId: string; 
}

interface GuestFormProps {
  attendeeId: string;
  attendeeNumber: number;
  // isPrimary is not relevant for Guest, as Guests cannot be primary.
}

const GuestForm: React.FC<GuestFormProps> = ({
  attendeeId,
  attendeeNumber,
}) => {
  // --- NEW Store Actions and Selectors ---
  const updateAttendeeInStore = useRegistrationStore((state: RegistrationState) => state.updateAttendee);
  // Replacing non-existent addAttendee with proper function
  const addGuestAttendeeStore = useRegistrationStore((state: RegistrationState) => state.addGuestAttendee);
  const addGuestPartnerAttendeeStore = useRegistrationStore((state: RegistrationState) => state.addGuestPartnerAttendee);
  const removeAttendeeInStore = useRegistrationStore((state: RegistrationState) => state.removeAttendee);

  // Select the specific guest attendee from the unified list in the store
  const currentAttendee = useRegistrationStore((state: RegistrationState) => 
    state.attendees.find(att => att.attendeeId === attendeeId && att.attendeeType.toLowerCase() === 'guest')
  ) as UnifiedAttendeeData | undefined;

  // Partner data handled in GuestFormContainer
  
  // Find primary mason data for contact confirmation message
  const primaryMasonAttendee = useRegistrationStore((state: RegistrationState) => 
    state.attendees.find(att => att.isPrimary === true && att.attendeeType.toLowerCase() === 'mason')
  ) as UnifiedAttendeeData | undefined; // Assuming primary is always a mason for this context

  // Select ALL Mason attendees for the "Guest Of" dropdown
  const allAttendeesFromStore = useRegistrationStore((state: RegistrationState) => state.attendees);
  const allMasonAttendees = useMemo(() => 
    allAttendeesFromStore.filter(att => att.attendeeType.toLowerCase() === 'mason'),
    [allAttendeesFromStore]
  ) as UnifiedAttendeeData[];

  // --- Data Mapping for Child Components ---
  const mappedGuestForChildren: GuestAttendee | null = useMemo(() => {
    if (!currentAttendee) return null;

    let mappedContactPref: OldContactPreference = ""; // Initialize to empty string for "Please Select"
    const storePref = currentAttendee.contactPreference;

    if (storePref === 'PrimaryAttendee') {
      mappedContactPref = 'Primary Attendee';
    } else if (storePref === 'ProvideLater') {
      mappedContactPref = 'Provide Later';
    } else if (storePref === 'Directly') {
      mappedContactPref = 'Directly';
    } else if (storePref === 'Mason/Guest') { // Added to handle all valid OldContactPreference types
      mappedContactPref = 'Mason/Guest';
    } else { // Handles '', undefined, null from store, or any other unexpected value
      mappedContactPref = ''; // Default to empty string for "Please Select"
    }

    return {
      id: currentAttendee.attendeeId,
      type: 'guest',
      title: currentAttendee.title || '',
      firstName: currentAttendee.firstName || '',
      lastName: currentAttendee.lastName || '',
      email: currentAttendee.primaryEmail, // GuestAttendee expects 'email'
      mobile: currentAttendee.primaryPhone, // GuestAttendee expects 'mobile'
      contactPreference: mappedContactPref, // Now correctly mapped and required
      dietaryRequirements: currentAttendee.dietaryRequirements,
      specialNeeds: currentAttendee.specialNeeds,
      hasPartner: currentAttendee.hasGuestPartner || false,
      relatedAttendeeId: currentAttendee.relatedAttendeeId,
      partner: undefined, // GuestAttendee can have an optional PartnerAttendee; explicitly undefined here
                               // as GuestPartnerForm handles the actual partner data separately.
    };
  }, [currentAttendee]);

  // Partner mapping handled in GuestFormContainer
  
  if (!currentAttendee || !mappedGuestForChildren) { // Check mappedGuestForChildren as well
    console.warn(`GuestForm rendered for non-existent or non-guest attendeeId: ${attendeeId}`);
    return null; 
  }

  // --- Handlers ---
  // handleGuestFieldChange needs to map field names if they differ, e.g. 'email' from child to 'primaryEmail' for store
  const handleGuestFieldChange = useDebouncedCallback(
    <K extends keyof GuestAttendee>(
      id: string, 
      field: K,
      value: GuestAttendee[K]
    ) => {
        if (id === mappedGuestForChildren.id) { 
            let fieldForStore: keyof UnifiedAttendeeData = field as any; // Start with direct cast
            let valueForStore: any = value;

            // Field name mapping
            if (field === 'email') fieldForStore = 'primaryEmail';
            if (field === 'mobile') fieldForStore = 'primaryPhone';
            if (field === 'hasPartner') fieldForStore = 'hasGuestPartner';
            // Add other mappings if GuestAttendee fields differ from UnifiedAttendeeData

            // Value mapping for contactPreference if necessary (Store uses no space)
            if (field === 'contactPreference') {
              if (value === 'Primary Attendee') valueForStore = 'PrimaryAttendee';
              else if (value === 'Provide Later') valueForStore = 'ProvideLater';
              // "Directly" is the same. "Mason/Guest" isn't in store type.
            }

            updateAttendeeInStore(currentAttendee.attendeeId, { [fieldForStore]: valueForStore } as Partial<UnifiedAttendeeData>);
        } else {
            // Removed console warning for performance
        }
    },
    50 // 50ms debounce delay for better UI responsiveness
  );

  // Handler for GuestPartnerForm updates - with reduced debounce to improve responsiveness
  const handlePartnerFieldChange = useDebouncedCallback(
    (partnerId: string, field: string, value: any) => { // Accept field as string
      let unifiedField: keyof UnifiedAttendeeData | null = null;
      switch (field) {
        case 'title': unifiedField = 'title'; break;
        case 'firstName': unifiedField = 'firstName'; break;
        case 'lastName': unifiedField = 'lastName'; break;
        case 'relationship': unifiedField = 'relationship'; break;
        case 'contactPreference': unifiedField = 'contactPreference'; break;
        case 'mobile': unifiedField = 'primaryPhone'; break;
        case 'email': unifiedField = 'primaryEmail'; break;
        case 'primaryPhone': unifiedField = 'primaryPhone'; break;
        case 'primaryEmail': unifiedField = 'primaryEmail'; break;
        case 'dietaryRequirements': unifiedField = 'dietaryRequirements'; break;
        case 'specialNeeds': unifiedField = 'specialNeeds'; break;
        default: /* Removed console warning for performance */ return;
      }
      if (unifiedField) {
        // Handle potential value mapping if needed (e.g., for contactPreference from display to store format)
        let valueForStore = value;
        if (field === 'contactPreference') {
          // Assuming GuestPartnerForm sends back the store format directly now
          // If it sends display format, mapping would be needed here.
        }
        // Immediately update the store
        updateAttendeeInStore(partnerId, { [unifiedField]: valueForStore });
      }
    },
    50 // 50ms debounce delay for better responsiveness
  );

  const handlePhoneChange = useDebouncedCallback(
    (value: string) => {
      if (mappedGuestForChildren?.id) { 
        // Use the already debounced handleGuestFieldChange
        handleGuestFieldChange(mappedGuestForChildren.id, 'mobile', value);
      }
    },
    50 // 50ms debounce delay for better UI responsiveness
  );

  const handleRemoveSelf = useCallback(() => {
      if (currentAttendee?.attendeeId) {
        removeAttendeeInStore(currentAttendee.attendeeId); 
      }
  }, [removeAttendeeInStore, currentAttendee?.attendeeId]);

  const handleChange = (field: keyof UnifiedAttendeeData, value: any) => {
    updateAttendeeInStore(attendeeId, { [field]: value });
  };
  
  // Partner handler moved to GuestFormContainer

  const getConfirmationMessage = useCallback((): string => {
    if (!primaryMasonAttendee) return "";
    const primaryFullName = `${primaryMasonAttendee.firstName || ''} ${primaryMasonAttendee.lastName || ''}`.trim();
    
    // Use mappedGuestForChildren for guest's contactPreference if it's already mapped to OldContactPreference
    // Or, use currentAttendee.contactPreference if comparisons are with StoreContactPreference literals
    if (mappedGuestForChildren.contactPreference === "Primary Attendee") { // Using old type literal with space
        return `I confirm that ${primaryFullName} will be responsible for all communication with this attendee`;
    } else if (mappedGuestForChildren.contactPreference === "Provide Later") { // Using old type literal with space
        return `I confirm that ${primaryFullName} will be responsible for all communication with this attendee until their contact details have been updated in their profile`;
    }
    return "";
  }, [primaryMasonAttendee, mappedGuestForChildren?.contactPreference]);

  const titles = ["Mr", "Mrs", "Ms", "Miss", "Dr", "Rev", "Prof", "Rabbi", "Hon", "Sir", "Madam", "Lady", "Dame"];
  const contactOptionsOld: OldContactPreference[] = ["Directly", "Primary Attendee", "Provide Later", "Mason/Guest"]; // For child components expecting old type

  // Determine if contact fields should be hidden for THIS guest
  // Only show fields if 'Directly' is specifically selected
  // Using toLowerCase() to handle possible case differences
  const hideThisGuestsContactFields = 
    !(currentAttendee?.contactPreference?.toLowerCase() === 'directly');

  return (
    <div className="bg-slate-50 p-6 rounded-lg mb-8 relative">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-slate-800">Guest Attendee {attendeeNumber}</h3>
        <button 
          type="button"
          onClick={handleRemoveSelf}
          className="text-red-500 hover:text-red-700 transition-colors text-sm flex items-center"
          aria-label={`Remove Guest Attendee ${attendeeNumber}`}
        >
          <X className="w-4 h-4 mr-1" />
          <span>Remove</span>
        </button>
      </div>
      
      <GuestBasicInfo
        guest={mappedGuestForChildren}
        id={attendeeId} 
        onChange={handleGuestFieldChange}
        allMasons={allMasonAttendees}
        primaryMasonId={primaryMasonAttendee?.attendeeId}
        titles={titles}
      />
      
      <GuestContactInfo
        guest={mappedGuestForChildren} 
        id={mappedGuestForChildren.id}
        onChange={handleGuestFieldChange}
        handlePhoneChange={handlePhoneChange}
        hideContactFields={hideThisGuestsContactFields} // Pass calculated value
        showConfirmation={mappedGuestForChildren.contactPreference === 'Primary Attendee' || mappedGuestForChildren.contactPreference === 'Provide Later'}
        getConfirmationMessage={getConfirmationMessage}
        primaryAttendeeData={primaryMasonAttendee} // Pass primary attendee data
      />
      
      <GuestAdditionalInfo
        guest={mappedGuestForChildren} 
        id={mappedGuestForChildren.id} 
        onChange={handleGuestFieldChange}
      />

      {/* Partner logic moved to GuestFormContainer */}
    </div>
  );
};

export default GuestForm;