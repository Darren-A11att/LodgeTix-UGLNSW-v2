import React, { useState, useRef, useEffect } from 'react';
import { MasonAttendee } from '@/lib/registration-types';

interface MasonBasicInfoProps {
  mason: MasonAttendee;
  id: string;
  onChange: (attendeeId: string, field: keyof Pick<MasonAttendee, 'firstName' | 'lastName' | 'rank'>, value: any) => void;
  isPrimary?: boolean;
  handleTitleChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  titles: string[];
  ranks: { value: string; label: string; }[];
}

const MasonBasicInfo: React.FC<MasonBasicInfoProps> = ({
  mason,
  id,
  onChange,
  isPrimary = false,
  handleTitleChange,
  titles,
  ranks,
}) => {
  // Interaction states for validation styling
  const [titleInteracted, setTitleInteracted] = useState(false);
  const [firstNameInteracted, setFirstNameInteracted] = useState(false);
  const [lastNameInteracted, setLastNameInteracted] = useState(false);
  const [rankInteracted, setRankInteracted] = useState(false);
  
  // Use refs for uncontrolled inputs
  const firstNameRef = useRef<HTMLInputElement>(null);
  const lastNameRef = useRef<HTMLInputElement>(null);
  const rankRef = useRef<HTMLSelectElement>(null);
  
  // Store the latest props values to avoid stale refs
  const masonRef = useRef(mason);
  useEffect(() => {
    masonRef.current = mason;
    
    // Update rank select element when props change
    if (rankRef.current && mason.rank && rankRef.current.value !== mason.rank) {
      rankRef.current.value = mason.rank;
    }
  }, [mason]);

  // Handlers for blur events
  const handleFirstNameBlur = () => {
    setFirstNameInteracted(true);
    if (firstNameRef.current && firstNameRef.current.value !== masonRef.current.firstName) {
      onChange(id, 'firstName', firstNameRef.current.value);
    }
  };

  const handleLastNameBlur = () => {
    setLastNameInteracted(true);
    if (lastNameRef.current && lastNameRef.current.value !== masonRef.current.lastName) {
      onChange(id, 'lastName', lastNameRef.current.value);
    }
  };

  const handleRankBlur = () => {
    setRankInteracted(true);
    if (rankRef.current && rankRef.current.value !== masonRef.current.rank) {
      onChange(id, 'rank', rankRef.current.value);
    }
  };

  // Handle title change (keeping as controlled for now as it's passed down)
  const handleTitleBlur = (e: React.FocusEvent<HTMLSelectElement>) => {
    setTitleInteracted(true);
  };

  return (
    <div className="grid grid-cols-12 gap-4 mb-4">
      {/* Masonic Title */}
      <div className="col-span-2">
        <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor={`title-${id}`}>
          Masonic Title {isPrimary && "*"}
        </label>
        <select
          id={`masonicTitle-${id}`}
          name="title"
          defaultValue={mason.title ?? ''}
          onChange={handleTitleChange}
          onBlur={handleTitleBlur}
          required={isPrimary}
          className={`w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 
                     ${titleInteracted ? 'interacted' : ''} 
                     [&.interacted:invalid]:border-red-500 focus:[&.interacted:invalid]:border-red-500 focus:[&.interacted:invalid]:ring-red-500`}
        >
          <option value="" disabled>Please Select</option>
          {titles.map(title => (
            <option key={title} value={title}>{title}</option>
          ))}
        </select>
      </div>
      
      {/* First Name */}
      <div className="col-span-4">
        <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor={`firstName-${id}`}>
          First Name {isPrimary && "*"}
        </label>
        <input
          type="text"
          id={`firstName-${id}`}
          name="firstName"
          ref={firstNameRef}
          defaultValue={mason.firstName || ''}
          onBlur={handleFirstNameBlur}
          required={isPrimary}
          className={`w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 
                     ${firstNameInteracted ? 'interacted' : ''} 
                     [&.interacted:invalid]:border-red-500 [&.interacted:invalid]:text-red-600 
                     focus:[&.interacted:invalid]:border-red-500 focus:[&.interacted:invalid]:ring-red-500`}
        />
      </div>
      
      {/* Last Name */}
      <div className="col-span-4">
        <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor={`lastName-${id}`}>
          Last Name {isPrimary && "*"}
        </label>
        <input
          type="text"
          id={`lastName-${id}`}
          name="lastName"
          ref={lastNameRef}
          defaultValue={mason.lastName || ''}
          onBlur={handleLastNameBlur}
          required={isPrimary}
          className={`w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 
                     ${lastNameInteracted ? 'interacted' : ''} 
                     [&.interacted:invalid]:border-red-500 [&.interacted:invalid]:text-red-600 
                     focus:[&.interacted:invalid]:border-red-500 focus:[&.interacted:invalid]:ring-red-500`}
        />
      </div>
      
      {/* Rank */}
      <div className="col-span-2">
        <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor={`rank-${id}`}>
          Rank {isPrimary && "*"}
        </label>
        <select
          id={`rank-${id}`}
          name="rank"
          ref={rankRef}
          value={mason.rank || ''}
          onChange={(e) => {
            // Immediately update value when selected - using direct value to ensure immediate update
            const newRank = e.target.value;
            console.log('Rank changed to:', newRank);
            onChange(id, 'rank', newRank);
          }}
          onBlur={handleRankBlur}
          required={isPrimary}
          className={`w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 
                     ${rankInteracted ? 'interacted' : ''} 
                     [&.interacted:invalid]:border-red-500 focus:[&.interacted:invalid]:border-red-500 focus:[&.interacted:invalid]:ring-red-500`}
        >
          <option value="" disabled>Please Select</option>
          {ranks.map(rank => (
            <option key={rank.value} value={rank.value}>{rank.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default MasonBasicInfo;