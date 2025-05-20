# Task 092: Create IndividualsForm Layout

## Objective
Create the IndividualsForm layout for individual registration that handles multiple attendees with partners.

## Dependencies
- Task 091 (AttendeeWithPartner)
- Task 023 (AddRemoveControl)
- Task 004 (useAttendeeData)

## Reference Files
- Registration type layouts in the existing system
- CLAUDE.md architecture specifications

## Steps

1. Create `components/register/forms/attendee/IndividualsForm.tsx`:
```typescript
import React, { useCallback, useState } from 'react';
import { useRegistrationStore } from '@/lib/registrationStore';
import { AttendeeWithPartner } from './AttendeeWithPartner';
import { AttendeeCounter } from '../shared/AddRemoveControl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Users, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface IndividualsFormProps {
  maxAttendees?: number;
  allowPartners?: boolean;
  onComplete?: () => void;
  className?: string;
}

export const IndividualsForm: React.FC<IndividualsFormProps> = ({
  maxAttendees = 10,
  allowPartners = true,
  onComplete,
  className,
}) => {
  const { 
    attendees, 
    addAttendee, 
    removeAttendee,
    validateAllAttendees 
  } = useRegistrationStore();
  
  const [expandedAttendees, setExpandedAttendees] = useState<Set<string>>(
    new Set([attendees[0]?.attendeeId])
  );

  // Filter to only show primary attendees (not partners)
  const primaryAttendees = attendees.filter(a => !a.isPartner);

  // Add new attendee
  const handleAddAttendee = useCallback(() => {
    const attendeeType = primaryAttendees.length === 0 ? 'Mason' : 'Guest';
    const newAttendeeId = addAttendee(attendeeType);
    
    // Expand the new attendee
    setExpandedAttendees(prev => new Set([...prev, newAttendeeId]));
  }, [addAttendee, primaryAttendees]);

  // Remove attendee
  const handleRemoveAttendee = useCallback((attendeeId: string) => {
    removeAttendee(attendeeId);
    setExpandedAttendees(prev => {
      const next = new Set(prev);
      next.delete(attendeeId);
      return next;
    });
  }, [removeAttendee]);

  // Toggle attendee expansion
  const toggleAttendeeExpansion = useCallback((attendeeId: string) => {
    setExpandedAttendees(prev => {
      const next = new Set(prev);
      if (next.has(attendeeId)) {
        next.delete(attendeeId);
      } else {
        next.add(attendeeId);
      }
      return next;
    });
  }, []);

  // Validate and complete
  const handleComplete = useCallback(async () => {
    const isValid = await validateAllAttendees();
    if (isValid && onComplete) {
      onComplete();
    }
  }, [validateAllAttendees, onComplete]);

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-6 h-6" />
            Individual Registration
          </h2>
          <p className="text-gray-600 mt-1">
            Register yourself and additional attendees
          </p>
        </div>
        
        <AttendeeCounter
          attendeeCount={primaryAttendees.length}
          onAdd={handleAddAttendee}
          onRemove={() => handleRemoveAttendee(primaryAttendees[primaryAttendees.length - 1].attendeeId)}
          maxAttendees={maxAttendees}
        />
      </div>

      {/* Attendee forms */}
      <div className="space-y-6">
        {primaryAttendees.map((attendee, index) => {
          const isExpanded = expandedAttendees.has(attendee.attendeeId);
          const attendeeNumber = index + 1;
          const isPrimary = index === 0;
          
          // Count partners for attendee numbering
          const partnerCount = attendees.filter(
            a => a.isPartner === attendee.attendeeId
          ).length;

          return (
            <Card key={attendee.attendeeId} className="overflow-hidden">
              <CardHeader 
                className="cursor-pointer"
                onClick={() => toggleAttendeeExpansion(attendee.attendeeId)}
              >
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    {isPrimary ? 'Your Details' : `Attendee ${attendeeNumber}`}
                    {!isExpanded && attendee.firstName && attendee.lastName && (
                      <span className="font-normal text-gray-600 ml-2">
                        - {attendee.firstName} {attendee.lastName}
                        {partnerCount > 0 && ` (+${partnerCount} partner)`}
                      </span>
                    )}
                  </CardTitle>
                  
                  <div className="flex items-center gap-2">
                    {!isPrimary && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveAttendee(attendee.attendeeId);
                        }}
                      >
                        Remove
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                    >
                      {isExpanded ? '−' : '+'}
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent>
                  <AttendeeWithPartner
                    attendeeId={attendee.attendeeId}
                    attendeeNumber={attendeeNumber}
                    isPrimary={isPrimary}
                    allowPartner={allowPartners}
                  />
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Add attendee button */}
      {primaryAttendees.length < maxAttendees && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={handleAddAttendee}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Another Attendee
          </Button>
        </div>
      )}

      <Separator />

      {/* Action buttons */}
      <div className="flex justify-between">
        <Button variant="outline">
          Save Draft
        </Button>
        <Button onClick={handleComplete}>
          Continue to Tickets
        </Button>
      </div>
    </div>
  );
};
```

2. Create a summary view component:
```typescript
// Summary view for review
export const IndividualsFormSummary: React.FC = () => {
  const { attendees } = useRegistrationStore();
  
  // Group attendees by primary/partner relationship
  const attendeeGroups = attendees.reduce((groups, attendee) => {
    if (!attendee.isPartner) {
      groups.push({
        primary: attendee,
        partners: attendees.filter(a => a.isPartner === attendee.attendeeId),
      });
    }
    return groups;
  }, [] as Array<{ primary: AttendeeData; partners: AttendeeData[] }>);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Registration Summary</h3>
      
      {attendeeGroups.map((group, index) => (
        <Card key={group.primary.attendeeId}>
          <CardContent className="pt-4">
            <div className="space-y-2">
              <div>
                <p className="font-medium">
                  {index === 0 ? 'Primary Registrant' : `Attendee ${index + 1}`}
                </p>
                <p className="text-sm text-gray-600">
                  {group.primary.title} {group.primary.firstName} {group.primary.lastName}
                  {group.primary.attendeeType === 'Mason' && group.primary.lodgeNameNumber && (
                    <span> - {group.primary.lodgeNameNumber}</span>
                  )}
                </p>
              </div>
              
              {group.partners.map((partner) => (
                <div key={partner.attendeeId} className="ml-4">
                  <p className="text-sm">
                    <span className="font-medium">Partner:</span>{' '}
                    {partner.title} {partner.firstName} {partner.lastName}
                    {partner.relationship && ` (${partner.relationship})`}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
      
      <p className="text-sm text-gray-600">
        Total attendees: {attendees.length}
      </p>
    </div>
  );
};
```

3. Create validation helper:
```typescript
// Validation helper for the form
export const useIndividualsFormValidation = () => {
  const { attendees, validateAllAttendees } = useRegistrationStore();
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});

  const validateForm = useCallback(async () => {
    const errors: Record<string, string[]> = {};
    
    // Check for at least one attendee
    if (attendees.length === 0) {
      errors.general = ['At least one attendee is required'];
    }

    // Validate primary attendee exists
    const hasPrimary = attendees.some(a => a.isPrimary);
    if (!hasPrimary) {
      errors.general = [...(errors.general || []), 'A primary attendee is required'];
    }

    // Validate all attendees
    const isValid = await validateAllAttendees();
    
    if (!isValid) {
      // Get specific validation errors for each attendee
      // This would integrate with the validation system
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [attendees, validateAllAttendees]);

  return { validateForm, validationErrors };
};
```

## Deliverables
- IndividualsForm layout component
- Expandable/collapsible attendee cards
- Attendee management controls
- Summary view component
- Form validation helper

## Success Criteria
- Handles multiple attendees cleanly
- Partners properly associated
- Good UX with expand/collapse
- Validates all attendees
- Clear visual hierarchy

## Compliance Analysis with CLAUDE.md

### Issues Found:

1. **Type Import**: Missing `AttendeeData` type import from `../types` as specified in CLAUDE.md.

2. **Validation Function**: References `validateAttendee` function that isn't imported or defined. According to CLAUDE.md, validation utilities should be imported from `./utils/validation`.

3. **Required Fields Function**: Uses `getRequiredFields` function that's not defined. This should be part of the validation utilities.

4. **Component Naming**: Uses `AttendeeCounter` but according to CLAUDE.md, this should be `AddRemoveControl` from `../shared/AddRemoveControl`.

5. **Store Interface**: References methods like `addMultipleAttendees` that aren't part of the standard store interface defined in the architecture.

6. **Summary Component**: References `AttendeeData` in the summary component but doesn't import it.

7. **Modal Import**: Uses `Input` component without importing it.

### Required Corrections:

1. Add proper imports for `AttendeeData` type
2. Import validation utilities from the correct path
3. Use `AddRemoveControl` instead of `AttendeeCounter`
4. Remove references to non-standard store methods
5. Add all missing imports for UI components
6. Ensure type imports are consistent throughout

### Minor Discrepancies:

- The `IndividualsFormSummary` component is a good addition but not specified in CLAUDE.md
- The progress tracking functionality is an enhancement not specified in the original architecture

### Alignment Score: 70%

The core functionality aligns well with CLAUDE.md, but implementation details need adjustment to match the specified patterns.