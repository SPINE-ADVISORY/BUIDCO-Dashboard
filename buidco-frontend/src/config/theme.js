/**
 * Design System - Color Tokens & Theme Configuration
 * Extracted from the original dashboard design system
 */

export const COLORS = {
  // Background & Surface
  bg: "#F4F6FB",
  surface: "#FFFFFF",
  surfaceAlt: "#F8F9FC",
  
  // Borders
  border: "#E2E6EF",
  borderStrong: "#CBD2E0",
  
  // Primary Navy
  navy: "#0D2137",
  navyMid: "#1B3A5C",
  
  // Status & Semantic Colors
  blue: "#1A5CFF",
  blueSoft: "#EEF3FF",
  teal: "#0891B2",
  tealSoft: "#EFF9FB",
  green: "#0A7540",
  greenSoft: "#EDFAF3",
  amber: "#B45309",
  amberSoft: "#FEF7EC",
  red: "#C0392B",
  redSoft: "#FEF0EF",
  orange: "#C2530B",
  orangeSoft: "#FEF3EE",
  purple: "#5B21B6",
  purpleSoft: "#F3EFFE",
  
  // Text
  text1: "#0D2137",
  text2: "#374151",
  text3: "#6B7280",
  text4: "#9CA3AF",
  white: "#FFFFFF"
};

export const PHASE_COLORS = {
  Conceptualization: COLORS.purple,
  "Pre-Tender": COLORS.blue,
  Tender: COLORS.teal,
  "Post-Tender": "#0E7490",
  Construction: COLORS.amber,
  "O&M": COLORS.green,
  Completed: COLORS.text3
};

export const SEVERITY_COLORS = {
  CRITICAL: COLORS.red,
  HIGH: COLORS.orange,
  MEDIUM: COLORS.amber,
  LOW: COLORS.text3
};

export const THEME = {
  fonts: {
    primary: "'DM Sans', 'Segoe UI', sans-serif",
    serif: "'DM Serif Display', Georgia, serif",
    mono: "'DM Mono', monospace"
  },
  spacing: {
    xs: "4px",
    sm: "8px",
    md: "12px",
    lg: "16px",
    xl: "20px",
    "2xl": "24px",
    "3xl": "28px",
    "4xl": "32px"
  },
  radius: {
    sm: "6px",
    md: "8px",
    lg: "10px",
    xl: "12px",
    "2xl": "14px",
    full: "9999px"
  },
  shadows: {
    xs: "0 1px 3px rgba(13,33,55,.05)",
    sm: "0 1px 4px rgba(13,33,55,.06)",
    md: "0 6px 20px rgba(13,33,55,.12)",
    lg: "0 8px 24px rgba(13,33,55,.15)",
    xl: "0 12px 32px rgba(13,33,55,.15)",
    "2xl": "0 24px 64px rgba(13,33,55,.2)"
  }
};

export default {
  COLORS,
  PHASE_COLORS,
  SEVERITY_COLORS,
  THEME
};
