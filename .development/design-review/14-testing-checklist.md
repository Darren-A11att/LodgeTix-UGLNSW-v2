# Step 14: Cross-Browser Testing

## System Prompt
You are creating a comprehensive testing checklist for the LodgeTix design system refactor, covering iOS Safari, Android Chrome, desktop browsers, and documenting any issues found.

## Testing Checklist

### 1. Mobile Browser Testing

#### iOS Safari Testing
- [ ] **Viewport Issues**
  - [ ] Dynamic viewport height (100dvh) works correctly
  - [ ] Address bar hiding doesn't break layouts
  - [ ] Safe area insets are respected
  - [ ] Orientation changes handled smoothly

- [ ] **Touch Interactions**
  - [ ] All touch targets are minimum 48px
  - [ ] Tap highlights appear correctly
  - [ ] No 300ms tap delay
  - [ ] Pinch-to-zoom disabled where appropriate
  - [ ] Pull-to-refresh doesn't interfere

- [ ] **Form Inputs**
  - [ ] Keyboard types trigger correctly
  - [ ] Autofill works properly
  - [ ] Input zoom is prevented (font-size: 16px)
  - [ ] Next/Previous keyboard navigation works

- [ ] **Modals & Overlays**
  - [ ] Body scroll lock works
  - [ ] Modal scrolling is smooth
  - [ ] Close buttons are accessible
  - [ ] Backdrop covers entire screen

#### Android Chrome Testing
- [ ] **Viewport Behavior**
  - [ ] Dynamic viewport units work
  - [ ] Chrome's URL bar hiding is handled
  - [ ] No layout shift on scroll

- [ ] **Touch Optimization**
  - [ ] Touch targets meet Material Design specs
  - [ ] Ripple effects work (if implemented)
  - [ ] Long press doesn't trigger context menu
  - [ ] Swipe gestures work smoothly

- [ ] **Performance**
  - [ ] Animations run at 60fps
  - [ ] No jank on scroll
  - [ ] Images load efficiently
  - [ ] JavaScript bundles load quickly

### 2. Desktop Browser Testing

#### Chrome (Latest)
- [ ] **Layout & Grid**
  - [ ] All grid systems work correctly
  - [ ] Flexbox layouts render properly
  - [ ] CSS Grid support is complete
  - [ ] Sticky elements work

- [ ] **Interactions**
  - [ ] Hover states work
  - [ ] Focus states visible
  - [ ] Keyboard navigation complete
  - [ ] Mouse events handled

#### Firefox (Latest)
- [ ] **CSS Compatibility**
  - [ ] Custom properties work
  - [ ] Transforms render correctly
  - [ ] Filters apply properly
  - [ ] Gradients display correctly

- [ ] **Form Elements**
  - [ ] Custom select styling works
  - [ ] Input styling consistent
  - [ ] Checkbox/radio styling
  - [ ] File upload styling

#### Safari (Desktop)
- [ ] **Webkit Specific**
  - [ ] -webkit prefixes work
  - [ ] Backdrop filters work
  - [ ] Position sticky works
  - [ ] Custom scrollbars (if used)

- [ ] **Media**
  - [ ] Images display correctly
  - [ ] SVGs render properly
  - [ ] Videos play (if applicable)
  - [ ] Fonts load correctly

#### Edge
- [ ] **Chromium Features**
  - [ ] All Chrome features work
  - [ ] No Edge-specific issues
  - [ ] PDF preview (if applicable)
  - [ ] Print styles work

### 3. Responsive Testing

#### Breakpoint Testing
- [ ] **Mobile (320px - 639px)**
  - [ ] 320px - iPhone SE (minimum)
  - [ ] 375px - iPhone 12/13 mini
  - [ ] 390px - iPhone 14 Pro
  - [ ] 414px - iPhone Plus models

- [ ] **Tablet (640px - 1023px)**
  - [ ] 768px - iPad portrait
  - [ ] 834px - iPad Pro 11" portrait
  - [ ] 1024px - iPad landscape

- [ ] **Desktop (1024px+)**
  - [ ] 1366px - Common laptop
  - [ ] 1920px - Full HD
  - [ ] 2560px - QHD/4K

#### Orientation Testing
- [ ] **Portrait to Landscape**
  - [ ] Layout adapts smoothly
  - [ ] Modals reposition correctly
  - [ ] Navigation updates
  - [ ] No content cut off

- [ ] **Landscape to Portrait**
  - [ ] Forms remain usable
  - [ ] Images resize properly
  - [ ] Text remains readable
  - [ ] Buttons stay accessible

### 4. Accessibility Testing

#### Screen Reader Testing
- [ ] **VoiceOver (iOS)**
  - [ ] All content readable
  - [ ] Form labels announced
  - [ ] Buttons have proper labels
  - [ ] Navigation makes sense

- [ ] **TalkBack (Android)**
  - [ ] Focus order logical
  - [ ] Interactive elements announced
  - [ ] State changes announced
  - [ ] Error messages read

- [ ] **NVDA/JAWS (Desktop)**
  - [ ] Headings structure correct
  - [ ] Lists announced properly
  - [ ] Tables have headers
  - [ ] Skip links work

#### Keyboard Navigation
- [ ] **Tab Order**
  - [ ] Logical flow through page
  - [ ] No keyboard traps
  - [ ] Skip links available
  - [ ] Modal focus management

- [ ] **Key Interactions**
  - [ ] Enter activates buttons
  - [ ] Space checks boxes
  - [ ] Arrows navigate menus
  - [ ] Escape closes modals

### 5. Performance Testing

#### Loading Performance
- [ ] **First Contentful Paint**
  - [ ] Under 1.8s on 3G
  - [ ] Under 0.8s on 4G
  - [ ] Under 0.3s on WiFi

- [ ] **Time to Interactive**
  - [ ] Under 3.8s on 3G
  - [ ] Under 2.0s on 4G
  - [ ] Under 1.0s on WiFi

#### Runtime Performance
- [ ] **Scroll Performance**
  - [ ] 60fps maintained
  - [ ] No layout thrashing
  - [ ] Smooth parallax (if used)
  - [ ] No memory leaks

- [ ] **Animation Performance**
  - [ ] CSS animations smooth
  - [ ] Transitions hardware accelerated
  - [ ] No jank on interaction
  - [ ] RequestAnimationFrame used

### 6. Visual Testing

#### Color Contrast
- [ ] **WCAG AA Compliance**
  - [ ] Normal text: 4.5:1 ratio
  - [ ] Large text: 3:1 ratio
  - [ ] Icons: 3:1 ratio
  - [ ] Focus indicators: visible

#### Dark Mode (if applicable)
- [ ] **System Preference**
  - [ ] Detects preference
  - [ ] Switches smoothly
  - [ ] Persists choice
  - [ ] All elements styled

### 7. Form Testing

#### Input Validation
- [ ] **Client-side Validation**
  - [ ] Inline error messages
  - [ ] Error states clear
  - [ ] Success states visible
  - [ ] Required fields marked

- [ ] **Mobile Keyboards**
  - [ ] Email keyboard for email
  - [ ] Number pad for numbers
  - [ ] Tel pad for phone
  - [ ] URL keyboard for URLs

#### Autofill Testing
- [ ] **Browser Autofill**
  - [ ] Fields tagged correctly
  - [ ] Autofill doesn't break layout
  - [ ] Works with password managers
  - [ ] Credit card fields (if applicable)

### 8. Edge Case Testing

#### Network Conditions
- [ ] **Slow 3G**
  - [ ] Loading states appear
  - [ ] Timeouts handled gracefully
  - [ ] Images lazy load
  - [ ] Critical CSS loads first

- [ ] **Offline**
  - [ ] Error messages clear
  - [ ] Cached content available
  - [ ] Recovery when online
  - [ ] Form data persisted

#### Error States
- [ ] **404 Pages**
  - [ ] Designed consistently
  - [ ] Navigation available
  - [ ] Search option provided
  - [ ] Contact info shown

- [ ] **500 Errors**
  - [ ] User-friendly message
  - [ ] No stack traces shown
  - [ ] Recovery options
  - [ ] Support contact

### 9. Testing Documentation

#### Issue Template
```markdown
## Issue: [Brief Description]

**Device/Browser**: [e.g., iPhone 13, iOS 15.4, Safari]
**Component**: [e.g., AttendeeCard, TicketSelection]
**Severity**: [Critical/High/Medium/Low]

### Description
[Detailed description of the issue]

### Steps to Reproduce
1. [Step 1]
2. [Step 2]
3. [Step 3]

### Expected Behavior
[What should happen]

### Actual Behavior
[What actually happens]

### Screenshots
[If applicable]

### Proposed Solution
[If you have suggestions]
```

#### Test Results Summary
```markdown
# Test Results - [Date]

## Overview
- Total Tests: X
- Passed: X
- Failed: X
- Blocked: X

## Critical Issues
1. [Issue description] - [Platform]
2. [Issue description] - [Platform]

## Browser Coverage
- ✅ Chrome (Windows/Mac)
- ✅ Firefox (Windows/Mac)
- ⚠️ Safari (iOS) - [Issues]
- ✅ Safari (Mac)
- ✅ Edge

## Device Coverage
- ✅ iPhone 12/13/14
- ⚠️ iPhone SE - [Issues]
- ✅ iPad
- ✅ Android phones
- ✅ Android tablets

## Recommendations
1. [Priority fixes]
2. [Optimization suggestions]
3. [Future considerations]
```

### 10. Automated Testing Setup

#### Visual Regression Testing
```javascript
// Example Playwright test
test('AttendeeCard mobile layout', async ({ page }) => {
  await page.goto('/attendee-card-test')
  await page.setViewportSize({ width: 375, height: 667 })
  await expect(page).toHaveScreenshot('attendee-card-mobile.png')
})
```

#### Cross-Browser Testing
```javascript
// BrowserStack configuration
const capabilities = [
  {
    'browserName': 'Safari',
    'browser_version': '15.0',
    'os': 'OS X',
    'os_version': 'Monterey',
    'real_mobile': true,
    'device': 'iPhone 13',
  },
  {
    'browserName': 'Chrome',
    'browser_version': '100',
    'os': 'Android',
    'os_version': '11.0',
    'real_mobile': true,
    'device': 'Samsung Galaxy S21',
  }
]
```

## Testing Priority

### Priority 1 - Critical Path
1. Registration flow on mobile
2. Payment processing
3. Ticket selection
4. Form submission

### Priority 2 - Common Use Cases
1. Event browsing
2. Profile management
3. Order history
4. Support contact

### Priority 3 - Edge Cases
1. Slow network conditions
2. Very old browsers
3. Uncommon screen sizes
4. Accessibility tools

## Notes

- Test early and often
- Use real devices when possible
- Document all issues found
- Involve users in testing
- Consider analytics data for priority
