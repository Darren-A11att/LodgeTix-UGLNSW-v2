# Key Decisions Register

This document tracks key architectural and implementation decisions made during the Forms Architecture refactoring project.

## Decision Format

Each decision follows this structure:
- **Decision ID**: Unique identifier
- **Phase**: Which phase the decision was made in
- **Date**: When the decision was made
- **Decision**: What was decided
- **Rationale**: Why this decision was made
- **Impact**: How this affects the codebase
- **Alternatives Considered**: Other options that were evaluated

---

## Decisions Log

### DECISION-001: Forms Architecture Structure
- **Phase**: Initial Planning
- **Date**: Not specified
- **Decision**: Create 5-tier component hierarchy for forms
- **Rationale**: Clean separation of concerns and maximum reusability
- **Impact**: All form components follow this structure
- **Alternatives Considered**: Flat structure, 3-tier structure

### DECISION-002: Zustand for State Management
- **Phase**: Phase 1
- **Date**: Not specified
- **Decision**: Use Zustand for attendee state management
- **Rationale**: Lightweight, TypeScript-friendly, good developer experience
- **Impact**: All form state flows through Zustand store
- **Alternatives Considered**: Redux, Context API, local state

### DECISION-003: Separate Updated Files
- **Phase**: Multiple phases
- **Date**: Various
- **Decision**: Create new files with "Updated" suffix rather than overwriting
- **Rationale**: Preserve existing functionality during transition
- **Impact**: Requires cleanup phase to remove old files
- **Alternatives Considered**: Direct file replacement

### DECISION-004: TypeScript Strict Mode
- **Phase**: Phase 1
- **Date**: Not specified
- **Decision**: Use strict TypeScript for all new components
- **Rationale**: Better type safety and fewer runtime errors
- **Impact**: More upfront work but better maintainability
- **Alternatives Considered**: Loose typing, gradual typing

### DECISION-005: Component Composition Pattern
- **Phase**: Phase 4
- **Date**: Not specified
- **Decision**: Use composition over inheritance for forms
- **Rationale**: More flexible and easier to test
- **Impact**: Forms are built from smaller, focused components
- **Alternatives Considered**: Class-based inheritance, HOCs

### DECISION-006: Validation Strategy
- **Phase**: Phase 3
- **Date**: Not specified
- **Decision**: Use react-hook-form with Zod for validation
- **Rationale**: Declarative validation with good TypeScript support
- **Impact**: Consistent validation across all forms
- **Alternatives Considered**: Custom validation, Yup, Joi

### DECISION-007: Attendee Type Flexibility
- **Phase**: Phase 2
- **Date**: Various
- **Decision**: Support both 'Mason' and 'Guest' types throughout
- **Rationale**: Core business requirement for events
- **Impact**: Type checking and conditional logic in many components
- **Alternatives Considered**: Single attendee type, multiple form paths

### DECISION-008: Partner Management
- **Phase**: Phase 1-2
- **Date**: Not specified
- **Decision**: Partners are always type 'Guest' and linked to primary attendee
- **Rationale**: Business rule for Mason events
- **Impact**: Special handling in state management and forms
- **Alternatives Considered**: Partners as independent attendees

### DECISION-009: QR Code Implementation
- **Phase**: Phase 6
- **Date**: 5/19/2025
- **Decision**: Generate QR codes client-side with checksum validation
- **Rationale**: Immediate generation without server dependencies
- **Impact**: Added qrcode library dependency
- **Alternatives Considered**: Server-side generation, third-party service

### DECISION-010: PDF Ticket Generation
- **Phase**: Phase 6
- **Date**: 5/19/2025
- **Decision**: Generate PDFs client-side using pdf-lib
- **Rationale**: Better performance and user experience
- **Impact**: Added pdf-lib dependency, larger bundle size
- **Alternatives Considered**: Server-side generation, HTML to PDF

### DECISION-011: Email Service Choice
- **Phase**: Phase 6
- **Date**: 5/19/2025
- **Decision**: Use Resend for email delivery
- **Rationale**: User specifically requested Resend integration
- **Impact**: Added resend dependency, requires API key
- **Alternatives Considered**: SendGrid, AWS SES, Mailgun

### DECISION-012: Ticket Data Structure
- **Phase**: Phase 6
- **Date**: 5/19/2025
- **Decision**: Compact JSON format for QR codes with checksums
- **Rationale**: Balance between data completeness and QR code size
- **Impact**: Specific parsing required for QR validation
- **Alternatives Considered**: Base64 encoding, URL parameters

## Patterns Established

### Form Component Pattern
```typescript
interface FormProps {
  attendees: Attendee[];
  onUpdate: (id: string, data: Partial<Attendee>) => void;
  onValidation?: (isValid: boolean) => void;
}
```

### Hook Pattern
```typescript
const useFormHook = () => {
  // State
  // Callbacks
  // Effects
  return { /* public API */ };
};
```

### Validation Pattern
```typescript
const schema = z.object({
  field: z.string().min(1, "Required"),
  // ...
});
```

## Future Considerations

1. **Performance**: May need to optimize for large attendee lists
2. **Testing**: Comprehensive test suite needed
3. **Accessibility**: WCAG compliance review required
4. **Internationalization**: May need multi-language support
5. **Analytics**: Consider adding tracking for form completion
6. **Security**: QR code validation endpoint needed

---

**Last Updated**: 5/19/2025  
**Maintained By**: Forms Architecture Team