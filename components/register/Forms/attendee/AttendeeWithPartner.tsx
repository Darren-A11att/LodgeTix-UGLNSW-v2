import React, { lazy, Suspense, useMemo } from 'react';
import { usePartnerManager } from './lib/usePartnerManager';
import { FormProps } from './types';
import { PartnerToggle } from '../shared/PartnerToggle';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Loader2, X } from 'lucide-react';

// Lazy load form components for better performance
const MasonForm = lazy(() => import('../mason/Layouts/MasonForm'));
const GuestForm = lazy(() => import('../guest/Layouts/GuestForm'));

// Loading fallback component
const FormLoadingFallback = () => (
  <div className="flex items-center justify-center p-8">
    <Loader2 className="w-6 h-6 animate-spin" />
  </div>
);

interface AttendeeWithPartnerProps extends FormProps {
  allowPartner?: boolean;
  className?: string;
  onRemove?: () => void;
  fieldErrors?: Record<string, Record<string, string>>;
}

export const AttendeeWithPartner: React.FC<AttendeeWithPartnerProps> = ({ 
  attendeeId, 
  attendeeNumber, 
  isPrimary = false,
  allowPartner = true,
  className,
  onRemove,
  fieldErrors = {},
}) => {
  const { attendee, partner, hasPartner, togglePartner, updatePartnerRelationship } = usePartnerManager(attendeeId);

  // Determine which form to render based on attendee type
  const AttendeeFormComponent = useMemo(() => {
    if (!attendee) return null;
    
    // Handle deprecated partner types by mapping to base types
    let attendeeType = attendee.attendeeType;
    if (attendeeType === 'ladypartner') {
      attendeeType = 'mason'; // ladypartner was a mason's partner
    } else if (attendeeType === 'guestpartner') {
      attendeeType = 'guest'; // guestpartner was a guest's partner
    }
    
    // Match database enum values (lowercase)
    switch (attendeeType) {
      case 'mason':
        return MasonForm;
      case 'guest':
        return GuestForm;
      default:
        return null; // Will show "add attendee" prompt
    }
  }, [attendee?.attendeeType]);

  if (!attendee) {
    return null;
  }

  // Show prompt to add attendee if type is unknown
  if (!AttendeeFormComponent) {
    return (
      <div className={cn("space-y-4 p-6 bg-gray-50 rounded-lg border border-gray-200", className)}>
        <div className="text-center">
          <p className="text-gray-600 mb-2">Please add an attendee</p>
          <p className="text-sm text-gray-500">Select either Mason or Guest</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Main attendee form */}
      <Suspense fallback={<FormLoadingFallback />}>
        <AttendeeFormComponent
          attendeeId={attendeeId}
          attendeeNumber={attendeeNumber}
          isPrimary={isPrimary}
          onRemove={onRemove}
          fieldErrors={fieldErrors}
        />
      </Suspense>

      {/* Partner toggle - show only when partners are allowed and no partner exists */}
      {allowPartner && !partner && (
        <>
          <Separator />
          <div className="flex justify-center">
            <PartnerToggle
              hasPartner={false}
              onToggle={togglePartner}
              partnerLabel="partner"
              addText="Add Partner"
            />
          </div>
        </>
      )}

      {/* Partner form - always renders as Guest */}
      {partner && (
        <>
          <Separator className="my-4" />
          <div className="flex justify-between items-center px-4 mb-2">
            <h3 className="text-lg font-semibold">Partner Details</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => togglePartner()}
              className="flex items-center text-destructive hover:bg-destructive/10"
            >
              <X className="h-4 w-4 mr-1" /> Remove
            </Button>
          </div>
          <Suspense fallback={<FormLoadingFallback />}>
            <GuestForm
              attendeeId={partner.attendeeId}
              attendeeNumber={attendeeNumber + 1}
              isPrimary={false}
              onRelationshipChange={(relationship) => updatePartnerRelationship(relationship as any)}
              fieldErrors={fieldErrors}
            />
          </Suspense>
        </>
      )}
    </div>
  );
};

// Backward compatibility wrapper for MasonWithPartner
export const MasonWithPartner: React.FC<{
  attendeeId: string;
  attendeeNumber: number;
  isPrimary?: boolean;
}> = ({ attendeeId, attendeeNumber, isPrimary }) => {
  return (
    <AttendeeWithPartner
      attendeeId={attendeeId}
      attendeeNumber={attendeeNumber}
      isPrimary={isPrimary}
      allowPartner={true}
    />
  );
};

// Backward compatibility wrapper for GuestWithPartner
export const GuestWithPartner: React.FC<{
  attendeeId: string;
  attendeeNumber: number;
  isPrimary?: boolean;
}> = ({ attendeeId, attendeeNumber, isPrimary }) => {
  return (
    <AttendeeWithPartner
      attendeeId={attendeeId}
      attendeeNumber={attendeeNumber}
      isPrimary={isPrimary}
      allowPartner={true}
    />
  );
};