import React, { useCallback, useEffect, useState } from 'react';
import { BasicInfo } from '@/components/register/Forms/basic-details/BasicInfo';
import { ContactInfo } from '@/components/register/Forms/basic-details/ContactInfo';
import { AdditionalInfo } from '@/components/register/Forms/basic-details/AdditionalInfo';
import { useAttendeeDataWithDebounce } from '@/components/register/Forms/attendee/lib/useAttendeeData';
import { FormProps } from '@/components/register/Forms/attendee/types';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRegistrationStore } from '@/lib/registrationStore';
import { PartnerRelationshipSelect } from '../../shared/PartnerRelationshipSelect';
import { TextField, SelectField } from '../../shared/FieldComponents';
import { GUEST_TITLES } from '../../attendee/utils/constants';

interface GuestFormProps extends FormProps {
  onRemove?: () => void;
  onRelationshipChange?: (relationship: string) => void;
}

export const GuestForm: React.FC<GuestFormProps> = ({ attendeeId, attendeeNumber, isPrimary, onRemove, onRelationshipChange }) => {
  const { attendee, updateField } = useAttendeeDataWithDebounce(attendeeId);
  const [isMobile, setIsMobile] = useState(false);
  
  // Check for mobile view on component mount
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  if (!attendee) return <div className="p-4 text-center">Loading...</div>;
  
  // Determine if this is a partner
  const isPartner = Boolean(attendee.isPartner);
  
  // Title options for guests
  const titleOptions = GUEST_TITLES.map(title => ({ value: title, label: title }));
  
  return (
    <div className="p-4 space-y-6 relative">
      
      {/* For First Row Layout */}
      <div className="hidden md:block">
        {/* Relationship field for partners - move this out from the nested structure */}
        {isPartner && onRelationshipChange && (
          <div className="grid grid-cols-12 gap-4 gap-y-4 mt-4">
            <div className="col-span-2">
              <PartnerRelationshipSelect
                value={attendee.relationship || ''}
                onChange={onRelationshipChange}
                required={true}
              />
            </div>
            <div className="col-span-2">
              <SelectField
                label="Title"
                name="title"
                value={attendee.title || ''}
                onChange={(value) => updateField('title', value)}
                options={titleOptions}
                required={true}
              />
            </div>
            <div className="col-span-4">
              <TextField
                label="First Name"
                name="firstName"
                value={attendee.firstName || ''}
                onChange={(value) => updateField('firstName', value)}
                required={true}
              />
            </div>
            <div className="col-span-4">
              <TextField
                label="Last Name"
                name="lastName"
                value={attendee.lastName || ''}
                onChange={(value) => updateField('lastName', value)}
                required={true}
              />
            </div>
          </div>
        )}
      </div>
      
      {/* For Mobile Layout */}
      <div className="md:hidden">
        {isPartner && onRelationshipChange && (
          <div className="mb-4">
            <PartnerRelationshipSelect
              value={attendee.relationship || ''}
              onChange={onRelationshipChange}
              required={true}
            />
          </div>
        )}
      </div>
      
      <div className="space-y-6">
        {/* Use type assertion to handle UnifiedAttendeeData - BasicInfo internally handles both Mason and Guest */}
        {/* Only show BasicInfo for non-partners or on mobile view */}
        {(!isPartner || isMobile) && (
          <BasicInfo 
            data={attendee}
            type="Guest"
            isPrimary={isPrimary}
            onChange={updateField}
          />
        )}
        
        {/* Contact Info */}
        <ContactInfo 
          data={attendee}
          isPrimary={isPrimary}
          onChange={updateField}
        />
        
        {/* Additional Info */}
        <AdditionalInfo 
          data={attendee}
          onChange={updateField}
        />
      </div>
    </div>
  );
};

// Simple loading state component
const LoadingState: React.FC = () => (
  <div className="animate-pulse">
    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
  </div>
);

export default GuestForm;