# Immutable UI Design Laws

## Core UI Design Principles

These are the non-negotiable UI design laws that MUST be followed in all Next.js development:

### Law 1: Component Composition Over Inheritance
- **Always** compose components using smaller, reusable pieces
- Never use inheritance for component extension
- Prefer composition patterns like Higher-Order Components (HOCs) or render props when necessary

### Law 2: Separation of Concerns
- UI components handle presentation only
- Business logic belongs in hooks, services, or server components
- Styling, structure, and behavior must be clearly separated

### Law 3: Mobile-First Responsive Design
- **Always** design for mobile screens first
- Use Tailwind's responsive modifiers (sm:, md:, lg:, xl:, 2xl:)
- Never use fixed pixel widths for layout containers

### Law 4: Accessibility is Not Optional
- All interactive elements must be keyboard accessible
- Proper ARIA labels are required for non-text elements
- Color contrast must meet WCAG AA standards minimum

### Law 5: Performance-First UI
- Lazy load components that are below the fold
- Use Next.js Image component for all images
- Minimize client-side JavaScript with server components

### Law 6: Consistent Design Tokens
- Use design tokens from the theme for all styling
- Never hardcode colors, spacing, or typography values
- Maintain consistency through shared configuration

### Law 7: State Proximity Principle
- Keep state as close as possible to where it's used
- Lift state only when necessary for sharing
- Prefer local state over global state

### Law 8: Error Boundaries are Mandatory
- Every major UI section must have error boundaries
- Provide meaningful fallback UI for errors
- Log errors appropriately for debugging

### Law 9: Loading States are Required
- Every async operation must show loading feedback
- Use suspense boundaries for data fetching
- Provide skeleton screens for better UX

### Law 10: Form Validation Rules
- Client-side validation for immediate feedback
- Server-side validation for security
- Clear error messages with actionable feedback

## Implementation Patterns

### Component Structure
```typescript
//  CORRECT: Clear separation of concerns
export function UserProfile({ userId }: UserProfileProps) {
  // Data fetching in server component
  const user = await getUser(userId);
  
  return (
    <div className="p-4 md:p-6">
      <UserAvatar user={user} />
      <UserDetails user={user} />
    </div>
  );
}

// L INCORRECT: Mixed concerns
export function UserProfile({ userId }: UserProfileProps) {
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    // Client-side data fetching - avoid when possible
    fetchUser(userId).then(setUser);
  }, [userId]);
  
  return (
    <div style={{ padding: '16px' }}> {/* Hardcoded styles */}
      {/* Mixed presentation and logic */}
    </div>
  );
}
```

### Responsive Design
```typescript
//  CORRECT: Mobile-first responsive design
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map(item => (
    <Card key={item.id} className="p-4 sm:p-6">
      {/* Content */}
    </Card>
  ))}
</div>

// L INCORRECT: Desktop-first with fixed widths
<div style={{ width: '1200px', display: 'grid' }}>
  {/* Fixed width container */}
</div>
```

### Accessibility
```typescript
//  CORRECT: Accessible interactive element
<button
  onClick={handleClick}
  aria-label="Delete item"
  className="p-2 hover:bg-gray-100 focus:ring-2"
>
  <TrashIcon className="h-4 w-4" aria-hidden="true" />
</button>

// L INCORRECT: Inaccessible interaction
<div onClick={handleClick}>
  <TrashIcon />
</div>
```

### Performance Optimization
```typescript
//  CORRECT: Optimized image loading
import Image from 'next/image';

<Image
  src={user.avatar}
  alt={user.name}
  width={48}
  height={48}
  loading="lazy"
/>

// L INCORRECT: Unoptimized image
<img src={user.avatar} />
```

### Loading States
```typescript
//  CORRECT: Proper loading feedback
export default async function Page() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <UserList />
    </Suspense>
  );
}

// L INCORRECT: No loading feedback
export default async function Page() {
  const users = await getUsers();
  return <UserList users={users} />;
}
```

## Enforcement

These laws are enforced through:
1. Code review checklist
2. ESLint rules for accessibility
3. TypeScript for type safety
4. Automated testing for functionality
5. Performance monitoring in production

## References

- [Web Content Accessibility Guidelines (WCAG)](https://www.w3.org/WAI/WCAG21/quickref/)
- [Next.js Image Optimization](https://nextjs.org/docs/app/building-your-application/optimizing/images)
- [Tailwind CSS Responsive Design](https://tailwindcss.com/docs/responsive-design)