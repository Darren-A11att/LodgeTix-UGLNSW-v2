import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  
  // Create refs for form inputs
  const grandRankRef = useRef<HTMLInputElement>(null);
  const grandOfficerStatusRef = useRef<HTMLSelectElement>(null);
  const presentGrandOfficerRoleRef = useRef<HTMLSelectElement>(null);
  const otherGrandOfficerRoleRef = useRef<HTMLInputElement>(null);
  
  // Create a ref to store the latest props
  const masonRef = useRef(mason);
  
  // Update the ref when props change
  useEffect(() => {
    masonRef.current = mason;
  }, [mason]);
  
  // Track state for showing "Other" input field
  const [grandOfficerStatus, setGrandOfficerStatus] = useState<GrandOfficerStatus>(mason.grandOfficerStatus || 'Past');
  const [presentGrandOfficerRole, setPresentGrandOfficerRole] = useState<PresentGrandOfficerRole | ''>(mason.presentGrandOfficerRole || '');
  
  // Show "Other" input field for Grand Office when "Other" is selected
  const showOtherGrandOfficeInput = grandOfficerStatus === 'Present' && presentGrandOfficerRole === 'Other';

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
          name={`grandRank`}
          ref={grandRankRef}
          defaultValue={mason.grandRank || ''}
          onBlur={() => {
            setGrandRankInteracted(true);
            const newValue = grandRankRef.current?.value || '';
            const currentValue = masonRef.current.grandRank || '';
            
            // Only update if value has changed
            if (newValue !== currentValue) {
              onChange(id, 'grandRank', newValue);
            }
          }}
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
          name={`grandOfficerStatus`}
          ref={grandOfficerStatusRef}
          defaultValue={mason.grandOfficerStatus || 'Past'}
          onChange={(e) => {
            const newValue = e.target.value as GrandOfficerStatus;
            setGrandOfficerStatus(newValue); // Update local state for conditional rendering
          }}
          onBlur={() => {
            setGrandOfficerInteracted(true);
            const newValue = grandOfficerStatusRef.current?.value as GrandOfficerStatus || 'Past';
            const currentValue = masonRef.current.grandOfficerStatus || 'Past';
            
            // Only update if value has changed
            if (newValue !== currentValue) {
              onChange(id, 'grandOfficerStatus', newValue);
            }
          }}
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
      {grandOfficerStatus === 'Present' && (
        <>
          <div className={`${showOtherGrandOfficeInput ? 'col-span-4' : 'col-span-4'}`}>
            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor={`presentGrandOfficerRole-${id}`}>
              Grand Office {isPrimary && "*"}
            </label>
            <select
              id={`presentGrandOfficerRole-${id}`}
              name={`presentGrandOfficerRole`}
              ref={presentGrandOfficerRoleRef}
              defaultValue={mason.presentGrandOfficerRole || ''}
              onChange={(e) => {
                const value = e.target.value as PresentGrandOfficerRole;
                setPresentGrandOfficerRole(value); // Update local state for conditional rendering
              }}
              onBlur={() => {
                setGrandOfficeInteracted(true);
                if (grandOfficerStatus === 'Present') {
                  const newValue = presentGrandOfficerRoleRef.current?.value as PresentGrandOfficerRole || '';
                  const currentValue = masonRef.current.presentGrandOfficerRole || '';
                  
                  // Only update if value has changed
                  if (newValue !== currentValue) {
                    onChange(id, 'presentGrandOfficerRole', newValue);
                  }
                }
              }}
              required={isPrimary && mason.rank === "GL" && mason.grandOfficerStatus === 'Present'}
              className={`w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 
                         ${grandOfficeInteracted ? 'interacted' : ''} 
                         [&.interacted:invalid]:border-red-500 focus:[&.interacted:invalid]:border-red-500 focus:[&.interacted:invalid]:ring-red-500`}
            >
              <option value="" disabled>Please Select</option>
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
                name={`otherGrandOfficerRole`}
                ref={otherGrandOfficerRoleRef}
                defaultValue={mason.otherGrandOfficerRole || ''}
                onBlur={() => {
                  setGrandOfficeOtherInteracted(true);
                  if (showOtherGrandOfficeInput) {
                    const newValue = otherGrandOfficerRoleRef.current?.value || '';
                    const currentValue = masonRef.current.otherGrandOfficerRole || '';
                    
                    // Only update if value has changed
                    if (newValue !== currentValue) {
                      onChange(id, 'otherGrandOfficerRole', newValue);
                    }
                  }
                }}
                placeholder=""
                required={isPrimary && mason.rank === "GL" && mason.grandOfficerStatus === 'Present' && mason.presentGrandOfficerRole === 'Other'}
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