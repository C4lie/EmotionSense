/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      /* ─── V3 Premium Color System ─── */
      colors: {
        /* Core Background Palette — warm charcoal, not cold zinc */
        background: "hsl(var(--color-bg-primary) / <alpha-value>)",
        foreground: "hsl(var(--color-text-primary) / <alpha-value>)",
        
        /* Surface layers */
        surface: {
          DEFAULT: "hsl(var(--color-bg-secondary) / <alpha-value>)",
          elevated: "hsl(var(--color-bg-tertiary) / <alpha-value>)",
        },

        /* Card system */
        card: {
          DEFAULT: "hsl(var(--color-bg-tertiary) / <alpha-value>)",
          foreground: "hsl(var(--color-text-primary) / <alpha-value>)",
        },

        /* Popover system */
        popover: {
          DEFAULT: "hsl(var(--color-bg-tertiary) / <alpha-value>)",
          foreground: "hsl(var(--color-text-primary) / <alpha-value>)",
        },

        /* Accent — Soft violet (primary brand) */
        primary: {
          DEFAULT: "hsl(var(--color-accent-primary) / <alpha-value>)",
          foreground: "hsl(0 0% 100% / <alpha-value>)",
        },

        /* Secondary — Elevated surface */
        secondary: {
          DEFAULT: "hsl(var(--color-bg-secondary) / <alpha-value>)",
          foreground: "hsl(var(--color-text-primary) / <alpha-value>)",
        },

        /* Muted text/elements */
        muted: {
          DEFAULT: "hsl(var(--color-bg-secondary) / <alpha-value>)",
          foreground: "hsl(var(--color-text-muted) / <alpha-value>)",
        },

        /* Accent variants */
        accent: {
          DEFAULT: "hsl(var(--color-accent-secondary) / <alpha-value>)",
          foreground: "hsl(0 0% 100% / <alpha-value>)",
          success: "hsl(var(--color-accent-success) / <alpha-value>)",
          warning: "hsl(var(--color-accent-warning) / <alpha-value>)",
          danger: "hsl(var(--color-accent-danger) / <alpha-value>)",
        },

        /* Destructive state */
        destructive: {
          DEFAULT: "hsl(var(--color-accent-danger) / <alpha-value>)",
          foreground: "hsl(0 0% 98% / <alpha-value>)",
        },

        /* Borders */
        border: "hsl(var(--color-border) / <alpha-value>)",
        input: "hsl(var(--color-border) / <alpha-value>)",
        ring: "hsl(var(--color-accent-primary) / <alpha-value>)",
      },

      /* ─── V3 Typography System ─── */
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        display: [
          "Plus Jakarta Sans",
          "Inter",
          "ui-sans-serif",
          "sans-serif",
        ],
      },

      fontSize: {
        /* Fluid responsive typography using clamp() */
        "fluid-xs": ["clamp(0.7rem, 0.65rem + 0.25vw, 0.75rem)", { lineHeight: "1.5" }],
        "fluid-sm": ["clamp(0.8rem, 0.75rem + 0.3vw, 0.875rem)", { lineHeight: "1.5" }],
        "fluid-base": ["clamp(0.9rem, 0.85rem + 0.3vw, 1rem)", { lineHeight: "1.6" }],
        "fluid-lg": ["clamp(1.05rem, 1rem + 0.35vw, 1.125rem)", { lineHeight: "1.5" }],
        "fluid-xl": ["clamp(1.15rem, 1.05rem + 0.5vw, 1.25rem)", { lineHeight: "1.4" }],
        "fluid-2xl": ["clamp(1.4rem, 1.2rem + 1vw, 1.5rem)", { lineHeight: "1.3" }],
        "fluid-3xl": ["clamp(1.7rem, 1.4rem + 1.5vw, 1.875rem)", { lineHeight: "1.2" }],
        "fluid-4xl": ["clamp(2rem, 1.5rem + 2.5vw, 2.25rem)", { lineHeight: "1.15" }],
        "fluid-hero": ["clamp(2.5rem, 1.8rem + 3.5vw, 3.75rem)", { lineHeight: "1.1" }],
      },

      /* ─── V3 Border Radius ─── */
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
        lg: "0.75rem",
        md: "0.5rem",
        sm: "0.375rem",
      },

      /* ─── V3 Spacing Additions ─── */
      spacing: {
        18: "4.5rem",
        22: "5.5rem",
        26: "6.5rem",
        30: "7.5rem",
      },

      /* ─── V3 Box Shadows — Subtle depth + brand glow ─── */
      boxShadow: {
        "glow-sm": "0 0 10px hsl(var(--color-accent-primary) / 0.1)",
        "glow-md": "0 0 20px hsl(var(--color-accent-primary) / 0.15)",
        "glow-lg": "0 0 30px hsl(var(--color-accent-primary) / 0.2)",
        "glow-accent": "0 0 20px hsl(var(--color-accent-secondary) / 0.15)",
        "elevated": "0 4px 12px hsl(0 0% 0% / 0.2)",
        "elevated-lg": "0 8px 24px hsl(0 0% 0% / 0.25)",
        "inner-glow": "inset 0 1px 0 0 hsl(0 0% 100% / 0.05)",
      },

      /* ─── V3 Animation & Motion ─── */
      transitionTimingFunction: {
        "out-expo": "cubic-bezier(0.16, 1, 0.3, 1)",
        "out-quart": "cubic-bezier(0.25, 1, 0.5, 1)",
        "in-out-smooth": "cubic-bezier(0.65, 0, 0.35, 1)",
      },

      transitionDuration: {
        "250": "250ms",
        "400": "400ms",
        "600": "600ms",
      },

      keyframes: {
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in-down": {
          "0%": { opacity: "0", transform: "translateY(-12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "slide-in-right": {
          "0%": { opacity: "0", transform: "translateX(16px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "slide-in-left": {
          "0%": { opacity: "0", transform: "translateX(-16px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 8px hsl(var(--color-accent-primary) / 0.2)" },
          "50%": { boxShadow: "0 0 20px hsl(var(--color-accent-primary) / 0.4)" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },

      animation: {
        "fade-in": "fade-in 0.4s ease-out",
        "fade-in-up": "fade-in-up 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
        "fade-in-down": "fade-in-down 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
        "scale-in": "scale-in 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        "slide-in-right": "slide-in-right 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
        "slide-in-left": "slide-in-left 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
        "float": "float 6s ease-in-out infinite",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "shimmer": "shimmer 1.8s ease-in-out infinite",
      },

      /* ─── V3 Backdrop Blur ─── */
      backdropBlur: {
        xs: "2px",
        "3xl": "64px",
      },
    },
  },
  plugins: [],
};
