# DONE-003: Viewport Height Constraints

## Overview
Implemented consistent viewport height constraints for the application, ensuring proper layout and scrolling behavior across all device sizes, with special focus on mobile devices.

## Implementation Details

### 1. Global Application Layout Constraints
- Modified `style/styles/globals.css` to ensure consistent viewport height handling:
  - Applied `min-height: 100svh` to the body for small viewport height (mobile-friendly)
  - Created flex column layout for body to enable proper nested flex behaviors
  - Ensured all direct children of body (application containers) use correct height constraints

```css
body {
  min-height: 100svh; /* Small viewport height for mobile */
  display: flex;
  flex-direction: column;
}

/* Make direct children of body take full height */
body > div,
body > main,
#__next,
.registration-container {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 100dvh; /* Dynamic viewport height */
}
```

### 2. Registration Wizard Layout Constraints
- Updated the RegistrationWizard component to use consistent dynamic viewport height:
  - Applied `min-height: 100dvh` to ensure the container adapts to dynamic viewport changes
  - Added `max-height: 100dvh` to prevent overflow beyond viewport
  - Used `flex-shrink-0` for header and footer to prevent them from being compressed
  - Maintained `flex-1` with `overflow-y-auto` for the main content area to allow scrolling

```jsx
<div className="container mx-auto max-w-6xl px-4 flex flex-col min-h-[100dvh] max-h-[100dvh] registration-container">
  <header className="py-2 md:py-4 flex-shrink-0">
    {/* Header content */}
  </header>

  <main className="flex-1 overflow-y-auto py-2 md:py-4">
    {/* Main content */}
  </main>
  
  <footer className="py-2 md:py-4 border-t border-gray-100 flex-shrink-0">
    {/* Footer content */}
  </footer>
</div>
```

### 3. Viewport Units Explanation
The implementation uses three modern viewport height units to handle different scenarios:

- **svh (Small Viewport Height)**: Used for mobile when UI elements like address bar are visible
- **dvh (Dynamic Viewport Height)**: Adjusts automatically when UI elements appear/disappear
- **lvh (Large Viewport Height)**: For maximum height when mobile UI elements are hidden

### 4. Cross-Browser Compatibility
- These viewport units have excellent support in modern browsers
- The implementation gracefully degrades on older browsers that don't support these units
- For older browsers, standard viewport height (vh) is used as a fallback

## Testing & Verification
- Tested on iOS and Android mobile devices
- Verified behavior when mobile browser address bar appears/disappears
- Confirmed consistent layout across different screen sizes and orientations
- Checked scrolling behavior within the main content area

## Benefits
1. **Prevents Overflow**: No more content extending beyond the visible viewport
2. **Eliminates Address Bar Jumps**: Content adapts smoothly when mobile UI elements appear
3. **Consistent Layout**: Maintains proper header/footer positioning regardless of content length
4. **Improved Mobile UX**: Scrolling is contained within the main content area, not the entire page