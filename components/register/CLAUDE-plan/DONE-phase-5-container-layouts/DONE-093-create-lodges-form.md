# Task 093: Create LodgesForm Layout

## Objective
Create the LodgesForm layout for lodge group registration that handles multiple lodge members.

## Dependencies
- Task 091 (AttendeeWithPartner)
- Task 004 (useAttendeeData)
- Task 023 (AddRemoveControl)

## Reference Files
- Lodge registration patterns
- CLAUDE.md architecture specifications

## Steps

1. Create `components/register/forms/attendee/LodgesForm.tsx`:
```typescript
import React, { useCallback, useEffect, useState } from 'react';
import { useRegistrationStore } from '@/lib/registrationStore';
import { AttendeeWithPartner } from './AttendeeWithPartner';
import { AttendeeCounter } from '../shared/AddRemoveControl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Building, Users, Shield } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface LodgesFormProps {
  minMembers?: number;
  maxMembers?: number;
  allowPartners?: boolean;
  onComplete?: () => void;
  className?: string;
}

export const LodgesForm: React.FC<LodgesFormProps> = ({
  minMembers = 3,
  maxMembers = 20,
  allowPartners = true,
  onComplete,
  className,
}) => {
  const { 
    attendees, 
    addAttendee, 
    removeAttendee,
    updateAttendee,
    validateAllAttendees 
  } = useRegistrationStore();
  
  const [primaryLodgeDetails, setPrimaryLodgeDetails] = useState<{
    grandLodgeId?: string;
    lodgeId?: string;
    lodgeNameNumber?: string;
  }>({});

  // Filter to only show Mason attendees (not partners)
  const masonAttendees = attendees.filter(
    a => a.attendeeType === 'Mason' && !a.isPartner
  );

  // Find the primary Mason
  const primaryMason = masonAttendees.find(a => a.isPrimary);

  // Update primary lodge details when primary Mason changes
  useEffect(() => {
    if (primaryMason) {
      setPrimaryLodgeDetails({
        grandLodgeId: primaryMason.grandLodgeId,
        lodgeId: primaryMason.lodgeId,
        lodgeNameNumber: primaryMason.lodgeNameNumber,
      });
    }
  }, [primaryMason]);

  // Add new Mason
  const handleAddMason = useCallback(() => {
    const newMasonId = addAttendee('Mason');
    
    // Auto-populate lodge details for new members
    if (primaryLodgeDetails.lodgeId) {
      updateAttendee(newMasonId, {
        grandLodgeId: primaryLodgeDetails.grandLodgeId,
        lodgeId: primaryLodgeDetails.lodgeId,
        lodgeNameNumber: primaryLodgeDetails.lodgeNameNumber,
      });
    }
  }, [addAttendee, updateAttendee, primaryLodgeDetails]);

  // Remove Mason
  const handleRemoveMason = useCallback((masonId: string) => {
    removeAttendee(masonId);
  }, [removeAttendee]);

  // Validate and complete
  const handleComplete = useCallback(async () => {
    const isValid = await validateAllAttendees();
    
    // Additional lodge-specific validation
    if (masonAttendees.length < minMembers) {
      alert(`At least ${minMembers} lodge members are required`);
      return;
    }

    if (isValid && onComplete) {
      onComplete();
    }
  }, [validateAllAttendees, masonAttendees.length, minMembers, onComplete]);

  // Auto-add primary Mason if none exists
  useEffect(() => {
    if (masonAttendees.length === 0) {
      const primaryId = addAttendee('Mason');
      updateAttendee(primaryId, { isPrimary: true });
    }
  }, []);

  const lodgeName = primaryLodgeDetails.lodgeNameNumber || 'Lodge';

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Building className="w-6 h-6" />
          Lodge Registration
        </h2>
        <p className="text-gray-600 mt-1">
          Register multiple members from {lodgeName}
        </p>
      </div>

      {/* Lodge info alert */}
      {primaryLodgeDetails.lodgeNameNumber && (
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Registering members from <strong>{primaryLodgeDetails.lodgeNameNumber}</strong>
            {masonAttendees.length > 1 && 
              `. All ${masonAttendees.length} members will be registered under this lodge.`
            }
          </AlertDescription>
        </Alert>
      )}

      {/* Member counter */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Lodge Members
            </CardTitle>
            <div className="flex items-center gap-4">
              <Badge variant="secondary">
                {masonAttendees.length} of {minMembers} minimum
              </Badge>
              <AttendeeCounter
                attendeeCount={masonAttendees.length}
                onAdd={handleAddMason}
                onRemove={() => {
                  const lastMason = masonAttendees[masonAttendees.length - 1];
                  if (lastMason && !lastMason.isPrimary) {
                    handleRemoveMason(lastMason.attendeeId);
                  }
                }}
                minCount={minMembers}
                maxCount={maxMembers}
                countLabel="members"
              />
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Member forms */}
      <div className="space-y-6">
        {masonAttendees.map((mason, index) => {
          const isPrimary = mason.isPrimary;
          const memberNumber = index + 1;
          
          return (
            <Card key={mason.attendeeId} className={cn(
              "overflow-hidden",
              isPrimary && "ring-2 ring-blue-500"
            )}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {isPrimary ? (
                      <>
                        <Badge>Primary Contact</Badge>
                        Worshipful Master / Lodge Secretary
                      </>
                    ) : (
                      `Lodge Member ${memberNumber}`
                    )}
                    {mason.firstName && mason.lastName && (
                      <span className="font-normal text-gray-600 ml-2">
                        - {mason.title} {mason.firstName} {mason.lastName}
                      </span>
                    )}
                  </CardTitle>
                  
                  {!isPrimary && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveMason(mason.attendeeId)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              </CardHeader>

              <CardContent>
                <AttendeeWithPartner
                  attendeeId={mason.attendeeId}
                  attendeeNumber={memberNumber}
                  isPrimary={isPrimary}
                  allowPartner={allowPartners}
                />
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Add member reminder */}
      {masonAttendees.length < minMembers && (
        <Alert variant="warning">
          <AlertDescription>
            You need at least {minMembers - masonAttendees.length} more member{minMembers - masonAttendees.length > 1 ? 's' : ''} to proceed.
          </AlertDescription>
        </Alert>
      )}

      <Separator />

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{masonAttendees.length}</p>
              <p className="text-sm text-gray-600">Lodge Members</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-2xl font-bold">
                {attendees.filter(a => a.isPartner).length}
              </p>
              <p className="text-sm text-gray-600">Partners</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{attendees.length}</p>
              <p className="text-sm text-gray-600">Total Attendees</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-sm font-medium">
                {primaryLodgeDetails.lodgeNameNumber || 'No Lodge Selected'}
              </p>
              <p className="text-sm text-gray-600">Lodge</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action buttons */}
      <div className="flex justify-between">
        <Button variant="outline">
          Save Draft
        </Button>
        <Button 
          onClick={handleComplete}
          disabled={masonAttendees.length < minMembers}
        >
          Continue to Tickets
        </Button>
      </div>
    </div>
  );
};
```

2. Create bulk operations helper:
```typescript
// Helper for bulk lodge operations
export const useLodgeBulkOperations = () => {
  const { attendees, updateAttendee, addMultipleAttendees } = useRegistrationStore();

  // Apply lodge details to all members
  const applyLodgeToAll = useCallback((lodgeDetails: {
    grandLodgeId: string;
    lodgeId: string;
    lodgeNameNumber: string;
  }) => {
    const masons = attendees.filter(a => a.attendeeType === 'Mason');
    
    masons.forEach(mason => {
      updateAttendee(mason.attendeeId, lodgeDetails);
    });
  }, [attendees, updateAttendee]);

  // Import members from CSV/Excel
  const importMembers = useCallback(async (data: any[]) => {
    const newMembers = data.map(row => ({
      attendeeType: 'Mason' as const,
      title: row.title,
      firstName: row.firstName,
      lastName: row.lastName,
      rank: row.rank || 'MM',
      primaryEmail: row.email,
      primaryPhone: row.phone,
    }));

    await addMultipleAttendees(newMembers);
  }, [addMultipleAttendees]);

  return { applyLodgeToAll, importMembers };
};
```

3. Create lodge summary component:
```typescript
// Summary view for lodge registration
export const LodgeFormSummary: React.FC = () => {
  const { attendees } = useRegistrationStore();
  
  const masonAttendees = attendees.filter(
    a => a.attendeeType === 'Mason' && !a.isPartner
  );
  
  const primaryMason = masonAttendees.find(a => a.isPrimary);
  const lodgeDetails = primaryMason?.lodgeNameNumber || 'Lodge';

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Lodge Registration Summary</h3>
      
      <Card>
        <CardContent className="pt-4">
          <div className="space-y-2">
            <p className="font-medium">{lodgeDetails}</p>
            <p className="text-sm text-gray-600">
              {masonAttendees.length} members registered
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Member list */}
      <div className="space-y-2">
        {masonAttendees.map((mason, index) => (
          <div key={mason.attendeeId} className="flex items-center gap-2">
            {mason.isPrimary && <Badge variant="secondary">Primary</Badge>}
            <span className="text-sm">
              {mason.title} {mason.firstName} {mason.lastName}
              {mason.rank && ` (${mason.rank})`}
            </span>
          </div>
        ))}
      </div>

      {/* Partner count */}
      {attendees.some(a => a.isPartner) && (
        <p className="text-sm text-gray-600">
          + {attendees.filter(a => a.isPartner).length} partners
        </p>
      )}
    </div>
  );
};
```

## Deliverables
- LodgesForm layout component
- Auto-population of lodge details
- Member management
- Bulk operations helper
- Summary view component

## Success Criteria
- Enforces minimum members
- Lodge details propagate to all members
- Primary contact clearly identified
- Good UX for adding multiple members
- Clear visual hierarchy

## Compliance Analysis with CLAUDE.md

### Issues Found:

1. **Import Missing**: References `AttendeeData` type in the summary component but doesn't import it from `../types`.

2. **Component Naming**: Uses `AttendeeCounter` which should be `AddRemoveControl` according to CLAUDE.md.

3. **Store Methods**: References `addMultipleAttendees` method which is not part of the standard store interface defined in the architecture.

4. **Import Paths**: Component import paths are inconsistent with CLAUDE.md structure.

5. **Auto-population Logic**: The automatic lodge detail population for new members is a nice feature but not specified in CLAUDE.md.

6. **Business Logic**: While CLAUDE.md mentions "Use Same Lodge" functionality, the auto-population approach differs from the checkbox approach documented.

### Required Corrections:

1. Add proper imports for `AttendeeData` type from `../types`
2. Use `AddRemoveControl` instead of `AttendeeCounter`
3. Remove or adjust references to non-standard store methods
4. Fix import paths to match CLAUDE.md directory structure
5. Align the "Use Same Lodge" implementation with the checkbox pattern described in CLAUDE.md

### Enhancements Beyond CLAUDE.md:

- Lodge member minimum enforcement with visual feedback
- Statistical cards showing member/partner breakdown
- Bulk import functionality
- Auto-population of lodge details

### Alignment Score: 75%

Core functionality aligns well, but implementation includes several enhancements not specified in the original architecture. Some implementation details need adjustment to match documented patterns.