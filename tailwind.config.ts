import type { Config } from "tailwindcss"

const config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "*.{js,ts,jsx,tsx,mdx}",
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
    fontSize: {
      'xs': '0.75rem',     // 12px
      'lb': '0.625rem',    // 10px (custom size for labels)
      'sm': '0.875rem',    // 14px
      'base': '1rem',      // 16px
      'lg': '1.125rem',    // 18px
      'xl': '1.25rem',     // 20px
      '2xl': '1.5rem',     // 24px
      '3xl': '1.875rem',   // 30px
      '4xl': '2.25rem',    // 36px
      '5xl': '3rem',       // 48px
      '6xl': '3.75rem',    // 60px
      '7xl': '4.5rem',     // 72px
      '8xl': '6rem',       // 96px
      '9xl': '8rem',       // 128px
    },
    extend: {
      /**
       * Form field sizing utilities
       * 
       * These custom grid column utilities define how much space a form field
       * should occupy within a 12-column grid system. They're used in conjunction
       * with the .field-sm, .field-md, .field-lg, and .field-full classes defined
       * in globals.css.
       * 
       * Usage:
       * <TextField className="field-sm" /> - Small field (3 columns on desktop)
       * <TextField className="field-md" /> - Medium field (6 columns on desktop)
       * <TextField className="field-lg" /> - Large field (9 columns on desktop)
       * <TextField className="field-full" /> - Full-width field (12 columns)
       */
      gridColumn: {
        'field-sm': 'span 2 / span 2',  // Base size for small fields (expanded in globals.css)
        'field-md': 'span 1 / span 2',  // Base size for medium fields (expanded in globals.css)
        'field-lg': 'span 1 / span 3',  // Base size for large fields (expanded in globals.css)
        'field-full': 'span 4 / span 4', // Always full width regardless of screen size
      },
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
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Freemasons NSW & ACT colors
        masonic: {
          navy: "#0A2240",
          gold: "#C8A870",
          lightgold: "#E5D6B9",
          blue: "#0F3B6F",
          lightblue: "#E6EBF2",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
