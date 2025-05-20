import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { GrandLodgeRow } from '../../../../lib/api/grandLodges';
import { createLodge, LodgeRow } from '../../../../lib/api/lodges';
import MasonBasicInfo from './MasonBasicInfo';
import MasonGrandLodgeFields from './MasonGrandLodgeFields';
import MasonLodgeInfo from './MasonLodgeInfo';
import MasonContactInfo from './MasonContactInfo';
import MasonAdditionalInfo from './MasonAdditionalInfo';
import { X } from 'lucide-react';
import { PhoneInput } from '@/components/ui/phone-input';
import { useLocationStore } from '../../../../lib/locationStore';
import { useRegistrationStore, RegistrationState } from '../../../../lib/registrationStore';
import { UnifiedAttendeeData } from '../../../../shared/types/supabase';

interface MasonFormProps {
  attendeeId: string;
  attendeeNumber: number;
  isPrimary?: boolean;
}

// Define ContactPreference type based on enum + empty string
type ContactPreference = UnifiedAttendeeData['contactPreference'];

const MasonForm: React.FC<MasonFormProps> = ({
  attendeeId, 
  attendeeNumber,
  isPrimary = false,
}) => {
  // --- Get Data and Actions from Stores ---
  const grandLodges = useLocationStore((state: any) => state.grandLodges);
  const isLoadingGrandLodges = useLocationStore((state: any) => state.isLoadingGrandLodges);
  const grandLodgeError = useLocationStore((state: any) => state.grandLodgeError);
  const allLodgeSearchResults = useLocationStore((state: any) => state.allLodgeSearchResults);
  const isLoadingAllLodges = useLocationStore((state: any) => state.isLoadingAllLodges);
  const allLodgesError = useLocationStore((state: any) => state.allLodgesError);
  const fetchInitialGrandLodges = useLocationStore((state: any) => state.fetchInitialGrandLodges);
  const searchGrandLodges = useLocationStore((state: any) => state.searchGrandLodges);
  const searchAllLodgesAction = useLocationStore((state: any) => state.searchAllLodgesAction);
  const createLodgeAction = useLocationStore((state: any) => state.createLodge);

  const mason = useRegistrationStore(state => 
    state.attendees.find(att => att.attendeeId === attendeeId && att.attendeeType.toLowerCase() === 'mason')
  );
  
  // Fix the selector to not depend on the changing mason value
  const partnerId = mason?.partner;
  const ladyPartnerData = useRegistrationStore(useCallback(
    state => partnerId ? state.attendees.find(att => att.attendeeId === partnerId) : null,
    [partnerId]
  ));

  const primaryMasonData = useRegistrationStore(state => 
    state.attendees.find(att => att.isPrimary && att.attendeeType.toLowerCase() === 'mason')
  );
  
  const updateAttendee = useRegistrationStore((state) => state.updateAttendee);
  const removeAttendee = useRegistrationStore((state) => state.removeAttendee);
  const addLadyPartnerAttendee = useRegistrationStore((state) => state.addLadyPartnerAttendee);

  // Debounced version of updateAttendee with very short delay for better UI responsiveness
  const debouncedUpdateAttendee = useDebouncedCallback(updateAttendee, 50);

  if (!mason) {
      console.warn(`MasonForm rendered for non-existent/loading attendeeId: ${attendeeId}`);
      return <div className="bg-slate-50 p-6 rounded-lg mb-8 relative animate-pulse">Loading Mason...</div>; 
  }

  // --- Local UI State (like selects, inputs, creation UI) ---
  const [selectedGrandLodge, setSelectedGrandLodge] = useState<GrandLodgeRow | null>(null);
  const [selectedLodge, setSelectedLodge] = useState<LodgeRow | null>(null);
  const [grandLodgeInputValue, setGrandLodgeInputValue] = useState('');
  const [lodgeInputValue, setLodgeInputValue] = useState('');
  const [isCreatingLodgeUI, setIsCreatingLodgeUI] = useState(false);
  const [newLodgeName, setNewLodgeName] = useState('');
  const [newLodgeNumber, setNewLodgeNumber] = useState('');
  // State for the 'Use same lodge' checkbox - ensure it defaults to false
  const [useSameLodge, setUseSameLodge] = useState(false);

  // --- Component Constants ---
  const titles = ["Bro", "W Bro", "VW Bro", "RW Bro", "MW Bro"];
  const ranks = [
    { value: "EAF", label: "EAF" },
    { value: "FCF", label: "FCF" },
    { value: "MM", label: "MM" },
    { value: "IM", label: "IM" },
    { value: "GL", label: "GL" }
  ];
  const isGrandTitle = (title: string) => ["VW Bro", "RW Bro", "MW Bro"].includes(title);

  // Determine if contact fields should be hidden for non-primary masons
  const hideContactFieldsForMason = !isPrimary && mason.contactPreference !== 'Directly';

  // Determine if confirmation message should be shown for non-primary masons
  const showConfirmationForMason = !isPrimary && 
                                   (mason.contactPreference === 'PrimaryAttendee' || 
                                    mason.contactPreference === 'ProvideLater');

  // Function to get confirmation message for non-primary masons
  const getConfirmationMessageForMason = useCallback(() => {
    if (!isPrimary && primaryMasonData) {
      const primaryName = `${primaryMasonData.firstName || ''} ${primaryMasonData.lastName || ''}`.trim();
      if (mason.contactPreference === 'PrimaryAttendee') {
        return `I confirm that ${primaryName || 'the Primary Attendee'} will be responsible for all communication with this attendee.`
      }
      if (mason.contactPreference === 'ProvideLater') {
        return `I confirm that ${primaryName || 'the Primary Attendee'} will be responsible for all communication with this attendee until their contact details have been updated.`
      }
    }
    return "";
  }, [isPrimary, mason?.contactPreference, primaryMasonData]);

  // --- UPDATED Field Handlers with Debounce ---
  const handleFieldChange = useCallback((id: string, field: keyof UnifiedAttendeeData, value: any) => {
    // Ensure mason object is available before trying to update
    if (id === attendeeId && mason) {
      // Use immediate update for rank changes to ensure proper rendering of grand lodge fields
      if (field === 'rank') {
        console.log('Updating rank to:', value);
        updateAttendee(attendeeId, { [field]: value });
      } else {
        debouncedUpdateAttendee(attendeeId, { [field]: value });
      }
    } else {
      console.warn('handleFieldChange called with mismatched ID or missing mason data', { currentId: attendeeId, receivedId: id, masonExists: !!mason });
    }
  }, [debouncedUpdateAttendee, updateAttendee, attendeeId, mason]); // Add mason dependency

  const handlePhoneChange = useCallback((value: string) => {
      // Ensure mason object is available
      if (mason) {
        debouncedUpdateAttendee(attendeeId, { 'primaryPhone': value });
      }
  }, [debouncedUpdateAttendee, attendeeId, mason]); // Add mason dependency

  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    // Ensure mason object is available
    if (!mason) return;

    const newTitle = e.target.value;
    const currentRank = mason.rank; 

    let updates: Partial<UnifiedAttendeeData> = { title: newTitle };

    if (newTitle === 'W Bro') {
        if (currentRank !== 'GL') { 
            updates.rank = 'IM';
        }
    } else if (isGrandTitle(newTitle)) {
        updates.rank = 'GL';
    }
    
    // Using immediate update instead of debounced for title/rank changes
    // This ensures the rank dropdown updates immediately
    updateAttendee(attendeeId, updates);
  }, [updateAttendee, attendeeId, mason]); // Add mason dependency

  // --- Effects for GL/Lodge Selection and Initialization ---
  useEffect(() => {
      if (grandLodges.length === 0 && !isLoadingGrandLodges) {
          fetchInitialGrandLodges();
      }
  }, [grandLodges.length, isLoadingGrandLodges, fetchInitialGrandLodges]);

  useEffect(() => {
      if (mason.grandLodgeId && !selectedGrandLodge) {
          const initialGrandLodge = grandLodges.find(gl => gl.id === mason.grandLodgeId);
          if (initialGrandLodge) {
              setSelectedGrandLodge(initialGrandLodge);
              setGrandLodgeInputValue(initialGrandLodge.name);
          }
      }
  }, [mason.grandLodgeId, grandLodges, selectedGrandLodge]);

  // Keep track of previous lodge name for display purposes
  const lodgeNameRef = useRef<string | null>(null);
  const userIsTypingRef = useRef(false);
  const initialLoadDoneRef = useRef(false);
  
  useEffect(() => {
       // Skip if user is actively typing in the field - let them finish their edit
       if (userIsTypingRef.current) {
           return;
       }
       
       if (mason.lodgeId && !selectedLodge) {
           // First check if we can find it in the search results
           const foundLodge = allLodgeSearchResults.find(l => l.id === mason.lodgeId);
           if (foundLodge) {
               setSelectedLodge(foundLodge);
               const displayValue = foundLodge.display_name || `${foundLodge.name} No. ${foundLodge.number || 'N/A'}`;
               setLodgeInputValue(displayValue);
               lodgeNameRef.current = displayValue;
               
               if (foundLodge.grand_lodge_id && !selectedGrandLodge) {
                    const initialGrandLodge = grandLodges.find(gl => gl.id === foundLodge.grand_lodge_id);
                    if (initialGrandLodge) {
                        setSelectedGrandLodge(initialGrandLodge);
                        setGrandLodgeInputValue(initialGrandLodge.name);
                    }
               }
           } else if (mason.lodgeNameNumber) {
               // If we have a stored display name, use it
               setLodgeInputValue(mason.lodgeNameNumber);
               initialLoadDoneRef.current = true;
               
               // Try to kick off a search to find the full lodge data - but only once
               if (!isLoadingAllLodges && !initialLoadDoneRef.current) {
                   searchAllLodgesAction(mason.lodgeId);
                   initialLoadDoneRef.current = true;
               }
           } else if (lodgeNameRef.current) {
               // Use cached display name if available
               setLodgeInputValue(lodgeNameRef.current);
           } else {
               // Only display "looking up" message if we're doing the initial load
               if (!initialLoadDoneRef.current) {
                   setLodgeInputValue(`Looking up Lodge...`);
                   
                   // Try to fetch the lodge data - but only once on initial load
                   if (!isLoadingAllLodges) {
                       const searchWithId = async () => {
                           try {
                               await searchAllLodgesAction(mason.lodgeId);
                               initialLoadDoneRef.current = true;
                           } catch (err) {
                               // Error handled by returning fallback value
                               setLodgeInputValue(`Lodge: ${mason.lodgeId}`); 
                               initialLoadDoneRef.current = true;
                           }
                       };
                       searchWithId();
                   } else {
                       setLodgeInputValue(`Lodge: ${mason.lodgeId}`);
                       initialLoadDoneRef.current = true;
                   }
               }
           }
       } else if (!mason.lodgeId) {
           setSelectedLodge(null);
           setLodgeInputValue('');
           lodgeNameRef.current = null;
       }
  }, [mason.lodgeId, mason.lodgeNameNumber, allLodgeSearchResults, selectedLodge, grandLodges, selectedGrandLodge, isLoadingAllLodges, searchAllLodgesAction]);

  // --- Handlers for GL/Lodge Selection and Creation (Ensure these use debouncedUpdateAttendee where appropriate) ---
  const resetLodgeCreationUI = useCallback(() => {
    setIsCreatingLodgeUI(false);
    setNewLodgeName('');
    setNewLodgeNumber('');
  }, []);

  const handleGrandLodgeSelect = useCallback((selectedOption: GrandLodgeRow | null) => {
    setSelectedGrandLodge(selectedOption);
    setGrandLodgeInputValue(selectedOption ? selectedOption.name : '');
    const updates: Partial<UnifiedAttendeeData> = { grandLodgeId: selectedOption?.id || null };
    if (selectedOption) {
      // Clear selected lodge when GL changes
      setSelectedLodge(null);
      setLodgeInputValue('');
      updates.lodgeId = null;
      updates.lodgeNameNumber = null;
    }
    // Use debounced update
    debouncedUpdateAttendee(attendeeId, updates);
    resetLodgeCreationUI();
  }, [attendeeId, debouncedUpdateAttendee, resetLodgeCreationUI]);

  // Input change handlers primarily trigger searches,
  // the actual update happens on selection via handleGrandLodgeSelect/handleLodgeSelect.
  // So no debounced update needed directly in the input change handlers.
  
  // Fixed handleGrandLodgeInputChange function to match AutocompleteInput expectations
  const handleGrandLodgeInputChange = useCallback((value: string) => {
    setGrandLodgeInputValue(value);
    userIsTypingRef.current = true;
    if (value.length > 2) {
      searchGrandLodges(value);
    }
    setTimeout(() => {
      userIsTypingRef.current = false;
    }, 500);
  }, [searchGrandLodges]);
  
  // Fixed handleLodgeInputChange function to match AutocompleteInput expectations
  const handleLodgeInputChange = useCallback((value: string) => {
    setLodgeInputValue(value);
    userIsTypingRef.current = true;
    if (value.length > 2 && selectedGrandLodge) {
      searchAllLodgesAction(value, selectedGrandLodge.id);
    }
    setTimeout(() => {
      userIsTypingRef.current = false;
    }, 500);
  }, [searchAllLodgesAction, selectedGrandLodge]);

  const handleLodgeSelect = useCallback((selectedOption: LodgeRow | null) => {
    setSelectedLodge(selectedOption);
    let updates: Partial<UnifiedAttendeeData> = {};
    if (selectedOption) {
        const displayValue = selectedOption.display_name || `${selectedOption.name} No. ${selectedOption.number || 'N/A'}`;
        setLodgeInputValue(displayValue);
        lodgeNameRef.current = displayValue;
        updates.lodgeId = selectedOption.id;
        updates.lodgeNameNumber = displayValue;
        
        if (!selectedGrandLodge && selectedOption.grand_lodge_id) {
             const associatedGrandLodge = grandLodges.find(gl => gl.id === selectedOption.grand_lodge_id);
             if (associatedGrandLodge) {
                 setSelectedGrandLodge(associatedGrandLodge);
                 setGrandLodgeInputValue(associatedGrandLodge.name);
                 updates.grandLodgeId = associatedGrandLodge.id;
             }
        }
    } else {
        setLodgeInputValue('');
        lodgeNameRef.current = null;
        updates.lodgeId = null;
        updates.lodgeNameNumber = null;
    }
    // Use debounced update
    debouncedUpdateAttendee(attendeeId, updates);
    resetLodgeCreationUI();
    userIsTypingRef.current = false;
  }, [attendeeId, debouncedUpdateAttendee, resetLodgeCreationUI, selectedGrandLodge, grandLodges]);

  // Add missing handleInitiateLodgeCreation function
  const handleInitiateLodgeCreation = useCallback(() => {
    setIsCreatingLodgeUI(true);
  }, []);

  // Add missing handleCancelLodgeCreation function
  const handleCancelLodgeCreation = useCallback(() => {
    resetLodgeCreationUI();
  }, [resetLodgeCreationUI]);

  const handleConfirmNewLodge = useCallback(async () => {
    if (!newLodgeName || !selectedGrandLodge) {
      // Lodge creation requires both name and Grand Lodge
      return;
    }
    try {
      const newLodge = await createLodgeAction({
        name: newLodgeName,
        number: newLodgeNumber ? parseInt(newLodgeNumber, 10) : null,
        grand_lodge_id: selectedGrandLodge.id,
        display_name: `${newLodgeName} No. ${newLodgeNumber || 'N/A'}`
      });
      if (newLodge) {
        // Selecting the new lodge will trigger handleLodgeSelect, which uses debounce
        handleLodgeSelect(newLodge);
      }
      resetLodgeCreationUI();
    } catch (error) {
      // Creation failed, handled by returning undefined
    }
  }, [newLodgeName, newLodgeNumber, selectedGrandLodge, createLodgeAction, handleLodgeSelect, resetLodgeCreationUI]);

  // --- Lady Partner Handlers ---
  const handleLadyPartnerToggle = useCallback(() => {
      if (!mason) return; // Should not happen if mason is checked at the top

      if (mason.partner && ladyPartnerData) {
          // If partner link exists AND partner data is loaded, this toggle means REMOVE the partner
          // Removing lady partner
          removeAttendee(ladyPartnerData.attendeeId); 
      } else if (!mason.partner) {
          // If no partner link exists, this toggle means ADD a partner
          // Adding lady partner
          addLadyPartnerAttendee(mason.attendeeId);
      } else {
          // Edge case: mason.partner exists but ladyPartnerData is somehow not loaded yet
          // This case should be handled by the loading state in the render section
          // Edge case: partner exists but not loaded
      }
  }, [mason, ladyPartnerData, addLadyPartnerAttendee, removeAttendee]);

  // --- Other Handlers ---
  const getConfirmationMessage = useCallback(() => {
      if (!primaryMasonData) return "";
      const primaryFullName = `${primaryMasonData.firstName || ''} ${primaryMasonData.lastName || ''}`.trim();
      if (mason.contactPreference === "PrimaryAttendee") {
          return `I confirm that ${primaryFullName} will be responsible for all communication with this attendee`;
      } else if (mason.contactPreference === "ProvideLater") {
          return `I confirm that ${primaryFullName} will be responsible for all communication with this attendee until their contact details have been updated in their profile`;
      }
      return "";
  }, [primaryMasonData, mason.contactPreference]); 
  
  const handleRemoveSelf = useCallback(() => {
      removeAttendee(attendeeId);
  }, [removeAttendee, attendeeId]);

  // --- Handler for the 'Use same lodge as primary' checkbox (Already updated to use debouncedUpdateAttendee) ---
  const handleUseSameLodgeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    setUseSameLodge(isChecked);

    if (!isPrimary && mason && primaryMasonData) {
      let updates: Partial<UnifiedAttendeeData> = {};
      if (isChecked) {
        updates = {
          grandLodgeId: primaryMasonData.grandLodgeId,
          lodgeId: primaryMasonData.lodgeId,
          lodgeNameNumber: primaryMasonData.lodgeNameNumber,
        };
        if (primaryMasonData.grandLodgeId) {
          const primaryGL = grandLodges.find(gl => gl.id === primaryMasonData.grandLodgeId);
          if (primaryGL) {
            setSelectedGrandLodge(primaryGL);
            setGrandLodgeInputValue(primaryGL.name);
          }
        } else {
            setSelectedGrandLodge(null);
            setGrandLodgeInputValue('');
        }
        if (primaryMasonData.lodgeId) {
            const primaryLodge = allLodgeSearchResults.find(l => l.id === primaryMasonData.lodgeId);
            setSelectedLodge(primaryLodge || null);
            setLodgeInputValue(primaryMasonData.lodgeNameNumber || '');
            lodgeNameRef.current = primaryMasonData.lodgeNameNumber || null;
        } else {
            setSelectedLodge(null);
            setLodgeInputValue('');
            lodgeNameRef.current = null;
        }
      } else {
        updates = {
          grandLodgeId: null,
          lodgeId: null,
          lodgeNameNumber: null,
        };
        setSelectedGrandLodge(null);
        setGrandLodgeInputValue('');
        setSelectedLodge(null);
        setLodgeInputValue('');
        lodgeNameRef.current = null;
      }
      debouncedUpdateAttendee(attendeeId, updates); // Use attendeeId from props
    }
  }, [isPrimary, mason, primaryMasonData, debouncedUpdateAttendee, attendeeId, grandLodges, allLodgeSearchResults]);

  // Debug logs removed for performance

  return (
    <div className={`bg-slate-50 p-6 rounded-lg mb-8 relative`} id={`mason-form-${attendeeId}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-slate-800">
          {isPrimary ? 'Mason Attendee - Primary' : `Mason Attendee ${attendeeNumber}`}
        </h3>
        {!isPrimary && (
          <button 
            onClick={handleRemoveSelf} 
            className="text-red-500 hover:text-red-700 transition-colors text-sm flex items-center"
            aria-label={`Remove Mason Attendee ${attendeeNumber}`}
          >
            <X className="w-4 h-4 mr-1" /> Remove
          </button>
        )}
      </div>
      
      <MasonBasicInfo 
        mason={mason} 
        id={attendeeId} 
        isPrimary={isPrimary} 
        onChange={handleFieldChange}
        handleTitleChange={handleTitleChange}
        titles={titles}
        ranks={ranks}
      />
      
      {/* Debug ranking - we'll hide this in production */}
      <div className="text-xs text-gray-500 mb-2 flex items-center">
        Current rank: {mason.rank || 'None'}
        {mason.rank !== 'GL' && mason.title && isGrandTitle(mason.title) && (
          <button 
            onClick={() => {
              console.log('Forcing rank to GL due to Grand title');
              updateAttendee(attendeeId, { rank: 'GL' });
            }} 
            className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs"
          >
            Force GL Rank
          </button>
        )}
      </div>
      {mason.rank === 'GL' && (
        <MasonGrandLodgeFields 
          mason={mason} 
          id={attendeeId} 
          onChange={handleFieldChange}
          isPrimary={isPrimary}
        />
      )}

      <MasonLodgeInfo 
        mason={mason!} 
        id={attendeeId}
        isPrimary={isPrimary}
        grandLodgeOptions={grandLodges} 
        isLoadingGrandLodges={isLoadingGrandLodges}
        grandLodgeError={grandLodgeError}
        selectedGrandLodge={selectedGrandLodge}
        handleGrandLodgeSelect={handleGrandLodgeSelect}
        grandLodgeInputValue={grandLodgeInputValue}
        onGrandLodgeInputChange={handleGrandLodgeInputChange}
        lodgeOptions={allLodgeSearchResults}
        isLoadingLodges={isLoadingAllLodges}
        lodgeError={allLodgesError}
        selectedLodge={selectedLodge}
        handleLodgeSelect={handleLodgeSelect}
        lodgeInputValue={lodgeInputValue}
        onLodgeInputChange={handleLodgeInputChange}
        isCreatingLodgeUI={isCreatingLodgeUI}
        showLodgeNumberInput={!!newLodgeName}
        handleInitiateLodgeCreation={handleInitiateLodgeCreation}
        newLodgeName={newLodgeName}
        setNewLodgeName={setNewLodgeName}
        newLodgeNumber={newLodgeNumber}
        handleLodgeNumberChange={(e) => setNewLodgeNumber(e.target.value)}
        handleCancelLodgeCreation={handleCancelLodgeCreation}
        onConfirmNewLodge={handleConfirmNewLodge}
        useSameLodge={useSameLodge}
        onUseSameLodgeChange={handleUseSameLodgeChange}
      />

      <MasonContactInfo 
        mason={mason} 
        id={attendeeId}
        onChange={handleFieldChange}
        handlePhoneChange={handlePhoneChange} 
        isPrimary={isPrimary}
        hideContactFields={hideContactFieldsForMason}
        showConfirmation={showConfirmationForMason}
        getConfirmationMessage={getConfirmationMessageForMason}
        primaryMasonData={primaryMasonData}
      />

      <MasonAdditionalInfo 
        mason={mason} 
        id={attendeeId}
        onChange={handleFieldChange}
      />

      {/* Partner logic moved to MasonWithPartner */}
    </div>
  );
};

export default MasonForm;