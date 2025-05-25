import React from 'react';
import { useRegistrationStore, UnifiedAttendeeData } from '@/lib/registrationStore';
import { ShieldCheck, User, UserCheck, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

/**
 * A simple summary of attendees for the right sidebar
 */
export const SimpleAttendeeSummary: React.FC = () => {
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
    <div className="space-y-6">
      {/* Registration Type */}
      <div>
        <h3 className="text-sm font-medium mb-1">Type</h3>
        <p className="text-sm">{getFormattedRegistrationType()}</p>
      </div>
      
      {/* Attendee Count Summary */}
      <div>
        <h3 className="text-sm font-medium mb-2">Attendee List</h3>
        <div className="space-y-2">
          {/* Table Header */}
          <div className="grid grid-cols-2 gap-4 text-xs font-medium text-gray-700 pb-2 border-b">
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
              <div key={attendee.attendeeId} className="grid grid-cols-2 gap-4 py-2 border-b border-gray-100">
                <div className="flex items-center">
                  {attendee.attendeeType?.toLowerCase() === 'mason' && !attendee.isPartner && (
                    <ShieldCheck className="w-4 h-4 mr-2 text-masonic-navy" />
                  )}
                  {attendee.attendeeType?.toLowerCase() === 'guest' && !attendee.isPartner && (
                    <User className="w-4 h-4 mr-2 text-gray-600" />
                  )}
                  {attendee.isPartner && (
                    <UserCheck className="w-4 h-4 mr-2 text-pink-500" />
                  )}
                  <div className="text-sm">
                    {attendee.firstName} {attendee.lastName}
                    {attendee.rank && <span className="ml-1 text-xs text-gray-500">({attendee.rank})</span>}
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  {getTypeDisplay()}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center pt-3 mt-2 border-t">
          <Users className="w-4 h-4 mr-2 text-masonic-navy" />
          <span className="text-sm font-medium">{counts.total} Total Attendee{counts.total !== 1 ? 's' : ''}</span>
        </div>
      </div>
    </div>
  );
};