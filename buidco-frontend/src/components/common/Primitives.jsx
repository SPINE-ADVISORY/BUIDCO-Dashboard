/**
 * Primitive Components - Small reusable UI components
 */

import React from "react";
import { COLORS, THEME } from "../config/theme";

/**
 * Progress Bar Component
 */
export const ProgressBar = ({ value, color, backgroundColor = "#E8EBF2" }) => (
  <div
    style={{
      background: backgroundColor,
      borderRadius: 3,
      height: 5,
      overflow: "hidden",
      width: "100%",
      minWidth: 60
    }}
  >
    <div
      style={{
        width: `${Math.min(value, 100)}%`,
        height: "100%",
        background: color,
        borderRadius: 3,
        transition: "width .5s"
      }}
    />
  </div>
);

/**
 * Badge Component - Small label with background
 */
export const Badge = ({
  children,
  color = COLORS.text3,
  icon = null
}) => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 3,
      background: color + "18",
      color,
      border: `1px solid ${color}30`,
      borderRadius: 4,
      padding: "2px 8px",
      fontSize: 11,
      fontWeight: 600,
      whiteSpace: "nowrap",
      letterSpacing: ".02em"
    }}
  >
    {icon && <span style={{ marginRight: 2 }}>{icon}</span>}
    {children}
  </span>
);

/**
 * Pill Component - Rounded badge
 */
export const Pill = ({ children, color, icon = null }) => (
  <span
    style={{
      background: color + "15",
      color,
      border: `1px solid ${color}30`,
      borderRadius: 20,
      padding: "3px 10px",
      fontSize: 11,
      fontWeight: 700,
      whiteSpace: "nowrap",
      display: "inline-flex",
      alignItems: "center",
      gap: 4
    }}
  >
    {icon && <span>{icon}</span>}
    {children}
  </span>
);

/**
 * Logo Component
 */
export const Logo = ({ size = 38 }) => (
  <svg width={size} height={size} viewBox="0 0 38 38" fill="none">
    <rect width="38" height="38" rx="9" fill={COLORS.navy} />
    <rect x="7" y="18" width="9" height="13" rx="1" fill="white" fillOpacity=".95" />
    <rect x="9" y="13" width="5" height="5" rx=".5" fill="white" fillOpacity=".7" />
    <rect x="17" y="22" width="5" height="9" rx="1" fill="white" fillOpacity=".95" />
    <rect x="23" y="15" width="8" height="16" rx="1" fill="white" fillOpacity=".95" />
    <rect x="25" y="10" width="4" height="5" rx=".5" fill="white" fillOpacity=".7" />
    <polygon points="25,10 27,7 29,10" fill="white" fillOpacity=".9" />
    <rect x="5" y="31" width="28" height="1.5" rx=".5" fill="white" fillOpacity=".4" />
  </svg>
);

/**
 * KPI Card Component - Key Performance Indicator display
 */
export const KpiCard = ({
  label,
  value,
  sub,
  accent,
  icon,
  onClick,
  badge
}) => (
  <div
    onClick={onClick}
    style={{
      background: COLORS.surface,
      border: `1px solid ${COLORS.border}`,
      borderTop: `3px solid ${accent}`,
      borderRadius: 10,
      padding: "18px 20px",
      cursor: onClick ? "pointer" : "default",
      transition: "all .18s",
      position: "relative",
      boxShadow: THEME.shadows.xs
    }}
    onMouseEnter={e => {
      if (onClick) {
        e.currentTarget.style.boxShadow = THEME.shadows.md;
        e.currentTarget.style.transform = "translateY(-2px)";
      }
    }}
    onMouseLeave={e => {
      e.currentTarget.style.boxShadow = THEME.shadows.xs;
      e.currentTarget.style.transform = "translateY(0)";
    }}
  >
    {badge && (
      <div
        style={{
          position: "absolute",
          top: 14,
          right: 14,
          background: COLORS.red,
          color: "white",
          fontSize: 9,
          fontWeight: 700,
          borderRadius: 10,
          padding: "2px 7px",
          letterSpacing: ".04em"
        }}
      >
        {badge}
      </div>
    )}
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
      <div>
        <div
          style={{
            fontSize: 11,
            color: COLORS.text3,
            fontWeight: 600,
            letterSpacing: ".06em",
            textTransform: "uppercase",
            marginBottom: 8
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontSize: 26,
            fontWeight: 700,
            color: COLORS.text1,
            lineHeight: 1,
            fontFamily: THEME.fonts.serif
          }}
        >
          {value}
        </div>
        {sub && (
          <div style={{ fontSize: 11, color: COLORS.text3, marginTop: 5 }}>
            {sub}
          </div>
        )}
      </div>
      <div style={{ fontSize: 26, opacity: 0.15, marginTop: 2 }}>
        {icon}
      </div>
    </div>
    {onClick && (
      <div
        style={{
          marginTop: 10,
          fontSize: 10,
          color: accent,
          fontWeight: 600,
          letterSpacing: ".04em"
        }}
      >
        VIEW DETAILS →
      </div>
    )}
  </div>
);

/**
 * Modal Component - Overlay dialog
 */
export const Modal = ({
  title,
  subtitle,
  onClose,
  children,
  width = 940
}) => (
  <div
    style={{
      position: "fixed",
      inset: 0,
      background: "rgba(13,33,55,.45)",
      zIndex: 1000,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 24
    }}
    onClick={onClose}
  >
    <div
      style={{
        background: COLORS.surface,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 14,
        width: "100%",
        maxWidth: width,
        maxHeight: "90vh",
        overflow: "auto",
        boxShadow: THEME.shadows["2xl"]
      }}
      onClick={e => e.stopPropagation()}
    >
      <div
        style={{
          padding: "20px 28px",
          borderBottom: `1px solid ${COLORS.border}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          position: "sticky",
          top: 0,
          background: COLORS.surface,
          zIndex: 10
        }}
      >
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.text1 }}>
            {title}
          </div>
          {subtitle && (
            <div style={{ fontSize: 12, color: COLORS.text3, marginTop: 3 }}>
              {subtitle}
            </div>
          )}
        </div>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: `1px solid ${COLORS.border}`,
            color: COLORS.text3,
            borderRadius: 6,
            padding: "5px 14px",
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 600,
            marginLeft: 20
          }}
        >
          Close ✕
        </button>
      </div>
      <div style={{ padding: "20px 28px" }}>
        {children}
      </div>
    </div>
  </div>
);

/**
 * Button Component - Primary style
 */
export const Button = ({
  children,
  onClick,
  variant = "primary",
  className = ""
}) => {
  const variants = {
    primary: {
      background: COLORS.navy,
      color: "white",
      border: "none",
      borderRadius: 8,
      padding: "9px 20px",
      fontSize: 13,
      fontWeight: 600
    },
    ghost: {
      background: "none",
      color: COLORS.text2,
      border: `1px solid ${COLORS.border}`,
      borderRadius: 7,
      padding: "6px 14px",
      fontSize: 12,
      fontWeight: 500
    }
  };

  return (
    <button
      onClick={onClick}
      style={{
        ...variants[variant],
        cursor: "pointer",
        fontFamily: THEME.fonts.primary,
        transition: "all .15s"
      }}
      className={className}
    >
      {children}
    </button>
  );
};

/**
 * Status Indicator - Colored circle
 */
export const StatusIndicator = ({ status, online = true }) => (
  <div
    style={{
      width: 8,
      height: 8,
      borderRadius: "50%",
      background: online ? COLORS.green : COLORS.text4,
      flexShrink: 0
    }}
  />
);

/**
 * Divider Component
 */
export const Divider = ({ vertical = false, spacing = "md" }) => {
  const spacingMap = { sm: 8, md: 12, lg: 16 };
  return vertical ? (
    <div
      style={{
        width: 1,
        height: spacingMap[spacing],
        background: COLORS.border,
        margin: `0 ${spacingMap[spacing]}px`
      }}
    />
  ) : (
    <div
      style={{
        height: 1,
        background: COLORS.border,
        margin: `${spacingMap[spacing]}px 0`
      }}
    />
  );
};
