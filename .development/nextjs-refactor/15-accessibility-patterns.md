# Immutable Accessibility Laws

## Core Accessibility Requirements

These are the non-negotiable accessibility laws that MUST be followed in all Next.js development:

### Law 1: Keyboard Navigation is Mandatory
- All interactive elements must be keyboard accessible
- Tab order must follow logical content flow
- Focus indicators must be clearly visible
- Keyboard traps are forbidden
- Modal dialogs must trap focus correctly

### Law 2: Semantic HTML First
- Use HTML elements for their intended purpose
- Headers must follow hierarchical order (h1->h2->h3)
- Buttons for actions, links for navigation
- Form controls must have associated labels
- Lists must use proper list markup

### Law 3: ARIA Only When Necessary
- Never change native element semantics
- Provide ARIA labels for icon-only controls
- Custom widgets require full ARIA implementation
- Live regions for dynamic content updates
- ARIA descriptions for complex interactions

### Law 4: Color Independent Information
- Never convey information through color alone
- Provide text/icon alternatives for color coding
- Error states must have text descriptions
- Focus indicators must not rely on color only
- Status changes require text announcements

### Law 5: WCAG AA Compliance Required
- Color contrast ratio: 4.5:1 (normal text), 3:1 (large text)
- Text must be resizable to 200% without horizontal scroll
- Touch targets minimum 44x44 pixels
- Page must function with CSS disabled
- Support both portrait and landscape orientations

### Law 6: Image Accessibility Required
- All images must have alt attributes
- Decorative images use empty alt=""
- Complex images need long descriptions
- Icons require text alternatives
- Charts/graphs need data tables

### Law 7: Form Accessibility Mandatory
- Every input must have a visible label
- Required fields clearly indicated
- Error messages associated with fields
- Form validation on blur and submit
- Success messages clearly communicated

### Law 8: Time Limit Accommodations
- Provide ability to extend time limits
- Warn before session expiration
- Allow content to be paused/stopped
- Auto-refresh must be controllable
- Save progress automatically

### Law 9: Motion and Animation Control
- Respect prefers-reduced-motion setting
- Provide pause/stop controls for animations
- No content flashing more than 3 times/second
- Essential animations only when motion reduced
- Parallax effects must be optional

### Law 10: Screen Reader Compatibility
- All content must be screen reader accessible
- Dynamic content changes announced
- Proper heading structure for navigation
- Skip links to main content areas
- Language changes marked in HTML

## Enforcement

These laws are enforced through:
1. Automated accessibility testing (axe-core) in CI/CD
2. Manual keyboard navigation testing
3. Screen reader testing requirements
4. WCAG compliance validation
5. Accessibility review in code reviews

## Keyboard Navigation Patterns

### Focus Management
```typescript
// ✅ CORRECT: Proper focus management
function Modal({ isOpen, onClose, children }) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      closeButtonRef.current?.focus();
    } else {
      previousFocusRef.current?.focus();
    }
  }, [isOpen]);
  
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Modal dialog"
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
    >
      <button ref={closeButtonRef} onClick={onClose} aria-label="Close modal">
        <CloseIcon aria-hidden="true" />
      </button>
      {children}
    </div>
  );
}

// ❌ INCORRECT: No focus management
function BadModal({ isOpen, onClose, children }) {
  return (
    <div>
      <button onClick={onClose}>×</button>
      {children}
    </div>
  );
}
```

### Skip Links
```typescript
// ✅ CORRECT: Skip to main content
function Layout({ children }) {
  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <header>
        <nav>{/* Navigation */}</nav>
      </header>
      <main id="main-content" tabIndex={-1}>
        {children}
      </main>
    </>
  );
}
```

## Form Accessibility Patterns

### Accessible Form Fields
```typescript
// ✅ CORRECT: Fully accessible form field
function FormField({ label, error, required, ...props }) {
  const fieldId = useId();
  const errorId = `${fieldId}-error`;
  const descriptionId = `${fieldId}-description`;
  
  return (
    <div>
      <label htmlFor={fieldId}>
        {label}
        {required && <span aria-label="required">*</span>}
      </label>
      <input
        id={fieldId}
        aria-required={required}
        aria-invalid={!!error}
        aria-describedby={[
          error && errorId,
          props.description && descriptionId,
        ].filter(Boolean).join(' ')}
        {...props}
      />
      {error && (
        <p id={errorId} role="alert" className="error">
          {error}
        </p>
      )}
      {props.description && (
        <p id={descriptionId} className="description">
          {props.description}
        </p>
      )}
    </div>
  );
}

// ❌ INCORRECT: Missing accessibility attributes
function BadFormField({ label, error, ...props }) {
  return (
    <div>
      <span>{label}</span>
      <input {...props} />
      {error && <div className="error">{error}</div>}
    </div>
  );
}
```

### Error Announcement
```typescript
// ✅ CORRECT: Live region for errors
function Form() {
  const [errors, setErrors] = useState({});
  
  return (
    <form>
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {Object.keys(errors).length > 0 && (
          <p>Form has {Object.keys(errors).length} errors</p>
        )}
      </div>
      {/* Form fields */}
    </form>
  );
}
```

## Image Accessibility Patterns

### Proper Alt Text Usage
```typescript
// ✅ CORRECT: Meaningful alt text
<img 
  src="team-photo.jpg" 
  alt="LodgeTix development team at the 2024 company retreat"
/>

// ✅ CORRECT: Decorative image
<img 
  src="decorative-border.png" 
  alt=""
  role="presentation"
/>

// ❌ INCORRECT: Generic or missing alt text
<img src="photo.jpg" alt="image" />
<img src="icon.png" /> {/* Missing alt */}
```

### Complex Images
```typescript
// ✅ CORRECT: Complex image with description
<figure>
  <img 
    src="revenue-chart.png" 
    alt="Revenue growth chart"
    aria-describedby="chart-description"
  />
  <figcaption id="chart-description">
    Chart showing 40% revenue growth from Q1 2023 ($1.2M) to Q4 2023 ($1.68M),
    with steady month-over-month increases averaging 10%.
  </figcaption>
</figure>
```

## Color and Contrast Patterns

### Color-Independent Information
```typescript
// ✅ CORRECT: Multiple indicators
function StatusBadge({ status }) {
  const config = {
    success: { color: 'green', icon: '✓', label: 'Success' },
    warning: { color: 'yellow', icon: '⚠', label: 'Warning' },
    error: { color: 'red', icon: '✗', label: 'Error' },
  };
  
  const { color, icon, label } = config[status];
  
  return (
    <span className={`badge badge-${color}`}>
      <span aria-hidden="true">{icon}</span>
      <span>{label}</span>
    </span>
  );
}

// ❌ INCORRECT: Color only
function BadStatusBadge({ status }) {
  return <span className={`badge ${status}`} />;
}
```

## ARIA Pattern Usage

### Proper ARIA Roles
```typescript
// ✅ CORRECT: Semantic HTML first
<nav aria-label="Main navigation">
  <ul>
    <li><a href="/home">Home</a></li>
    <li><a href="/about">About</a></li>
  </ul>
</nav>

// ✅ CORRECT: ARIA for custom widgets
<div
  role="tablist"
  aria-label="Account settings"
>
  <button
    role="tab"
    aria-selected="true"
    aria-controls="panel-1"
    id="tab-1"
  >
    Profile
  </button>
  <div
    role="tabpanel"
    id="panel-1"
    aria-labelledby="tab-1"
  >
    {/* Panel content */}
  </div>
</div>

// ❌ INCORRECT: Redundant ARIA
<button role="button">Click me</button>
<nav role="navigation">{/* ... */}</nav>
```

## Screen Reader Patterns

### Visually Hidden Content
```css
/* Utility class for screen reader only content */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

### Dynamic Content Announcements
```typescript
// ✅ CORRECT: Live regions for updates
function SearchResults({ results, loading }) {
  return (
    <>
      <div
        role="status"
        aria-live="polite"
        aria-busy={loading}
        className="sr-only"
      >
        {loading ? 'Searching...' : `${results.length} results found`}
      </div>
      <div className="results">
        {results.map(result => (
          <ResultItem key={result.id} {...result} />
        ))}
      </div>
    </>
  );
}
```

## Testing Patterns

### Automated Accessibility Testing
```typescript
// jest-axe setup
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('Component accessibility', () => {
  it('should have no accessibility violations', async () => {
    const { container } = render(<MyComponent />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

### Manual Testing Checklist
```markdown
## Accessibility Testing Checklist

### Keyboard Navigation
- [ ] All interactive elements reachable with Tab
- [ ] Tab order follows logical flow
- [ ] Escape key closes modals/popups
- [ ] Enter/Space activates buttons
- [ ] Arrow keys work in menus/tabs

### Screen Reader Testing
- [ ] All content is announced properly
- [ ] Form labels are associated correctly
- [ ] Error messages are announced
- [ ] Dynamic updates are communicated
- [ ] Images have appropriate alt text

### Visual Testing
- [ ] Focus indicators are visible
- [ ] Color contrast meets WCAG AA
- [ ] Text is readable when zoomed 200%
- [ ] Layout works without horizontal scroll
- [ ] Information isn't conveyed by color alone
```

## Animation and Motion Patterns

### Respecting Motion Preferences
```typescript
// ✅ CORRECT: Reduced motion support
const AnimatedComponent = styled.div`
  transition: transform 0.3s ease;
  
  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

// Hook for motion preference
function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handler = (e) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);
  
  return prefersReducedMotion;
}
```

## Common Accessibility Mistakes

### Navigation
```typescript
// ❌ INCORRECT: Inaccessible navigation
<div onClick={navigate}>
  <span>Home</span>
</div>

// ✅ CORRECT: Accessible navigation
<a href="/home">Home</a>
// or
<Link href="/home">Home</Link>
```

### Buttons vs Links
```typescript
// ❌ INCORRECT: Wrong element for action
<a href="#" onClick={deleteItem}>Delete</a>

// ✅ CORRECT: Button for actions
<button onClick={deleteItem}>Delete</button>

// ✅ CORRECT: Link for navigation
<a href="/items">View all items</a>
```

### Form Labels
```typescript
// ❌ INCORRECT: Missing label association
<label>Email</label>
<input type="email" />

// ✅ CORRECT: Proper label association
<label htmlFor="email">Email</label>
<input id="email" type="email" />
```

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Resources](https://webaim.org/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)