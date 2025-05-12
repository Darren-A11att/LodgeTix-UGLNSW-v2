import React from 'react';
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
  return (
    <>
      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor={`dietaryRequirements-${id}`}>
          Dietary Requirements
        </label>
        <input
          type="text"
          id={`dietaryRequirements-${id}`}
          name={`dietaryRequirements`} // Changed name
          value={mason.dietaryRequirements || ''} // Changed field
          onChange={(e) => onChange(id, 'dietaryRequirements', e.target.value)} // Changed field
          placeholder="E.g., vegetarian, gluten-free, allergies"
          className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor={`specialNeeds-${id}`}>
          Special Needs or Accessibility Requirements
        </label>
        <textarea
          id={`specialNeeds-${id}`}
          name={`specialNeeds`} // Changed name
          value={mason.specialNeeds || ''} // Changed field
          onChange={(e) => onChange(id, 'specialNeeds', e.target.value)} // Changed field
          rows={2}
          className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
        ></textarea>
      </div>
    </>
  );
};

export default MasonAdditionalInfo;