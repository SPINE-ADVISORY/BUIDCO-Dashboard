/**
 * Utility Functions - Formatting & Helpers
 */

import { COLORS } from "../config/theme";

/**
 * Format currency in Crores with Indian locale
 */
export const formatCrores = (value) => {
  const cr = value / 100;
  return (
    "₹\u2009" +
    cr.toLocaleString("en-IN", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }) +
    "\u2009Cr"
  );
};

/**
 * Format currency in Lakhs with Indian locale
 */
export const formatLakhs = (value) => {
  return (
    "₹\u2009" +
    Number(value).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }) +
    "\u2009L"
  );
};

/**
 * Format currency in Lakhs (integer) with Indian locale
 */
export const formatLakhsInt = (value) => {
  return (
    "₹\u2009" + Number(value).toLocaleString("en-IN") + "\u2009L"
  );
};

/**
 * Get color based on percentage (Green >= 75%, Amber >= 50%, Red < 50%)
 */
export const getPercentageColor = (value) => {
  if (value >= 75) return COLORS.green;
  if (value >= 50) return COLORS.amber;
  return COLORS.red;
};

/**
 * Get background color based on percentage
 */
export const getPercentageBgColor = (value) => {
  if (value >= 75) return COLORS.greenSoft;
  if (value >= 50) return COLORS.amberSoft;
  return COLORS.redSoft;
};

/**
 * Get status badge styling
 */
export const getStatusStyle = (status) => {
  const styles = {
    STALLED: { bg: COLORS.redSoft, color: COLORS.red },
    IN_PROGRESS: { bg: COLORS.blueSoft, color: COLORS.blue },
    COMPLETED: { bg: COLORS.greenSoft, color: COLORS.green },
    TENDERING: { bg: COLORS.blueSoft, color: COLORS.blue },
    DPR_STAGE: { bg: COLORS.amberSoft, color: COLORS.amber }
  };
  return styles[status] || { bg: COLORS.surfaceAlt, color: COLORS.text3 };
};

/**
 * Format date string
 */
export const formatDate = (dateString) => {
  if (!dateString) return "—";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
};

/**
 * Calculate days difference
 */
export const getDaysDifference = (date1String, date2String) => {
  if (!date1String || !date2String) return 0;
  const date1 = new Date(date1String);
  const date2 = new Date(date2String);
  const diffTime = Math.abs(date2 - date1);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Get current time in HH:MM:SS format
 */
export const getCurrentTimeString = () => {
  return new Date().toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
};

/**
 * Get current date in formatted string
 */
export const getCurrentDateString = () => {
  return new Date().toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric"
  });
};

/**
 * Truncate text to specified length
 */
export const truncateText = (text, length = 50) => {
  if (!text) return "";
  return text.length > length ? text.substring(0, length) + "..." : text;
};

/**
 * Search filter across multiple fields
 */
export const searchProjects = (projects, query, fields = []) => {
  if (!query || query.length <= 1) return [];
  const lowerQuery = query.toLowerCase();
  return projects.filter(project =>
    fields.some(field =>
      String(project[field] || "")
        .toLowerCase()
        .includes(lowerQuery)
    )
  );
};

/**
 * Filter projects by object criteria
 */
export const filterProjects = (projects, filters) => {
  return projects.filter(project =>
    Object.entries(filters).every(
      ([key, value]) =>
        !value || value === "ALL" || String(project[key] || "") === String(value)
    )
  );
};

/**
 * Sort array by field
 */
export const sortBy = (array, field, direction = "asc") => {
  return [...array].sort((a, b) => {
    const aVal = a[field] ?? "";
    const bVal = b[field] ?? "";
    const comparison =
      typeof aVal === "number"
        ? aVal - bVal
        : String(aVal).localeCompare(String(bVal));
    return direction === "asc" ? comparison : -comparison;
  });
};

/**
 * Group array by field
 */
export const groupBy = (array, field) => {
  return array.reduce((groups, item) => {
    const key = item[field];
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
    return groups;
  }, {});
};

/**
 * Calculate aggregate statistics
 */
export const calculateAggregates = (projects) => {
  const totalCost = projects.reduce((sum, p) => sum + p.current_sanctioned_cost, 0);
  const totalSpent = projects.reduce(
    (sum, p) => sum + (p.current_sanctioned_cost * p.financial_progress_pct) / 100,
    0
  );
  const finPct = Math.round((totalSpent / totalCost) * 100) || 0;
  const delayedCount = projects.filter(p => p.delay_days > 0).length;

  return {
    totalCost,
    totalSpent,
    finPct,
    delayedCount
  };
};

/** Dashboard-compatible aliases (same behavior as format* / getPercentage* helpers) */
export const fmtCr = formatCrores;
export const fmtLakh = formatLakhs;
export const fmtLakhInt = formatLakhsInt;
export const pctColor = getPercentageColor;
export const pctBg = getPercentageBgColor;
