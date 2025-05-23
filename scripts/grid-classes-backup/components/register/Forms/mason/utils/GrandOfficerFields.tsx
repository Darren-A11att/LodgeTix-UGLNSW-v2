import React, { useCallback } from 'react';
import { SelectField, TextareaField } from '../../shared/FieldComponents';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { AttendeeData } from '../../attendee/types';
import { GRAND_OFFICER_ROLES } from '../../attendee/utils/constants';
import { shouldShowOtherGrandOfficerInput } from '../../attendee/utils/businessLogic';
import { cn } from '@/lib/utils';

interface GrandOfficerFieldsProps {
  data: AttendeeData;
  onChange: (field: string, value: any) => void;
  errors?: Record<string, string>;
  required?: boolean;
  className?: string;
}

export const GrandOfficerFields: React.FC<GrandOfficerFieldsProps> = ({
  data,
  onChange,
  errors = {},
  required = false,
  className,
}) => {
  // Only show if rank is GL
  if (data.rank !== 'GL') {
    return null;
  }

  const showOtherInput = shouldShowOtherGrandOfficerInput(data);
  
  // Convert roles to select options
  const roleOptions = GRAND_OFFICER_ROLES.map(role => ({
    value: role,
    label: role
  }));

  // Handle status change
  const handleStatusChange = useCallback((status: string) => {
    onChange('grandOfficerStatus', status);
    
    // Clear role fields if changing from Present to Past
    if (status === 'Past' && data.grandOfficerStatus === 'Present') {
      onChange('presentGrandOfficerRole', '');
      onChange('otherGrandOfficerRole', '');
    }
  }, [onChange, data.grandOfficerStatus]);

  // Handle role change
  const handleRoleChange = useCallback((role: string) => {
    onChange('presentGrandOfficerRole', role);
    
    // Clear other field if not selecting "Other"
    if (role !== 'Other') {
      onChange('otherGrandOfficerRole', '');
    }
  }, [onChange]);

  return (
    <div className={cn("space-y-6", className)}>
      <h3 className="text-lg font-semibold">Grand Officer Details</h3>

      {/* Grand Officer Status */}
      <div className="space-y-2">
        <Label>
          Grand Officer Status
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        <RadioGroup
          value={data.grandOfficerStatus || ''}
          onValueChange={handleStatusChange}
        >
          <div className="flex space-x-6">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Past" id="past-officer" />
              <Label htmlFor="past-officer" className="font-normal cursor-pointer">
                Past
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Present" id="present-officer" />
              <Label htmlFor="present-officer" className="font-normal cursor-pointer">
                Present
              </Label>
            </div>
          </div>
        </RadioGroup>
        {errors.grandOfficerStatus && (
          <p className="text-sm text-red-500">{errors.grandOfficerStatus}</p>
        )}
      </div>

      {/* Present Officer Role (only shown if status is Present) */}
      {data.grandOfficerStatus === 'Present' && (
        <SelectField
          label="Grand Officer Role"
          name="presentGrandOfficerRole"
          value={data.presentGrandOfficerRole || ''}
          onChange={handleRoleChange}
          options={roleOptions}
          required={required}
        />
      )}

      {/* Other Role Input (only shown if role is Other) */}
      {showOtherInput && (
        <div className="space-y-2">
          <Label htmlFor="other-role">
            Please specify role
            {required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          <Input
            id="other-role"
            value={data.otherGrandOfficerRole || ''}
            onChange={(e) => onChange('otherGrandOfficerRole', e.target.value)}
            placeholder="Enter specific role"
            className={cn(errors.otherGrandOfficerRole && "border-red-500")}
          />
          {errors.otherGrandOfficerRole && (
            <p className="text-sm text-red-500">{errors.otherGrandOfficerRole}</p>
          )}
        </div>
      )}

      {/* Additional Details */}
      <TextareaField
        label="Additional Grand Officer Details"
        name="grandOfficerDetails"
        value={data.grandOfficerDetails || ''}
        onChange={(value) => onChange('grandOfficerDetails', value)}
        placeholder="Enter position details, years of service, or other relevant information"
        rows={3}
      />
    </div>
  );
};

// Display component for summary views
export const GrandOfficerSummary: React.FC<{ data: AttendeeData }> = ({ data }) => {
  if (data.rank !== 'GL' || !data.grandOfficerStatus) {
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