import React from 'react';
import { User, Users, UserCheck, Trash2, ShieldCheck, Crown, CircleUserRound } from 'lucide-react'; // Add Trash2 icon
import { useRegistrationStore, UnifiedAttendeeData } from '@/lib/registrationStore';
import { Badge } from '@/components/ui/badge';
// Import the context hook
// import { useRegisterForm } from '../../hooks/useRegisterForm';

interface AttendeeSummaryProps {
  attendees: UnifiedAttendeeData[];
}

const AttendeeSummary: React.FC<AttendeeSummaryProps> = ({ attendees }) => {
  // Access state from the registration store
  const { removeAttendee } = useRegistrationStore();

  const sortedAttendees = [...attendees].sort((a, b) => {
    // Primary attendee first
    if (a.isPrimary) return -1;
    if (b.isPrimary) return 1;

    // Masons before Guests/Partners
    if (a.attendeeType === 'Mason' && b.attendeeType !== 'Mason') return -1;
    if (b.attendeeType === 'Mason' && a.attendeeType !== 'Mason') return 1;

    // Partners immediately after their related attendee (if possible)
    // This requires finding the related attendee for comparison
    const findRelated = (id: string | undefined) => attendees.find(att => att.attendeeId === id);
    
    if ((a.attendeeType === 'LadyPartner' || a.attendeeType === 'GuestPartner') && a.partnerOf) {
      const relatedToA = findRelated(a.partnerOf);
      if (relatedToA && relatedToA === b) return 1; // a should come after b
      if (relatedToA && b.partnerOf !== a.partnerOf) { // Compare based on related attendee sort order
         // Sort a based on its related attendee compared to b
         // Recursive sort could be complex, let's stick to simpler grouping for now
      }
    }
    if (b.isPartner && b.relatedAttendeeId) {
      const relatedToB = findRelated(b.relatedAttendeeId);
      if (relatedToB && relatedToB === a) return -1; // b should come after a
      if (relatedToB && a.relatedAttendeeId !== b.relatedAttendeeId) {
         // Sort b based on its related attendee compared to a
      }
    }
    // Fallback: Sort by first name
    return (a.firstName || '').localeCompare(b.firstName || '');
  });

  // Only log in development environment and with less frequency
  if (process.env.NODE_ENV === 'development' && Math.random() < 0.1) {
    console.log("AttendeeSummary received:", { 
      attendees: attendees.length,
      byType: attendees.reduce((acc, att) => {
        acc[att.attendeeType] = (acc[att.attendeeType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    });
  }

  const totalAttendees = sortedAttendees.length;

  if (totalAttendees === 0) {
    return null;
  }

  const getRelatedAttendeeName = (relatedId: string): string | null => {
    const related = attendees.find(att => att.attendeeId === relatedId);
    return related ? `${related.firstName} ${related.lastName}`.trim() : null;
  };

  const getAttendeeTitle = (attendee: UnifiedAttendeeData): string => {
    if (attendee.isPrimary) return "Primary Registrant";
    if (attendee.attendeeType === 'Mason') return "Mason Attendee";
    if (attendee.attendeeType === 'LadyPartner') return "Lady Partner";
    if (attendee.attendeeType === 'GuestPartner') return "Guest Partner";
    if (attendee.attendeeType === 'Guest') return "Guest Attendee"; 
    return "Attendee"; // Fallback
  };

  const getAttendeeIcon = (attendee: UnifiedAttendeeData): React.ReactNode => {
    if (attendee.isPrimary) return <Crown className="w-5 h-5 mr-3 text-masonic-gold flex-shrink-0" />;
    if (attendee.attendeeType === 'Mason') return <ShieldCheck className="w-5 h-5 mr-3 text-masonic-navy flex-shrink-0" />;
    if (attendee.attendeeType === 'LadyPartner') {
      return <UserCheck className="w-5 h-5 mr-3 text-pink-500 flex-shrink-0" />;
    }
    if (attendee.attendeeType === 'GuestPartner') {
      return <Users className="w-5 h-5 mr-3 text-teal-500 flex-shrink-0" />; // Changed guest partner icon color
    }
    if (attendee.attendeeType === 'Guest') return <User className="w-5 h-5 mr-3 text-gray-600 flex-shrink-0" />;
    return <CircleUserRound className="w-5 h-5 mr-3 text-gray-400 flex-shrink-0" />; // Fallback icon
  };

  const handleRemove = (attendee: UnifiedAttendeeData) => {
    const isPrimaryMason = attendee.attendeeType === 'mason' && attendee.isPrimary;
    if (isPrimaryMason) return; // Can't remove primary mason
    
    removeAttendee(attendee.attendeeId);
  };

  return (
    <div className="space-y-3">
      {sortedAttendees.map((attendee) => (
        <div key={attendee.attendeeId} className="flex items-center p-3 bg-white rounded-md border border-slate-200 shadow-sm">
          {getAttendeeIcon(attendee)}
          <div className="flex-grow">
            <p className="font-semibold text-slate-800">
              {attendee.firstName} {attendee.lastName}
            </p>
            <p className="text-sm text-slate-500">
              {getAttendeeTitle(attendee)}
              {attendee.isPartner && attendee.relatedAttendeeId && (
                <span className="italic ml-1">
                  (Partner of {getRelatedAttendeeName(attendee.relatedAttendeeId) || 'Unknown'})
                </span>
              )}
            </p>
          </div>
          {/* Add badges or other info if needed */}
          {attendee.attendeeType === 'mason' && attendee.rank && (
            <Badge variant="outline" className="ml-auto">{attendee.rank}</Badge>
          )}
           {attendee.attendeeType === 'mason' && attendee.grandRank && (
            <Badge variant="outline" className="ml-1">{attendee.grandRank}</Badge>
          )}
          {!attendee.isPrimary && (
            <button 
              type="button" 
              onClick={() => handleRemove(attendee)}
              className="text-red-500 hover:text-red-700 flex-shrink-0 p-1 -mr-1 rounded-full hover:bg-red-100 transition-colors"
              aria-label={`Remove ${attendee.firstName} ${attendee.lastName}`}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

export default AttendeeSummary;