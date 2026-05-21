/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#09090b", // Deep dark background (zinc-950)
        foreground: "#fafafa", // Light text (zinc-50)
        card: "#18181b",       // Card background (zinc-900)
        cardForeground: "#fafafa",
        popover: "#18181b",
        popoverForeground: "#fafafa",
        primary: "#3b82f6",    // Blue 500
        primaryForeground: "#ffffff",
        secondary: "#27272a",  // Zinc 800
        secondaryForeground: "#fafafa",
        muted: "#27272a",
        mutedForeground: "#a1a1aa", // Zinc 400
        accent: "#27272a",
        accentForeground: "#fafafa",
        destructive: "#ef4444", // Red 500
        destructiveForeground: "#fafafa",
        border: "#27272a",     // Zinc 800
        input: "#27272a",
        ring: "#3b82f6",
      },
      borderRadius: {
        lg: "0.5rem",
        md: "0.375rem",
        sm: "0.25rem",
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
