import React, { useCallback } from 'react';
import { BasicInfo } from '../../basic-details/BasicInfo';
import { ContactInfo } from '../../basic-details/ContactInfo';
import { AdditionalInfo } from '../../basic-details/AdditionalInfo';
import { useAttendeeData } from '../../attendee/lib/useAttendeeData';
import { FormProps } from '../../attendee/types';

const GuestForm: React.FC<FormProps> = ({ attendeeId, attendeeNumber, isPrimary }) => {
  const { attendee, updateField } = useAttendeeData(attendeeId);
  
  if (!attendee) return <LoadingState />;
  
  return (
    <>
      <BasicInfo 
        data={attendee}
        type="Guest"
        isPrimary={isPrimary}
        onChange={updateField}
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

export { GuestForm };
export default GuestForm;