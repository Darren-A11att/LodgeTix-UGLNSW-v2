import React from 'react';
import { BasicInfo } from '../../basic-details/BasicInfo';
import { ContactInfo } from '../../basic-details/ContactInfo';
import { UnifiedAttendeeData } from '@/lib/registrationStore';

interface BookingContactSectionProps {
  attendee: UnifiedAttendeeData | undefined;
  onFieldChange: (field: string, value: any) => void;
  onFieldChangeImmediate?: (field: string, value: any) => void;
  disabled?: boolean;
  updateOnBlur?: boolean;
  className?: string;
  required?: boolean;
}

export const BookingContactSection: React.FC<BookingContactSectionProps> = React.memo(({
  attendee,
  onFieldChange,
  onFieldChangeImmediate,
  disabled = false,
  updateOnBlur = true,
  className = '',
  required = true
}) => {
  if (!attendee) return null;

  // Since field components now handle their own local state properly,
  // we can pass the attendee data directly without an additional layer
  const handleChange = React.useCallback((field: string, value: any) => {
    // For select fields (title, rank), use immediate update
    if (field === 'title' || field === 'rank') {
      if (onFieldChangeImmediate) {
        onFieldChangeImmediate(field, value);
      } else {
        onFieldChange(field, value);
      }
    } else {
      // For text fields, use debounced update
      onFieldChange(field, value);
    }
  }, [onFieldChange, onFieldChangeImmediate]);

  return (
    <div className={`pt-4 border-t border-gray-100 ${className}`}>
      <h3 className="text-base font-medium flex items-center gap-2 mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-primary">
          <path d="M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.23 0 00.41 1.412A9.957 9.957 0 0010 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 00-13.074.003z" />
        </svg>
        Booking Contact
      </h3>
      <div className="space-y-6">
        {/* Use the existing BasicInfo component for Mason details */}
        <BasicInfo 
          data={attendee}
          type="Mason"
          isPrimary={true}
          onChange={handleChange}
        />
        
        {/* Use the existing ContactInfo component */}
        <ContactInfo 
          data={attendee}
          isPrimary={true}
          onChange={handleChange}
          onChangeImmediate={onFieldChangeImmediate}
        />
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison to prevent unnecessary re-renders
  return (
    prevProps.attendee?.attendeeId === nextProps.attendee?.attendeeId &&
    prevProps.attendee?.title === nextProps.attendee?.title &&
    prevProps.attendee?.firstName === nextProps.attendee?.firstName &&
    prevProps.attendee?.lastName === nextProps.attendee?.lastName &&
    prevProps.attendee?.rank === nextProps.attendee?.rank &&
    prevProps.attendee?.primaryEmail === nextProps.attendee?.primaryEmail &&
    prevProps.attendee?.primaryPhone === nextProps.attendee?.primaryPhone &&
    prevProps.disabled === nextProps.disabled &&
    prevProps.updateOnBlur === nextProps.updateOnBlur &&
    prevProps.className === nextProps.className &&
    prevProps.required === nextProps.required &&
    prevProps.onFieldChange === nextProps.onFieldChange &&
    prevProps.onFieldChangeImmediate === nextProps.onFieldChangeImmediate
  );
});

BookingContactSection.displayName = 'BookingContactSection';