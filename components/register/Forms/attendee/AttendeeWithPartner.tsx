import React, { lazy, Suspense, useMemo } from 'react';
import { usePartnerManager } from './lib/usePartnerManager';
import { FormProps } from './types';
import { PartnerToggle } from '../shared/PartnerToggle';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

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
      <Suspense fallback={<FormLoadingFallback />}>
        <AttendeeFormComponent
          attendeeId={attendeeId}
          attendeeNumber={attendeeNumber}
          isPrimary={isPrimary}
        />
      </Suspense>

      {/* Partner toggle - only show if allowed and no partner exists */}
      {allowPartner && !partner && (
        <>
          <Separator />
          <div className="flex justify-center">
            <PartnerToggle
              hasPartner={hasPartner}
              onToggle={togglePartner}
              partnerLabel="partner"
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
          <Suspense fallback={<FormLoadingFallback />}>
            <GuestForm
              attendeeId={partner.attendeeId}
              attendeeNumber={attendeeNumber + 1}
              isPrimary={false}
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