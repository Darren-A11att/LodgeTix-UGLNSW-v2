import React, { useState, useCallback, useMemo } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { X } from 'lucide-react';
import EnhancedGuestBasicInfo from './GuestBasicInfo-enhanced';
import GuestContactInfo from './GuestContactInfo';
import GuestAdditionalInfo from './GuestAdditionalInfo';
import type { GuestAttendee, ContactPreference as OldContactPreference } from '../../../../lib/registration-types';
import { useRegistrationStore, RegistrationState } from '../../../../lib/registrationStore';
import type { UnifiedAttendeeData } from '../../../../lib/registrationStore';
import { GUEST_TITLES } from '../../../../lib/constants/titles';
import { PARTNER_RELATIONSHIPS, GUEST_RELATIONSHIPS } from '../../../../lib/constants/relationships';

interface UnifiedGuestFormProps {
  attendeeId: string;
  attendeeNumber: number;
}

const GuestForm2: React.FC<UnifiedGuestFormProps> = ({
  attendeeId,
  attendeeNumber,
}) => {
  // Store Actions
  const updateAttendeeInStore = useRegistrationStore((state: RegistrationState) => state.updateAttendee);
  const removeAttendeeInStore = useRegistrationStore((state: RegistrationState) => state.removeAttendee);
  
  // Create a memoized selector to avoid cache issues
  const dataSelector = useCallback((state: RegistrationState) => {
    const current = state.attendees.find(att => att.attendeeId === attendeeId) as UnifiedAttendeeData | undefined;
    let related = null;
    
    if (current?.isPartner) {
      related = state.attendees.find(att => att.attendeeId === current.isPartner);
    }
    
    const primaryMason = state.attendees.find(
      att => att.isPrimary === true && att.attendeeType.toLowerCase() === 'mason'
    );
    
    const allMasons = state.attendees.filter(att => att.attendeeType.toLowerCase() === 'mason');
    
    return {
      currentAttendee: current,
      relatedAttendee: related,
      primaryMasonAttendee: primaryMason,
      allMasonAttendees: allMasons
    };
  }, [attendeeId]);
  
  // Add equality function to fix caching issue
  const equalityFn = useCallback(
    (prev: any, next: any) => {
      return prev.currentAttendee?.attendeeId === next.currentAttendee?.attendeeId &&
             prev.relatedAttendee?.attendeeId === next.relatedAttendee?.attendeeId &&
             prev.primaryMasonAttendee?.attendeeId === next.primaryMasonAttendee?.attendeeId &&
             prev.allMasonAttendees?.length === next.allMasonAttendees?.length;
    },
    []
  );
  
  // Get all relevant data in a single selector with custom equality
  const { currentAttendee, relatedAttendee, primaryMasonAttendee, allMasonAttendees } = useRegistrationStore(dataSelector, equalityFn);
  
  if (!currentAttendee || (currentAttendee.attendeeType !== 'Guest' && currentAttendee.attendeeType.toLowerCase() !== 'ladypartner')) {
    console.warn(`GuestForm2 rendered for non-guest/non-partner or non-existent attendeeId: ${attendeeId}`);
    return null;
  }
  
  // Map data for child components
  const mappedGuestForChildren: GuestAttendee | null = useMemo(() => {
    if (!currentAttendee) return null;
    
    let mappedContactPref: OldContactPreference = "";
    const storePref = currentAttendee.contactPreference;
    
    if (storePref === 'PrimaryAttendee') {
      mappedContactPref = 'Primary Attendee';
    } else if (storePref === 'ProvideLater') {
      mappedContactPref = 'Provide Later';
    } else if (storePref === 'Directly') {
      mappedContactPref = 'Directly';
    } else if (storePref === 'Mason/Guest') {
      mappedContactPref = 'Mason/Guest';
    } else {
      mappedContactPref = '';
    }
    
    return {
      id: currentAttendee.attendeeId,
      type: 'guest',
      title: currentAttendee.title || '',
      firstName: currentAttendee.firstName || '',
      lastName: currentAttendee.lastName || '',
      email: currentAttendee.primaryEmail,
      mobile: currentAttendee.primaryPhone,
      contactPreference: mappedContactPref,
      dietaryRequirements: currentAttendee.dietaryRequirements,
      specialNeeds: currentAttendee.specialNeeds,
      hasPartner: !!currentAttendee.partner,
      relatedAttendeeId: currentAttendee.guestOfId,
      partner: undefined,
    };
  }, [currentAttendee]);
  
  // Handlers
  const handleGuestFieldChange = useDebouncedCallback(
    <K extends keyof GuestAttendee>(
      id: string,
      field: K,
      value: GuestAttendee[K]
    ) => {
      if (id === mappedGuestForChildren?.id) {
        let fieldForStore: keyof UnifiedAttendeeData = field as any;
        let valueForStore: any = value;
        
        // Field name mapping
        if (field === 'email') fieldForStore = 'primaryEmail';
        if (field === 'mobile') fieldForStore = 'primaryPhone';
        if (field === 'hasPartner') return; // Don't update - partner is managed differently
        
        // Value mapping for contactPreference
        if (field === 'contactPreference') {
          if (value === 'Primary Attendee') valueForStore = 'PrimaryAttendee';
          else if (value === 'Provide Later') valueForStore = 'ProvideLater';
        }
        
        updateAttendeeInStore(currentAttendee.attendeeId, { [fieldForStore]: valueForStore });
      }
    },
    50
  );
  
  const handlePhoneChange = useDebouncedCallback(
    (value: string) => {
      if (currentAttendee) {
        updateAttendeeInStore(currentAttendee.attendeeId, { primaryPhone: value });
      }
    },
    50
  );
  
  const handleRemoveSelf = useCallback(() => {
    if (currentAttendee?.attendeeId) {
      removeAttendeeInStore(currentAttendee.attendeeId);
    }
  }, [removeAttendeeInStore, currentAttendee?.attendeeId]);
  
  const getConfirmationMessage = useCallback((): string => {
    if (!primaryMasonAttendee) return "";
    const primaryFullName = `${primaryMasonAttendee.firstName || ''} ${primaryMasonAttendee.lastName || ''}`.trim();
    
    if (mappedGuestForChildren?.contactPreference === "Primary Attendee") {
      return `I confirm that ${primaryFullName} will be responsible for all communication with this attendee`;
    } else if (mappedGuestForChildren?.contactPreference === "Provide Later") {
      return `I confirm that ${primaryFullName} will be responsible for all communication with this attendee until their contact details have been updated in their profile`;
    }
    return "";
  }, [primaryMasonAttendee, mappedGuestForChildren?.contactPreference]);
  
  // Dynamic relationship options based on isPartner
  const relationshipOptions = useMemo(() => {
    if (currentAttendee.isPartner) {
      return PARTNER_RELATIONSHIPS;
    }
    return null; // For regular guests, the BasicInfo component shows the mason dropdown
  }, [currentAttendee.isPartner]);
  
  // Hide contact fields unless 'Directly' is selected
  const hideContactFields = currentAttendee.contactPreference !== 'Directly';
  
  // Determine header text
  const headerText = currentAttendee.isPartner ? 
    `Partner ${attendeeNumber}` : 
    `Guest Attendee ${attendeeNumber}`;
  
  return (
    <div className="bg-slate-50 p-6 rounded-lg mb-8 relative">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-slate-800">{headerText}</h3>
        <button
          type="button"
          onClick={handleRemoveSelf}
          className="text-red-500 hover:text-red-700 transition-colors text-sm flex items-center"
          aria-label={`Remove ${headerText}`}
        >
          <X className="w-4 h-4 mr-1" />
          <span>Remove</span>
        </button>
      </div>
      
      <EnhancedGuestBasicInfo
        guest={mappedGuestForChildren}
        id={attendeeId}
        onChange={handleGuestFieldChange}
        allMasons={allMasonAttendees}
        primaryMasonId={primaryMasonAttendee?.attendeeId}
        titles={GUEST_TITLES}
        customRelationshipOptions={relationshipOptions}
        isPartner={!!currentAttendee.isPartner}
      />
      
      <GuestContactInfo
        guest={mappedGuestForChildren}
        id={mappedGuestForChildren.id}
        onChange={handleGuestFieldChange}
        handlePhoneChange={handlePhoneChange}
        hideContactFields={hideContactFields}
        showConfirmation={mappedGuestForChildren.contactPreference === 'Primary Attendee' || mappedGuestForChildren.contactPreference === 'Provide Later'}
        getConfirmationMessage={getConfirmationMessage}
        primaryAttendeeData={primaryMasonAttendee}
      />
      
      <GuestAdditionalInfo
        guest={mappedGuestForChildren}
        id={mappedGuestForChildren.id}
        onChange={handleGuestFieldChange}
      />
      
    </div>
  );
};

export default GuestForm2;