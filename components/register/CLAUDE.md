# Forms Architecture - Refactored Structure

## Core Concepts

### Attendee Composition
An attendee is a person attending an event. We compose attendees using:

1. **Base PersonData** - Common to all attendees
   - Type: 'Mason' | 'Guest'
   - Personal Details: title, firstName, lastName, suffix
   - Contact Info: email, phone, contactPreference
   - Relationships: isPrimary, isPartner, partner
   - Additional: dietaryRequirements, specialNeeds

2. **Mason-specific Data** (extends PersonData)
   - Masonic Details: masonicTitle, rank
   - Grand Officer Details: grandOfficerStatus, presentGrandOfficerRole (when rank === 'GL')
   - Lodge Info: grandLodgeId, lodgeId, lodgeNameNumber

3. **Guest Data** (just PersonData with type='Guest')
   - No additional fields beyond PersonData

### Relationship Model
- `isPrimary`: boolean - Is this the primary attendee?
- `isPartner`: string | null - FK to the parent attendee (if this attendee is a partner)
- `partner`: string | null - FK to their partner attendee (if this attendee has a partner)
- `relationship`: 'Husband' | 'Wife' | 'Partner' | 'Fiance' | 'Fiancee' | null

Partners are **always Guests** with `isPartner` set to the ID of their parent attendee.

## Directory Organization

```
components/
└── register/
    ├── attendees/
    │   ├── AttendeeCounter.tsx            # Controls for adding/removing attendees
    │   ├── AttendeeEditModal.tsx          # Modal for editing attendee details
    │   ├── AttendeeEventAccess.tsx        # Manage attendee access to events
    │   └── AttendeeSummary.tsx            # Summary of all attendees
    │
    ├── forms/
    │   ├── attendee/
    │   │   ├── IndividualsForm.tsx        # Layout for individual registration
    │   │   ├── AttendeeWithPartner.tsx    # Container layout for attendee + partner
    │   │   ├── LodgesForm.tsx             # Layout for lodge group registration
    │   │   ├── DelegationsForm.tsx        # Layout for official delegations
    │   │   ├── PartnerToggle.tsx          # UI component for partner management
    │   │   ├── lib/
    │   │   │   ├── useAttendeeData.ts     # Common attendee data hooks
    │   │   │   ├── usePartnerManager.ts   # Partner relationship management
    │   │   │   └── usePersistence.ts      # Form draft persistence
    │   │   └── utils/
    │   │       ├── attendeeTypeRenderer.ts # Render correct form by type
    │   │       ├── validation.ts          # Common validation rules
    │   │       ├── formatters.ts          # Data formatting utilities
    │   │       └── constants.ts           # Shared constants
    │   │
    │   ├── basic-details/
    │   │   ├── BasicInfo.tsx              # Consolidated personal details (Mason/Guest)
    │   │   ├── ContactInfo.tsx            # Email, phone, preferences
    │   │   ├── AdditionalInfo.tsx         # Dietary, special needs
    │   │   └── ContactConfirmationMessage.tsx  # Confirmation UI component
    │   │
    │   ├── guest/
    │   │   ├── layouts/
    │   │   │   └── GuestForm.tsx          # Guest-specific layout composition
    │   │   └── lib/
    │   │       └── useGuestData.ts        # Guest-specific hooks
    │   │
    │   ├── mason/
    │   │   ├── layouts/
    │   │   │   └── MasonForm.tsx          # Mason-specific layout composition
    │   │   ├── lib/
    │   │   │   ├── GrandLodgeSelection.tsx # Grand Lodge selection component
    │   │   │   └── LodgeSelection.tsx      # Lodge selection component
    │   │   └── utils/
    │   │       └── GrandOfficerFields.tsx  # Grand officer specific fields
    │   │
    │   └── shared/
    │       ├── AddRemoveControl.tsx       # Shared add/remove UI
    │       ├── AutoCompleteInput.tsx      # Shared autocomplete component
    │       ├── PartnerToggle.tsx          # Partner relationship toggle
    │       └── TermsAndConditions.tsx     # T&C component
    │
    ├── functions/                         # Legacy - to be removed
    │   ├── AddRemoveControl.tsx
    │   ├── AutocompleteInput.tsx
    │   └── TermsAndConditions.tsx
    │
    └── registration-wizard/
        ├── payment/                       # Payment-related components
        ├── registration-types/            # Registration type components
        │   ├── RegisterLodge.tsx
        │   ├── RegisterMyself.tsx
        │   └── RegisterOfficialDelegation.tsx
        ├── shared/                        # Wizard-specific shared components
        │   ├── attendee-card.tsx
        │   ├── registration-step-indicator.tsx
        │   └── SectionHeader.tsx
        ├── steps/                         # Wizard step components
        │   ├── RegistrationTypeStep.tsx
        │   ├── AttendeeDetails.tsx
        │   ├── TicketSelectionStep.tsx
        │   ├── OrderReviewStep.tsx
        │   ├── PaymentStep.tsx
        │   └── ConfirmationStep.tsx
        └── registration-wizard.tsx        # Main wizard component
```

## Key Architectural Changes

### 1. Separation of Concerns

**Form Compositions** (MasonForm, GuestForm):
- Compose sections into type-specific forms
- No direct state management
- Pass through props to child components
- Handle form-specific layout styling

**Container Layouts** (AttendeeWithPartner):
- Orchestrate form compositions based on attendee type
- Manage partner relationships
- Handle partner toggle interaction
- Conditionally render partner forms
- May have its own lib/utils for partner management

**Sections** (BasicInfo, ContactInfo, etc.):
- Render specific form fields
- Handle field-level validation
- Emit changes to parent
- No knowledge of attendee type

**Common Logic** (forms/attendee/lib/):
- Attendee data management
- Partner relationship logic
- Form persistence
- Shared business rules

### 2. Consolidated Components

**BasicInfo** (replaces MasonBasicInfo & GuestBasicInfo):
```typescript
interface BasicInfoProps {
  data: AttendeeData;
  type: 'Mason' | 'Guest';
  isPrimary?: boolean;
  onChange: (field: string, value: any) => void;
}

const BasicInfo: React.FC<BasicInfoProps> = ({ data, type, isPrimary, onChange }) => {
  const titles = type === 'Mason' ? MASON_TITLES : GUEST_TITLES;
  
  return (
    <>
      <TitleSelect options={titles} value={data.title} onChange={onChange} />
      <TextField name="firstName" value={data.firstName} onChange={onChange} />
      <TextField name="lastName" value={data.lastName} onChange={onChange} />
      {type === 'Mason' && <RankSelect value={data.rank} onChange={onChange} />}
    </>
  );
};
```

### 3. Centralized Partner Management

**usePartnerManager** hook:
```typescript
const usePartnerManager = (attendeeId: string) => {
  const { attendees, addPartnerAttendee, removeAttendee } = useRegistrationStore();
  
  const attendee = attendees.find(a => a.attendeeId === attendeeId);
  const partner = attendee?.partner ? attendees.find(a => a.attendeeId === attendee.partner) : null;
  const hasPartner = !!attendee?.partner;
  
  const togglePartner = useCallback(() => {
    if (partner) {
      removeAttendee(partner.attendeeId);
    } else {
      addPartnerAttendee(attendeeId);
    }
  }, [partner, attendeeId]);
  
  return { attendee, partner, hasPartner, togglePartner };
};
```

### 4. Form Layouts as Pure Composition

**MasonForm** becomes:
```typescript
const MasonForm = ({ attendeeId, attendeeNumber, isPrimary }) => {
  const { attendee, updateAttendee } = useAttendeeData(attendeeId);
  
  if (!attendee) return <LoadingState />;
  
  return (
    <>
      <BasicInfo 
        data={attendee}
        type="Mason"
        isPrimary={isPrimary}
        onChange={updateAttendee}
      />
      
      {attendee.rank === 'GL' && (
        <GrandOfficerFields 
          data={attendee}
          onChange={updateAttendee}
        />
      )}
      
      <GrandLodgeSelection 
        value={attendee.grandLodgeId}
        onChange={(value) => updateAttendee('grandLodgeId', value)}
      />
      
      <LodgeSelection 
        grandLodgeId={attendee.grandLodgeId}
        value={attendee.lodgeId}
        onChange={(value) => updateAttendee('lodgeId', value)}
      />
      
      <ContactInfo 
        data={attendee}
        isPrimary={isPrimary}
        onChange={updateAttendee}
      />
      
      <AdditionalInfo 
        data={attendee}
        onChange={updateAttendee}
      />
    </>
  );
};
```

### 5. Shared Utilities

All common logic moves to `forms/attendee/lib/`:
- Data persistence
- Validation rules
- Partner management
- State synchronization

This allows any form layout to use these features without duplication.

### 6. Container Layout Implementation

**AttendeeWithPartner** becomes a true container:
```typescript
// forms/attendee/AttendeeWithPartner.tsx
const AttendeeWithPartner = ({ attendeeId, attendeeNumber, isPrimary }) => {
  const { attendee, partner, hasPartner, togglePartner } = usePartnerManager(attendeeId);
  const { renderAttendeeForm } = useAttendeeTypeRenderer();
  
  if (!attendee) return null;
  
  return (
    <>
      {/* Render appropriate form based on attendee type */}
      {renderAttendeeForm(attendee, { attendeeNumber, isPrimary })}
      
      {/* Partner toggle - only show if no partner exists */}
      {!partner && (
        <PartnerToggle 
          hasPartner={hasPartner}
          onToggle={togglePartner}
        />
      )}
      
      {/* Partner form - always a Guest form */}
      {partner && (
        <GuestForm 
          attendeeId={partner.attendeeId}
          attendeeNumber={attendeeNumber + 1}
        />
      )}
    </>
  );
};

// forms/attendee/utils/attendeeTypeRenderer.ts
export const useAttendeeTypeRenderer = () => {
  const renderAttendeeForm = (attendee: AttendeeData, props: FormProps) => {
    switch (attendee.attendeeType) {
      case 'Mason':
        return <MasonForm {...props} attendeeId={attendee.attendeeId} />;
      case 'Guest':
        return <GuestForm {...props} attendeeId={attendee.attendeeId} />;
      default:
        throw new Error(`Unknown attendee type: ${attendee.attendeeType}`);
    }
  };
  
  return { renderAttendeeForm };
};
```

## Benefits

1. **Scalability**: Easy to add new attendee types or form layouts
2. **Maintainability**: Logic is centralized, not scattered
3. **Testability**: Pure functions and separated concerns
4. **Reusability**: Components can be used in different contexts
5. **Type Safety**: Clear interfaces between layers

## Migration Path

1. Move common logic to `forms/attendee/lib/`
2. Create consolidated `BasicInfo` component
3. Refactor `MasonForm` and `GuestForm` to be pure layouts
4. Extract partner management to shared hook
5. Update imports throughout the application
6. Remove duplicate code from oldforms

## Key Principles (from parent architecture)

1. **Composition over Inheritance**: Build complex forms from simple, reusable sections
2. **Type Safety**: Use TypeScript interfaces to ensure data consistency
3. **Single Responsibility**: Each component has one clear purpose
4. **Layout Separation**: Forms handle data, layouts handle composition and display
5. **Responsive Design**: Different layouts for different screen sizes
6. **Relationship Management**: Clear FK relationships between attendees and partners

## State Management
- Global state in `registrationStore` for all attendee data
- Local state for UI controls and form interactions
- Custom hooks for shared logic between components
- Debounced updates for performance

## Data Flow
1. User interacts with form section
2. Section calls onChange with field updates
3. Layout component updates store via custom hook
4. Store update triggers re-render with new data
5. All related components receive updated data

## Type Definitions (reference)

```typescript
interface AttendeeData {
  // Identity
  attendeeId: string;
  attendeeType: 'Mason' | 'Guest';
  
  // Person Data
  title: string;
  firstName: string;
  lastName: string;
  suffix?: string;
  
  // Contact
  contactPreference: 'Directly' | 'PrimaryAttendee' | 'ProvideLater';
  primaryPhone: string;
  primaryEmail: string;
  
  // Relationships
  isPrimary: boolean;
  isPartner: string | null; // FK to parent attendee (if this attendee is a partner)
  partner?: string | null; // FK to partner attendee (if this attendee has a partner)
  relationship?: 'Husband' | 'Wife' | 'Partner' | 'Fiance' | 'Fiancee' | null;
  
  // Additional
  dietaryRequirements: string;
  specialNeeds: string;
  
  // Mason-specific (optional)
  masonicTitle?: string;
  rank?: string;
  grandOfficerStatus?: 'Present' | 'Past';
  presentGrandOfficerRole?: string;
  otherGrandOfficerRole?: string;
  grandLodgeId?: string;
  lodgeId?: string;
  lodgeNameNumber?: string;
}
```

## Domain Constants

### Title Constants
```typescript
// Mason titles
export const MASON_TITLES = ["Bro", "W Bro", "VW Bro", "RW Bro", "MW Bro"];

// Guest/Partner titles
export const GUEST_TITLES = ["Mr", "Mrs", "Ms", "Miss", "Dr", "Rev", "Prof", "Rabbi", "Hon", "Sir", "Madam", "Lady", "Dame"];
```

### Rank Constants
```typescript
export const MASON_RANKS = [
  { value: "EAF", label: "EAF" },
  { value: "FCF", label: "FCF" },
  { value: "MM", label: "MM" },
  { value: "IM", label: "IM" },
  { value: "GL", label: "GL" }
];
```

### Grand Officer Constants
```typescript
export const GRAND_OFFICER_STATUS = ["Present", "Past"] as const;

export const GRAND_OFFICER_ROLES = [
  "Grand Master",
  "Deputy Grand Master", 
  "Assistant Grand Master",
  "Grand Secretary",
  "Grand Director of Ceremonies",
  "Other"
] as const;
```

### Relationship Types
```typescript
export const PARTNER_RELATIONSHIPS = [
  "Wife",
  "Husband",
  "Partner", 
  "Spouse",
  "Fiancée",
  "Fiancé"
] as const;
```

## Business Logic

### Title-Rank Interaction Logic
```typescript
const isGrandTitle = (title: string) => ["VW Bro", "RW Bro", "MW Bro"].includes(title);

const handleTitleChange = (title: string, currentRank: string) => {
  if (title === 'W Bro' && currentRank !== 'GL') {
    return { title, rank: 'IM' };
  } else if (isGrandTitle(title)) {
    return { title, rank: 'GL' };
  }
  return { title };
};
```

### Grand Lodge Fields Display Rules
- Only show Grand Lodge fields when `rank === 'GL'`
- Show "Other" input field when `grandOfficerStatus === 'Present' && presentGrandOfficerRole === 'Other'`

### Grand Lodge and Lodge Lookup Implementation

#### Grand Lodge Selection
1. **Data Source**: `useLocationStore`
   - Initial load: `fetchInitialGrandLodges()`
   - Search: `searchGrandLodges(query)`
   
2. **AutocompleteInput Configuration**:
   ```typescript
   <AutocompleteInput<GrandLodgeRow>
     value={grandLodgeInputValue}
     onChange={onGrandLodgeInputChange}
     onSelect={handleGrandLodgeSelect}
     options={grandLodgeOptions}
     getOptionLabel={(gl) => gl.name}
     renderOption={(gl) => (
       <div>
         <div className="font-medium">{gl.name}</div>
         <div className="text-xs text-slate-500">
           <span>{gl.country ?? 'N/A'}</span>
           <span className="font-medium">{gl.abbreviation}</span>
         </div>
       </div>
     )}
     placeholder={getGrandLodgePlaceholder()} // Dynamic based on IP location
   />
   ```

3. **Selection Flow**:
   - On select: Update `grandLodgeId` in store
   - Clear Lodge selection (field dependency)
   - Update via `debouncedUpdateAttendee(50ms)`

#### Lodge Selection
1. **Data Source**: `useLocationStore`
   - Search all: `searchAllLodgesAction(query, grandLodgeId)` 
   - By GL: `getLodgesByGrandLodge(grandLodgeId)`

2. **Dependencies**:
   - Disabled until Grand Lodge selected
   - Filtered by selected Grand Lodge ID

3. **Cache Strategy**:
   ```typescript
   const cacheForGl = lodgeCacheRef.current?.byGrandLodge?.[selectedGrandLodge.id];
   const hasCachedLodges = cacheForGl?.data?.length > 0;
   ```

4. **AutocompleteInput Configuration**:
   ```typescript
   <AutocompleteInput<LodgeRow>
     value={lodgeInputValue}
     onChange={onLodgeInputChange}
     onSelect={handleLodgeSelect}
     options={lodgeOptions}
     getOptionLabel={(lodge) => lodge.display_name || `${lodge.name} No. ${lodge.number || 'N/A'}`}
     renderOption={(lodge) => (
       <div>
         <div className="font-medium">{lodge.display_name}</div>
         <div className="text-xs text-slate-500">
           <span>{lodge.district ?? ''}</span>
           <span>{lodge.meeting_place ?? ''}</span>
         </div>
       </div>
     )}
     placeholder={getLodgePlaceholder()} // Dynamic based on cache
     allowCreate={true}
     createNewText="Create new Lodge..."
     onCreateNew={handleInitiateLodgeCreation}
     disabled={!selectedGrandLodge}
   />
   ```

#### Lodge Creation
1. **UI Flow**:
   - Click "Create new Lodge..." option
   - Show overlay form with name/number inputs
   - On confirm: Create lodge via API

2. **Creation Process**:
   ```typescript
   const handleCreateLodge = async (name: string, number: string) => {
     const newLodge = await createLodgeAction({
       name: name,
       number: parseInt(number, 10) || null,
       grand_lodge_id: selectedGrandLodge.id,
       display_name: `${name} No. ${number || 'N/A'}`
     });
     
     if (newLodge) {
       handleLodgeSelect(newLodge); // Auto-select created lodge
     }
   };
   ```

#### Use Same Lodge Functionality
```typescript
// Only for non-primary Masons
const handleUseSameLodgeChange = (isChecked: boolean) => {
  if (isChecked && primaryMasonData) {
    // Copy from primary
    updateAttendee(attendeeId, {
      grandLodgeId: primaryMasonData.grandLodgeId,
      lodgeId: primaryMasonData.lodgeId,
      lodgeNameNumber: primaryMasonData.lodgeNameNumber,
    });
  } else {
    // Clear fields
    updateAttendee(attendeeId, {
      grandLodgeId: null,
      lodgeId: null,
      lodgeNameNumber: null,
    });
  }
};
```

### Grand Officer Fields Implementation

1. **Conditional Display**:
   ```typescript
   {mason.rank === 'GL' && (
     <MasonGrandLodgeFields ... />
   )}
   ```

2. **Field Dependencies**:
   - Grand Rank required when `rank === 'GL'`
   - Officer Status (Past/Present) required
   - If Status = "Present", show Role dropdown
   - If Role = "Other", show text input

3. **State Management**:
   ```typescript
   const [grandOfficerStatus, setGrandOfficerStatus] = useState(mason.grandOfficerStatus || 'Past');
   const [presentGrandOfficerRole, setPresentGrandOfficerRole] = useState(mason.presentGrandOfficerRole || '');
   const showOtherGrandOfficeInput = grandOfficerStatus === 'Present' && presentGrandOfficerRole === 'Other';
   ```

### Contact Preference Logic
```typescript
// Determine if contact fields should be shown
const showContactFields = isPrimary || contactPreference === 'Directly';

// Determine if confirmation message should be shown
const showConfirmation = !isPrimary && 
  (contactPreference === 'PrimaryAttendee' || contactPreference === 'ProvideLater');

// Dynamic confirmation messages
const getConfirmationMessage = (preference: string, primaryName: string) => {
  if (preference === 'PrimaryAttendee') {
    return `I confirm that ${primaryName} will be responsible for all communication with this attendee.`;
  }
  if (preference === 'ProvideLater') {
    return `I confirm that ${primaryName} will be responsible for all communication with this attendee until their contact details have been updated.`;
  }
  return '';
};
```

### Use Same Lodge Logic (Mason-specific)
- Only available for non-primary Masons
- Copies lodge details from primary Mason when checked

### Field Validation Rules
- Primary attendees: All basic fields required
- Grand rank required when `rank === 'GL'` and `isPrimary`
- Grand officer status required when `rank === 'GL'` and `isPrimary`
- Present role required when `grandOfficerStatus === 'Present'`
- Other description required when `presentGrandOfficerRole === 'Other'`

### Field Mapping (Store Integration)
```typescript
// Guest field name mappings
const fieldMappings = {
  'email': 'primaryEmail',
  'mobile': 'primaryPhone',
  'hasPartner': 'hasGuestPartner'
};

// Contact preference value mappings
const contactPreferenceMappings = {
  'Primary Attendee': 'PrimaryAttendee',
  'Provide Later': 'ProvideLater',
  'Directly': 'Directly'
};
```

### Implementation Details

When refactoring, these implementation patterns must be preserved:

1. Form field change handlers should use debounced updates for performance
2. Email validation should use multiple levels (format, domain check)
3. Phone numbers should maintain international format support
4. All form updates should use the Zustand store pattern

#### Grand Lodge Selection Implementation

The Grand Lodge selection uses AutocompleteInput with specific configuration:

```typescript
<AutocompleteInput
  placeholder="Type to search Grand Lodges..."
  searchFunction={searchGrandLodges}
  idField="id"
  displayField="name"
  selectedValue={selectedGrandLodge || ''}
  onValueChange={(value: string) => {
    setSelectedGrandLodge(value);
    handleGrandLodgeChange(value);
  }}
  searchAsYouType={false}
  cacheMode="session"
  selectOnly={true}
  helperText="Select your Grand Lodge"
/>
```

Key aspects:
- `searchFunction` calls Supabase API to search Grand Lodges
- `searchAsYouType` is disabled to reduce API calls
- `cacheMode="session"` caches results for the session
- `selectOnly` restricts input to dropdown selections only

#### Lodge Selection Implementation

Lodge selection depends on Grand Lodge selection and uses either existing lodges or allows creation:

```typescript
// Lodge lookup when a Grand Lodge is selected
<AutocompleteInput
  placeholder="Type to search lodges..."
  searchFunction={(query) => searchLodges(query, masonDetails)}
  displayField="display_name"  // Format: "{lodge_name} No. {lodge_number}"
  idField="lodge_id"
  selectedValue={selectedLodgeId || ''}
  onValueChange={(value: string) => {
    setSelectedLodgeId(value);
    if (value === 'create_new') {
      setShowLodgeSearch(false);
    } else {
      updateAttendee({ lodge: value });
    }
  }}
  searchType="contains"
  searchAsYouType={true}
  cacheMode="aggressive"
  cacheDuration={300000}  // 5 minutes
/>
```

Lodge search behavior:
1. Only searches lodges within the selected Grand Lodge
2. Displays lodges as "Lodge Name No. 123"
3. Caches results aggressively (5 minutes)
4. Allows creation of new lodges via "create_new" option

#### Lodge Creation Flow

When creating a new lodge:

```typescript
{!showLodgeSearch && (
  <>
    <FormLabel>Lodge Name</FormLabel>
    <Input
      value={masonDetails.lodge_name || ''}
      onChange={(e) => updateAttendee({ lodge_name: e.target.value })}
      placeholder="Enter lodge name"
    />
    
    <FormLabel>Lodge Number</FormLabel>
    <Input
      type="number"
      value={masonDetails.lodge_number || ''}
      onChange={(e) => updateAttendee({ lodge_number: parseInt(e.target.value) })}
      placeholder="Enter lodge number"
    />
    
    <Button variant="ghost" onClick={() => setShowLodgeSearch(true)}>
      Search existing lodges
    </Button>
  </>
)}
```

#### Use Same Lodge Functionality

The "Use Previous Lodge" checkbox allows copying lodge details from parent attendee:

```typescript
{showUseSameLodge && (
  <div className="flex items-center space-x-2">
    <Checkbox
      id="use-same-lodge"
      checked={useSameLodge}
      onCheckedChange={(checked) => {
        setUseSameLodge(!!checked);
        if (checked && registrationStore) {
          const primary = registrationStore.attendees.find(a => a.isPrimary);
          if (primary) {
            updateAttendee({
              grand_lodge: primary.grand_lodge,
              lodge: primary.lodge,
              lodge_name: primary.lodge_name,
              lodge_number: primary.lodge_number
            });
          }
        }
      }}
    />
    <label htmlFor="use-same-lodge">Use same lodge details</label>
  </div>
)}
```

#### Grand Officer Fields Implementation

Grand Officer status is only shown when rank is 'GL' (Grand Lodge):

```typescript
// Conditional rendering based on rank
{mason.rank === 'GL' && (
  <>
    <div className={cn("field-container", fieldWidths.narrow)}>
      <Label>Grand Officer Status</Label>
      <RadioGroup
        value={masonDetails.grandOfficerStatus || ''}
        onValueChange={(value) => updateAttendee({ grandOfficerStatus: value })}
      >
        <div className="radio-item">
          <RadioGroupItem value="Present" id="present" />
          <label htmlFor="present">Present</label>
        </div>
        <div className="radio-item">
          <RadioGroupItem value="Past" id="past" />
          <label htmlFor="past">Past</label>
        </div>
      </RadioGroup>
    </div>

    {masonDetails.grandOfficerStatus && (
      <div className="field-container">
        <Label>Grand Officer Details</Label>
        <Textarea
          value={masonDetails.grandOfficerDetails || ''}
          onChange={(e) => updateAttendee({ grandOfficerDetails: e.target.value })}
          placeholder="Enter officer position and years of service"
          rows={3}
        />
      </div>
    )}
  </>
)}
```

Business rules:
1. Grand Officer fields only display when rank === 'GL'
2. Grand Officer Details textarea only shows after status is selected
3. Details should capture position and years of service

#### Masonic Title and Rank Selection

Title selection uses a simple Select component with predefined values:

```typescript
<Select
  value={masonDetails.title || ''}
  onValueChange={(value) => updateAttendee({ title: value })}
>
  <SelectTrigger>
    <SelectValue placeholder="Select title" />
  </SelectTrigger>
  <SelectContent>
    {MASON_TITLES.map(title => (
      <SelectItem key={title} value={title}>{title}</SelectItem>
    ))}
  </SelectContent>
</Select>
```

Rank selection follows similar pattern with automatic clearing of Grand Lodge fields when changed:

```typescript
<Select
  value={masonDetails.rank || ''}
  onValueChange={(value) => {
    updateAttendee({ 
      rank: value,
      // Clear Grand Officer fields if rank changes from GL
      ...(masonDetails.rank === 'GL' && value !== 'GL' && {
        grandOfficerStatus: null,
        grandOfficerDetails: null
      })
    });
  }}
>
  {MASON_RANKS.map(rank => (
    <SelectItem key={rank.value} value={rank.value}>
      {rank.label}
    </SelectItem>
  ))}
</Select>
```

This structure aligns with React/Next.js best practices while providing the flexibility and scalability you need.