# Theme Patterns

## Core Theme Principles

These patterns ensure consistent, maintainable, and accessible theming across the application.

### Law 1: Design Tokens First
- Define all design values as tokens
- Use semantic naming for tokens
- Keep raw values in one place

### Law 2: CSS Variables for Dynamic Theming
- Use CSS custom properties for runtime changes
- Support system preferences
- Enable smooth theme transitions

### Law 3: Type-Safe Themes
- Define theme structure with TypeScript
- Ensure compile-time safety
- Validate theme objects

### Law 4: Accessibility by Default
- Always meet WCAG contrast requirements
- Support high contrast modes
- Test with accessibility tools

## Design Token System

### Base Token Structure
```typescript
// theme/tokens.ts
export const tokens = {
  colors: {
    // Primitive colors
    gray: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
    },
    blue: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      // ... rest of scale
      600: '#2563eb',
      700: '#1d4ed8',
    },
    // ... other color scales
  },
  
  spacing: {
    0: '0',
    1: '0.25rem',
    2: '0.5rem',
    3: '0.75rem',
    4: '1rem',
    6: '1.5rem',
    8: '2rem',
    12: '3rem',
    16: '4rem',
    20: '5rem',
    24: '6rem',
  },
  
  typography: {
    fonts: {
      sans: 'system-ui, -apple-system, sans-serif',
      serif: 'Georgia, serif',
      mono: 'Menlo, Monaco, monospace',
    },
    sizes: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
    },
    weights: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeights: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
    },
  },
  
  radii: {
    none: '0',
    sm: '0.125rem',
    base: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    full: '9999px',
  },
  
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    base: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
  },
} as const;

// Semantic tokens
export const semanticTokens = {
  colors: {
    background: {
      primary: tokens.colors.gray[50],
      secondary: tokens.colors.gray[100],
      tertiary: tokens.colors.gray[200],
    },
    text: {
      primary: tokens.colors.gray[900],
      secondary: tokens.colors.gray[700],
      tertiary: tokens.colors.gray[500],
      inverse: tokens.colors.gray[50],
    },
    border: {
      default: tokens.colors.gray[200],
      focused: tokens.colors.blue[600],
      error: tokens.colors.red[600],
    },
    // ... more semantic colors
  },
} as const;
```

### CSS Variables Implementation
```typescript
// theme/cssVariables.ts
export function generateCSSVariables(theme: Theme): string {
  return `
    :root {
      /* Colors */
      --color-background-primary: ${theme.colors.background.primary};
      --color-background-secondary: ${theme.colors.background.secondary};
      --color-text-primary: ${theme.colors.text.primary};
      --color-text-secondary: ${theme.colors.text.secondary};
      
      /* Spacing */
      --spacing-1: ${theme.spacing[1]};
      --spacing-2: ${theme.spacing[2]};
      --spacing-4: ${theme.spacing[4]};
      
      /* Typography */
      --font-sans: ${theme.typography.fonts.sans};
      --text-base: ${theme.typography.sizes.base};
      --text-lg: ${theme.typography.sizes.lg};
      
      /* Shadows */
      --shadow-sm: ${theme.shadows.sm};
      --shadow-md: ${theme.shadows.md};
    }
    
    @media (prefers-color-scheme: dark) {
      :root {
        --color-background-primary: ${theme.dark.colors.background.primary};
        --color-background-secondary: ${theme.dark.colors.background.secondary};
        --color-text-primary: ${theme.dark.colors.text.primary};
        --color-text-secondary: ${theme.dark.colors.text.secondary};
      }
    }
  `;
}

// app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <style dangerouslySetInnerHTML={{ 
          __html: generateCSSVariables(defaultTheme) 
        }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

## Theme Configuration

### Theme Type Definition
```typescript
// theme/types.ts
export interface Theme {
  name: string;
  colors: {
    background: {
      primary: string;
      secondary: string;
      tertiary: string;
    };
    text: {
      primary: string;
      secondary: string;
      tertiary: string;
      inverse: string;
    };
    accent: {
      primary: string;
      secondary: string;
    };
    status: {
      success: string;
      warning: string;
      error: string;
      info: string;
    };
  };
  spacing: Record<string, string>;
  typography: {
    fonts: Record<string, string>;
    sizes: Record<string, string>;
    weights: Record<string, number>;
    lineHeights: Record<string, number>;
  };
  radii: Record<string, string>;
  shadows: Record<string, string>;
  transitions: {
    fast: string;
    normal: string;
    slow: string;
  };
}

// theme/themes.ts
export const lightTheme: Theme = {
  name: 'light',
  colors: {
    background: {
      primary: '#ffffff',
      secondary: '#f9fafb',
      tertiary: '#f3f4f6',
    },
    text: {
      primary: '#111827',
      secondary: '#4b5563',
      tertiary: '#6b7280',
      inverse: '#ffffff',
    },
    // ... rest of light theme
  },
  // ... other theme properties
};

export const darkTheme: Theme = {
  name: 'dark',
  colors: {
    background: {
      primary: '#111827',
      secondary: '#1f2937',
      tertiary: '#374151',
    },
    text: {
      primary: '#f9fafb',
      secondary: '#e5e7eb',
      tertiary: '#d1d5db',
      inverse: '#111827',
    },
    // ... rest of dark theme
  },
  // ... other theme properties
};
```

### Theme Context Implementation
```typescript
// contexts/ThemeContext.tsx
interface ThemeContextType {
  theme: Theme;
  mode: 'light' | 'dark' | 'system';
  setMode: (mode: 'light' | 'dark' | 'system') => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<'light' | 'dark' | 'system'>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');
  
  // Detect system preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = () => {
      if (mode === 'system') {
        setResolvedTheme(mediaQuery.matches ? 'dark' : 'light');
      }
    };
    
    handleChange();
    mediaQuery.addEventListener('change', handleChange);
    
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [mode]);
  
  // Apply theme to document
  useEffect(() => {
    const actualTheme = mode === 'system' ? resolvedTheme : mode;
    document.documentElement.setAttribute('data-theme', actualTheme);
    
    // Update CSS variables
    const themeObject = actualTheme === 'dark' ? darkTheme : lightTheme;
    Object.entries(themeObject.colors).forEach(([category, colors]) => {
      Object.entries(colors).forEach(([key, value]) => {
        document.documentElement.style.setProperty(
          `--color-${category}-${key}`,
          value
        );
      });
    });
  }, [mode, resolvedTheme]);
  
  const theme = mode === 'system' 
    ? (resolvedTheme === 'dark' ? darkTheme : lightTheme)
    : (mode === 'dark' ? darkTheme : lightTheme);
  
  const toggleTheme = () => {
    setMode(current => {
      if (current === 'light') return 'dark';
      if (current === 'dark') return 'light';
      return 'light';
    });
  };
  
  return (
    <ThemeContext.Provider value={{ theme, mode, setMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
```

## CSS-in-JS Integration

### Styled Components Pattern
```typescript
// theme/styled.ts
import styled from 'styled-components';

// Theme-aware styled components
export const Card = styled.div`
  background-color: var(--color-background-secondary);
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-lg);
  padding: var(--spacing-4);
  box-shadow: var(--shadow-sm);
  
  transition: box-shadow var(--transition-fast);
  
  &:hover {
    box-shadow: var(--shadow-md);
  }
`;

export const Text = styled.p<{ variant?: 'primary' | 'secondary' }>`
  color: var(--color-text-${props => props.variant || 'primary'});
  font-family: var(--font-sans);
  font-size: var(--text-base);
  line-height: var(--line-height-normal);
`;

// With theme object
export const ThemedButton = styled.button`
  background-color: ${props => props.theme.colors.accent.primary};
  color: ${props => props.theme.colors.text.inverse};
  padding: ${props => props.theme.spacing[2]} ${props => props.theme.spacing[4]};
  border-radius: ${props => props.theme.radii.md};
  font-weight: ${props => props.theme.typography.weights.medium};
  
  &:hover {
    background-color: ${props => props.theme.colors.accent.secondary};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;
```

### Tailwind Integration
```typescript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        background: {
          primary: 'var(--color-background-primary)',
          secondary: 'var(--color-background-secondary)',
          tertiary: 'var(--color-background-tertiary)',
        },
        text: {
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          tertiary: 'var(--color-text-tertiary)',
        },
      },
    },
  },
  darkMode: ['class', '[data-theme="dark"]'],
};

// Component usage
export function ThemedComponent() {
  return (
    <div className="bg-background-primary text-text-primary">
      <h1 className="text-2xl font-semibold text-text-primary">
        Themed Heading
      </h1>
      <p className="text-text-secondary">
        This text adapts to the theme
      </p>
    </div>
  );
}
```

## Accessibility Patterns

### High Contrast Mode
```typescript
// theme/highContrast.ts
export const highContrastTheme: Theme = {
  ...lightTheme,
  name: 'high-contrast',
  colors: {
    ...lightTheme.colors,
    background: {
      primary: '#ffffff',
      secondary: '#ffffff',
      tertiary: '#ffffff',
    },
    text: {
      primary: '#000000',
      secondary: '#000000',
      tertiary: '#000000',
      inverse: '#ffffff',
    },
    border: {
      default: '#000000',
      focused: '#000000',
      error: '#000000',
    },
  },
};

// CSS for forced colors mode
const forcedColorsCSS = `
  @media (prefers-contrast: high) {
    :root {
      --color-background-primary: Canvas;
      --color-text-primary: CanvasText;
      --color-border-default: CanvasText;
    }
  }
`;
```

### Focus Indicators
```typescript
// theme/accessibility.ts
export const accessibilityStyles = `
  /* Visible focus indicators */
  :focus-visible {
    outline: 2px solid var(--color-accent-primary);
    outline-offset: 2px;
  }
  
  /* Skip to content link */
  .skip-to-content {
    position: absolute;
    left: -9999px;
    top: 0;
    z-index: 999;
    padding: var(--spacing-2) var(--spacing-4);
    background-color: var(--color-background-primary);
    color: var(--color-text-primary);
    text-decoration: none;
  }
  
  .skip-to-content:focus {
    left: 0;
  }
  
  /* Reduced motion */
  @media (prefers-reduced-motion: reduce) {
    * {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
`;
```

## Component Theming Patterns

### Themed Component Library
```typescript
// components/themed/Button.tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}

const buttonVariants = {
  primary: 'bg-accent-primary text-text-inverse hover:bg-accent-secondary',
  secondary: 'bg-background-secondary text-text-primary hover:bg-background-tertiary',
  ghost: 'bg-transparent text-text-primary hover:bg-background-secondary',
};

const buttonSizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
};

export function Button({ 
  variant = 'primary',
  size = 'md',
  children,
  onClick,
  disabled,
}: ButtonProps) {
  return (
    <button
      className={cn(
        'rounded-md font-medium transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-accent-primary',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        buttonVariants[variant],
        buttonSizes[size]
      )}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
```

### Dynamic Theme Components
```typescript
// components/themed/ThemeSwitch.tsx
export function ThemeSwitch() {
  const { mode, setMode } = useTheme();
  
  return (
    <div className="flex items-center space-x-2">
      <label htmlFor="theme-switch" className="text-text-secondary">
        Theme:
      </label>
      <select
        id="theme-switch"
        value={mode}
        onChange={(e) => setMode(e.target.value as any)}
        className="bg-background-secondary text-text-primary rounded-md px-3 py-1"
      >
        <option value="light">Light</option>
        <option value="dark">Dark</option>
        <option value="system">System</option>
      </select>
    </div>
  );
}
```

## Anti-Patterns to Avoid

### ❌ DON'T: Hardcode colors
```css
/* Hardcoded colors - difficult to theme */
.card {
  background-color: #ffffff;
  color: #111827;
  border: 1px solid #e5e7eb;
}
```

### ✅ DO: Use CSS variables
```css
/* Theme-aware with CSS variables */
.card {
  background-color: var(--color-background-primary);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border-default);
}
```

### ❌ DON'T: Forget transitions
```typescript
// Jarring theme switch
document.documentElement.setAttribute('data-theme', 'dark');
```

### ✅ DO: Smooth transitions
```css
/* Smooth theme transitions */
:root {
  transition: background-color 0.3s ease, color 0.3s ease;
}

* {
  transition: background-color 0.3s ease, color 0.3s ease;
}
```