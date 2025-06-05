import { useCallback } from 'react';
import { useRegistrationStore } from '@/lib/registrationStore';
import type { AttendeeData } from '../../Forms/attendee/types';

// Helper function to get required fields based on attendee type and state
const getRequiredFields = (attendee: AttendeeData): string[] => {
  const baseFields = ['title', 'firstName', 'lastName'];
  
  if (attendee.attendeeType === 'mason') {
    const masonFields = [...baseFields, 'rank', 'grandLodgeId', 'lodgeId'];
    
    // Add contact fields for primary or direct contact
    if (attendee.isPrimary || attendee.contactPreference === 'directly') {
      masonFields.push('primaryEmail', 'primaryPhone');
    }
    
    // Add grand officer fields if rank is GL
    if (attendee.rank === 'GL') {
      masonFields.push('grandOfficerStatus');
      if (attendee.grandOfficerStatus === 'Present') {
        masonFields.push('presentGrandOfficerRole');
      }
    }
    
    return masonFields;
  }
  
  // Guest type
  const guestFields = [...baseFields];
  
  // Add contact fields for direct contact
  if (attendee.contactPreference === 'directly') {
    guestFields.push('primaryEmail', 'primaryPhone');
  }
  
  return guestFields;
};

export const useAttendeeProgress = () => {
  const { attendees, registrationType } = useRegistrationStore();
  
  const getProgress = useCallback(() => {
    if (attendees.length === 0) return 0;
    
    // Calculate completion percentage based on filled fields
    const totalFields = attendees.reduce((sum, attendee) => {
      const requiredFields = getRequiredFields(attendee as AttendeeData);
      return sum + requiredFields.length;
    }, 0);
    
    const completedFields = attendees.reduce((sum, attendee) => {
      const requiredFields = getRequiredFields(attendee as AttendeeData);
      const completed = requiredFields.filter(field => 
        attendee[field as keyof AttendeeData]
      ).length;
      return sum + completed;
    }, 0);
    
    return Math.round((completedFields / totalFields) * 100);
  }, [attendees]);

  const getCompletionStatus = useCallback(() => {
    const minAttendees = registrationType === 'lodge' ? 3 : 1;
    
    return {
      hasMinimumAttendees: attendees.length >= minAttendees,
      allFieldsComplete: getProgress() === 100,
      isComplete: attendees.length >= minAttendees && getProgress() === 100,
    };
  }, [attendees, registrationType, getProgress]);

  return { getProgress, getCompletionStatus };
};