import React from 'react';
import { X } from 'lucide-react';
import EnhancedGuestBasicInfo from './GuestBasicInfo-enhanced';
import GuestContactInfo from './GuestContactInfo';
import GuestAdditionalInfo from './GuestAdditionalInfo';
import type { GuestAttendee } from '../../../../lib/registration-types';
import type { UnifiedAttendeeData } from '../../../../lib/registrationStore';
import { GUEST_TITLES } from '../../../../lib/constants/titles';
import { PARTNER_RELATIONSHIPS } from '../../../../lib/constants/relationships';

interface PartnerDetailsSectionProps {
  partner: UnifiedAttendeeData;
  onFieldChange: (partnerId: string, field: string, value: any) => void;
  onRemove: (partnerId: string) => void;
  allMasons: UnifiedAttendeeData[];
  primaryMasonAttendee?: UnifiedAttendeeData;
  relatedAttendeeName: string;
}

const PartnerDetailsSection: React.FC<PartnerDetailsSectionProps> = ({
  partner,
  onFieldChange,
  onRemove,
  allMasons,
  primaryMasonAttendee,
  relatedAttendeeName,
}) => {
  // Map partner data to GuestAttendee format
  const mappedPartnerForDisplay: GuestAttendee = {
    id: partner.attendeeId,
    type: 'guest',
    title: partner.title || '',
    firstName: partner.firstName || '',
    lastName: partner.lastName || '',
    email: partner.primaryEmail,
    mobile: partner.primaryPhone,
    contactPreference: partner.contactPreference === 'PrimaryAttendee' ? 'Primary Attendee' :
                       partner.contactPreference === 'ProvideLater' ? 'Provide Later' :
                       partner.contactPreference === 'Directly' ? 'Directly' : '',
    dietaryRequirements: partner.dietaryRequirements,
    specialNeeds: partner.specialNeeds,
    hasPartner: false,
    relatedAttendeeId: partner.isPartner || partner.partnerOf,
    partner: undefined,
  };
  
  const getConfirmationMessage = () => {
    if (!primaryMasonAttendee) return "";
    const primaryFullName = `${primaryMasonAttendee.firstName || ''} ${primaryMasonAttendee.lastName || ''}`.trim();
    if (partner.contactPreference === "PrimaryAttendee") {
      return `I confirm that ${primaryFullName} will be responsible for all communication with this attendee`;
    } else if (partner.contactPreference === "ProvideLater") {
      return `I confirm that ${primaryFullName} will be responsible for all communication with this attendee until their contact details have been updated in their profile`;
    }
    return "";
  };
  
  return (
    <div className="border-t border-slate-200 pt-6 mt-6 relative">
      <h4 className="text-lg font-bold mb-4 text-primary">
        Partner of {relatedAttendeeName}
      </h4>
      
      <EnhancedGuestBasicInfo
        guest={mappedPartnerForDisplay}
        id={partner.attendeeId}
        onChange={(id, field, value) => onFieldChange(id, field as string, value)}
        allMasons={allMasons}
        primaryMasonId={primaryMasonAttendee?.attendeeId}
        titles={GUEST_TITLES}
        customRelationshipOptions={PARTNER_RELATIONSHIPS}
        isPartner={true}
      />
      
      <GuestContactInfo
        guest={mappedPartnerForDisplay}
        id={partner.attendeeId}
        onChange={(id, field, value) => onFieldChange(id, field as string, value)}
        handlePhoneChange={(value) => onFieldChange(partner.attendeeId, 'mobile', value)}
        hideContactFields={partner.contactPreference !== 'Directly'}
        showConfirmation={partner.contactPreference === 'PrimaryAttendee' || partner.contactPreference === 'ProvideLater'}
        getConfirmationMessage={getConfirmationMessage}
        primaryAttendeeData={primaryMasonAttendee}
      />
      
      <GuestAdditionalInfo
        guest={mappedPartnerForDisplay}
        id={partner.attendeeId}
        onChange={(id, field, value) => onFieldChange(id, field as string, value)}
      />
      
      <button
        type="button"
        onClick={() => onRemove(partner.attendeeId)}
        className="absolute top-6 right-0 text-red-500 hover:text-red-700 flex items-center text-sm"
        aria-label="Remove partner"
      >
        <X className="w-4 h-4 mr-1" />
        <span>Remove</span>
      </button>
    </div>
  );
};

export default PartnerDetailsSection;