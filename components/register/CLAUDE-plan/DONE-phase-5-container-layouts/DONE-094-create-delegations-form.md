# Task 094: Create DelegationsForm Layout

## Objective
Create the DelegationsForm layout for official delegation registration with specific hierarchy and roles.

## Dependencies
- Task 091 (AttendeeWithPartner)
- Task 004 (useAttendeeData)
- Task 046 (GrandOfficerFields)

## Reference Files
- Delegation patterns
- CLAUDE.md architecture specifications

## Steps

1. Create `components/register/forms/attendee/DelegationsForm.tsx`:
```typescript
import React, { useCallback, useEffect, useState } from 'react';
import { useRegistrationStore } from '@/lib/registrationStore';
import { AttendeeWithPartner } from './AttendeeWithPartner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Shield, Crown, Users, Star } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface DelegationsFormProps {
  delegationType?: 'GrandLodge' | 'District' | 'International';
  maxDelegates?: number;
  onComplete?: () => void;
  className?: string;
}

interface DelegationRole {
  id: string;
  title: string;
  rank: string;
  icon: React.ElementType;
  required: boolean;
  order: number;
}

const DELEGATION_ROLES: Record<string, DelegationRole[]> = {
  GrandLodge: [
    { id: 'gm', title: 'Grand Master', rank: 'GL', icon: Crown, required: true, order: 1 },
    { id: 'dgm', title: 'Deputy Grand Master', rank: 'GL', icon: Shield, required: false, order: 2 },
    { id: 'agm', title: 'Assistant Grand Master', rank: 'GL', icon: Shield, required: false, order: 3 },
    { id: 'gs', title: 'Grand Secretary', rank: 'GL', icon: Star, required: false, order: 4 },
    { id: 'gdc', title: 'Grand Director of Ceremonies', rank: 'GL', icon: Star, required: false, order: 5 },
  ],
  District: [
    { id: 'dg', title: 'District Grand Master', rank: 'GL', icon: Crown, required: true, order: 1 },
    { id: 'ddg', title: 'Deputy District Grand Master', rank: 'GL', icon: Shield, required: false, order: 2 },
  ],
  International: [
    { id: 'head', title: 'Head of Delegation', rank: 'GL', icon: Crown, required: true, order: 1 },
    { id: 'deputy', title: 'Deputy Head', rank: 'GL', icon: Shield, required: false, order: 2 },
  ],
};

export const DelegationsForm: React.FC<DelegationsFormProps> = ({
  delegationType = 'GrandLodge',
  maxDelegates = 10,
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
  
  const [delegationName, setDelegationName] = useState('');
  const [roleAssignments, setRoleAssignments] = useState<Record<string, string>>({});

  // Get delegation roles for the type
  const roles = DELEGATION_ROLES[delegationType];
  
  // Filter to only show Mason attendees (not partners)
  const masonAttendees = attendees.filter(
    a => a.attendeeType === 'Mason' && !a.isPartner
  );

  // Initialize with required roles
  useEffect(() => {
    if (masonAttendees.length === 0) {
      // Add attendees for required roles
      roles.forEach(role => {
        if (role.required) {
          const newMasonId = addAttendee('Mason');
          updateAttendee(newMasonId, {
            rank: role.rank,
            grandOfficerStatus: 'Present',
            presentGrandOfficerRole: role.title,
            isPrimary: role.id === 'gm' || role.id === 'dg' || role.id === 'head',
          });
          setRoleAssignments(prev => ({ ...prev, [role.id]: newMasonId }));
        }
      });
    }
  }, []);

  // Add delegate with role
  const handleAddDelegate = useCallback((roleId?: string) => {
    const newMasonId = addAttendee('Mason');
    const role = roles.find(r => r.id === roleId);
    
    if (role) {
      updateAttendee(newMasonId, {
        rank: role.rank,
        grandOfficerStatus: 'Present',
        presentGrandOfficerRole: role.title,
      });
      setRoleAssignments(prev => ({ ...prev, [roleId]: newMasonId }));
    } else {
      updateAttendee(newMasonId, { rank: 'GL' });
    }
  }, [addAttendee, updateAttendee, roles]);

  // Remove delegate
  const handleRemoveDelegate = useCallback((masonId: string) => {
    // Check if this delegate has a required role
    const assignedRole = Object.entries(roleAssignments).find(
      ([_, attendeeId]) => attendeeId === masonId
    );
    
    if (assignedRole) {
      const role = roles.find(r => r.id === assignedRole[0]);
      if (role?.required) {
        alert(`Cannot remove ${role.title} - this role is required`);
        return;
      }
      
      // Remove role assignment
      setRoleAssignments(prev => {
        const next = { ...prev };
        delete next[assignedRole[0]];
        return next;
      });
    }
    
    removeAttendee(masonId);
  }, [removeAttendee, roleAssignments, roles]);

  // Assign role to delegate
  const handleAssignRole = useCallback((roleId: string, attendeeId: string) => {
    // Remove previous assignment for this role
    const previousAssignment = roleAssignments[roleId];
    if (previousAssignment) {
      updateAttendee(previousAssignment, {
        presentGrandOfficerRole: null,
      });
    }

    // Assign new role
    const role = roles.find(r => r.id === roleId);
    if (role) {
      updateAttendee(attendeeId, {
        rank: role.rank,
        grandOfficerStatus: 'Present',
        presentGrandOfficerRole: role.title,
      });
      setRoleAssignments(prev => ({ ...prev, [roleId]: attendeeId }));
    }
  }, [roleAssignments, roles, updateAttendee]);

  // Validate and complete
  const handleComplete = useCallback(async () => {
    // Check all required roles are filled
    const missingRoles = roles
      .filter(role => role.required && !roleAssignments[role.id])
      .map(role => role.title);
    
    if (missingRoles.length > 0) {
      alert(`Please assign: ${missingRoles.join(', ')}`);
      return;
    }

    const isValid = await validateAllAttendees();
    if (isValid && onComplete) {
      onComplete();
    }
  }, [roles, roleAssignments, validateAllAttendees, onComplete]);

  // Get delegate's assigned role
  const getDelegateRole = (attendeeId: string): DelegationRole | undefined => {
    const roleEntry = Object.entries(roleAssignments).find(
      ([_, id]) => id === attendeeId
    );
    if (!roleEntry) return undefined;
    return roles.find(r => r.id === roleEntry[0]);
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="w-6 h-6" />
          Official Delegation Registration
        </h2>
        <p className="text-gray-600 mt-1">
          Register an official {delegationType} delegation
        </p>
      </div>

      {/* Delegation details */}
      <Card>
        <CardHeader>
          <CardTitle>Delegation Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="delegation-name">Delegation Name</Label>
            <Input
              id="delegation-name"
              value={delegationName}
              onChange={(e) => setDelegationName(e.target.value)}
              placeholder={`e.g., United Grand Lodge of NSW & ACT`}
            />
          </div>
          
          <div>
            <Label>Delegation Type</Label>
            <Select value={delegationType} disabled>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GrandLodge">Grand Lodge</SelectItem>
                <SelectItem value="District">District</SelectItem>
                <SelectItem value="International">International</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Role assignments */}
      <Card>
        <CardHeader>
          <CardTitle>Official Roles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {roles.map(role => {
              const Icon = role.icon;
              const assignedAttendeeId = roleAssignments[role.id];
              const assignedAttendee = masonAttendees.find(
                a => a.attendeeId === assignedAttendeeId
              );

              return (
                <div key={role.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="w-5 h-5 text-blue-600" />
                    <span className="font-medium">{role.title}</span>
                    {role.required && (
                      <Badge variant="secondary" className="text-xs">
                        Required
                      </Badge>
                    )}
                  </div>
                  
                  <Select
                    value={assignedAttendeeId || ''}
                    onValueChange={(value) => handleAssignRole(role.id, value)}
                  >
                    <SelectTrigger className="w-[250px]">
                      <SelectValue placeholder="Select delegate" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Unassigned</SelectItem>
                      {masonAttendees.map(attendee => (
                        <SelectItem 
                          key={attendee.attendeeId} 
                          value={attendee.attendeeId}
                          disabled={
                            Object.values(roleAssignments).includes(attendee.attendeeId) &&
                            roleAssignments[role.id] !== attendee.attendeeId
                          }
                        >
                          {attendee.firstName && attendee.lastName
                            ? `${attendee.firstName} ${attendee.lastName}`
                            : 'Unnamed Delegate'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Delegate forms */}
      <div className="space-y-6">
        {masonAttendees.map((mason, index) => {
          const role = getDelegateRole(mason.attendeeId);
          const delegateNumber = index + 1;
          
          return (
            <Card key={mason.attendeeId} className={cn(
              "overflow-hidden",
              role?.required && "ring-2 ring-blue-500"
            )}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {role ? (
                      <>
                        <role.icon className="w-5 h-5 text-blue-600" />
                        {role.title}
                      </>
                    ) : (
                      `Delegate ${delegateNumber}`
                    )}
                    {mason.firstName && mason.lastName && (
                      <span className="font-normal text-gray-600 ml-2">
                        - {mason.title} {mason.firstName} {mason.lastName}
                      </span>
                    )}
                  </CardTitle>
                  
                  {!role?.required && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveDelegate(mason.attendeeId)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              </CardHeader>

              <CardContent>
                <AttendeeWithPartner
                  attendeeId={mason.attendeeId}
                  attendeeNumber={delegateNumber}
                  isPrimary={mason.isPrimary}
                  allowPartner={true}
                />
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Add delegate button */}
      {masonAttendees.length < maxDelegates && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => handleAddDelegate()}
            className="gap-2"
          >
            <Users className="w-4 h-4" />
            Add Another Delegate
          </Button>
        </div>
      )}

      <Separator />

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{masonAttendees.length}</p>
              <p className="text-sm text-gray-600">Delegates</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-2xl font-bold">
                {Object.keys(roleAssignments).length}
              </p>
              <p className="text-sm text-gray-600">Roles Assigned</p>
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
      </div>

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

2. Create delegation summary component:
```typescript
// Summary view for delegation
export const DelegationFormSummary: React.FC<{ delegationType: string }> = ({ 
  delegationType 
}) => {
  const { attendees } = useRegistrationStore();
  
  const masonAttendees = attendees.filter(
    a => a.attendeeType === 'Mason' && !a.isPartner
  );
  
  const roles = DELEGATION_ROLES[delegationType];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{delegationType} Delegation Summary</h3>
      
      <div className="space-y-2">
        {masonAttendees.map(mason => {
          const role = mason.presentGrandOfficerRole;
          const roleConfig = roles.find(r => r.title === role);
          const Icon = roleConfig?.icon || Users;
          
          return (
            <Card key={mason.attendeeId}>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium">
                      {role || 'Delegate'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {mason.title} {mason.firstName} {mason.lastName}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      <p className="text-sm text-gray-600">
        Total: {attendees.length} attendees ({masonAttendees.length} delegates)
      </p>
    </div>
  );
};
```

## Deliverables
- DelegationsForm layout component
- Role assignment system
- Delegation hierarchy enforcement
- Required role validation
- Summary view component

## Success Criteria
- Enforces delegation structure
- Required roles must be filled
- Clear role assignments
- Proper visual hierarchy
- Works with grand officer fields

## Compliance Analysis with CLAUDE.md

### Issues Found:

1. **Component Definition**: `DelegationsForm` is not explicitly defined in CLAUDE.md architecture. While the concept exists, the specific implementation details differ.

2. **Role Management**: The role-based delegation system with specific positions (Grand Master, Deputy, etc.) is not documented in CLAUDE.md.

3. **Input Import**: References `Input` component without importing it.

4. **Grand Officer Integration**: While CLAUDE.md mentions grand officer fields for GL rank, the specific delegation role mapping is not defined.

5. **Type Definitions**: Missing imports for types like `AttendeeData` from `./types`.

6. **Delegation Types**: The three delegation types (GrandLodge, District, International) are not specified in CLAUDE.md.

### Required Corrections:

1. Add proper imports for all UI components
2. Import `AttendeeData` type from correct path
3. Verify grand officer field integration matches CLAUDE.md patterns
4. Align with existing grand officer constants from CLAUDE.md

### Architectural Considerations:

- The delegation concept fits within the overall architecture but adds complexity not originally specified
- Role assignments and hierarchy enforcement are good additions
- The implementation follows the component composition pattern from CLAUDE.md

### Alignment Score: 60%

While the implementation follows CLAUDE.md patterns for forms and components, the specific delegation functionality is an extension beyond the documented architecture. The code quality is good but introduces concepts not present in the original specification.