# UI Component Library Conflicts

## Conflict Summary
Three UI component libraries are present: Radix UI, Headless UI, and shadcn/ui (which uses Radix UI). This creates redundancy since Headless UI and Radix UI serve the same purpose.

## Forensic Analysis

### Libraries Present

1. **Package.json Dependencies:**
   ```json
   "@headlessui/react": "^2.2.2",
   "@radix-ui/react-accordion": "1.2.2",
   "@radix-ui/react-alert-dialog": "1.1.4",
   // ... 20+ more Radix UI components
   ```

2. **Actual Usage:**
   - **Radix UI:** 32 files (through shadcn/ui)
   - **Headless UI:** 1 file only
   - **shadcn/ui:** Main component system

### Specific Usage

1. **Headless UI (Single Usage):**
   ```typescript
   // Only in FilterableCombobox.tsx
   /components/register/payment/FilterableCombobox.tsx
   import { Combobox, ComboboxButton, ComboboxInput, ComboboxOption, ComboboxOptions } from '@headlessui/react'
   ```

2. **Radix UI (Through shadcn/ui):**
   ```typescript
   // All UI components use Radix
   /components/ui/accordion.tsx: from "@radix-ui/react-accordion"
   /components/ui/dialog.tsx: from "@radix-ui/react-dialog"
   /components/ui/select.tsx: from "@radix-ui/react-select"
   // ... 29 more files
   ```

### Component Overlap

Both libraries provide:
- Dialogs/Modals
- Dropdowns/Select
- Combobox/Autocomplete
- Toggles/Switches
- Popovers

## Recommended Remediation

### Immediate Actions

1. **Replace Headless UI Combobox with shadcn/ui Command:**
   ```bash
   # The Command component provides combobox functionality
   # Already installed as part of shadcn/ui
   ```

2. **Update FilterableCombobox.tsx:**
   ```typescript
   // Replace Headless UI imports with shadcn/ui Command
   import {
     Command,
     CommandEmpty,
     CommandGroup,
     CommandInput,
     CommandItem,
   } from "@/components/ui/command"
   import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
   ```

3. **Remove Headless UI:**
   ```bash
   npm uninstall @headlessui/react
   ```

### Implementation Guide

1. **Convert FilterableCombobox to use Command:**
   ```typescript
   // New implementation structure
   export function FilterableCombobox<T>({ ... }) {
     const [open, setOpen] = useState(false)
     const [value, setValue] = useState("")
   
     return (
       <Popover open={open} onOpenChange={setOpen}>
         <PopoverTrigger asChild>
           <Button variant="outline" className="w-full justify-between">
             {value || placeholder}
             <ChevronsUpDown className="ml-2 h-4 w-4" />
           </Button>
         </PopoverTrigger>
         <PopoverContent className="w-full p-0">
           <Command>
             <CommandInput placeholder={placeholder} />
             <CommandEmpty>No results found.</CommandEmpty>
             <CommandGroup>
               {items.map((item) => (
                 <CommandItem
                   key={itemKey(item)}
                   value={item.name}
                   onSelect={() => {
                     onChange(item)
                     setOpen(false)
                   }}
                 >
                   <Check className={cn("mr-2 h-4 w-4", 
                     value === item.name ? "opacity-100" : "opacity-0"
                   )} />
                   {displayValue(item)}
                 </CommandItem>
               ))}
             </CommandGroup>
           </Command>
         </PopoverContent>
       </Popover>
     )
   }
   ```

2. **Alternative: Use existing shadcn/ui Select:**
   ```typescript
   // If simple selection is enough
   import {
     Select,
     SelectContent,
     SelectItem,
     SelectTrigger,
     SelectValue,
   } from "@/components/ui/select"
   ```

### Migration Steps

1. **Analyze FilterableCombobox Usage:**
   ```bash
   grep -r "FilterableCombobox" --include="*.tsx" --include="*.ts" .
   ```

2. **Test Replacement:**
   - Create new implementation
   - Test filtering functionality
   - Verify keyboard navigation
   - Check accessibility

3. **Update Imports:**
   ```typescript
   // Remove
   import { Combobox, ... } from '@headlessui/react'
   
   // Add
   import { Command, ... } from "@/components/ui/command"
   ```

### Long-term Benefits

1. **Consistency:**
   - Single component system
   - Unified styling approach
   - Consistent API patterns

2. **Bundle Size:**
   - Remove ~50KB (Headless UI)
   - No duplicate functionality

3. **Maintenance:**
   - Single library to update
   - Consistent patterns
   - Better documentation

## Risk Assessment

- **Low Risk:** Only one file affected
- **Medium Risk:** Complex component migration
- **High Benefit:** Remove entire library dependency

## Verification Steps

1. **Functionality Testing:**
   - Search/filter works
   - Keyboard navigation
   - Selection updates form
   - Accessibility maintained

2. **Visual Testing:**
   - Styling matches design
   - Responsive behavior
   - Loading states

3. **Build Verification:**
   ```bash
   npm run build
   # No Headless UI imports
   ```

4. **Bundle Analysis:**
   ```bash
   # Check bundle size reduction
   npm run analyze-bundle
   ```

## Alternative Approach

If migration is complex, consider:
1. Keep Headless UI temporarily
2. Create tickets for migration
3. Prevent new Headless UI usage
4. Migrate gradually

```json
// ESLint rule to prevent new usage
{
  "rules": {
    "no-restricted-imports": ["error", {
      "paths": [{
        "name": "@headlessui/react",
        "message": "Use shadcn/ui components instead"
      }]
    }]
  }
}
```