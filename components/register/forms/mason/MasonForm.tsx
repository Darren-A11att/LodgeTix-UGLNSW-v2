import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import 'react-phone-input-2/lib/style.css';
import LadyPartnerForm from './LadyPartnerForm';
import { GrandLodgeRow } from '../../../../lib/api/grandLodges';
import { createLodge, LodgeRow } from '../../../../lib/api/lodges';
import MasonBasicInfo from './MasonBasicInfo';
import MasonGrandLodgeFields from './MasonGrandLodgeFields';
import MasonLodgeInfo from './MasonLodgeInfo';
import MasonContactInfo from './MasonContactInfo';
import MasonAdditionalInfo from './MasonAdditionalInfo';
import LadyPartnerToggle from './LadyPartnerToggle';
import { FaTrash } from 'react-icons/fa';
import { X } from 'lucide-react';
import PhoneInputWrapper from '../../../../shared/components/PhoneInputWrapper';
import { useLocationStore, IpApiData } from '../../../../lib/locationStore';
import { useRegistrationStore, RegistrationState, UnifiedAttendeeData } from '../../../../lib/registrationStore';
import { v4 as uuidv4 } from 'uuid';
import { LadyPartnerData as OldLadyPartnerData } from '../../../../shared/types/register';

interface MasonFormProps {
  attendeeId: string;
  attendeeNumber: number;
  isPrimary?: boolean;
}

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

  const attendees = useRegistrationStore((state: RegistrationState) => state.attendees);
  
  const mason = useMemo(() => 
    attendees.find(att => att.attendeeId === attendeeId),
    [attendees, attendeeId]
  ) as UnifiedAttendeeData | undefined;
  
  const ladyPartnerData = useMemo(() => 
    attendees.find(att => att.relatedAttendeeId === attendeeId && att.attendeeType === 'lady_partner'),
    [attendees, attendeeId]
  ) as UnifiedAttendeeData | undefined;
  
  const updateAttendee = useRegistrationStore((state: RegistrationState) => state.updateAttendee);
  const removeAttendee = useRegistrationStore((state: RegistrationState) => state.removeAttendee);
  const addAttendee = useRegistrationStore((state: RegistrationState) => state.addAttendee);

  if (!mason) {
      console.warn(`MasonForm rendered for non-existent attendeeId: ${attendeeId}`);
      return null; 
  }

  const primaryMasonData = useMemo(() => 
    attendees.find(att => att.isPrimary),
    [attendees]
  ) as UnifiedAttendeeData | undefined;
  
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

  // --- Generic Field Update Handler ---
  const handleFieldChange = useCallback((id: string, field: keyof UnifiedAttendeeData, value: any) => {
      if (id === attendeeId) {
        updateAttendee(attendeeId, { [field]: value });
      } else {
        console.warn('handleFieldChange called with mismatched ID', { currentId: attendeeId, receivedId: id });
      }
  }, [updateAttendee, attendeeId]);

  // Specific handler needed for phone due to component library
  const handlePhoneChange = useCallback((value: string) => {
      handleFieldChange(attendeeId, 'primaryPhone', value);
  }, [handleFieldChange, attendeeId]);

  // Specific handler for title change to also handle rank logic
  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
      const newTitle = e.target.value;
      const currentRank = mason?.rank; // Access the current rank

      let updates: Partial<UnifiedAttendeeData> = { title: newTitle };

      if (newTitle === 'W Bro') {
          if (currentRank !== 'GL') { // Only set to IM if current rank is not GL
              updates.rank = 'IM';
          }
          // If currentRank is 'GL', rank remains 'GL' due to no assignment here
      } else if (isGrandTitle(newTitle)) {
          updates.rank = 'GL';
      }
      // If the title is 'Bro' or any other title not matching the above conditions,
      // the rank is not automatically changed by this title selection.
      // The user can set the rank independently via the Rank dropdown,
      // which will use the generic handleFieldChange.

      updateAttendee(attendeeId, updates);
  }, [updateAttendee, attendeeId, mason?.rank]); // Ensure mason.rank is in the dependency array

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
                               console.error('Error searching for lodge:', err);
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

  // --- Handlers for GL/Lodge Selection and Creation --- 
  const resetLodgeCreationUI = useCallback(() => {
    setIsCreatingLodgeUI(false);
    setNewLodgeName('');
    setNewLodgeNumber('');
  }, []);
  
  const handleGrandLodgeSelect = useCallback((grandLodge: GrandLodgeRow | null) => {
       if (selectedGrandLodge?.id !== grandLodge?.id) {
           setSelectedGrandLodge(grandLodge);
           setGrandLodgeInputValue(grandLodge ? grandLodge.name : '');
           updateAttendee(attendeeId, { 
               grandLodgeId: grandLodge ? grandLodge.id : null, 
               lodgeId: null 
           });
           setSelectedLodge(null);
           setLodgeInputValue('');
           handleFieldChange(attendeeId, 'grandLodgeId', grandLodge ? grandLodge.id : null);
           handleFieldChange(attendeeId, 'lodgeId', null);
           resetLodgeCreationUI();
       }
   }, [selectedGrandLodge, updateAttendee, attendeeId, resetLodgeCreationUI, handleFieldChange]);

  const debouncedGrandLodgeSearch = useDebouncedCallback(searchGrandLodges, 300);

  const handleGrandLodgeInputChange = useCallback((value: string) => {
      setGrandLodgeInputValue(value);
      if (selectedGrandLodge && value !== selectedGrandLodge.name) {
          setSelectedGrandLodge(null);
      }
      debouncedGrandLodgeSearch(value);
  }, [debouncedGrandLodgeSearch, selectedGrandLodge]);

  const debouncedLodgeSearch = useDebouncedCallback(searchAllLodgesAction, 300);
  
  const handleLodgeSelect = useCallback((lodge: LodgeRow | null) => {
       // Set state based on whether we have a lodge or not
       setSelectedLodge(lodge);
       
       if (lodge) {
           // Lodge was selected - update to the proper display value
           const displayValue = lodge.display_name || `${lodge.name} No. ${lodge.number || 'N/A'}`;
           setLodgeInputValue(displayValue);
           
           // Save the display value to the ref for persistence
           lodgeNameRef.current = displayValue;
           
           // When a lodge is selected from the dropdown
           let updates: Partial<UnifiedAttendeeData> = { 
               lodgeId: lodge.id,
               lodgeNameNumber: displayValue // Store the display name in the attendee data
           };
           
           // Handle Grand Lodge association
           if (lodge.grand_lodge_id) {
               const associatedGrandLodge = grandLodges.find(gl => gl.id === lodge.grand_lodge_id);
               if (associatedGrandLodge) {
                   if (selectedGrandLodge?.id !== associatedGrandLodge.id) {
                       setSelectedGrandLodge(associatedGrandLodge);
                       setGrandLodgeInputValue(associatedGrandLodge.name);
                       updates.grandLodgeId = associatedGrandLodge.id;
                   }
               } else {
                   console.warn(`Grand Lodge ${lodge.grand_lodge_id} for selected lodge ${lodge.id} not found.`);
               }
           }
           
           updateAttendee(attendeeId, updates);
       } else {
           // Clear button was clicked or selection was removed
           setLodgeInputValue('');
           lodgeNameRef.current = null;
           
           // Clear the field values in the attendee data
           updateAttendee(attendeeId, { 
               lodgeId: null,
               lodgeNameNumber: null
           });
       }
       
       // Always make sure the creation UI is reset
       resetLodgeCreationUI();
   }, [updateAttendee, attendeeId, grandLodges, selectedGrandLodge, resetLodgeCreationUI]);

  const handleLodgeInputChange = useCallback((value: string) => {
      // Set the flag to indicate user is typing
      userIsTypingRef.current = true;
      
      // Update the input field value immediately
      setLodgeInputValue(value);
      
      // If the user is typing, clear the selected lodge
      if (selectedLodge) {
          const currentDisplay = selectedLodge.display_name || `${selectedLodge.name} No. ${selectedLodge.number || 'N/A'}`; 
          if (value !== currentDisplay && currentDisplay !== '') { 
              // User is typing something different - clear the selection but preserve the value
              handleLodgeSelect(null);
              
              // Clear cached display value when user is actively changing it
              lodgeNameRef.current = null;
              
              // Clear the form-level value
              updateAttendee(attendeeId, { 
                  lodgeId: null,
                  lodgeNameNumber: null
              });
          }
      }
      
      // Search for lodges matching the input
      if (value && value.trim().length > 0) {
        debouncedLodgeSearch(value.trim());
      }
      
      // Clear the typing flag after a short delay to allow input to stabilize
      setTimeout(() => {
        userIsTypingRef.current = false;
      }, 500);
  }, [debouncedLodgeSearch, selectedLodge, handleLodgeSelect, updateAttendee, attendeeId]);

  const handleInitiateLodgeCreation = useCallback((initialLodgeName: string) => {
      if (!selectedGrandLodge) {
          alert("Please select a Grand Lodge before creating a new lodge.");
          return; 
      }
      setIsCreatingLodgeUI(true);
      setNewLodgeName(initialLodgeName);
      setNewLodgeNumber('');
  }, [selectedGrandLodge]);

  const handleLodgeNumberChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setNewLodgeNumber(e.target.value);
  }, []);
  const handleCancelLodgeCreation = useCallback(() => {
    resetLodgeCreationUI();
  }, [resetLodgeCreationUI]);

  const handleConfirmNewLodge = useCallback(async (details: { name: string; number: string }) => {
      if (!selectedGrandLodge?.id) return;
      try {
          const newLodgeData = { name: details.name, number: details.number || null, grand_lodge_id: selectedGrandLodge.id };
          const createdLodge = await createLodgeAction(newLodgeData as any); 
          if (createdLodge) {
              handleLodgeSelect(createdLodge);
          }
      } catch (error) {
          console.error("Error during lodge creation process:", error);
      }
      resetLodgeCreationUI();
  }, [selectedGrandLodge?.id, createLodgeAction, handleLodgeSelect, resetLodgeCreationUI]);

  // --- Lady Partner Handlers ---
  const handleLadyPartnerToggle = useCallback(() => {
      if (ladyPartnerData) {
          removeAttendee(ladyPartnerData.attendeeId);
      } else {
          addAttendee({
              attendeeType: 'lady_partner',
              relatedAttendeeId: attendeeId,
              registrationId: mason.registrationId,
              firstName: '',
              lastName: '',
          } as Omit<UnifiedAttendeeData, 'attendeeId'>);
      }
  }, [ladyPartnerData, addAttendee, removeAttendee, attendeeId, mason.registrationId]);

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

  // --- Transform Partner Data for LadyPartnerForm ---
  const transformedPartnerData = useMemo(() => {
      if (!ladyPartnerData) return undefined;
      return {
          id: ladyPartnerData.attendeeId,
          title: ladyPartnerData.title || '',
          firstName: ladyPartnerData.firstName || '',
          lastName: ladyPartnerData.lastName || '',
          email: ladyPartnerData.primaryEmail || '',
          phone: ladyPartnerData.primaryPhone || '',
          dietary: ladyPartnerData.dietaryRequirements || '',
          specialNeeds: ladyPartnerData.specialNeeds || '',
          relationship: ladyPartnerData.relationship || '',
          masonId: ladyPartnerData.relatedAttendeeId || '',
          contactPreference: ladyPartnerData.contactPreference || 'Directly',
          contactConfirmed: !!ladyPartnerData.contactConfirmed,
      } as OldLadyPartnerData;
  }, [ladyPartnerData]);

  // --- Handler for the 'Use same lodge as primary' checkbox ---
  const handleUseSameLodgeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    setUseSameLodge(isChecked);

    if (!isPrimary && mason && primaryMasonData) {
      if (isChecked) {
        // Copy from primary to current mason
        const updates: Partial<UnifiedAttendeeData> = {
          grandLodgeId: primaryMasonData.grandLodgeId,
          lodgeId: primaryMasonData.lodgeId,
          lodgeNameNumber: primaryMasonData.lodgeNameNumber,
        };
        updateAttendee(attendeeId, updates);
        // Also update local UI state for GL/Lodge selection inputs to reflect copied values
        if (primaryMasonData.grandLodgeId) {
          const primaryGL = grandLodges.find(gl => gl.id === primaryMasonData.grandLodgeId);
          if (primaryGL) {
            setSelectedGrandLodge(primaryGL);
            setGrandLodgeInputValue(primaryGL.name);
          }
        }
        if (primaryMasonData.lodgeNameNumber) {
            setLodgeInputValue(primaryMasonData.lodgeNameNumber);
            // If we have primaryMasonData.lodgeId, try to find the full LodgeRow for selectedLodge
            if (primaryMasonData.lodgeId) {
                const primaryLodge = allLodgeSearchResults.find(l => l.id === primaryMasonData.lodgeId);
                if (primaryLodge) setSelectedLodge(primaryLodge);
                else setSelectedLodge(null); // Or a minimal LodgeRow if only ID is known
            }
        } else {
            setLodgeInputValue('');
            setSelectedLodge(null);
        }

      } else {
        // Clear fields for current mason if unchecked
        const updates: Partial<UnifiedAttendeeData> = {
          grandLodgeId: null,
          lodgeId: null,
          lodgeNameNumber: null,
        };
        updateAttendee(attendeeId, updates);
        // Reset local UI state for GL/Lodge selection inputs
        setSelectedGrandLodge(null);
        setGrandLodgeInputValue('');
        setSelectedLodge(null);
        setLodgeInputValue('');
      }
    }
  }, [isPrimary, mason, primaryMasonData, updateAttendee, attendeeId, grandLodges, allLodgeSearchResults]);

  const removeLadyPartner = useCallback(() => {
    if (ladyPartnerData) {
      removeAttendee(ladyPartnerData.attendeeId);
      updateAttendee(attendeeId, { hasLadyPartner: false }); 
    }
  }, [ladyPartnerData, removeAttendee, updateAttendee, attendeeId]);

  // Determine if contact fields should be hidden for THIS mason (if additional)
  // Show fields if 'Directly' is selected or if preference is not yet set (undefined, meaning "Please Select")
  const hideMyContactFields = mason && !isPrimary && 
                            !(mason.contactPreference === 'Directly' || typeof mason.contactPreference === 'undefined');

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
      
      {mason.rank === 'GL' && (
        <MasonGrandLodgeFields 
          mason={mason} 
          id={attendeeId} 
          onChange={handleFieldChange}
          isPrimary={isPrimary}
        />
      )}

      <MasonLodgeInfo 
        mason={mason}
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
        handleLodgeNumberChange={handleLodgeNumberChange}
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
        hideContactFields={hideMyContactFields}
        showConfirmation={!isPrimary && (mason.contactPreference === 'PrimaryAttendee' || mason.contactPreference === 'ProvideLater' || mason.contactPreference === 'Mason/Guest')}
        getConfirmationMessage={() => getConfirmationMessageForAdditionalMason(primaryMasonData, mason)}
      />

      <MasonAdditionalInfo 
        mason={mason} 
        id={attendeeId}
        onChange={handleFieldChange}
      />

      {!ladyPartnerData && (
        <div className="mt-6 text-center">
          <LadyPartnerToggle
            hasPartner={false}
            onToggle={handleLadyPartnerToggle}
          />
        </div>
      )}

      {ladyPartnerData && transformedPartnerData && (
        <LadyPartnerForm
          partner={transformedPartnerData}
          id={ladyPartnerData.attendeeId}
          updateField={ (id: string, field: string, value: any) => {
            let unifiedField: keyof UnifiedAttendeeData | null = null;
            switch (field as keyof OldLadyPartnerData) {
              case 'title': unifiedField = 'title'; break;
              case 'firstName': unifiedField = 'firstName'; break;
              case 'lastName': unifiedField = 'lastName'; break;
              case 'email': unifiedField = 'primaryEmail'; break;
              case 'phone': unifiedField = 'primaryPhone'; break;
              case 'dietary': unifiedField = 'dietaryRequirements'; break;
              case 'specialNeeds': unifiedField = 'specialNeeds'; break;
              case 'relationship': unifiedField = 'relationship'; break;
              case 'contactPreference': unifiedField = 'contactPreference'; break;
              case 'contactConfirmed': unifiedField = 'contactConfirmed'; break;
              default: console.warn(`Unhandled LadyPartnerForm field update: ${field}`); return;
            }
            if (unifiedField) {
              updateAttendee(id, { [unifiedField]: value });
            }
          }}
          onRemove={handleLadyPartnerToggle}
          relatedMasonName={`${mason.firstName || ''} ${mason.lastName || ''}`.trim()}
          primaryAttendeeData={primaryMasonData}
        />
      )}
    </div>
  );
};

export default MasonForm;