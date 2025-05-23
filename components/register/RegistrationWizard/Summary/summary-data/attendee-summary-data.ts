import { UnifiedAttendeeData } from '@/lib/registrationStore';

interface AttendeeSummaryDataProps {
  attendees: UnifiedAttendeeData[];
  registrationType?: string | null;
}

export function getAttendeeSummaryData({ 
  attendees, 
  registrationType 
}: AttendeeSummaryDataProps) {
  // Count attendees by type
  const counts = {
    total: attendees.length,
    masons: attendees.filter(att => att.attendeeType?.toLowerCase() === 'mason').length,
    guests: attendees.filter(att => att.attendeeType?.toLowerCase() === 'guest').length,
    partners: attendees.filter(att => att.isPartner).length
  };
  
  // Format registration type display
  const getFormattedRegistrationType = () => {
    if (registrationType === 'individual') return 'Myself & Others';
    if (registrationType === 'lodge') return 'Lodge';
    if (registrationType === 'delegation') return 'Official Delegation';
    return registrationType || 'Not selected';
  };
  
  // Build sections
  const sections = [];
  
  // Registration Type section
  sections.push({
    title: 'Registration Type',
    items: [
      {
        label: 'Type',
        value: getFormattedRegistrationType()
      }
    ]
  });
  
  // Attendee List section with custom rendering
  const attendeeItems = attendees.map(attendee => {
    const parts = [];
    if (attendee.title) parts.push(attendee.title);
    parts.push(attendee.firstName);
    parts.push(attendee.lastName);
    
    let name = parts.join(' ');
    
    // Add rank info
    const rankInfo = [];
    if (attendee.rank) rankInfo.push(attendee.rank);
    if (attendee.grandRank) rankInfo.push(attendee.grandRank);
    if (rankInfo.length > 0) {
      name += ` (${rankInfo.join(', ')})`;
    }
    
    // Build attendee type label
    const typeLabel = [];
    typeLabel.push(attendee.attendeeType || 'Guest');
    if (attendee.isPrimary) typeLabel.push('Primary');
    if (attendee.isPartner) typeLabel.push('Partner');
    
    return {
      label: name,
      value: typeLabel.join(' • ')
    };
  });
  
  if (attendeeItems.length > 0) {
    sections.push({
      title: 'Attendee List',
      items: attendeeItems
    });
  }
  
  // Summary counts section
  const summaryItems = [
    {
      label: 'Total Attendees',
      value: counts.total.toString(),
      isHighlight: true
    }
  ];
  
  if (counts.masons > 0) {
    summaryItems.push({
      label: 'Masons',
      value: counts.masons.toString()
    });
  }
  
  if (counts.guests > 0) {
    summaryItems.push({
      label: 'Guests', 
      value: counts.guests.toString()
    });
  }
  
  if (counts.partners > 0) {
    summaryItems.push({
      label: 'Partners',
      value: counts.partners.toString()
    });
  }
  
  sections.push({
    title: 'Summary',
    items: summaryItems
  });
  
  return {
    sections,
    footer: null,
    emptyMessage: 'No attendees added yet'
  };
}