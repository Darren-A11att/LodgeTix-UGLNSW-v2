import React, { useState } from 'react';
// import { MasonData } from '../../../../shared/types/register'; // Removed
import { MasonAttendee, GrandOfficerStatus, PresentGrandOfficerRole } from '@/lib/registration-types'; // Added

interface MasonGrandLodgeFieldsProps {
  mason: MasonAttendee; // Changed
  id: string;
  onChange: (
    id: string, 
    field: keyof Pick<MasonAttendee, 'grandRank' | 'grandOfficerStatus' | 'presentGrandOfficerRole' | 'otherGrandOfficerRole'>, 
    value: MasonAttendee[keyof Pick<MasonAttendee, 'grandRank' | 'grandOfficerStatus' | 'presentGrandOfficerRole' | 'otherGrandOfficerRole'>]
  ) => void;
  isPrimary?: boolean;
}

const MasonGrandLodgeFields: React.FC<MasonGrandLodgeFieldsProps> = ({
  mason,
  id,
  onChange,
  isPrimary = false,
}) => {
  // Internal definitions for GL options
  const grandOfficerStatusOptions: GrandOfficerStatus[] = ["Present", "Past"]; // Aligned with type
  const grandOfficeOptions: PresentGrandOfficerRole[] = [
    // "Please Select", // Removed - handled by initial value or empty string option
    "Grand Master",
    "Deputy Grand Master",
    "Assistant Grand Master",
    "Grand Secretary",
    "Grand Director of Ceremonies",
    "Other"
  ];
  
  // Show "Other" input field for Grand Office when "Other" is selected
  const showOtherGrandOfficeInput = mason.grandOfficerStatus === 'Present' && mason.presentGrandOfficerRole === 'Other'; // Changed fields

  // Interaction states
  const [grandRankInteracted, setGrandRankInteracted] = useState(false);
  const [grandOfficerInteracted, setGrandOfficerInteracted] = useState(false);
  const [grandOfficeInteracted, setGrandOfficeInteracted] = useState(false);
  const [grandOfficeOtherInteracted, setGrandOfficeOtherInteracted] = useState(false);

  return (
    <div className="grid grid-cols-12 gap-4 mb-4 bg-primary/5 p-4 rounded-md border border-primary/10">
      {/* Grand Rank Input */}
      <div className="col-span-2">
        <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor={`grandRank-${id}`}>
          Grand Rank {isPrimary && "*"}
        </label>
        <input
          type="text"
          id={`grandRank-${id}`}
          name={`grandRank`} // Field name for onChange
          value={mason.grandRank || ''}
          onChange={(e) => onChange(id, 'grandRank', e.target.value as MasonAttendee[keyof Pick<MasonAttendee, 'grandRank' | 'grandOfficerStatus' | 'presentGrandOfficerRole' | 'otherGrandOfficerRole'>])}
          onBlur={() => setGrandRankInteracted(true)}
          required={isPrimary && mason.rank === "GL"}
          maxLength={6}
          placeholder="PGRNK"
          className={`w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 
                     ${grandRankInteracted ? 'interacted' : ''} 
                     [&.interacted:invalid]:border-red-500 [&.interacted:invalid]:text-red-600 
                     focus:[&.interacted:invalid]:border-red-500 focus:[&.interacted:invalid]:ring-red-500`}
        />
      </div>
      
      {/* Grand Officer Status */}
      <div className="col-span-2">
        <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor={`grandOfficerStatus-${id}`}>
          Grand Officer {isPrimary && "*"}
        </label>
        <select
          id={`grandOfficerStatus-${id}`}
          name={`grandOfficerStatus`} // Field name for onChange
          value={mason.grandOfficerStatus || 'Past'} // Changed field
          onChange={(e) => onChange(id, 'grandOfficerStatus', e.target.value as GrandOfficerStatus)}
          onBlur={() => setGrandOfficerInteracted(true)}
          required={isPrimary && mason.rank === "GL"}
          className={`w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 
                     ${grandOfficerInteracted ? 'interacted' : ''} 
                     [&.interacted:invalid]:border-red-500 focus:[&.interacted:invalid]:border-red-500 focus:[&.interacted:invalid]:ring-red-500`}
        >
          {grandOfficerStatusOptions.map(status => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
      </div>
      
      {/* Show Grand Office field if Present is selected */}
      {mason.grandOfficerStatus === 'Present' && ( // Changed field
        <>
          <div className={`${showOtherGrandOfficeInput ? 'col-span-4' : 'col-span-4'}`}>
            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor={`presentGrandOfficerRole-${id}`}>
              Grand Office {isPrimary && "*"}
            </label>
            <select
              id={`presentGrandOfficerRole-${id}`}
              name={`presentGrandOfficerRole`} // Field name for onChange
              value={mason.presentGrandOfficerRole || ''} // Changed field, provide empty string for placeholder option
              onChange={(e) => onChange(id, 'presentGrandOfficerRole', e.target.value as PresentGrandOfficerRole)}
              onBlur={() => setGrandOfficeInteracted(true)}
              required={isPrimary && mason.rank === "GL" && mason.grandOfficerStatus === 'Present'} // Changed field
              className={`w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 
                         ${grandOfficeInteracted ? 'interacted' : ''} 
                         [&.interacted:invalid]:border-red-500 focus:[&.interacted:invalid]:border-red-500 focus:[&.interacted:invalid]:ring-red-500`}
            >
              <option value="" disabled>Please Select</option> {/* Added placeholder option */}
              {grandOfficeOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
          
          {/* Show text field if "Other" is selected */}
          {showOtherGrandOfficeInput && (
            <div className="col-span-4">
              <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor={`otherGrandOfficerRole-${id}`}>
                Other Grand Office {isPrimary && "*"}
              </label>
              <input
                type="text"
                id={`otherGrandOfficerRole-${id}`}
                name={`otherGrandOfficerRole`} // Field name for onChange
                value={mason.otherGrandOfficerRole || ''} // Changed field
                onChange={(e) => onChange(id, 'otherGrandOfficerRole', e.target.value as MasonAttendee[keyof Pick<MasonAttendee, 'grandRank' | 'grandOfficerStatus' | 'presentGrandOfficerRole' | 'otherGrandOfficerRole'>])}
                onBlur={() => setGrandOfficeOtherInteracted(true)}
                placeholder=""
                required={isPrimary && mason.rank === "GL" && mason.grandOfficerStatus === 'Present' && mason.presentGrandOfficerRole === 'Other'} // Changed fields
                className={`w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 
                           ${grandOfficeOtherInteracted ? 'interacted' : ''} 
                           [&.interacted:invalid]:border-red-500 [&.interacted:invalid]:text-red-600 
                           focus:[&.interacted:invalid]:border-red-500 focus:[&.interacted:invalid]:ring-red-500`}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MasonGrandLodgeFields;