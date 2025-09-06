// client/src/styles/material-design.ts

/**
 * Material Design 3 Style System for SimpleIT Dashboard
 * Provides consistent styling utilities following MD3 principles
 */

// Color Palette - MD3 Dynamic Color System
export const md3Colors = {
  // Primary colors (Indigo-based for professional look)
  primary: {
    base: 'bg-indigo-500',
    light: 'bg-indigo-100',
    dark: 'bg-indigo-700',
    text: 'text-indigo-600',
    textLight: 'text-indigo-400',
    textDark: 'text-indigo-800',
    hover: 'hover:bg-indigo-600',
    border: 'border-indigo-200',
    shadow: 'shadow-indigo-500/20'
  },
  
  // Secondary colors (Pink/Rose for accents)
  secondary: {
    base: 'bg-pink-500',
    light: 'bg-pink-100',
    dark: 'bg-pink-700',
    text: 'text-pink-600',
    textLight: 'text-pink-400',
    textDark: 'text-pink-800',
    hover: 'hover:bg-pink-600',
    border: 'border-pink-200',
    shadow: 'shadow-pink-500/20'
  },
  
  // Tertiary colors (Teal for success/positive)
  tertiary: {
    base: 'bg-teal-500',
    light: 'bg-teal-100',
    dark: 'bg-teal-700',
    text: 'text-teal-600',
    textLight: 'text-teal-400',
    textDark: 'text-teal-800',
    hover: 'hover:bg-teal-600',
    border: 'border-teal-200',
    shadow: 'shadow-teal-500/20'
  },
  
  // Status colors
  success: {
    base: 'bg-green-500',
    light: 'bg-green-100',
    text: 'text-green-700',
    border: 'border-green-200'
  },
  warning: {
    base: 'bg-amber-500',
    light: 'bg-amber-100',
    text: 'text-amber-700',
    border: 'border-amber-200'
  },
  error: {
    base: 'bg-red-500',
    light: 'bg-red-100',
    text: 'text-red-700',
    border: 'border-red-200'
  },
  
  // Surface colors
  surface: {
    base: 'bg-white dark:bg-gray-800',
    elevated: 'bg-gray-50 dark:bg-gray-900',
    container: 'bg-indigo-50 dark:bg-indigo-950/20',
    overlay: 'bg-black/5 dark:bg-white/5'
  }
};

// Elevation System - MD3 layered approach
export const md3Elevation = {
  0: '',
  1: 'shadow-sm shadow-black/5 dark:shadow-white/5',
  2: 'shadow-md shadow-black/10 dark:shadow-white/10',
  3: 'shadow-lg shadow-black/15 dark:shadow-white/15',
  4: 'shadow-xl shadow-black/20 dark:shadow-white/20',
  5: 'shadow-2xl shadow-black/25 dark:shadow-white/25'
};

// Border Radius System - Consistent rounded corners
export const md3Radius = {
  none: 'rounded-none',
  sm: 'rounded-lg',     // 8px
  md: 'rounded-xl',     // 12px
  lg: 'rounded-2xl',    // 16px
  xl: 'rounded-3xl',    // 24px
  full: 'rounded-full'
};

// Typography Classes - Following MD3 type scale
export const md3Typography = {
  displayLarge: 'text-5xl font-normal tracking-tight',
  displayMedium: 'text-4xl font-normal tracking-tight',
  displaySmall: 'text-3xl font-normal',
  
  headlineLarge: 'text-3xl font-normal',
  headlineMedium: 'text-2xl font-normal',
  headlineSmall: 'text-xl font-normal',
  
  titleLarge: 'text-xl font-medium',
  titleMedium: 'text-base font-medium tracking-wide',
  titleSmall: 'text-sm font-medium tracking-wide',
  
  bodyLarge: 'text-base font-normal',
  bodyMedium: 'text-sm font-normal',
  bodySmall: 'text-xs font-normal',
  
  labelLarge: 'text-sm font-medium',
  labelMedium: 'text-xs font-medium',
  labelSmall: 'text-xs font-medium tracking-wide'
};

// Animation Classes
export const md3Animations = {
  // Transitions
  transition: {
    all: 'transition-all duration-300 ease-in-out',
    colors: 'transition-colors duration-200 ease-in-out',
    transform: 'transition-transform duration-300 ease-in-out',
    opacity: 'transition-opacity duration-200 ease-in-out',
    shadow: 'transition-shadow duration-300 ease-in-out'
  },
  
  // Hover effects
  hover: {
    scale: 'hover:scale-[1.02]',
    scaleSmall: 'hover:scale-[1.01]',
    scaleLarge: 'hover:scale-105',
    lift: 'hover:-translate-y-0.5',
    brightness: 'hover:brightness-105'
  },
  
  // Active effects
  active: {
    scale: 'active:scale-[0.98]',
    brightness: 'active:brightness-95'
  },
  
  // Focus effects
  focus: {
    ring: 'focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2',
    outline: 'focus:outline-none focus:ring-2 focus:ring-indigo-500'
  },
  
  // Loading animations
  loading: {
    pulse: 'animate-pulse',
    spin: 'animate-spin',
    bounce: 'animate-bounce',
    shimmer: 'bg-gradient-to-r from-transparent via-white/10 to-transparent bg-[length:200%_100%] animate-[shimmer_2s_infinite]'
  }
};

// Spacing System - 8px grid
export const md3Spacing = {
  xs: 'p-2',    // 8px
  sm: 'p-3',    // 12px
  md: 'p-4',    // 16px
  lg: 'p-6',    // 24px
  xl: 'p-8',    // 32px
  '2xl': 'p-10' // 40px
};

// Component Style Presets
export const md3Components = {
  // Card styles
  card: {
    base: `${md3Radius.lg} ${md3Elevation[2]} ${md3Animations.transition.all} ${md3Animations.hover.scale} hover:${md3Elevation[3]} ${md3Colors.surface.base}`,
    flat: `${md3Radius.lg} ${md3Colors.surface.base} border border-gray-200 dark:border-gray-700`,
    elevated: `${md3Radius.lg} ${md3Elevation[1]} ${md3Colors.surface.base}`,
    filled: `${md3Radius.lg} ${md3Colors.surface.elevated}`,
    outlined: `${md3Radius.lg} border-2 border-gray-200 dark:border-gray-700 ${md3Colors.surface.base}`
  },
  
  // Button styles
  button: {
    primary: `${md3Radius.full} ${md3Colors.primary.base} text-white ${md3Animations.transition.all} ${md3Animations.hover.brightness} ${md3Animations.active.scale} ${md3Elevation[1]} hover:${md3Elevation[2]}`,
    secondary: `${md3Radius.full} ${md3Colors.secondary.light} ${md3Colors.secondary.text} ${md3Animations.transition.all} hover:${md3Colors.secondary.base} hover:text-white ${md3Animations.active.scale}`,
    tertiary: `${md3Radius.full} ${md3Colors.surface.overlay} ${md3Animations.transition.all} hover:${md3Colors.surface.elevated} ${md3Animations.active.scale}`,
    outlined: `${md3Radius.full} border-2 ${md3Colors.primary.border} ${md3Colors.primary.text} ${md3Animations.transition.all} hover:${md3Colors.primary.light} ${md3Animations.active.scale}`,
    text: `${md3Colors.primary.text} ${md3Animations.transition.colors} hover:${md3Colors.primary.textDark} ${md3Animations.active.scale}`,
    icon: `${md3Radius.full} p-2 ${md3Animations.transition.all} hover:${md3Colors.surface.overlay} ${md3Animations.active.scale}`
  },
  
  // Badge styles
  badge: {
    primary: `${md3Radius.full} px-3 py-1 ${md3Colors.primary.light} ${md3Colors.primary.text} text-xs font-medium`,
    secondary: `${md3Radius.full} px-3 py-1 ${md3Colors.secondary.light} ${md3Colors.secondary.text} text-xs font-medium`,
    success: `${md3Radius.full} px-3 py-1 ${md3Colors.success.light} ${md3Colors.success.text} text-xs font-medium`,
    warning: `${md3Radius.full} px-3 py-1 ${md3Colors.warning.light} ${md3Colors.warning.text} text-xs font-medium`,
    error: `${md3Radius.full} px-3 py-1 ${md3Colors.error.light} ${md3Colors.error.text} text-xs font-medium`,
    neutral: `${md3Radius.full} px-3 py-1 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 text-xs font-medium`
  },
  
  // Input styles
  input: {
    base: `${md3Radius.md} border-2 border-gray-300 dark:border-gray-600 ${md3Animations.transition.all} focus:${md3Colors.primary.border} focus:outline-none px-4 py-2`,
    filled: `${md3Radius.md} ${md3Colors.surface.elevated} border-2 border-transparent ${md3Animations.transition.all} focus:${md3Colors.primary.border} focus:outline-none px-4 py-2`,
    outlined: `${md3Radius.md} border-2 ${md3Colors.primary.border} ${md3Animations.transition.all} focus:ring-2 focus:ring-indigo-500/20 focus:outline-none px-4 py-2`
  },
  
  // Tab styles
  tab: {
    list: `${md3Radius.full} ${md3Colors.surface.elevated} p-1 inline-flex gap-1`,
    trigger: `${md3Radius.full} px-4 py-2 ${md3Animations.transition.all} data-[state=active]:${md3Colors.primary.base} data-[state=active]:text-white data-[state=inactive]:hover:bg-gray-200 dark:data-[state=inactive]:hover:bg-gray-700`,
    content: `${md3Animations.transition.opacity} mt-6`
  }
};

// Metric Card Specific Styles
export const md3MetricCard = {
  container: `${md3Components.card.base} ${md3Spacing.md} group`,
  iconWrapper: `w-12 h-12 ${md3Radius.lg} flex items-center justify-center ${md3Animations.transition.all} group-hover:scale-110`,
  value: `${md3Typography.displaySmall} font-bold text-gray-900 dark:text-white mt-3`,
  label: `${md3Typography.bodyMedium} text-gray-600 dark:text-gray-400 mt-1`,
  trend: {
    positive: `${md3Components.badge.success} inline-flex items-center gap-1`,
    negative: `${md3Components.badge.error} inline-flex items-center gap-1`,
    neutral: `${md3Components.badge.neutral} inline-flex items-center gap-1`
  },
  progressBar: `h-2 ${md3Radius.full} bg-gray-200 dark:bg-gray-700 overflow-hidden mt-4`,
  progressFill: `h-full ${md3Radius.full} ${md3Animations.transition.all}`
};

// Dashboard Specific Components
export const md3Dashboard = {
  header: `${md3Spacing.lg} ${md3Colors.surface.base} ${md3Elevation[1]} ${md3Radius.lg} mb-6`,
  section: `${md3Spacing.lg} ${md3Colors.surface.container} ${md3Radius.xl} mb-6`,
  grid: {
    metrics: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
    charts: 'grid grid-cols-1 lg:grid-cols-2 gap-6',
    activities: 'grid grid-cols-1 lg:grid-cols-3 gap-6'
  },
  quickAction: `${md3Components.button.tertiary} ${md3Radius.lg} ${md3Spacing.md} flex flex-col items-center gap-2 min-h-[100px] ${md3Animations.hover.lift}`,
  notification: `${md3Radius.md} ${md3Spacing.sm} ${md3Colors.surface.base} ${md3Animations.transition.all} hover:${md3Colors.surface.elevated} cursor-pointer`
};

// Utility function to combine classes
export const cn = (...classes: (string | undefined | false)[]) => {
  return classes.filter(Boolean).join(' ');
};

// Custom keyframes for animations (add to your global CSS or Tailwind config)
export const customAnimations = `
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes scaleIn {
    from { transform: scale(0.95); }
    to { transform: scale(1); }
  }
`;

// Export all MD3 utilities as a single object for convenience
export const MD3 = {
  colors: md3Colors,
  elevation: md3Elevation,
  radius: md3Radius,
  typography: md3Typography,
  animations: md3Animations,
  spacing: md3Spacing,
  components: md3Components,
  metricCard: md3MetricCard,
  dashboard: md3Dashboard,
  cn
};

export default MD3;