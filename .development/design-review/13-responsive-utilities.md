# Step 13: Responsive Utilities

## System Prompt
You are creating responsive utility components and hooks for the LodgeTix platform, including mobile detection, responsive helper components, touch gesture support, and navigation pattern updates.

## Implementation Checklist

### 1. Create Mobile Detection Hook

Location: `/hooks/use-device.ts`

```typescript
import { useEffect, useState } from 'react'

export function useDevice() {
  const [device, setDevice] = useState({
    isMobile: false,
    isTablet: false,
    isDesktop: false,
    isTouch: false,
    os: 'unknown' as 'ios' | 'android' | 'unknown'
  })
  
  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth
      const userAgent = navigator.userAgent.toLowerCase()
      
      // Device type detection
      const isMobile = width < 640
      const isTablet = width >= 640 && width < 1024
      const isDesktop = width >= 1024
      
      // Touch capability
      const isTouch = 'ontouchstart' in window || 
                     navigator.maxTouchPoints > 0
      
      // OS detection
      let os: 'ios' | 'android' | 'unknown' = 'unknown'
      if (/iphone|ipad|ipod/.test(userAgent)) {
        os = 'ios'
      } else if (/android/.test(userAgent)) {
        os = 'android'
      }
      
      setDevice({
        isMobile,
        isTablet,
        isDesktop,
        isTouch,
        os
      })
    }
    
    checkDevice()
    window.addEventListener('resize', checkDevice)
    
    return () => window.removeEventListener('resize', checkDevice)
  }, [])
  
  return device
}

// Specific utility hooks
export function useIsMobile() {
  const { isMobile } = useDevice()
  return isMobile
}

export function useIsTouch() {
  const { isTouch } = useDevice()
  return isTouch
}
```

### 2. Create Media Query Hook

Location: `/hooks/use-media-query.ts`

```typescript
import { useEffect, useState } from 'react'

export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false)
  
  useEffect(() => {
    const mediaQuery = window.matchMedia(query)
    
    // Set initial value
    setMatches(mediaQuery.matches)
    
    // Create listener
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches)
    
    // Add listener (using addEventListener for modern browsers)
    if ('addEventListener' in mediaQuery) {
      mediaQuery.addEventListener('change', handler)
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handler)
    }
    
    // Cleanup
    return () => {
      if ('removeEventListener' in mediaQuery) {
        mediaQuery.removeEventListener('change', handler)
      } else {
        mediaQuery.removeListener(handler)
      }
    }
  }, [query])
  
  return matches
}

// Preset media queries
export const mediaQueries = {
  mobile: '(max-width: 639px)',
  tablet: '(min-width: 640px) and (max-width: 1023px)',
  desktop: '(min-width: 1024px)',
  touch: '(hover: none) and (pointer: coarse)',
  prefersDark: '(prefers-color-scheme: dark)',
  prefersReduced: '(prefers-reduced-motion: reduce)'
}
```

### 3. Create Responsive Component Wrapper

Location: `/components/responsive/ResponsiveWrapper.tsx`

```typescript
import { ReactNode } from 'react'
import { useDevice } from '@/hooks/use-device'

interface ResponsiveWrapperProps {
  mobile?: ReactNode
  tablet?: ReactNode
  desktop?: ReactNode
  fallback?: ReactNode
}

export function ResponsiveWrapper({ 
  mobile, 
  tablet, 
  desktop, 
  fallback 
}: ResponsiveWrapperProps) {
  const device = useDevice()
  
  if (device.isMobile && mobile) return <>{mobile}</>
  if (device.isTablet && tablet) return <>{tablet}</>
  if (device.isDesktop && desktop) return <>{desktop}</>
  
  return <>{fallback || null}</>
}

// Usage example:
// <ResponsiveWrapper
//   mobile={<MobileLayout />}
//   desktop={<DesktopLayout />}
//   fallback={<LoadingSpinner />}
// />
```

### 4. Create Touch Gesture Hook

Location: `/hooks/use-touch-gestures.ts`

```typescript
import { useRef, useEffect } from 'react'

interface GestureHandlers {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
  onTap?: () => void
  onLongPress?: () => void
}

export function useTouchGestures(
  elementRef: React.RefObject<HTMLElement>,
  handlers: GestureHandlers
) {
  const touchStartRef = useRef<{ x: number; y: number; time: number }>()
  const longPressTimerRef = useRef<NodeJS.Timeout>()
  
  useEffect(() => {
    const element = elementRef.current
    if (!element) return
    
    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0]
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now()
      }
      
      // Set up long press detection
      if (handlers.onLongPress) {
        longPressTimerRef.current = setTimeout(() => {
          handlers.onLongPress?.()
        }, 500)
      }
    }
    
    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current) return
      
      clearTimeout(longPressTimerRef.current)
      
      const touch = e.changedTouches[0]
      const deltaX = touch.clientX - touchStartRef.current.x
      const deltaY = touch.clientY - touchStartRef.current.y
      const deltaTime = Date.now() - touchStartRef.current.time
      
      // Detect tap (small movement, short time)
      if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10 && deltaTime < 200) {
        handlers.onTap?.()
        return
      }
      
      // Detect swipes (minimum distance threshold)
      const minSwipeDistance = 50
      
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        if (deltaX > minSwipeDistance) {
          handlers.onSwipeRight?.()
        } else if (deltaX < -minSwipeDistance) {
          handlers.onSwipeLeft?.()
        }
      } else {
        // Vertical swipe
        if (deltaY > minSwipeDistance) {
          handlers.onSwipeDown?.()
        } else if (deltaY < -minSwipeDistance) {
          handlers.onSwipeUp?.()
        }
      }
    }
    
    element.addEventListener('touchstart', handleTouchStart)
    element.addEventListener('touchend', handleTouchEnd)
    
    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchend', handleTouchEnd)
      clearTimeout(longPressTimerRef.current)
    }
  }, [handlers])
}
```

### 5. Create Mobile Navigation Component

Location: `/components/navigation/MobileNavigation.tsx`

```typescript
import { TouchTarget } from '@/components/register/core'
import { Home, Calendar, User, Menu } from 'lucide-react'
import { useState } from 'react'

interface MobileNavigationProps {
  currentPath: string
}

export function MobileNavigation({ currentPath }: MobileNavigationProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  
  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/events', icon: Calendar, label: 'Events' },
    { path: '/profile', icon: User, label: 'Profile' },
  ]
  
  return (
    <>
      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 md:hidden">
        <div className="flex justify-around items-center h-16 pb-safe">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = currentPath === item.path
            
            return (
              <TouchTarget
                key={item.path}
                variant="ghost"
                size="md"
                className={cn(
                  'flex flex-col items-center justify-center flex-1 h-full',
                  isActive && 'text-primary'
                )}
                onClick={() => navigate(item.path)}
              >
                <Icon className="h-5 w-5 mb-1" />
                <span className="text-xs">{item.label}</span>
              </TouchTarget>
            )
          })}
          
          <TouchTarget
            variant="ghost"
            size="md"
            className="flex flex-col items-center justify-center flex-1 h-full"
            onClick={() => setIsMenuOpen(true)}
          >
            <Menu className="h-5 w-5 mb-1" />
            <span className="text-xs">Menu</span>
          </TouchTarget>
        </div>
      </nav>
      
      {/* Slide-out Menu */}
      <MobileMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
      />
    </>
  )
}
```

### 6. Create Responsive Table Component

Location: `/components/responsive/ResponsiveTable.tsx`

```typescript
import { useMediaQuery } from '@/hooks/use-media-query'

interface ResponsiveTableProps<T> {
  data: T[]
  columns: Array<{
    key: keyof T
    header: string
    mobile?: boolean // Show on mobile
    render?: (item: T) => ReactNode
  }>
  onRowClick?: (item: T) => void
}

export function ResponsiveTable<T>({ 
  data, 
  columns, 
  onRowClick 
}: ResponsiveTableProps<T>) {
  const isMobile = useMediaQuery('(max-width: 640px)')
  
  if (isMobile) {
    // Mobile card layout
    return (
      <div className="space-y-3">
        {data.map((item, index) => (
          <div
            key={index}
            className="bg-white border border-gray-200 rounded-lg p-4"
            onClick={() => onRowClick?.(item)}
          >
            {columns
              .filter(col => col.mobile !== false)
              .map((col) => (
                <div key={String(col.key)} className="flex justify-between py-1">
                  <span className="text-sm text-gray-500">{col.header}</span>
                  <span className="text-sm font-medium">
                    {col.render ? col.render(item) : String(item[col.key])}
                  </span>
                </div>
              ))}
          </div>
        ))}
      </div>
    )
  }
  
  // Desktop table layout
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((col) => (
              <th
                key={String(col.key)}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((item, index) => (
            <tr
              key={index}
              className="hover:bg-gray-50 cursor-pointer"
              onClick={() => onRowClick?.(item)}
            >
              {columns.map((col) => (
                <td key={String(col.key)} className="px-6 py-4 whitespace-nowrap">
                  {col.render ? col.render(item) : String(item[col.key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

### 7. Create Safe Area Component

Location: `/components/responsive/SafeArea.tsx`

```typescript
import { cn } from '@/lib/utils'
import { ReactNode } from 'react'

interface SafeAreaProps {
  children: ReactNode
  className?: string
  top?: boolean
  bottom?: boolean
  left?: boolean
  right?: boolean
}

export function SafeArea({ 
  children, 
  className,
  top = false,
  bottom = false,
  left = false,
  right = false
}: SafeAreaProps) {
  return (
    <div 
      className={cn(
        top && 'pt-safe',
        bottom && 'pb-safe',
        left && 'pl-safe',
        right && 'pr-safe',
        className
      )}
    >
      {children}
    </div>
  )
}

// CSS classes for safe areas
// .pt-safe { padding-top: env(safe-area-inset-top); }
// .pb-safe { padding-bottom: env(safe-area-inset-bottom); }
// .pl-safe { padding-left: env(safe-area-inset-left); }
// .pr-safe { padding-right: env(safe-area-inset-right); }
```

### 8. Testing Checklist

- [ ] Mobile detection works on all devices
- [ ] Media queries update on resize
- [ ] Touch gestures recognized correctly
- [ ] Navigation adapts to screen size
- [ ] Tables transform to cards on mobile
- [ ] Safe areas work on iOS devices
- [ ] Performance is optimized
- [ ] No memory leaks from listeners
- [ ] SSR compatibility maintained
- [ ] Fallbacks work when JS disabled

## Key Features

### Device Detection
1. **Comprehensive Info**: Screen size, touch, OS
2. **Real-time Updates**: Responds to orientation
3. **Performance**: Debounced resize handlers
4. **SSR Safe**: Checks for window object

### Responsive Components
1. **Conditional Rendering**: Show/hide by device
2. **Layout Switching**: Different layouts per size
3. **Touch Optimization**: Gesture support
4. **Safe Areas**: iOS notch handling

### Navigation Patterns
1. **Bottom Nav**: Mobile standard pattern
2. **Slide Menu**: Additional options
3. **Touch Targets**: 48px minimum
4. **Active States**: Clear indicators

## Usage Examples

### Device Detection
```typescript
function MyComponent() {
  const { isMobile, isTouch } = useDevice()
  
  return (
    <div>
      {isMobile ? <MobileView /> : <DesktopView />}
      {isTouch && <TouchInstructions />}
    </div>
  )
}
```

### Media Queries
```typescript
function ResponsiveComponent() {
  const isLargeScreen = useMediaQuery('(min-width: 1024px)')
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)')
  
  return (
    <div className={prefersDark ? 'dark-theme' : 'light-theme'}>
      {isLargeScreen && <Sidebar />}
      <MainContent />
    </div>
  )
}
```

### Touch Gestures
```typescript
function SwipeableCard() {
  const cardRef = useRef<HTMLDivElement>(null)
  
  useTouchGestures(cardRef, {
    onSwipeLeft: () => console.log('Swiped left'),
    onSwipeRight: () => console.log('Swiped right'),
    onTap: () => console.log('Tapped'),
  })
  
  return <div ref={cardRef}>Swipeable content</div>
}
```

## Notes

- Always test on real devices
- Consider network conditions
- Optimize for performance
- Provide keyboard alternatives
- Test with screen readers
