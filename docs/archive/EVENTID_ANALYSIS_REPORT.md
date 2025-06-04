# EventId Reference Analysis Report

## Summary
Analysis of 11 files that reference `eventId` from the registration store to determine which need updates vs which can be documented for later review.

---

## 🚨 CRITICAL UPDATES NEEDED

### 1. `order-review-step.tsx` - HIGH PRIORITY
**Current Issue:** Uses `eventId` from store (line 48)
```typescript
const eventId = useRegistrationStore((s) => s.eventId);
```
**Impact:** Breaks order review functionality in registration flow
**Action Required:** Update to use `functionId` and function-based ticket service
**Status:** ❌ BROKEN - Needs immediate fix

### 2. `payment-step.tsx` - HIGH PRIORITY  
**Current Issue:** Accepts `eventId` as prop and uses event-based service (line 26, 37, 46)
```typescript
interface PaymentStepProps {
  eventId?: string; // ❌ Should be functionId
}
```
**Impact:** Payment step cannot load ticket data properly
**Action Required:** Update to use function-based data
**Status:** ❌ BROKEN - Needs immediate fix

### 3. `LodgeRegistrationStep.tsx` - HIGH PRIORITY
**Current Issue:** Requires `eventId` as prop (line 24)
```typescript
interface LodgeRegistrationStepProps {
  eventId: string; // ❌ Should be functionId
}
```
**Impact:** Lodge registration flow broken
**Action Required:** Update interface and implementation
**Status:** ❌ BROKEN - Needs immediate fix

---

## 📋 LEGACY CODE TO REVIEW LATER

### 4. `event-selection-step.tsx` - LEGACY COMPONENT
**Current Usage:** Uses `eventId` for event selection within function (line 27)
```typescript
const handleEventToggle = (eventId: string) => {
  // Logic for selecting events within a function
}
```
**Analysis:** This appears to be a step for selecting which events within a function to attend
**Impact:** Potentially useful for function-based selection but not currently in main flow
**Action Required:** Review if this should be part of function registration workflow
**Status:** ⚠️ REVIEW NEEDED - May be useful for function event selection

### 5. `MasonicOrdersForm.tsx` - HARDCODED EVENT IDS
**Current Usage:** Hardcoded event IDs for Grand Proclamation (lines 35-39)
```typescript
const EVENT_IDS = {
  GRAND_PROCLAMATION: '307c2d85-72d5-48cf-ac94-082ca2a5d23d',
  GALA_DINNER: '03a51924-1606-47c9-838d-9dc32657cd59', 
  CEREMONY: '6c12952b-7cf3-4d6a-81bd-1ac3b7ff7076'
};
```
**Analysis:** Legacy form with hardcoded event references
**Impact:** Minimal - appears to be registration form utility
**Action Required:** Evaluate if still needed or should use function-based approach
**Status:** ⚠️ REVIEW NEEDED - May be legacy/unused

### 6. `GrandLodgesForm.tsx` - DUPLICATE OF ABOVE
**Current Usage:** Same hardcoded event IDs as MasonicOrdersForm
**Analysis:** Duplicate implementation, likely legacy
**Impact:** Minimal 
**Action Required:** Review for consolidation or removal
**Status:** ⚠️ REVIEW NEEDED - Likely duplicate/legacy

### 7. `LodgesForm.tsx` - DUPLICATE OF ABOVE  
**Current Usage:** Same hardcoded event IDs pattern
**Analysis:** Another duplicate implementation
**Impact:** Minimal
**Action Required:** Review for consolidation or removal  
**Status:** ⚠️ REVIEW NEEDED - Likely duplicate/legacy

---

## ✅ SAFE WITH FALLBACKS

### 8. `confirmation-step.tsx` - SAFE
**Current Usage:** No direct `eventId` usage found in main logic
**Analysis:** Uses minimal hardcoded ticket definitions as fallback
```typescript
const ticketTypesMinimal = [
  { id: "installation", name: "Installation Ceremony", price: 75 },
  // ... fallback data
];
```
**Impact:** Works with fallback data, doesn't break flow
**Action Required:** None immediate - works with static data
**Status:** ✅ SAFE - Has fallback behavior

### 9. `registration-wizard.tsx` - SAFE
**Current Usage:** No `eventId` usage in interface - already function-based
```typescript
export interface RegistrationWizardProps {
  functionSlug: string; // ✅ Already correct
  registrationId?: string;
}
```
**Impact:** Already properly function-based
**Action Required:** None
**Status:** ✅ SAFE - Already correct

### 10. `AttendeeEditModal.tsx` - SAFE  
**Current Usage:** Type errors on ticket property but has fallback logic
```typescript
// @ts-expect-error Property 'ticket' does not exist on type 'UnifiedAttendeeData'.
const totalTickets = useRegistrationStore(state => 
  state.attendees.reduce((acc, att) => acc + (att.ticket?.selectedEvents?.length || 0), 0)
);
```
**Analysis:** Has TypeScript errors but fallback logic prevents runtime crashes
**Impact:** Non-critical - attendee editing works without ticket details
**Action Required:** Review ticket property structure later
**Status:** ✅ SAFE - Has fallback logic

---

## 🎯 IMMEDIATE ACTION PLAN

### Phase 1: Fix Critical Registration Flow (URGENT)
1. **order-review-step.tsx** - Update to use `functionId` and function-based service
2. **payment-step.tsx** - Update interface and implementation for function-based data  
3. **LodgeRegistrationStep.tsx** - Update to receive and use `functionId`

### Phase 2: Legacy Code Review (LATER)
4. **event-selection-step.tsx** - Evaluate for function event selection feature
5. **MasonicOrdersForm.tsx** - Review hardcoded event IDs approach
6. **GrandLodgesForm.tsx** - Consolidate or remove duplicate
7. **LodgesForm.tsx** - Consolidate or remove duplicate

### Phase 3: Code Quality (LATER)  
8. **AttendeeEditModal.tsx** - Fix TypeScript errors and ticket property structure

---

## 📊 IMPACT ASSESSMENT

**HIGH IMPACT (Registration Flow Broken):**
- order-review-step.tsx ❌
- payment-step.tsx ❌ 
- LodgeRegistrationStep.tsx ❌

**LOW IMPACT (Legacy/Unused):**
- event-selection-step.tsx ⚠️
- MasonicOrdersForm.tsx ⚠️
- GrandLodgesForm.tsx ⚠️
- LodgesForm.tsx ⚠️

**NO IMPACT (Working):**
- confirmation-step.tsx ✅
- registration-wizard.tsx ✅
- AttendeeEditModal.tsx ✅

## RECOMMENDATION
Focus immediately on the 3 HIGH IMPACT files to restore registration flow functionality. The 4 legacy files can be addressed in a separate cleanup task after core functionality is working.