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
  isEditMode?: boolean; // Add flag to indicate if we're in edit modal
  fieldErrors?: Record<string, Record<string, string>>;
}

export const GuestForm: React.FC<GuestFormProps> = ({ attendeeId, attendeeNumber, isPrimary, onRemove, onRelationshipChange, isEditMode = false, fieldErrors = {} }) => {
  const { attendee, updateField, updateFieldImmediate } = useAttendeeDataWithDebounce(attendeeId);
  const [isMobile, setIsMobile] = useState(false);
  
  // Determine the label used for this attendee in validation errors
  const attendeeLabel = React.useMemo(() => {
    if (!attendee) return '';
    
    // Check if this is a partner
    if (attendee.isPartner) {
      // Find the parent attendee to determine partner type
      const allAttendees = useRegistrationStore.getState().attendees;
      const parentAttendee = allAttendees.find(a => a.attendeeId === attendee.isPartner);
      
      if (parentAttendee) {
        const masons = allAttendees.filter(a => a.attendeeType === 'mason' && !a.isPartner);
        const guests = allAttendees.filter(a => a.attendeeType === 'guest' && !a.isPartner);
        
        if (parentAttendee.attendeeType === 'mason') {
          const masonIndex = masons.findIndex(a => a.attendeeId === parentAttendee.attendeeId);
          return `Mason ${masonIndex + 1}'s Lady/Partner`;
        } else {
          const guestIndex = guests.findIndex(a => a.attendeeId === parentAttendee.attendeeId);
          return `Guest ${guestIndex + 1}'s Partner`;
        }
      }
    }
    
    // Not a partner, regular guest
    const guests = useRegistrationStore.getState().attendees.filter(a => a.attendeeType === 'guest' && !a.isPartner);
    const index = guests.findIndex(a => a.attendeeId === attendeeId);
    return `Guest ${index + 1}`;
  }, [attendeeId, attendee]);
  
  // Get field errors for this specific attendee
  const attendeeFieldErrors = fieldErrors[attendeeLabel] || {};
  
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
    <div className="pt-0 px-3 pb-3 sm:p-4 space-y-3 sm:space-y-4 relative">
      
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
                onChange={(value) => updateFieldImmediate('title', value)}
                options={titleOptions}
                required={true}
                error={attendeeFieldErrors.title}
              />
            </div>
            <div className="col-span-4">
              <TextField
                label="First Name"
                name="firstName"
                value={attendee.firstName || ''}
                onChange={(value) => updateFieldImmediate('firstName', value)}
                required={true}
                error={attendeeFieldErrors.firstName}
              />
            </div>
            <div className="col-span-4">
              <TextField
                label="Last Name"
                name="lastName"
                value={attendee.lastName || ''}
                onChange={(value) => updateFieldImmediate('lastName', value)}
                required={true}
                error={attendeeFieldErrors.lastName}
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
      
      <div className="space-y-4">
        {/* Use type assertion to handle UnifiedAttendeeData - BasicInfo internally handles both Mason and Guest */}
        {/* Show BasicInfo for non-partners, on mobile view, or in edit mode (partners need to edit their details) */}
        {(!isPartner || isMobile || isEditMode) && (
          <BasicInfo 
            data={attendee}
            type="Guest"
            isPrimary={isPrimary}
            onChange={updateFieldImmediate}
            fieldErrors={attendeeFieldErrors}
          />
        )}
        
        {/* Contact Info */}
        <ContactInfo 
          data={attendee}
          isPrimary={isPrimary}
          onChange={updateFieldImmediate}
          onChangeImmediate={updateFieldImmediate}
          fieldErrors={attendeeFieldErrors}
        />
        
        {/* Additional Info */}
        <AdditionalInfo 
          data={attendee}
          onChange={updateFieldImmediate}
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