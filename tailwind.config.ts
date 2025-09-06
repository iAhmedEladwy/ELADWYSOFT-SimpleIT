import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        // MD3 specific radii
        'md3-xs': '4px',
        'md3-sm': '8px',
        'md3-md': '12px',
        'md3-lg': '16px',
        'md3-xl': '24px',
        'md3-2xl': '28px',
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          // MD3 Primary tones (indigo-based)
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
          // MD3 Secondary tones (pink-based)
          50: '#fdf2f8',
          100: '#fce7f3',
          200: '#fbcfe8',
          300: '#f9a8d4',
          400: '#f472b6',
          500: '#ec4899',
          600: '#db2777',
          700: '#be185d',
          800: '#9d174d',
          900: '#831843',
          950: '#500724',
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        // MD3 Additional colors
        tertiary: {
          // MD3 Tertiary tones (teal-based)
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
        // MD3 Surface colors for layering
        surface: {
          DEFAULT: '#ffffff',
          dark: '#1c1b1f',
          dim: '#e7e0ec',
          bright: '#fef7ff',
          container: {
            lowest: '#ffffff',
            low: '#f7f2fa',
            DEFAULT: '#f1ecf4',
            high: '#ece6f0',
            highest: '#e6e0e9',
          }
        },
        // MD3 Status colors
        success: {
          DEFAULT: '#22c55e',
          light: '#dcfce7',
          dark: '#166534',
          text: '#15803d',
          border: '#bbf7d0',
        },
        warning: {
          DEFAULT: '#f59e0b',
          light: '#fef3c7',
          dark: '#92400e',
          text: '#b45309',
          border: '#fde68a',
        },
        error: {
          DEFAULT: '#ef4444',
          light: '#fee2e2',
          dark: '#991b1b',
          text: '#dc2626',
          border: '#fecaca',
        },
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        // MD3 Custom animations
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        slideIn: {
          '0%': { 
            opacity: '0',
            transform: 'translateY(10px)'
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)'
          },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)' },
          '100%': { transform: 'scale(1)' },
        },
        // Ripple effect for MD3 buttons
        ripple: {
          '0%': {
            transform: 'scale(0)',
            opacity: '1',
          },
          '100%': {
            transform: 'scale(4)',
            opacity: '0',
          },
        },
        // Gentle pulse for loading states
        gentlePulse: {
          '0%, 100%': {
            opacity: '1',
          },
          '50%': {
            opacity: '0.5',
          },
        },
        // Float animation for floating elements
        float: {
          '0%, 100%': {
            transform: 'translateY(0)',
          },
          '50%': {
            transform: 'translateY(-10px)',
          },
        },
        // Bounce in animation
        bounceIn: {
          '0%': {
            transform: 'scale(0.3)',
            opacity: '0',
          },
          '50%': {
            transform: 'scale(1.05)',
          },
          '70%': {
            transform: 'scale(0.9)',
          },
          '100%': {
            transform: 'scale(1)',
            opacity: '1',
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        // MD3 animations
        shimmer: "shimmer 2s linear infinite",
        slideIn: "slideIn 0.3s ease-out",
        fadeIn: "fadeIn 0.3s ease-in",
        scaleIn: "scaleIn 0.2s ease-out",
        ripple: "ripple 0.6s linear",
        gentlePulse: "gentlePulse 2s ease-in-out infinite",
        float: "float 3s ease-in-out infinite",
        bounceIn: "bounceIn 0.5s ease-out",
      },
      // MD3 Elevation (box-shadow)
      boxShadow: {
        // MD3 elevation levels
        'md3-1': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        'md3-2': '0 2px 4px -1px rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.03)',
        'md3-3': '0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.03)',
        'md3-4': '0 8px 10px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.03)',
        'md3-5': '0 12px 16px -4px rgb(0 0 0 / 0.09), 0 6px 8px -5px rgb(0 0 0 / 0.04)',
        // Colored shadows for hover effects
        'primary-glow': '0 0 20px rgba(99, 102, 241, 0.3)',
        'secondary-glow': '0 0 20px rgba(236, 72, 153, 0.3)',
        'tertiary-glow': '0 0 20px rgba(20, 184, 166, 0.3)',
        'success-glow': '0 0 20px rgba(34, 197, 94, 0.3)',
        'error-glow': '0 0 20px rgba(239, 68, 68, 0.3)',
      },
      // MD3 Typography
      fontSize: {
        // Display
        'display-large': ['57px', { lineHeight: '64px', letterSpacing: '-0.25px' }],
        'display-medium': ['45px', { lineHeight: '52px', letterSpacing: '0' }],
        'display-small': ['36px', { lineHeight: '44px', letterSpacing: '0' }],
        // Headline
        'headline-large': ['32px', { lineHeight: '40px', letterSpacing: '0' }],
        'headline-medium': ['28px', { lineHeight: '36px', letterSpacing: '0' }],
        'headline-small': ['24px', { lineHeight: '32px', letterSpacing: '0' }],
        // Title
        'title-large': ['22px', { lineHeight: '28px', letterSpacing: '0' }],
        'title-medium': ['16px', { lineHeight: '24px', letterSpacing: '0.15px' }],
        'title-small': ['14px', { lineHeight: '20px', letterSpacing: '0.1px' }],
        // Body
        'body-large': ['16px', { lineHeight: '24px', letterSpacing: '0.5px' }],
        'body-medium': ['14px', { lineHeight: '20px', letterSpacing: '0.25px' }],
        'body-small': ['12px', { lineHeight: '16px', letterSpacing: '0.4px' }],
        // Label
        'label-large': ['14px', { lineHeight: '20px', letterSpacing: '0.1px' }],
        'label-medium': ['12px', { lineHeight: '16px', letterSpacing: '0.5px' }],
        'label-small': ['11px', { lineHeight: '16px', letterSpacing: '0.5px' }],
      },
      // MD3 Transitions
      transitionDuration: {
        'md3-short': '100ms',
        'md3-medium': '300ms',
        'md3-long': '500ms',
        'md3-extra-long': '1000ms',
      },
      transitionTimingFunction: {
        'md3-standard': 'cubic-bezier(0.4, 0.0, 0.2, 1)',
        'md3-accelerate': 'cubic-bezier(0.4, 0.0, 1, 1)',
        'md3-decelerate': 'cubic-bezier(0.0, 0.0, 0.2, 1)',
      },
      // Backdrop blur for glass effects
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"), 
    require("@tailwindcss/typography"),
    // Add plugin for MD3 utilities
    function({ addUtilities }: any) {
      const newUtilities = {
        // Glass morphism effect
        '.glass': {
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
        },
        '.glass-dark': {
          background: 'rgba(0, 0, 0, 0.1)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        },
        // Gradient text
        '.gradient-text': {
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        },
        // No scrollbar
        '.no-scrollbar': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': {
            display: 'none',
          },
        },
        // Thin scrollbar
        '.thin-scrollbar': {
          '&::-webkit-scrollbar': {
            width: '4px',
            height: '4px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#888',
            borderRadius: '2px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: '#555',
          },
        },
      };
      addUtilities(newUtilities);
    },
  ],
} satisfies Config;