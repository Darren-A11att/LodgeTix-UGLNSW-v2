# Design Review: Attendee Details Step (Step 2)

## File Path
- Main Component: `/components/register/attendee/AttendeeDetails.tsx`
- Mason Form: `/components/register/forms/mason/MasonForm.tsx`
- Guest Form: `/components/register/forms/guest/GuestForm.tsx`

## Design Issues Identified

### Typography Issues
1. **Inconsistent Heading Hierarchy**
   - Main heading: `<h1>` with `text-2xl font-bold`
   - Form headings: `<h3>` with `text-xl font-bold`
   - No consistent sizing scale between steps
   - Error heading: `text-lg font-bold`

2. **Font Weight Inconsistencies**
   - Main headings: `font-bold`
   - Form headings: `font-bold`
   - Error messages: `font-bold`
   - No medium or light weights used for hierarchy

3. **Text Sizes**
   - Main heading: `text-2xl`
   - Form headings: `text-xl` 
   - Error headings: `text-lg`
   - Debug text: `text-xs`
   - No consistent scale or relationship

### Color Inconsistencies
1. **Text Colors**
   - Main heading: `text-masonic-navy`
   - Description: `text-gray-600`
   - Form headings: `text-slate-800`
   - Debug text: `text-gray-500`
   - Error messages: `text-red-800`
   - Remove buttons: `text-red-500 hover:text-red-700`
   - Mixed color palettes (masonic vs slate vs gray)

2. **Background Colors**
   - Form containers: `bg-slate-50`
   - Terms container: `bg-slate-50`
   - Error container: `bg-red-50`
   - No consistent background system

3. **Border Colors**
   - Form divider: `border-slate-200`
   - Terms border: `border-slate-200`
   - Error border: `border-red-200`
   - Debug button: `bg-blue-100 text-blue-800`

### Layout & Spacing Issues
1. **Container Spacing**
   - Main container: `space-y-6`
   - Form containers: `p-6 mb-8`
   - Button area: `mt-8 pt-6`
   - Terms container: `mt-8`
   - Inconsistent margin/padding patterns

2. **Form Layout**
   - Different padding for different sections
   - No consistent spacing between form fields
   - Add/Remove controls have `gap-4`
   - Button layout uses `flex justify-between`

3. **Error Display**
   - Error container: `mt-6 p-4`
   - Error list: `space-y-1`
   - Different spacing approach from other elements

### Visual Components
1. **Card/Container Styling**
   - Form containers: `bg-slate-50 rounded-lg`
   - Error container: `bg-red-50 rounded-lg`
   - Terms container: `rounded-md`
   - Different border radius values

2. **Button Styling**
   - Remove buttons: Text only with icon
   - Navigation buttons: Standard button component
   - Debug button: Custom inline styling
   - No consistent button approach

3. **Icons**
   - Remove icon: `X` from lucide-react
   - Trash icon: `FaTrash` from react-icons (in MasonForm)
   - Mixed icon libraries
   - Different sizes: `w-4 h-4`

### Interactive Elements
1. **Remove Actions**
   - Text buttons with hover color change
   - No consistent removal pattern
   - Different styling between forms

2. **Form Controls**
   - Terms checkbox in separate container
   - Add/Remove controls as custom components
   - Debug controls with inline styles

3. **Navigation**
   - Previous button: `variant="outline"`
   - Continue button: Primary style
   - Disabled state based on validation

### Component Composition Issues
1. **Mixed Component Sources**
   - Custom SectionHeader
   - Standard Button from shadcn/ui
   - Custom form components (MasonForm, GuestForm)
   - Custom UI components (TermsAndConditions, AddRemoveControl)

2. **Form Structure**
   - Different form layouts for Mason vs Guest
   - Conditional rendering for partners
   - Complex validation logic mixed with UI

3. **State Management**
   - Validation errors tracked separately
   - Terms agreement as prop
   - Complex attendee management logic

### Responsive Design Issues
1. **No Mobile Optimization**
   - Fixed layouts
   - No responsive classes
   - Forms likely too wide on mobile

2. **Button Layout**
   - `flex justify-between` may not work well on small screens
   - No stacking for mobile

## Summary
The Attendee Details Step shows significant design fragmentation:
- Multiple color palettes (masonic, slate, gray)
- Inconsistent typography scales
- Different container styles and spacing
- Mixed component libraries and approaches
- Complex conditional rendering affecting visual consistency
- No responsive design considerations
- Different patterns for similar UI elements (forms, buttons, errors)