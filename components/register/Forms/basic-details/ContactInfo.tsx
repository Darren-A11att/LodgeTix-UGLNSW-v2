import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { EmailField, PhoneField, SelectField } from '../shared/FieldComponents';
import { AttendeeData, SectionProps } from '../attendee/types';
import { CONTACT_PREFERENCES } from '../attendee/utils/constants';
import { shouldShowContactFields, shouldShowConfirmationMessage } from '../attendee/utils/businessLogic';
import { useRegistrationStore } from '@/lib/registrationStore';
import { ContactConfirmationMessage } from './ContactConfirmationMessage';

export interface ContactInfoProps extends SectionProps {
  onChangeImmediate?: (field: string, value: any) => void;
}

export const ContactInfo: React.FC<ContactInfoProps> = React.memo(({ 
  data, 
  isPrimary, 
  onChange,
  onChangeImmediate
}) => {
  const { attendees } = useRegistrationStore();
  
  // Use the exact value from the store, with NO defaults
  // This ensures what the user sees matches the store exactly
  const contactPreference = data.contactPreference || '';
  
  // NO initialization effect - we don't want to set any defaults
  // Users must explicitly select all values
  
  // Get primary attendee for confirmation message
  const primaryAttendee = useMemo(() => 
    attendees.find(a => a.isPrimary),
    [attendees]
  );

  // Determine if contact fields should be shown based on current preference value
  // Only show contact fields for primary attendees or if "Directly" is explicitly selected
  // Hide them for any other contact preference or if none is selected yet
  const showContactFields = isPrimary || contactPreference === 'Directly';
  
  // Show confirmation message when a non-direct preference is selected
  const showConfirmation = !isPrimary && 
    (contactPreference === 'PrimaryAttendee' || contactPreference === 'ProvideLater');

  // Simplified handler with no defaults or special handling - just direct updates
  const handleContactPreferenceChange = useCallback((value: string) => {
    console.log('Contact preference changing to:', value);
    
    // Update via props - use immediate update if available for contact preference
    if (onChangeImmediate) {
      onChangeImmediate('contactPreference', value);
    } else {
      onChange('contactPreference', value);
    }
    
    // Immediately clear contact fields if switching away from "Directly" option
    // This makes sense since those fields won't be used
    if (value !== 'Directly') {
      // Use immediate update to ensure fields are cleared right away
      if (onChangeImmediate) {
        onChangeImmediate('primaryEmail', '');
        onChangeImmediate('primaryPhone', '');
      } else {
        onChange('primaryEmail', '');
        onChange('primaryPhone', '');
      }
    }
    
    // That's it - simple, direct update with no additional complexity
  }, [onChange, onChangeImmediate]);

  // Get primary attendee name for confirmation message
  const primaryName = primaryAttendee 
    ? `${primaryAttendee.firstName} ${primaryAttendee.lastName}`
    : 'the primary attendee';

  return (
    <div className="space-y-4" data-attendee-id={data.attendeeId} data-is-partner={data.isPartner ? "true" : "false"}>
      {/* Contact preference - only show for non-primary attendees */}
      {!isPrimary && (
        <div className="grid grid-cols-12 gap-4">
          {/* All fields on the same row for non-primary attendees */}
          <div className="col-span-4">
            <SelectField
              label="Contact"
              name="contactPreference"
              value={contactPreference} // Use the computed value directly - simpler approach
              onChange={handleContactPreferenceChange}
              options={CONTACT_PREFERENCES}
              required={true}
              className="select-no-left-padding"
            />
          </div>
            
          {/* Contact fields for non-primary attendees are now shown below in a separate conditional */}
        </div>
      )}

      {/* Contact fields - shown for primary attendees */}
      {isPrimary && (
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-6">
            <EmailField
              label="Email Address"
              name="primaryEmail"
              value={data.primaryEmail || ''}
              onChange={(value) => onChange('primaryEmail', value)}
              required={true}
            />
          </div>
          <div className="col-span-6">
            <PhoneField
              label="Phone Number"
              name="primaryPhone"
              value={data.primaryPhone || ''}
              onChange={(value) => onChange('primaryPhone', value)}
              required={true}
            />
          </div>
        </div>
      )}
      
      {/* Show contact fields for non-primary attendees who selected "Directly" */}
      {!isPrimary && contactPreference === 'Directly' && (
        <div className="grid grid-cols-12 gap-4 mt-4">
          <div className="col-span-6">
            <EmailField
              label="Email Address"
              name="primaryEmail"
              value={data.primaryEmail || ''}
              onChange={(value) => onChange('primaryEmail', value)}
              required={true}
            />
          </div>
          <div className="col-span-6">
            <PhoneField
              label="Phone Number"
              name="primaryPhone"
              value={data.primaryPhone || ''}
              onChange={(value) => onChange('primaryPhone', value)}
              required={true}
            />
          </div>
        </div>
      )}

      {/* Confirmation message - show when contact is via primary or later */}
      {showConfirmation && (
        <div className="mt-2" data-partner-id={data.attendeeId}>
          <ContactConfirmationMessage
            contactPreference={contactPreference}
            primaryAttendeeName={primaryName}
          />
        </div>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison to prevent unnecessary re-renders
  return (
    prevProps.data.attendeeId === nextProps.data.attendeeId &&
    prevProps.data.contactPreference === nextProps.data.contactPreference &&
    prevProps.data.primaryEmail === nextProps.data.primaryEmail &&
    prevProps.data.primaryPhone === nextProps.data.primaryPhone &&
    prevProps.isPrimary === nextProps.isPrimary &&
    prevProps.onChange === nextProps.onChange &&
    prevProps.onChangeImmediate === nextProps.onChangeImmediate
  );
});

ContactInfo.displayName = 'ContactInfo';

// Wrapper for MasonContactInfo
export const MasonContactInfo: React.FC<{
  mason: AttendeeData;
  attendeeNumber: number;
  isPrimary: boolean;
  updateAttendee: (updates: Partial<AttendeeData>) => void;
  updateAttendeeImmediate?: (updates: Partial<AttendeeData>) => void;
  errors?: Record<string, string>;
}> = ({ mason, attendeeNumber, isPrimary, updateAttendee, updateAttendeeImmediate, errors }) => {
  const handleChange = useCallback((field: string, value: any) => {
    updateAttendee({ [field]: value });
  }, [updateAttendee]);

  const handleChangeImmediate = useCallback((field: string, value: any) => {
    if (updateAttendeeImmediate) {
      updateAttendeeImmediate({ [field]: value });
    } else {
      updateAttendee({ [field]: value });
    }
  }, [updateAttendee, updateAttendeeImmediate]);

  return (
    <ContactInfo
      data={mason}
      isPrimary={isPrimary}
      onChange={handleChange}
      onChangeImmediate={handleChangeImmediate}
    />
  );
};

// Wrapper for GuestContactInfo
export const GuestContactInfo: React.FC<{
  guest: AttendeeData;
  attendeeNumber: number;
  isPrimary: boolean;
  updateAttendee: (updates: Partial<AttendeeData>) => void;
  updateAttendeeImmediate?: (updates: Partial<AttendeeData>) => void;
  errors?: Record<string, string>;
}> = ({ guest, attendeeNumber, isPrimary, updateAttendee, updateAttendeeImmediate, errors }) => {
  const handleChange = useCallback((field: string, value: any) => {
    updateAttendee({ [field]: value });
  }, [updateAttendee]);
  
  const handleChangeImmediate = useCallback((field: string, value: any) => {
    if (updateAttendeeImmediate) {
      updateAttendeeImmediate({ [field]: value });
    } else {
      updateAttendee({ [field]: value });
    }
  }, [updateAttendee, updateAttendeeImmediate]);

  return (
    <ContactInfo
      data={guest}
      isPrimary={isPrimary}
      onChange={handleChange}
      onChangeImmediate={handleChangeImmediate}
    />
  );
};