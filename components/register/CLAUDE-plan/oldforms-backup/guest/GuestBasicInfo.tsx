import React, { useState, useEffect, useCallback, useRef } from 'react';
// import { GuestData } from '../../../../shared/types/register'; // Old type removed
import { GuestAttendee } from '@/lib/registration-types'; // New type imported
import { HelpCircle } from 'lucide-react';
import { PhoneInput } from '@/components/ui/phone-input';
import type { UnifiedAttendeeData } from '../../../../lib/registrationStore'; // For Mason list

interface GuestBasicInfoProps {
  guest: GuestAttendee | null; // Updated prop type
  id: string; // id is the guest.id, should be string, but guest can be null
  onChange: <K extends keyof GuestAttendee>(
    id: string, 
    field: K,
    value: GuestAttendee[K]
  ) => void;
  titles?: string[]; // Optional titles
  allMasons?: UnifiedAttendeeData[]; // List of all Masons
  primaryMasonId?: string; // ID of the primary Mason
}

const GuestBasicInfo: React.FC<GuestBasicInfoProps> = ({
  guest,
  id,
  onChange,
  titles = ["Mr", "Mrs", "Ms", "Miss", "Dr", "Rev", "Prof", "Hon"], // Default titles
  allMasons = [], // Default to empty array
  primaryMasonId, // Destructure new props
}) => {
  // Create refs for form inputs
  const titleRef = useRef<HTMLSelectElement>(null);
  const firstNameRef = useRef<HTMLInputElement>(null);
  const lastNameRef = useRef<HTMLInputElement>(null);
  const relatedAttendeeIdRef = useRef<HTMLSelectElement>(null);

  // Create a ref to store the latest props
  const guestRef = useRef(guest);

  // Update the ref when props change
  useEffect(() => {
    if (guest) {
      guestRef.current = guest;
    }
  }, [guest]);

  // Interaction states
  const [titleInteracted, setTitleInteracted] = useState(false);
  const [firstNameInteracted, setFirstNameInteracted] = useState(false);
  const [lastNameInteracted, setLastNameInteracted] = useState(false);
  const [guestOfInteracted, setGuestOfInteracted] = useState(false); // Interaction state for new field

  // Track if component is in first render cycle
  const [initialized, setInitialized] = useState(false);

  // Use effect to set default relatedAttendeeId if not already set
  useEffect(() => {
    if (!initialized && guest && !guest.relatedAttendeeId && primaryMasonId) {
      onChange(id, 'relatedAttendeeId' as any, primaryMasonId); // Update parent state
      setInitialized(true);
    }
  }, [guest, primaryMasonId, onChange, id, initialized]); // Add dependencies

  if (!guest) {
    // Optionally render a loader or null, or let parent handle this possibility
    return null; 
  }

  return (
    <div className="grid grid-cols-12 gap-4 mb-4">
      {/* Guest Of Dropdown - Moved First */}
      <div className="col-span-2">
        <label
          className="block text-sm font-medium text-slate-700 mb-1"
          htmlFor={`guestOf-${id}`}
        >
          Guest Of *
        </label>
        <select
          id={`guestOf-${id}`}
          name={`guestOf-${id}`}
          ref={relatedAttendeeIdRef}
          defaultValue={guest?.relatedAttendeeId || primaryMasonId || ''}
          onBlur={() => {
            setGuestOfInteracted(true);
            if (guest) {
              const newValue = relatedAttendeeIdRef.current?.value || '';
              const currentValue = guestRef.current?.relatedAttendeeId || '';
              
              // Only update if value has changed
              if (newValue !== currentValue) {
                onChange(id, 'relatedAttendeeId' as any, newValue);
              }
            }
          }}
          required
          className={`w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 
                     ${guestOfInteracted ? 'interacted' : ''} 
                     [&.interacted:invalid]:border-red-500 focus:[&.interacted:invalid]:border-red-500 focus:[&.interacted:invalid]:ring-red-500`}
        >
          <option value="" disabled>Select Mason</option>
          {allMasons.map((mason) => (
            <option key={mason.attendeeId} value={mason.attendeeId}>
              {`${mason.firstName || ''} ${mason.lastName || ''}`.trim()}
            </option>
          ))}
        </select>
      </div>
      
      {/* Title - Moved Second */}
      <div className="col-span-2">
        <label
          className="block text-sm font-medium text-slate-700 mb-1"
          htmlFor={`guestTitle-${id}`}
        >
          Title *
        </label>
        <select
          id={`guestTitle-${id}`}
          name={`guestTitle-${id}`}
          ref={titleRef}
          defaultValue={guest?.title || ''}
          onBlur={() => {
            setTitleInteracted(true);
            if (guest) {
              const newValue = titleRef.current?.value || '';
              const currentValue = guestRef.current?.title || '';
              
              // Only update if value has changed
              if (newValue !== currentValue) {
                onChange(id, 'title', newValue);
              }
            }
          }}
          required
          className={`w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 
                     ${titleInteracted ? 'interacted' : ''} 
                     [&.interacted:invalid]:border-red-500 focus:[&.interacted:invalid]:border-red-500 focus:[&.interacted:invalid]:ring-red-500`}
        >
          <option value="" disabled>Select Title</option>
          {titles.map((title) => (
            <option key={title} value={title}>
              {title}
            </option>
          ))}
        </select>
      </div>
      
      {/* First Name Input */}
      <div className="col-span-4">
        <label
          className="block text-sm font-medium text-slate-700 mb-1"
          htmlFor={`guestFirstName-${id}`}
        >
          First Name *
        </label>
        <input
          type="text"
          id={`guestFirstName-${id}`}
          name={`guestFirstName-${id}`}
          ref={firstNameRef}
          defaultValue={guest?.firstName || ''}
          onBlur={() => {
            setFirstNameInteracted(true);
            if (guest) {
              const newValue = firstNameRef.current?.value || '';
              const currentValue = guestRef.current?.firstName || '';
              
              // Only update if value has changed
              if (newValue !== currentValue) {
                onChange(id, 'firstName', newValue);
              }
            }
          }}
          required
          className={`w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 
                     ${firstNameInteracted ? 'interacted' : ''} 
                     [&.interacted:invalid]:border-red-500 [&.interacted:invalid]:text-red-600 
                     focus:[&.interacted:invalid]:border-red-500 focus:[&.interacted:invalid]:ring-red-500`}
        />
      </div>
      
      {/* Last Name Input */}
      <div className="col-span-4">
        <label
          className="block text-sm font-medium text-slate-700 mb-1"
          htmlFor={`guestLastName-${id}`}
        >
          Last Name *
        </label>
        <input
          type="text"
          id={`guestLastName-${id}`}
          name={`guestLastName-${id}`}
          ref={lastNameRef}
          defaultValue={guest?.lastName || ''}
          onBlur={() => {
            setLastNameInteracted(true);
            if (guest) {
              const newValue = lastNameRef.current?.value || '';
              const currentValue = guestRef.current?.lastName || '';
              
              // Only update if value has changed
              if (newValue !== currentValue) {
                onChange(id, 'lastName', newValue);
              }
            }
          }}
          required
          className={`w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 
                     ${lastNameInteracted ? 'interacted' : ''} 
                     [&.interacted:invalid]:border-red-500 [&.interacted:invalid]:text-red-600 
                     focus:[&.interacted:invalid]:border-red-500 focus:[&.interacted:invalid]:ring-red-500`}
        />
      </div>
    </div>
  );
};

export default GuestBasicInfo;