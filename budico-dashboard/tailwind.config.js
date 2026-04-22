/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary
        navy: {
          50: "#f7f9fc",
          600: "#1B3A5C",
          700: "#0D2137",
          800: "#091a28",
        },
        // Status
        blue: "#1A5CFF",
        teal: "#0891B2",
        green: "#0A7540",
        amber: "#B45309",
        red: "#C0392B",
        orange: "#C2530B",
        purple: "#5B21B6",
      },
      fontFamily: {
        sans: ["'DM Sans'", "'Segoe UI'", "sans-serif"],
        serif: ["'DM Serif Display'", "Georgia", "serif"],
        mono: ["'DM Mono'", "monospace"],
      },
      boxShadow: {
        xs: "0 1px 3px rgba(13,33,55,0.05)",
        sm: "0 1px 4px rgba(13,33,55,0.06)",
        md: "0 6px 20px rgba(13,33,55,0.12)",
        lg: "0 8px 24px rgba(13,33,55,0.15)",
        xl: "0 12px 32px rgba(13,33,55,0.15)",
        "2xl": "0 24px 64px rgba(13,33,55,0.2)",
      },
      borderRadius: {
        DEFAULT: "8px",
      },
    },
  },
  plugins: [],
};
