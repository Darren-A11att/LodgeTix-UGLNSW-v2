import React, { useCallback, useEffect } from 'react';
import { TextField, SelectField } from '../shared/FieldComponents';
import { AttendeeData, SectionProps } from '../attendee/types';
import { MASON_TITLES, GUEST_TITLES, MASON_RANKS } from '../attendee/utils/constants';
import { handleTitleChange } from '../attendee/utils/businessLogic';
import { cn } from '@/lib/utils';

/**
 * BasicInfo Component
 * 
 * Renders personal information fields for both Mason and Guest attendees.
 * Handles title-rank interaction logic for Masons.
 * 
 * @component
 * @example
 * ```tsx
 * <BasicInfo
 *   data={attendeeData}
 *   type="Mason"
 *   isPrimary={true}
 *   onChange={(field, value) => updateField(field, value)}
 * />
 * ```
 * 
 * @param {Object} props - Component props
 * @param {AttendeeData} props.data - Attendee data object
 * @param {'Mason' | 'Guest'} props.type - Attendee type
 * @param {boolean} [props.isPrimary] - Whether this is the primary attendee
 * @param {Function} props.onChange - Callback for field changes
 * 
 * @returns {JSX.Element} Rendered component
 */
export const BasicInfo = React.memo<SectionProps>(({ 
  data, 
  type, 
  isPrimary, 
  onChange 
}) => {
  // Get appropriate title options based on attendee type
  const titles = type === 'Mason' ? MASON_TITLES : GUEST_TITLES;
  const titleOptions = titles.map(title => ({ value: title, label: title }));

  // Handle title change with rank logic for Masons
  const handleTitleChangeWithLogic = useCallback((newTitle: string) => {
    if (type === 'Mason') {
      const updates = handleTitleChange(newTitle, data.rank || '');
      onChange('title', newTitle);
      if (updates.rank) {
        onChange('rank', updates.rank);
      }
    } else {
      onChange('title', newTitle);
    }
  }, [type, data.rank, onChange]);

  // Convert rank constants to options
  const rankOptions = MASON_RANKS.map(rank => ({ 
    value: rank.value, 
    label: rank.label 
  }));

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">
        {isPrimary ? 'Your Details' : 'Attendee Details'}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Title */}
        <SelectField
          label="Title"
          name="title"
          value={data.title || ''}
          onChange={handleTitleChangeWithLogic}
          options={titleOptions}
          required={true}
          className="md:col-span-1"
        />

        {/* First Name */}
        <TextField
          label="First Name"
          name="firstName"
          value={data.firstName || ''}
          onChange={(value) => onChange('firstName', value)}
          required={true}
          className="md:col-span-1"
        />

        {/* Last Name */}
        <TextField
          label="Last Name"
          name="lastName"
          value={data.lastName || ''}
          onChange={(value) => onChange('lastName', value)}
          required={true}
          className="md:col-span-1"
        />
      </div>

      {/* Mason-specific fields */}
      {type === 'Mason' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SelectField
            label="Rank"
            name="rank"
            value={data.rank || ''}
            onChange={(value) => onChange('rank', value)}
            options={rankOptions}
            required={true}
            className="md:col-span-1"
          />
          
          {/* Suffix field could go here if needed */}
          <TextField
            label="Suffix"
            name="suffix"
            value={data.suffix || ''}
            onChange={(value) => onChange('suffix', value)}
            placeholder="Jr., Sr., III, etc."
            className="md:col-span-1"
          />
        </div>
      )}

      {/* Guest-specific fields */}
      {type === 'Guest' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <TextField
            label="Suffix"
            name="suffix"
            value={data.suffix || ''}
            onChange={(value) => onChange('suffix', value)}
            placeholder="Jr., Sr., III, etc."
            className="md:col-span-1"
          />
        </div>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison to prevent unnecessary re-renders
  return (
    prevProps.data.title === nextProps.data.title &&
    prevProps.data.firstName === nextProps.data.firstName &&
    prevProps.data.lastName === nextProps.data.lastName &&
    prevProps.data.suffix === nextProps.data.suffix &&
    prevProps.data.rank === nextProps.data.rank &&
    prevProps.type === nextProps.type &&
    prevProps.isPrimary === nextProps.isPrimary
  );
});

// Create wrapper components for backward compatibility
export const MasonBasicInfo: React.FC<{
  mason: AttendeeData;
  attendeeNumber: number;
  updateAttendee: (updates: Partial<AttendeeData>) => void;
  errors?: Record<string, string>;
}> = ({ mason, attendeeNumber, updateAttendee, errors }) => {
  const handleChange = useCallback((field: string, value: any) => {
    updateAttendee({ [field]: value });
  }, [updateAttendee]);

  return (
    <BasicInfo
      data={mason}
      type="Mason"
      isPrimary={mason.isPrimary}
      onChange={handleChange}
    />
  );
};

export const GuestBasicInfo: React.FC<{
  guest: AttendeeData;
  attendeeNumber: number;
  updateAttendee: (updates: Partial<AttendeeData>) => void;
  errors?: Record<string, string>;
}> = ({ guest, attendeeNumber, updateAttendee, errors }) => {
  const handleChange = useCallback((field: string, value: any) => {
    updateAttendee({ [field]: value });
  }, [updateAttendee]);

  return (
    <BasicInfo
      data={guest}
      type="Guest"
      isPrimary={guest.isPrimary}
      onChange={handleChange}
    />
  );
};