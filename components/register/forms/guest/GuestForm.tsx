import React, { useState, useCallback, useMemo } from 'react';
import 'react-phone-input-2/lib/style.css';
// import { GuestPartnerData } from '../../../../shared/types/register'; // Old, to be removed or replaced
import GuestPartnerForm from './GuestPartnerForm';
import { X } from 'lucide-react';
import GuestBasicInfo from './GuestBasicInfo';
import GuestContactInfo from './GuestContactInfo';
import GuestAdditionalInfo from './GuestAdditionalInfo';
import GuestPartnerToggle from './GuestPartnerToggle';
import type { GuestAttendee, PartnerAttendee, Attendee, ContactPreference as OldContactPreference, BaseAttendee, MasonAttendee } from '../../../../lib/registration-types'; // Updated types
import { useRegistrationStore, RegistrationState } from '../../../../lib/registrationStore'; // Updated store imports
import PhoneInputWrapper from '../../../../shared/components/PhoneInputWrapper';
import { v4 as uuidv4 } from 'uuid';
import type { UnifiedAttendeeData } from '../../../../lib/registrationStore';

// Define the contact preference type from the store explicitly for options array
type StoreContactPreference = NonNullable<UnifiedAttendeeData['contactPreference']>;

// Define a minimal OldGuestPartnerData for GuestPartnerForm props
interface OldGuestPartnerDataForForm {
  id: string;
  title: string;
  firstName: string;
  lastName: string;
  relationship: string;
  contactPreference: OldContactPreference; // Corrected: Use OldContactPreference
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
  const addAttendeeInStore = useRegistrationStore((state: RegistrationState) => state.addAttendee);
  const removeAttendeeInStore = useRegistrationStore((state: RegistrationState) => state.removeAttendee);

  // Select the specific guest attendee from the unified list in the store
  const currentAttendee = useRegistrationStore((state: RegistrationState) => 
    state.attendees.find(att => att.attendeeId === attendeeId && att.attendeeType === 'guest')
  ) as UnifiedAttendeeData | undefined;

  // Select the partner associated with this guest
  const partner = useRegistrationStore((state: RegistrationState) => 
    state.attendees.find(att => att.relatedAttendeeId === attendeeId && att.attendeeType === 'guest_partner')
  ) as UnifiedAttendeeData | undefined;
  
  // Find primary mason data for contact confirmation message
  const primaryMasonAttendee = useRegistrationStore((state: RegistrationState) => 
    state.attendees.find(att => att.isPrimary === true && att.attendeeType === 'mason')
  ) as UnifiedAttendeeData | undefined; // Assuming primary is always a mason for this context

  // --- Data Mapping for Child Components ---
  const mappedGuestForChildren: GuestAttendee | null = useMemo(() => {
    if (!currentAttendee) return null;

    let mappedContactPref: OldContactPreference = 'Directly'; // Default if undefined
    if (currentAttendee.contactPreference === 'PrimaryAttendee') {
      mappedContactPref = 'Primary Attendee';
    } else if (currentAttendee.contactPreference === 'ProvideLater') {
      mappedContactPref = 'Provide Later';
    } else if (currentAttendee.contactPreference === 'Directly') {
      mappedContactPref = 'Directly';
    }
    // UnifiedAttendeeData does not have a "Mason/Guest" equivalent for contactPreference

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
      partner: undefined, // GuestAttendee can have an optional PartnerAttendee; explicitly undefined here
                               // as GuestPartnerForm handles the actual partner data separately.
    };
  }, [currentAttendee]);

  const mappedPartnerForGuestPartnerForm: OldGuestPartnerDataForForm | null = useMemo(() => {
    if (!partner) return null;
    
    let mappedPartnerContactPref: OldContactPreference = 'Primary Attendee'; // Default for partner
    if (partner.contactPreference === 'PrimaryAttendee') {
      mappedPartnerContactPref = 'Primary Attendee';
    } else if (partner.contactPreference === 'ProvideLater') {
      mappedPartnerContactPref = 'Provide Later';
    } else if (partner.contactPreference === 'Directly') {
      mappedPartnerContactPref = 'Directly';
    }

    return {
      id: partner.attendeeId,
      title: partner.title || '',
      firstName: partner.firstName || '',
      lastName: partner.lastName || '',
      relationship: partner.relationship || '',
      contactPreference: mappedPartnerContactPref,
      mobile: partner.primaryPhone,
      email: partner.primaryEmail,
      dietaryRequirements: partner.dietaryRequirements,
      specialNeeds: partner.specialNeeds,
      relatedAttendeeId: partner.relatedAttendeeId || '',
    };
  }, [partner]);
  
  if (!currentAttendee || !mappedGuestForChildren) { // Check mappedGuestForChildren as well
    console.warn(`GuestForm rendered for non-existent or non-guest attendeeId: ${attendeeId}`);
    return null; 
  }

  // --- Handlers ---
  // handleGuestFieldChange needs to map field names if they differ, e.g. 'email' from child to 'primaryEmail' for store
  const handleGuestFieldChange = useCallback(<K extends keyof GuestAttendee>(
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
          console.warn('handleGuestFieldChange called with mismatched ID', { currentId: mappedGuestForChildren.id, receivedId: id });
      }
  }, [updateAttendeeInStore, currentAttendee?.attendeeId, mappedGuestForChildren?.id]);

  const handlePhoneChange = useCallback((value: string) => {
      if (mappedGuestForChildren?.id) { 
        handleGuestFieldChange(mappedGuestForChildren.id, 'mobile', value);
      }
  }, [handleGuestFieldChange, mappedGuestForChildren?.id]);

  const handleRemoveSelf = useCallback(() => {
      if (currentAttendee?.attendeeId) {
        removeAttendeeInStore(currentAttendee.attendeeId); 
      }
  }, [removeAttendeeInStore, currentAttendee?.attendeeId]);

  const handleChange = (field: keyof UnifiedAttendeeData, value: any) => {
    updateAttendeeInStore(attendeeId, { [field]: value });
  };
  
  const handlePartnerChange = (partnerId: string, field: keyof UnifiedAttendeeData, value: any) => {
    updateAttendeeInStore(partnerId, { [field]: value });
  };

  const handleAddPartner = () => {
    if (currentAttendee && !partner) {
      const newPartnerData: Omit<UnifiedAttendeeData, 'attendeeId'> = {
        attendeeType: 'guest_partner',
        title: '',
        firstName: '',
        lastName: currentAttendee.lastName || '', 
        relationship: 'Partner',
        relatedAttendeeId: attendeeId,
        contactPreference: 'PrimaryAttendee',
        dietaryRequirements: '',
        specialNeeds: '',
        ticket: { 
          ticketDefinitionId: currentAttendee.ticket?.ticketDefinitionId || null, 
          selectedEvents: currentAttendee.ticket?.selectedEvents || [] 
        }
      };
      addAttendeeInStore(newPartnerData);
      updateAttendeeInStore(attendeeId, { hasGuestPartner: true }); 
    }
  };

  const handleRemovePartner = () => {
    if (partner) {
      removeAttendeeInStore(partner.attendeeId);
      if (currentAttendee) {
        updateAttendeeInStore(attendeeId, { hasGuestPartner: false });
      }
    }
  };

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
  // Show fields if 'Directly' is selected or if preference is not yet set (undefined, meaning "Please Select")
  const hideThisGuestsContactFields = 
    !(currentAttendee?.contactPreference === 'Directly' || typeof currentAttendee?.contactPreference === 'undefined');

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
        guest={mappedGuestForChildren} // Pass mapped data
        id={mappedGuestForChildren.id} 
        onChange={handleGuestFieldChange}
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
      />
      
      <GuestAdditionalInfo
        guest={mappedGuestForChildren} 
        id={mappedGuestForChildren.id} 
        onChange={handleGuestFieldChange}
      />

      {!partner && (
        <div className="mt-6 text-center">
          <GuestPartnerToggle 
            hasPartner={!!partner} 
            onToggle={partner ? handleRemovePartner : handleAddPartner}
          />
        </div>
      )}

      {partner && mappedPartnerForGuestPartnerForm && ( 
        <GuestPartnerForm
          partnerData={mappedPartnerForGuestPartnerForm} 
          partnerId={partner.attendeeId} 
          relatedGuestName={`${currentAttendee.firstName} ${currentAttendee.lastName}`.trim()}
          updateField={(pId: string, field: keyof OldGuestPartnerDataForForm, value: any) => {
            let fieldForStore: keyof UnifiedAttendeeData = field as any;
            let valueForStore: any = value;
            if (field === 'email') fieldForStore = 'primaryEmail';
            if (field === 'mobile') fieldForStore = 'primaryPhone';
            
            // Map contactPreference from OldContactPreference to StoreContactPreference if necessary
            if (field === 'contactPreference') {
              if (value === 'Primary Attendee') valueForStore = 'PrimaryAttendee';
              else if (value === 'Provide Later') valueForStore = 'ProvideLater';
              // "Directly" and "Mason/Guest" (if it were passed) would need mapping if store differs
            }
            updateAttendeeInStore(pId, { [fieldForStore]: valueForStore });
          }}
          removePartner={handleRemovePartner} 
        />
      )}
    </div>
  );
};

export default GuestForm;