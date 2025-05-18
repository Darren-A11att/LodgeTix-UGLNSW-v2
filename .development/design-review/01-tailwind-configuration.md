# Step 01: Tailwind Configuration Setup

## System Prompt
You are implementing the foundation of the LodgeTix design system by configuring Tailwind CSS with proper theme extensions for colors, typography, spacing, and responsive breakpoints.

## Implementation Checklist

### 1. Review Current Configuration
- [ ] Open `tailwind.config.ts`
- [ ] Identify existing masonic color palette
- [ ] Check current spacing scale
- [ ] Review breakpoint settings

### 2. Ensure Masonic Color Palette
```typescript
colors: {
  masonic: {
    navy: "#0A2240",      // Primary brand color
    gold: "#C8A870",      // Accent color
    lightgold: "#E5D6B9", // Light accent
    blue: "#0F3B6F",      // Secondary blue
    lightblue: "#E6EBF2", // Light blue background
  }
}
```

### 3. Add Semantic Color Mappings
```typescript
extend: {
  colors: {
    // Brand colors
    primary: {
      DEFAULT: "#0A2240", // masonic.navy
      light: "#0F3B6F",   // masonic.blue
      dark: "#061528",    // darker navy
    },
    secondary: {
      DEFAULT: "#C8A870", // masonic.gold
      light: "#E5D6B9",   // masonic.lightgold
      dark: "#A08B59",    // darker gold
    },
    // UI colors
    background: {
      DEFAULT: "#FFFFFF",
      secondary: "#E6EBF2", // masonic.lightblue
      tertiary: "#F8F9FA",
    },
    border: {
      DEFAULT: "#E0E4E8",
      focus: "#C8A870", // masonic.gold
    },
  }
}
```

### 4. Configure Typography Scale
```typescript
fontSize: {
  // Mobile-first sizes (base 16px)
  'xs': ['0.75rem', { lineHeight: '1rem' }],      // 12px
  'sm': ['0.875rem', { lineHeight: '1.25rem' }],  // 14px
  'base': ['1rem', { lineHeight: '1.5rem' }],     // 16px
  'lg': ['1.125rem', { lineHeight: '1.75rem' }],  // 18px
  'xl': ['1.25rem', { lineHeight: '1.75rem' }],   // 20px
  '2xl': ['1.5rem', { lineHeight: '2rem' }],      // 24px
  '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
  '4xl': ['2.25rem', { lineHeight: '2.5rem' }],   // 36px
  '5xl': ['3rem', { lineHeight: '1' }],           // 48px
}
```

### 5. Add Custom Spacing Scale
```typescript
spacing: {
  // Keep defaults and add:
  '18': '4.5rem',  // 72px - for larger gaps
  '22': '5.5rem',  // 88px - for section spacing
  '26': '6.5rem',  // 104px - for hero sections
}
```

### 6. Configure Responsive Breakpoints
```typescript
screens: {
  // Mobile-first breakpoints
  'xs': '375px',   // iPhone SE and small devices
  'sm': '640px',   // Standard mobile landscape
  'md': '768px',   // Tablets
  'lg': '1024px',  // Desktop
  'xl': '1280px',  // Large desktop
  '2xl': '1536px', // Wide screens
}
```

### 7. Add Component-Specific Extensions
```typescript
extend: {
  // Touch-friendly minimum heights
  minHeight: {
    'touch': '48px', // Minimum touch target
    'input': '44px', // Form inputs
    'button': '48px', // Buttons
  },
  // Consistent border radius
  borderRadius: {
    'button': '0.375rem', // 6px
    'card': '0.5rem',     // 8px
    'modal': '0.75rem',   // 12px
  },
}
```

### 8. Testing the Configuration
- [ ] Run `npm run dev` to ensure no build errors
- [ ] Check that all masonic colors are available
- [ ] Test responsive breakpoints in browser
- [ ] Verify typography scale renders correctly

## Complete Configuration Example

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Keep existing masonic palette
        masonic: {
          navy: "#0A2240",
          gold: "#C8A870",
          lightgold: "#E5D6B9",
          blue: "#0F3B6F",
          lightblue: "#E6EBF2",
        },
        // Add semantic mappings
        primary: {
          DEFAULT: "#0A2240",
          light: "#0F3B6F",
          dark: "#061528",
        },
        secondary: {
          DEFAULT: "#C8A870",
          light: "#E5D6B9",
          dark: "#A08B59",
        },
      },
      fontSize: {
        // Mobile-first type scale
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
      },
      screens: {
        'xs': '375px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
      },
      minHeight: {
        'touch': '48px',
        'input': '44px',
        'button': '48px',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}

export default config
```

## Notes
- This configuration provides the foundation for all subsequent steps
- The masonic color palette is already in place - we're adding semantic mappings
- The typography scale is mobile-first with appropriate line heights
- Custom spacing values complement the default Tailwind scale
- Touch-friendly sizing utilities will be used throughout the refactor
