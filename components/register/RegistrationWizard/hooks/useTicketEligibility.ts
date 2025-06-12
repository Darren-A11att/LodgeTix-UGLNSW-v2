import { useCallback } from 'react';
import { useRegistrationStore } from '@/lib/registrationStore';

export const useTicketEligibility = () => {
  const { attendees, registrationType } = useRegistrationStore();

  const getGroupDiscountEligibility = useCallback(() => {
    // Group tickets available for lodge registrations or 10+ individuals
    if (registrationType === 'lodge') return true;
    if ((registrationType === 'individuals' || registrationType === 'individual') && attendees.length >= 10) return true;
    return false;
  }, [attendees.length, registrationType]);

  const getVIPEligibility = useCallback(() => {
    // VIP tickets only for Masons with certain ranks
    return attendees.some(attendee => 
      attendee.attendeeType === 'mason' && 
      ['GL', 'IM'].includes(attendee.rank || '')
    );
  }, [attendees]);

  const getTicketRecommendations = useCallback(() => {
    const recommendations: string[] = [];

    if (getGroupDiscountEligibility()) {
      recommendations.push('You qualify for group discount tickets!');
    }

    if (getVIPEligibility()) {
      recommendations.push('VIP tickets are available for Grand Lodge officers');
    }

    return recommendations;
  }, [getGroupDiscountEligibility, getVIPEligibility]);

  return {
    getGroupDiscountEligibility,
    getVIPEligibility,
    getTicketRecommendations,
  };
};