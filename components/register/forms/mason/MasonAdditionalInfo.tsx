import React, { useState, useEffect, useCallback, useRef } from 'react';
// import { MasonData } from '../../../../shared/types/register'; // Removed
import { MasonAttendee } from '@/lib/registration-types'; // Added

interface MasonAdditionalInfoProps {
  mason: Pick<MasonAttendee, 'dietaryRequirements' | 'specialNeeds'>; // Changed
  id: string;
  onChange: (
    id: string, 
    field: keyof Pick<MasonAttendee, 'dietaryRequirements' | 'specialNeeds'>, 
    value: MasonAttendee[keyof Pick<MasonAttendee, 'dietaryRequirements' | 'specialNeeds'>]
  ) => void;
}

const MasonAdditionalInfo: React.FC<MasonAdditionalInfoProps> = ({
  mason,
  id,
  onChange,
}) => {
  // Create refs for inputs
  const dietaryRequirementsRef = useRef<HTMLInputElement>(null);
  const specialNeedsRef = useRef<HTMLTextAreaElement>(null);
  
  // Create a ref to store the latest props
  const masonRef = useRef(mason);
  
  // Update the ref when props change
  useEffect(() => {
    masonRef.current = mason;
  }, [mason]);
  
  // Track interaction states for styling
  const [dietaryRequirementsInteracted, setDietaryRequirementsInteracted] = useState(false);
  const [specialNeedsInteracted, setSpecialNeedsInteracted] = useState(false);
  return (
    <>
      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor={`dietaryRequirements-${id}`}>
          Dietary Requirements
        </label>
        <input
          type="text"
          id={`dietaryRequirements-${id}`}
          name={`dietaryRequirements`}
          ref={dietaryRequirementsRef}
          defaultValue={mason.dietaryRequirements || ''}
          onBlur={() => {
            setDietaryRequirementsInteracted(true);
            const newValue = dietaryRequirementsRef.current?.value || '';
            const currentValue = masonRef.current.dietaryRequirements || '';
            
            // Only update if value has changed
            if (newValue !== currentValue) {
              onChange(id, 'dietaryRequirements', newValue);
            }
          }}
          placeholder="E.g., vegetarian, gluten-free, allergies"
          className={`w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 
                    ${dietaryRequirementsInteracted ? 'interacted' : ''}`}
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor={`specialNeeds-${id}`}>
          Special Needs or Accessibility Requirements
        </label>
        <textarea
          id={`specialNeeds-${id}`}
          name={`specialNeeds`}
          ref={specialNeedsRef}
          defaultValue={mason.specialNeeds || ''}
          onBlur={() => {
            setSpecialNeedsInteracted(true);
            const newValue = specialNeedsRef.current?.value || '';
            const currentValue = masonRef.current.specialNeeds || '';
            
            // Only update if value has changed
            if (newValue !== currentValue) {
              onChange(id, 'specialNeeds', newValue);
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

export default MasonAdditionalInfo;