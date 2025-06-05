# PRD: Type-Specific Confirmation Routes and Email Templates

## Overview
Implement registration type-specific confirmation pages and update all email templates to use confirmation numbers with proper routing.

## Background
Currently, all confirmations use a single route pattern. Different registration types (individuals, lodge, delegation) have different data structures and display requirements. Email templates still reference registration IDs instead of confirmation numbers.

## Goals
1. Create type-specific confirmation routes for better UX
2. Display type-appropriate information on confirmation pages
3. Update all email templates to use confirmation numbers
4. Ensure email links route to correct type-specific pages

## User Stories

### As an Individual Registrant
- I see my personal details and tickets on confirmation
- I receive an email with my confirmation number
- The email link takes me to my individual confirmation page

### As a Lodge Secretary
- I see lodge details and all member information
- I receive an email with lodge-specific information
- The confirmation shows all lodge members and their tickets

### As a Delegation Leader
- I see delegation details and all delegates
- I receive appropriate delegation confirmation
- The page shows delegation-specific information

## Technical Requirements

### 1. Database Changes
- Create unified confirmation view supporting all types
- Ensure confirmation numbers are unique across all types
- Add type identification to confirmation data

### 2. Route Structure
```
/functions/[slug]/register/confirmation/
  ├── individuals/[confirmationNumber]/
  ├── lodge/[confirmationNumber]/
  └── delegation/[confirmationNumber]/
```

### 3. Confirmation Views

#### Individuals View
- Personal attendee details
- Individual tickets
- Contact information
- Payment summary

#### Lodge View
- Lodge information (name, number)
- All lodge members
- Member tickets grouped by member
- Lodge secretary contact
- Total lodge payment

#### Delegation View
- Delegation details
- All delegates
- Delegation leader contact
- Grouped ticket information

### 4. Email Template Updates

#### Template Types to Update
1. `individuals_confirmation_template.tsx`
2. `lodge_confirmation_template.tsx`
3. `attendee_direct_ticket_template.tsx`
4. `primary_contact_ticket_template.tsx`

#### Required Changes
- Replace registration ID with confirmation number
- Update confirmation URLs to type-specific routes
- Add confirmation number prominently in email
- Ensure responsive design

### 5. API Updates
- Confirmation API must identify registration type
- Email service must determine correct template
- URL generation must use type-specific routes

## Success Criteria
1. Each registration type has its own confirmation route
2. Confirmation pages display type-appropriate content
3. All emails use confirmation numbers
4. Email links route to correct type-specific page
5. Backward compatibility maintained for existing registrations

## Implementation Phases

### Phase 1: Database Layer
- Create comprehensive confirmation views for all types
- Add type identification to queries

### Phase 2: Route Implementation
- Create type-specific route folders
- Implement page components for each type
- Add proper data fetching

### Phase 3: Email Template Updates
- Update all templates to use confirmation numbers
- Implement type-specific URL generation
- Test email rendering

### Phase 4: Integration
- Update payment flow redirects
- Update email sending logic
- End-to-end testing

## Risk Mitigation
1. **Existing registrations**: Maintain backward compatibility
2. **Type detection**: Robust type identification from confirmation number
3. **Email delivery**: Test all email templates thoroughly
4. **Performance**: Optimize confirmation views for quick loading

## Timeline
- Phase 1: 2 hours
- Phase 2: 3 hours
- Phase 3: 2 hours
- Phase 4: 2 hours
Total: ~9 hours