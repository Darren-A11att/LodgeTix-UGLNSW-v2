# Registration Wizard Scroll Accessibility Issue

## Issue Description
In the registration wizard, when a step page requires scrolling, the page only scrolls when the user's mouse cursor is positioned inside the container. If the cursor is outside the container boundaries, scrolling is disabled, creating a significant accessibility barrier.

## Steps to Reproduce
1. Navigate to any registration wizard step with content that exceeds viewport height
2. Position mouse cursor outside the main content container (e.g., on the sidebar, background, or summary column)
3. Attempt to scroll using mouse wheel or trackpad
4. Observe that scrolling does not work

## Expected Behavior
- Scrolling should work regardless of cursor position on the page
- Users should be able to scroll the active step content from anywhere on the screen
- Consistent scroll behavior across all wizard steps

## Actual Behavior
- Scrolling only works when cursor is within the specific container bounds
- Users must consciously position cursor inside content area to scroll
- Creates confusion and friction in the user experience

## Impact
- **Accessibility**: Major barrier for users with motor impairments who may have difficulty precisely positioning cursor
- **User Experience**: Frustrating for all users who expect natural scrolling behavior
- **Usability**: Increases cognitive load as users must think about cursor position
- **Completion Rates**: May cause users to abandon registration process

## Technical Considerations
This issue requires deep analysis as it may have broader implications:

1. **Layout Architecture**: Current container structure may be preventing event propagation
2. **CSS Overflow**: Nested overflow properties might be conflicting
3. **Event Handling**: Scroll events may be captured/stopped at wrong container level
4. **Component Structure**: May require restructuring wizard layout components
5. **Side Effects**: Fixing this could impact:
   - Fixed positioning elements
   - Modal/overlay behavior
   - Mobile touch scrolling
   - Keyboard navigation

## Affected Components
- Registration wizard shell/wrapper
- Step layout containers
- Scroll event handling
- CSS overflow properties
- Possibly affects all multi-column layouts

## Priority
**Critical** - Accessibility issue affecting all users, particularly those with disabilities

## Suggested Investigation Approach
1. Audit current scroll container hierarchy
2. Review event propagation and bubbling
3. Test impact on all wizard steps and layouts
4. Consider implementing scroll behavior at document level
5. Ensure solution works across all browsers and devices
6. Test with accessibility tools and screen readers

## Potential Solutions
- Move scroll handling to parent container or document level
- Implement custom scroll behavior that captures events globally
- Restructure layout to avoid nested scroll containers
- Use CSS `pointer-events` strategically
- Consider using React scroll libraries that handle edge cases

## Testing Requirements
- Cross-browser testing (Chrome, Firefox, Safari, Edge)
- Mobile device testing
- Accessibility testing with screen readers
- Testing with various input devices (mouse, trackpad, touch)
- Performance impact assessment