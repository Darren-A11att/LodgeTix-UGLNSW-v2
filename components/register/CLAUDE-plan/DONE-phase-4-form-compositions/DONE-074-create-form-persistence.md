# Task 074: Create Form Persistence

## Objective
Implement form persistence for both MasonForm and GuestForm to save draft data and restore on page reload.

## Dependencies
- Task 006 (usePersistence hook)
- Task 071 (MasonForm)
- Task 072 (GuestForm)

## Steps

1. Create `components/register/forms/attendee/lib/useFormPersistence.ts`:
```typescript
import { useCallback, useEffect, useState } from 'react';
import { AttendeeData } from '../types';
import { useAttendeeData } from './useAttendeeData';
import { usePersistence } from './usePersistence';

interface FormPersistenceOptions {
  autoSave?: boolean;
  autoRestore?: boolean;
  persistSensitiveData?: boolean;
  saveDebounceMs?: number;
}

export const useFormPersistence = (
  attendeeId: string,
  options: FormPersistenceOptions = {}
) => {
  const {
    autoSave = true,
    autoRestore = true,
    persistSensitiveData = false,
    saveDebounceMs = 1000,
  } = options;

  const { attendee } = useAttendeeData(attendeeId);
  const { saveDraft, loadDraft, clearDraft, hasDraft } = usePersistence(
    attendeeId,
    autoSave
  );
  
  const [isRestoring, setIsRestoring] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Sensitive fields that should not be persisted
  const sensitiveFields = ['primaryEmail', 'primaryPhone', 'dietaryRequirements'];

  // Filter sensitive data before saving
  const filterSensitiveData = useCallback((data: AttendeeData): Partial<AttendeeData> => {
    if (persistSensitiveData) return data;

    const filtered = { ...data };
    sensitiveFields.forEach(field => {
      delete filtered[field as keyof AttendeeData];
    });
    
    return filtered;
  }, [persistSensitiveData]);

  // Save draft with filtering
  const saveFilteredDraft = useCallback(() => {
    if (!attendee) return;
    
    const filteredData = filterSensitiveData(attendee);
    saveDraft(filteredData as AttendeeData);
    setLastSaved(new Date());
  }, [attendee, filterSensitiveData, saveDraft]);

  // Auto-save effect
  useEffect(() => {
    if (!autoSave || !attendee) return;

    const timeoutId = setTimeout(() => {
      saveFilteredDraft();
    }, saveDebounceMs);

    return () => clearTimeout(timeoutId);
  }, [attendee, autoSave, saveDebounceMs, saveFilteredDraft]);

  // Auto-restore on mount
  useEffect(() => {
    if (autoRestore && hasDraft && !isRestoring) {
      setIsRestoring(true);
      const draft = loadDraft();
      if (draft) {
        // Restore draft data
        // This would typically update the store with draft data
        console.log('Restoring draft:', draft);
      }
      setIsRestoring(false);
    }
  }, [autoRestore, hasDraft, loadDraft, isRestoring]);

  return {
    saveFilteredDraft,
    clearDraft,
    hasDraft,
    isRestoring,
    lastSaved,
  };
};
```

2. Create form-specific persistence implementations:
```typescript
// Mason form persistence with specific rules
export const useMasonFormPersistence = (attendeeId: string) => {
  const baseOptions = {
    autoSave: true,
    autoRestore: true,
    persistSensitiveData: false,
  };

  const persistence = useFormPersistence(attendeeId, baseOptions);
  
  // Additional Mason-specific persistence logic
  const saveMasonDraft = useCallback(() => {
    // Could add Mason-specific filtering here
    persistence.saveFilteredDraft();
  }, [persistence]);

  return {
    ...persistence,
    saveMasonDraft,
  };
};

// Guest form persistence with specific rules
export const useGuestFormPersistence = (attendeeId: string) => {
  const { attendee } = useAttendeeData(attendeeId);
  
  // Don't persist partner data if contact preference is via primary
  const persistSensitiveData = attendee?.contactPreference === 'Directly';
  
  const baseOptions = {
    autoSave: true,
    autoRestore: true,
    persistSensitiveData,
  };

  const persistence = useFormPersistence(attendeeId, baseOptions);
  
  return persistence;
};
```

3. Create UI components for draft management:
```typescript
// Draft indicator component
export const DraftIndicator: React.FC<{ lastSaved: Date | null }> = ({ lastSaved }) => {
  const [timeAgo, setTimeAgo] = useState<string>('');

  useEffect(() => {
    if (!lastSaved) return;

    const updateTimeAgo = () => {
      const seconds = Math.floor((Date.now() - lastSaved.getTime()) / 1000);
      
      if (seconds < 60) {
        setTimeAgo('Just saved');
      } else if (seconds < 3600) {
        const minutes = Math.floor(seconds / 60);
        setTimeAgo(`Saved ${minutes} minute${minutes > 1 ? 's' : ''} ago`);
      } else {
        const hours = Math.floor(seconds / 3600);
        setTimeAgo(`Saved ${hours} hour${hours > 1 ? 's' : ''} ago`);
      }
    };

    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [lastSaved]);

  if (!lastSaved) return null;

  return (
    <div className="text-sm text-gray-500 flex items-center gap-2">
      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
      {timeAgo}
    </div>
  );
};

// Draft restore prompt
export const DraftRestorePrompt: React.FC<{
  onRestore: () => void;
  onDiscard: () => void;
}> = ({ onRestore, onDiscard }) => {
  return (
    <Alert className="mb-4">
      <InfoIcon className="h-4 w-4" />
      <AlertTitle>Draft Found</AlertTitle>
      <AlertDescription>
        We found a saved draft of this form. Would you like to restore it?
      </AlertDescription>
      <div className="mt-4 flex gap-2">
        <Button size="sm" onClick={onRestore}>
          Restore Draft
        </Button>
        <Button size="sm" variant="outline" onClick={onDiscard}>
          Start Fresh
        </Button>
      </div>
    </Alert>
  );
};
```

4. Create forms with persistence:
```typescript
// MasonForm with persistence
export const MasonFormWithPersistence: React.FC<FormProps> = (props) => {
  const { 
    hasDraft, 
    clearDraft, 
    lastSaved,
    isRestoring 
  } = useMasonFormPersistence(props.attendeeId);
  
  const [showRestorePrompt, setShowRestorePrompt] = useState(hasDraft);

  const handleRestore = () => {
    // Restoration is handled automatically by the hook
    setShowRestorePrompt(false);
  };

  const handleDiscard = () => {
    clearDraft();
    setShowRestorePrompt(false);
  };

  if (isRestoring) {
    return <div>Loading draft...</div>;
  }

  return (
    <>
      {showRestorePrompt && (
        <DraftRestorePrompt
          onRestore={handleRestore}
          onDiscard={handleDiscard}
        />
      )}
      
      <div className="relative">
        <div className="absolute top-0 right-0">
          <DraftIndicator lastSaved={lastSaved} />
        </div>
        
        <MasonForm {...props} />
      </div>
    </>
  );
};

// GuestForm with persistence
export const GuestFormWithPersistence: React.FC<FormProps> = (props) => {
  const { 
    hasDraft, 
    clearDraft, 
    lastSaved,
    isRestoring 
  } = useGuestFormPersistence(props.attendeeId);
  
  const [showRestorePrompt, setShowRestorePrompt] = useState(hasDraft);

  const handleRestore = () => {
    setShowRestorePrompt(false);
  };

  const handleDiscard = () => {
    clearDraft();
    setShowRestorePrompt(false);
  };

  if (isRestoring) {
    return <div>Loading draft...</div>;
  }

  return (
    <>
      {showRestorePrompt && (
        <DraftRestorePrompt
          onRestore={handleRestore}
          onDiscard={handleDiscard}
        />
      )}
      
      <div className="relative">
        <div className="absolute top-0 right-0">
          <DraftIndicator lastSaved={lastSaved} />
        </div>
        
        <GuestForm {...props} />
      </div>
    </>
  );
};
```

## Deliverables
- Form persistence hooks
- Sensitive data filtering
- Draft indicator UI
- Restore prompt UI
- Forms with persistence

## Success Criteria
- Drafts save automatically
- Sensitive data filtered appropriately
- Clear visual feedback
- Restore prompt on page reload
- Performance optimized