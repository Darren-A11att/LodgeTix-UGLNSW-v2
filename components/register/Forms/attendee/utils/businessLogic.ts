import { AttendeeData } from '../types';
import { GRAND_TITLES, MASON_RANKS } from './constants';

// Title-Rank Interaction Logic
export const isGrandTitle = (title: string): boolean => {
  return GRAND_TITLES.includes(title as typeof GRAND_TITLES[number]);
};

export const handleTitleChange = (
  title: string, 
  currentRank: string
): Partial<AttendeeData> => {
  const updates: Partial<AttendeeData> = { title };
  
  // If W Bro is selected and not Grand Lodge, suggest Installed Master
  if (title === 'W Bro' && currentRank !== 'GL') {
    updates.rank = 'IM';
  } 
  // If a Grand title is selected, suggest GL rank
  else if (isGrandTitle(title)) {
    updates.rank = 'GL';
  }
  
  return updates;
};

export const handleRankChange = (
  rank: string, 
  currentTitle: string,
  currentRank: string,
  currentGrandOfficerStatus?: string
): Partial<AttendeeData> => {
  const updates: Partial<AttendeeData> = { rank };
  
  // Clear Grand Officer fields if rank changes from GL
  if (currentRank === 'GL' && rank !== 'GL') {
    updates.grandOfficerStatus = undefined;
    updates.presentGrandOfficerRole = undefined;
    updates.otherGrandOfficerRole = undefined;
  }
  
  // Adjust title if necessary
  if (rank === 'GL' && currentTitle === 'Bro') {
    updates.title = 'W Bro'; // Minimum title for GL
  }
  
  return updates;
};

// Field Display Rules
export const shouldShowGrandOfficerFields = (
  attendee: Partial<AttendeeData>
): boolean => {
  return attendee.attendeeType === 'Mason' && attendee.rank === 'GL';
};

export const shouldShowOtherGrandOfficerInput = (
  attendee: Partial<AttendeeData>
): boolean => {
  return attendee.grandOfficerStatus === 'Present' && 
         attendee.presentGrandOfficerRole === 'Other';
};

export const shouldShowContactFields = (
  attendee: Partial<AttendeeData>
): boolean => {
  return attendee.isPrimary || attendee.contactPreference === 'Directly';
};

export const shouldShowConfirmationMessage = (
  attendee: Partial<AttendeeData>
): boolean => {
  return !attendee.isPrimary && 
         (attendee.contactPreference === 'PrimaryAttendee' || 
          attendee.contactPreference === 'ProvideLater');
};

export const shouldShowUseSameLodge = (
  attendee: Partial<AttendeeData>,
  primaryAttendee?: Partial<AttendeeData>
): boolean => {
  return !attendee.isPrimary && 
         attendee.attendeeType === 'Mason' &&
         !!primaryAttendee &&
         primaryAttendee.attendeeType === 'Mason' &&
         (!!primaryAttendee.lodgeId || !!primaryAttendee.lodgeNameNumber);
};

// Partner Logic
export const canHavePartner = (attendee: Partial<AttendeeData>): boolean => {
  // Any attendee can have a partner
  return true;
};

export const getPartnerDefaults = (
  parentAttendee: AttendeeData
): Partial<AttendeeData> => {
  return {
    attendeeType: 'Guest',
    isPrimary: false,
    isPartner: parentAttendee.attendeeId,
    contactPreference: 'PrimaryAttendee',
    // Copy some fields from parent
    lastName: parentAttendee.lastName,
    // Set default values for partner
    title: 'Unknown',
    firstName: 'Partner',
  };
};

// Lodge Logic
export const handleUseSameLodgeChange = (
  isChecked: boolean,
  attendee: AttendeeData,
  primaryAttendee?: AttendeeData
): Partial<AttendeeData> => {
  if (isChecked && primaryAttendee) {
    return {
      grandLodgeId: primaryAttendee.grandLodgeId,
      lodgeId: primaryAttendee.lodgeId,
      lodgeNameNumber: primaryAttendee.lodgeNameNumber,
    };
  } else {
    return {
      grandLodgeId: undefined,
      lodgeId: undefined,
      lodgeNameNumber: undefined,
    };
  }
};

// Validation dependencies
export const getRequiredFields = (attendee: Partial<AttendeeData>): string[] => {
  const required = ['title', 'firstName', 'lastName'];
  
  if (attendee.attendeeType === 'Mason') {
    required.push('rank');
    
    if (attendee.rank === 'GL' && attendee.isPrimary) {
      required.push('grandOfficerStatus');
      
      if (attendee.grandOfficerStatus === 'Present') {
        required.push('presentGrandOfficerRole');
        
        if (attendee.presentGrandOfficerRole === 'Other') {
          required.push('otherGrandOfficerRole');
        }
      }
    }
    
    // Lodge requirements for primary Masons
    if (attendee.isPrimary) {
      required.push('grandLodgeId');
      // Either lodgeId or lodgeNameNumber is required
      required.push('lodgeId|lodgeNameNumber');
    }
  }
  
  if (shouldShowContactFields(attendee)) {
    required.push('primaryEmail', 'primaryPhone');
  }
  
  if (!attendee.isPrimary) {
    required.push('contactPreference');
  }
  
  return required;
};

// Contact preference message generator
export const getConfirmationMessage = (
  preference: string, 
  primaryName: string
): string => {
  if (preference === 'PrimaryAttendee') {
    return `I confirm that ${primaryName} will be responsible for all communication with this attendee.`;
  }
  if (preference === 'ProvideLater') {
    return `I confirm that ${primaryName} will be responsible for all communication with this attendee until their contact details have been updated.`;
  }
  return '';
};

// Field name mappings for store compatibility
export const mapFieldNameToStore = (fieldName: string): string => {
  const mappings: Record<string, string> = {
    'email': 'primaryEmail',
    'mobile': 'primaryPhone',
    'hasPartner': 'hasGuestPartner',
    'phone': 'primaryPhone',
  };
  return mappings[fieldName] || fieldName;
};

export const mapContactPreferenceToStore = (value: string): string => {
  const mappings: Record<string, string> = {
    'Primary Attendee': 'PrimaryAttendee',
    'Provide Later': 'ProvideLater',
    'Directly': 'Directly'
  };
  return mappings[value] || value;
};

// Determine attendee relationships
export const isPartnerOf = (attendee: Partial<AttendeeData>): boolean => {
  return !!attendee.isPartner;
};

export const hasPartner = (attendee: Partial<AttendeeData>): boolean => {
  return !!attendee.partner;
};

export const getPrimaryAttendee = (
  attendees: AttendeeData[]
): AttendeeData | undefined => {
  return attendees.find(a => a.isPrimary);
};

export const getParentAttendee = (
  attendee: AttendeeData,
  attendees: AttendeeData[]
): AttendeeData | undefined => {
  if (!attendee.isPartner) return undefined;
  return attendees.find(a => a.attendeeId === attendee.isPartner);
};

// Attendee number calculation
export const getAttendeeNumber = (
  attendee: AttendeeData,
  attendees: AttendeeData[]
): number => {
  const sortedAttendees = [...attendees].sort((a, b) => {
    // Primary first
    if (a.isPrimary && !b.isPrimary) return -1;
    if (!a.isPrimary && b.isPrimary) return 1;
    
    // Then by creation order (assuming attendeeId has timestamp)
    return a.attendeeId.localeCompare(b.attendeeId);
  });
  
  return sortedAttendees.findIndex(a => a.attendeeId === attendee.attendeeId) + 1;
};

// Grand Lodge placeholder logic
export const getGrandLodgePlaceholder = (ipGeoData?: any): string => {
  if (ipGeoData?.country_code === 'AU') {
    return 'Type to search Australian Grand Lodges...';
  }
  return 'Type to search Grand Lodges worldwide...';
};

export const getLodgePlaceholder = (hasCachedLodges: boolean): string => {
  return hasCachedLodges 
    ? 'Select or search for a Lodge...'
    : 'Type to search...';
};