import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      // Form Field Grid System
      gridColumn: {
        'field-xs': 'span 1 / span 1',    // 12.5% on 8-col grid
        'field-sm': 'span 2 / span 2',    // 25% on 8-col grid
        'field-md': 'span 4 / span 4',    // 50% on 8-col grid
        'field-lg': 'span 6 / span 6',    // 75% on 8-col grid
        'field-xl': 'span 8 / span 8',    // 100% on 8-col grid
        'field-full': '1 / -1',           // Full width across all columns
      },
      
      // Responsive Grid Templates
      gridTemplateColumns: {
        // Form-specific grids
        'form-base': 'repeat(8, minmax(0, 1fr))',
        'form-mobile': 'repeat(2, minmax(0, 1fr))',
        'form-tablet': 'repeat(4, minmax(0, 1fr))',
        'form-desktop': 'repeat(8, minmax(0, 1fr))',
        
        // Component-specific grids
        'attendee-mobile': 'repeat(2, minmax(0, 1fr))',
        'attendee-desktop': 'repeat(4, minmax(0, 1fr))',
        'ticket-mobile': 'repeat(1, minmax(0, 1fr))',
        'ticket-desktop': 'repeat(2, minmax(0, 1fr))',
        'ticket-wide': 'repeat(3, minmax(0, 1fr))',
      },
      
      // Semantic Spacing
      spacing: {
        'form-gap': '1rem',              // 16px - Standard form gap
        'form-gap-sm': '0.75rem',        // 12px - Compact forms
        'form-gap-lg': '1.5rem',         // 24px - Spacious forms
        'section-gap': '2rem',           // 32px - Between sections
        'section-gap-sm': '1.5rem',      // 24px - Compact sections
        'section-gap-lg': '3rem',        // 48px - Spacious sections
        'card-gap': '1.5rem',            // 24px - Between cards
        'card-gap-sm': '1rem',           // 16px - Compact cards
        'card-gap-lg': '2rem',           // 32px - Spacious cards
        'form-section': '2rem',          // 32px - Form section spacing
        'form-subsection': '1.5rem',     // 24px - Form subsection spacing
      },
      
      // Component Heights
      height: {
        'input': '2.75rem',              // 44px - Accessible touch target
        'input-sm': '2.25rem',           // 36px - Compact input
        'input-lg': '3rem',              // 48px - Large input
        'button': '2.75rem',             // 44px - Standard button
        'button-sm': '2.25rem',          // 36px - Small button
        'button-lg': '3rem',             // 48px - Large button
        'touch-target': '3rem',          // 48px - Minimum touch target
        'modal-mobile': '100dvh',        // Full viewport height
        'modal-max': '90vh',             // Maximum modal height
      },
      
      minHeight: {
        'input': '2.75rem',              // 44px minimum
        'button': '2.75rem',             // 44px minimum
        'touch': '3rem',                 // 48px - WCAG touch target
        'textarea': '6rem',              // 96px - Minimum textarea
      },
      
      maxHeight: {
        'modal-content': '80vh',         // Modal content area
        'dropdown': '20rem',             // Dropdown menus
        'select-list': '15rem',          // Select option lists
      },
      
      // Semantic Widths
      width: {
        'field-xs': '100px',             // Extra small fields
        'field-sm': '150px',             // Small fields
        'field-md': '250px',             // Medium fields
        'field-lg': '350px',             // Large fields
        'field-xl': '100%',              // Full width
        'modal-sm': '24rem',             // 384px
        'modal-md': '32rem',             // 512px
        'modal-lg': '48rem',             // 768px
        'modal-xl': '64rem',             // 1024px
        'form-max': '64rem',             // Maximum form width
      },
      
      maxWidth: {
        'field': '100%',                 // Fields max width
        'form': '64rem',                 // Forms max width
        'content': '72rem',              // Content max width
        'modal': '90vw',                 // Modal max width
      },
      
      // Border Radius System
      borderRadius: {
        'input': '0.375rem',             // 6px - Input fields
        'button': '0.375rem',            // 6px - Buttons
        'card': '0.5rem',                // 8px - Cards
        'modal': '0.75rem',              // 12px - Modals
        'badge': '0.25rem',              // 4px - Badges
        'chip': '9999px',                // Full - Pills/chips
      },
      
      // Typography Scale for Forms
      fontSize: {
        'label': ['0.875rem', { lineHeight: '1.25rem' }],         // 14px
        'label-sm': ['0.8125rem', { lineHeight: '1.125rem' }],    // 13px
        'hint': ['0.75rem', { lineHeight: '1rem' }],              // 12px
        'error': ['0.75rem', { lineHeight: '1rem' }],             // 12px
        'help': ['0.8125rem', { lineHeight: '1.125rem' }],        // 13px
        'field': ['0.875rem', { lineHeight: '1.25rem' }],         // 14px
        'button': ['0.875rem', { lineHeight: '1.25rem' }],        // 14px
        'button-sm': ['0.8125rem', { lineHeight: '1.125rem' }],   // 13px
        'button-lg': ['1rem', { lineHeight: '1.5rem' }],          // 16px
      },
      
      // Font Weights for Forms
      fontWeight: {
        'label': '500',
        'button': '500',
        'heading': '600',
      },
      
      // Z-Index Scale
      zIndex: {
        'dropdown': '50',
        'sticky': '60',
        'fixed': '70',
        'modal-backdrop': '80',
        'modal': '90',
        'popover': '100',
        'tooltip': '110',
        'notification': '120',
      },
      
      // Animation Durations
      transitionDuration: {
        'field': '200ms',
        'button': '150ms',
        'modal': '300ms',
        'collapse': '250ms',
      },
      
      // Box Shadows for Forms
      boxShadow: {
        'input': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'input-focus': '0 0 0 3px rgba(200, 168, 112, 0.1)', // Using masonic gold
        'button': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'button-focus': '0 0 0 3px rgba(200, 168, 112, 0.1)',
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'card-hover': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'dropdown': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'modal': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      },
      
      // Colors (maintaining existing masonic theme)
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
          light: "hsl(var(--secondary-light))",
        },
        masonic: {
          navy: "#0A2240",
          gold: "#C8A870",
          lightgold: "#E5D6B9",
          blue: "#0F3B6F",
          lightblue: "#E6EBF2",
        },
        error: "hsl(var(--destructive))",
        errorForeground: "hsl(var(--destructive-foreground))",
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      
      // Keyframe Animations
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        shimmer: {
          "100%": {
            transform: "translateX(100%)",
          },
        },
      },
      
      // Animation Classes
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        shimmer: "shimmer 1.5s infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}

export default config