import React, { useCallback, useEffect, useState } from 'react';
import { BasicInfo } from '@/components/register/Forms/basic-details/BasicInfo';
import { ContactInfo } from '@/components/register/Forms/basic-details/ContactInfo';
import { AdditionalInfo } from '@/components/register/Forms/basic-details/AdditionalInfo';
import { useAttendeeDataWithDebounce } from '@/components/register/Forms/attendee/lib/useAttendeeData';
import { FormProps } from '@/components/register/Forms/attendee/types';
import { X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRegistrationStore } from '@/lib/registrationStore';
import { PartnerRelationshipSelect } from '../../shared/PartnerRelationshipSelect';
import { TextField, SelectField, TextareaField, EmailField, PhoneField } from '../../shared/FieldComponents';
import { GUEST_TITLES, CONTACT_PREFERENCES } from '../../attendee/utils/constants';
import { ContactConfirmationMessage } from '../../basic-details/ContactConfirmationMessage';

interface GuestFormProps extends FormProps {
  onRemove?: () => void;
  onRelationshipChange?: (relationship: string) => void;
  isEditMode?: boolean; // Add flag to indicate if we're in edit modal
  fieldErrors?: Record<string, Record<string, string>>;
}

export const GuestForm: React.FC<GuestFormProps> = ({ attendeeId, attendeeNumber, isPrimary, onRemove, onRelationshipChange, isEditMode = false, fieldErrors = {} }) => {
  const { attendee, updateField, updateFieldImmediate } = useAttendeeDataWithDebounce(attendeeId);
  
  // State for collapsible sections on mobile
  const [showDietary, setShowDietary] = useState(false);
  const [showAccessibility, setShowAccessibility] = useState(false);
  
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
  
  // Get primary attendee for contact confirmation message
  const { attendees } = useRegistrationStore();
  const primaryAttendee = attendees.find(a => a.isPrimary);
  const primaryName = primaryAttendee 
    ? `${primaryAttendee.firstName} ${primaryAttendee.lastName}`
    : 'the primary attendee';
  
  if (!attendee) return <div className="p-4 text-center">Loading...</div>;
  
  // Determine if this is a partner
  const isPartner = Boolean(attendee.isPartner);
  
  // Title options for guests
  const titleOptions = GUEST_TITLES.map(title => ({ value: title, label: title }));
  
  return (
    <div className="p-4 space-y-4 relative" data-attendee-id={attendeeId}>
      
      {/* Desktop Layout (md and above) */}
      <div className="hidden md:block space-y-4">
        {/* Partner relationship field with name fields in same row */}
        {isPartner && onRelationshipChange && (
          <div className="grid grid-cols-12 gap-4">
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
        
        {/* Non-partner fields */}
        {!isPartner && (
          <div className="grid grid-cols-12 gap-4">
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
            <div className="col-span-5">
              <TextField
                label="First Name"
                name="firstName"
                value={attendee.firstName || ''}
                onChange={(value) => updateFieldImmediate('firstName', value)}
                required={true}
                error={attendeeFieldErrors.firstName}
              />
            </div>
            <div className="col-span-5">
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
        
        {/* Contact Information */}
        {isPrimary ? (
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-6">
              <EmailField
                label="Email Address"
                name="primaryEmail"
                value={attendee.primaryEmail || ''}
                onChange={(value) => updateFieldImmediate('primaryEmail', value)}
                required={true}
                error={attendeeFieldErrors.primaryEmail}
              />
            </div>
            <div className="col-span-6">
              <PhoneField
                label="Mobile Number"
                name="primaryPhone"
                value={attendee.primaryPhone || ''}
                onChange={(value) => updateFieldImmediate('primaryPhone', value)}
                required={true}
                error={attendeeFieldErrors.primaryPhone}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-4">
                <SelectField
                  label="Contact"
                  name="contactPreference"
                  value={attendee.contactPreference || ''}
                  onChange={(value) => updateFieldImmediate('contactPreference', value)}
                  options={CONTACT_PREFERENCES}
                  required={true}
                  error={attendeeFieldErrors.contactPreference}
                />
              </div>
              
              {/* Confirmation message in same row */}
              {attendee.contactPreference && attendee.contactPreference !== 'directly' && (
                <div className="col-span-8">
                  <ContactConfirmationMessage
                    contactPreference={attendee.contactPreference}
                    primaryAttendeeName={primaryName}
                  />
                </div>
              )}
            </div>
            
            {/* Contact fields when preference is "Directly" */}
            {attendee.contactPreference === 'directly' && (
              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-6">
                  <EmailField
                    label="Email Address"
                    name="primaryEmail"
                    value={attendee.primaryEmail || ''}
                    onChange={(value) => updateFieldImmediate('primaryEmail', value)}
                    required={true}
                    error={attendeeFieldErrors.primaryEmail}
                  />
                </div>
                <div className="col-span-6">
                  <PhoneField
                    label="Mobile Number"
                    name="primaryPhone"
                    value={attendee.primaryPhone || ''}
                    onChange={(value) => updateFieldImmediate('primaryPhone', value)}
                    required={true}
                    error={attendeeFieldErrors.primaryPhone}
                  />
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Dietary Requirements */}
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12">
            <TextareaField
              label="Dietary Requirements"
              name="dietaryRequirements"
              value={attendee.dietaryRequirements || ''}
              onChange={(value) => updateFieldImmediate('dietaryRequirements', value)}
              placeholder="E.g., vegetarian, gluten-free, allergies"
              rows={1}
              maxLength={200}
              inputClassName="min-h-[40px] py-1.5"
            />
          </div>
        </div>
        
        {/* Special Needs */}
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12">
            <TextareaField
              label="Special Needs or Accessibility Requirements"
              name="specialNeeds"
              value={attendee.specialNeeds || ''}
              onChange={(value) => updateFieldImmediate('specialNeeds', value)}
              placeholder="Please list any special needs or accessibility requirements"
              rows={1}
              maxLength={500}
              inputClassName="min-h-[40px] py-1.5"
            />
          </div>
        </div>
      </div>
      
      {/* Mobile Layout (smaller than md) */}
      <div className="md:hidden space-y-4">
        {/* Stack all fields vertically */}
        {isPartner && onRelationshipChange && (
          <PartnerRelationshipSelect
            value={attendee.relationship || ''}
            onChange={onRelationshipChange}
            required={true}
          />
        )}
        
        <SelectField
          label="Title"
          name="title"
          value={attendee.title || ''}
          onChange={(value) => updateFieldImmediate('title', value)}
          options={titleOptions}
          required={true}
          error={attendeeFieldErrors.title}
        />
        
        <TextField
          label="First Name"
          name="firstName"
          value={attendee.firstName || ''}
          onChange={(value) => updateFieldImmediate('firstName', value)}
          required={true}
          error={attendeeFieldErrors.firstName}
        />
        
        <TextField
          label="Last Name"
          name="lastName"
          value={attendee.lastName || ''}
          onChange={(value) => updateFieldImmediate('lastName', value)}
          required={true}
          error={attendeeFieldErrors.lastName}
        />
        
        {/* Contact fields */}
        {isPrimary ? (
          <>
            <EmailField
              label="Email Address"
              name="primaryEmail"
              value={attendee.primaryEmail || ''}
              onChange={(value) => updateFieldImmediate('primaryEmail', value)}
              required={true}
              error={attendeeFieldErrors.primaryEmail}
            />
            <PhoneField
              label="Mobile Number"
              name="primaryPhone"
              value={attendee.primaryPhone || ''}
              onChange={(value) => updateFieldImmediate('primaryPhone', value)}
              required={true}
              error={attendeeFieldErrors.primaryPhone}
            />
          </>
        ) : (
          <>
            <SelectField
              label="Contact"
              name="contactPreference"
              value={attendee.contactPreference || ''}
              onChange={(value) => updateFieldImmediate('contactPreference', value)}
              options={CONTACT_PREFERENCES}
              required={true}
              error={attendeeFieldErrors.contactPreference}
            />
            
            {/* Confirmation message directly below */}
            {attendee.contactPreference && attendee.contactPreference !== 'directly' && (
              <ContactConfirmationMessage
                contactPreference={attendee.contactPreference}
                primaryAttendeeName={primaryName}
              />
            )}
            
            {/* Contact fields when "Directly" is selected */}
            {attendee.contactPreference === 'directly' && (
              <>
                <EmailField
                  label="Email Address"
                  name="primaryEmail"
                  value={attendee.primaryEmail || ''}
                  onChange={(value) => updateFieldImmediate('primaryEmail', value)}
                  required={true}
                  error={attendeeFieldErrors.primaryEmail}
                />
                <PhoneField
                  label="Mobile Number"
                  name="primaryPhone"
                  value={attendee.primaryPhone || ''}
                  onChange={(value) => updateFieldImmediate('primaryPhone', value)}
                  required={true}
                  error={attendeeFieldErrors.primaryPhone}
                />
              </>
            )}
          </>
        )}
        
        {/* Collapsible Dietary Requirements */}
        {showDietary ? (
          <div className="border p-3 rounded-md bg-white relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 h-6 w-6 rounded-full"
              onClick={() => setShowDietary(false)}
              type="button"
            >
              <X className="h-4 w-4" />
            </Button>
            <TextareaField
              label="Dietary Requirements"
              name="dietaryRequirements"
              value={attendee.dietaryRequirements || ''}
              onChange={(value) => updateFieldImmediate('dietaryRequirements', value)}
              placeholder="E.g., vegetarian, gluten-free, allergies"
              rows={1}
              maxLength={200}
              inputClassName="min-h-[40px] py-1.5 pr-10"
            />
          </div>
        ) : (
          <Button
            variant="outline"
            className="w-full flex justify-between items-center"
            onClick={() => setShowDietary(true)}
            type="button"
          >
            <span>Dietary Requirements</span>
            <Plus className="h-4 w-4" />
          </Button>
        )}
        
        {/* Collapsible Accessibility Requirements */}
        {showAccessibility ? (
          <div className="border p-3 rounded-md bg-white relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 h-6 w-6 rounded-full"
              onClick={() => setShowAccessibility(false)}
              type="button"
            >
              <X className="h-4 w-4" />
            </Button>
            <TextareaField
              label="Special Needs or Accessibility Requirements"
              name="specialNeeds"
              value={attendee.specialNeeds || ''}
              onChange={(value) => updateFieldImmediate('specialNeeds', value)}
              placeholder="Please list any special needs or accessibility requirements"
              rows={1}
              maxLength={500}
              inputClassName="min-h-[40px] py-1.5 pr-10"
            />
          </div>
        ) : (
          <Button
            variant="outline"
            className="w-full flex justify-between items-center"
            onClick={() => setShowAccessibility(true)}
            type="button"
          >
            <span>Accessibility Requirements</span>
            <Plus className="h-4 w-4" />
          </Button>
        )}
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