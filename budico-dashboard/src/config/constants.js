/**
 * Application Constants
 */

export const PROJECT_PHASES = [
  "Conceptualization",
  "Pre-Tender",
  "Tender",
  "Post-Tender",
  "Construction",
  "O&M",
  "Completed"
];

export const ACTIVE_TENDER_PHASES = [
  "Conceptualization",
  "Pre-Tender",
  "Tender",
  "Post-Tender"
];

export const ROLE_PERMISSIONS = {
  MD: { can_edit: true, can_add: true },
  DC: { can_edit: false, can_add: false },
  PMU_ENGINEER: { can_edit: true, can_add: false },
  FINANCE: { can_edit: false, can_add: false },
  READ_ONLY: { can_edit: false, can_add: false }
};

export const DISTRICTS = [
  "Patna", "Muzaffarpur", "Gaya", "Bhagalpur", "Darbhanga", "Begusarai",
  "Purnia", "Ara", "Samastipur", "Munger", "Chapra", "Sitamarhi",
  "Madhubani", "Supaul", "Saharsa"
];

export const PROJECT_STATUSES = [
  "DPR_STAGE",
  "TENDERING",
  "IN_PROGRESS",
  "STALLED",
  "COMPLETED"
];

export const STATUS_LABELS = {
  DPR_STAGE: "DPR Stage",
  TENDERING: "Tendering",
  IN_PROGRESS: "In Progress",
  STALLED: "Stalled",
  COMPLETED: "Completed"
};

export const DONUT_COLORS = [
  "#1A5CFF",
  "#C2530B",
  "#0A7540",
  "#5B21B6",
  "#C0392B",
  "#0891B2",
  "#B45309",
  "#0D2137",
  "#7C3AED"
];

export const CoS_CATEGORIES = [
  "SCOPE ADDITION",
  "DESIGN CHANGE",
  "QTY VARIATION",
  "FORCE MAJEURE",
  "COURT ORDER"
];

export const SEVERITY_LEVELS = [
  "CRITICAL",
  "HIGH",
  "MEDIUM",
  "LOW"
];
