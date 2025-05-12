import React from 'react';
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
          value={guest.dietaryRequirements || ''}
          onChange={(e) => onChange(id, 'dietaryRequirements', e.target.value || undefined)}
          placeholder="E.g., vegetarian, gluten-free, allergies"
          className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor={`guestSpecialNeeds-${id}`}>
          Special Needs or Accessibility Requirements
        </label>
        <textarea
          id={`guestSpecialNeeds-${id}`}
          name="specialNeeds"
          value={guest.specialNeeds || ''}
          onChange={(e) => onChange(id, 'specialNeeds', e.target.value || undefined)}
          rows={2}
          className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
        ></textarea>
      </div>
    </>
  );
};

export default GuestAdditionalInfo;