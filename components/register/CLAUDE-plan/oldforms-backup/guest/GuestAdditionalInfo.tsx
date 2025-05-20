import React, { useState, useEffect, useRef } from 'react';
// import { GuestData } from '../../../../shared/types/register'; // Old
import { GuestAttendee } from '@/lib/registration-types'; // New

interface GuestAdditionalInfoProps {
  guest: GuestAttendee | null; // Updated
  id: string; // guest.id
  onChange: (
    id: string, 
    field: keyof Pick<GuestAttendee, 'dietaryRequirements' | 'specialNeeds'>, 
    value: string | undefined // Value can be string or undefined for these optional fields
  ) => void; // Updated
}

const GuestAdditionalInfo: React.FC<GuestAdditionalInfoProps> = ({
  guest,
  id,
  onChange
}) => {
  // Create refs for form inputs
  const dietaryRequirementsRef = useRef<HTMLInputElement>(null);
  const specialNeedsRef = useRef<HTMLTextAreaElement>(null);
  
  // Create a ref to store the latest props
  const guestRef = useRef(guest);
  
  // Update the ref when props change
  useEffect(() => {
    if (guest) {
      guestRef.current = guest;
    }
  }, [guest]);
  
  // Interaction states for styling
  const [dietaryRequirementsInteracted, setDietaryRequirementsInteracted] = useState(false);
  const [specialNeedsInteracted, setSpecialNeedsInteracted] = useState(false);

  if (!guest) {
    return null; // Or some loading/placeholder state
  }

  return (
    <>
      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor={`guestDietary-${id}`}>
          Dietary Requirements
        </label>
        <input
          type="text"
          id={`guestDietary-${id}`}
          name="dietaryRequirements"
          ref={dietaryRequirementsRef}
          defaultValue={guest?.dietaryRequirements || ''}
          onBlur={() => {
            setDietaryRequirementsInteracted(true);
            if (guest) {
              const newValue = dietaryRequirementsRef.current?.value || '';
              const currentValue = guestRef.current?.dietaryRequirements || '';
              
              // Only update if value has changed
              if (newValue !== currentValue) {
                onChange(id, 'dietaryRequirements', newValue || undefined);
              }
            }
          }}
          placeholder="E.g., vegetarian, gluten-free, allergies"
          className={`w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 
                    ${dietaryRequirementsInteracted ? 'interacted' : ''}`}
        />
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor={`guestSpecialNeeds-${id}`}>
          Special Needs or Accessibility Requirements
        </label>
        <textarea
          id={`guestSpecialNeeds-${id}`}
          name="specialNeeds"
          ref={specialNeedsRef}
          defaultValue={guest?.specialNeeds || ''}
          onBlur={() => {
            setSpecialNeedsInteracted(true);
            if (guest) {
              const newValue = specialNeedsRef.current?.value || '';
              const currentValue = guestRef.current?.specialNeeds || '';
              
              // Only update if value has changed
              if (newValue !== currentValue) {
                onChange(id, 'specialNeeds', newValue || undefined);
              }
            }
          }}
          rows={2}
          className={`w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 
                    ${specialNeedsInteracted ? 'interacted' : ''}`}
        ></textarea>
      </div>
    </>
  );
};

export default GuestAdditionalInfo;