import React, { useCallback } from 'react';
import { TextareaField } from '../shared/FieldComponents';
import { AttendeeData, SectionProps } from '../attendee/types';

export const AdditionalInfo: React.FC<SectionProps> = ({ 
  data, 
  onChange 
}) => {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Additional Information</h3>

      <div className="form-grid">
        <TextareaField
          label="Dietary Requirements"
          name="dietaryRequirements"
          value={data.dietaryRequirements || ''}
          onChange={(value) => onChange('dietaryRequirements', value)}
          placeholder="Please list any dietary requirements or food allergies"
          rows={3}
          maxLength={200}
          className="field-full"
        />

        <TextareaField
          label="Special Needs or Accessibility Requirements"
          name="specialNeeds"
          value={data.specialNeeds || ''}
          onChange={(value) => onChange('specialNeeds', value)}
          placeholder="Please list any special needs or accessibility requirements"
          rows={3}
          maxLength={500}
          className="field-full"
        />
      </div>

      <div className="text-sm text-gray-600">
        <p>This information will be shared with the venue to ensure we can accommodate your needs.</p>
      </div>
    </div>
  );
};

// Wrapper for MasonAdditionalInfo  
export const MasonAdditionalInfo: React.FC<{
  mason: AttendeeData;
  updateAttendee: (updates: Partial<AttendeeData>) => void;
}> = ({ mason, updateAttendee }) => {
  const handleChange = useCallback((field: string, value: any) => {
    updateAttendee({ [field]: value });
  }, [updateAttendee]);

  return (
    <AdditionalInfo
      data={mason}
      onChange={handleChange}
    />
  );
};

// Wrapper for GuestAdditionalInfo
export const GuestAdditionalInfo: React.FC<{
  guest: AttendeeData;
  updateAttendee: (updates: Partial<AttendeeData>) => void;
}> = ({ guest, updateAttendee }) => {
  const handleChange = useCallback((field: string, value: any) => {
    updateAttendee({ [field]: value });
  }, [updateAttendee]);

  return (
    <AdditionalInfo
      data={guest}
      onChange={handleChange}
    />
  );
};