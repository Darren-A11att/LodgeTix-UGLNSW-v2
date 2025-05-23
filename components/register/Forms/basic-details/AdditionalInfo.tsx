import React, { useCallback } from 'react';
import { TextareaField } from '../shared/FieldComponents';
import { AttendeeData, SectionProps } from '../attendee/types';

export const AdditionalInfo: React.FC<SectionProps> = ({ 
  data, 
  onChange 
}) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12">
          <TextareaField
            label="Dietary Requirements"
            name="dietaryRequirements"
            value={data.dietaryRequirements || ''}
            onChange={(value) => onChange('dietaryRequirements', value)}
            placeholder="E.g., vegetarian, gluten-free, allergies"
            rows={1}
            maxLength={200}
            inputClassName="min-h-[40px] py-1.5"
          />
        </div>

        <div className="col-span-12">
          <TextareaField
            label="Special Needs or Accessibility Requirements"
            name="specialNeeds"
            value={data.specialNeeds || ''}
            onChange={(value) => onChange('specialNeeds', value)}
            placeholder="Please list any special needs or accessibility requirements"
            rows={1}
            maxLength={500}
            inputClassName="min-h-[40px] py-1.5"
          />
        </div>
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