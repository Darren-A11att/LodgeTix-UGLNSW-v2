import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import LadyPartnerForm from './LadyPartnerForm';
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
  
  const ladyPartnerData = useRegistrationStore(state => 
    // Find partner using the mason's partner field
    state.attendees.find(att => att.attendeeId === mason?.partner)
  );

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
    if (!showConfirmationForMason) return null;
    
    if (mason.contactPreference === 'PrimaryAttendee' && primaryMasonData) {
      return `Contact information will be shared with the primary attendee: ${primaryMasonData.firstName} ${primaryMasonData.lastName}`;
    } else if (mason.contactPreference === 'ProvideLater') {
      return "Contact information will be provided later.";
    }
    return null;
  }, [showConfirmationForMason, mason.contactPreference, primaryMasonData]);

  // --- Initial Data Load and Sync Effects ---
  useEffect(() => {
    const initializeData = async () => {
        if (!grandLodges || grandLodges.length === 0) {
            await fetchInitialGrandLodges();
        }
        if (mason && !loadedLodgesRef.current) {
            if (!mason.lodgeId && allLodgeSearchResults.length === 0) {
                // Initial search of all lodges for the autocomplete
                await searchAllLodgesAction('');
            }
            loadedLodgesRef.current = true;
        }
    };
    initializeData();
  }, [mason, grandLodges, fetchInitialGrandLodges, searchAllLodgesAction, allLodgeSearchResults.length]);

  // --- Refs and Memos ---
  const loadedLodgesRef = useRef(false);
  const selectedGrandLodgeRef = useRef(selectedGrandLodge);
  const lodgeNameRef = useRef<string | null>(null);

  // Update refs when state changes
  useEffect(() => {
    selectedGrandLodgeRef.current = selectedGrandLodge;
  }, [selectedGrandLodge]);

  // Lodge search options
  const lodgeSearchResults = useMemo(() => {
    let results = allLodgeSearchResults || [];

    if (selectedGrandLodge) {
      results = results.filter((lodge) => lodge.grand_lodge_id === selectedGrandLodge.id);
    }

    if (lodgeInputValue.trim()) {
      const searchTerm = lodgeInputValue.trim().toLowerCase();
      results = results.filter((lodge) => {
        const nameMatch = lodge.name.toLowerCase().includes(searchTerm);
        const numberMatch = lodge.number && lodge.number.toLowerCase().includes(searchTerm);
        return nameMatch || numberMatch;
      });
    }

    return results;
  }, [allLodgeSearchResults, selectedGrandLodge, lodgeInputValue]);

  // --- Event Handlers ---
  const handleFieldChange = useCallback((field: keyof UnifiedAttendeeData, value: any) => {
      debouncedUpdateAttendee(attendeeId, { [field]: value });
  }, [attendeeId, debouncedUpdateAttendee]);

  const handlePartnerToggle = useCallback((checked: boolean) => {
    if (!mason) return;

    if (checked) {
      const partnerId = addLadyPartnerAttendee(attendeeId);
      debouncedUpdateAttendee(attendeeId, { partner: partnerId });
    } else {
      if (ladyPartnerData?.attendeeId) {
        removeAttendee(ladyPartnerData.attendeeId);
      }
      debouncedUpdateAttendee(attendeeId, { partner: null });
    }
  }, [mason, attendeeId, ladyPartnerData, addLadyPartnerAttendee, removeAttendee, debouncedUpdateAttendee]);

  const handlePartnerFormChange = useCallback((partnerData: UnifiedAttendeeData) => {
    if (!ladyPartnerData?.attendeeId) return;
    debouncedUpdateAttendee(ladyPartnerData.attendeeId, partnerData);
  }, [ladyPartnerData?.attendeeId, debouncedUpdateAttendee]);

  const handleRemoveSelf = useCallback(async () => {
    if (!mason) return;
    
    const confirmRemove = window.confirm(
      isPrimary 
        ? "Are you sure you want to remove the primary attendee? This will clear your lodge membership information."
        : `Are you sure you want to remove ${mason.firstName} ${mason.lastName}?`
    );
    
    if (confirmRemove) {
      // Remove partner if exists
      if (ladyPartnerData?.attendeeId) {
        removeAttendee(ladyPartnerData.attendeeId);
      }
      removeAttendee(attendeeId);
    }
  }, [mason, isPrimary, ladyPartnerData?.attendeeId, removeAttendee, attendeeId]);

  const handlePhoneChange = useCallback((value: string) => {
    if (value !== mason.primaryPhone) {
      debouncedUpdateAttendee(attendeeId, { primaryPhone: value });
    }
  }, [mason?.primaryPhone, attendeeId, debouncedUpdateAttendee]);

  const handleLodgeFieldChange = useCallback((updates: Partial<UnifiedAttendeeData>) => {
    if (!mason) return;
    debouncedUpdateAttendee(attendeeId, updates);
  }, [mason, attendeeId, debouncedUpdateAttendee]);

  const createNewLodge = useCallback(async () => {
    if (!newLodgeName || !selectedGrandLodge) {
        console.error('Cannot create lodge without name and Grand Lodge');
        return;
    }

    try {
        setIsCreatingLodgeUI(true);
        
        const newLodge = await createLodgeAction({
            name: newLodgeName,
            number: newLodgeNumber || null,
            grandLodgeId: selectedGrandLodge.id
        });

        setLodgeInputValue(`${newLodge.name}${newLodge.number ? ` No. ${newLodge.number}` : ''}`);
        setSelectedLodge(newLodge);
        
        debouncedUpdateAttendee(attendeeId, {
            lodgeId: newLodge.id,
            lodgeNameNumber: `${newLodge.name}${newLodge.number ? ` No. ${newLodge.number}` : ''}`
        });

        setIsCreatingLodgeUI(false);
        setNewLodgeName('');
        setNewLodgeNumber('');
        
        // Refresh lodge search results
        searchAllLodgesAction('');
    } catch (error) {
        console.error('Error creating lodge:', error);
        setIsCreatingLodgeUI(false);
    }
  }, [newLodgeName, selectedGrandLodge, newLodgeNumber, createLodgeAction, attendeeId, debouncedUpdateAttendee, searchAllLodgesAction]);

  const handleGrandLodgeInputChange = useCallback((value: string) => {
    setGrandLodgeInputValue(value);
  }, []);

  const handleLodgeInputChange = useCallback((value: string) => {
    setLodgeInputValue(value);
    lodgeNameRef.current = value;
  }, []);

  const handleGrandLodgeSelect = useCallback((gl: GrandLodgeRow) => {
    setSelectedGrandLodge(gl);
    debouncedUpdateAttendee(attendeeId, { grandLodgeId: gl.id });
    // Clear lodge selection when grand lodge changes
    setSelectedLodge(null);
    setLodgeInputValue('');
    lodgeNameRef.current = null;
    debouncedUpdateAttendee(attendeeId, { lodgeId: null, lodgeNameNumber: null });
  }, [attendeeId, debouncedUpdateAttendee]);

  const handleLodgeSelect = useCallback((lodge: LodgeRow | null) => {
    if (!lodge) {
      setSelectedLodge(null);
      debouncedUpdateAttendee(attendeeId, { lodgeId: null, lodgeNameNumber: null });
      return;
    }
    
    setSelectedLodge(lodge);
    const lodgeDisplayName = `${lodge.name}${lodge.number ? ` No. ${lodge.number}` : ''}`;
    lodgeNameRef.current = lodgeDisplayName;
    debouncedUpdateAttendee(attendeeId, { 
      lodgeId: lodge.id,
      lodgeNameNumber: lodgeDisplayName 
    });
  }, [attendeeId, debouncedUpdateAttendee]);

  const debouncedSearchGrandLodges = useDebouncedCallback(searchGrandLodges, 300);
  const debouncedSearchAllLodges = useDebouncedCallback(searchAllLodgesAction, 300);

  useEffect(() => {
    if (mason.grandLodgeId && grandLodges.length > 0) {
      const gl = grandLodges.find(gl => gl.id === mason.grandLodgeId);
      if (gl) {
        setSelectedGrandLodge(gl);
        setGrandLodgeInputValue(gl.name);
      }
    }
  }, [mason.grandLodgeId, grandLodges]);

  useEffect(() => {
    if (mason.lodgeId && allLodgeSearchResults.length > 0) {
      const lodge = allLodgeSearchResults.find(l => l.id === mason.lodgeId);
      if (lodge) {
        setSelectedLodge(lodge);
        const displayName = `${lodge.name}${lodge.number ? ` No. ${lodge.number}` : ''}`;
        setLodgeInputValue(displayName);
        lodgeNameRef.current = displayName;
      }
    } else if (mason.lodgeNameNumber && !mason.lodgeId) {
      setLodgeInputValue(mason.lodgeNameNumber);
      lodgeNameRef.current = mason.lodgeNameNumber;
    }
  }, [mason.lodgeId, mason.lodgeNameNumber, allLodgeSearchResults]);

  const handleUseSameLodgeChange = useCallback(() => {
    const isChecked = !useSameLodge;
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

  const handleTitleChange = useCallback((newTitle: string) => {
    const isGL = isGrandTitle(newTitle);
    const updates: Partial<UnifiedAttendeeData> = { title: newTitle };
    
    if (isGL && mason.rank !== 'GL') {
      updates.rank = 'GL';
    } else if (!isGL && mason.rank === 'GL') {
      updates.rank = null;
    }
    
    debouncedUpdateAttendee(attendeeId, updates);
  }, [mason?.rank, attendeeId, debouncedUpdateAttendee]);

  // Debug logs removed for performance

  return (
    <div className="card-base p-card-padding form-section" id={`mason-form-${attendeeId}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="form-section-header">
          {isPrimary ? 'Mason Attendee - Primary' : `Mason Attendee ${attendeeNumber}`}
        </h3>
        {!isPrimary && (
          <button 
            onClick={handleRemoveSelf} 
            className="button-ghost text-red-600 hover:text-red-700 text-sm flex items-center"
            aria-label={`Remove Mason Attendee ${attendeeNumber}`}
          >
            <X className="w-4 h-4 mr-1" /> Remove
          </button>
        )}
      </div>
      
      <div className="form-stack">
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
        <div className="text-xs text-gray-500 flex items-center">
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
          onLodgeFieldChange={handleLodgeFieldChange}
          grandLodges={grandLodges}
          isLoadingGrandLodges={isLoadingGrandLodges}
          grandLodgeError={grandLodgeError}
          allLodgeSearchResults={allLodgeSearchResults}
          isLoadingAllLodges={isLoadingAllLodges}
          allLodgesError={allLodgesError}
          searchGrandLodges={debouncedSearchGrandLodges}
          searchAllLodges={debouncedSearchAllLodges}
          selectedGrandLodge={selectedGrandLodge}
          selectedLodge={selectedLodge}
          grandLodgeInputValue={grandLodgeInputValue}
          lodgeInputValue={lodgeInputValue}
          isCreatingLodgeUI={isCreatingLodgeUI}
          setIsCreatingLodgeUI={setIsCreatingLodgeUI}
          newLodgeName={newLodgeName}
          setNewLodgeName={setNewLodgeName}
          newLodgeNumber={newLodgeNumber}
          setNewLodgeNumber={setNewLodgeNumber}
          handleGrandLodgeInputChange={handleGrandLodgeInputChange}
          handleLodgeInputChange={handleLodgeInputChange}
          handleGrandLodgeSelect={handleGrandLodgeSelect}
          handleLodgeSelect={handleLodgeSelect}
          createNewLodge={createNewLodge}
          lodgeSearchResults={lodgeSearchResults}
          useSameLodge={useSameLodge}
          handleUseSameLodgeChange={handleUseSameLodgeChange}
          primaryMasonData={primaryMasonData}
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
          primaryAttendeeData={primaryMasonData}
        />

        <MasonAdditionalInfo 
          mason={mason} 
          id={attendeeId} 
          onChange={handleFieldChange}
          isPrimary={isPrimary}
        />

        {ladyPartnerData && (
          <LadyPartnerForm 
            formData={ladyPartnerData}
            onFormChange={handlePartnerFormChange}
            masonId={attendeeId}
            masonname={`${mason.firstName} ${mason.lastName}`}
            primaryAttendeeData={primaryMasonData}
          />
        )}
      </div>
    </div>
  );
};

export default MasonForm;