import React, { useCallback } from 'react';
import { BasicInfo } from '@/components/register/Forms/basic-details/BasicInfo';
import { ContactInfo } from '@/components/register/Forms/basic-details/ContactInfo';
import { AdditionalInfo } from '@/components/register/Forms/basic-details/AdditionalInfo';
import { useAttendeeData } from '@/components/register/Forms/attendee/lib/useAttendeeData';
import { FormProps } from '@/components/register/Forms/attendee/types';

export const GuestForm: React.FC<FormProps> = ({ attendeeId, attendeeNumber, isPrimary }) => {
  const { attendee, updateField } = useAttendeeData(attendeeId);
  
  if (!attendee) return <div className="p-4 text-center">Loading...</div>;
  
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