/**
 * ClockAlign Design System
 * Premium UI foundation inspired by Apple & Google Material You
 * Focus: Teal/Amber/Emerald palette with sophisticated animations
 */

// Animation timings - Apple-style smooth curves
export const TIMING = {
  instant: 0,
  fast: 150,
  normal: 250,
  slow: 350,
  slower: 500,
  dramatic: 800,
} as const;

// Easing functions - Custom bezier curves for premium feel
export const EASING = {
  // Standard - smooth deceleration
  ease: [0.25, 0.1, 0.25, 1],
  // Enter - accelerating from zero
  easeIn: [0.42, 0, 1, 1],
  // Exit - decelerating to zero
  easeOut: [0, 0, 0.58, 1],
  // Bounce - subtle overshoot
  spring: [0.34, 1.56, 0.64, 1],
  // Smooth - Apple-style fluid
  fluid: [0.4, 0, 0.2, 1],
  // Snap - quick response
  snap: [0.2, 0, 0, 1],
} as const;

// Color palette - NO purple/indigo
export const COLORS = {
  // Primary - Teal family (trust, clarity)
  teal: {
    50: '#f0fdfa',
    100: '#ccfbf1',
    200: '#99f6e4',
    300: '#5eead4',
    400: '#2dd4bf',
    500: '#14b8a6',
    600: '#0d9488',
    700: '#0f766e',
    800: '#115e59',
    900: '#134e4a',
    950: '#042f2e',
  },
  // Secondary - Amber/Gold (warmth, energy)
  amber: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
    950: '#451a03',
  },
  // Success - Emerald (growth, harmony)
  emerald: {
    50: '#ecfdf5',
    100: '#d1fae5',
    200: '#a7f3d0',
    300: '#6ee7b7',
    400: '#34d399',
    500: '#10b981',
    600: '#059669',
    700: '#047857',
    800: '#065f46',
    900: '#064e3b',
    950: '#022c22',
  },
  // Rose - Soft accents (attention, warmth)
  rose: {
    50: '#fff1f2',
    100: '#ffe4e6',
    200: '#fecdd3',
    300: '#fda4af',
    400: '#fb7185',
    500: '#f43f5e',
    600: '#e11d48',
    700: '#be123c',
    800: '#9f1239',
    900: '#881337',
    950: '#4c0519',
  },
  // Slate - Neutrals (sophistication)
  slate: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
    950: '#020617',
  },
  // Sky - Blue accents (calm, trust)
  sky: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
    950: '#082f49',
  },
};

// Gradients - Subtle depth
export const GRADIENTS = {
  // Hero backgrounds
  hero: 'linear-gradient(135deg, #f0fdfa 0%, #ecfdf5 50%, #fffbeb 100%)',
  heroDark: 'linear-gradient(135deg, #042f2e 0%, #022c22 50%, #451a03 100%)',
  
  // Card surfaces
  card: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
  cardDark: 'linear-gradient(145deg, #1e293b 0%, #0f172a 100%)',
  
  // Accent glows
  tealGlow: 'linear-gradient(135deg, #14b8a6 0%, #2dd4bf 100%)',
  amberGlow: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
  emeraldGlow: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
  
  // Status indicators
  success: 'linear-gradient(90deg, #10b981 0%, #34d399 100%)',
  warning: 'linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%)',
  danger: 'linear-gradient(90deg, #f43f5e 0%, #fb7185 100%)',
};

// Shadows - Layered depth system
export const SHADOWS = {
  // Light mode
  sm: '0 1px 2px 0 rgba(15, 23, 42, 0.05)',
  DEFAULT: '0 1px 3px 0 rgba(15, 23, 42, 0.08), 0 1px 2px -1px rgba(15, 23, 42, 0.08)',
  md: '0 4px 6px -1px rgba(15, 23, 42, 0.08), 0 2px 4px -2px rgba(15, 23, 42, 0.08)',
  lg: '0 10px 15px -3px rgba(15, 23, 42, 0.08), 0 4px 6px -4px rgba(15, 23, 42, 0.08)',
  xl: '0 20px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.08)',
  '2xl': '0 25px 50px -12px rgba(15, 23, 42, 0.15)',
  
  // Glow effects (for dark mode)
  glowTeal: '0 0 20px rgba(20, 184, 166, 0.3)',
  glowAmber: '0 0 20px rgba(245, 158, 11, 0.3)',
  glowEmerald: '0 0 20px rgba(16, 185, 129, 0.3)',
  
  // Inner shadows
  inner: 'inset 0 2px 4px 0 rgba(15, 23, 42, 0.05)',
  innerDark: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.3)',
};

// Spacing - 4px grid system
export const SPACING = {
  '0': '0',
  '0.5': '2px',
  '1': '4px',
  '1.5': '6px',
  '2': '8px',
  '2.5': '10px',
  '3': '12px',
  '3.5': '14px',
  '4': '16px',
  '5': '20px',
  '6': '24px',
  '7': '28px',
  '8': '32px',
  '9': '36px',
  '10': '40px',
  '11': '44px',
  '12': '48px',
  '14': '56px',
  '16': '64px',
  '20': '80px',
  '24': '96px',
  '28': '112px',
  '32': '128px',
};

// Typography scale
export const TYPOGRAPHY = {
  fontFamily: {
    sans: 'var(--font-sans), system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    mono: 'var(--font-mono), ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  },
  sizes: {
    '2xs': '0.625rem',  // 10px
    xs: '0.75rem',      // 12px
    sm: '0.875rem',     // 14px
    base: '1rem',       // 16px
    lg: '1.125rem',     // 18px
    xl: '1.25rem',      // 20px
    '2xl': '1.5rem',    // 24px
    '3xl': '1.875rem',  // 30px
    '4xl': '2.25rem',   // 36px
    '5xl': '3rem',      // 48px
    '6xl': '3.75rem',   // 60px
  },
  lineHeight: {
    tight: '1.25',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2',
  },
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
  },
  weight: {
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
};

// Framer Motion variants
export const MOTION = {
  // Page transitions
  page: {
    initial: { opacity: 0, y: 8 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.4,
        ease: EASING.fluid,
      }
    },
    exit: { 
      opacity: 0, 
      y: -8,
      transition: {
        duration: 0.25,
        ease: EASING.easeIn,
      }
    },
  },
  
  // Card hover lift
  cardHover: {
    rest: { 
      y: 0, 
      boxShadow: SHADOWS.md,
      transition: { duration: 0.2, ease: EASING.fluid }
    },
    hover: { 
      y: -4, 
      boxShadow: SHADOWS.xl,
      transition: { duration: 0.25, ease: EASING.spring }
    },
  },
  
  // Button press
  buttonTap: {
    scale: 0.97,
    transition: { duration: 0.1 },
  },
  
  // Fade in up
  fadeInUp: {
    initial: { opacity: 0, y: 20 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.5,
        ease: EASING.fluid,
      }
    },
  },
  
  // Stagger children
  stagger: {
    animate: {
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1,
      },
    },
  },
  
  // Scale in
  scaleIn: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { 
      opacity: 1, 
      scale: 1,
      transition: {
        duration: 0.3,
        ease: EASING.spring,
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.95,
      transition: {
        duration: 0.2,
      }
    },
  },
  
  // Slide in from right
  slideInRight: {
    initial: { opacity: 0, x: 20 },
    animate: { 
      opacity: 1, 
      x: 0,
      transition: {
        duration: 0.35,
        ease: EASING.fluid,
      }
    },
    exit: { 
      opacity: 0, 
      x: -20,
      transition: {
        duration: 0.2,
      }
    },
  },
  
  // Pulse animation for live indicators
  pulse: {
    scale: [1, 1.05, 1],
    opacity: [0.7, 1, 0.7],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
  
  // Number count up
  countUp: {
    initial: { opacity: 0 },
    animate: { 
      opacity: 1,
      transition: { duration: 0.5 }
    },
  },
  
  // Success checkmark
  checkmark: {
    initial: { pathLength: 0, opacity: 0 },
    animate: { 
      pathLength: 1, 
      opacity: 1,
      transition: {
        pathLength: { duration: 0.4, ease: EASING.fluid },
        opacity: { duration: 0.1 },
      }
    },
  },
};

// Glassmorphism utilities
export const GLASS = {
  light: {
    background: 'rgba(255, 255, 255, 0.7)',
    backdropFilter: 'blur(12px) saturate(180%)',
    border: '1px solid rgba(255, 255, 255, 0.5)',
  },
  dark: {
    background: 'rgba(15, 23, 42, 0.7)',
    backdropFilter: 'blur(12px) saturate(180%)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
  },
};

// Z-index scale
export const Z_INDEX = {
  base: 0,
  dropdown: 50,
  sticky: 100,
  fixed: 200,
  modalBackdrop: 300,
  modal: 400,
  popover: 500,
  tooltip: 600,
  toast: 700,
};

// Border radius scale
export const RADIUS = {
  none: '0',
  sm: '4px',
  DEFAULT: '8px',
  md: '10px',
  lg: '12px',
  xl: '16px',
  '2xl': '20px',
  '3xl': '24px',
  full: '9999px',
};

// Focus rings
export const FOCUS = {
  DEFAULT: '0 0 0 2px #fff, 0 0 0 4px #14b8a6',
  teal: '0 0 0 2px #fff, 0 0 0 4px #14b8a6',
  amber: '0 0 0 2px #fff, 0 0 0 4px #f59e0b',
  emerald: '0 0 0 2px #fff, 0 0 0 4px #10b981',
  rose: '0 0 0 2px #fff, 0 0 0 4px #f43f5e',
};
