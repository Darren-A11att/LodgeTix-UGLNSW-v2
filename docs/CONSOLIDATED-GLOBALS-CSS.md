# Consolidated globals.css

This file demonstrates what the consolidated `styles/globals.css` should look like after migration. 
It combines all variables into a single file using the HSL format for consistency.

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* Base theme colors */
    --background: 0 0% 100%;
    --foreground: 222 47% 11%;

    --card: 0 0% 100%;
    --card-foreground: 222 47% 11%;

    --popover: 0 0% 100%;
    --popover-foreground: 222 47% 11%;

    /* Primary theme color - Navy blue */
    --primary: 221 80% 15%;
    --primary-foreground: 210 40% 98%;

    /* Secondary theme color - Gold */
    --secondary: 42 45% 61%;
    --secondary-foreground: 222 47% 11%;

    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;

    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;

    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;

    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 221 80% 15%;

    --radius: 0.5rem;

    /* Masonic specific colors (HSL conversions of existing RGB values) */
    --masonic-navy: 218 76% 15%;     /* #0A2240 */
    --masonic-gold: 40 45% 61%;      /* #C8A870 */
    --masonic-lightgold: 39 47% 81%; /* #E5D6B9 */
    --masonic-blue: 216 75% 25%;     /* #0F3B6F */
    --masonic-lightblue: 214 35% 93%; /* #E6EBF2 */
    --masonic-red: 350 74% 29%;      /* #830A14 - converted from RGB 130,20,30 */
    
    /* Chart colors */
    --chart-1: 12 76% 61%;
    --chart-2: 173 58% 39%;
    --chart-3: 197 37% 24%;
    --chart-4: 43 74% 66%;
    --chart-5: 27 87% 67%;
    
    /* Sidebar theme */
    --sidebar-background: 0 0% 98%;
    --sidebar-foreground: 240 5.3% 26.1%;
    --sidebar-primary: 240 5.9% 10%;
    --sidebar-primary-foreground: 0 0% 98%;
    --sidebar-accent: 240 4.8% 95.9%;
    --sidebar-accent-foreground: 240 5.9% 10%;
    --sidebar-border: 220 13% 91%;
    --sidebar-ring: 217.2 91.2% 59.8%;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;

    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;

    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;

    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;

    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;

    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;

    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;

    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;

    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 212.7 26.8% 83.9%;
    
    /* Dark mode chart colors */
    --chart-1: 220 70% 50%;
    --chart-2: 160 60% 45%;
    --chart-3: 30 80% 55%;
    --chart-4: 280 65% 60%;
    --chart-5: 340 75% 55%;
    
    /* Dark mode sidebar theme */
    --sidebar-background: 240 5.9% 10%;
    --sidebar-foreground: 240 4.8% 95.9%;
    --sidebar-primary: 224.3 76.3% 48%;
    --sidebar-primary-foreground: 0 0% 100%;
    --sidebar-accent: 240 3.7% 15.9%;
    --sidebar-accent-foreground: 240 4.8% 95.9%;
    --sidebar-border: 240 3.7% 15.9%;
    --sidebar-ring: 217.2 91.2% 59.8%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground font-serif;
  }
  h1, h2, h3, h4, h5, h6 {
    @apply font-serif;
  }
}

@layer utilities {
  .text-balance {
    text-wrap: balance;
  }
}

/* Masonic-specific utility styles */
.masonic-gradient {
  background: linear-gradient(to right, hsl(var(--masonic-navy)), hsl(var(--masonic-blue)));
}

.masonic-gold-gradient {
  background: linear-gradient(to right, hsl(var(--masonic-gold)), hsl(var(--masonic-lightgold)));
}

.masonic-divider {
  position: relative;
  height: 4px;
  background-color: hsl(var(--masonic-gold));
  width: 80px;
  margin: 1.5rem auto;
}

.masonic-divider::before {
  content: "";
  position: absolute;
  top: -4px;
  left: 35px;
  width: 10px;
  height: 10px;
  background-color: hsl(var(--masonic-gold));
  transform: rotate(45deg);
}

/* Custom styles for State/Territory select to hide checkmark */
.state-select-content [role="option"] > span:first-child {
  display: none;
}

.state-select-content [role="option"] {
  padding-left: 0rem !important;
}

/* Button component classes */
@layer components {
  .btn-primary {
    @apply bg-primary text-primary-foreground px-6 py-3 rounded-md font-medium hover:bg-primary/90 transition-colors;
  }
  
  .btn-secondary {
    @apply bg-secondary text-secondary-foreground px-6 py-3 rounded-md font-medium hover:bg-secondary/90 transition-colors;
  }
  
  .btn-outline {
    @apply border border-primary text-primary px-6 py-3 rounded-md font-medium hover:bg-primary/10 transition-colors;
  }

  .container-custom {
    @apply container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl;
  }
}
```

## Changes Made

1. **Consolidated all color variables** from three files into one
2. **Standardized format** to use HSL values consistently
3. **Converted RGB values to HSL** for masonic colors
4. **Renamed RGB variables** to HSL format:
   - `--color-primary` → `--masonic-navy`
   - `--color-secondary` → `--masonic-gold`
   - `--color-accent` → `--masonic-red`
5. **Updated gradient references** to use HSL variables
6. **Moved component classes** from shared/theme/index.css
7. **Preserved special selectors** for things like state-select-content

## Next Steps

1. Use this consolidated CSS in `styles/globals.css`
2. Update the Tailwind config to reference these variables
3. Update component references to use the new variable names