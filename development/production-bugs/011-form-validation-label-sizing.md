# Form Validation Error Label Sizing Inconsistency

## Issue Description
When form validation errors occur, the label font size changes instead of maintaining the standard label size and only changing the color to red. This creates a jarring visual experience and inconsistent UI behavior.

## Current Behavior
- Normal state: Labels display at standard font size
- Error state: Labels change both color (to red) AND font size
- Creates visual jump/shift when errors appear or clear

## Expected Behavior
- Normal state: Standard label font size and color
- Error state: Same font size as normal state, but with red text color
- Smooth transition with only color change, no size adjustment
- Consistent visual hierarchy maintained throughout form states

## Visual Impact
- Labels appearing to "shrink" or "grow" during validation
- Layout shift as error states toggle
- Inconsistent typography across form states
- Unprofessional appearance during form interactions

## Affected Areas
- All form fields with validation
- Registration forms (Mason, Guest, Contact details)
- Payment forms
- Any input field with label and validation

## Technical Details
- Likely CSS class conflict between error and normal states
- Possible competing font-size declarations
- May involve transition animations affecting size
- Could be related to form library error styling

## Priority
Medium - Affects visual consistency and professional appearance

## Suggested Fix
1. Audit all label CSS classes for font-size declarations
2. Ensure error state classes only modify color, not size
3. Use consistent CSS specificity for all label states
4. Consider using CSS custom properties for consistent sizing
5. Test across all form types and validation states

## Example CSS Fix
```css
/* Current (problematic) */
.label { font-size: 14px; }
.label-error { font-size: 12px; color: red; }

/* Expected */
.label { font-size: 14px; }
.label-error { color: red; }
/* Font size inherited from base .label class */
```

## Testing Requirements
- Test all form types
- Verify no layout shift on error state changes
- Ensure accessibility contrast ratios maintained
- Check responsive behavior on different screen sizes
- Validate with screen readers that errors are announced properly