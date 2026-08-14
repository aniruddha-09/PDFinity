/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0a0a0a",
        foreground: "#141414",
        muted: "#1f1f1f",
        border: "#2a2a2a",
        "border-light": "#333333",
        "border-dark": "#1a1a1a",
        accent: {
          DEFAULT: "#facc15", // Electric Yellow
          hover: "#eab308",
          dark: "#ca8a04",
          light: "#fef08a",
          glow: "rgba(250, 204, 21, 0.4)",
        },
        surface: {
          50: "#0d0d0d",
          100: "#121212",
          200: "#181818",
          300: "#222222",
          400: "#2a2a2a",
          500: "#333333",
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["JetBrains Mono", "Roboto Mono", "monospace"],
      },
      boxShadow: {
        card: "8px 8px 16px rgba(0, 0, 0, 0.5), -2px -2px 8px rgba(255, 255, 255, 0.03)",
        floating: "12px 12px 24px rgba(0, 0, 0, 0.6), -4px -4px 12px rgba(255, 255, 255, 0.03)",
        pressed: "inset 6px 6px 12px rgba(0, 0, 0, 0.5), inset -2px -2px 6px rgba(255, 255, 255, 0.05)",
        recessed: "inset 4px 4px 8px rgba(0, 0, 0, 0.6), inset -2px -2px 4px rgba(255, 255, 255, 0.05)",
        sharp: "4px 4px 8px rgba(0, 0, 0, 0.4), -1px -1px 1px rgba(255, 255, 255, 0.05)",
        "glow-yellow": "0 0 16px 2px rgba(250, 204, 21, 0.45)",
      },
      borderRadius: {
        xl: "16px",
        "2xl": "20px",
        "3xl": "24px",
      },
      transitionTimingFunction: {
        mechanical: "cubic-bezier(0.175, 0.885, 0.32, 1.275)",
      },
    },
  },
  plugins: [],
};
