import React from 'react';
import { BasicInfo } from '../../basic-details/BasicInfo';
import { ContactInfo } from '../../basic-details/ContactInfo';
import { GrandOfficerFields } from '../../mason/utils/GrandOfficerFields';
import { UnifiedAttendeeData, DelegationBookingContact, useRegistrationStore } from '@/lib/registrationStore';
import { FieldWrapper } from '../../shared/FieldComponents';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface BookingContactSectionProps {
  mode?: 'attendee' | 'customer' | 'booking';
  attendee?: UnifiedAttendeeData | undefined;
  bookingContact?: DelegationBookingContact | undefined;
  onFieldChange?: (field: string, value: any) => void;
  onFieldChangeImmediate?: (field: string, value: any) => void;
  disabled?: boolean;
  updateOnBlur?: boolean;
  className?: string;
  required?: boolean;
  fieldErrors?: Record<string, string>;
  delegationTypeTab?: 'grandLodge' | 'masonicOrder';
}

export const BookingContactSection: React.FC<BookingContactSectionProps> = React.memo(({
  mode = 'attendee',
  attendee,
  bookingContact,
  onFieldChange,
  onFieldChangeImmediate,
  disabled = false,
  updateOnBlur = true,
  className = '',
  required = true,
  fieldErrors = {},
  delegationTypeTab
}) => {
  // For customer mode, use lodge registration store
  const { lodgeCustomer, updateLodgeCustomer } = useRegistrationStore();
  
  // For attendee mode, require attendee prop
  if (mode === 'attendee' && !attendee) return null;
  // For booking mode, require bookingContact prop
  if (mode === 'booking' && !bookingContact) return null;

  const handleChange = React.useCallback((field: string, value: any) => {
    if (mode === 'customer') {
      // Map field names from form components to customer store
      const fieldMapping: Record<string, string> = {
        'primaryEmail': 'email',
        'primaryPhone': 'mobile',
        // All other fields map directly
      };
      
      const mappedField = fieldMapping[field] || field;
      updateLodgeCustomer({ [mappedField]: value });
    } else {
      // Original attendee mode logic or booking mode logic
      const immediateFields = [
        'title', 
        'rank', 
        'grandOfficerStatus', 
        'presentGrandOfficerRole'
      ];
      
      // Map field names for booking mode
      if (mode === 'booking') {
        const fieldMapping: Record<string, string> = {
          'suffix': 'grandRank',
          'presentGrandOfficerRole': 'grandOffice',
          'otherGrandOfficerRole': 'otherGrandOffice',
          'primaryEmail': 'email',
          'primaryPhone': 'phone',
        };
        
        const mappedField = fieldMapping[field] || field;
        
        if (immediateFields.includes(field) || immediateFields.includes(mappedField)) {
          if (onFieldChangeImmediate) {
            onFieldChangeImmediate(mappedField, value);
          } else if (onFieldChange) {
            onFieldChange(mappedField, value);
          }
        } else if (onFieldChange) {
          onFieldChange(mappedField, value);
        }
      } else {
        // Attendee mode
        if (immediateFields.includes(field)) {
          if (onFieldChangeImmediate) {
            onFieldChangeImmediate(field, value);
          } else if (onFieldChange) {
            onFieldChange(field, value);
          }
        } else if (onFieldChange) {
          // For text fields, use debounced update
          onFieldChange(field, value);
        }
      }
    }
  }, [mode, onFieldChange, onFieldChangeImmediate, updateLodgeCustomer]);

  if (mode === 'booking') {
    // Booking mode - use delegation booking contact data
    const bookingData = {
      // Map booking contact data to UnifiedAttendeeData format for the form components
      attendeeId: 'delegation-booking-contact',
      attendeeType: 'mason' as const,
      title: bookingContact!.title || '',
      firstName: bookingContact!.firstName || '',
      lastName: bookingContact!.lastName || '',
      suffix: bookingContact!.grandRank || '',
      rank: bookingContact!.rank || '',
      grandOfficerStatus: bookingContact!.grandOfficerStatus,
      presentGrandOfficerRole: bookingContact!.grandOffice || '',
      otherGrandOfficerRole: bookingContact!.otherGrandOffice || '',
      primaryEmail: bookingContact!.email || '',
      primaryPhone: bookingContact!.phone || '',
      phone: bookingContact!.phone || '',
      dietaryRequirements: '',
      additionalInfo: '',
      contactPreference: 'directly' as const,
      isPrimary: true,
      isPartner: null,
      partner: null,
      // Organisation fields for Masonic Order
      organisationName: bookingContact!.organisationName,
      organisationAbbreviation: bookingContact!.organisationAbbreviation,
      organisationKnownAs: bookingContact!.organisationKnownAs,
    } as UnifiedAttendeeData;

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
            data={bookingData}
            type="mason"
            isPrimary={true}
            onChange={handleChange}
            isMasonicOrder={delegationTypeTab === 'masonicOrder'}
          />
          
          {/* Show Grand Officer fields when rank is GL or MO */}
          {(bookingData.rank === 'GL' || bookingData.rank === 'MO') && (
            <GrandOfficerFields 
              data={bookingData}
              onChange={handleChange}
              required={true}
              isMasonicOrder={delegationTypeTab === 'masonicOrder'}
            />
          )}
          
          {/* Use the existing ContactInfo component */}
          <ContactInfo 
            data={bookingData}
            isPrimary={true}
            onChange={handleChange}
            onChangeImmediate={onFieldChangeImmediate}
          />
        </div>
      </div>
    );
  }
  
  if (mode === 'customer') {
    // Customer mode - use same form fields as attendee but store in lodge registration store
    const customerData = {
      // Map customer data to UnifiedAttendeeData format for the form components
      attendeeId: 'lodge-booking-contact',
      attendeeType: 'mason' as const,
      title: '', // lodgeCustomer doesn't have title
      firstName: lodgeCustomer.firstName || '',
      lastName: lodgeCustomer.lastName || '',
      suffix: '', // lodgeCustomer doesn't have suffix
      rank: '', // lodgeCustomer doesn't have rank
      grandOfficerStatus: undefined, // lodgeCustomer doesn't have grand officer fields
      presentGrandOfficerRole: '', // lodgeCustomer doesn't have grand officer fields
      otherGrandOfficerRole: '', // lodgeCustomer doesn't have grand officer fields
      primaryEmail: lodgeCustomer.email || '',
      primaryPhone: lodgeCustomer.mobile || '',
      phone: lodgeCustomer.mobile || '', // Use mobile as phone fallback
      dietaryRequirements: '', // lodgeCustomer doesn't have dietary requirements
      additionalInfo: '', // lodgeCustomer doesn't have additional info
      contactPreference: 'directly' as const,
      isPrimary: true,
      isPartner: null,
      partner: null,
    } as UnifiedAttendeeData;

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
            data={customerData}
            type="mason"
            isPrimary={true}
            onChange={handleChange}
            isMasonicOrder={delegationTypeTab === 'masonicOrder'}
          />
          
          {/* Show Grand Officer fields when rank is GL or MO */}
          {(lodgeCustomer.rank === 'GL' || lodgeCustomer.rank === 'MO') && (
            <GrandOfficerFields 
              data={customerData}
              onChange={handleChange}
              required={true}
              isMasonicOrder={delegationTypeTab === 'masonicOrder'}
            />
          )}
          
          {/* Use the existing ContactInfo component */}
          <ContactInfo 
            data={customerData}
            isPrimary={true}
            onChange={handleChange}
            onChangeImmediate={onFieldChangeImmediate}
          />
        </div>
      </div>
    );
  }
  
  // Original attendee mode
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
          data={attendee!}
          type="mason"
          isPrimary={true}
          onChange={handleChange}
          isMasonicOrder={delegationTypeTab === 'masonicOrder'}
        />
        
        {/* Show Grand Officer fields when rank is GL or MO */}
        {(attendee!.rank === 'GL' || attendee!.rank === 'MO') && (
          <GrandOfficerFields 
            data={attendee!}
            onChange={handleChange}
            required={true}
            isMasonicOrder={delegationTypeTab === 'masonicOrder'}
          />
        )}
        
        {/* Use the existing ContactInfo component */}
        <ContactInfo 
          data={attendee!}
          isPrimary={true}
          onChange={handleChange}
          onChangeImmediate={onFieldChangeImmediate}
        />
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison to prevent unnecessary re-renders
  if (prevProps.mode !== nextProps.mode) return false;
  
  if (prevProps.mode === 'customer' || nextProps.mode === 'customer') {
    // For customer mode, we rely on store updates
    return (
      prevProps.disabled === nextProps.disabled &&
      prevProps.updateOnBlur === nextProps.updateOnBlur &&
      prevProps.className === nextProps.className &&
      prevProps.required === nextProps.required &&
      JSON.stringify(prevProps.fieldErrors) === JSON.stringify(nextProps.fieldErrors)
    );
  }
  
  if (prevProps.mode === 'booking' || nextProps.mode === 'booking') {
    // For booking mode, compare booking contact fields
    return (
      prevProps.bookingContact?.title === nextProps.bookingContact?.title &&
      prevProps.bookingContact?.firstName === nextProps.bookingContact?.firstName &&
      prevProps.bookingContact?.lastName === nextProps.bookingContact?.lastName &&
      prevProps.bookingContact?.email === nextProps.bookingContact?.email &&
      prevProps.bookingContact?.phone === nextProps.bookingContact?.phone &&
      prevProps.bookingContact?.rank === nextProps.bookingContact?.rank &&
      prevProps.bookingContact?.grandRank === nextProps.bookingContact?.grandRank &&
      prevProps.bookingContact?.grandOfficerStatus === nextProps.bookingContact?.grandOfficerStatus &&
      prevProps.bookingContact?.grandOffice === nextProps.bookingContact?.grandOffice &&
      prevProps.bookingContact?.otherGrandOffice === nextProps.bookingContact?.otherGrandOffice &&
      prevProps.bookingContact?.organisationName === nextProps.bookingContact?.organisationName &&
      prevProps.bookingContact?.organisationAbbreviation === nextProps.bookingContact?.organisationAbbreviation &&
      prevProps.bookingContact?.organisationKnownAs === nextProps.bookingContact?.organisationKnownAs &&
      prevProps.disabled === nextProps.disabled &&
      prevProps.updateOnBlur === nextProps.updateOnBlur &&
      prevProps.className === nextProps.className &&
      prevProps.required === nextProps.required &&
      prevProps.delegationTypeTab === nextProps.delegationTypeTab &&
      prevProps.onFieldChange === nextProps.onFieldChange &&
      prevProps.onFieldChangeImmediate === nextProps.onFieldChangeImmediate
    );
  }
  
  // Original attendee mode comparison
  return (
    prevProps.attendee?.attendeeId === nextProps.attendee?.attendeeId &&
    prevProps.attendee?.title === nextProps.attendee?.title &&
    prevProps.attendee?.firstName === nextProps.attendee?.firstName &&
    prevProps.attendee?.lastName === nextProps.attendee?.lastName &&
    prevProps.attendee?.rank === nextProps.attendee?.rank &&
    prevProps.attendee?.suffix === nextProps.attendee?.suffix &&
    prevProps.attendee?.grandOfficerStatus === nextProps.attendee?.grandOfficerStatus &&
    prevProps.attendee?.presentGrandOfficerRole === nextProps.attendee?.presentGrandOfficerRole &&
    prevProps.attendee?.otherGrandOfficerRole === nextProps.attendee?.otherGrandOfficerRole &&
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