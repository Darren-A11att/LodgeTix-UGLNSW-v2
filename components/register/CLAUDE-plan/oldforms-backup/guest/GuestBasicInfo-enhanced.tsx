import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GuestAttendee } from '@/lib/registration-types';
import { HelpCircle } from 'lucide-react';
import type { UnifiedAttendeeData } from '../../../../lib/registrationStore';

interface EnhancedGuestBasicInfoProps {
  guest: GuestAttendee | null;
  id: string;
  onChange: <K extends keyof GuestAttendee>(
    id: string, 
    field: K,
    value: GuestAttendee[K]
  ) => void;
  titles?: readonly string[];
  allMasons?: UnifiedAttendeeData[];
  primaryMasonId?: string;
  customRelationshipOptions?: readonly string[] | null; // For partners
  isPartner?: boolean;
}

const EnhancedGuestBasicInfo: React.FC<EnhancedGuestBasicInfoProps> = ({
  guest,
  id,
  onChange,
  titles = ["Mr", "Mrs", "Ms", "Miss", "Dr", "Rev", "Prof", "Hon"],
  allMasons = [],
  primaryMasonId,
  customRelationshipOptions,
  isPartner = false,
}) => {
  // Create refs for form inputs
  const titleRef = useRef<HTMLSelectElement>(null);
  const firstNameRef = useRef<HTMLInputElement>(null);
  const lastNameRef = useRef<HTMLInputElement>(null);
  const relatedAttendeeIdRef = useRef<HTMLSelectElement>(null);
  const relationshipRef = useRef<HTMLSelectElement>(null);

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
  const [relationshipInteracted, setRelationshipInteracted] = useState(false);

  if (!guest) {
    return <div>Loading guest information...</div>;
  }

  return (
    <div className="mb-4">
      <h4 className="text-lg font-bold mb-3 text-primary">Basic Information</h4>
      <div className="grid grid-cols-12 gap-4">
        {/* Relationship field - either dropdown for partner or Guest Of for regular guest */}
        <div className="col-span-4">
          {customRelationshipOptions ? (
            <>
              <label
                className="block text-sm font-medium text-slate-700 mb-1"
                htmlFor={`relationship-${id}`}
              >
                Relationship *
              </label>
              <select
                id={`relationship-${id}`}
                name={`relationship-${id}`}
                ref={relationshipRef}
                defaultValue={(guest as any).relationship || ''}
                onBlur={() => {
                  setRelationshipInteracted(true);
                  if (guest) {
                    const newValue = relationshipRef.current?.value || '';
                    const currentValue = (guestRef.current as any)?.relationship || '';
                    
                    if (newValue !== currentValue) {
                      onChange(id, 'relationship' as any, newValue);
                    }
                  }
                }}
                required
                className={`w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 
                           ${relationshipInteracted ? 'interacted' : ''} 
                           [&.interacted:invalid]:border-red-500 focus:[&.interacted:invalid]:border-red-500 focus:[&.interacted:invalid]:ring-red-500`}
              >
                <option value="" disabled>Select Relationship</option>
                {customRelationshipOptions.map((rel) => (
                  <option key={rel} value={rel}>
                    {rel}
                  </option>
                ))}
              </select>
            </>
          ) : (
            <>
              <label
                className="block text-sm font-medium text-slate-700 mb-1"
                htmlFor={`guestOf-${id}`}
              >
                Guest Of *
                <div className="relative inline-block ml-1 group align-middle">
                  <HelpCircle className="h-4 w-4 text-primary cursor-help" />
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 -translate-y-1 invisible group-hover:visible bg-white text-slate-700 text-xs p-2 rounded shadow-lg w-48 z-10">
                    Select the Mason this guest is associated with
                  </div>
                </div>
              </label>
              <select
                id={`guestOf-${id}`}
                name={`guestOf-${id}`}
                ref={relatedAttendeeIdRef}
                defaultValue={guest?.relatedAttendeeId || primaryMasonId || ''}
                onBlur={() => {
                  if (guest) {
                    const newValue = relatedAttendeeIdRef.current?.value || '';
                    const currentValue = guestRef.current?.relatedAttendeeId || '';
                    
                    if (newValue !== currentValue) {
                      onChange(id, 'relatedAttendeeId' as any, newValue);
                    }
                  }
                }}
                required
                className={`w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50`}
              >
                <option value="" disabled>Select Mason</option>
                {allMasons.map((mason) => (
                  <option key={mason.attendeeId} value={mason.attendeeId}>
                    {`${mason.firstName || ''} ${mason.lastName || ''}`.trim()}
                  </option>
                ))}
              </select>
            </>
          )}
        </div>
        
        {/* Title */}
        <div className="col-span-2">
          <label
            className="block text-sm font-medium text-slate-700 mb-1"
            htmlFor={`title-${id}`}
          >
            Title *
          </label>
          <select
            id={`title-${id}`}
            name={`title-${id}`}
            ref={titleRef}
            defaultValue={guest?.title || ''}
            onBlur={() => {
              setTitleInteracted(true);
              if (guest) {
                const newValue = titleRef.current?.value || '';
                const currentValue = guestRef.current?.title || '';
                
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
        
        {/* First Name */}
        <div className="col-span-3">
          <label
            className="block text-sm font-medium text-slate-700 mb-1"
            htmlFor={`firstName-${id}`}
          >
            First Name *
          </label>
          <input
            type="text"
            id={`firstName-${id}`}
            name={`firstName-${id}`}
            ref={firstNameRef}
            defaultValue={guest?.firstName || ''}
            onBlur={() => {
              setFirstNameInteracted(true);
              if (guest) {
                const newValue = firstNameRef.current?.value || '';
                const currentValue = guestRef.current?.firstName || '';
                
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
        
        {/* Last Name */}
        <div className="col-span-3">
          <label
            className="block text-sm font-medium text-slate-700 mb-1"
            htmlFor={`lastName-${id}`}
          >
            Last Name *
          </label>
          <input
            type="text"
            id={`lastName-${id}`}
            name={`lastName-${id}`}
            ref={lastNameRef}
            defaultValue={guest?.lastName || ''}
            onBlur={() => {
              setLastNameInteracted(true);
              if (guest) {
                const newValue = lastNameRef.current?.value || '';
                const currentValue = guestRef.current?.lastName || '';
                
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
    </div>
  );
};

export default EnhancedGuestBasicInfo;