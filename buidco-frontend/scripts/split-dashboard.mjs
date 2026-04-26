import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

/** Full single-file dashboard (e.g. copy of repo-root BuidcoDashboard_v5.jsx) used only by this script */
const dashPath = path.join(root, "scripts/dashboard-split-source.jsx");
const s = fs.readFileSync(dashPath, "utf8").split(/\r?\n/);

// --- buidcoMockData.js ---
const rawPath = path.join(root, "scripts/buidcoMockData-raw.js");
const raw = fs.readFileSync(rawPath, "utf8").split(/\r?\n/);
const withoutDup = [...raw.slice(0, 14), ...raw.slice(29)].join("\n");

const header = `export {
  PROJECT_PHASES,
  ACTIVE_TENDER_PHASES,
  ROLE_PERMISSIONS,
  DISTRICTS,
} from "../config/constants.js";

`;

let body = withoutDup
  .replace(/^const SECTORS/m, "export const SECTORS")
  .replace(
    /^let _nextId = 76;/m,
    "let _nextId = 76;\nexport function takeNextProjectId() { return _nextId++; }"
  )
  .replace(/^const PROJECTS_INIT/m, "export const PROJECTS_INIT")
  .replace(/^const COS_EOT_DATA/m, "export const COS_EOT_DATA")
  .replace(/^const projVariation/m, "export const projVariation")
  .replace(/^const MANAGEMENT_FLAGS/m, "export const MANAGEMENT_FLAGS");

fs.writeFileSync(path.join(root, "src/data/buidcoMockData.js"), header + body, "utf8");

// --- DashboardPrimitives.jsx (lines 182-240, 1-based: 181-239 zero-based) ---
const primLines = s.slice(181, 240);
const primBody = primLines
  .join("\n")
  .replace(/^const Bar2/m, "export const Bar2")
  .replace(/^const Badge/m, "export const Badge")
  .replace(/^const Pill/m, "export const Pill")
  .replace(/^const Logo/m, "export const Logo")
  .replace(/^const KpiCard/m, "export const KpiCard")
  .replace(/^const Modal/m, "export const Modal");

const primFile = `import { COLORS as C } from "../../config/theme";
import { getPercentageColor as pctColor } from "../../utils/formatters";

${primBody}
`;

fs.mkdirSync(path.join(root, "src/components/dashboard"), { recursive: true });
fs.writeFileSync(
  path.join(root, "src/components/dashboard/DashboardPrimitives.jsx"),
  primFile,
  "utf8"
);

// --- TableHeader.jsx TH ---
const thLines = s.slice(241, 287);
fs.writeFileSync(
  path.join(root, "src/components/dashboard/TableHeader.jsx"),
  `import { useState, useEffect, useRef } from "react";
import { COLORS as C } from "../../config/theme";

${thLines.join("\n").replace(/^function TH/m, "export function TH")}
`,
  "utf8"
);

// --- useTableControls: skip (use hooks) ---

// --- ModalFilterRow ---
const mfrLines = s.slice(311, 339);
fs.writeFileSync(
  path.join(root, "src/components/dashboard/ModalFilterRow.jsx"),
  `import { COLORS as C } from "../../config/theme";

${mfrLines.join("\n").replace(/^function ModalFilterRow/m, "export function ModalFilterRow")}
`,
  "utf8"
);

// --- ProjectsTable ---
const ptLines = s.slice(340, 406);
fs.writeFileSync(
  path.join(root, "src/components/dashboard/ProjectsTable.jsx"),
  `import { COLORS as C } from "../../config/theme";
import { PHASE_COLORS as PHASE_COLOR } from "../../config/theme";
import { fmtCr, pctColor } from "../../utils/formatters";
import { PROJECT_PHASES } from "../../config/constants";
import { PROJECTS_INIT } from "../../data/buidcoMockData";
import { Bar2, Badge, Pill } from "./DashboardPrimitives";
import { TH } from "./TableHeader";

${ptLines.join("\n").replace(/^function ProjectsTable/m, "export function ProjectsTable")}
`,
  "utf8"
);

// Fix ProjectsTable - SEV_COLOR not used in ProjectsTable - remove if unused. Actually I imported SEV_COLOR by mistake - ProjectsTable doesn't use SEV_COLOR. Remove it.

// --- ProjectDetail ---
const pdLines = s.slice(407, 477);
fs.writeFileSync(
  path.join(root, "src/components/dashboard/ProjectDetail.jsx"),
  `import { COLORS as C } from "../../config/theme";
import { PHASE_COLORS as PHASE_COLOR } from "../../config/theme";
import { fmtCr, pctColor } from "../../utils/formatters";
import { COS_EOT_DATA, projVariation } from "../../data/buidcoMockData";
import { Badge, Pill } from "./DashboardPrimitives";

${pdLines.join("\n").replace(/^function ProjectDetail/m, "export function ProjectDetail")}
`,
  "utf8"
);

// --- Main BuidcoDashboard.jsx (lines 480–1372) ---
const mainLines = s.slice(479, 1372);
let mainText = mainLines.join("\n");
mainText = mainText.replace(/^\s*const DONUT_COLORS = \[[^\]]+\];\r?\n/m, "");
mainText = mainText.replace(/project_id:_nextId\+\+/g, "project_id:takeNextProjectId()");
mainText = mainText.replace(
  /const \[tick, setTick\]/g,
  "const [, setTick]"
);

const mainImports = `import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { COLORS as C, PHASE_COLORS as PHASE_COLOR, SEVERITY_COLORS as SEV_COLOR } from "../../config/theme";
import {
  DONUT_COLORS,
  PROJECT_PHASES,
  ACTIVE_TENDER_PHASES,
  ROLE_PERMISSIONS,
  DISTRICTS,
} from "../../config/constants";
import { fmtCr, fmtLakhInt, pctColor } from "../../utils/formatters";
import {
  SECTORS,
  PROJECTS_INIT,
  COS_EOT_DATA,
  projVariation,
  MANAGEMENT_FLAGS,
  takeNextProjectId,
} from "../../data/buidcoMockData";
import { useTableControls } from "../../hooks/useTableControls";
import { Bar2, Badge, Pill, Logo, KpiCard, Modal } from "./DashboardPrimitives";
import { ModalFilterRow } from "./ModalFilterRow";
import { ProjectsTable } from "./ProjectsTable";
import { ProjectDetail } from "./ProjectDetail";

`;

fs.writeFileSync(
  path.join(root, "src/components/dashboard/BuidcoDashboard.jsx"),
  mainImports + mainText,
  "utf8"
);

console.log("split-dashboard.mjs done");
