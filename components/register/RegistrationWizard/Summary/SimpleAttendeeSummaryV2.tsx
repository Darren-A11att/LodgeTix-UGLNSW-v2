import React from 'react';
import { useRegistrationStore, UnifiedAttendeeData } from '@/lib/registrationStore';
import { ShieldCheck, User, UserCheck, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { SummaryColumn } from './SummaryColumn';
import { SummarySection } from './SummarySection';
import { SummaryItem } from './SummaryItem';

/**
 * An improved version of the attendee summary using the SummaryColumn pattern
 */
export const SimpleAttendeeSummaryV2: React.FC<{
  showHeader?: boolean;
}> = ({ showHeader = false }) => {
  const { attendees, registrationType } = useRegistrationStore();
  
  // Count attendees by type
  const counts = {
    total: attendees.length,
    masons: attendees.filter(att => att.attendeeType?.toLowerCase() === 'mason').length,
    guests: attendees.filter(att => att.attendeeType?.toLowerCase() === 'guest' && !att.isPartner).length, // Exclude partners from guest count
    partners: attendees.filter(att => att.isPartner).length
  };
  
  // Format registration type display
  const getFormattedRegistrationType = () => {
    if (registrationType === 'individual') return 'Myself & Others';
    if (registrationType === 'lodge') return 'Lodge';
    if (registrationType === 'delegation') return 'Official Delegation';
    return registrationType || 'Not selected';
  };
  
  return (
    <SummaryColumn
      header={{
        title: 'Attendee Summary',
        step: 2
      }}
      showHeader={showHeader}
    >
      {/* Registration Type */}
      <SummarySection title="Registration Type">
        <SummaryItem
          label="Type"
          value={getFormattedRegistrationType()}
          variant="default"
        />
      </SummarySection>
      
      {/* Attendee List */}
      <SummarySection title="Attendee List">
        <div className="space-y-2">
          {/* Table Header */}
          <div className="grid grid-cols-2 gap-4 text-xs font-medium text-muted-foreground pb-2 border-b">
            <div>Name</div>
            <div>Type/Role</div>
          </div>
          
          {/* Attendee Rows */}
          {attendees.map(attendee => {
            // Get the related attendee name if this is a partner
            const getPartnerInfo = () => {
              if (attendee.isPartner) {
                const relatedAttendee = attendees.find(a => a.attendeeId === attendee.isPartner);
                if (relatedAttendee) {
                  return `Partner of ${relatedAttendee.firstName} ${relatedAttendee.lastName}`;
                }
              }
              return null;
            };
            
            // Format the type/role display
            const getTypeDisplay = () => {
              const partnerInfo = getPartnerInfo();
              if (partnerInfo) return partnerInfo;
              
              let typeDisplay = attendee.attendeeType;
              if (attendee.isPrimary) {
                typeDisplay += ' (Primary)';
              }
              return typeDisplay;
            };
            
            return (
              <div key={attendee.attendeeId} className="grid grid-cols-2 gap-4 py-2 border-b border-muted/30">
                <div className="flex items-center gap-2">
                  {attendee.attendeeType?.toLowerCase() === 'mason' && !attendee.isPartner && (
                    <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                  )}
                  {attendee.attendeeType?.toLowerCase() === 'guest' && !attendee.isPartner && (
                    <User className="w-3.5 h-3.5 text-muted-foreground" />
                  )}
                  {attendee.isPartner && (
                    <UserCheck className="w-3.5 h-3.5 text-pink-500" />
                  )}
                  <div className="text-sm">
                    {attendee.firstName} {attendee.lastName}
                    {attendee.rank && <span className="ml-1 text-xs text-muted-foreground">({attendee.rank})</span>}
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  {getTypeDisplay()}
                </div>
              </div>
            );
          })}
        </div>
      </SummarySection>
      
      {/* Attendee Counts */}
      <SummarySection title="Summary">
        <SummaryItem
          label="Total Attendees"
          value={counts.total.toString()}
          variant="highlight"
        />
        {counts.masons > 0 && (
          <SummaryItem
            label="Masons"
            value={counts.masons.toString()}
          />
        )}
        {counts.guests > 0 && (
          <SummaryItem
            label="Guests"
            value={counts.guests.toString()}
          />
        )}
        {counts.partners > 0 && (
          <SummaryItem
            label="Partners"
            value={counts.partners.toString()}
          />
        )}
      </SummarySection>
    </SummaryColumn>
  );
};