# Task 041: Create BasicInfo Section

## Objective
Create the consolidated BasicInfo component that handles personal details for both Mason and Guest attendees.

## Dependencies
- Task 025 (field components)
- Task 007 (constants)
- Task 010 (business logic)

## Reference Files
- `components/register/oldforms/mason/MasonBasicInfo.tsx`
- `components/register/oldforms/guest/GuestBasicInfo.tsx`

## Steps

1. Create `components/register/forms/basic-details/BasicInfo.tsx`:
```typescript
import React, { useCallback, useEffect } from 'react';
import { TextField, SelectField } from '../shared/FieldComponents';
import { AttendeeData, SectionProps } from '../attendee/types';
import { MASON_TITLES, GUEST_TITLES, MASON_RANKS } from '../attendee/utils/constants';
import { handleTitleChange } from '../attendee/utils/businessLogic';
import { cn } from '@/lib/utils';

export const BasicInfo: React.FC<SectionProps> = ({ 
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
};
```

2. Create a wrapper component for backward compatibility:
```typescript
// Create wrapper components for migration period
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
```

## Deliverables
- Consolidated BasicInfo component
- Type-specific field rendering
- Title-rank interaction logic
- Backward compatibility wrappers

## Success Criteria
- Works for both Mason and Guest types
- Title-rank logic preserved
- All fields from old components included
- Clean separation of concerns