import React from 'react';
import { PartnerToggle } from './PartnerToggle';
import { PartnerRelationshipSelect } from './PartnerRelationshipSelect';
import { usePartnerManager } from '../attendee/lib/usePartnerManager';

// Example usage with usePartnerManager
export const PartnerToggleExample: React.FC<{ attendeeId: string }> = ({ attendeeId }) => {
  const { hasPartner, togglePartner, partner, updatePartnerRelationship } = usePartnerManager(attendeeId);
  
  return (
    <div className="space-y-4">
      <PartnerToggle
        hasPartner={hasPartner}
        onToggle={togglePartner}
        partnerLabel="spouse"
        addText="Add Spouse"
        removeText="Remove Spouse"
      />
      
      {hasPartner && partner && (
        <PartnerRelationshipSelect
          value={partner.relationship}
          onChange={(relationship) => updatePartnerRelationship(relationship)}
          attendeeName={`${partner.firstName} ${partner.lastName}`}
        />
      )}
    </div>
  );
};

// Mason Example
export const MasonPartnerExample: React.FC<{ attendeeId: string }> = ({ attendeeId }) => {
  const { hasPartner, togglePartner } = usePartnerManager(attendeeId);
  
  return (
    <div className="mt-6 border-t border-slate-200 pt-4 flex justify-center">
      <PartnerToggle
        hasPartner={hasPartner}
        onToggle={togglePartner}
        partnerLabel="lady or partner"
        addText="Register Partner"
        removeText="Remove Lady or Partner"
        className={hasPartner
          ? "border-masonic-navy text-masonic-navy hover:bg-masonic-lightblue"
          : "bg-masonic-gold text-masonic-navy hover:bg-masonic-lightgold"
        }
      />
    </div>
  );
};

// Switch Example
export const SwitchToggleExample: React.FC<{ attendeeId: string }> = ({ attendeeId }) => {
  const { hasPartner, togglePartner } = usePartnerManager(attendeeId);
  
  return (
    <PartnerToggle
      hasPartner={hasPartner}
      onToggle={togglePartner}
      partnerLabel="partner"
      useSwitch={true}
    />
  );
};