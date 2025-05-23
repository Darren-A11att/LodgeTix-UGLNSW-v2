import React from 'react';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { PARTNER_RELATIONSHIPS } from '@/lib/constants/relationships';

interface PartnerRelationshipSelectProps {
  value?: string;
  onChange: (value: string) => void;
  attendeeName?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export const PartnerRelationshipSelect: React.FC<PartnerRelationshipSelectProps> = ({
  value,
  onChange,
  attendeeName = "",
  label = "Relationship",
  required = false,
  disabled = false,
  className,
}) => {
  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor="partner-relationship">
        {label} {attendeeName}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <Select
        value={value}
        onValueChange={onChange}
        disabled={disabled}
      >
        <SelectTrigger id="partner-relationship" className="h-10 text-base md:text-sm">
          <SelectValue placeholder="Select relationship" />
        </SelectTrigger>
        <SelectContent>
          {PARTNER_RELATIONSHIPS.map((relationship) => (
            <SelectItem key={relationship} value={relationship}>
              {relationship}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default PartnerRelationshipSelect;