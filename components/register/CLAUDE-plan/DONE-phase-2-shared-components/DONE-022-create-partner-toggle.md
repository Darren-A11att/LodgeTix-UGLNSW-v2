# Task 022: Create PartnerToggle Component

## Objective
Create a new shared PartnerToggle component that replaces the various partner toggle implementations across different forms.

## Dependencies
- Task 021 (shared components setup)
- Task 005 (usePartnerManager hook)

## Reference Files
- `components/register/forms/guest/PartnerToggle.tsx`
- `components/register/forms/mason/LadyPartnerToggle.tsx` (to be replaced)

## Steps

1. Create `components/register/forms/shared/PartnerToggle.tsx`:
```typescript
import React from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { PlusCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PartnerToggleProps {
  hasPartner: boolean;
  onToggle: () => void;
  partnerLabel?: string;
  addText?: string;
  removeText?: string;
  useSwitch?: boolean;
  disabled?: boolean;
  className?: string;
}

export const PartnerToggle: React.FC<PartnerToggleProps> = ({
  hasPartner,
  onToggle,
  partnerLabel = "Partner",
  addText = "Add Partner",
  removeText = "Remove Partner",
  useSwitch = false,
  disabled = false,
  className,
}) => {
  if (useSwitch) {
    return (
      <div className={cn("flex items-center space-x-2", className)}>
        <Switch
          id="partner-toggle"
          checked={hasPartner}
          onCheckedChange={onToggle}
          disabled={disabled}
        />
        <Label 
          htmlFor="partner-toggle"
          className={cn(
            "cursor-pointer",
            disabled && "cursor-not-allowed opacity-50"
          )}
        >
          Include {partnerLabel}
        </Label>
      </div>
    );
  }

  return (
    <Button
      type="button"
      variant={hasPartner ? "destructive" : "outline"}
      size="sm"
      onClick={onToggle}
      disabled={disabled}
      className={cn("transition-all", className)}
    >
      {hasPartner ? (
        <>
          <XCircle className="w-4 h-4 mr-2" />
          {removeText}
        </>
      ) : (
        <>
          <PlusCircle className="w-4 h-4 mr-2" />
          {addText}
        </>
      )}
    </Button>
  );
};
```

2. Create a companion component for partner relationship selection:
```typescript
// components/register/forms/shared/PartnerRelationshipSelect.tsx
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { PARTNER_RELATIONSHIPS } from '../attendee/utils/constants';

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
  attendeeName = "this attendee",
  label = "Relationship to",
  required = false,
  disabled = false,
  className,
}) => {
  return (
    <div className={className}>
      <Label htmlFor="partner-relationship">
        {label} {attendeeName}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <Select
        value={value}
        onValueChange={onChange}
        disabled={disabled}
      >
        <SelectTrigger id="partner-relationship">
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
```

3. Create a usage example for documentation:
```typescript
// Example usage with usePartnerManager
export const PartnerToggleExample: React.FC<{ attendeeId: string }> = ({ attendeeId }) => {
  const { hasPartner, togglePartner, partner, updatePartnerRelationship } = usePartnerManager(attendeeId);
  
  return (
    <div className="space-y-4">
      <PartnerToggle
        hasPartner={hasPartner}
        onToggle={togglePartner}
        partnerLabel="spouse"
        addText="Add Spouse"
        removeText="Remove Spouse"
      />
      
      {hasPartner && partner && (
        <PartnerRelationshipSelect
          value={partner.relationship}
          onChange={(relationship) => updatePartnerRelationship(relationship)}
          attendeeName={`${partner.firstName} ${partner.lastName}`}
        />
      )}
    </div>
  );
};
```

## Deliverables
- Unified PartnerToggle component
- PartnerRelationshipSelect component
- Usage examples
- Proper TypeScript typing

## Success Criteria
- Component replaces all existing partner toggles
- Supports both button and switch styles
- Integrates with usePartnerManager hook
- Accessible and properly labeled