import React, { useCallback } from 'react';
import { SelectField, TextField } from '../../shared/FieldComponents';
import { TextField as TextInput } from '../../shared/FieldComponents';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { AttendeeData } from '../../attendee/types';
import { GRAND_OFFICER_ROLES } from '../../attendee/utils/constants';
import { shouldShowOtherGrandOfficerInput } from '../../attendee/utils/businessLogic';
import { cn } from '@/lib/utils';
import { GrandOfficerDropdown } from '../../shared/GrandOfficerDropdown';

interface GrandOfficerFieldsProps {
  data: AttendeeData;
  onChange: (field: string, value: any) => void;
  errors?: Record<string, string>;
  required?: boolean;
  className?: string;
  isMasonicOrder?: boolean;
}

export const GrandOfficerFields: React.FC<GrandOfficerFieldsProps> = ({
  data,
  onChange,
  errors = {},
  required = false,
  className,
  isMasonicOrder = false,
}) => {
  // Only show if rank is GL or MO
  if (data.rank !== 'GL' && data.rank !== 'MO') {
    return null;
  }

  // Convert roles to select options
  const roleOptions = GRAND_OFFICER_ROLES.map(role => ({
    value: role,
    label: role
  }));

  // Grand Officer status options
  const statusOptions = [
    { value: 'Present', label: 'Present' },
    { value: 'Past', label: 'Past' }
  ];

  // Handle status change
  const handleStatusChange = useCallback((status: string) => {
    console.log('Grand Officer status selection:', status);
    onChange('grandOfficerStatus', status);
    
    // Clear role fields if changing from Present to Past
    if (status === 'Past' && data.grandOfficerStatus === 'Present') {
      onChange('presentGrandOfficerRole', '');
      onChange('otherGrandOfficerRole', '');
    }
  }, [onChange, data.grandOfficerStatus]);

  // Handle role change
  const handleRoleChange = useCallback((role: string) => {
    // Explicitly log selection to check if this function is being called
    console.log('Grand Office selection:', role);
    
    // Use immediate update for dropdown selections
    onChange('presentGrandOfficerRole', role);
    
    // Clear other field if not selecting "Other"
    if (role !== 'Other') {
      onChange('otherGrandOfficerRole', '');
    }
  }, [onChange]);

  return (
    <div className={cn("grid grid-cols-12 gap-4", className)}>
      {/* Grand Rank - 2 columns (matching Masonic Title) */}
      <div className="col-span-2">
        <TextField
          label="Grand Rank"
          name="suffix"
          value={data.suffix || ''}
          onChange={(value) => onChange('suffix', value)}
          placeholder="PGRNK"
          required={required}
        />
      </div>
      
      {/* Grand Officer Status - 2 columns (matching Masonic Title) */}
      <div className="col-span-2">
        <SelectField
          label="Grand Officer"
          name="grandOfficerStatus"
          value={data.grandOfficerStatus || ''}
          onChange={handleStatusChange}
          options={statusOptions}
          required={required}
        />
      </div>
      
      {/* Present Officer Role - 4 columns (expanded) */}
      {data.grandOfficerStatus === 'Present' && (
        <div className="col-span-4">
          {isMasonicOrder ? (
            <TextField
              label="Grand Office"
              name="presentGrandOfficerRole"
              value={data.presentGrandOfficerRole || ''}
              onChange={(value) => onChange('presentGrandOfficerRole', value)}
              placeholder="Enter grand office"
              required={required}
              updateOnBlur={true}
            />
          ) : (
            <GrandOfficerDropdown
              label="Grand Office"
              name="presentGrandOfficerRole"
              value={data.presentGrandOfficerRole || ''}
              onChange={(value) => handleRoleChange(value)}
              options={roleOptions}
              required={required}
              className="relative z-10"
            />
          )}
        </div>
      )}
      
      {/* Other Role Input - 4 columns (expanded) */}
      {data.presentGrandOfficerRole === 'Other' && (
        <div className="col-span-4">
          <TextField
            label="Other Grand Office"
            name="otherGrandOfficerRole"
            value={data.otherGrandOfficerRole || ''}
            onChange={(value) => onChange('otherGrandOfficerRole', value)}
            placeholder="Enter specific role"
            required={required}
          />
        </div>
      )}
    </div>
  );
};

// Display component for summary views
export const GrandOfficerSummary: React.FC<{ data: AttendeeData }> = ({ data }) => {
  if ((data.rank !== 'GL' && data.rank !== 'MO') || !data.grandOfficerStatus) {
    return null;
  }

  const getDisplayRole = () => {
    if (data.grandOfficerStatus === 'Past') {
      return 'Past Grand Officer';
    }
    
    if (data.presentGrandOfficerRole === 'Other' && data.otherGrandOfficerRole) {
      return data.otherGrandOfficerRole;
    }
    
    return data.presentGrandOfficerRole || 'Grand Officer';
  };

  return (
    <div className="text-sm text-gray-600">
      <span className="font-medium">Grand Officer:</span> {getDisplayRole()}
      {data.grandOfficerDetails && (
        <div className="mt-1 text-xs">{data.grandOfficerDetails}</div>
      )}
    </div>
  );
};

// Wrapper for MasonGrandLodgeFields
export const MasonGrandLodgeFields: React.FC<{
  mason: AttendeeData;
  updateAttendee: (updates: Partial<AttendeeData>) => void;
  errors?: Record<string, string>;
}> = ({ mason, updateAttendee, errors }) => {
  const handleChange = useCallback((field: string, value: any) => {
    updateAttendee({ [field]: value });
  }, [updateAttendee]);

  return (
    <GrandOfficerFields
      data={mason}
      onChange={handleChange}
      errors={errors}
      required={mason.isPrimary}
    />
  );
};