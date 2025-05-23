import React, { useCallback } from 'react';
import { TextareaField } from '../shared/FieldComponents';
import { AttendeeData, SectionProps } from '../attendee/types';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface DietaryOption {
  value: string;
  label: string;
}

const COMMON_DIETARY_OPTIONS: DietaryOption[] = [
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'gluten-free', label: 'Gluten Free' },
  { value: 'dairy-free', label: 'Dairy Free' },
  { value: 'nut-free', label: 'Nut Free' },
  { value: 'halal', label: 'Halal' },
  { value: 'kosher', label: 'Kosher' },
];

export const AdditionalInfoEnhanced: React.FC<SectionProps> = ({ 
  data, 
  onChange 
}) => {
  // Parse existing dietary requirements to check common options
  const selectedOptions = new Set(
    data.dietaryRequirements?.split(',').map(s => s.trim()) || []
  );

  const handleOptionToggle = (option: string, checked: boolean) => {
    const current = new Set(selectedOptions);
    
    if (checked) {
      current.add(option);
    } else {
      current.delete(option);
    }
    
    // Convert back to comma-separated string
    const requirements = Array.from(current).join(', ');
    onChange('dietaryRequirements', requirements);
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Additional Information</h3>

      <div className="space-y-4">
        {/* Common dietary options */}
        <div>
          <Label>Common Dietary Requirements</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
            {COMMON_DIETARY_OPTIONS.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <Checkbox
                  id={option.value}
                  checked={selectedOptions.has(option.label)}
                  onCheckedChange={(checked) => 
                    handleOptionToggle(option.label, !!checked)
                  }
                />
                <Label
                  htmlFor={option.value}
                  className="text-sm font-normal cursor-pointer"
                >
                  {option.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Other dietary requirements */}
        <TextareaField
          label="Other Dietary Requirements"
          name="dietaryRequirements"
          value={data.dietaryRequirements || ''}
          onChange={(value) => onChange('dietaryRequirements', value)}
          placeholder="Please specify any other dietary requirements"
          rows={2}
          maxLength={200}
        />

        {/* Special needs */}
        <TextareaField
          label="Special Needs or Accessibility Requirements"
          name="specialNeeds"
          value={data.specialNeeds || ''}
          onChange={(value) => onChange('specialNeeds', value)}
          placeholder="Please list any special needs or accessibility requirements"
          rows={3}
          maxLength={500}
        />
      </div>

      <div className="text-sm text-gray-600">
        <p>This information will be shared with the venue to ensure we can accommodate your needs.</p>
      </div>
    </div>
  );
};