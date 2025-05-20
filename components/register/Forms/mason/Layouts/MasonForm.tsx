import React, { useCallback } from 'react';
import { BasicInfo } from '@/components/register/Forms/basic-details/BasicInfo';
import { ContactInfo } from '@/components/register/Forms/basic-details/ContactInfo';
import { AdditionalInfo } from '@/components/register/Forms/basic-details/AdditionalInfo';
import { GrandLodgeSelection } from '../lib/GrandLodgeSelection';
import { LodgeSelection } from '../lib/LodgeSelection';
import { GrandOfficerFields } from '../utils/GrandOfficerFields';
import { useAttendeeDataWithDebounce } from '@/components/register/Forms/attendee/lib/useAttendeeData';
import { FormProps } from '@/components/register/Forms/attendee/types';
import { useRegistrationStore } from '@/lib/registrationStore';
import { shouldShowUseSameLodge } from '@/components/register/Forms/attendee/utils/businessLogic';

export const MasonForm: React.FC<FormProps> = ({ attendeeId, attendeeNumber, isPrimary }) => {
  const { attendee, updateField, updateMultipleFields } = useAttendeeDataWithDebounce(attendeeId);
  
  // Get primary mason for lodge selection
  const primaryMason = useRegistrationStore(state => 
    state.attendees.find(a => a.isPrimary && a.attendeeType === 'Mason')
  );
  
  // Callbacks for complex field updates
  const handleLodgeChange = useCallback((lodgeId: string, lodgeNameNumber?: string) => {
    updateMultipleFields({
      lodgeId,
      lodgeNameNumber: lodgeNameNumber || ''
    });
  }, [updateMultipleFields]);
  
  if (!attendee) return <div className="p-4 text-center">Loading...</div>;
  
  // Check if we should show "use same lodge" option
  const showSameLodgeOption = !isPrimary && 
                              attendee.attendeeType === 'Mason' && 
                              primaryMason?.lodgeId;
  
  return (
    <>
      <BasicInfo 
        data={attendee}
        type="Mason"
        isPrimary={isPrimary}
        onChange={updateField}
      />
      
      {attendee.rank === 'GL' && (
        <GrandOfficerFields 
          data={attendee}
          onChange={updateField}
        />
      )}
      
      <GrandLodgeSelection 
        value={attendee.grandLodgeId}
        onChange={(value) => updateField('grandLodgeId', value)}
      />
      
      <LodgeSelection 
        grandLodgeId={attendee.grandLodgeId}
        value={attendee.lodgeId}
        onChange={handleLodgeChange}
        required={isPrimary}
        showUseSameLodge={showSameLodgeOption}
        primaryMason={primaryMason}
      />
      
      <ContactInfo 
        data={attendee}
        isPrimary={isPrimary}
        onChange={updateField}
      />
      
      <AdditionalInfo 
        data={attendee}
        onChange={updateField}
      />
    </>
  );
};

// Simple loading state component
const LoadingState: React.FC = () => (
  <div className="animate-pulse">
    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
  </div>
);

export default MasonForm;