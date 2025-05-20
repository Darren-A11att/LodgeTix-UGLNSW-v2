# Task 091: Create AttendeeWithPartner Container

## Objective
Create the AttendeeWithPartner container that orchestrates the rendering of attendee forms with optional partner forms.

## Dependencies
- Task 005 (usePartnerManager)
- Task 022 (PartnerToggle)
- Task 071 (MasonForm)
- Task 072 (GuestForm)

## Reference Files
- `components/register/forms/mason/MasonWithPartner.tsx`
- `components/register/forms/guest/GuestWithPartner.tsx`
- Architecture details in CLAUDE.md

## Steps

1. Create `components/register/forms/attendee/AttendeeWithPartner.tsx`:
```typescript
import React, { useMemo } from 'react';
import { usePartnerManager } from './lib/usePartnerManager';
import { FormProps } from './types';
import { MasonForm } from '../mason/layouts/MasonForm';
import { GuestForm, PartnerForm } from '../guest/layouts/GuestForm';
import { PartnerToggle } from '../shared/PartnerToggle';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface AttendeeWithPartnerProps extends FormProps {
  allowPartner?: boolean;
  className?: string;
}

export const AttendeeWithPartner: React.FC<AttendeeWithPartnerProps> = ({ 
  attendeeId, 
  attendeeNumber, 
  isPrimary = false,
  allowPartner = true,
  className,
}) => {
  const { attendee, partner, hasPartner, togglePartner } = usePartnerManager(attendeeId);

  // Determine which form to render based on attendee type
  const AttendeeFormComponent = useMemo(() => {
    if (!attendee) return null;
    
    switch (attendee.attendeeType) {
      case 'Mason':
        return MasonForm;
      case 'Guest':
        return GuestForm;
      default:
        throw new Error(`Unknown attendee type: ${attendee.attendeeType}`);
    }
  }, [attendee?.attendeeType]);

  if (!attendee || !AttendeeFormComponent) {
    return null;
  }

  return (
    <div className={cn("space-y-8", className)}>
      {/* Main attendee form */}
      <AttendeeFormComponent
        attendeeId={attendeeId}
        attendeeNumber={attendeeNumber}
        isPrimary={isPrimary}
      />

      {/* Partner toggle - only show if allowed and no partner exists */}
      {allowPartner && !partner && (
        <>
          <Separator />
          <div className="flex justify-center">
            <PartnerToggle
              hasPartner={hasPartner}
              onToggle={togglePartner}
              partnerLabel={attendee.attendeeType === 'Mason' ? 'partner' : 'companion'}
              addText="Add Partner"
              removeText="Remove Partner"
            />
          </div>
        </>
      )}

      {/* Partner form - always renders as Guest */}
      {partner && (
        <>
          <Separator className="my-8" />
          <PartnerForm
            attendeeId={partner.attendeeId}
            attendeeNumber={attendeeNumber + 1}
            parentAttendeeId={attendeeId}
            isPrimary={false}
          />
        </>
      )}
    </div>
  );
};
```

2. Create a utility for rendering attendee forms by type:
```typescript
// components/register/forms/attendee/utils/attendeeTypeRenderer.ts
import React from 'react';
import { AttendeeData, FormProps } from '../types';
import { MasonForm } from '../../mason/layouts/MasonForm';
import { GuestForm } from '../../guest/layouts/GuestForm';

export const useAttendeeTypeRenderer = () => {
  const renderAttendeeForm = (
    attendee: AttendeeData, 
    props: Omit<FormProps, 'attendeeId'>
  ) => {
    const formProps: FormProps = {
      ...props,
      attendeeId: attendee.attendeeId,
    };

    switch (attendee.attendeeType) {
      case 'Mason':
        return <MasonForm {...formProps} />;
      case 'Guest':
        return <GuestForm {...formProps} />;
      default:
        throw new Error(`Unknown attendee type: ${attendee.attendeeType}`);
    }
  };

  const getFormComponent = (attendeeType: AttendeeData['attendeeType']) => {
    switch (attendeeType) {
      case 'Mason':
        return MasonForm;
      case 'Guest':
        return GuestForm;
      default:
        throw new Error(`Unknown attendee type: ${attendeeType}`);
    }
  };

  return { renderAttendeeForm, getFormComponent };
};
```

3. Create layout variants:
```typescript
// Stacked layout (default)
export const AttendeeWithPartnerStacked = AttendeeWithPartner;

// Side-by-side layout for larger screens
export const AttendeeWithPartnerSideBySide: React.FC<AttendeeWithPartnerProps> = (props) => {
  const { attendee, partner } = usePartnerManager(props.attendeeId);
  const { getFormComponent } = useAttendeeTypeRenderer();

  if (!attendee) return null;

  const AttendeeFormComponent = getFormComponent(attendee.attendeeType);

  return (
    <div className={cn("space-y-8", props.className)}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Main attendee */}
        <div>
          <AttendeeFormComponent
            attendeeId={props.attendeeId}
            attendeeNumber={props.attendeeNumber}
            isPrimary={props.isPrimary}
          />
        </div>

        {/* Partner */}
        {partner ? (
          <div>
            <PartnerForm
              attendeeId={partner.attendeeId}
              attendeeNumber={props.attendeeNumber + 1}
              parentAttendeeId={props.attendeeId}
              isPrimary={false}
            />
          </div>
        ) : (
          <div className="flex items-center justify-center">
            {props.allowPartner && (
              <PartnerToggle
                hasPartner={false}
                onToggle={() => {/* toggle logic */}}
                partnerLabel="partner"
                variant="button"
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Compact variant for modals
export const AttendeeWithPartnerCompact: React.FC<AttendeeWithPartnerProps> = (props) => {
  const { attendee, partner, hasPartner, togglePartner } = usePartnerManager(props.attendeeId);

  if (!attendee) return null;

  return (
    <div className={cn("space-y-4", props.className)}>
      {/* Use compact form variants */}
      {attendee.attendeeType === 'Mason' ? (
        <MasonFormCompact
          attendeeId={props.attendeeId}
          attendeeNumber={props.attendeeNumber}
          isPrimary={props.isPrimary}
        />
      ) : (
        <GuestFormCompact
          attendeeId={props.attendeeId}
          attendeeNumber={props.attendeeNumber}
          isPrimary={props.isPrimary}
        />
      )}

      {/* Inline partner toggle */}
      {props.allowPartner && !partner && (
        <PartnerToggle
          hasPartner={hasPartner}
          onToggle={togglePartner}
          variant="inline"
          className="mt-4"
        />
      )}

      {/* Partner form */}
      {partner && (
        <div className="mt-6 pt-6 border-t">
          <h4 className="font-medium mb-4">Partner Details</h4>
          <GuestFormCompact
            attendeeId={partner.attendeeId}
            attendeeNumber={props.attendeeNumber + 1}
            isPrimary={false}
          />
        </div>
      )}
    </div>
  );
};
```

4. Create backward compatibility wrapper:
```typescript
// Wrapper to replace MasonWithPartner
export const MasonWithPartner: React.FC<{
  masonId: string;
  attendeeNumber: number;
  isPrimary?: boolean;
}> = ({ masonId, attendeeNumber, isPrimary }) => {
  return (
    <AttendeeWithPartner
      attendeeId={masonId}
      attendeeNumber={attendeeNumber}
      isPrimary={isPrimary}
      allowPartner={true}
    />
  );
};

// Wrapper to replace GuestWithPartner
export const GuestWithPartner: React.FC<{
  guestId: string;
  attendeeNumber: number;
  isPrimary?: boolean;
}> = ({ guestId, attendeeNumber, isPrimary }) => {
  return (
    <AttendeeWithPartner
      attendeeId={guestId}
      attendeeNumber={attendeeNumber}
      isPrimary={isPrimary}
      allowPartner={true}
    />
  );
};
```

## Deliverables
- AttendeeWithPartner container
- Type-based form rendering
- Multiple layout variants
- Partner toggle integration
- Backward compatibility wrappers

## Success Criteria
- Renders correct form based on type
- Partner toggle works properly
- Multiple layout options available
- Clean separation of concerns
- Replaces existing implementations

## Compliance Analysis with CLAUDE.md

### Issues Found:

1. **Type Naming**: Uses `PartnerForm` in import but CLAUDE.md specifies partners are always Guest type. Should use `GuestForm` consistently.

2. **Import Paths**: References `../guest/layouts/GuestForm` but according to CLAUDE.md structure, the path should be `../../guest/layouts/GuestForm` (missing one level up).

3. **Component References**: Uses `MasonFormCompact` and `GuestFormCompact` but these are not defined in CLAUDE.md specification and aren't part of the architecture.

4. **Types Import**: Missing proper type imports. Should import from `./types` as specified in CLAUDE.md.

5. **Partner Label Logic**: Uses different partner label for Mason vs Guest (`'partner'` vs `'companion'`), which is not specified in CLAUDE.md.

6. **Backward Compatibility Wrappers**: Uses different prop names (`masonId`, `guestId`) than the standard `attendeeId` pattern defined in CLAUDE.md.

7. **Missing Dependencies**: References `Input` component but doesn't import it. Should use proper imports from UI library.

### Required Corrections:

1. Replace all instances of `PartnerForm` with `GuestForm`
2. Fix import paths to match CLAUDE.md directory structure
3. Remove references to non-existent Compact variants
4. Add proper type imports from `./types`
5. Standardize partner labeling according to actual requirements
6. Use consistent `attendeeId` prop naming in backward compatibility wrappers
7. Add all necessary imports for UI components

### Alignment Score: 65%

The task captures the general concept correctly but has implementation details that don't match the specified architecture.