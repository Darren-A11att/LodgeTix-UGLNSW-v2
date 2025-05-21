import React, { useCallback, useMemo } from 'react';
import { EmailField, PhoneField, SelectField } from '../shared/FieldComponents';
import { AttendeeData, SectionProps } from '../attendee/types';
import { CONTACT_PREFERENCES } from '../attendee/utils/constants';
import { shouldShowContactFields, shouldShowConfirmationMessage } from '../attendee/utils/businessLogic';
import { useRegistrationStore } from '@/lib/registrationStore';
import { ContactConfirmationMessage } from './ContactConfirmationMessage';

export const ContactInfo: React.FC<SectionProps> = ({ 
  data, 
  isPrimary, 
  onChange 
}) => {
  const { attendees } = useRegistrationStore();
  
  // Get primary attendee for confirmation message
  const primaryAttendee = useMemo(() => 
    attendees.find(a => a.isPrimary),
    [attendees]
  );

  // Determine if contact fields should be shown
  const showContactFields = shouldShowContactFields(data);
  const showConfirmation = shouldShowConfirmationMessage(data);

  // Handle contact preference change
  const handleContactPreferenceChange = useCallback((value: string) => {
    onChange('contactPreference', value);
    
    // Clear contact fields if not needed
    if (value !== 'Directly') {
      onChange('primaryEmail', '');
      onChange('primaryPhone', '');
    }
  }, [onChange]);

  // Get primary attendee name for confirmation message
  const primaryName = primaryAttendee 
    ? `${primaryAttendee.firstName} ${primaryAttendee.lastName}`
    : 'the primary attendee';

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Contact Information</h3>

      {/* Contact preference - only show for non-primary attendees */}
      {!isPrimary && (
        <SelectField
          label="Contact Preference"
          name="contactPreference"
          value={data.contactPreference || 'PrimaryAttendee'}
          onChange={handleContactPreferenceChange}
          options={CONTACT_PREFERENCES}
          required={true}
        />
      )}

      {/* Contact fields - show for primary or when "Directly" is selected */}
      {showContactFields && (
        <div className="form-grid">
          <EmailField
            label="Email Address"
            name="primaryEmail"
            value={data.primaryEmail || ''}
            onChange={(value) => onChange('primaryEmail', value)}
            required={true}
            className="field-md"
          />

          <PhoneField
            label="Phone Number"
            name="primaryPhone"
            value={data.primaryPhone || ''}
            onChange={(value) => onChange('primaryPhone', value)}
            required={true}
            className="field-md"
          />
        </div>
      )}

      {/* Confirmation message - show when contact is via primary or later */}
      {showConfirmation && (
        <ContactConfirmationMessage
          contactPreference={data.contactPreference}
          primaryAttendeeName={primaryName}
        />
      )}
    </div>
  );
};

// Wrapper for MasonContactInfo
export const MasonContactInfo: React.FC<{
  mason: AttendeeData;
  attendeeNumber: number;
  isPrimary: boolean;
  updateAttendee: (updates: Partial<AttendeeData>) => void;
  errors?: Record<string, string>;
}> = ({ mason, attendeeNumber, isPrimary, updateAttendee, errors }) => {
  const handleChange = useCallback((field: string, value: any) => {
    updateAttendee({ [field]: value });
  }, [updateAttendee]);

  return (
    <ContactInfo
      data={mason}
      isPrimary={isPrimary}
      onChange={handleChange}
    />
  );
};

// Wrapper for GuestContactInfo
export const GuestContactInfo: React.FC<{
  guest: AttendeeData;
  attendeeNumber: number;
  isPrimary: boolean;
  updateAttendee: (updates: Partial<AttendeeData>) => void;
  errors?: Record<string, string>;
}> = ({ guest, attendeeNumber, isPrimary, updateAttendee, errors }) => {
  const handleChange = useCallback((field: string, value: any) => {
    updateAttendee({ [field]: value });
  }, [updateAttendee]);

  return (
    <ContactInfo
      data={guest}
      isPrimary={isPrimary}
      onChange={handleChange}
    />
  );
};