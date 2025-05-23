# Forms Architecture Diagram

## Component Hierarchy

```mermaid
graph TD
    A[Registration Wizard] --> B[Registration Type Step]
    B --> C[Attendee Details Step]
    
    C --> D{Registration Type}
    D -->|Individual| E[IndividualsForm]
    D -->|Lodge| F[LodgesForm]
    D -->|Delegation| G[DelegationsForm]
    
    E --> H[AttendeeWithPartner]
    F --> H
    G --> H
    
    H --> I{Attendee Type}
    I -->|Mason| J[MasonForm]
    I -->|Guest| K[GuestForm]
    
    J --> L[Form Sections]
    K --> L
    
    L --> M[BasicInfo]
    L --> N[ContactInfo]
    L --> O[AdditionalInfo]
    L --> P[LodgeSelection]
    L --> Q[GrandOfficerFields]
    
    style A fill:#f9f,stroke:#333,stroke-width:4px
    style H fill:#bbf,stroke:#333,stroke-width:2px
    style L fill:#bfb,stroke:#333,stroke-width:2px
```

## Data Flow

```mermaid
sequenceDiagram
    participant User
    participant Component
    participant Hook
    participant Store
    participant API
    
    User->>Component: Input change
    Component->>Hook: updateField()
    Hook->>Store: updateAttendee()
    Store->>Store: Validate data
    Store-->>Component: Re-render
    Component-->>User: Show updates
    
    User->>Component: Submit form
    Component->>Hook: validateForm()
    Hook->>Store: validateAllAttendees()
    Store->>API: Save registration
    API-->>Store: Success
    Store-->>Component: Navigate to next
```

## Component Relationships

```mermaid
graph LR
    A[AttendeeWithPartner] -->|contains| B[MasonForm/GuestForm]
    B -->|contains| C[BasicInfo]
    B -->|contains| D[ContactInfo]
    B -->|contains| E[AdditionalInfo]
    B -->|uses| F[useAttendeeData]
    A -->|uses| G[usePartnerManager]
    
    C -->|emits| H[onChange]
    D -->|emits| H
    E -->|emits| H
    
    F -->|connects to| I[registrationStore]
    G -->|connects to| I
    
    style A fill:#f96,stroke:#333,stroke-width:2px
    style B fill:#69f,stroke:#333,stroke-width:2px
    style I fill:#f66,stroke:#333,stroke-width:2px
```

## Directory Structure

```
Forms/
├── attendee/
│   ├── AttendeeWithPartner.tsx      # Container for attendee + partner
│   ├── IndividualsForm.tsx          # Individual registration layout
│   ├── LodgesForm.tsx               # Lodge group registration
│   ├── DelegationsForm.tsx          # Delegation registration
│   ├── lib/
│   │   ├── useAttendeeData.ts       # Attendee state management
│   │   ├── usePartnerManager.ts     # Partner relationship logic
│   │   └── usePersistence.ts        # Draft persistence
│   ├── utils/
│   │   ├── attendeeTypeRenderer.tsx # Dynamic form selection
│   │   ├── businessLogic.ts         # Business rules
│   │   ├── constants.ts             # Domain constants
│   │   ├── formatters.ts            # Data formatting
│   │   └── validation.ts            # Validation rules
│   └── types.ts                     # TypeScript interfaces
│
├── basic-details/
│   ├── BasicInfo.tsx                # Personal details
│   ├── ContactInfo.tsx              # Contact information
│   ├── AdditionalInfo.tsx           # Dietary/special needs
│   └── ContactConfirmationMessage.tsx
│
├── mason/
│   ├── Layouts/
│   │   └── MasonForm.tsx            # Mason form composition
│   ├── lib/
│   │   ├── GrandLodgeSelection.tsx  # Grand Lodge search
│   │   └── LodgeSelection.tsx       # Lodge search
│   └── utils/
│       └── GrandOfficerFields.tsx   # Grand Officer details
│
├── guest/
│   └── Layouts/
│       └── GuestForm.tsx            # Guest form composition
│
└── shared/
    ├── AutocompleteInput.tsx        # Search dropdown
    ├── FieldComponents.tsx          # Basic form fields
    ├── PartnerToggle.tsx            # Partner add/remove
    └── TermsAndConditions.tsx       # T&C component
```

## State Management Flow

```mermaid
graph TD
    A[User Action] --> B[Component Event]
    B --> C[Hook Function]
    C --> D{Action Type}
    
    D -->|Update Field| E[useAttendeeData]
    D -->|Toggle Partner| F[usePartnerManager]
    D -->|Validate| G[useValidation]
    D -->|Save Draft| H[usePersistence]
    
    E --> I[registrationStore]
    F --> I
    G --> J[Local State]
    H --> K[localStorage]
    
    I --> L[Store Update]
    L --> M[Component Re-render]
    
    style A fill:#ffd,stroke:#333,stroke-width:2px
    style I fill:#ddf,stroke:#333,stroke-width:2px
    style L fill:#dfd,stroke:#333,stroke-width:2px
```

## Business Logic Flow

```mermaid
flowchart TD
    A[Title Change] --> B{Is W Bro?}
    B -->|Yes| C{Current Rank GL?}
    B -->|No| D{Is Grand Title?}
    
    C -->|No| E[Suggest IM Rank]
    C -->|Yes| F[Keep Current]
    
    D -->|Yes| G[Suggest GL Rank]
    D -->|No| H[No Suggestion]
    
    I[Rank Change to GL] --> J[Show Grand Officer Fields]
    J --> K{Status = Present?}
    K -->|Yes| L[Show Role Dropdown]
    K -->|No| M[Hide Role Fields]
    
    L --> N{Role = Other?}
    N -->|Yes| O[Show Other Input]
    N -->|No| P[Hide Other Input]
```

## Validation Flow

```mermaid
flowchart LR
    A[Form Input] --> B[Field Validation]
    B --> C{Valid?}
    C -->|No| D[Show Error]
    C -->|Yes| E[Clear Error]
    
    F[Submit Form] --> G[Validate All Fields]
    G --> H{All Valid?}
    H -->|No| I[Show Errors]
    H -->|Yes| J[Process Submit]
    
    K[Attendee Type] --> L{Mason?}
    L -->|Yes| M[Validate Mason Fields]
    L -->|No| N[Validate Guest Fields]
    
    M --> O[Check Rank]
    M --> P[Check Lodge]
    N --> Q[Check Contact]
    
    style A fill:#ffd,stroke:#333
    style F fill:#ffd,stroke:#333
    style J fill:#dfd,stroke:#333
```