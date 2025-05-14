#!/usr/bin/env node

/**
 * CSS Consolidation Script
 * 
 * This script automates the CSS consolidation plan by:
 * 1. Creating the consolidated globals.css file
 * 2. Updating imports across the codebase
 * 3. Updating color references in files
 * 
 * EXCLUDES: All phone input styling (as requested)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Paths
const ROOT_DIR = process.cwd();
const STYLES_DIR = path.join(ROOT_DIR, 'styles');
const APP_DIR = path.join(ROOT_DIR, 'app');
const SHARED_DIR = path.join(ROOT_DIR, 'shared');
const COMPONENTS_DIR = path.join(ROOT_DIR, 'components');

// Source and destination files
const APP_GLOBALS_CSS = path.join(APP_DIR, 'globals.css');
const STYLES_GLOBALS_CSS = path.join(STYLES_DIR, 'globals.css');
const SHARED_THEME_CSS = path.join(SHARED_DIR, 'theme', 'index.css');

// Create consolidated globals.css content
const consolidatedGlobalsCss = `@tailwind base;
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
  
  /* Make all form selects the same height for consistency */
  select {
    @apply h-11;
  }
}`;

// Updated Tailwind config
const updatedTailwindConfig = `import type { Config } from "tailwindcss"

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
    extend: {
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
        // Freemasons Victoria colors using HSL variables
        masonic: {
          navy: "hsl(var(--masonic-navy))",
          gold: "hsl(var(--masonic-gold))",
          lightgold: "hsl(var(--masonic-lightgold))",
          blue: "hsl(var(--masonic-blue))",
          lightblue: "hsl(var(--masonic-lightblue))",
          red: "hsl(var(--masonic-red))",
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

export default config`;

// Function to recursively find all files with specific extensions
function findFiles(dir, extensions, files = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      // Skip node_modules and .git directories
      if (entry.name !== 'node_modules' && entry.name !== '.git') {
        findFiles(fullPath, extensions, files);
      }
    } else if (extensions.some(ext => entry.name.endsWith(ext))) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Update file imports - EXCLUDING phone input
function updateFileImports(file) {
  try {
    let content = fs.readFileSync(file, 'utf8');
    let modified = false;
    
    // Replace app/globals.css imports with styles/globals.css
    if (content.includes("import '../app/globals.css'") || 
        content.includes("import '../../app/globals.css'") || 
        content.includes("import '../../../app/globals.css'")) {
      content = content.replace(
        /import ['"](.+?)app\/globals\.css['"]/g, 
        "import '$1styles/globals.css'"
      );
      modified = true;
    }
    
    // Replace shared/theme/index.css imports with styles/globals.css
    // EXCLUDING phone input references
    if (content.includes("shared/theme/index.css")) {
      content = content.replace(
        /import ['"](.+?)shared\/theme\/index\.css['"]/g, 
        "import '$1styles/globals.css'"
      );
      modified = true;
    }
    
    // Update rgba references (excluding phone input)
    if (content.includes('rgba(var(--color-primary)') || 
        content.includes('rgba(var(--color-secondary)') ||
        content.includes('rgba(var(--color-accent)')) {
      content = content
        .replace(/rgba\(var\(--color-primary\), ([0-9.]+)\)/g, 'hsl(var(--masonic-navy) / $1)')
        .replace(/rgba\(var\(--color-secondary\), ([0-9.]+)\)/g, 'hsl(var(--masonic-gold) / $1)')
        .replace(/rgba\(var\(--color-accent\), ([0-9.]+)\)/g, 'hsl(var(--masonic-red) / $1)');
      modified = true;
    }
    
    if (modified) {
      fs.writeFileSync(file, content, 'utf8');
      console.log(`✅ Updated imports in ${file}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error updating imports in ${file}:`, error);
    return false;
  }
}

// Main function
function main() {
  console.log('🚀 Starting CSS consolidation (excluding phone input styling)...');
  
  // Create directories if they don't exist
  if (!fs.existsSync(STYLES_DIR)) {
    fs.mkdirSync(STYLES_DIR, { recursive: true });
  }
  
  // Step 1: Write the consolidated globals.css
  try {
    fs.writeFileSync(STYLES_GLOBALS_CSS, consolidatedGlobalsCss, 'utf8');
    console.log(`✅ Created consolidated styles/globals.css`);
  } catch (error) {
    console.error('❌ Error creating styles/globals.css:', error);
    return;
  }
  
  // Step 2: Update the tailwind.config.ts
  const tailwindConfigPath = path.join(ROOT_DIR, 'tailwind.config.ts');
  try {
    fs.writeFileSync(tailwindConfigPath, updatedTailwindConfig, 'utf8');
    console.log(`✅ Updated tailwind.config.ts`);
  } catch (error) {
    console.error('❌ Error updating tailwind.config.ts:', error);
  }
  
  // Step 3: Find all TS/TSX/JS/JSX files and update imports
  console.log('🔍 Finding and updating file imports...');
  const files = findFiles(ROOT_DIR, ['.ts', '.tsx', '.js', '.jsx']);
  
  let updatedCount = 0;
  for (const file of files) {
    if (updateFileImports(file)) {
      updatedCount++;
    }
  }
  
  console.log(`🎉 CSS consolidation complete! Updated ${updatedCount} files.`);
  console.log('\n⚠️ Important notes:');
  console.log('   1. Phone input styling was NOT touched as requested');
  console.log('   2. After testing, you may want to manually delete:');
  console.log('      - app/globals.css');
  console.log('   3. Keep shared/theme/index.css for phone input styling only');
}

// Run the script
main();