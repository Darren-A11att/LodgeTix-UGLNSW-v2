import React, { useCallback, useEffect, useMemo } from 'react';
import { TextField, SelectField } from '../shared/FieldComponents';
import { AttendeeData, SectionProps } from '../attendee/types';
import { MASON_TITLES, GUEST_TITLES, MASON_RANKS, isGrandTitle } from '../attendee/utils/constants';
import { handleTitleChange, handleRankChange } from '../attendee/utils/businessLogic';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-react';

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
      
      // First update the title to ensure order of operations
      onChange('title', newTitle);
      
      // Then update rank if needed (this is key for automated rank changes)
      if (updates.rank) {
        console.log(`[BasicInfo] Title change triggered rank update: ${updates.rank}`);
        onChange('rank', updates.rank);
      }
    } else {
      onChange('title', newTitle);
    }
  }, [type, data.rank, onChange]);
  
  // Handle rank change with title logic for Masons
  const handleRankChangeWithLogic = useCallback((newRank: string) => {
    if (type === 'Mason') {
      const updates = handleRankChange(newRank, data.title || '', data.rank || '');
      
      // First update the rank to ensure order of operations
      onChange('rank', newRank);
      
      // Then update title or other fields if needed
      if (updates.title && updates.title !== data.title) {
        console.log(`[BasicInfo] Rank change triggered title update: ${updates.title}`);
        onChange('title', updates.title);
      }
      
      // Clear grand officer fields if changing from GL rank
      if (data.rank === 'GL' && newRank !== 'GL') {
        onChange('grandOfficerStatus', undefined);
        onChange('presentGrandOfficerRole', undefined);
        onChange('otherGrandOfficerRole', undefined);
      }
    } else {
      onChange('rank', newRank);
    }
  }, [type, data.title, data.rank, onChange]);
  
  // Check for title/rank mismatches and show warnings
  const titleRankMismatch = useMemo(() => {
    if (type !== 'Mason') return null;
    
    if (isGrandTitle(data.title || '') && data.rank !== 'GL') {
      return {
        type: 'title-rank',
        message: `Grand title "${data.title}" should have Grand Lodge (GL) rank. Click to fix.`,
        fix: () => onChange('rank', 'GL')
      };
    }
    
    if (data.title === 'W Bro' && data.rank !== 'GL' && data.rank !== 'IM') {
      return {
        type: 'title-rank',
        message: `Title "W Bro" should have Installed Master (IM) or Grand Lodge (GL) rank. Click to fix.`,
        fix: () => onChange('rank', 'IM')
      };
    }
    
    return null;
  }, [type, data.title, data.rank, onChange]);

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

      <div className="form-grid">
        {/* Title */}
        <SelectField
          label="Title"
          name="title"
          value={data.title || ''}
          onChange={handleTitleChangeWithLogic}
          options={titleOptions}
          required={true}
          className="field-sm"
        />

        {/* First Name */}
        <TextField
          label="First Name"
          name="firstName"
          value={data.firstName || ''}
          onChange={(value) => onChange('firstName', value)}
          required={true}
          className="field-md"
        />

        {/* Last Name */}
        <TextField
          label="Last Name"
          name="lastName"
          value={data.lastName || ''}
          onChange={(value) => onChange('lastName', value)}
          required={true}
          className="field-md"
        />
      </div>

      {/* Mason-specific fields */}
      {type === 'Mason' && (
        <div className="form-grid">
          <SelectField
            label="Rank"
            name="rank"
            value={data.rank || ''}
            onChange={handleRankChangeWithLogic}
            options={rankOptions}
            required={true}
            className="field-md"
          />
          
          {/* Suffix field could go here if needed */}
          <TextField
            label="Suffix"
            name="suffix"
            value={data.suffix || ''}
            onChange={(value) => onChange('suffix', value)}
            placeholder="Jr., Sr., III, etc."
            className="field-md"
          />
          
          {/* Warning for title/rank mismatches */}
          {titleRankMismatch && (
            <div className="field-full mt-2">
              <Alert variant="warning" className="cursor-pointer" onClick={titleRankMismatch.fix}>
                <InfoIcon className="h-4 w-4" />
                <AlertDescription>
                  {titleRankMismatch.message}
                </AlertDescription>
              </Alert>
            </div>
          )}
        </div>
      )}

      {/* Guest-specific fields */}
      {type === 'Guest' && (
        <div className="form-grid">
          <TextField
            label="Suffix"
            name="suffix"
            value={data.suffix || ''}
            onChange={(value) => onChange('suffix', value)}
            placeholder="Jr., Sr., III, etc."
            className="field-md"
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