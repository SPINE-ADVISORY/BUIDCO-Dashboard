/* eslint-disable react/prop-types */
import { useState, useEffect, useRef, useMemo } from "react";
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
import { takeNextProjectId } from "../../data/buidcoMockData";
import { useBuidcoDashboardData } from "../../hooks/useBuidcoDashboardData";
import { useTableControls } from "../../hooks/useTableControls";
import { Bar2, Badge, Pill, Logo, KpiCard, Modal } from "./DashboardPrimitives";
import { ModalFilterRow } from "./ModalFilterRow";
import { ProjectsTable } from "./ProjectsTable";
import { ProjectDetail } from "./ProjectDetail";
import {
  createProject,
  updateProject,
  createCosEot,
  updateCosEot,
  deleteCosEot,
} from "../../api/buidcoApi";
import { mapApiProjectRow, mapCosTimelineRow } from "../../utils/mapApiProject";

// Sector codes considered “Tender Works” in v26 overview
const CONSTRUCTION_SECTOR_CODES = [
  "WATER",
  "SEW",
  "DRAIN",
  "SWM",
  "TRAN",
  "HOUSE",
  "RIVER",
  "LIGHT",
  "MARKET",
  "BEAUTY",
  "ROAD",
];

// PSO/PMU consultancy tenders (v26 dataset)
const PSO_PMU_TENDERS = [
  {
    tender_id: "T-PSO-01",
    tender_ref: "BU/PMU/PAT/2025/01",
    tender_name: "Programme Management Consultancy (PMC) — Patna Urban Cluster",
    district: "Patna",
    category: "PMC",
    estimated_cost_lakhs: 420,
    floated_date: "2025-02-10",
    status: "Tender",
    agency_type: "PMU",
  },
  {
    tender_id: "T-PSO-02",
    tender_ref: "BU/PSO/MUZ/2025/02",
    tender_name: "Project Support Office (PSO) Services — North Bihar Division",
    district: "Muzaffarpur",
    category: "PSO",
    estimated_cost_lakhs: 310,
    floated_date: "2025-03-01",
    status: "Pre-Tender",
    agency_type: "PSO",
  },
  {
    tender_id: "T-PSO-03",
    tender_ref: "BU/PMU/GAY/2025/03",
    tender_name: "Third Party Quality Audit & PMU Support — Gaya",
    district: "Gaya",
    category: "QA/PMU",
    estimated_cost_lakhs: 185,
    floated_date: "2025-03-18",
    status: "Tender",
    agency_type: "PMU",
  },
  {
    tender_id: "T-PSO-04",
    tender_ref: "BU/PSO/BHG/2025/04",
    tender_name: "GIS & MIS System Development — BUIDCO HQ",
    district: "Patna",
    category: "IT/MIS",
    estimated_cost_lakhs: 240,
    floated_date: "2025-01-25",
    status: "Tender",
    agency_type: "PSO",
  },
  {
    tender_id: "T-PSO-05",
    tender_ref: "BU/PMU/DSB/2025/05",
    tender_name: "Social Development & Resettlement PMU — Darbhanga",
    district: "Darbhanga",
    category: "Social PMU",
    estimated_cost_lakhs: 128,
    floated_date: "2025-04-02",
    status: "Pre-Tender",
    agency_type: "PMU",
  },
  {
    tender_id: "T-PSO-06",
    tender_ref: "BU/PSO/BGS/2025/06",
    tender_name: "Environment & Safeguard Monitoring Consultancy",
    district: "Begusarai",
    category: "Environment",
    estimated_cost_lakhs: 96,
    floated_date: "2025-02-20",
    status: "Conceptualization",
    agency_type: "PSO",
  },
];

const pctBg        = v => v >= 75 ? C.greenSoft : v >= 50 ? C.amberSoft : C.redSoft;
const fmtLakhToCr  = v => { const cr = v/100; return "₹ " + cr.toLocaleString("en-IN",{minimumFractionDigits:2,maximumFractionDigits:2}) + " Cr"; };

const STAGE_ORDER = [
  "Conceptualization",
  "Pre-Tender",
  "Tender",
  "Post-Tender",
  "Construction",
  "O&M",
  "Completed",
];

// ─── PHASE SUB-ACTIVITIES ─────────────────────────────────────────────────────
const PHASE_ACTIVITIES = {
  "Conceptualization": {
    label: "Phase 1: Conceptualisation & Project Identification",
    activities: [
      { name:"Corridor selection & scheme inclusion",  statusOptions:"Not Started / Approved",  timeline:"1–3 months",   keyDoc:"In-principle approval" },
      { name:"Preliminary traffic & alignment study",  statusOptions:"In Progress / Completed", timeline:"2–4 months",   keyDoc:"Traffic Report" },
      { name:"Rough Order of Cost (RoC)",              statusOptions:"In Progress / Completed", timeline:"—",            keyDoc:"Concept Cost Estimate" },
    ]
  },
  "Pre-Tender": {
    label: "Phase 2 & 3: Feasibility / DPR Preparation & Clearances",
    activities: [
      { name:"Detailed surveys (topo, geo-tech, traffic)",     statusOptions:"In Progress",              timeline:"4–8 months",   keyDoc:"Survey Reports" },
      { name:"EIA & Social Impact Assessment",                 statusOptions:"—",                        timeline:"—",            keyDoc:"Draft EIA" },
      { name:"DPR Preparation by Consultant",                  statusOptions:"Under Review",             timeline:"6–12 months",  keyDoc:"DPR (Vol 1–4)" },
      { name:"DPR Review & Approval by NHAI/MoRTH",           statusOptions:"Approved",                 timeline:"—",            keyDoc:"Approved DPR" },
      { name:"3A/3D/3G Notifications — Land Acquisition",     statusOptions:"3A Issued / 3D Completed", timeline:"6–18+ months", keyDoc:"% Land Acquired (ha)" },
      { name:"Environmental Clearance (MoEFCC)",               statusOptions:"Public Hearing Done",      timeline:"4–12 months",  keyDoc:"Clearance Received (Yes/No)" },
      { name:"Forest & Wildlife Clearance",                    statusOptions:"Stage-I / Stage-II",       timeline:"6–15 months",  keyDoc:"CA Plan Approved" },
      { name:"Utility Shifting Permissions",                   statusOptions:"In Progress",              timeline:"—",            keyDoc:"% Utilities Shifted" },
    ]
  },
  "Tender": {
    label: "Phase 4: Tendering & Bid Process",
    activities: [
      { name:"Bid Document Preparation",          statusOptions:"Draft Ready", timeline:"1–2 months", keyDoc:"RFQ/RFP, Draft Agreement" },
      { name:"Tender Advertisement",              statusOptions:"Floated",     timeline:"—",           keyDoc:"NIT on Portal" },
      { name:"Pre-bid Meeting & Clarifications",  statusOptions:"Completed",   timeline:"—",           keyDoc:"Addendum" },
      { name:"Bid Evaluation & LoA Issue",        statusOptions:"LoA Issued",  timeline:"2–4 months",  keyDoc:"Award Recommendation" },
    ]
  },
  "Post-Tender": {
    label: "Phase 5: Contract Award & Pre-Construction",
    activities: [
      { name:"Contract Agreement Signing",        statusOptions:"Signed",    timeline:"Within 30–60 days", keyDoc:"Agreement + Performance BG" },
      { name:"Appointed Date Declaration",        statusOptions:"Declared",  timeline:"—",                 keyDoc:"Appointed Date Letter" },
      { name:"Design Submission & Approval",      statusOptions:"Approved",  timeline:"2–4 months",        keyDoc:"GAD, Pavement Design" },
      { name:"Mobilization & Site Office Setup",  statusOptions:"Mobilized", timeline:"—",                 keyDoc:"Resource Deployment Report" },
    ]
  },
  "Construction": {
    label: "Phase 6: Construction Execution & Monitoring",
    activities: [
      { name:"Earthwork & Embankment",              statusOptions:"In Progress", timeline:"As per milestone", keyDoc:"Test Reports" },
      { name:"Pavement Layers (GSB, WMM, DBM, BC)", statusOptions:"Completed",   timeline:"—",                keyDoc:"Quality Test Certificates" },
      { name:"Structures (Bridges, Flyovers)",      statusOptions:"In Progress", timeline:"—",                keyDoc:"As-built Drawings" },
      { name:"Road Furniture & Safety Features",    statusOptions:"—",           timeline:"—",                keyDoc:"Safety Audit Report" },
    ]
  },
  "O&M": {
    label: "Phase 7: Completion, Handover & DLP/O&M",
    activities: [
      { name:"Substantial Completion",         statusOptions:"Provisional Certificate", timeline:"—",            keyDoc:"Punch List" },
      { name:"Project Handover",               statusOptions:"Handed Over",             timeline:"—",            keyDoc:"Taking Over Certificate" },
      { name:"Defects Liability Period (DLP)", statusOptions:"In DLP",                  timeline:"12–60 months", keyDoc:"Rectification Reports" },
      { name:"Final Payment & Closure",        statusOptions:"Closed",                  timeline:"—",            keyDoc:"Final Bill / Annuity Schedule" },
    ]
  },
};

const PROJECT_MILESTONE_MAP = {
  2:0, 22:1, 35:2, 43:0, 48:1,
  5:0, 10:2, 31:4, 58:1, 70:3,
  8:1, 13:0, 19:2, 27:1, 32:2, 42:3, 46:1, 54:0, 60:2, 63:1, 75:3,
  29:3, 44:2,
  1:0, 3:2, 4:1, 7:2, 9:3, 11:2, 12:1, 15:2, 16:0, 17:1, 18:2, 20:0,
  21:1, 23:0, 24:1, 26:2, 28:0, 30:1, 33:0, 34:2, 36:0, 37:1,
  38:2, 39:1, 40:0, 45:2, 47:1, 49:2, 56:0, 57:1, 59:2, 61:0, 62:1, 64:2, 65:0, 66:1, 67:2, 68:0, 69:1, 71:2, 72:0, 73:1, 74:2,
  6:1, 14:2, 25:1, 41:2, 50:1, 51:2, 52:0, 53:1,
};

const getProjectMilestone = (p) => {
  const acts = PHASE_ACTIVITIES[p.phase]?.activities;
  if (!acts || acts.length === 0) return null;
  const idx = PROJECT_MILESTONE_MAP[p.project_id];
  const safeIdx = (idx !== undefined && idx < acts.length) ? idx
    : p.actual_physical_pct === 0 ? 0
    : Math.min(Math.floor(p.actual_physical_pct / 100 * acts.length), acts.length - 1);
  return { ...acts[safeIdx], index: safeIdx + 1, total: acts.length };
};

// ─── STAGE MODAL COLUMN FILTER ────────────────────────────────────────────────
function StageColFilter({ label, fKey, opts, stageModalFilters, setStageModalFilters, stageModalSort, setStageModalSort, col }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const active = stageModalFilters[fKey] && stageModalFilters[fKey] !== "ALL";
  const colLight = col + "18";
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const isSorted = stageModalSort.field === fKey;
  return (
    <th ref={ref} style={{padding:"9px 10px",background:active?colLight:C.surfaceAlt,borderBottom:`2px solid ${col}40`,whiteSpace:"nowrap",position:"sticky",top:0,zIndex:6,cursor:"pointer",userSelect:"none"}}>
      <div style={{display:"flex",alignItems:"center",gap:4}}>
        <span
          onClick={() => setStageModalSort(s => ({field:fKey, dir:s.field===fKey&&s.dir==="asc"?"desc":"asc"}))}
          style={{fontSize:10,fontWeight:700,color:active?col:isSorted?C.blue:C.text2,letterSpacing:".04em",textTransform:"uppercase"}}>
          {label}{isSorted ? (stageModalSort.dir==="asc"?"↑":"↓") : ""}
        </span>
        {opts && opts.length > 0 && (
          <span style={{position:"relative"}}>
            <span
              onClick={e => { e.stopPropagation(); setOpen(o => !o); }}
              style={{fontSize:13,color:active?col:C.text4,fontWeight:700,lineHeight:1}}>
              {active ? "▾" : "▿"}
            </span>
            {open && (
              <div style={{position:"absolute",top:"100%",left:0,background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,minWidth:180,maxHeight:240,overflowY:"auto",boxShadow:"0 8px 28px rgba(13,33,55,.18)",zIndex:300,marginTop:4}}>
                {["ALL",...opts].map(opt => (
                  <div key={opt}
                    onClick={e => { e.stopPropagation(); setStageModalFilters(f => ({...f,[fKey]:opt})); setOpen(false); }}
                    style={{padding:"7px 12px",fontSize:11,cursor:"pointer",
                      color:(stageModalFilters[fKey]||"ALL")===opt?col:C.text2,
                      background:(stageModalFilters[fKey]||"ALL")===opt?colLight:"transparent",
                      fontWeight:(stageModalFilters[fKey]||"ALL")===opt?700:400}}>
                    {opt==="ALL"?"All":opt}
                  </div>
                ))}
              </div>
            )}
          </span>
        )}
      </div>
    </th>
  );
}

// ─── FIN SORT HEADER ─────────────────────────────────────────────────────────
function FinSortHdr({ label, field:f, allRows, colState, setColState, sortState, setSortState, style={} }) {
  const active    = sortState.field === f;
  const filterVal = colState?.[f] || "";
  const hasFilter = !!filterVal;
  const opts = useMemo(() => {
    if (!allRows) return [];
    const seen = new Set();
    allRows.forEach(p => {
      const v = p[f];
      if (v === null || v === undefined || v === "" || v === 0) return;
      seen.add(String(v));
    });
    return [...seen].sort((a, b) => {
      const na = Number(a), nb = Number(b);
      if (!isNaN(na) && !isNaN(nb)) return na - nb;
      return a.localeCompare(b);
    });
  }, [allRows, f]);
  return (
    <th style={{padding:0, background:"#F8F9FC", borderBottom:"2px solid #E2E6EF",
      whiteSpace:"nowrap", userSelect:"none", verticalAlign:"top", ...style}}>
      <div
        onClick={() => setSortState(s => ({ field:f, dir: s.field===f && s.dir==="desc" ? "asc" : "desc" }))}
        style={{padding:"8px 12px 4px", cursor:"pointer", display:"flex", alignItems:"center", gap:4,
          fontSize:10, fontWeight:700, color:active?"#1A5CFF":"#374151",
          textTransform:"uppercase", letterSpacing:".05em"}}>
        {label}
        <span style={{fontSize:10, opacity:.7}}>{active ? (sortState.dir==="desc" ? "↓" : "↑") : "⇅"}</span>
      </div>
      {opts.length > 0 && (
        <div style={{padding:"0 8px 6px"}}>
          <select
            value={filterVal}
            onChange={e => setColState(s => ({ ...s, [f]: e.target.value }))}
            onClick={e => e.stopPropagation()}
            style={{width:"100%", fontSize:10, padding:"2px 4px",
              border:`1px solid ${hasFilter ? "#1A5CFF" : "#E2E6EF"}`,
              borderRadius:4,
              background: hasFilter ? "#EEF3FF" : "#FFFFFF",
              color: hasFilter ? "#1A5CFF" : "#6B7280",
              cursor:"pointer", outline:"none", maxWidth:160}}>
            <option value="">All</option>
            {opts.map(o => <option key={o} value={o}>{o.length > 22 ? o.slice(0,20)+"…" : o}</option>)}
          </select>
        </div>
      )}
    </th>
  );
}

function FinClearBtn({ colState, setColState }) {
  const hasAny = Object.values(colState).some(Boolean);
  if (!hasAny) return null;
  return (
    <button
      onClick={() => setColState({})}
      style={{fontSize:10, padding:"3px 10px", borderRadius:5, cursor:"pointer",
        border:"1px solid #C0392B", background:"#FEF0EF", color:"#C0392B",
        fontWeight:600, marginLeft:8}}>
      ✕ Clear Filters
    </button>
  );
}

// ─── MD FIELD — defined OUTSIDE main component so React doesn't remount on every render ─────
function MdField({
  label,
  fkey,
  type = "text",
  options,
  span2 = false,
  readOnly = false,
  form,
  setForm,
}) {
  const val = form[fkey] !== undefined ? form[fkey] : "";
  const handleChange = (e) => {
    const raw = e.target.value;
    setForm((f) => ({ ...f, [fkey]: raw }));
  };
  const base = {
    background: readOnly ? "#F8F9FC" : "#FFFFFF",
    border: `1px solid ${readOnly ? "#E2E6EF" : "#CBD2E0"}`,
    borderRadius: 8,
    color: "#0D2137",
    padding: "9px 12px",
    fontSize: 13,
    fontFamily: "'DM Sans',sans-serif",
    outline: "none",
    width: "100%",
    cursor: readOnly ? "default" : "text",
    WebkitAppearance: "none",
  };
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 5,
        gridColumn: span2 ? "span 2" : undefined,
      }}
    >
      <label
        style={{
          fontSize: 11,
          color: "#6B7280",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: ".05em",
        }}
      >
        {label}
      </label>
      {options ? (
        <select
          value={String(val)}
          onChange={handleChange}
          disabled={readOnly}
          style={{ ...base, cursor: readOnly ? "default" : "pointer" }}
        >
          {options.map((o) => (
            <option key={o.v || o} value={o.v || o}>
              {o.l || o}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          readOnly={readOnly}
          value={val === null || val === undefined ? "" : String(val)}
          onChange={handleChange}
          style={base}
          step={type === "number" ? "any" : undefined}
        />
      )}
    </div>
  );
}

// ─── COS FIELD — for inline CoS/EoT row editing ───────────────────────────────
function CosField({ label, fkey, type = "text", options, row, onChange }) {
  const val = row[fkey] !== undefined ? row[fkey] : "";
  const base = {
    background: "#FFFFFF",
    border: "1px solid #CBD2E0",
    borderRadius: 6,
    color: "#0D2137",
    padding: "7px 10px",
    fontSize: 12,
    fontFamily: "'DM Sans',sans-serif",
    outline: "none",
    width: "100%",
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label
        style={{
          fontSize: 10,
          color: "#6B7280",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: ".05em",
        }}
      >
        {label}
      </label>
      {options ? (
        <select
          value={String(val)}
          onChange={(e) => onChange(fkey, e.target.value)}
          style={{ ...base, cursor: "pointer" }}
        >
          {options.map((o) => (
            <option key={o.v || o} value={o.v || o}>
              {o.l || o}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          value={val === null || val === undefined ? "" : String(val)}
          onChange={(e) => onChange(fkey, e.target.value)}
          style={base}
          step={type === "number" ? "any" : undefined}
        />
      )}
    </div>
  );
}

export default function BuidcoDashboard() {
  const {
    projects,
    setProjects,
    sectorCards,
    managementFlags,
    cosEotRows,
    projVariation,
    loadState,
    loadError,
    apiEnabled,
  } = useBuidcoDashboardData();
  const [activeTab, setActiveTab]           = useState("overview");
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedSector, setSelectedSector]   = useState(null);
  const [, setTick]                       = useState(0);
  const [userRole, setUserRole]               = useState("MD");
  const perms = ROLE_PERMISSIONS[userRole] || ROLE_PERMISSIONS.READ_ONLY;
  const [searchQuery, setSearchQuery]         = useState("");
  const [searchFocus, setSearchFocus]         = useState(false);

  const [showActiveModal, setShowActiveModal]   = useState(false);
  const [showTendersModal, setShowTendersModal] = useState(false);
  const [showServiceTendersModal, setShowServiceTendersModal] = useState(false);
  const [showMonsoonModal, setShowMonsoonModal]       = useState(false);
  const [showExpenditureModal, setShowExpenditureModal] = useState(false);
  const [showFinUtilModal, setShowFinUtilModal]         = useState(false);
  const [finUtilDistSort,   setFinUtilDistSort]         = useState("pct_desc");
  const [finUtilDistSearch, setFinUtilDistSearch]       = useState("");
  const [finUtilSectSort,   setFinUtilSectSort]         = useState("pct_desc");
  const [finUtilSectSearch, setFinUtilSectSearch]       = useState("");
  const [showPhysProgressModal, setShowPhysProgressModal] = useState(false);
  const [physTab,          setPhysTab]          = useState("sector");
  const [physSectSearch,   setPhysSectSearch]   = useState("");
  const [physSectSort,     setPhysSectSort]     = useState("gap_asc");
  const [physSectStatusF,  setPhysSectStatusF]  = useState("ALL");
  const [physSectSelected, setPhysSectSelected] = useState(null);
  const [physDistSearch,   setPhysDistSearch]   = useState("");
  const [physDistStatusF,  setPhysDistStatusF]  = useState("ALL");
  const [physDistSort,     setPhysDistSort]     = useState("gap_asc");
  const [showFinanceModal, setShowFinanceModal] = useState(false);
  const [financeTab,       setFinanceTab]       = useState("payments");
  const [financeSearch,    setFinanceSearch]    = useState("");
  const [financeSortPay,   setFinanceSortPay]   = useState({field:"payments_made_lakhs", dir:"desc"});
  const [financeSortPbg,   setFinanceSortPbg]   = useState({field:"pbg_amount_lakhs",    dir:"desc"});
  const [financeSortEmd,   setFinanceSortEmd]   = useState({field:"emd_amount_lakhs",    dir:"desc"});
  const [financeSortAdv,   setFinanceSortAdv]   = useState({field:"mobilization_advance_lakhs", dir:"desc"});
  const [finColPay,        setFinColPay]        = useState({});
  const [finColPbg,        setFinColPbg]        = useState({});
  const [finColEmd,        setFinColEmd]        = useState({});
  const [finColAdv,        setFinColAdv]        = useState({});
  const [selectedStage, setSelectedStage]               = useState(null);
  const [stageModalFilters, setStageModalFilters]       = useState({});
  const [stageModalSort, setStageModalSort]             = useState({field:"delay_days",dir:"desc"});
  const [projectRemarks, setProjectRemarks]             = useState({});
  const [modalFilters, setModalFilters]                 = useState({});
  const [tenderFilters, setTenderFilters]               = useState({});
  const [mgmtFilters, setMgmtFilters]                   = useState({});
  const [showAddModal, setShowAddModal]         = useState(false);
  const [showEditModal, setShowEditModal]       = useState(false);
  const [editProject, setEditProject]           = useState(null);
  const [editForm, setEditForm]                 = useState({});
  const [addForm, setAddForm]                   = useState({});
  const [saving, setSaving]                     = useState(false);
  const [saveError, setSaveError]               = useState(null);
  const [deletedCosIds, setDeletedCosIds]       = useState([]);

  const [cosProjectFilter, setCosProjectFilter]     = useState("ALL");
  const [cosCategoryFilter, setCosCategoryFilter]   = useState("ALL");
  const [districtFilter, setDistrictFilter]         = useState("ALL");

  // MD Input Sheet state (MD-only UI)
  const [mdInputSearch, setMdInputSearch] = useState("");
  const [mdSectorFilter, setMdSectorFilter] = useState("ALL");
  const [mdInputProject, setMdInputProject] = useState(null);
  const [mdInputForm, setMdInputForm] = useState({});
  const [mdInputSaved, setMdInputSaved] = useState(false);
  const [mdCosData, setMdCosData] = useState(() =>
    (cosEotRows || []).map((c, i) => ({ ...c, _uid: i }))
  );

  const projTable  = useTableControls(projects, ["project_name","project_code","ulb_name","district"]);
  const activeModal= useTableControls(projects, ["project_name","project_code","ulb_name"]);
  const [activeDelayFilter, setActiveDelayFilter] = useState("ALL");

  useEffect(()=>{ const id=setInterval(()=>setTick(t=>t+1),1000); return()=>clearInterval(id); },[]);

  const now     = new Date();
  const timeStr = now.toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",second:"2-digit"});
  const dateStr = now.toLocaleDateString("en-IN",{weekday:"short",day:"numeric",month:"short",year:"numeric"});

  const activeTenderProjects = projects.filter(p=>ACTIVE_TENDER_PHASES.includes(p.phase));
  const tenderWorksProjects  = activeTenderProjects.filter(p=>CONSTRUCTION_SECTOR_CODES.includes(p.sector_code));
  const preMonsoonFlags      = managementFlags.filter(f=>f.is_pre_monsoon);
  const cosCategories        = [...new Set(cosEotRows.map(d=>d.cos_category))];
  const filteredCos = cosEotRows.filter(d=>{
    const pm = cosProjectFilter==="ALL" || d.project_id===parseInt(cosProjectFilter);
    const cm = cosCategoryFilter==="ALL" || d.cos_category===cosCategoryFilter;
    return pm && cm;
  });
  const totalVar = filteredCos.reduce((s,d)=>s+d.cos_amount,0);

  const totalCost  = projects.reduce((a,p)=>a+p.current_sanctioned_cost,0);
  const totalSpent = projects.reduce((a,p)=>a+(p.current_sanctioned_cost*p.financial_progress_pct/100),0);
  const finPct     = totalCost > 0 ? Math.round(totalSpent/totalCost*100) : 0;
  const delayedCount = projects.filter(p=>p.delay_days>0).length;

  // District aggregate
  const districtMap = {};
  projects.forEach(p=>{
    if(!districtMap[p.district]) districtMap[p.district]={name:p.district,total:0,delayed:0,cost:0};
    districtMap[p.district].total++;
    if(p.delay_days>0) districtMap[p.district].delayed++;
    districtMap[p.district].cost += p.current_sanctioned_cost;
  });
  const districts = Object.values(districtMap).sort((a,b)=>b.total-a.total);

  const searchResults = searchQuery.length>1
    ? projects.filter(p=>p.project_name.toLowerCase().includes(searchQuery.toLowerCase())||p.project_code.toLowerCase().includes(searchQuery.toLowerCase())||p.ulb_name.toLowerCase().includes(searchQuery.toLowerCase())||p.district.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  const goToProject = p => { setSearchQuery(""); setActiveTab("projects"); setSelectedSector(null); setSelectedProject(p); };
  const goToSector  = s => { setSelectedSector(s.sector_code); setActiveTab("sectors"); setSelectedProject(null); };

  const displayProjects = selectedSector ? projects.filter(p=>p.sector_code===selectedSector)
    : districtFilter!=="ALL" ? projTable.rows.filter(p=>p.district===districtFilter)
    : projTable.rows;

  const activeModalRows = activeModal.rows.filter(p=>{
    const delayOk = activeDelayFilter==="DELAYED"?p.delay_days>0:true;
    const filterOk = Object.entries(modalFilters).every(([k,v])=>!v||v==="ALL"||String(p[k]||"")===v);
    return delayOk && filterOk;
  });
  const filteredTenderProjects = tenderWorksProjects.filter(p=>
    Object.entries(tenderFilters).every(([k,v])=>!v||v==="ALL"||String(p[k]||"")===v)
  );
  const filteredMgmtFlags = managementFlags.filter(f=>
    Object.entries(mgmtFilters).every(([k,v])=>!v||v==="ALL"||String(f[k]||"")===v)
  );

  const sectorChartData = sectorCards.map(s=>({name:s.sector_icon+" "+s.sector_code,physical:s.avg_physical_pct,financial:s.financial_utilisation_pct}));

  // Status breakdown for donut
  const statusMap = {};
  projects.forEach(p=>{ statusMap[p.status]=(statusMap[p.status]||0)+1; });
  const flagPieData = Object.entries(statusMap).map(([k,v],i)=>({name:k,value:v,color:DONUT_COLORS[i%DONUT_COLORS.length]}));

  const openAddModal = () => {
    if(!perms.can_add){ alert("Access Denied: Only MD can add new projects."); return; }
    setAddForm({sector_code:"WATER",phase:"Conceptualization",status:"DPR_STAGE",district:"Patna",planned_end_date:"2027-12-31"});
    setSaveError(null);
    setShowAddModal(true);
  };
  const saveAdd = async () => {
    if (!addForm.project_name || !addForm.project_code) return alert("Project Code and Name are required.");
    setSaveError(null);
    if (apiEnabled) {
      setSaving(true);
      try {
        const res = await createProject(addForm);
        const newProject = mapApiProjectRow(res.data || res);
        setProjects(prev => [...prev, newProject]);
        setShowAddModal(false);
      } catch (e) {
        setSaveError(e?.message || "Failed to add project. Please try again.");
      } finally {
        setSaving(false);
      }
    } else {
      const sec = sectorCards.find(s => s.sector_code === addForm.sector_code);
      setProjects(prev => [...prev, {
        project_id: takeNextProjectId(),
        sector_name: sec?.sector_name || "",
        sector_icon: sec?.sector_icon || "",
        ulb_name: addForm.ulb_name || addForm.district || "",
        contractor_name: addForm.contractor_name || "TBD",
        financial_progress_pct: 0, actual_physical_pct: 0, scheduled_physical_pct: 0,
        delay_days: 0, revised_end_date: null,
        total_cos_count: 0, total_eot_days: 0,
        delay_reason: null, dept_stuck: null,
        latitude: null, longitude: null, chainage: null,
        ...addForm,
        current_sanctioned_cost: parseFloat(addForm.current_sanctioned_cost) || 0,
        planned_end_date: addForm.planned_end_date || "2027-12-31",
        phase: addForm.phase || "Conceptualization",
        status: addForm.status || "DPR_STAGE",
      }]);
      setShowAddModal(false);
    }
  };
  const saveEdit = async () => {
    setSaveError(null);
    if (apiEnabled) {
      setSaving(true);
      try {
        const res = await updateProject(editProject.project_id, editForm);
        const updated = mapApiProjectRow(res.data || res);
        setProjects(prev => prev.map(p => p.project_id === editProject.project_id ? updated : p));
        setShowEditModal(false);
      } catch (e) {
        setSaveError(e?.message || "Failed to save changes. Please try again.");
      } finally {
        setSaving(false);
      }
    } else {
      setProjects(prev => prev.map(p => p.project_id === editProject.project_id ? { ...p, ...editForm } : p));
      setShowEditModal(false);
    }
  };

  const saveMdInputForm = async () => {
    if (!mdInputProject) return;
    setSaveError(null);
    if (apiEnabled) {
      setSaving(true);
      try {
        const projRes = await updateProject(mdInputProject.project_id, mdInputForm);
        const updated = mapApiProjectRow(projRes.data || projRes);
        setProjects(prev => prev.map(p => p.project_id === mdInputProject.project_id ? updated : p));

        const projCos = mdCosData.filter(c => c.project_id === mdInputProject.project_id);
        await Promise.all([
          ...projCos.map(cos => {
            const { _uid, _isNew, ...payload } = cos;
            if (_isNew || !cos.cos_id) return createCosEot(payload);
            return updateCosEot(cos.cos_id, payload);
          }),
          ...deletedCosIds.map(id => deleteCosEot(id)),
        ]);
        setDeletedCosIds([]);

        setMdInputSaved(true);
        setTimeout(() => setMdInputSaved(false), 2000);
      } catch (e) {
        setSaveError(e?.message || "Failed to save. Please try again.");
      } finally {
        setSaving(false);
      }
    } else {
      setProjects(prev =>
        prev.map(p =>
          p.project_id === mdInputProject.project_id ? { ...p, ...mdInputForm } : p
        )
      );
      setMdInputSaved(true);
      setTimeout(() => setMdInputSaved(false), 1500);
    }
  };

  const tabs = [
    {id:"overview",    label:"Overview"},
    {id:"sectors",     label:"Sectors"},
    {id:"projects",    label:"Projects"},
    {id:"districts",   label:"Districts"},
    {id:"cos_eot",     label:"CoS / EoT"},
    {id:"mgmt_action", label:"Management Action"},
    {id:"md_input",    label:"MD Input Sheet"},
  ];

  const F = ({label,field,type="text",options}) => (
    <div style={{display:"flex",flexDirection:"column",gap:5}}>
      <label style={{fontSize:11,color:C.text3,fontWeight:600,textTransform:"uppercase",letterSpacing:".05em"}}>{label}</label>
      {options?<select value={(showAddModal?addForm:editForm)[field]||""} onChange={e=>{const v=e.target.value;showAddModal?setAddForm(f=>({...f,[field]:v})):setEditForm(f=>({...f,[field]:v}))}}>
        {options.map(o=><option key={o.v||o} value={o.v||o}>{o.l||o}</option>)}
      </select>:<input type={type} value={(showAddModal?addForm:editForm)[field]||""} onChange={e=>{const v=e.target.value;showAddModal?setAddForm(f=>({...f,[field]:v})):setEditForm(f=>({...f,[field]:v}))}}/>}
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:C.bg,color:C.text1,fontFamily:"'DM Sans','Segoe UI',sans-serif"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Serif+Display&family=DM+Mono:wght@400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:5px;height:5px}
        ::-webkit-scrollbar-track{background:${C.bg}}
        ::-webkit-scrollbar-thumb{background:${C.borderStrong};border-radius:4px}
        table{border-collapse:collapse;width:100%}
        td{padding:11px 14px;font-size:13px;color:${C.text2};border-bottom:1px solid ${C.border};vertical-align:middle}
        tr:hover td{background:${C.surfaceAlt}}
        .nav-tab{background:none;border:none;cursor:pointer;padding:8px 16px;border-radius:8px;font-size:13px;font-family:'DM Sans',sans-serif;font-weight:500;transition:all .15s;color:${C.text2}}
        .nav-tab:hover{background:${C.border}}
        .nav-tab.active{background:${C.navy};color:white;font-weight:600}
        .sector-card{cursor:pointer;transition:all .18s;border:1px solid ${C.border};border-radius:12px;padding:20px;background:${C.surface};box-shadow:0 1px 3px rgba(13,33,55,.05)}
        .sector-card:hover{box-shadow:0 8px 24px rgba(13,33,55,.12);transform:translateY(-3px);border-color:${C.blue}44}
        select{background:${C.surface};border:1px solid ${C.border};border-radius:8px;color:${C.text2};padding:8px 12px;font-size:13px;font-family:'DM Sans',sans-serif;outline:none;cursor:pointer}
        select:focus{border-color:${C.blue}}
        input[type=text],input[type=date],input[type=number]{background:${C.surface};border:1px solid ${C.border};border-radius:8px;color:${C.text2};padding:8px 12px;font-size:13px;font-family:'DM Sans',sans-serif;outline:none;width:100%}
        input:focus{border-color:${C.blue};box-shadow:0 0 0 3px ${C.blue}18}
        .btn-ghost{background:none;border:1px solid ${C.border};color:${C.text2};border-radius:7px;padding:6px 14px;cursor:pointer;font-size:12px;font-family:'DM Sans',sans-serif;font-weight:500;transition:all .15s}
        .btn-ghost:hover{border-color:${C.blue};color:${C.blue}}
        .btn-primary{background:${C.navy};border:none;color:white;border-radius:8px;padding:9px 20px;cursor:pointer;font-size:13px;font-family:'DM Sans',sans-serif;font-weight:600;transition:background .15s}
        .btn-primary:hover{background:${C.navyMid}}
        .sr-item:hover{background:${C.surfaceAlt}!important;cursor:pointer}
        .form-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px}
      `}</style>

      {/* ══ TOP NAV ═══════════════════════════════════════════════════════════ */}
      <header style={{background:C.surface,borderBottom:`1px solid ${C.border}`,padding:"0 28px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:200,height:62,boxShadow:"0 2px 8px rgba(13,33,55,.06)"}}>
        <div style={{display:"flex",alignItems:"center",gap:12,minWidth:240}}>
          <Logo size={38}/>
          <div>
            <div style={{fontSize:15,fontWeight:700,color:C.text1,letterSpacing:"-.01em"}}>BUIDCO</div>
            <div style={{fontSize:9,color:C.text4,fontFamily:"'DM Mono',monospace",letterSpacing:".12em",textTransform:"uppercase"}}>Project Monitoring System</div>
          </div>
          <div style={{width:1,height:32,background:C.border,margin:"0 4px"}}/>
        </div>

        <div style={{display:"flex",gap:2,alignItems:"center"}}>
          {tabs.map(t=>(
            <button key={t.id} className={`nav-tab${activeTab===t.id?" active":""}`}
              onClick={()=>{ setActiveTab(t.id); setSelectedProject(null); setSelectedSector(null); setDistrictFilter("ALL"); }}>
              {t.label}
              {t.id==="mgmt_action"&&<span style={{marginLeft:5,background:C.red,color:"white",fontSize:9,borderRadius:10,padding:"1px 5px",fontWeight:700}}>{managementFlags.length}</span>}
            </button>
          ))}
        </div>

        <div style={{display:"flex",alignItems:"center",gap:16,minWidth:300,justifyContent:"flex-end"}}>
          {/* Global Search */}
          <div style={{position:"relative"}}>
            <div style={{display:"flex",alignItems:"center",background:C.surfaceAlt,border:`1px solid ${searchFocus?C.blue:C.border}`,borderRadius:8,padding:"6px 12px",gap:8,width:240,transition:"border-color .15s"}}>
              <span style={{color:C.text4,fontSize:13}}>🔍</span>
              <input type="text" placeholder="Search project, ULB, district…" value={searchQuery} onChange={e=>setSearchQuery(e.target.value)}
                onFocus={()=>setSearchFocus(true)} onBlur={()=>setTimeout(()=>setSearchFocus(false),200)}
                style={{background:"none",border:"none",outline:"none",color:C.text1,fontSize:12,padding:0,width:"100%"}}/>
              {searchQuery&&<span onClick={()=>setSearchQuery("")} style={{color:C.text4,cursor:"pointer",fontSize:11,fontWeight:700}}>✕</span>}
            </div>
            {searchResults.length>0&&searchFocus&&(
              <div style={{position:"absolute",top:"calc(100% + 6px)",right:0,background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,width:340,boxShadow:"0 12px 32px rgba(13,33,55,.15)",zIndex:300,overflow:"hidden"}}>
                {searchResults.slice(0,8).map(p=>(
                  <div key={p.project_id} className="sr-item" style={{padding:"10px 14px",borderBottom:`1px solid ${C.border}`}} onClick={()=>goToProject(p)}>
                    <div style={{fontSize:10,color:C.text4,fontFamily:"'DM Mono',monospace"}}>{p.project_code}</div>
                    <div style={{fontSize:13,fontWeight:600,color:C.text1,marginTop:2}}>{p.project_name}</div>
                    <div style={{display:"flex",gap:5,marginTop:5,flexWrap:"wrap"}}>
                      <Pill color={C.blue}>{p.sector_name}</Pill>
                      <Pill color={C.text3}>{p.district}</Pill>
                      <Pill color={PHASE_COLOR[p.phase]||C.text3}>{p.phase}</Pill>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {searchQuery.length>1&&searchResults.length===0&&searchFocus&&(
              <div style={{position:"absolute",top:"calc(100% + 6px)",right:0,background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,width:240,padding:"12px 14px",fontSize:12,color:C.text3,boxShadow:"0 8px 24px rgba(13,33,55,.1)",zIndex:300}}>No matching projects found</div>
            )}
          </div>

          {/* Live Clock */}
          <div style={{textAlign:"right",borderLeft:`1px solid ${C.border}`,paddingLeft:16}}>
            <div style={{fontSize:14,fontFamily:"'DM Mono',monospace",color:C.navy,fontWeight:500}}>{timeStr}</div>
            <div style={{fontSize:10,color:C.text4,marginTop:1}}>{dateStr}</div>
            <div style={{display:"flex",alignItems:"center",gap:6,marginTop:2}}>
              <div style={{width:7,height:7,borderRadius:"50%",background:C.green,flexShrink:0}}/>
              <select value={userRole} onChange={e=>setUserRole(e.target.value)}
                style={{background:"none",border:"none",color:C.green,fontSize:10,fontWeight:600,cursor:"pointer",padding:0,outline:"none"}}>
                <option value="MD">MD</option>
                <option value="DC">DC</option>
                <option value="PMU_ENGINEER">PMU Engineer</option>
                <option value="FINANCE">Finance</option>
                <option value="READ_ONLY">Read Only</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      {apiEnabled && loadState === "loading" && (
        <div style={{background:`${C.navy}14`,borderBottom:`1px solid ${C.border}`,padding:"8px 32px",fontSize:12,color:C.text2,textAlign:"center"}}>
          Loading live portfolio data…
        </div>
      )}
      {loadError && (
        <div style={{background:C.redSoft,borderBottom:`1px solid ${C.red}30`,padding:"8px 32px",fontSize:12,color:C.red,textAlign:"center"}}>
          Could not reach the API ({loadError}). Showing offline mock data.
        </div>
      )}

      {/* ══ CONTENT ══════════════════════════════════════════════════════════ */}
      <main style={{padding:"28px 32px",maxWidth:1500,margin:"0 auto"}}>

        {/* ── OVERVIEW ──────────────────────────────────────────────────── */}
        {activeTab==="overview"&&(
          <div>
            <div style={{marginBottom:24}}>
              <h1 style={{fontSize:24,fontWeight:700,color:C.text1,fontFamily:"'DM Serif Display',serif",letterSpacing:"-.02em"}}>Portfolio Overview</h1>
              <p style={{fontSize:13,color:C.text3,marginTop:4}}>Bihar Urban Infrastructure Development Corporation — Real-time project monitoring</p>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16,marginBottom:16}}>
              <KpiCard label="Active Projects"    value={projects.length}      sub={`${delayedCount} currently delayed`}  accent={C.blue}   icon="🏗" onClick={()=>setShowActiveModal(true)}/>
              <KpiCard label="Total Sanctioned"   value={fmtCr(totalCost)}     sub="current approved cost"                accent={C.purple} icon="📋"/>
              <KpiCard label="Total Expenditure"  value={fmtCr(Math.round(totalSpent))} sub={`${finPct}% utilised — click for breakup`} accent={C.green} icon="💰" onClick={()=>setShowExpenditureModal(true)}/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16,marginBottom:16}}>
              <KpiCard label="Tender Works"             value={tenderWorksProjects.length}     sub="Construction & Maintenance tenders" accent={C.teal}   icon="📄" onClick={()=>setShowTendersModal(true)}/>
              <KpiCard label="Pre-Monsoon Preparations" value={preMonsoonFlags.length}         sub="urgent flags requiring action"    accent={C.red}    icon="⛈" badge={`${preMonsoonFlags.filter(f=>f.severity==="CRITICAL").length} CRITICAL`} onClick={()=>setShowMonsoonModal(true)}/>
              <KpiCard label="Tender Services"          value={PSO_PMU_TENDERS.length}         sub="PSO/PMU consultancy tenders"      accent={C.purple} icon="🏛" onClick={()=>setShowServiceTendersModal(true)}/>
            </div>

            {/* Current Stage in Active Projects (v26) */}
            <div style={{background:"linear-gradient(135deg,#EEF3FF 0%,#F0FBF7 100%)",border:`1px solid ${C.border}`,borderRadius:16,padding:"22px 24px",marginBottom:20,boxShadow:"0 1px 6px rgba(13,33,55,.06)"}}>
              {(()=>{
                const STAGE_PALETTE = {
                  "Conceptualization": { bg:"#1E3A5F", accent:"#4A90D9", label:"#A8C8F0" },
                  "Pre-Tender":        { bg:"#1A4731", accent:"#34A853", label:"#7ED4A0" },
                  "Tender":            { bg:"#3D2B00", accent:"#F59E0B", label:"#FCD06A" },
                  "Post-Tender":       { bg:"#2D1B4E", accent:"#8B5CF6", label:"#C4B0F8" },
                  "Construction":      { bg:"#1F3A4A", accent:"#06B6D4", label:"#93E4F4" },
                  "O&M":               { bg:"#1A3328", accent:"#10B981", label:"#6EE7C0" },
                  "Completed":         { bg:"#2D2D2D", accent:"#9CA3AF", label:"#D1D5DB" },
                };
                const stageData = STAGE_ORDER.map(stage=>{
                  const projs = projects.filter(p=>p.phase===stage);
                  return {stage, count:projs.length, sanctioned:projs.reduce((a,p)=>a+p.current_sanctioned_cost,0), delayed:projs.filter(p=>p.delay_days>0).length};
                }).filter(d=>d.count>0);
                const maxCount = Math.max(...stageData.map(d=>d.count),1);
                return (
                  <>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                      <div>
                        <span style={{fontSize:13,fontWeight:700,color:C.text1}}>Current Stage in Active Projects</span>
                        <span style={{fontSize:11,color:C.text3,marginLeft:8}}>All {projects.length} projects incl. Tendering</span>
                      </div>
                      <span style={{fontSize:10,color:C.blue,fontWeight:500,letterSpacing:".02em"}}>CLICK ANY CARD TO DRILL DOWN ↓</span>
                    </div>
                    <div style={{fontSize:10,color:C.text4,marginBottom:14}}>Each stage shows sub-activities, milestone checklist &amp; project list</div>
                    <div style={{display:"flex",gap:10,alignItems:"stretch"}}>
                      {stageData.map(d=>{
                        const pal  = STAGE_PALETTE[d.stage] || STAGE_PALETTE["Completed"];
                        return (
                          <div key={d.stage}
                            onClick={()=>{ setSelectedStage(d.stage); setStageModalFilters({}); }}
                            onMouseEnter={e=>{ e.currentTarget.style.transform="translateY(-4px)"; e.currentTarget.style.boxShadow=`0 12px 28px ${pal.accent}30`; }}
                            onMouseLeave={e=>{ e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.boxShadow="0 2px 8px rgba(0,0,0,.10)"; }}
                            style={{
                              flex:1, cursor:"pointer", borderRadius:12,
                              background:pal.bg,
                              border:`1px solid ${pal.accent}40`,
                              boxShadow:"0 2px 8px rgba(0,0,0,.10)",
                              transition:"transform .18s, box-shadow .18s",
                              display:"flex", flexDirection:"column",
                              overflow:"hidden", minWidth:0,
                            }}>
                            <div style={{padding:"14px 14px 10px", display:"flex", justifyContent:"space-between", alignItems:"flex-start"}}>
                              <span style={{fontFamily:"'DM Mono',monospace",fontSize:26,fontWeight:800,color:"#fff",lineHeight:1}}>{d.count}</span>
                              {d.delayed>0&&(
                                <span style={{background:C.red,color:"#fff",borderRadius:20,fontSize:9,padding:"2px 7px",fontWeight:700,lineHeight:1.5,whiteSpace:"nowrap"}}>
                                  {d.delayed} ⚠
                                </span>
                              )}
                            </div>
                            <div style={{margin:"0 14px",background:"rgba(255,255,255,.08)",borderRadius:4,height:4,overflow:"hidden",marginBottom:10}}>
                              <div style={{width:`${Math.round(d.count/maxCount*100)}%`,height:"100%",background:pal.accent,borderRadius:4,transition:"width .6s"}}/>
                            </div>
                            <div style={{padding:"0 14px 8px"}}>
                              <div style={{fontSize:11,fontWeight:700,color:"#fff",lineHeight:1.3,letterSpacing:".01em"}}>{d.stage}</div>
                            </div>
                            <div style={{marginTop:"auto",padding:"8px 14px",background:"rgba(0,0,0,.18)",borderTop:`1px solid ${pal.accent}25`}}>
                              <span style={{fontSize:9,fontFamily:"'DM Mono',monospace",color:pal.label,letterSpacing:".02em"}}>{fmtCr(d.sanctioned)}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Financial utilisation + physical progress (v26 style) */}
            {(()=>{
              const avgPhys = projects.length>0?Math.round(projects.reduce((a,p)=>a+p.actual_physical_pct,0)/projects.length):0;
              const avgSched= projects.length>0?Math.round(projects.reduce((a,p)=>a+p.scheduled_physical_pct,0)/projects.length):0;
              const physBehind = avgPhys < avgSched;
              return (
                <div style={{background:"linear-gradient(135deg,#EEF3FF 0%,#F0FBF7 100%)",border:`1px solid ${C.border}`,borderRadius:16,padding:"22px 24px",marginBottom:20,boxShadow:"0 1px 6px rgba(13,33,55,.06)"}}>
                  <div onClick={()=>setShowFinUtilModal(true)} style={{cursor:"pointer",marginBottom:22}}
                    onMouseEnter={e=>e.currentTarget.style.opacity=".92"}
                    onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
                      <div>
                        <span style={{fontSize:13,fontWeight:700,color:C.text1}}>Portfolio Financial Utilisation</span>
                        <span style={{fontSize:11,color:C.blue,fontWeight:400,marginLeft:8}}>(click for district &amp; sector breakup)</span>
                      </div>
                      <span style={{fontFamily:"'DM Mono',monospace",fontSize:16,color:C.green,fontWeight:700}}>{finPct}%</span>
                    </div>
                    <div style={{background:"rgba(13,33,55,.10)",borderRadius:8,height:12,overflow:"hidden"}}>
                      <div style={{width:`${finPct}%`,height:"100%",background:`linear-gradient(90deg,${C.blue},${C.green})`,borderRadius:8,transition:"width .8s"}}/>
                    </div>
                    <div style={{display:"flex",justifyContent:"space-between",marginTop:5}}>
                      <span style={{fontSize:11,color:C.text3}}>₹ 0</span>
                      <span style={{fontSize:11,color:C.text3}}>{fmtCr(totalCost)} (Target)</span>
                    </div>
                  </div>

                  <div style={{height:1,background:`${C.border}`,marginBottom:20,opacity:.6}}/>

                  <div onClick={()=>setShowPhysProgressModal(true)} style={{cursor:"pointer"}}
                    onMouseEnter={e=>e.currentTarget.style.opacity=".92"}
                    onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
                      <div>
                        <span style={{fontSize:13,fontWeight:700,color:C.text1}}>Portfolio Physical Progress</span>
                        <span style={{fontSize:11,color:C.blue,fontWeight:400,marginLeft:8}}>(click for sector &amp; district breakup)</span>
                      </div>
                      <div style={{display:"flex",gap:14,alignItems:"center"}}>
                        <span style={{fontSize:11,color:C.text3}}>Actual: <span style={{fontFamily:"'DM Mono',monospace",fontWeight:700,color:pctColor(avgPhys)}}>{avgPhys}%</span></span>
                        <span style={{fontSize:11,color:C.text3}}>Scheduled: <span style={{fontFamily:"'DM Mono',monospace",fontWeight:700,color:C.blue}}>{avgSched}%</span></span>
                        {physBehind
                          ? <span style={{background:C.redSoft,color:C.red,border:`1px solid ${C.red}30`,borderRadius:4,padding:"2px 10px",fontSize:10,fontWeight:700}}>⚠ {avgSched-avgPhys}% behind schedule</span>
                          : <span style={{background:C.greenSoft,color:C.green,border:`1px solid ${C.green}30`,borderRadius:4,padding:"2px 10px",fontSize:10,fontWeight:700}}>✓ On / Ahead of Schedule</span>
                        }
                      </div>
                    </div>
                    <div style={{position:"relative",background:"rgba(13,33,55,.10)",borderRadius:8,height:18,overflow:"hidden",marginBottom:6}}>
                      <div style={{position:"absolute",left:0,top:0,height:"100%",width:`${avgSched}%`,background:`${C.blue}30`,borderRadius:8,transition:"width .8s"}}/>
                      <div style={{position:"absolute",left:0,top:0,height:"100%",width:`${avgPhys}%`,background:`linear-gradient(90deg,${pctColor(avgPhys)},${pctColor(avgPhys)}CC)`,borderRadius:8,transition:"width .8s",display:"flex",alignItems:"center",justifyContent:"flex-end",paddingRight:6}}>
                        {avgPhys>10&&<span style={{fontFamily:"'DM Mono',monospace",fontSize:10,fontWeight:800,color:"white"}}>{avgPhys}%</span>}
                      </div>
                      {avgSched>0&&avgSched<=100&&(
                        <div style={{position:"absolute",top:0,left:`${avgSched}%`,width:2,height:"100%",background:C.blue,opacity:.7,transform:"translateX(-1px)"}}/>
                      )}
                    </div>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:4}}>
                      <div style={{display:"flex",gap:14}}>
                        <span style={{fontSize:10,color:C.text3,display:"flex",alignItems:"center",gap:4}}>
                          <span style={{width:12,height:6,borderRadius:2,background:pctColor(avgPhys),display:"inline-block"}}/> Actual {avgPhys}%
                        </span>
                        <span style={{fontSize:10,color:C.text3,display:"flex",alignItems:"center",gap:4}}>
                          <span style={{width:2,height:12,background:C.blue,display:"inline-block",opacity:.7}}/> Scheduled {avgSched}%
                        </span>
                      </div>
                      <span style={{fontSize:10,color:C.blue,fontWeight:600}}>VIEW DETAIL →</span>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Finance & Payments — lightweight summary (opens detailed modal) */}
            {(()=>{
              const today            = new Date().toISOString().slice(0,10);
              const totalContract    = projects.reduce((a,p)=>a+(Number(p.contract_value_lakhs)||0),0);
              const totalPaid        = projects.reduce((a,p)=>a+(Number(p.payments_made_lakhs)||0),0);
              const totalBalance     = Math.max(0,totalContract-totalPaid);
              const totalMobAdv      = projects.reduce((a,p)=>a+(Number(p.mobilization_advance_lakhs)||0),0);
              const totalMobRecov    = projects.reduce((a,p)=>a+(Number(p.mobilization_advance_recovered_lakhs)||0),0);
              const totalMobOut      = Math.max(0,totalMobAdv-totalMobRecov);
              const totalRetention   = projects.reduce((a,p)=>a+(Number(p.retention_money_lakhs)||0),0);
              const totalPBG         = projects.reduce((a,p)=>a+(Number(p.pbg_amount_lakhs)||0),0);
              const totalEMD         = projects.reduce((a,p)=>a+(Number(p.emd_amount_lakhs)||0),0);
              const pbgExpiredList   = projects.filter(p=>p.pbg_expiry_date&&p.pbg_expiry_date<today&&p.pbg_amount_lakhs>0);
              const pbgExpiringList  = projects.filter(p=>p.pbg_expiry_date&&p.pbg_expiry_date>=today&&((new Date(p.pbg_expiry_date)-new Date())/(1000*60*60*24))<=30&&p.pbg_amount_lakhs>0);
              const projsWithData    = projects.filter(p=>Number(p.payments_made_lakhs||0)>0);
              const paidPct          = totalContract>0?Math.round(totalPaid/totalContract*100):0;
              const mobRecovPct      = totalMobAdv>0?Math.round(totalMobRecov/totalMobAdv*100):0;
              const alertCount       = pbgExpiredList.length+pbgExpiringList.length;

              const StatCell = ({label, value, color, sub, onClick}) => (
                <div onClick={onClick} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:"14px 18px",cursor:onClick?"pointer":"default",transition:"all .15s",boxShadow:"0 1px 3px rgba(13,33,55,.04)"}}
                  onMouseEnter={e=>{if(onClick){e.currentTarget.style.boxShadow="0 4px 14px rgba(13,33,55,.10)";e.currentTarget.style.transform="translateY(-1px)";}}}
                  onMouseLeave={e=>{e.currentTarget.style.boxShadow="0 1px 3px rgba(13,33,55,.04)";e.currentTarget.style.transform="translateY(0)";}}>
                  <div style={{fontSize:10,color:C.text3,fontWeight:600,textTransform:"uppercase",letterSpacing:".07em",marginBottom:6}}>{label}</div>
                  <div style={{fontFamily:"'DM Mono',monospace",fontSize:17,fontWeight:700,color:color,lineHeight:1}}>{value}</div>
                  {sub&&<div style={{fontSize:10,color:C.text3,marginTop:5,lineHeight:1.4}}>{sub}</div>}
                  {onClick&&<div style={{fontSize:9,color:color,fontWeight:700,letterSpacing:".06em",marginTop:6}}>VIEW ALL →</div>}
                </div>
              );

              return (
                <div style={{background:"linear-gradient(135deg,#EFF9FB 0%,#F3EFFE 100%)",border:`1px solid ${C.border}`,borderRadius:16,padding:"20px 24px",marginBottom:28,boxShadow:"0 1px 6px rgba(13,33,55,.06)"}}>
                  {/* Panel header */}
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <span style={{background:C.teal,color:"white",borderRadius:8,padding:"3px 12px",fontSize:11,fontWeight:700}}>🏦 Finance &amp; Payments</span>
                      <span style={{fontSize:11,color:C.text3}}>{projsWithData.length} projects with payment data</span>
                    </div>
                    <div style={{display:"flex",gap:8,alignItems:"center"}}>
                      {alertCount>0&&(
                        <span style={{background:C.redSoft,color:C.red,border:`1px solid ${C.red}30`,borderRadius:6,padding:"3px 10px",fontSize:11,fontWeight:700}}>
                          ⚠ {pbgExpiredList.length>0?`${pbgExpiredList.length} PBG EXPIRED`:""}{pbgExpiredList.length>0&&pbgExpiringList.length>0?" · ":""}{pbgExpiringList.length>0?`${pbgExpiringList.length} expiring soon`:""}
                        </span>
                      )}
                      <button onClick={()=>setShowFinanceModal(true)}
                        style={{padding:"5px 14px",fontSize:11,fontWeight:600,borderRadius:8,cursor:"pointer",border:`1px solid ${C.teal}`,background:C.teal,color:"white",transition:"all .15s"}}>
                        Full Detail →
                      </button>
                    </div>
                  </div>

                  {/* ── Row 1: Payments to Contractor ── */}
                  <div style={{marginBottom:14}}>
                    <div style={{fontSize:11,fontWeight:700,color:C.text2,marginBottom:8,display:"flex",alignItems:"center",gap:6}}>
                      <span style={{width:3,height:14,background:C.green,borderRadius:2,display:"inline-block"}}/>
                      Payments to Contractor
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
                      <StatCell label="Contract Value"    value={fmtCr(totalContract)} color={C.purple} sub={`across ${projsWithData.length} awarded projects`} onClick={()=>{setFinanceTab("payments");setShowFinanceModal(true);}}/>
                      <StatCell label="Paid to Date"      value={fmtCr(totalPaid)}     color={C.green}  sub={`${paidPct}% of contract value disbursed`}        onClick={()=>{setFinanceTab("payments");setShowFinanceModal(true);}}/>
                      <StatCell label="Balance Payable"   value={fmtCr(totalBalance)}  color={C.amber}  sub="remaining contract value to be paid"/>
                      <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:"14px 18px",boxShadow:"0 1px 3px rgba(13,33,55,.04)"}}>
                        <div style={{fontSize:10,color:C.text3,fontWeight:600,textTransform:"uppercase",letterSpacing:".07em",marginBottom:8}}>Payment Progress</div>
                        <div style={{background:"#E8EBF2",borderRadius:4,height:8,overflow:"hidden",marginBottom:6}}>
                          <div style={{width:`${Math.min(paidPct,100)}%`,height:"100%",background:`linear-gradient(90deg,${C.teal},${C.green})`,borderRadius:4,transition:"width .8s"}}/>
                        </div>
                        <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:C.text3}}>
                          <span>₹ 0</span>
                          <span style={{fontFamily:"'DM Mono',monospace",color:pctColor(paidPct),fontWeight:700}}>{paidPct}% paid</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Divider */}
                  <div style={{height:1,background:C.border,opacity:.5,marginBottom:14}}/>

                  {/* ── Row 2: Financial Securities ── */}
                  <div>
                    <div style={{fontSize:11,fontWeight:700,color:C.text2,marginBottom:8,display:"flex",alignItems:"center",gap:6}}>
                      <span style={{width:3,height:14,background:C.purple,borderRadius:2,display:"inline-block"}}/>
                      Financial Securities
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:10}}>
                      <StatCell label="Mob. Advance Issued"   value={fmtCr(totalMobAdv)}    color={C.blue}   sub={`₹ ${(totalMobRecov/100).toFixed(1)} Cr recovered`}            onClick={()=>{setFinanceTab("advance");setShowFinanceModal(true);}}/>
                      <StatCell label="Advance Outstanding"   value={fmtCr(totalMobOut)}     color={totalMobOut>0?C.red:C.green} sub={`${mobRecovPct}% of advance recovered`}/>
                      <StatCell label="Retention Money Held"  value={fmtCr(totalRetention)}  color={C.amber}  sub="withheld from contractor bills"                                onClick={()=>{setFinanceTab("advance");setShowFinanceModal(true);}}/>
                      <StatCell label="PBG Portfolio"         value={fmtCr(totalPBG)}        color={pbgExpiredList.length>0?C.red:C.teal} sub={`${pbgExpiredList.length} expired · ${pbgExpiringList.length} expiring`} onClick={()=>{setFinanceTab("pbg");setShowFinanceModal(true);}}/>
                      <StatCell label="EMD Held"              value={fmtCr(totalEMD)}        color={C.orange} sub="earnest money deposits"                                        onClick={()=>{setFinanceTab("emd");setShowFinanceModal(true);}}/>
                    </div>
                  </div>
                </div>
              );
            })()}

            <div style={{display:"grid",gridTemplateColumns:"1fr 340px",gap:20}}>
              <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:"20px 24px",boxShadow:"0 1px 4px rgba(13,33,55,.05)"}}>
                <div style={{fontSize:13,fontWeight:600,color:C.text1,marginBottom:16}}>Physical vs Financial Progress by Sector</div>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={sectorChartData} barGap={3}>
                    <XAxis dataKey="name" tick={{fill:C.text4,fontSize:9}} axisLine={false} tickLine={false}/>
                    <YAxis tick={{fill:C.text4,fontSize:10}} domain={[0,100]} axisLine={false} tickLine={false}/>
                    <Tooltip contentStyle={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,fontSize:12,color:C.text1}}/>
                    <Legend wrapperStyle={{fontSize:12,color:C.text2}}/>
                    <Bar dataKey="physical"  name="Physical %"  fill={C.blue}  radius={[4,4,0,0]}/>
                    <Bar dataKey="financial" name="Financial %" fill={C.green} radius={[4,4,0,0]}/>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:"20px 24px",boxShadow:"0 1px 4px rgba(13,33,55,.05)"}}>
                <div style={{fontSize:13,fontWeight:600,color:C.text1,marginBottom:8}}>Project Status Breakdown</div>
                <div style={{display:"flex",flexDirection:"column",gap:5,marginBottom:10}}>
                  {flagPieData.map((e,i)=>(
                    <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <div style={{display:"flex",alignItems:"center",gap:6}}>
                        <div style={{width:10,height:10,borderRadius:2,background:e.color,flexShrink:0}}/>
                        <span style={{fontSize:11,color:C.text2}}>{e.name}</span>
                      </div>
                      <span style={{fontFamily:"'DM Mono',monospace",fontSize:12,fontWeight:600,color:e.color}}>{e.value}</span>
                    </div>
                  ))}
                </div>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={flagPieData} cx="50%" cy="50%" innerRadius={46} outerRadius={72} dataKey="value" paddingAngle={3}>
                      {flagPieData.map((e,i)=><Cell key={i} fill={e.color}/>)}
                    </Pie>
                    <Tooltip contentStyle={{background:C.surface,border:`1px solid ${C.border}`,fontSize:12}}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* ── SECTORS ───────────────────────────────────────────────────── */}
        {activeTab==="sectors"&&!selectedSector&&(
          <div>
            <h1 style={{fontSize:22,fontWeight:700,color:C.text1,fontFamily:"'DM Serif Display',serif",marginBottom:6}}>Sector Performance</h1>
            <p style={{fontSize:13,color:C.text3,marginBottom:24}}>Click any sector card to view its projects</p>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:16}}>
              {sectorCards.map(s=>(
                <div key={s.sector_code} className="sector-card" onClick={()=>goToSector(s)}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
                    <div>
                      <div style={{fontSize:24,marginBottom:6}}>{s.sector_icon}</div>
                      <div style={{fontSize:14,fontWeight:700,color:C.text1}}>{s.sector_name}</div>
                      <div style={{fontSize:12,color:C.text3,marginTop:2}}>{s.total_projects} projects</div>
                    </div>
                    <div style={{display:"flex",flexDirection:"column",gap:5,alignItems:"flex-end"}}>
                      {s.delayed_count>0&&<Badge color={C.red}>{s.delayed_count} delayed</Badge>}
                      {s.dc_flag_count>0&&<Badge color={C.amber}>{s.dc_flag_count} flags</Badge>}
                    </div>
                  </div>
                  <div style={{marginBottom:10}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}><span style={{fontSize:11,color:C.text3}}>Physical</span><span style={{fontSize:12,fontFamily:"'DM Mono',monospace",color:pctColor(s.avg_physical_pct),fontWeight:600}}>{s.avg_physical_pct}%</span></div>
                    <Bar2 value={s.avg_physical_pct}/>
                  </div>
                  <div style={{marginBottom:14}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}><span style={{fontSize:11,color:C.text3}}>Financial</span><span style={{fontSize:12,fontFamily:"'DM Mono',monospace",color:pctColor(s.financial_utilisation_pct),fontWeight:600}}>{s.financial_utilisation_pct}%</span></div>
                    <Bar2 value={s.financial_utilisation_pct}/>
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",borderTop:`1px solid ${C.border}`,paddingTop:12}}>
                    <span style={{fontSize:11,color:C.text4}}>{fmtCr(s.total_sanctioned_lakhs)}</span>
                    <span style={{fontSize:11,color:C.blue,fontWeight:600}}>View projects →</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab==="sectors"&&selectedSector&&(()=>{
          const sec=sectorCards.find(s=>s.sector_code===selectedSector);
          const secProjects=projects.filter(p=>p.sector_code===selectedSector);
          return (
            <div>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:22}}>
                <button className="btn-ghost" onClick={()=>setSelectedSector(null)}>← All Sectors</button>
                <span style={{color:C.text4}}>›</span>
                <span style={{fontSize:18,fontWeight:700,color:C.text1,fontFamily:"'DM Serif Display',serif"}}>{sec?.sector_icon} {sec?.sector_name}</span>
                <Badge color={C.blue}>{secProjects.length} projects</Badge>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:22}}>
                {[["Avg Physical",`${sec.avg_physical_pct}%`,C.blue],["Avg Financial",`${sec.financial_utilisation_pct}%`,C.green],["Delayed",sec.delayed_count,C.red],["Open Flags",sec.dc_flag_count,C.amber]].map(([l,v,a])=>(
                  <div key={l} style={{background:C.surface,border:`1px solid ${C.border}`,borderTop:`3px solid ${a}`,borderRadius:10,padding:"16px 18px"}}>
                    <div style={{fontSize:11,color:C.text3,fontWeight:600,textTransform:"uppercase",letterSpacing:".06em",marginBottom:6}}>{l}</div>
                    <div style={{fontSize:22,fontWeight:700,color:C.text1,fontFamily:"'DM Serif Display',serif"}}>{v}</div>
                  </div>
                ))}
              </div>
              <ProjectsTable projects={secProjects} allProjectsForFilters={projects} onSelect={p=>{setSelectedProject(p);setActiveTab("projects")}} onEdit={p=>{setEditProject(p);setEditForm({...p});setSaveError(null);setShowEditModal(true);}} canEdit={perms.can_edit}/>
            </div>
          );
        })()}

        {/* ── PROJECTS ──────────────────────────────────────────────────── */}
        {activeTab==="projects"&&!selectedProject&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <div>
                <h1 style={{fontSize:22,fontWeight:700,color:C.text1,fontFamily:"'DM Serif Display',serif"}}>Projects</h1>
                <p style={{fontSize:13,color:C.text3,marginTop:3}}>{displayProjects.length} of {projects.length} projects shown</p>
              </div>
              <div style={{display:"flex",gap:10,alignItems:"center"}}>
                <input type="text" placeholder="Search projects…" value={projTable.search} onChange={e=>projTable.setSearch(e.target.value)} style={{width:220}}/>
                <select value={districtFilter} onChange={e=>setDistrictFilter(e.target.value)}>
                  <option value="ALL">All Districts</option>
                  {[...new Set(projects.map(p=>p.district))].sort().map(d=><option key={d} value={d}>{d}</option>)}
                </select>
                {Object.values(projTable.filters).some(v=>v&&v!=="ALL")&&(
                  <button className="btn-ghost" onClick={()=>projTable.setFilters({})}>✕ Clear Filters</button>
                )}
                <button className="btn-primary" onClick={openAddModal}>+ Add Project</button>
              </div>
            </div>
            <ProjectsTable
              projects={displayProjects}
              allProjectsForFilters={projects}
              onSelect={setSelectedProject}
              onEdit={p=>{setEditProject(p);setEditForm({...p});setSaveError(null);setShowEditModal(true);}}
              canEdit={perms.can_edit}
              filters={projTable.filters} setFilters={projTable.setFilters}
              sortField={projTable.sortField} setSortField={projTable.setSortField}
              sortDir={projTable.sortDir} setSortDir={projTable.setSortDir}
            />
          </div>
        )}

        {activeTab==="projects"&&selectedProject&&(
          <ProjectDetail project={selectedProject} onBack={()=>setSelectedProject(null)} onEdit={p=>{setEditProject(p);setEditForm({...p});setSaveError(null);setShowEditModal(true);}} canEdit={perms.can_edit}/>
        )}

        {/* ── MD INPUT SHEET ────────────────────────────────────────────── */}
        {activeTab==="md_input"&&userRole==="MD"&&(()=>{
          const mdProjects = projects.filter(p=>{
            const sOk = mdSectorFilter==="ALL"||p.sector_code===mdSectorFilter;
            const qOk = !mdInputSearch
              || p.project_name.toLowerCase().includes(mdInputSearch.toLowerCase())
              || p.project_code.toLowerCase().includes(mdInputSearch.toLowerCase())
              || p.district.toLowerCase().includes(mdInputSearch.toLowerCase());
            return sOk&&qOk;
          });
          return (
            <div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
                <div>
                  <h1 style={{fontSize:22,fontWeight:700,color:C.text1,fontFamily:"'DM Serif Display',serif"}}>📋 MD Input Sheet</h1>
                  <p style={{fontSize:13,color:C.text3,marginTop:4}}>Manage key project details across the portfolio. (Local UI state only for now.)</p>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <div style={{background:C.amberSoft,border:`1px solid ${C.amber}30`,borderRadius:8,padding:"8px 16px",fontSize:12,color:C.amber,fontWeight:600}}>🔒 MD Access Only</div>
                  {mdInputProject&&(
                    <button className="btn-primary" onClick={()=>{setMdInputProject(null);setMdInputForm({});}}>← Back to Project List</button>
                  )}
                </div>
              </div>

              {/* Project list */}
              {!mdInputProject&&(
                <>
                  <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:"16px 20px",marginBottom:16,display:"flex",gap:12,flexWrap:"wrap",alignItems:"center"}}>
                    <input type="text" placeholder="Search projects…" value={mdInputSearch} onChange={e=>setMdInputSearch(e.target.value)} style={{width:260}}/>
                    <select value={mdSectorFilter} onChange={e=>setMdSectorFilter(e.target.value)}>
                      <option value="ALL">All Sectors</option>
                      {sectorCards.map(s=><option key={s.sector_code} value={s.sector_code}>{s.sector_icon} {s.sector_name}</option>)}
                    </select>
                    {perms.can_add&&<button className="btn-primary" onClick={openAddModal}>+ Add New Project</button>}
                    <span style={{marginLeft:"auto",fontSize:12,color:C.text3}}>{mdProjects.length} projects</span>
                  </div>
                  <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,overflow:"auto"}}>
                    <table>
                      <thead>
                        <tr style={{background:C.surfaceAlt}}>
                          {["Project Code","Project Name","Sector","District","Phase","Physical %","Financial %","Sanctioned (Cr)","Delay (days)","Status","Action"].map(h=>(
                            <th key={h} style={{padding:"10px 14px",fontSize:11,fontWeight:700,color:C.text2,textTransform:"uppercase",letterSpacing:".05em",borderBottom:`2px solid ${C.border}`,whiteSpace:"nowrap"}}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {mdProjects.map(p=>(
                          <tr key={p.project_id}>
                            <td style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:C.text4}}>{p.project_code}</td>
                            <td style={{fontWeight:600,color:C.text1,maxWidth:200}}>{p.project_name}</td>
                            <td><Badge color={C.teal}>{p.sector_icon} {p.sector_name}</Badge></td>
                            <td style={{fontSize:12,color:C.text2}}>{p.district}</td>
                            <td><Pill color={PHASE_COLOR[p.phase]||C.text3}>{p.phase}</Pill></td>
                            <td><span style={{fontFamily:"'DM Mono',monospace",fontSize:13,color:pctColor(p.actual_physical_pct),fontWeight:700}}>{p.actual_physical_pct}%</span></td>
                            <td><span style={{fontFamily:"'DM Mono',monospace",fontSize:13,color:pctColor(p.financial_progress_pct),fontWeight:700}}>{p.financial_progress_pct}%</span></td>
                            <td style={{fontFamily:"'DM Mono',monospace",fontSize:12,color:C.purple,fontWeight:600}}>{fmtCr(p.current_sanctioned_cost)}</td>
                            <td>{p.delay_days>0?<Pill color={C.red}>{p.delay_days}d</Pill>:<Pill color={C.green}>0</Pill>}</td>
                            <td><Badge color={p.status==="STALLED"?C.red:p.status==="COMPLETED"?C.green:C.blue}>{p.status}</Badge></td>
                            <td>
                              <button className="btn-primary" style={{padding:"5px 14px",fontSize:12}} onClick={()=>{setMdInputProject(p);setMdInputForm({...p});setDeletedCosIds([]);setSaveError(null);}}>✏ Edit</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {/* Edit form */}
              {mdInputProject&&(()=>{
                const projCos = mdCosData.filter(c => c.project_id === mdInputProject.project_id);

                const updateCos = (uid, fkey, val) => {
                  setMdCosData(prev => prev.map(c => c._uid === uid ? { ...c, [fkey]: val } : c));
                };

                const addCosRow = () => {
                  const existing = mdCosData.filter(c => c.project_id === mdInputProject.project_id);
                  const newNum = existing.length + 1;
                  const newRow = {
                    _uid: Date.now(),
                    _isNew: true,
                    cos_id: null,
                    project_id: mdInputProject.project_id,
                    project_code: mdInputProject.project_code,
                    cos_number: `CoS-0${newNum}`,
                    cos_date: new Date().toISOString().slice(0,10),
                    cos_category: "SCOPE ADDITION",
                    cos_amount: 0,
                    cos_pct_variation: 0,
                    is_time_linked: false,
                    eot_number: `EoT-0${newNum}`,
                    eot_days_granted: 0,
                    original_end_date: mdInputProject.planned_end_date || "",
                    new_end_date: "",
                    revised_date: "",
                  };
                  setMdCosData(prev => [...prev, newRow]);
                };

                const removeCosRow = uid => {
                  const target = mdCosData.find(c => c._uid === uid);
                  if (target?.cos_id) setDeletedCosIds(prev => [...prev, target.cos_id]);
                  setMdCosData(prev => prev.filter(c => c._uid !== uid));
                };

                return (
                  <div>
                    {/* Sticky header bar */}
                    <div style={{position:"sticky",top:62,zIndex:50,display:"flex",alignItems:"center",gap:12,marginBottom:20,background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:"14px 20px",boxShadow:"0 2px 8px rgba(13,33,55,.08)"}}>
                      <div style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:C.text4,background:C.surfaceAlt,border:`1px solid ${C.border}`,borderRadius:6,padding:"4px 10px",whiteSpace:"nowrap"}}>{mdInputProject.project_code}</div>
                      <span style={{fontSize:15,fontWeight:700,color:C.text1,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{mdInputProject.project_name}</span>
                      {mdInputSaved&&(
                        <span style={{background:C.greenSoft,border:`1px solid ${C.green}40`,color:C.green,fontSize:12,fontWeight:700,padding:"6px 14px",borderRadius:8,whiteSpace:"nowrap",flexShrink:0}}>
                          ✓ Saved — Dashboard updated
                        </span>
                      )}
                      {saveError&&<span style={{color:C.red,fontSize:12,fontWeight:600,flexShrink:0,maxWidth:220}}>{saveError}</span>}
                      <button className="btn-primary" style={{padding:"9px 22px",fontSize:13,whiteSpace:"nowrap",flexShrink:0}} onClick={saveMdInputForm} disabled={saving}>{saving?"Saving…":"✓ Save All Changes"}</button>
                      <button className="btn-ghost" style={{whiteSpace:"nowrap",flexShrink:0}} onClick={()=>{setMdInputProject(null);setMdInputForm({});setSaveError(null);}} disabled={saving}>✕ Cancel</button>
                    </div>

                    {/* SECTION 01 */}
                    <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:"22px 24px",marginBottom:14}}>
                      <div style={{fontSize:12,fontWeight:700,color:C.navy,marginBottom:18,paddingBottom:10,borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:10}}>
                        <span style={{background:C.navy,color:"#fff",borderRadius:6,padding:"2px 10px",fontSize:11,fontWeight:700}}>01</span>
                        Core Project Identity
                      </div>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16}}>
                        <MdField label="Project Code (read-only)" fkey="project_code" readOnly form={mdInputForm} setForm={setMdInputForm}/>
                        <MdField label="Project Name ✱" fkey="project_name" span2 form={mdInputForm} setForm={setMdInputForm}/>
                        <MdField label="Sector" fkey="sector_code" options={sectorCards.map(s=>({v:s.sector_code,l:`${s.sector_icon} ${s.sector_name}`}))} form={mdInputForm} setForm={setMdInputForm}/>
                        <MdField label="District" fkey="district" options={DISTRICTS.map(d=>({v:d,l:d}))} form={mdInputForm} setForm={setMdInputForm}/>
                        <MdField label="ULB / City" fkey="ulb_name" form={mdInputForm} setForm={setMdInputForm}/>
                        <MdField label="Contractor Name" fkey="contractor_name" span2 form={mdInputForm} setForm={setMdInputForm}/>
                      </div>
                    </div>

                    {/* SECTION 02 */}
                    <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:"22px 24px",marginBottom:14}}>
                      <div style={{fontSize:12,fontWeight:700,color:C.navy,marginBottom:18,paddingBottom:10,borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:10}}>
                        <span style={{background:"#1E3A5F",color:"#A8C8F0",borderRadius:6,padding:"2px 10px",fontSize:11,fontWeight:700}}>02</span>
                        Phase, Status &amp; Dates
                      </div>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16}}>
                        <MdField label="Current Phase" fkey="phase" options={PROJECT_PHASES.map(p=>({v:p,l:p}))} form={mdInputForm} setForm={setMdInputForm}/>
                        <MdField label="Project Status" fkey="status" options={["DPR_STAGE","TENDERING","AWARDED","IN_PROGRESS","STALLED","COMPLETED","CANCELLED"].map(s=>({v:s,l:s}))} form={mdInputForm} setForm={setMdInputForm}/>
                        <MdField label="Planned End Date" fkey="planned_end_date" type="date" form={mdInputForm} setForm={setMdInputForm}/>
                        <MdField label="Revised End Date" fkey="revised_end_date" type="date" form={mdInputForm} setForm={setMdInputForm}/>
                        <MdField label="Delay (Days)" fkey="delay_days" type="number" form={mdInputForm} setForm={setMdInputForm}/>
                        <MdField label="Delay Reason / Root Cause" fkey="delay_reason" form={mdInputForm} setForm={setMdInputForm}/>
                        <MdField label="Department / Agency Stuck At" fkey="dept_stuck" form={mdInputForm} setForm={setMdInputForm}/>
                      </div>
                    </div>

                    {/* SECTION 03 */}
                    <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:"22px 24px",marginBottom:14}}>
                      <div style={{fontSize:12,fontWeight:700,color:C.navy,marginBottom:18,paddingBottom:10,borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:10}}>
                        <span style={{background:"#1A4731",color:"#7ED4A0",borderRadius:6,padding:"2px 10px",fontSize:11,fontWeight:700}}>03</span>
                        Progress &amp; Financial
                      </div>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16}}>
                        <MdField label="Sanctioned Cost (₹ Lakhs) ✱" fkey="current_sanctioned_cost" type="number" form={mdInputForm} setForm={setMdInputForm}/>
                        <MdField label="Physical Progress % (Actual)" fkey="actual_physical_pct" type="number" form={mdInputForm} setForm={setMdInputForm}/>
                        <MdField label="Physical Progress % (Scheduled)" fkey="scheduled_physical_pct" type="number" form={mdInputForm} setForm={setMdInputForm}/>
                        <MdField label="Financial Progress %" fkey="financial_progress_pct" type="number" form={mdInputForm} setForm={setMdInputForm}/>
                        <div style={{display:"flex",flexDirection:"column",gap:5}}>
                          <label style={{fontSize:11,color:C.text3,fontWeight:600,textTransform:"uppercase",letterSpacing:".05em"}}>Total CoS Count</label>
                          <div style={{background:C.surfaceAlt,border:`1px solid ${C.border}`,borderRadius:8,padding:"9px 12px",fontSize:13,color:C.purple,fontWeight:700,fontFamily:"'DM Mono',monospace"}}>
                            {projCos.length} (auto)
                          </div>
                        </div>
                        <div style={{display:"flex",flexDirection:"column",gap:5}}>
                          <label style={{fontSize:11,color:C.text3,fontWeight:600,textTransform:"uppercase",letterSpacing:".05em"}}>Total EoT Days</label>
                          <div style={{background:C.surfaceAlt,border:`1px solid ${C.border}`,borderRadius:8,padding:"9px 12px",fontSize:13,color:C.blue,fontWeight:700,fontFamily:"'DM Mono',monospace"}}>
                            {projCos.reduce((a,c)=>a+(parseFloat(c.eot_days_granted)||0),0)} d (auto)
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* SECTION 04 */}
                    <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:"22px 24px",marginBottom:20}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18,paddingBottom:10,borderBottom:`1px solid ${C.border}`}}>
                        <div style={{fontSize:12,fontWeight:700,color:C.navy,display:"flex",alignItems:"center",gap:10}}>
                          <span style={{background:"#3D2B00",color:"#FCD06A",borderRadius:6,padding:"2px 10px",fontSize:11,fontWeight:700}}>04</span>
                          Change of Scope (CoS) &amp; Extension of Time (EoT)
                        </div>
                        <button onClick={addCosRow} className="btn-primary" style={{padding:"6px 16px",fontSize:12}}>+ Add CoS</button>
                      </div>

                      {projCos.length === 0 && (
                        <div style={{textAlign:"center",padding:"28px 0",color:C.text3,fontSize:13,background:C.surfaceAlt,borderRadius:8}}>
                          No CoS / EoT records yet — click <strong>+ Add CoS</strong> to create one
                        </div>
                      )}

                      {projCos.map((cos, idx) => (
                        <div key={cos._uid} style={{border:`1px solid ${C.border}`,borderLeft:`4px solid ${C.purple}`,borderRadius:10,padding:"18px 20px",marginBottom:12,background:C.surfaceAlt}}>
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                            <div style={{display:"flex",alignItems:"center",gap:10}}>
                              <span style={{background:C.purple,color:"#fff",borderRadius:20,padding:"3px 12px",fontSize:12,fontWeight:700}}>{cos.cos_number || `CoS-0${idx+1}`}</span>
                              <span style={{fontSize:11,color:C.text3}}>Change of Scope #{idx+1}</span>
                            </div>
                            <button onClick={()=>removeCosRow(cos._uid)} style={{background:"none",border:`1px solid ${C.red}30`,color:C.red,borderRadius:6,padding:"3px 10px",cursor:"pointer",fontSize:11,fontWeight:600}}>✕ Remove</button>
                          </div>
                          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:12,marginBottom:12}}>
                            <CosField label="CoS Number" fkey="cos_number" row={cos} onChange={(k,v)=>updateCos(cos._uid,k,v)}/>
                            <CosField label="CoS Date" fkey="cos_date" type="date" row={cos} onChange={(k,v)=>updateCos(cos._uid,k,v)}/>
                            <CosField label="Category" fkey="cos_category" options={["SCOPE ADDITION","DESIGN CHANGE","QTY VARIATION","FORCE MAJEURE","COURT ORDER","PRICE ESCALATION"].map(o=>({v:o,l:o}))} row={cos} onChange={(k,v)=>updateCos(cos._uid,k,v)}/>
                            <CosField label="CoS Amount (₹ Lakhs)" fkey="cos_amount" type="number" row={cos} onChange={(k,v)=>updateCos(cos._uid,k,v)}/>
                          </div>
                          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:12,marginBottom:12}}>
                            <CosField label="Variation %" fkey="cos_pct_variation" type="number" row={cos} onChange={(k,v)=>updateCos(cos._uid,k,v)}/>
                            <CosField label="EoT Number" fkey="eot_number" row={cos} onChange={(k,v)=>updateCos(cos._uid,k,v)}/>
                            <CosField label="EoT Days Granted" fkey="eot_days_granted" type="number" row={cos} onChange={(k,v)=>updateCos(cos._uid,k,v)}/>
                            <CosField label="Time Linked?" fkey="is_time_linked" options={[{v:"true",l:"Yes — EoT Linked"},{v:"false",l:"No"}]} row={{...cos, is_time_linked: String(cos.is_time_linked)}} onChange={(k,v)=>updateCos(cos._uid,k,v==="true")}/>
                          </div>
                          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:12}}>
                            <CosField label="Original End Date" fkey="original_end_date" type="date" row={cos} onChange={(k,v)=>updateCos(cos._uid,k,v)}/>
                            <CosField label="New End Date (after EoT)" fkey="new_end_date" type="date" row={cos} onChange={(k,v)=>updateCos(cos._uid,k,v)}/>
                            <CosField label="Revised Date (if different)" fkey="revised_date" type="date" row={cos} onChange={(k,v)=>updateCos(cos._uid,k,v)}/>
                          </div>
                          <div style={{marginTop:4,padding:"10px 14px",background:"rgba(13,33,55,.04)",borderRadius:8,display:"flex",gap:20,flexWrap:"wrap"}}>
                            <span style={{fontSize:11,color:C.text3}}>Amount: <strong style={{color:C.amber,fontFamily:"'DM Mono',monospace"}}>₹ {((parseFloat(cos.cos_amount)||0)/100).toFixed(2)} Cr</strong></span>
                            <span style={{fontSize:11,color:C.text3}}>Variation: <strong style={{color:(parseFloat(cos.cos_pct_variation)||0)>10?C.red:C.amber,fontFamily:"'DM Mono',monospace"}}>{cos.cos_pct_variation||0}%</strong></span>
                            <span style={{fontSize:11,color:C.text3}}>EoT: <strong style={{color:C.blue,fontFamily:"'DM Mono',monospace"}}>{cos.eot_days_granted||0} days</strong></span>
                            {cos.new_end_date&&<span style={{fontSize:11,color:C.text3}}>Revised End: <strong style={{color:C.red,fontFamily:"'DM Mono',monospace"}}>{cos.new_end_date}</strong></span>}
                          </div>
                        </div>
                      ))}

                      {projCos.length>0&&(
                        <div style={{background:C.amberSoft,border:`1px solid ${C.amber}30`,borderRadius:10,padding:"14px 18px",display:"flex",gap:28,flexWrap:"wrap",marginTop:4}}>
                          <span style={{fontSize:12,color:C.text2}}>📊 Total CoS Events: <strong style={{color:C.purple,fontFamily:"'DM Mono',monospace"}}>{projCos.length}</strong></span>
                          <span style={{fontSize:12,color:C.text2}}>💰 Cumulative CoS Value: <strong style={{color:C.amber,fontFamily:"'DM Mono',monospace"}}>₹ {(projCos.reduce((a,c)=>a+(parseFloat(c.cos_amount)||0),0)/100).toFixed(2)} Cr</strong></span>
                          <span style={{fontSize:12,color:C.text2}}>⏱ Total EoT: <strong style={{color:C.blue,fontFamily:"'DM Mono',monospace"}}>{projCos.reduce((a,c)=>a+(parseFloat(c.eot_days_granted)||0),0)} days</strong></span>
                          <span style={{fontSize:12,color:C.text2}}>📅 Latest Revised End: <strong style={{color:C.red,fontFamily:"'DM Mono',monospace"}}>{projCos.filter(c=>c.new_end_date).slice(-1)[0]?.new_end_date||"—"}</strong></span>
                        </div>
                      )}
                    </div>

                    {/* SECTION 05 — Contract & Financial Security */}
                    <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:"22px 24px",marginBottom:14}}>
                      <div style={{fontSize:12,fontWeight:700,color:C.navy,marginBottom:18,paddingBottom:10,borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:10}}>
                        <span style={{background:"#1F3A4A",color:"#93E4F4",borderRadius:6,padding:"2px 10px",fontSize:11,fontWeight:700}}>05</span>
                        Contract &amp; Financial Security
                        <span style={{fontSize:11,color:C.text3,fontWeight:400,marginLeft:4}}>— PBG, EMD, Payments &amp; Agreement details</span>
                      </div>

                      {/* Agreement */}
                      <div style={{fontSize:11,color:C.navy,fontWeight:700,textTransform:"uppercase",letterSpacing:".05em",marginBottom:10,display:"flex",alignItems:"center",gap:6}}>
                        <span style={{width:3,height:14,background:C.blue,borderRadius:2,display:"inline-block"}}/>
                        Agreement Details
                      </div>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16,marginBottom:20}}>
                        <MdField label="Agreement Number" fkey="agreement_number" form={mdInputForm} setForm={setMdInputForm}/>
                        <MdField label="Agreement Date" fkey="agreement_date" type="date" form={mdInputForm} setForm={setMdInputForm}/>
                        <MdField label="Appointed Date" fkey="appointed_date" type="date" form={mdInputForm} setForm={setMdInputForm}/>
                        <MdField label="Contract Value (₹ Lakhs)" fkey="contract_value_lakhs" type="number" form={mdInputForm} setForm={setMdInputForm}/>
                        <MdField label="Mobilization Advance (₹ Lakhs)" fkey="mobilization_advance_lakhs" type="number" form={mdInputForm} setForm={setMdInputForm}/>
                        <MdField label="Mob. Advance Recovered (₹ Lakhs)" fkey="mobilization_advance_recovered_lakhs" type="number" form={mdInputForm} setForm={setMdInputForm}/>
                      </div>

                      {/* PBG */}
                      <div style={{fontSize:11,color:C.navy,fontWeight:700,textTransform:"uppercase",letterSpacing:".05em",marginBottom:10,display:"flex",alignItems:"center",gap:6}}>
                        <span style={{width:3,height:14,background:C.purple,borderRadius:2,display:"inline-block"}}/>
                        Performance Bank Guarantee (PBG)
                      </div>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16,marginBottom:20}}>
                        <MdField label="PBG Number" fkey="pbg_number" form={mdInputForm} setForm={setMdInputForm}/>
                        <MdField label="PBG Amount (₹ Lakhs)" fkey="pbg_amount_lakhs" type="number" form={mdInputForm} setForm={setMdInputForm}/>
                        <MdField label="PBG Expiry Date" fkey="pbg_expiry_date" type="date" form={mdInputForm} setForm={setMdInputForm}/>
                        <MdField label="PBG Issuing Bank" fkey="pbg_bank" form={mdInputForm} setForm={setMdInputForm}/>
                      </div>

                      {/* EMD */}
                      <div style={{fontSize:11,color:C.navy,fontWeight:700,textTransform:"uppercase",letterSpacing:".05em",marginBottom:10,display:"flex",alignItems:"center",gap:6}}>
                        <span style={{width:3,height:14,background:C.amber,borderRadius:2,display:"inline-block"}}/>
                        Earnest Money Deposit (EMD)
                      </div>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16,marginBottom:20}}>
                        <MdField label="EMD Amount (₹ Lakhs)" fkey="emd_amount_lakhs" type="number" form={mdInputForm} setForm={setMdInputForm}/>
                        <MdField label="EMD Reference Number" fkey="emd_reference" form={mdInputForm} setForm={setMdInputForm}/>
                        <MdField label="EMD Date" fkey="emd_date" type="date" form={mdInputForm} setForm={setMdInputForm}/>
                      </div>

                      {/* Payments */}
                      <div style={{fontSize:11,color:C.navy,fontWeight:700,textTransform:"uppercase",letterSpacing:".05em",marginBottom:10,display:"flex",alignItems:"center",gap:6}}>
                        <span style={{width:3,height:14,background:C.green,borderRadius:2,display:"inline-block"}}/>
                        Payments to Contractor
                      </div>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16,marginBottom:12}}>
                        <MdField label="Total Payments Made (₹ Lakhs)" fkey="payments_made_lakhs" type="number" form={mdInputForm} setForm={setMdInputForm}/>
                        <MdField label="Last Payment Date" fkey="last_payment_date" type="date" form={mdInputForm} setForm={setMdInputForm}/>
                        <MdField label="Last RA Bill No." fkey="last_ra_bill_no" form={mdInputForm} setForm={setMdInputForm}/>
                        <MdField label="Retention Money Held (₹ Lakhs)" fkey="retention_money_lakhs" type="number" form={mdInputForm} setForm={setMdInputForm}/>
                      </div>

                      {/* Auto-computed summary */}
                      {(()=>{
                        const contractVal = parseFloat(mdInputForm.contract_value_lakhs)||0;
                        const paid = parseFloat(mdInputForm.payments_made_lakhs)||0;
                        const balance = contractVal - paid;
                        const pbgAmt = parseFloat(mdInputForm.pbg_amount_lakhs)||0;
                        const emdAmt = parseFloat(mdInputForm.emd_amount_lakhs)||0;
                        const pbgExpiry = mdInputForm.pbg_expiry_date;
                        const today = new Date().toISOString().slice(0,10);
                        const pbgExpired = pbgExpiry && pbgExpiry < today;
                        return (
                          <div style={{background:C.surfaceAlt,border:`1px solid ${C.border}`,borderRadius:10,padding:"14px 18px",display:"flex",gap:24,flexWrap:"wrap",marginTop:4}}>
                            <span style={{fontSize:12,color:C.text2}}>📋 Contract Value: <strong style={{color:C.navy,fontFamily:"'DM Mono',monospace"}}>₹ {(contractVal/100).toFixed(2)} Cr</strong></span>
                            <span style={{fontSize:12,color:C.text2}}>✅ Paid to Date: <strong style={{color:C.green,fontFamily:"'DM Mono',monospace"}}>₹ {(paid/100).toFixed(2)} Cr</strong></span>
                            <span style={{fontSize:12,color:C.text2}}>⏳ Balance: <strong style={{color:balance>0?C.amber:C.green,fontFamily:"'DM Mono',monospace"}}>₹ {(balance/100).toFixed(2)} Cr</strong></span>
                            <span style={{fontSize:12,color:C.text2}}>🔐 PBG: <strong style={{color:pbgExpired?C.red:C.purple,fontFamily:"'DM Mono',monospace"}}>₹ {(pbgAmt/100).toFixed(2)} Cr{pbgExpired?" ⚠ EXPIRED":""}</strong></span>
                            <span style={{fontSize:12,color:C.text2}}>💰 EMD: <strong style={{color:C.amber,fontFamily:"'DM Mono',monospace"}}>₹ {(emdAmt/100).toFixed(2)} Cr</strong></span>
                          </div>
                        );
                      })()}
                    </div>

                    {/* SECTION 06 — GIS / Location */}
                    <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:"22px 24px",marginBottom:20}}>
                      <div style={{fontSize:12,fontWeight:700,color:C.navy,marginBottom:18,paddingBottom:10,borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:10}}>
                        <span style={{background:"#2D1B4E",color:"#C4B0F8",borderRadius:6,padding:"2px 10px",fontSize:11,fontWeight:700}}>06</span>
                        GIS / Location
                      </div>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16}}>
                        <MdField label="Latitude" fkey="latitude" type="number" form={mdInputForm} setForm={setMdInputForm}/>
                        <MdField label="Longitude" fkey="longitude" type="number" form={mdInputForm} setForm={setMdInputForm}/>
                        <MdField label="Chainage / Route Reference" fkey="chainage" form={mdInputForm} setForm={setMdInputForm}/>
                      </div>
                    </div>

                    <div style={{display:"flex",gap:14,alignItems:"center",padding:"20px 0 10px",flexWrap:"wrap"}}>
                      <button className="btn-primary" style={{padding:"12px 36px",fontSize:14}} onClick={saveMdInputForm} disabled={saving}>{saving?"Saving…":"✓ Save All Changes"}</button>
                      <button className="btn-ghost" style={{padding:"12px 22px"}} onClick={()=>{setMdInputProject(null);setMdInputForm({});setSaveError(null);}} disabled={saving}>Cancel</button>
                      {mdInputSaved&&<span style={{color:C.green,fontSize:13,fontWeight:600}}>✓ Saved</span>}
                      {saveError&&<span style={{color:C.red,fontSize:12,fontWeight:600}}>{saveError}</span>}
                    </div>
                  </div>
                );
              })()}
            </div>
          );
        })()}

        {activeTab==="md_input"&&userRole!=="MD"&&(
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:320,gap:16}}>
            <div style={{fontSize:48}}>🔒</div>
            <div style={{fontSize:18,fontWeight:700,color:C.text1}}>Access Restricted</div>
            <div style={{fontSize:13,color:C.text3}}>The MD Input Sheet is accessible only to the Managing Director.</div>
          </div>
        )}

        {/* ── DISTRICTS ─────────────────────────────────────────────────── */}
        {activeTab==="districts"&&(
          <div>
            <h1 style={{fontSize:22,fontWeight:700,color:C.text1,fontFamily:"'DM Serif Display',serif",marginBottom:6}}>District-wise Project Overview</h1>
            <p style={{fontSize:13,color:C.text3,marginBottom:24}}>Click any district card to view its projects</p>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:14,marginBottom:28}}>
              {districts.map(d=>{
                const ontime=d.total-d.delayed;
                const pct=Math.round(ontime/d.total*100);
                return(
                  <div key={d.name} className="sector-card" onClick={()=>{setDistrictFilter(d.name);setActiveTab("projects");}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                      <div style={{fontSize:14,fontWeight:700,color:C.text1}}>📍 {d.name}</div>
                      <Badge color={C.blue}>{d.total}</Badge>
                    </div>
                    <div style={{display:"flex",gap:6,marginBottom:10}}>
                      <Badge color={C.green}>{ontime} on time</Badge>
                      {d.delayed>0&&<Badge color={C.red}>{d.delayed} delayed</Badge>}
                    </div>
                    <div style={{marginBottom:10}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{fontSize:11,color:C.text3}}>On-time rate</span><span style={{fontSize:11,fontFamily:"'DM Mono',monospace",color:pctColor(pct),fontWeight:600}}>{pct}%</span></div>
                      <Bar2 value={pct} color={pctColor(pct)}/>
                    </div>
                    <div style={{fontSize:11,color:C.text4,borderTop:`1px solid ${C.border}`,paddingTop:8}}>{fmtCr(d.cost)} sanctioned</div>
                  </div>
                );
              })}
            </div>
            <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,overflow:"hidden"}}>
              <div style={{padding:"14px 20px",borderBottom:`1px solid ${C.border}`,fontSize:13,fontWeight:600,color:C.text1}}>District Summary Table</div>
              <table>
                <thead><tr style={{background:C.surfaceAlt}}>
                  {["District","Total","On Time","Delayed","Sanctioned Cost","Action"].map(h=><th key={h} style={{padding:"10px 14px",fontSize:11,fontWeight:700,color:C.text2,letterSpacing:".05em",textTransform:"uppercase",borderBottom:`2px solid ${C.border}`}}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {districts.map(d=>(
                    <tr key={d.name}>
                      <td style={{fontWeight:600}}>📍 {d.name}</td>
                      <td><Badge color={C.blue}>{d.total}</Badge></td>
                      <td><Badge color={C.green}>{d.total-d.delayed}</Badge></td>
                      <td><Badge color={d.delayed>0?C.red:C.text3}>{d.delayed}</Badge></td>
                      <td style={{fontFamily:"'DM Mono',monospace",fontWeight:600,color:C.purple}}>{fmtCr(d.cost)}</td>
                      <td><button className="btn-ghost" onClick={()=>{setDistrictFilter(d.name);setActiveTab("projects");}}>View Projects →</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── CoS / EoT ─────────────────────────────────────────────────── */}
        {activeTab==="cos_eot"&&(
          <div>
            <h1 style={{fontSize:22,fontWeight:700,color:C.text1,fontFamily:"'DM Serif Display',serif",marginBottom:20}}>Change of Scope & Extension of Time</h1>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:24}}>
              <KpiCard label="Total CoS Events"  value={cosEotRows.length}                                   accent={C.purple} icon="📝"/>
              <KpiCard label="Total EoT Days"    value={`${cosEotRows.reduce((a,d)=>a+d.eot_days_granted,0)}d`} accent={C.amber}  icon="⏱"/>
              <KpiCard label="CoS Linked to EoT" value={`${cosEotRows.filter(d=>d.is_time_linked).length}`} accent={C.red}    icon="🔗"/>
              <KpiCard label="Filtered Variation" value={fmtLakhInt(totalVar)} sub="across filtered records" accent={C.green} icon="💹"/>
            </div>
            <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:"16px 20px",marginBottom:16,display:"flex",gap:16,alignItems:"flex-end",flexWrap:"wrap"}}>
              <div style={{display:"flex",flexDirection:"column",gap:5}}>
                <label style={{fontSize:11,color:C.text3,fontWeight:600,textTransform:"uppercase",letterSpacing:".05em"}}>Project</label>
                <select value={cosProjectFilter} onChange={e=>setCosProjectFilter(e.target.value)} style={{minWidth:260}}>
                  <option value="ALL">All Projects</option>
                  {projects.map(p=><option key={p.project_id} value={p.project_id}>{p.project_name}</option>)}
                </select>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:5}}>
                <label style={{fontSize:11,color:C.text3,fontWeight:600,textTransform:"uppercase",letterSpacing:".05em"}}>Category</label>
                <select value={cosCategoryFilter} onChange={e=>setCosCategoryFilter(e.target.value)}>
                  <option value="ALL">All Categories</option>
                  {cosCategories.map(c=><option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              {(cosProjectFilter!=="ALL"||cosCategoryFilter!=="ALL")&&<button className="btn-ghost" onClick={()=>{setCosProjectFilter("ALL");setCosCategoryFilter("ALL");}}>✕ Clear</button>}
              <div style={{marginLeft:"auto",background:C.amberSoft,border:`1px solid ${C.amber}30`,borderRadius:8,padding:"10px 18px"}}>
                <span style={{fontSize:11,color:C.amber,fontWeight:600}}>TOTAL VARIATION: </span>
                <span style={{fontFamily:"'DM Mono',monospace",fontSize:15,color:C.amber,fontWeight:700}}>{fmtLakhInt(totalVar)}</span>
              </div>
            </div>
            <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,overflow:"auto"}}>
              <table style={{minWidth:1100}}>
                <thead><tr style={{background:C.surfaceAlt}}>
                  {["Project","CoS No.","Date","Category","Cost Δ (₹ L)","Variation %","Cumul. Variation","EoT No.","Days Granted","Prev End","New End"].map(h=>(
                    <th key={h} style={{padding:"10px 14px",textAlign:"left",fontSize:11,fontWeight:700,color:C.text2,letterSpacing:".05em",textTransform:"uppercase",borderBottom:`2px solid ${C.border}`,whiteSpace:"nowrap"}}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {filteredCos.map((d,i)=>{
                    const proj=projects.find(p=>p.project_id===d.project_id);
                    const cumul=projVariation[d.project_id]||0;
                    return(
                      <tr key={i}>
                        <td><div style={{fontSize:10,color:C.text4,fontFamily:"'DM Mono',monospace"}}>{d.project_code}</div><div style={{fontSize:12,fontWeight:600,color:C.text1,marginTop:2}}>{proj?.project_name}</div></td>
                        <td><Pill color={C.purple}>{d.cos_number}</Pill></td>
                        <td style={{fontFamily:"'DM Mono',monospace",fontSize:12,color:C.text2}}>{d.cos_date}</td>
                        <td><Badge color={C.teal}>{d.cos_category}</Badge></td>
                        <td style={{fontFamily:"'DM Mono',monospace",fontSize:13,color:C.amber,fontWeight:600}}>{fmtLakhInt(d.cos_amount)}</td>
                        <td><Pill color={d.cos_pct_variation>10?C.red:C.amber}>{d.cos_pct_variation}%</Pill></td>
                        <td style={{fontFamily:"'DM Mono',monospace",fontSize:12,color:C.green,fontWeight:600}}>{fmtLakhInt(cumul)}</td>
                        <td>{d.is_time_linked?<Pill color={C.amber}>{d.eot_number}</Pill>:<span style={{color:C.text4}}>—</span>}</td>
                        <td style={{fontFamily:"'DM Mono',monospace",fontSize:12,color:C.blue,fontWeight:600}}>{d.eot_days_granted}d</td>
                        <td style={{fontFamily:"'DM Mono',monospace",fontSize:12,color:C.text4}}>{d.original_end_date}</td>
                        <td style={{fontFamily:"'DM Mono',monospace",fontSize:12,color:C.red,fontWeight:600}}>{d.new_end_date}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── MANAGEMENT ACTION ─────────────────────────────────────────── */}
        {activeTab==="mgmt_action"&&(
          <div>
            <div style={{marginBottom:24}}>
              <h1 style={{fontSize:22,fontWeight:700,color:C.text1,fontFamily:"'DM Serif Display',serif"}}>Management Action Required</h1>
              <p style={{fontSize:13,color:C.text3,marginTop:4}}>{managementFlags.length} open flags — sorted by severity and urgency</p>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:24}}>
              {[["CRITICAL",C.red],["HIGH",C.orange],["MEDIUM",C.amber],["LOW",C.text3]].map(([sev,col])=>(
                <div key={sev} style={{background:C.surface,border:`1px solid ${C.border}`,borderTop:`3px solid ${col}`,borderRadius:10,padding:"16px 18px"}}>
                  <div style={{fontSize:11,color:C.text3,fontWeight:600,textTransform:"uppercase",letterSpacing:".06em",marginBottom:8}}>{sev}</div>
                  <div style={{fontSize:28,fontWeight:700,color:col,fontFamily:"'DM Serif Display',serif"}}>{managementFlags.filter(f=>f.severity===sev).length}</div>
                </div>
              ))}
            </div>
            {/* Management Action Filter Bar */}
            <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:"14px 20px",marginBottom:16,display:"flex",gap:12,alignItems:"flex-end",flexWrap:"wrap"}}>
              <div style={{display:"flex",flexDirection:"column",gap:5}}>
                <label style={{fontSize:11,color:C.text3,fontWeight:600,textTransform:"uppercase",letterSpacing:".05em"}}>Severity</label>
                <select value={mgmtFilters.severity||"ALL"} onChange={e=>setMgmtFilters(f=>({...f,severity:e.target.value}))}>
                  <option value="ALL">All Severity</option>
                  {["CRITICAL","HIGH","MEDIUM","LOW"].map(s=><option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:5}}>
                <label style={{fontSize:11,color:C.text3,fontWeight:600,textTransform:"uppercase",letterSpacing:".05em"}}>Category</label>
                <select value={mgmtFilters.flag_category||"ALL"} onChange={e=>setMgmtFilters(f=>({...f,flag_category:e.target.value}))}>
                  <option value="ALL">All Categories</option>
                  {[...new Set(managementFlags.map(f=>f.flag_category))].map(c=><option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:5}}>
                <label style={{fontSize:11,color:C.text3,fontWeight:600,textTransform:"uppercase",letterSpacing:".05em"}}>Sector</label>
                <select value={mgmtFilters.sector_name||"ALL"} onChange={e=>setMgmtFilters(f=>({...f,sector_name:e.target.value}))}>
                  <option value="ALL">All Sectors</option>
                  {[...new Set(managementFlags.map(f=>f.sector_name))].map(s=><option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:5}}>
                <label style={{fontSize:11,color:C.text3,fontWeight:600,textTransform:"uppercase",letterSpacing:".05em"}}>ULB</label>
                <select value={mgmtFilters.ulb_name||"ALL"} onChange={e=>setMgmtFilters(f=>({...f,ulb_name:e.target.value}))}>
                  <option value="ALL">All ULBs</option>
                  {[...new Set(managementFlags.map(f=>f.ulb_name))].map(u=><option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              {Object.values(mgmtFilters).some(v=>v&&v!=="ALL")&&<button className="btn-ghost" onClick={()=>setMgmtFilters({})}>✕ Clear</button>}
              <div style={{marginLeft:"auto",fontSize:12,color:C.text3}}>{filteredMgmtFlags.length} of {managementFlags.length} flags shown</div>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              {filteredMgmtFlags.map(f=>(
                <div key={f.flag_id} style={{background:C.surface,border:`1px solid ${SEV_COLOR[f.severity]}30`,borderLeft:`4px solid ${SEV_COLOR[f.severity]}`,borderRadius:12,padding:"20px 24px",boxShadow:"0 1px 4px rgba(13,33,55,.05)"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
                    <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                      <Pill color={SEV_COLOR[f.severity]}>{f.severity}</Pill>
                      <Badge color={C.text2}>{f.flag_category}</Badge>
                      <Badge color={C.teal}>{f.sector_name}</Badge>
                      <Badge color={C.purple}>{f.ulb_name}</Badge>
                      {f.is_pre_monsoon&&<Pill color={C.red}>⛈ Pre-Monsoon</Pill>}
                    </div>
                    <span style={{fontFamily:"'DM Mono',monospace",fontSize:12,color:SEV_COLOR[f.severity],fontWeight:700,whiteSpace:"nowrap"}}>{f.days_open} days open</span>
                  </div>
                  <div style={{fontSize:10,color:C.text4,fontFamily:"'DM Mono',monospace",marginBottom:3}}>{f.project_code}</div>
                  <div style={{fontSize:14,fontWeight:700,color:C.text1,marginBottom:12}}>{f.project_name}</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                    <div style={{background:C.surfaceAlt,border:`1px solid ${C.border}`,borderRadius:8,padding:"12px 16px"}}>
                      <div style={{fontSize:10,color:C.text3,fontWeight:600,textTransform:"uppercase",letterSpacing:".06em",marginBottom:6}}>Issue</div>
                      <div style={{fontSize:13,color:C.text1}}>{f.flag_description}</div>
                    </div>
                    <div style={{background:C.blueSoft,border:`1px solid ${C.blue}20`,borderRadius:8,padding:"12px 16px"}}>
                      <div style={{fontSize:10,color:C.blue,fontWeight:600,textTransform:"uppercase",letterSpacing:".06em",marginBottom:6}}>Required Action</div>
                      <div style={{fontSize:13,color:C.text1}}>{f.action_required}</div>
                      <div style={{marginTop:8,fontSize:11,color:C.text3}}>Responsible: <span style={{color:C.text1,fontWeight:600}}>{f.responsible_dept}</span></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* ══ MODALS ════════════════════════════════════════════════════════════ */}

      {showActiveModal&&(
        <Modal title={`Active Projects — ${projects.length} total`} subtitle="Click any row to view project details" onClose={()=>setShowActiveModal(false)} width={1100}>
          <div style={{display:"flex",gap:10,marginBottom:16,alignItems:"center"}}>
            <input type="text" placeholder="Search…" value={activeModal.search} onChange={e=>activeModal.setSearch(e.target.value)} style={{flex:1}}/>
            <select value={activeDelayFilter} onChange={e=>setActiveDelayFilter(e.target.value)}>
              <option value="ALL">All Projects</option>
              <option value="DELAYED">Delayed Only</option>
            </select>
          </div>
          <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,overflow:"auto"}}>
            <table>
              <thead>
                <ModalFilterRow
                  columns={["Project","Sector","District","Phase","Physical %","Financial %","Delay","Delay Reason"]}
                  filterFields={[null,"sector_name","district","phase",null,null,"delay_days","delay_reason"]}
                  data={activeModal.rows} modalFilters={modalFilters} setModalFilters={setModalFilters}
                />
              </thead>
              <tbody>
                {activeModalRows.map(p=>(
                  <tr key={p.project_id} style={{cursor:"pointer"}} onClick={()=>{setShowActiveModal(false);goToProject(p);}}>
                    <td><div style={{fontSize:10,color:C.text4,fontFamily:"'DM Mono',monospace"}}>{p.project_code}</div><div style={{fontSize:13,fontWeight:600,color:C.text1}}>{p.project_name}</div></td>
                    <td><Badge color={C.teal}>{p.sector_icon} {p.sector_name}</Badge></td>
                    <td style={{fontSize:13,color:C.text2}}>{p.district}</td>
                    <td><Pill color={PHASE_COLOR[p.phase]||C.text3}>{p.phase}</Pill></td>
                    <td><span style={{fontFamily:"'DM Mono',monospace",fontSize:13,color:pctColor(p.actual_physical_pct),fontWeight:600}}>{p.actual_physical_pct}%</span></td>
                    <td><span style={{fontFamily:"'DM Mono',monospace",fontSize:13,color:pctColor(p.financial_progress_pct),fontWeight:600}}>{p.financial_progress_pct}%</span></td>
                    <td>{p.delay_days>0?<Pill color={C.red}>{p.delay_days}d late</Pill>:<Pill color={C.green}>On time</Pill>}</td>
                    <td style={{fontSize:12,color:C.red,maxWidth:180}}>{p.delay_reason||"—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{marginTop:10,fontSize:12,color:C.text3}}>Showing {activeModalRows.length} projects</div>
        </Modal>
      )}

      {showTendersModal&&(
        <Modal title={`Tender Works — ${tenderWorksProjects.length} Projects`} subtitle="Construction & maintenance projects in pre-construction phases" onClose={()=>setShowTendersModal(false)}>
          <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
            {ACTIVE_TENDER_PHASES.map(ph=>(
              <div key={ph} style={{background:PHASE_COLOR[ph]+"15",border:`1px solid ${PHASE_COLOR[ph]}30`,borderRadius:20,padding:"4px 14px",fontSize:12,color:PHASE_COLOR[ph],fontWeight:600}}>
                {ph}: {tenderWorksProjects.filter(p=>p.phase===ph).length}
              </div>
            ))}
          </div>
          <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,overflow:"auto"}}>
            <table>
              <thead>
                <ModalFilterRow
                  columns={["Project","Sector","District","Phase","Sanctioned Cost","Planned End"]}
                  filterFields={[null,"sector_name","district","phase",null,null]}
                  data={tenderWorksProjects} modalFilters={tenderFilters} setModalFilters={setTenderFilters}
                />
              </thead>
              <tbody>
                {filteredTenderProjects.map(p=>(
                  <tr key={p.project_id} style={{cursor:"pointer"}} onClick={()=>{setShowTendersModal(false);goToProject(p);}}>
                    <td><div style={{fontSize:10,color:C.text4,fontFamily:"'DM Mono',monospace"}}>{p.project_code}</div><div style={{fontSize:13,fontWeight:600,color:C.text1}}>{p.project_name}</div></td>
                    <td><Badge color={C.teal}>{p.sector_icon} {p.sector_name}</Badge></td>
                    <td style={{fontSize:13,color:C.text2}}>{p.district}</td>
                    <td><Pill color={PHASE_COLOR[p.phase]||C.text3}>{p.phase}</Pill></td>
                    <td style={{fontFamily:"'DM Mono',monospace",fontSize:13,color:C.purple,fontWeight:600}}>{fmtCr(p.current_sanctioned_cost)}</td>
                    <td style={{fontFamily:"'DM Mono',monospace",fontSize:12,color:C.text3}}>{p.planned_end_date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Modal>
      )}

      {/* ── STAGE DRILL-DOWN MODAL ───────────────────────────────────────── */}
      {selectedStage&&(()=>{
        const col      = PHASE_COLOR[selectedStage]||C.blue;
        const colLight = col+"12";
        const colMid   = col+"28";
        const phaseInfo = PHASE_ACTIVITIES[selectedStage];

        const allStageProjs = projects.filter(p=>p.phase===selectedStage).map(p=>({
          ...p,
          milestone: getProjectMilestone(p),
        }));

        const uniqVals = field => [...new Set(allStageProjs.map(p=>String(p[field]||"")))].filter(Boolean).sort();

        let filtered = allStageProjs.filter(p=>{
          return Object.entries(stageModalFilters).every(([k,v])=>{
            if(!v||v==="ALL") return true;
            if(k==="milestone_name") return p.milestone?.name===v;
            if(k==="delay_bucket"){
              if(v==="On Time") return p.delay_days===0;
              if(v==="1–30 d") return p.delay_days>=1&&p.delay_days<=30;
              if(v==="31–90 d") return p.delay_days>=31&&p.delay_days<=90;
              if(v===">90 d") return p.delay_days>90;
            }
            if(k==="cost_bucket"){
              const cr=p.current_sanctioned_cost/100;
              if(v==="<50 Cr") return cr<50;
              if(v==="50–200 Cr") return cr>=50&&cr<200;
              if(v===">200 Cr") return cr>=200;
            }
            if(k==="physical_bucket"){
              const pp=p.actual_physical_pct;
              if(v==="0%") return pp===0;
              if(v==="1–50%") return pp>=1&&pp<=50;
              if(v==="51–75%") return pp>=51&&pp<=75;
              if(v===">75%") return pp>75;
            }
            return String(p[k]||"")===v;
          });
        });

        const {field:sf, dir:sd} = stageModalSort;
        filtered = [...filtered].sort((a,b)=>{
          const av=a[sf]??"", bv=b[sf]??"";
          const cmp = typeof av==="number" ? av-bv : String(av).localeCompare(String(bv));
          return sd==="asc"?cmp:-cmp;
        });

        const totalSanct = allStageProjs.reduce((a,p)=>a+p.current_sanctioned_cost,0);
        const delayed    = allStageProjs.filter(p=>p.delay_days>0).length;
        const hasFilters = Object.values(stageModalFilters).some(v=>v&&v!=="ALL");
        const sfProps    = { col, stageModalFilters, setStageModalFilters, stageModalSort, setStageModalSort };

        return (
          <Modal
            title={`${selectedStage} Stage — ${allStageProjs.length} Projects`}
            subtitle={phaseInfo?.label||""}
            onClose={()=>setSelectedStage(null)}
            width={1160}
          >
            {/* Summary strip */}
            <div style={{display:"flex",gap:10,marginBottom:20,flexWrap:"wrap"}}>
              {[
                {label:`${allStageProjs.length} Total`,      bg:colLight,       border:colMid,           color:col},
                {label:`${fmtCr(totalSanct)} Sanctioned`,   bg:C.purpleSoft,   border:C.purple+"30",    color:C.purple},
                {label:`${delayed} Delayed`,                 bg:C.redSoft,      border:C.red+"30",       color:C.red,   hide:delayed===0},
                {label:`${allStageProjs.length-delayed} On Track`, bg:C.greenSoft, border:C.green+"30", color:C.green},
              ].filter(x=>!x.hide).map((x,i)=>(
                <div key={i} style={{background:x.bg,border:`1px solid ${x.border}`,borderRadius:20,padding:"5px 16px",fontSize:12,color:x.color,fontWeight:700}}>{x.label}</div>
              ))}
              {hasFilters&&(
                <button onClick={()=>setStageModalFilters({})}
                  style={{background:"none",border:`1px solid ${C.border}`,color:C.red,borderRadius:20,padding:"4px 14px",fontSize:11,fontWeight:700,cursor:"pointer"}}>
                  ✕ Clear Filters
                </button>
              )}
            </div>

            {/* Phase activity checklist */}
            {phaseInfo&&(
              <div style={{background:colLight,border:`1px solid ${colMid}`,borderRadius:12,padding:"16px 18px",marginBottom:20}}>
                <div style={{fontSize:11,fontWeight:700,color:col,marginBottom:12,textTransform:"uppercase",letterSpacing:".07em"}}>
                  📋 {phaseInfo.label} — Activity Checklist
                </div>
                <div style={{overflowX:"auto"}}>
                  <table style={{width:"100%",borderCollapse:"collapse"}}>
                    <thead>
                      <tr>
                        {["#","Activity / Milestone","Typical Status","Timeline","Key Document"].map(h=>(
                          <th key={h} style={{padding:"6px 12px",fontSize:10,fontWeight:700,color:C.text3,letterSpacing:".05em",textTransform:"uppercase",borderBottom:`1px solid ${colMid}`,textAlign:"left",background:col+"08",whiteSpace:"nowrap"}}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {phaseInfo.activities.map((act,i)=>{
                        const projs = filtered.filter(p=>p.milestone?.name===act.name);
                        return (
                          <tr key={i} style={{borderBottom:`1px solid ${col}10`,background:i%2===0?"transparent":col+"05"}}>
                            <td style={{padding:"7px 12px",fontSize:11,color:col,fontFamily:"'DM Mono',monospace",fontWeight:700}}>{i+1}</td>
                            <td style={{padding:"7px 12px"}}>
                              <div style={{fontSize:12,color:C.text1,fontWeight:600}}>{act.name}</div>
                              {projs.length>0&&(
                                <div style={{fontSize:10,color:col,marginTop:2,fontWeight:600}}>
                                  {projs.length} project{projs.length>1?"s":""}: {projs.map(p=>p.project_name).join(", ").slice(0,90)}{projs.map(p=>p.project_name).join(", ").length>90?"…":""}
                                </div>
                              )}
                            </td>
                            <td style={{padding:"7px 12px"}}>
                              <span style={{background:col,color:"#fff",borderRadius:10,padding:"2px 10px",fontSize:10,fontWeight:700}}>{act.statusOptions}</span>
                            </td>
                            <td style={{padding:"7px 12px",fontSize:11,color:C.text3,fontFamily:"'DM Mono',monospace",whiteSpace:"nowrap"}}>{act.timeline}</td>
                            <td style={{padding:"7px 12px",fontSize:11,color:C.text2}}>{act.keyDoc}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Projects table with column filters */}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <div style={{fontSize:12,fontWeight:700,color:C.text1}}>
                Projects in this Stage
                {hasFilters&&<span style={{fontWeight:400,color:C.text3,marginLeft:6}}>({filtered.length} of {allStageProjs.length} shown)</span>}
              </div>
            </div>
            <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,overflow:"auto",maxHeight:380}}>
              <table style={{width:"100%",borderCollapse:"collapse",minWidth:1000}}>
                <thead>
                  <tr>
                    <StageColFilter label="Code"       fKey="project_code"    opts={uniqVals("project_code")}  {...sfProps}/>
                    <StageColFilter label="Project"    fKey="project_name"    opts={uniqVals("project_name")}  {...sfProps}/>
                    <StageColFilter label="Sector"     fKey="sector_name"     opts={uniqVals("sector_name")}   {...sfProps}/>
                    <StageColFilter label="District"   fKey="district"        opts={uniqVals("district")}      {...sfProps}/>
                    <StageColFilter label="Cost"       fKey="cost_bucket"     opts={["<50 Cr","50–200 Cr",">200 Cr"]} {...sfProps}/>
                    <StageColFilter label="Physical %" fKey="physical_bucket" opts={["0%","1–50%","51–75%",">75%"]}   {...sfProps}/>
                    <StageColFilter label="Delay"      fKey="delay_bucket"    opts={["On Time","1–30 d","31–90 d",">90 d"]} {...sfProps}/>
                    <StageColFilter label="Status"     fKey="status"          opts={uniqVals("status")}        {...sfProps}/>
                    <StageColFilter label="Milestone"  fKey="milestone_name"  opts={phaseInfo?.activities.map(a=>a.name)||[]} {...sfProps}/>
                    <th style={{padding:"9px 10px",background:C.surfaceAlt,borderBottom:`2px solid ${col}40`,fontSize:10,fontWeight:700,color:C.text2,letterSpacing:".04em",textTransform:"uppercase",whiteSpace:"nowrap",position:"sticky",top:0,zIndex:6}}>REMARKS</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p,idx)=>{
                    const ms = p.milestone;
                    return (
                      <tr key={p.project_id} style={{borderBottom:`1px solid ${C.border}`,background:idx%2===0?C.surface:C.surfaceAlt}}>
                        <td style={{padding:"8px 10px",fontFamily:"'DM Mono',monospace",fontSize:10,color:C.text4,whiteSpace:"nowrap"}}>{p.project_code}</td>
                        <td style={{padding:"8px 10px",minWidth:180}}>
                          <div style={{fontSize:12,fontWeight:600,color:C.blue,cursor:"pointer"}}
                            onClick={()=>{setSelectedStage(null);goToProject(p);}}>
                            {p.project_name}
                          </div>
                          <div style={{fontSize:10,color:C.text4,marginTop:1}}>{p.ulb_name}</div>
                        </td>
                        <td style={{padding:"8px 10px"}}><Badge color={C.teal}>{p.sector_icon} {p.sector_name}</Badge></td>
                        <td style={{padding:"8px 10px",fontSize:11,color:C.text2,whiteSpace:"nowrap"}}>{p.district}</td>
                        <td style={{padding:"8px 10px",fontFamily:"'DM Mono',monospace",fontSize:11,color:C.purple,fontWeight:700,whiteSpace:"nowrap"}}>{fmtCr(p.current_sanctioned_cost)}</td>
                        <td style={{padding:"8px 10px"}}>
                          <span style={{fontFamily:"'DM Mono',monospace",fontSize:12,fontWeight:700,color:pctColor(p.actual_physical_pct)}}>{p.actual_physical_pct}%</span>
                        </td>
                        <td style={{padding:"8px 10px",whiteSpace:"nowrap"}}>
                          {p.delay_days>0
                            ? <span style={{background:C.redSoft,color:C.red,borderRadius:10,padding:"2px 8px",fontSize:10,fontWeight:700}}>{p.delay_days}d ⚠</span>
                            : <span style={{background:C.greenSoft,color:C.green,borderRadius:10,padding:"2px 8px",fontSize:10,fontWeight:600}}>On Time</span>}
                        </td>
                        <td style={{padding:"8px 10px"}}>
                          <Pill color={p.status==="STALLED"?C.red:p.status==="TENDERING"?C.teal:C.green}>{p.status.replace(/_/g," ")}</Pill>
                        </td>
                        <td style={{padding:"8px 10px",minWidth:200}}>
                          {ms ? (
                            <div style={{background:col+"12",border:`1px solid ${col}30`,borderRadius:8,padding:"4px 10px"}}>
                              <div style={{fontSize:9,color:col,fontWeight:700,textTransform:"uppercase",letterSpacing:".05em"}}>Step {ms.index}/{ms.total}</div>
                              <div style={{fontSize:11,color:C.text1,fontWeight:600,marginTop:1,lineHeight:1.3}}>{ms.name}</div>
                              <div style={{fontSize:10,color:C.text3,marginTop:2}}>{ms.keyDoc}</div>
                            </div>
                          ) : <span style={{fontSize:11,color:C.text4}}>—</span>}
                        </td>
                        <td style={{padding:"6px 8px",minWidth:170}}>
                          <input type="text" placeholder="Add remark…"
                            value={projectRemarks[p.project_id]||""}
                            onChange={e=>setProjectRemarks(r=>({...r,[p.project_id]:e.target.value}))}
                            style={{width:"100%",fontSize:11,padding:"5px 8px",border:`1px solid ${projectRemarks[p.project_id]?col:C.border}`,borderRadius:6,color:C.text1,background:projectRemarks[p.project_id]?col+"0E":C.surface,outline:"none",transition:"all .2s"}}
                            onFocus={e=>{e.target.style.borderColor=col;e.target.style.boxShadow=`0 0 0 2px ${col}20`;}}
                            onBlur={e=>{e.target.style.borderColor=projectRemarks[p.project_id]?col:C.border;e.target.style.boxShadow="none";}}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div style={{fontSize:10,color:C.text4,marginTop:8}}>
              💡 Click column headers to sort · use ▿ dropdowns to filter · click project name to open detail · remarks persist in session
            </div>
          </Modal>
        );
      })()}

      {showServiceTendersModal&&(
        <Modal title={`Tender Services — ${PSO_PMU_TENDERS.length} Tenders`} subtitle="PSO / PMU consultancy & advisory tenders" onClose={()=>setShowServiceTendersModal(false)} width={1050}>
          <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,overflow:"auto"}}>
            <table style={{minWidth:980}}>
              <thead>
                <tr style={{background:C.surfaceAlt}}>
                  {["Tender Ref","Tender Name","District","Category","Est. Cost (₹ L)","Floated","Status","Type"].map(h=>(
                    <th key={h} style={{padding:"10px 14px",textAlign:"left",fontSize:11,fontWeight:700,color:C.text2,letterSpacing:".05em",textTransform:"uppercase",borderBottom:`2px solid ${C.border}`,whiteSpace:"nowrap"}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PSO_PMU_TENDERS.map(t=>(
                  <tr key={t.tender_id}>
                    <td style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:C.text4}}>{t.tender_ref}</td>
                    <td style={{fontWeight:600,color:C.text1,maxWidth:360}}>{t.tender_name}</td>
                    <td style={{fontSize:12,color:C.text2}}>{t.district}</td>
                    <td><Badge color={C.teal}>{t.category}</Badge></td>
                    <td style={{fontFamily:"'DM Mono',monospace",fontSize:12,color:C.purple,fontWeight:700}}>{fmtLakhInt(t.estimated_cost_lakhs)}</td>
                    <td style={{fontFamily:"'DM Mono',monospace",fontSize:12,color:C.text3}}>{t.floated_date}</td>
                    <td><Pill color={PHASE_COLOR[t.status]||C.blue}>{t.status}</Pill></td>
                    <td><Badge color={C.text3}>{t.agency_type}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Modal>
      )}

      {showPhysProgressModal&&(()=>{
        const allProj     = projects;
        const avgPhysAll  = allProj.length>0?+(allProj.reduce((a,p)=>a+p.actual_physical_pct,0)/allProj.length).toFixed(1):0;
        const avgSchedAll = allProj.length>0?+(allProj.reduce((a,p)=>a+p.scheduled_physical_pct,0)/allProj.length).toFixed(1):0;
        const behindCount  = allProj.filter(p=>p.actual_physical_pct<p.scheduled_physical_pct&&p.scheduled_physical_pct>0).length;
        const stalledCount = allProj.filter(p=>p.status==="STALLED").length;
        const GapBadge = ({gap}) => {
          if(gap>0)  return <span style={{background:C.greenSoft,color:C.green,border:`1px solid ${C.green}30`,borderRadius:4,padding:"2px 8px",fontSize:10,fontWeight:700}}>▲ +{gap}%</span>;
          if(gap<0)  return <span style={{background:C.redSoft,color:C.red,border:`1px solid ${C.red}30`,borderRadius:4,padding:"2px 8px",fontSize:10,fontWeight:700}}>▼ {gap}%</span>;
          return <span style={{background:C.surfaceAlt,color:C.text3,border:`1px solid ${C.border}`,borderRadius:4,padding:"2px 8px",fontSize:10,fontWeight:700}}>= 0%</span>;
        };
        const DualBar = ({act,sch,height=10}) => (
          <div style={{position:"relative",background:"#E8EBF2",borderRadius:4,height,overflow:"hidden",minWidth:80}}>
            <div style={{position:"absolute",left:0,top:0,height:"100%",width:`${Math.min(sch,100)}%`,background:`${C.blue}28`,borderRadius:4}}/>
            <div style={{position:"absolute",left:0,top:0,height:"100%",width:`${Math.min(act,100)}%`,background:pctColor(act),borderRadius:4,transition:"width .5s"}}/>
            {sch>0&&sch<=100&&<div style={{position:"absolute",top:0,left:`${sch}%`,width:1.5,height:"100%",background:C.blue,opacity:.8,transform:"translateX(-1px)"}}/>}
          </div>
        );
        const sectorRows = sectorCards.map(s=>{
          const sProjs   = allProj.filter(p=>p.sector_code===s.sector_code);
          const act      = sProjs.length>0?+(sProjs.reduce((a,p)=>a+p.actual_physical_pct,0)/sProjs.length).toFixed(1):0;
          const sch      = sProjs.length>0?+(sProjs.reduce((a,p)=>a+p.scheduled_physical_pct,0)/sProjs.length).toFixed(1):0;
          const delayed  = sProjs.filter(p=>p.delay_days>0).length;
          const stalled  = sProjs.filter(p=>p.status==="STALLED").length;
          const completed= sProjs.filter(p=>p.status==="COMPLETED").length;
          const inProg   = sProjs.filter(p=>p.status==="IN_PROGRESS").length;
          const gap      = +(act-sch).toFixed(1);
          return {...s, act, sch, gap, delayed, stalled, completed, inProg, count:sProjs.length};
        });
        const districtNames = [...new Set(allProj.map(p=>p.district))].sort();
        const distRows = districtNames.map(d=>{
          const dProjs  = allProj.filter(p=>p.district===d);
          const act     = dProjs.length>0?+(dProjs.reduce((a,p)=>a+p.actual_physical_pct,0)/dProjs.length).toFixed(1):0;
          const sch     = dProjs.length>0?+(dProjs.reduce((a,p)=>a+p.scheduled_physical_pct,0)/dProjs.length).toFixed(1):0;
          const delayed = dProjs.filter(p=>p.delay_days>0).length;
          const stalled = dProjs.filter(p=>p.status==="STALLED").length;
          const sectors = [...new Set(dProjs.map(p=>p.sector_name))].join(", ");
          const gap     = +(act-sch).toFixed(1);
          return {district:d, act, sch, gap, delayed, stalled, sectors, count:dProjs.length};
        });
        return (
          <Modal
            title="📐 Portfolio Physical Progress"
            subtitle={`Overall actual ${avgPhysAll}% vs scheduled ${avgSchedAll}% · ${allProj.length} projects across ${districtNames.length} districts`}
            onClose={()=>{setShowPhysProgressModal(false);setPhysTab("sector");setPhysSectSearch("");setPhysSectStatusF("ALL");setPhysSectSelected(null);setPhysDistSearch("");setPhysDistStatusF("ALL");}}
            width={1180}
          >
            {/* KPI Strip */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:10,marginBottom:20}}>
              {[
                ["Portfolio Actual",    `${avgPhysAll}%`,  pctColor(avgPhysAll)],
                ["Portfolio Scheduled", `${avgSchedAll}%`, C.blue],
                ["Overall Variance",    `${avgPhysAll>=avgSchedAll?"+":""}${+(avgPhysAll-avgSchedAll).toFixed(1)}%`, avgPhysAll>=avgSchedAll?C.green:C.red],
                ["Behind Schedule",    behindCount,  C.orange],
                ["Stalled Projects",   stalledCount, C.red],
              ].map(([lbl,val,col])=>(
                <div key={lbl} style={{background:col+"14",border:`1px solid ${col}30`,borderRadius:8,padding:"11px 14px",textAlign:"center"}}>
                  <div style={{fontSize:9,color:C.text3,fontWeight:700,textTransform:"uppercase",letterSpacing:".07em",marginBottom:4}}>{lbl}</div>
                  <div style={{fontFamily:"'DM Mono',monospace",fontSize:20,fontWeight:800,color:col,lineHeight:1}}>{val}</div>
                </div>
              ))}
            </div>
            {/* Overall bar */}
            <div style={{background:C.surfaceAlt,border:`1px solid ${C.border}`,borderRadius:10,padding:"16px 20px",marginBottom:20}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                <span style={{fontSize:13,fontWeight:700,color:C.text1}}>Overall Portfolio Physical Progress</span>
                <div style={{display:"flex",gap:14}}>
                  <span style={{fontSize:11,color:C.text3,display:"flex",alignItems:"center",gap:5}}>
                    <span style={{width:14,height:8,borderRadius:2,background:pctColor(avgPhysAll),display:"inline-block"}}/> Actual <b style={{color:pctColor(avgPhysAll)}}>{avgPhysAll}%</b>
                  </span>
                  <span style={{fontSize:11,color:C.text3,display:"flex",alignItems:"center",gap:5}}>
                    <span style={{width:2,height:14,background:C.blue,display:"inline-block",opacity:.8}}/> Scheduled <b style={{color:C.blue}}>{avgSchedAll}%</b>
                  </span>
                </div>
              </div>
              <div style={{position:"relative",background:"rgba(13,33,55,.09)",borderRadius:8,height:22,overflow:"hidden"}}>
                <div style={{position:"absolute",left:0,top:0,height:"100%",width:`${avgSchedAll}%`,background:`${C.blue}28`,borderRadius:8,transition:"width .8s"}}/>
                <div style={{position:"absolute",left:0,top:0,height:"100%",width:`${avgPhysAll}%`,background:`linear-gradient(90deg,${pctColor(avgPhysAll)},${pctColor(avgPhysAll)}CC)`,borderRadius:8,transition:"width .8s",display:"flex",alignItems:"center",justifyContent:"flex-end",paddingRight:8}}>
                  {avgPhysAll>8&&<span style={{fontFamily:"'DM Mono',monospace",fontSize:11,fontWeight:800,color:"white"}}>{avgPhysAll}%</span>}
                </div>
                {avgSchedAll>0&&<div style={{position:"absolute",top:0,left:`${avgSchedAll}%`,width:2,height:"100%",background:C.blue,opacity:.8,transform:"translateX(-1px)"}}/>}
              </div>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:C.text4,marginTop:5}}>
                <span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span>
              </div>
            </div>
            {/* Tabs */}
            <div style={{display:"flex",gap:6,marginBottom:16,borderBottom:`2px solid ${C.border}`,paddingBottom:0}}>
              {[["sector","🏗 By Sector"],["district","📍 By District"]].map(([id,lbl])=>(
                <button key={id} onClick={()=>setPhysTab(id)}
                  style={{padding:"8px 18px",fontSize:12,fontWeight:600,borderRadius:"8px 8px 0 0",cursor:"pointer",
                    border:`1px solid ${physTab===id?C.blue:C.border}`,borderBottom:"none",
                    background:physTab===id?C.blue:"transparent",
                    color:physTab===id?"white":C.text2,marginBottom:-2,transition:"all .15s"}}>
                  {lbl}
                </button>
              ))}
            </div>
            {/* SECTOR TAB */}
            {physTab==="sector"&&(()=>{
              const filtered = sectorRows.filter(s=>{
                const statusOk = physSectStatusF==="ALL"||(physSectStatusF==="behind"&&s.gap<0)||(physSectStatusF==="ahead"&&s.gap>=0)||(physSectStatusF==="stalled"&&s.stalled>0);
                return statusOk&&(!physSectSearch||s.sector_name.toLowerCase().includes(physSectSearch.toLowerCase()));
              });
              const sorted = [...filtered].sort((a,b)=>{
                if(physSectSort==="gap_asc")  return a.gap-b.gap;
                if(physSectSort==="gap_desc") return b.gap-a.gap;
                if(physSectSort==="act_desc") return b.act-a.act;
                if(physSectSort==="act_asc")  return a.act-b.act;
                return a.sector_name.localeCompare(b.sector_name);
              });
              return (
                <div>
                  <div style={{display:"flex",gap:10,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
                    <input type="text" placeholder="Search sector…" value={physSectSearch} onChange={e=>setPhysSectSearch(e.target.value)}
                      style={{padding:"6px 12px",fontSize:12,border:`1px solid ${C.border}`,borderRadius:7,outline:"none",width:180}}/>
                    <select value={physSectStatusF} onChange={e=>setPhysSectStatusF(e.target.value)}
                      style={{padding:"6px 10px",fontSize:12,border:`1px solid ${C.border}`,borderRadius:7,outline:"none",background:C.surface,cursor:"pointer"}}>
                      <option value="ALL">All Sectors</option>
                      <option value="behind">Behind Schedule</option>
                      <option value="ahead">On / Ahead</option>
                      <option value="stalled">Has Stalled Projects</option>
                    </select>
                    <select value={physSectSort} onChange={e=>setPhysSectSort(e.target.value)}
                      style={{padding:"6px 10px",fontSize:12,border:`1px solid ${C.border}`,borderRadius:7,outline:"none",background:C.surface,cursor:"pointer"}}>
                      <option value="gap_asc">Sort: Worst First</option>
                      <option value="gap_desc">Sort: Best First</option>
                      <option value="act_desc">Actual % High→Low</option>
                      <option value="act_asc">Actual % Low→High</option>
                      <option value="name_asc">Name A→Z</option>
                    </select>
                    <span style={{fontSize:11,color:C.text3,marginLeft:"auto"}}>{sorted.length} of {sectorRows.length} sectors</span>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:10}}>
                    {sorted.map(s=>{
                      const isExpanded = physSectSelected===s.sector_code;
                      const sectorProjects = allProj.filter(p=>p.sector_code===s.sector_code);
                      return (
                        <div key={s.sector_code}>
                          <div
                            onClick={()=>setPhysSectSelected(isExpanded?null:s.sector_code)}
                            onMouseEnter={e=>{if(!isExpanded){e.currentTarget.style.boxShadow="0 4px 12px rgba(13,33,55,.10)";e.currentTarget.style.borderColor=C.blue+"60";}}}
                            onMouseLeave={e=>{if(!isExpanded){e.currentTarget.style.boxShadow="none";e.currentTarget.style.borderColor=s.gap<0?C.red+"40":C.border;}}}
                            style={{background:isExpanded?C.navy:C.surfaceAlt,border:`1px solid ${isExpanded?C.navy:s.gap<0?C.red+"40":C.border}`,borderRadius:isExpanded?"10px 10px 0 0":10,padding:"14px 18px",transition:"all .18s",cursor:"pointer"}}>
                            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                              <div>
                                <span style={{fontSize:13,fontWeight:700,color:isExpanded?"white":C.text1}}>{s.sector_icon} {s.sector_name}</span>
                                <span style={{fontSize:11,color:isExpanded?"rgba(255,255,255,.6)":C.text3,marginLeft:10}}>{s.count} projects</span>
                              </div>
                              <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap",justifyContent:"flex-end"}}>
                                {s.stalled>0&&<span style={{fontSize:10,background:isExpanded?"rgba(255,255,255,.15)":C.redSoft,color:isExpanded?"#FCA5A5":C.red,border:`1px solid ${isExpanded?"rgba(255,255,255,.2)":C.red+"30"}`,borderRadius:4,padding:"2px 8px",fontWeight:700}}>{s.stalled} STALLED</span>}
                                {s.delayed>0&&<span style={{fontSize:10,background:isExpanded?"rgba(255,255,255,.15)":C.amberSoft,color:isExpanded?"#FCD34D":C.amber,border:`1px solid ${isExpanded?"rgba(255,255,255,.2)":C.amber+"30"}`,borderRadius:4,padding:"2px 8px",fontWeight:700}}>{s.delayed} DELAYED</span>}
                                <GapBadge gap={s.gap}/>
                                <span style={{fontSize:11,color:isExpanded?"rgba(255,255,255,.7)":C.text4,marginLeft:4}}>{isExpanded?"▲":"▼"}</span>
                              </div>
                            </div>
                            <DualBar act={s.act} sch={s.sch} height={14}/>
                            <div style={{display:"flex",justifyContent:"space-between",marginTop:7,fontSize:11,color:isExpanded?"rgba(255,255,255,.65)":C.text3}}>
                              <span>Actual: <b style={{fontFamily:"'DM Mono',monospace",color:isExpanded?"white":pctColor(s.act)}}>{s.act}%</b></span>
                              <span>Scheduled: <b style={{fontFamily:"'DM Mono',monospace",color:isExpanded?"#93C5FD":C.blue}}>{s.sch}%</b></span>
                              <span>In Progress: <b style={{color:isExpanded?"white":C.text1}}>{s.inProg}</b></span>
                              <span>Completed: <b style={{color:isExpanded?"#86EFAC":C.green}}>{s.completed}</b></span>
                              {!isExpanded&&<span style={{fontSize:10,color:C.blue,fontWeight:600}}>Click to view projects →</span>}
                            </div>
                          </div>
                          {isExpanded&&(
                            <div style={{border:`1px solid ${C.navy}`,borderTop:"none",borderRadius:"0 0 10px 10px",overflow:"hidden",background:C.surface}}>
                              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 16px",background:C.surfaceAlt,borderBottom:`1px solid ${C.border}`}}>
                                <span style={{fontSize:11,fontWeight:700,color:C.navy,textTransform:"uppercase",letterSpacing:".06em"}}>{s.sector_icon} {s.sector_name} — All {sectorProjects.length} Projects</span>
                                <span style={{fontSize:10,color:C.blue,fontWeight:600}}>Click project name to open details</span>
                              </div>
                              <div style={{overflowX:"auto",maxHeight:320,overflowY:"auto"}}>
                                <table style={{width:"100%",borderCollapse:"collapse",minWidth:720}}>
                                  <thead>
                                    <tr style={{background:C.surfaceAlt,position:"sticky",top:0,zIndex:2}}>
                                      {["Code","Project Name","District","Phase","Actual %","Scheduled %","Gap","Status"].map(h=>(
                                        <th key={h} style={{padding:"8px 12px",fontSize:10,fontWeight:700,color:C.text2,textTransform:"uppercase",letterSpacing:".05em",borderBottom:`2px solid ${C.border}`,whiteSpace:"nowrap",textAlign:"left"}}>{h}</th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {sectorProjects.map((p,idx)=>{
                                      const gap=+(p.actual_physical_pct-p.scheduled_physical_pct).toFixed(1);
                                      return (
                                        <tr key={p.project_id} style={{borderBottom:`1px solid ${C.border}`,background:idx%2===0?C.surface:C.surfaceAlt}}>
                                          <td style={{padding:"8px 12px",fontFamily:"'DM Mono',monospace",fontSize:10,color:C.text4,whiteSpace:"nowrap"}}>{p.project_code}</td>
                                          <td style={{padding:"8px 12px",minWidth:180}}>
                                            <div onClick={()=>{setPhysSectSelected(null);setShowPhysProgressModal(false);goToProject(p);}}
                                              style={{fontSize:12,fontWeight:600,color:C.blue,cursor:"pointer",textDecoration:"underline",textUnderlineOffset:2}}>{p.project_name}</div>
                                            <div style={{fontSize:10,color:C.text4,marginTop:1}}>{p.ulb_name}</div>
                                          </td>
                                          <td style={{padding:"8px 12px",fontSize:11,color:C.text2,whiteSpace:"nowrap"}}>{p.district}</td>
                                          <td style={{padding:"8px 12px"}}><span style={{background:(PHASE_COLOR[p.phase]||C.text3)+"20",color:PHASE_COLOR[p.phase]||C.text3,borderRadius:4,padding:"2px 8px",fontSize:10,fontWeight:600,whiteSpace:"nowrap"}}>{p.phase}</span></td>
                                          <td style={{padding:"8px 12px",fontFamily:"'DM Mono',monospace",fontSize:12,fontWeight:700,color:pctColor(p.actual_physical_pct)}}>{p.actual_physical_pct}%</td>
                                          <td style={{padding:"8px 12px",fontFamily:"'DM Mono',monospace",fontSize:11,color:C.blue}}>{p.scheduled_physical_pct}%</td>
                                          <td style={{padding:"8px 12px"}}><GapBadge gap={gap}/></td>
                                          <td style={{padding:"8px 12px"}}><span style={{background:p.status==="STALLED"?C.redSoft:p.status==="COMPLETED"?C.greenSoft:C.surfaceAlt,color:p.status==="STALLED"?C.red:p.status==="COMPLETED"?C.green:C.text2,borderRadius:4,padding:"2px 8px",fontSize:10,fontWeight:600,whiteSpace:"nowrap"}}>{p.status.replace(/_/g," ")}</span></td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {sorted.length===0&&<div style={{textAlign:"center",padding:40,color:C.text3,fontSize:13}}>No sectors match the current filters.</div>}
                </div>
              );
            })()}
            {/* DISTRICT TAB */}
            {physTab==="district"&&(()=>{
              const filtered = distRows.filter(d=>{
                const statusOk = physDistStatusF==="ALL"||(physDistStatusF==="behind"&&d.gap<0)||(physDistStatusF==="ahead"&&d.gap>=0)||(physDistStatusF==="stalled"&&d.stalled>0)||(physDistStatusF==="delayed"&&d.delayed>0);
                return statusOk&&(!physDistSearch||d.district.toLowerCase().includes(physDistSearch.toLowerCase()));
              });
              const sorted = [...filtered].sort((a,b)=>{
                if(physDistSort==="gap_asc")   return a.gap-b.gap;
                if(physDistSort==="gap_desc")  return b.gap-a.gap;
                if(physDistSort==="act_desc")  return b.act-a.act;
                if(physDistSort==="act_asc")   return a.act-b.act;
                if(physDistSort==="proj_desc") return b.count-a.count;
                return a.district.localeCompare(b.district);
              });
              return (
                <div>
                  <div style={{display:"flex",gap:10,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
                    <input type="text" placeholder="Search district…" value={physDistSearch} onChange={e=>setPhysDistSearch(e.target.value)}
                      style={{padding:"6px 12px",fontSize:12,border:`1px solid ${C.border}`,borderRadius:7,outline:"none",width:180}}/>
                    <select value={physDistStatusF} onChange={e=>setPhysDistStatusF(e.target.value)}
                      style={{padding:"6px 10px",fontSize:12,border:`1px solid ${C.border}`,borderRadius:7,outline:"none",background:C.surface,cursor:"pointer"}}>
                      <option value="ALL">All Districts</option>
                      <option value="behind">Behind Schedule</option>
                      <option value="ahead">On / Ahead</option>
                      <option value="stalled">Has Stalled Projects</option>
                      <option value="delayed">Has Delayed Projects</option>
                    </select>
                    <select value={physDistSort} onChange={e=>setPhysDistSort(e.target.value)}
                      style={{padding:"6px 10px",fontSize:12,border:`1px solid ${C.border}`,borderRadius:7,outline:"none",background:C.surface,cursor:"pointer"}}>
                      <option value="gap_asc">Sort: Worst First</option>
                      <option value="gap_desc">Sort: Best First</option>
                      <option value="act_desc">Actual % High→Low</option>
                      <option value="act_asc">Actual % Low→High</option>
                      <option value="name_asc">Name A→Z</option>
                      <option value="proj_desc">Most Projects</option>
                    </select>
                    <span style={{fontSize:11,color:C.text3,marginLeft:"auto"}}>{sorted.length} of {distRows.length} districts</span>
                  </div>
                  <div style={{overflowX:"auto"}}>
                    <table style={{width:"100%",borderCollapse:"collapse",minWidth:820}}>
                      <thead>
                        <tr style={{background:C.surfaceAlt}}>
                          {["District","Projects","Sectors Covered","Actual %","Scheduled %","Variance","Delayed","Stalled"].map(h=>(
                            <th key={h} style={{padding:"9px 12px",fontSize:10,fontWeight:700,color:C.text2,textTransform:"uppercase",letterSpacing:".05em",borderBottom:`2px solid ${C.border}`,whiteSpace:"nowrap",textAlign:"left"}}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {sorted.map((d,i)=>(
                          <tr key={d.district} style={{background:i%2===0?C.surface:C.surfaceAlt,borderLeft:`3px solid ${d.gap<0?C.red:d.gap>0?C.green:"transparent"}`}}>
                            <td style={{padding:"10px 12px",fontSize:12,fontWeight:700,color:C.text1}}>{d.district}</td>
                            <td style={{padding:"10px 12px",fontSize:12,color:C.text2,textAlign:"center",fontFamily:"'DM Mono',monospace",fontWeight:600}}>{d.count}</td>
                            <td style={{padding:"10px 12px",fontSize:10,color:C.text3,maxWidth:200}}>{d.sectors}</td>
                            <td style={{padding:"10px 12px"}}><div style={{display:"flex",alignItems:"center",gap:8}}><DualBar act={d.act} sch={d.sch} height={8}/><span style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:pctColor(d.act),fontWeight:700,whiteSpace:"nowrap"}}>{d.act}%</span></div></td>
                            <td style={{padding:"10px 12px",fontFamily:"'DM Mono',monospace",fontSize:11,color:C.blue,fontWeight:600}}>{d.sch}%</td>
                            <td style={{padding:"10px 12px"}}><GapBadge gap={d.gap}/></td>
                            <td style={{padding:"10px 12px",fontFamily:"'DM Mono',monospace",fontSize:11,color:d.delayed>0?C.orange:C.green,fontWeight:700,textAlign:"center"}}>{d.delayed}</td>
                            <td style={{padding:"10px 12px",fontFamily:"'DM Mono',monospace",fontSize:11,color:d.stalled>0?C.red:C.green,fontWeight:700,textAlign:"center"}}>{d.stalled}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {sorted.length===0&&<div style={{textAlign:"center",padding:40,color:C.text3,fontSize:13}}>No districts match the current filters.</div>}
                </div>
              );
            })()}
          </Modal>
        );
      })()}

      {showFinanceModal&&(()=>{
        const today    = new Date().toISOString().slice(0,10);
        const fmtDate  = d => d&&d!=="—"?new Date(d).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}):"—";
        const fmtDaysLeft = d => {
          if(!d||d==="—") return null;
          const diff=Math.round((new Date(d)-new Date())/(1000*60*60*24));
          if(diff<0)   return {label:`Expired ${Math.abs(diff)}d ago`,color:C.red};
          if(diff<=7)  return {label:`${diff}d left`,color:C.red};
          if(diff<=30) return {label:`${diff}d left`,color:C.orange};
          return {label:`${diff}d left`,color:C.green};
        };
        const totalContract  = projects.reduce((a,p)=>a+(p.contract_value_lakhs||0),0);
        const totalPaid      = projects.reduce((a,p)=>a+(p.payments_made_lakhs||0),0);
        const totalBalance   = Math.max(0,totalContract-totalPaid);
        const totalMobAdv    = projects.reduce((a,p)=>a+(p.mobilization_advance_lakhs||0),0);
        const totalRetention = projects.reduce((a,p)=>a+(p.retention_money_lakhs||0),0);
        const totalPBG       = projects.reduce((a,p)=>a+(p.pbg_amount_lakhs||0),0);
        const totalEMD       = projects.reduce((a,p)=>a+(p.emd_amount_lakhs||0),0);
        const pbgExpiredList  = projects.filter(p=>p.pbg_expiry_date&&p.pbg_expiry_date<today&&p.pbg_amount_lakhs>0);
        const pbgExpiringList = projects.filter(p=>p.pbg_expiry_date&&p.pbg_expiry_date>=today&&((new Date(p.pbg_expiry_date)-new Date())/(1000*60*60*24))<=30&&p.pbg_amount_lakhs>0);
        const finQ = financeSearch.toLowerCase();
        const searchFilter = p=>!finQ||p.project_name.toLowerCase().includes(finQ)||(p.district||"").toLowerCase().includes(finQ)||(p.contractor_name||"").toLowerCase().includes(finQ)||(p.last_ra_bill_no||"").toLowerCase().includes(finQ);
        const makeSorted = (rows, sortState) => {
          const r=[...rows]; const {field,dir}=sortState;
          r.sort((a,b)=>{
            const av=a[field]??"",bv=b[field]??"";
            if(typeof av==="number"||typeof bv==="number") return dir==="asc"?(Number(av)||0)-(Number(bv)||0):(Number(bv)||0)-(Number(av)||0);
            return dir==="asc"?String(av).localeCompare(String(bv)):String(bv).localeCompare(String(av));
          }); return r;
        };
        const colFilter = (rows, colState) => rows.filter(p=>Object.entries(colState).every(([k,v])=>{
          if(!v) return true;
          const pv=p[k]; if(pv===null||pv===undefined||pv==="") return false;
          return String(pv)===String(v);
        }));
        const payRows = makeSorted(projects.filter(p=>(p.payments_made_lakhs>0||p.contract_value_lakhs>0)&&searchFilter(p)), financeSortPay);
        const pbgRows = makeSorted(projects.filter(p=>p.pbg_amount_lakhs>0&&searchFilter(p)), financeSortPbg);
        const emdRows = makeSorted(projects.filter(p=>p.emd_amount_lakhs>0&&searchFilter(p)), financeSortEmd);
        const advRows = makeSorted(projects.filter(p=>(p.mobilization_advance_lakhs>0||p.retention_money_lakhs>0)&&searchFilter(p)), financeSortAdv);
        const payRowsF = colFilter(payRows, finColPay);
        const pbgRowsF = colFilter(pbgRows, finColPbg);
        const emdRowsF = colFilter(emdRows, finColEmd);
        const advRowsF = colFilter(advRows, finColAdv);
        const thSno = {padding:"8px 10px",background:C.surfaceAlt,borderBottom:`2px solid ${C.border}`,fontSize:10,fontWeight:700,color:C.text2,textTransform:"uppercase",letterSpacing:".05em",textAlign:"center",whiteSpace:"nowrap",width:44};
        const trStyle = i => ({background:i%2===0?C.surface:C.surfaceAlt});
        const tdN = {fontFamily:"'DM Mono',monospace",fontSize:12,padding:"9px 12px"};
        const tdS = {padding:"9px 12px",fontSize:12};
        const tabs4 = [
          {id:"payments",label:"💰 Payments to Contractor",count:payRows.length},
          {id:"pbg",     label:"🔐 PBG (Bank Guarantee)",  count:pbgRows.length},
          {id:"emd",     label:"🪙 EMD",                   count:emdRows.length},
          {id:"advance", label:"💳 Mob. Advance & Retention",count:advRows.length},
        ];
        return (
          <Modal
            title="🏦 Finance & Payments — All Projects"
            subtitle={`Total paid: ${fmtCr(totalPaid)}  ·  Contract: ${fmtCr(totalContract)}  ·  PBG: ${fmtCr(totalPBG)}  ·  EMD: ${fmtCr(totalEMD)}`}
            onClose={()=>{setShowFinanceModal(false);setFinanceSearch("");setFinanceTab("payments");}}
            width={1200}
          >
            {/* Summary banner */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:10,marginBottom:20}}>
              {[["Contract Value",fmtCr(totalContract),C.purple],["Paid to Date",fmtCr(totalPaid),C.green],["Balance",fmtCr(totalBalance),C.amber],["Mob. Advance",fmtCr(totalMobAdv),C.blue],["PBG Held",fmtCr(totalPBG),pbgExpiredList.length>0?C.red:C.teal],["EMD Held",fmtCr(totalEMD),C.orange]]
                .map(([lbl,val,col])=>(
                  <div key={lbl} style={{background:col+"12",border:`1px solid ${col}30`,borderRadius:8,padding:"10px 14px",textAlign:"center"}}>
                    <div style={{fontSize:10,color:C.text3,fontWeight:600,textTransform:"uppercase",letterSpacing:".06em",marginBottom:4}}>{lbl}</div>
                    <div style={{fontFamily:"'DM Mono',monospace",fontSize:15,fontWeight:700,color:col}}>{val}</div>
                  </div>
                ))}
            </div>
            {(pbgExpiredList.length>0||pbgExpiringList.length>0)&&(
              <div style={{background:C.redSoft,border:`1px solid ${C.red}40`,borderRadius:8,padding:"10px 16px",marginBottom:16,display:"flex",gap:16,alignItems:"center",flexWrap:"wrap"}}>
                <span style={{fontSize:12,fontWeight:700,color:C.red}}>⚠ PBG Alerts:</span>
                {pbgExpiredList.length>0&&<span style={{fontSize:12,color:C.red}}>{pbgExpiredList.length} PBG(s) <b>EXPIRED</b> — {pbgExpiredList.map(p=>p.project_name).join(", ")}</span>}
                {pbgExpiringList.length>0&&<span style={{fontSize:12,color:C.orange}}>{pbgExpiringList.length} expiring within 30 days — {pbgExpiringList.map(p=>p.project_name).join(", ")}</span>}
              </div>
            )}
            {/* Tab bar */}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,flexWrap:"wrap",gap:10}}>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {tabs4.map(t=>(
                  <button key={t.id} onClick={()=>setFinanceTab(t.id)}
                    style={{padding:"6px 14px",fontSize:12,fontWeight:600,borderRadius:8,cursor:"pointer",border:`1px solid ${financeTab===t.id?C.teal:C.border}`,background:financeTab===t.id?C.teal:"transparent",color:financeTab===t.id?"white":C.text2,transition:"all .15s"}}>
                    {t.label} <span style={{opacity:.7,fontSize:10}}>({t.count})</span>
                  </button>
                ))}
              </div>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <input type="text" placeholder="Search project / contractor / district…" value={financeSearch}
                  onChange={e=>setFinanceSearch(e.target.value)}
                  style={{padding:"6px 12px",fontSize:12,border:`1px solid ${C.border}`,borderRadius:8,outline:"none",width:260}}/>
                {financeTab==="payments"&&<FinClearBtn colState={finColPay} setColState={setFinColPay}/>}
                {financeTab==="pbg"     &&<FinClearBtn colState={finColPbg} setColState={setFinColPbg}/>}
                {financeTab==="emd"     &&<FinClearBtn colState={finColEmd} setColState={setFinColEmd}/>}
                {financeTab==="advance" &&<FinClearBtn colState={finColAdv} setColState={setFinColAdv}/>}
              </div>
            </div>
            {/* TAB: PAYMENTS */}
            {financeTab==="payments"&&(
              <div style={{overflowX:"auto"}}>
                <table style={{minWidth:1150,borderCollapse:"collapse",width:"100%"}}>
                  <thead><tr>
                    <th style={thSno}>#</th>
                    <FinSortHdr label="Project"         field="project_name"          allRows={payRows} colState={finColPay} setColState={setFinColPay} style={{minWidth:200}} sortState={financeSortPay} setSortState={setFinanceSortPay}/>
                    <FinSortHdr label="Sector"          field="sector_name"           allRows={payRows} colState={finColPay} setColState={setFinColPay} sortState={financeSortPay} setSortState={setFinanceSortPay}/>
                    <FinSortHdr label="District"        field="district"              allRows={payRows} colState={finColPay} setColState={setFinColPay} sortState={financeSortPay} setSortState={setFinanceSortPay}/>
                    <FinSortHdr label="Contractor"      field="contractor_name"       allRows={payRows} colState={finColPay} setColState={setFinColPay} style={{minWidth:160}} sortState={financeSortPay} setSortState={setFinanceSortPay}/>
                    <FinSortHdr label="Contract Value"  field="contract_value_lakhs"  allRows={payRows} colState={finColPay} setColState={setFinColPay} sortState={financeSortPay} setSortState={setFinanceSortPay}/>
                    <FinSortHdr label="Payments Made"   field="payments_made_lakhs"   allRows={payRows} colState={finColPay} setColState={setFinColPay} sortState={financeSortPay} setSortState={setFinanceSortPay}/>
                    <th style={{padding:"8px 12px",background:C.surfaceAlt,borderBottom:`2px solid ${C.border}`,fontSize:10,fontWeight:700,color:C.text2,textTransform:"uppercase",letterSpacing:".05em",whiteSpace:"nowrap",verticalAlign:"top"}}>Balance</th>
                    <FinSortHdr label="% Paid"          field="financial_progress_pct" allRows={payRows} colState={finColPay} setColState={setFinColPay} sortState={financeSortPay} setSortState={setFinanceSortPay}/>
                    <FinSortHdr label="Last RA Bill"    field="last_ra_bill_no"       allRows={payRows} colState={finColPay} setColState={setFinColPay} sortState={financeSortPay} setSortState={setFinanceSortPay}/>
                    <FinSortHdr label="Last Paid Date"  field="last_payment_date"     allRows={payRows} colState={finColPay} setColState={setFinColPay} sortState={financeSortPay} setSortState={setFinanceSortPay}/>
                    <FinSortHdr label="Agreement Date"  field="agreement_date"        allRows={payRows} colState={finColPay} setColState={setFinColPay} sortState={financeSortPay} setSortState={setFinanceSortPay}/>
                    <FinSortHdr label="Status"          field="status"                allRows={payRows} colState={finColPay} setColState={setFinColPay} sortState={financeSortPay} setSortState={setFinanceSortPay}/>
                  </tr></thead>
                  <tbody>
                    {payRowsF.map((p,i)=>{
                      const balance=Math.max(0,(p.contract_value_lakhs||0)-(p.payments_made_lakhs||0));
                      const paidPct=p.contract_value_lakhs>0?Math.round((p.payments_made_lakhs||0)/p.contract_value_lakhs*100):p.financial_progress_pct;
                      return (
                        <tr key={p.project_id} style={trStyle(i)}>
                          <td style={{...thSno,background:"transparent",borderBottom:`1px solid ${C.border}`,fontFamily:"'DM Mono',monospace",fontSize:11,fontWeight:700,color:C.text4,padding:"9px 8px"}}>{i+1}</td>
                          <td style={{...tdS,fontWeight:600}}><div style={{fontSize:11,fontWeight:700,color:C.text1,lineHeight:1.3}}>{p.project_name}</div><div style={{fontSize:10,color:C.text3,marginTop:2}}>{p.project_code}</div></td>
                          <td style={tdS}><Badge color={C.teal}>{p.sector_icon} {p.sector_name}</Badge></td>
                          <td style={tdS}>{p.district}</td>
                          <td style={{...tdS,fontSize:11,color:C.text2}}>{p.contractor_name||"—"}</td>
                          <td style={{...tdN,color:C.purple,fontWeight:600}}>{p.contract_value_lakhs>0?fmtLakhToCr(p.contract_value_lakhs):"—"}</td>
                          <td style={{...tdN,color:C.green,fontWeight:700}}>{p.payments_made_lakhs>0?fmtLakhToCr(p.payments_made_lakhs):"—"}</td>
                          <td style={{...tdN,color:C.amber,fontWeight:600}}>{p.contract_value_lakhs>0?fmtLakhToCr(balance):"—"}</td>
                          <td style={tdS}><div style={{display:"flex",alignItems:"center",gap:6}}><div style={{background:"#E8EBF2",borderRadius:3,height:5,width:50,overflow:"hidden"}}><div style={{width:`${Math.min(paidPct,100)}%`,height:"100%",background:pctColor(paidPct),borderRadius:3}}/></div><span style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:pctColor(paidPct),fontWeight:700}}>{paidPct}%</span></div></td>
                          <td style={{...tdS,fontFamily:"'DM Mono',monospace",fontSize:11,color:C.text2}}>{p.last_ra_bill_no||"—"}</td>
                          <td style={{...tdS,whiteSpace:"nowrap",color:C.text2}}>{fmtDate(p.last_payment_date)}</td>
                          <td style={{...tdS,whiteSpace:"nowrap",color:C.text2}}>{fmtDate(p.agreement_date)}</td>
                          <td style={tdS}><Badge color={p.status==="STALLED"?C.red:p.status==="IN_PROGRESS"?C.green:C.text3}>{p.status}</Badge></td>
                        </tr>
                      );
                    })}
                    <tr style={{background:C.navy,color:"white",fontWeight:700}}>
                      <td style={{padding:"10px 8px",textAlign:"center",fontSize:11}}>{payRowsF.length}</td>
                      <td colSpan={4} style={{padding:"10px 12px",fontSize:12}}>TOTAL ({payRowsF.length} of {payRows.length} projects)</td>
                      <td style={{...tdN,color:"#C4B5FD",fontWeight:700}}>{fmtLakhToCr(payRowsF.reduce((a,p)=>a+(p.contract_value_lakhs||0),0))}</td>
                      <td style={{...tdN,color:"#6EE7C0",fontWeight:700}}>{fmtLakhToCr(payRowsF.reduce((a,p)=>a+(p.payments_made_lakhs||0),0))}</td>
                      <td style={{...tdN,color:"#FCD06A",fontWeight:700}}>{fmtLakhToCr(payRowsF.reduce((a,p)=>a+Math.max(0,(p.contract_value_lakhs||0)-(p.payments_made_lakhs||0)),0))}</td>
                      <td colSpan={5}></td>
                    </tr>
                  </tbody>
                </table>
                {payRowsF.length===0&&<div style={{textAlign:"center",padding:40,color:C.text3,fontSize:13}}>{payRows.length>0?"No rows match the active column filters.":"No payment data found. Enter data via MD Input Sheet."}</div>}
              </div>
            )}
            {/* TAB: PBG */}
            {financeTab==="pbg"&&(
              <div style={{overflowX:"auto"}}>
                <table style={{minWidth:1050,borderCollapse:"collapse",width:"100%"}}>
                  <thead><tr>
                    <th style={thSno}>#</th>
                    <FinSortHdr label="Project"    field="project_name"    allRows={pbgRows} colState={finColPbg} setColState={setFinColPbg} style={{minWidth:200}} sortState={financeSortPbg} setSortState={setFinanceSortPbg}/>
                    <FinSortHdr label="District"   field="district"        allRows={pbgRows} colState={finColPbg} setColState={setFinColPbg} sortState={financeSortPbg} setSortState={setFinanceSortPbg}/>
                    <FinSortHdr label="Contractor" field="contractor_name" allRows={pbgRows} colState={finColPbg} setColState={setFinColPbg} style={{minWidth:160}} sortState={financeSortPbg} setSortState={setFinanceSortPbg}/>
                    <FinSortHdr label="PBG Number" field="pbg_number"      allRows={pbgRows} colState={finColPbg} setColState={setFinColPbg} sortState={financeSortPbg} setSortState={setFinanceSortPbg}/>
                    <FinSortHdr label="PBG Amount" field="pbg_amount_lakhs" allRows={pbgRows} colState={finColPbg} setColState={setFinColPbg} sortState={financeSortPbg} setSortState={setFinanceSortPbg}/>
                    <FinSortHdr label="PBG Bank"   field="pbg_bank"        allRows={pbgRows} colState={finColPbg} setColState={setFinColPbg} sortState={financeSortPbg} setSortState={setFinanceSortPbg}/>
                    <FinSortHdr label="PBG Expiry" field="pbg_expiry_date" allRows={pbgRows} colState={finColPbg} setColState={setFinColPbg} sortState={financeSortPbg} setSortState={setFinanceSortPbg}/>
                    <th style={{padding:"8px 12px",background:C.surfaceAlt,borderBottom:`2px solid ${C.border}`,fontSize:10,fontWeight:700,color:C.text2,textTransform:"uppercase",letterSpacing:".05em",whiteSpace:"nowrap",verticalAlign:"top"}}>Days Left</th>
                    <FinSortHdr label="Status"     field="status"          allRows={pbgRows} colState={finColPbg} setColState={setFinColPbg} sortState={financeSortPbg} setSortState={setFinanceSortPbg}/>
                  </tr></thead>
                  <tbody>
                    {pbgRowsF.map((p,i)=>{
                      const dl=fmtDaysLeft(p.pbg_expiry_date);
                      return (
                        <tr key={p.project_id} style={trStyle(i)}>
                          <td style={{...thSno,background:"transparent",borderBottom:`1px solid ${C.border}`,fontFamily:"'DM Mono',monospace",fontSize:11,fontWeight:700,color:C.text4,padding:"9px 8px"}}>{i+1}</td>
                          <td style={tdS}><div style={{fontSize:11,fontWeight:700,color:C.text1,lineHeight:1.3}}>{p.project_name}</div><div style={{fontSize:10,color:C.text3,marginTop:2}}>{p.project_code}</div></td>
                          <td style={tdS}>{p.district}</td>
                          <td style={{...tdS,fontSize:11}}>{p.contractor_name||"—"}</td>
                          <td style={{...tdS,fontFamily:"'DM Mono',monospace",fontSize:11,color:C.text2}}>{p.pbg_number||"—"}</td>
                          <td style={{...tdN,color:C.teal,fontWeight:700}}>{fmtLakhToCr(p.pbg_amount_lakhs||0)}</td>
                          <td style={{...tdS,fontSize:11,color:C.text2}}>{p.pbg_bank||"—"}</td>
                          <td style={{...tdS,whiteSpace:"nowrap",color:dl?.color||C.text2,fontWeight:dl?600:400}}>{fmtDate(p.pbg_expiry_date)}</td>
                          <td style={tdS}>{dl?<span style={{background:dl.color+"18",color:dl.color,border:`1px solid ${dl.color}30`,borderRadius:4,padding:"2px 8px",fontSize:11,fontWeight:700}}>{dl.label}</span>:"—"}</td>
                          <td style={tdS}><Badge color={p.status==="STALLED"?C.red:p.status==="IN_PROGRESS"?C.green:C.text3}>{p.status}</Badge></td>
                        </tr>
                      );
                    })}
                    <tr style={{background:C.navy,color:"white",fontWeight:700}}>
                      <td style={{padding:"10px 8px",textAlign:"center",fontSize:11}}>{pbgRowsF.length}</td>
                      <td colSpan={4} style={{padding:"10px 12px",fontSize:12}}>TOTAL PBG ({pbgRowsF.length} of {pbgRows.length} projects)</td>
                      <td style={{...tdN,color:"#6EE7C0",fontWeight:700}}>{fmtLakhToCr(pbgRowsF.reduce((a,p)=>a+(p.pbg_amount_lakhs||0),0))}</td>
                      <td colSpan={4}></td>
                    </tr>
                  </tbody>
                </table>
                {pbgRowsF.length===0&&<div style={{textAlign:"center",padding:40,color:C.text3,fontSize:13}}>{pbgRows.length>0?"No rows match the active column filters.":"No PBG data found. Enter data via MD Input Sheet."}</div>}
              </div>
            )}
            {/* TAB: EMD */}
            {financeTab==="emd"&&(
              <div style={{overflowX:"auto"}}>
                <table style={{minWidth:950,borderCollapse:"collapse",width:"100%"}}>
                  <thead><tr>
                    <th style={thSno}>#</th>
                    <FinSortHdr label="Project"       field="project_name"    allRows={emdRows} colState={finColEmd} setColState={setFinColEmd} style={{minWidth:200}} sortState={financeSortEmd} setSortState={setFinanceSortEmd}/>
                    <FinSortHdr label="District"      field="district"        allRows={emdRows} colState={finColEmd} setColState={setFinColEmd} sortState={financeSortEmd} setSortState={setFinanceSortEmd}/>
                    <FinSortHdr label="Contractor"    field="contractor_name" allRows={emdRows} colState={finColEmd} setColState={setFinColEmd} style={{minWidth:160}} sortState={financeSortEmd} setSortState={setFinanceSortEmd}/>
                    <FinSortHdr label="EMD Amount"    field="emd_amount_lakhs" allRows={emdRows} colState={finColEmd} setColState={setFinColEmd} sortState={financeSortEmd} setSortState={setFinanceSortEmd}/>
                    <FinSortHdr label="EMD Reference" field="emd_reference"   allRows={emdRows} colState={finColEmd} setColState={setFinColEmd} sortState={financeSortEmd} setSortState={setFinanceSortEmd}/>
                    <FinSortHdr label="EMD Date"      field="emd_date"        allRows={emdRows} colState={finColEmd} setColState={setFinColEmd} sortState={financeSortEmd} setSortState={setFinanceSortEmd}/>
                    <FinSortHdr label="Phase"         field="phase"           allRows={emdRows} colState={finColEmd} setColState={setFinColEmd} sortState={financeSortEmd} setSortState={setFinanceSortEmd}/>
                    <FinSortHdr label="Status"        field="status"          allRows={emdRows} colState={finColEmd} setColState={setFinColEmd} sortState={financeSortEmd} setSortState={setFinanceSortEmd}/>
                  </tr></thead>
                  <tbody>
                    {emdRowsF.map((p,i)=>(
                      <tr key={p.project_id} style={trStyle(i)}>
                        <td style={{...thSno,background:"transparent",borderBottom:`1px solid ${C.border}`,fontFamily:"'DM Mono',monospace",fontSize:11,fontWeight:700,color:C.text4,padding:"9px 8px"}}>{i+1}</td>
                        <td style={tdS}><div style={{fontSize:11,fontWeight:700,color:C.text1,lineHeight:1.3}}>{p.project_name}</div><div style={{fontSize:10,color:C.text3,marginTop:2}}>{p.project_code}</div></td>
                        <td style={tdS}>{p.district}</td>
                        <td style={{...tdS,fontSize:11}}>{p.contractor_name||"—"}</td>
                        <td style={{...tdN,color:C.orange,fontWeight:700}}>{fmtLakhToCr(p.emd_amount_lakhs||0)}</td>
                        <td style={{...tdS,fontFamily:"'DM Mono',monospace",fontSize:11,color:C.text2}}>{p.emd_reference||"—"}</td>
                        <td style={{...tdS,whiteSpace:"nowrap",color:C.text2}}>{fmtDate(p.emd_date)}</td>
                        <td style={tdS}><Badge color={PHASE_COLOR[p.phase]||C.text3}>{p.phase}</Badge></td>
                        <td style={tdS}><Badge color={p.status==="STALLED"?C.red:p.status==="IN_PROGRESS"?C.green:C.text3}>{p.status}</Badge></td>
                      </tr>
                    ))}
                    <tr style={{background:C.navy,color:"white",fontWeight:700}}>
                      <td style={{padding:"10px 8px",textAlign:"center",fontSize:11}}>{emdRowsF.length}</td>
                      <td colSpan={3} style={{padding:"10px 12px",fontSize:12}}>TOTAL EMD ({emdRowsF.length} of {emdRows.length} projects)</td>
                      <td style={{...tdN,color:"#FCD06A",fontWeight:700}}>{fmtLakhToCr(emdRowsF.reduce((a,p)=>a+(p.emd_amount_lakhs||0),0))}</td>
                      <td colSpan={4}></td>
                    </tr>
                  </tbody>
                </table>
                {emdRowsF.length===0&&<div style={{textAlign:"center",padding:40,color:C.text3,fontSize:13}}>{emdRows.length>0?"No rows match the active column filters.":"No EMD data found. Enter data via MD Input Sheet."}</div>}
              </div>
            )}
            {/* TAB: ADVANCE & RETENTION */}
            {financeTab==="advance"&&(
              <div style={{overflowX:"auto"}}>
                <table style={{minWidth:1100,borderCollapse:"collapse",width:"100%"}}>
                  <thead><tr>
                    <th style={thSno}>#</th>
                    <FinSortHdr label="Project"             field="project_name"                         allRows={advRows} colState={finColAdv} setColState={setFinColAdv} style={{minWidth:200}} sortState={financeSortAdv} setSortState={setFinanceSortAdv}/>
                    <FinSortHdr label="District"            field="district"                             allRows={advRows} colState={finColAdv} setColState={setFinColAdv} sortState={financeSortAdv} setSortState={setFinanceSortAdv}/>
                    <FinSortHdr label="Contractor"          field="contractor_name"                      allRows={advRows} colState={finColAdv} setColState={setFinColAdv} style={{minWidth:160}} sortState={financeSortAdv} setSortState={setFinanceSortAdv}/>
                    <FinSortHdr label="Contract Value"      field="contract_value_lakhs"                 allRows={advRows} colState={finColAdv} setColState={setFinColAdv} sortState={financeSortAdv} setSortState={setFinanceSortAdv}/>
                    <FinSortHdr label="Mob. Adv. Issued"    field="mobilization_advance_lakhs"           allRows={advRows} colState={finColAdv} setColState={setFinColAdv} sortState={financeSortAdv} setSortState={setFinanceSortAdv}/>
                    <FinSortHdr label="Mob. Adv. Recovered" field="mobilization_advance_recovered_lakhs" allRows={advRows} colState={finColAdv} setColState={setFinColAdv} sortState={financeSortAdv} setSortState={setFinanceSortAdv}/>
                    <th style={{padding:"8px 12px",background:C.surfaceAlt,borderBottom:`2px solid ${C.border}`,fontSize:10,fontWeight:700,color:C.text2,textTransform:"uppercase",letterSpacing:".05em",whiteSpace:"nowrap",verticalAlign:"top"}}>Adv. Outstanding</th>
                    <FinSortHdr label="Retention Money"     field="retention_money_lakhs"                allRows={advRows} colState={finColAdv} setColState={setFinColAdv} sortState={financeSortAdv} setSortState={setFinanceSortAdv}/>
                    <FinSortHdr label="Appointed Date"      field="appointed_date"                       allRows={advRows} colState={finColAdv} setColState={setFinColAdv} sortState={financeSortAdv} setSortState={setFinanceSortAdv}/>
                    <FinSortHdr label="Status"              field="status"                               allRows={advRows} colState={finColAdv} setColState={setFinColAdv} sortState={financeSortAdv} setSortState={setFinanceSortAdv}/>
                  </tr></thead>
                  <tbody>
                    {advRowsF.map((p,i)=>{
                      const advOut=Math.max(0,(p.mobilization_advance_lakhs||0)-(p.mobilization_advance_recovered_lakhs||0));
                      return (
                        <tr key={p.project_id} style={trStyle(i)}>
                          <td style={{...thSno,background:"transparent",borderBottom:`1px solid ${C.border}`,fontFamily:"'DM Mono',monospace",fontSize:11,fontWeight:700,color:C.text4,padding:"9px 8px"}}>{i+1}</td>
                          <td style={tdS}><div style={{fontSize:11,fontWeight:700,color:C.text1,lineHeight:1.3}}>{p.project_name}</div><div style={{fontSize:10,color:C.text3,marginTop:2}}>{p.project_code}</div></td>
                          <td style={tdS}>{p.district}</td>
                          <td style={{...tdS,fontSize:11}}>{p.contractor_name||"—"}</td>
                          <td style={{...tdN,color:C.purple,fontWeight:600}}>{p.contract_value_lakhs>0?fmtLakhToCr(p.contract_value_lakhs):"—"}</td>
                          <td style={{...tdN,color:C.blue,fontWeight:700}}>{p.mobilization_advance_lakhs>0?fmtLakhToCr(p.mobilization_advance_lakhs):"—"}</td>
                          <td style={{...tdN,color:C.green,fontWeight:600}}>{p.mobilization_advance_recovered_lakhs>0?fmtLakhToCr(p.mobilization_advance_recovered_lakhs):"—"}</td>
                          <td style={{...tdN,color:advOut>0?C.red:C.green,fontWeight:700}}>{advOut>0?fmtLakhToCr(advOut):"Fully Recovered"}</td>
                          <td style={{...tdN,color:C.amber,fontWeight:700}}>{p.retention_money_lakhs>0?fmtLakhToCr(p.retention_money_lakhs):"—"}</td>
                          <td style={{...tdS,whiteSpace:"nowrap",color:C.text2}}>{fmtDate(p.appointed_date)}</td>
                          <td style={tdS}><Badge color={p.status==="STALLED"?C.red:p.status==="IN_PROGRESS"?C.green:C.text3}>{p.status}</Badge></td>
                        </tr>
                      );
                    })}
                    <tr style={{background:C.navy,color:"white",fontWeight:700}}>
                      <td style={{padding:"10px 8px",textAlign:"center",fontSize:11}}>{advRowsF.length}</td>
                      <td colSpan={4} style={{padding:"10px 12px",fontSize:12}}>TOTAL ({advRowsF.length} of {advRows.length} projects)</td>
                      <td style={{...tdN,color:"#93C5FD",fontWeight:700}}>{fmtLakhToCr(advRowsF.reduce((a,p)=>a+(p.mobilization_advance_lakhs||0),0))}</td>
                      <td style={{...tdN,color:"#6EE7C0",fontWeight:700}}>{fmtLakhToCr(advRowsF.reduce((a,p)=>a+(p.mobilization_advance_recovered_lakhs||0),0))}</td>
                      <td style={{...tdN,color:"#FCA5A5",fontWeight:700}}>{fmtLakhToCr(advRowsF.reduce((a,p)=>a+Math.max(0,(p.mobilization_advance_lakhs||0)-(p.mobilization_advance_recovered_lakhs||0)),0))}</td>
                      <td style={{...tdN,color:"#FCD06A",fontWeight:700}}>{fmtLakhToCr(advRowsF.reduce((a,p)=>a+(p.retention_money_lakhs||0),0))}</td>
                      <td colSpan={2}></td>
                    </tr>
                  </tbody>
                </table>
                {advRowsF.length===0&&<div style={{textAlign:"center",padding:40,color:C.text3,fontSize:13}}>{advRows.length>0?"No rows match the active column filters.":"No advance data found. Enter data via MD Input Sheet."}</div>}
              </div>
            )}
          </Modal>
        );
      })()}

      {showMonsoonModal&&(
        <Modal title="⛈ Pre-Monsoon Preparations" subtitle={`${preMonsoonFlags.length} urgent flags — immediate action required`} onClose={()=>setShowMonsoonModal(false)} width={780}>
          <div style={{background:C.redSoft,border:`1px solid ${C.red}25`,borderRadius:8,padding:"10px 16px",marginBottom:18,fontSize:13,color:C.red,fontWeight:500}}>
            ⚠ These sites require IMMEDIATE action to prevent structural damage or safety incidents during monsoon season.
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            {preMonsoonFlags.map(f=>(
              <div key={f.flag_id} style={{background:C.surface,border:`1px solid ${SEV_COLOR[f.severity]}30`,borderLeft:`4px solid ${SEV_COLOR[f.severity]}`,borderRadius:8,padding:"16px 18px"}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                  <div style={{display:"flex",gap:8,flexWrap:"wrap"}}><Pill color={SEV_COLOR[f.severity]}>{f.severity}</Pill><Badge color={C.text2}>{f.ulb_name}</Badge><Badge color={C.teal}>{f.sector_name}</Badge></div>
                  <span style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:SEV_COLOR[f.severity],fontWeight:700}}>{f.days_open} days open</span>
                </div>
                <div style={{fontSize:13,fontWeight:700,color:C.text1,marginBottom:8}}>{f.project_name}</div>
                <div style={{fontSize:12,color:C.text2,marginBottom:8}}>{f.flag_description}</div>
                <div style={{background:C.blueSoft,borderRadius:6,padding:"8px 12px",fontSize:12,color:C.navyMid}}><b>Action:</b> {f.action_required}</div>
              </div>
            ))}
          </div>
        </Modal>
      )}


      {/* EXPENDITURE BREAKUP MODAL */}
      {showExpenditureModal&&(()=>{
        const sectorExp = sectorCards.map(s=>{
          const secProjs = projects.filter(p=>p.sector_code===s.sector_code);
          const spent    = secProjs.reduce((a,p)=>a+(p.current_sanctioned_cost*p.financial_progress_pct/100),0);
          const sanct    = secProjs.reduce((a,p)=>a+p.current_sanctioned_cost,0);
          const pct      = sanct>0?Math.round(spent/sanct*100):0;
          return {...s, spent:Math.round(spent), sanct, pct};
        }).sort((a,b)=>b.spent-a.spent);
        return (
          <Modal title="Total Expenditure — Sector-wise Breakup" subtitle={`Total spent: ${fmtCr(Math.round(projects.reduce((a,p)=>a+(p.current_sanctioned_cost*p.financial_progress_pct/100),0)))} across ${projects.length} projects`} onClose={()=>setShowExpenditureModal(false)} width={900}>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:20}}>
              {sectorExp.map(s=>(
                <div key={s.sector_code} style={{background:C.surfaceAlt,border:`1px solid ${C.border}`,borderRadius:8,padding:"12px 16px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                    <span style={{fontSize:12,fontWeight:600,color:C.text1}}>{s.sector_icon} {s.sector_name}</span>
                    <span style={{fontSize:11,fontFamily:"'DM Mono',monospace",color:pctColor(s.pct),fontWeight:700}}>{s.pct}%</span>
                  </div>
                  <div style={{background:"#E8EBF2",borderRadius:3,height:5,overflow:"hidden",marginBottom:6}}>
                    <div style={{width:`${Math.min(s.pct,100)}%`,height:"100%",background:pctColor(s.pct),borderRadius:3}}/>
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:C.text3}}>
                    <span>Spent: {fmtCr(s.spent)}</span>
                    <span>Sanct: {fmtCr(s.sanct)}</span>
                  </div>
                </div>
              ))}
            </div>
            <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,overflow:"hidden"}}>
              <table>
                <thead><tr style={{background:C.surfaceAlt}}>
                  {["Sector","Projects","Sanctioned","Spent","Balance","Utilisation"].map(h=><th key={h} style={{padding:"10px 14px",fontSize:11,fontWeight:700,color:C.text2,letterSpacing:".05em",textTransform:"uppercase",borderBottom:`2px solid ${C.border}`,whiteSpace:"nowrap"}}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {sectorExp.map(s=>(
                    <tr key={s.sector_code}>
                      <td><b>{s.sector_icon} {s.sector_name}</b></td>
                      <td>{s.total_projects}</td>
                      <td style={{fontFamily:"'DM Mono',monospace",color:C.purple,fontWeight:600}}>{fmtCr(s.sanct)}</td>
                      <td style={{fontFamily:"'DM Mono',monospace",color:C.green,fontWeight:600}}>{fmtCr(s.spent)}</td>
                      <td style={{fontFamily:"'DM Mono',monospace",color:C.amber,fontWeight:600}}>{fmtCr(s.sanct-s.spent)}</td>
                      <td>
                        <div style={{display:"flex",alignItems:"center",gap:8}}>
                          <div style={{background:"#E8EBF2",borderRadius:3,height:5,overflow:"hidden",width:80}}>
                            <div style={{width:`${Math.min(s.pct,100)}%`,height:"100%",background:pctColor(s.pct),borderRadius:3}}/>
                          </div>
                          <span style={{fontFamily:"'DM Mono',monospace",fontSize:12,color:pctColor(s.pct),fontWeight:700}}>{s.pct}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                  <tr style={{background:C.surfaceAlt,fontWeight:700}}>
                    <td><b>TOTAL PORTFOLIO</b></td>
                    <td><b>{projects.length}</b></td>
                    <td style={{fontFamily:"'DM Mono',monospace",color:C.purple,fontWeight:700}}>{fmtCr(projects.reduce((a,p)=>a+p.current_sanctioned_cost,0))}</td>
                    <td style={{fontFamily:"'DM Mono',monospace",color:C.green,fontWeight:700}}>{fmtCr(Math.round(projects.reduce((a,p)=>a+(p.current_sanctioned_cost*p.financial_progress_pct/100),0)))}</td>
                    <td style={{fontFamily:"'DM Mono',monospace",color:C.amber,fontWeight:700}}>{fmtCr(Math.round(projects.reduce((a,p)=>a+p.current_sanctioned_cost*(1-p.financial_progress_pct/100),0)))}</td>
                    <td><span style={{fontFamily:"'DM Mono',monospace",fontSize:13,color:pctColor(finPct),fontWeight:700}}>{finPct}%</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Modal>
        );
      })()}

      {/* FIN UTIL MODAL — District + Sector breakup */}
      {showFinUtilModal&&(()=>{
        // ── Build base data ──
        const allDistExp = districts.map(d=>{
          const dProjs = projects.filter(p=>p.district===d.name);
          const spent  = dProjs.reduce((a,p)=>a+(p.current_sanctioned_cost*p.financial_progress_pct/100),0);
          const pct    = d.cost>0?Math.round(spent/d.cost*100):0;
          return {...d, spent:Math.round(spent), pct};
        });
        const allSectExp = sectorCards.map(s=>{
          const sProjs = projects.filter(p=>p.sector_code===s.sector_code);
          const spent  = sProjs.reduce((a,p)=>a+(p.current_sanctioned_cost*p.financial_progress_pct/100),0);
          const pct    = s.total_sanctioned_lakhs>0?Math.round(spent/s.total_sanctioned_lakhs*100):0;
          return {...s, spent:Math.round(spent), pct};
        });

        // ── Sorting helpers ──
        const applySortDist = (rows, mode) => {
          const r = [...rows];
          if(mode==="pct_desc")  return r.sort((a,b)=>b.pct-a.pct);
          if(mode==="pct_asc")   return r.sort((a,b)=>a.pct-b.pct);
          if(mode==="name_asc")  return r.sort((a,b)=>a.name.localeCompare(b.name));
          if(mode==="spent_desc")return r.sort((a,b)=>b.spent-a.spent);
          return r;
        };
        const applySortSect = (rows, mode) => {
          const r = [...rows];
          if(mode==="pct_desc")  return r.sort((a,b)=>b.pct-a.pct);
          if(mode==="pct_asc")   return r.sort((a,b)=>a.pct-b.pct);
          if(mode==="name_asc")  return r.sort((a,b)=>a.sector_name.localeCompare(b.sector_name));
          if(mode==="spent_desc")return r.sort((a,b)=>b.spent-a.spent);
          return r;
        };

        // ── Filter + sort ──
        const distExp = applySortDist(
          allDistExp.filter(d=>!finUtilDistSearch||d.name.toLowerCase().includes(finUtilDistSearch.toLowerCase())),
          finUtilDistSort
        );
        const sectExp = applySortSect(
          allSectExp.filter(s=>!finUtilSectSearch||s.sector_name.toLowerCase().includes(finUtilSectSearch.toLowerCase())),
          finUtilSectSort
        );

        const SortBtn = ({mode, current, setter, label}) => (
          <button onClick={()=>setter(mode)}
            style={{padding:"3px 10px",fontSize:10,fontWeight:600,borderRadius:5,cursor:"pointer",border:`1px solid ${current===mode?C.blue:C.border}`,background:current===mode?C.blueSoft:"transparent",color:current===mode?C.blue:C.text3,transition:"all .15s"}}>
            {label}
          </button>
        );

        return (
          <Modal title="Portfolio Financial Utilisation" subtitle="District & sector expenditure drill-down" onClose={()=>{setShowFinUtilModal(false);setFinUtilDistSearch("");setFinUtilSectSearch("");setFinUtilDistSort("pct_desc");setFinUtilSectSort("pct_desc");}} width={1060}>
            {/* Overall banner */}
            <div style={{background:`linear-gradient(135deg,${C.navy} 0%,${C.navyMid} 100%)`,borderRadius:12,padding:"18px 24px",marginBottom:20,display:"flex",justifyContent:"space-between",alignItems:"center",boxShadow:"0 4px 16px rgba(13,33,55,.18)"}}>
              <div>
                <div style={{fontSize:11,color:"rgba(255,255,255,.6)",fontWeight:600,textTransform:"uppercase",letterSpacing:".1em",marginBottom:4}}>Overall Portfolio Utilisation</div>
                <div style={{fontSize:13,color:"rgba(255,255,255,.75)"}}>Sanctioned: <span style={{color:"#fff",fontWeight:600}}>{fmtCr(totalCost)}</span> &nbsp;·&nbsp; Spent: <span style={{color:"#6EE7C0",fontWeight:600}}>{fmtCr(Math.round(totalSpent))}</span></div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontFamily:"'DM Mono',monospace",fontSize:38,fontWeight:800,color:pctColor(finPct)===C.green?"#6EE7C0":pctColor(finPct)===C.amber?"#FCD06A":"#FCA5A5",lineHeight:1}}>{finPct}%</div>
                <div style={{fontSize:11,color:"rgba(255,255,255,.5)",marginTop:3}}>of portfolio utilised</div>
              </div>
            </div>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>

              {/* ── District-wise ── */}
              <div>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                  <div style={{width:3,height:18,background:C.blue,borderRadius:2}}/>
                  <span style={{fontSize:13,fontWeight:700,color:C.text1}}>District-wise Utilisation</span>
                  <span style={{marginLeft:"auto",fontSize:11,color:C.text4}}>{distExp.length}/{allDistExp.length}</span>
                </div>
                {/* District filter + sort bar */}
                <div style={{display:"flex",gap:6,marginBottom:10,alignItems:"center",flexWrap:"wrap"}}>
                  <div style={{position:"relative",flex:1,minWidth:100}}>
                    <span style={{position:"absolute",left:8,top:"50%",transform:"translateY(-50%)",fontSize:11,color:C.text4}}>🔍</span>
                    <input type="text" placeholder="Search district…" value={finUtilDistSearch}
                      onChange={e=>setFinUtilDistSearch(e.target.value)}
                      style={{width:"100%",paddingLeft:26,paddingRight:8,paddingTop:5,paddingBottom:5,fontSize:11,border:`1px solid ${C.border}`,borderRadius:7,background:C.surface,color:C.text1,outline:"none"}}/>
                  </div>
                  <SortBtn mode="pct_desc"   current={finUtilDistSort} setter={setFinUtilDistSort} label="% ↓"/>
                  <SortBtn mode="pct_asc"    current={finUtilDistSort} setter={setFinUtilDistSort} label="% ↑"/>
                  <SortBtn mode="spent_desc" current={finUtilDistSort} setter={setFinUtilDistSort} label="₹ Spent"/>
                  <SortBtn mode="name_asc"   current={finUtilDistSort} setter={setFinUtilDistSort} label="A–Z"/>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:7,maxHeight:480,overflowY:"auto",paddingRight:2}}>
                  {distExp.length===0&&<div style={{textAlign:"center",padding:"24px 0",fontSize:12,color:C.text4}}>No districts match</div>}
                  {distExp.map((d,i)=>{
                    const bar=pctColor(d.pct), bg=pctBg(d.pct);
                    return (
                      <div key={d.name} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:"10px 13px",boxShadow:"0 1px 3px rgba(13,33,55,.04)"}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:7}}>
                          <div style={{display:"flex",alignItems:"center",gap:7}}>
                            <div style={{width:22,height:22,borderRadius:5,background:bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:bar,flexShrink:0}}>{i+1}</div>
                            <span style={{fontSize:12,fontWeight:600,color:C.text1}}>📍 {d.name}</span>
                          </div>
                          <span style={{fontFamily:"'DM Mono',monospace",fontSize:12,color:bar,fontWeight:800,background:bg,borderRadius:5,padding:"2px 8px"}}>{d.pct}%</span>
                        </div>
                        <div style={{background:"#E8EBF2",borderRadius:4,height:6,overflow:"hidden",marginBottom:5}}>
                          <div style={{width:`${Math.min(d.pct,100)}%`,height:"100%",background:`linear-gradient(90deg,${bar},${bar}bb)`,borderRadius:4,transition:"width .5s"}}/>
                        </div>
                        <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:C.text4}}>
                          <span>Spent: <span style={{color:C.green,fontWeight:600,fontFamily:"'DM Mono',monospace"}}>{fmtCr(d.spent)}</span></span>
                          <span>Total: <span style={{color:C.text2,fontWeight:600,fontFamily:"'DM Mono',monospace"}}>{fmtCr(d.cost)}</span></span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── Sector-wise ── */}
              <div>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                  <div style={{width:3,height:18,background:C.teal,borderRadius:2}}/>
                  <span style={{fontSize:13,fontWeight:700,color:C.text1}}>Sector-wise Utilisation</span>
                  <span style={{marginLeft:"auto",fontSize:11,color:C.text4}}>{sectExp.length}/{allSectExp.length}</span>
                </div>
                {/* Sector filter + sort bar */}
                <div style={{display:"flex",gap:6,marginBottom:10,alignItems:"center",flexWrap:"wrap"}}>
                  <div style={{position:"relative",flex:1,minWidth:100}}>
                    <span style={{position:"absolute",left:8,top:"50%",transform:"translateY(-50%)",fontSize:11,color:C.text4}}>🔍</span>
                    <input type="text" placeholder="Search sector…" value={finUtilSectSearch}
                      onChange={e=>setFinUtilSectSearch(e.target.value)}
                      style={{width:"100%",paddingLeft:26,paddingRight:8,paddingTop:5,paddingBottom:5,fontSize:11,border:`1px solid ${C.border}`,borderRadius:7,background:C.surface,color:C.text1,outline:"none"}}/>
                  </div>
                  <SortBtn mode="pct_desc"   current={finUtilSectSort} setter={setFinUtilSectSort} label="% ↓"/>
                  <SortBtn mode="pct_asc"    current={finUtilSectSort} setter={setFinUtilSectSort} label="% ↑"/>
                  <SortBtn mode="spent_desc" current={finUtilSectSort} setter={setFinUtilSectSort} label="₹ Spent"/>
                  <SortBtn mode="name_asc"   current={finUtilSectSort} setter={setFinUtilSectSort} label="A–Z"/>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:7,maxHeight:480,overflowY:"auto",paddingRight:2}}>
                  {sectExp.length===0&&<div style={{textAlign:"center",padding:"24px 0",fontSize:12,color:C.text4}}>No sectors match</div>}
                  {sectExp.map((s,i)=>{
                    const bar=pctColor(s.pct), bg=pctBg(s.pct);
                    return (
                      <div key={s.sector_code} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:"10px 13px",boxShadow:"0 1px 3px rgba(13,33,55,.04)"}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:7}}>
                          <div style={{display:"flex",alignItems:"center",gap:7}}>
                            <div style={{width:28,height:28,borderRadius:7,background:bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0}}>{s.sector_icon}</div>
                            <div>
                              <div style={{fontSize:12,fontWeight:600,color:C.text1}}>{s.sector_name}</div>
                              <div style={{fontSize:10,color:C.text4}}>{s.total_projects} projects</div>
                            </div>
                          </div>
                          <span style={{fontFamily:"'DM Mono',monospace",fontSize:12,color:bar,fontWeight:800,background:bg,borderRadius:5,padding:"2px 8px"}}>{s.pct}%</span>
                        </div>
                        <div style={{background:"#E8EBF2",borderRadius:4,height:6,overflow:"hidden",marginBottom:5}}>
                          <div style={{width:`${Math.min(s.pct,100)}%`,height:"100%",background:`linear-gradient(90deg,${bar},${bar}bb)`,borderRadius:4,transition:"width .5s"}}/>
                        </div>
                        <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:C.text4}}>
                          <span>Spent: <span style={{color:C.green,fontWeight:600,fontFamily:"'DM Mono',monospace"}}>{fmtCr(s.spent)}</span></span>
                          <span>Sanctioned: <span style={{color:C.text2,fontWeight:600,fontFamily:"'DM Mono',monospace"}}>{fmtCr(s.total_sanctioned_lakhs)}</span></span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </Modal>
        );
      })()}
      {/* ADD PROJECT MODAL */}
      {showAddModal&&(
        <Modal title="Add New Project" subtitle="Fill in project details to add to the BUIDCO portfolio" onClose={()=>setShowAddModal(false)} width={760}>
          {/* Section A: Core Identity */}
          <div style={{fontSize:11,fontWeight:700,color:C.navy,marginBottom:10,paddingBottom:6,borderBottom:`1px solid ${C.border}`,textTransform:"uppercase",letterSpacing:".06em"}}>🏗 Core Identity</div>
          <div className="form-grid">
            {F({label:"Project Code *", field:"project_code"})}
            {F({label:"Project Name *", field:"project_name"})}
          </div>
          <div className="form-grid">
            {F({label:"Sector", field:"sector_code", options:sectorCards.map(s=>({v:s.sector_code,l:`${s.sector_icon} ${s.sector_name}`}))})}
            {F({label:"District", field:"district", options:DISTRICTS.map(d=>({v:d,l:d}))})}
          </div>
          <div className="form-grid">
            {F({label:"ULB / City", field:"ulb_name"})}
            {F({label:"Contractor", field:"contractor_name"})}
          </div>
          <div className="form-grid">
            {F({label:"Sanctioned Cost (₹ Lakhs)", field:"current_sanctioned_cost", type:"number"})}
            {F({label:"Contract Value (₹ Lakhs)", field:"contract_value_lakhs", type:"number"})}
          </div>
          <div className="form-grid">
            {F({label:"Phase", field:"phase", options:PROJECT_PHASES.map(p=>({v:p,l:p}))})}
            {F({label:"Status", field:"status", options:["DPR_STAGE","TENDERING","AWARDED","IN_PROGRESS","STALLED","COMPLETED"].map(s=>({v:s,l:s}))})}
          </div>
          <div className="form-grid">
            {F({label:"Planned End Date", field:"planned_end_date", type:"date"})}
            {F({label:"Agreement Date", field:"agreement_date", type:"date"})}
          </div>
          <div className="form-grid">
            {F({label:"Agreement Number", field:"agreement_number"})}
            {F({label:"Appointed Date", field:"appointed_date", type:"date"})}
          </div>
          {/* Section B: PBG Details */}
          <div style={{fontSize:11,fontWeight:700,color:C.navy,margin:"14px 0 10px",paddingBottom:6,borderBottom:`1px solid ${C.border}`,textTransform:"uppercase",letterSpacing:".06em"}}>🔐 Performance Bank Guarantee (PBG)</div>
          <div className="form-grid">
            {F({label:"PBG Number", field:"pbg_number"})}
            {F({label:"PBG Amount (₹ Lakhs)", field:"pbg_amount_lakhs", type:"number"})}
          </div>
          <div className="form-grid">
            {F({label:"PBG Expiry Date", field:"pbg_expiry_date", type:"date"})}
            {F({label:"PBG Issuing Bank", field:"pbg_bank"})}
          </div>
          {/* Section C: EMD Details */}
          <div style={{fontSize:11,fontWeight:700,color:C.navy,margin:"14px 0 10px",paddingBottom:6,borderBottom:`1px solid ${C.border}`,textTransform:"uppercase",letterSpacing:".06em"}}>💰 Earnest Money Deposit (EMD)</div>
          <div className="form-grid">
            {F({label:"EMD Amount (₹ Lakhs)", field:"emd_amount_lakhs", type:"number"})}
            {F({label:"EMD Reference No.", field:"emd_reference"})}
          </div>
          <div className="form-grid">
            {F({label:"EMD Date", field:"emd_date", type:"date"})}
            {F({label:"Mobilization Advance (₹ Lakhs)", field:"mobilization_advance_lakhs", type:"number"})}
          </div>
          {/* Section D: Payments */}
          <div style={{fontSize:11,fontWeight:700,color:C.navy,margin:"14px 0 10px",paddingBottom:6,borderBottom:`1px solid ${C.border}`,textTransform:"uppercase",letterSpacing:".06em"}}>💳 Payments</div>
          <div className="form-grid">
            {F({label:"Total Payments Made (₹ Lakhs)", field:"payments_made_lakhs", type:"number"})}
            {F({label:"Last Payment Date", field:"last_payment_date", type:"date"})}
          </div>
          <div className="form-grid">
            {F({label:"Last RA Bill No.", field:"last_ra_bill_no"})}
            {F({label:"Retention Money (₹ Lakhs)", field:"retention_money_lakhs", type:"number"})}
          </div>
          <div style={{display:"flex",gap:10,marginTop:14,alignItems:"center",flexWrap:"wrap"}}>
            <button className="btn-primary" onClick={saveAdd} disabled={saving}>{saving?"Saving…":"✓ Add Project"}</button>
            <button className="btn-ghost" onClick={()=>{setShowAddModal(false);setSaveError(null);}} disabled={saving}>Cancel</button>
            {saveError&&showAddModal&&<span style={{color:C.red,fontSize:12,fontWeight:600}}>{saveError}</span>}
          </div>
        </Modal>
      )}

      {/* EDIT PROJECT MODAL */}
      {showEditModal&&editProject&&(
        <Modal title="Edit Project Details" subtitle={editProject.project_code} onClose={()=>setShowEditModal(false)} width={760}>
          <div style={{fontSize:11,fontWeight:700,color:C.navy,marginBottom:10,paddingBottom:6,borderBottom:`1px solid ${C.border}`,textTransform:"uppercase",letterSpacing:".06em"}}>🏗 Core Details</div>
          <div className="form-grid">
            {F({label:"Project Name", field:"project_name"})}
            {F({label:"Contractor", field:"contractor_name"})}
          </div>
          <div className="form-grid">
            {F({label:"Phase", field:"phase", options:PROJECT_PHASES})}
            {F({label:"Status", field:"status", options:["DPR_STAGE","TENDERING","AWARDED","IN_PROGRESS","STALLED","COMPLETED","CANCELLED"]})}
          </div>
          <div className="form-grid">
            {F({label:"Physical Progress %", field:"actual_physical_pct", type:"number"})}
            {F({label:"Financial Progress %", field:"financial_progress_pct", type:"number"})}
          </div>
          <div className="form-grid">
            <div style={{display:"flex",flexDirection:"column",gap:5}}>
              <label style={{fontSize:11,color:C.text3,fontWeight:600,textTransform:"uppercase",letterSpacing:".05em"}}>Delay Days (auto-calculated from Revised End Date)</label>
              <input type="number" value={editForm.delay_days||0} readOnly style={{background:C.surfaceAlt,cursor:"not-allowed",border:`1px solid ${C.border}`,borderRadius:8,padding:"8px 12px",fontSize:13,color:C.text3}}/>
            </div>
            {F({label:"Revised End Date (controls delay)", field:"revised_end_date", type:"date"})}
          </div>
          <div className="form-grid">
            {F({label:"Delay Reason", field:"delay_reason"})}
            {F({label:"Dept Stuck At", field:"dept_stuck"})}
          </div>
          <div className="form-grid">
            {F({label:"Sanctioned Cost (₹ Lakhs)", field:"current_sanctioned_cost", type:"number"})}
            {F({label:"Contract Value (₹ Lakhs)", field:"contract_value_lakhs", type:"number"})}
          </div>
          <div className="form-grid">
            {F({label:"Agreement Number", field:"agreement_number"})}
            {F({label:"Agreement Date", field:"agreement_date", type:"date"})}
          </div>
          <div className="form-grid">
            {F({label:"Appointed Date", field:"appointed_date", type:"date"})}
            {F({label:"Planned End Date", field:"planned_end_date", type:"date"})}
          </div>
          {/* PBG */}
          <div style={{fontSize:11,fontWeight:700,color:C.navy,margin:"14px 0 10px",paddingBottom:6,borderBottom:`1px solid ${C.border}`,textTransform:"uppercase",letterSpacing:".06em"}}>🔐 PBG Details</div>
          <div className="form-grid">
            {F({label:"PBG Number", field:"pbg_number"})}
            {F({label:"PBG Amount (₹ Lakhs)", field:"pbg_amount_lakhs", type:"number"})}
          </div>
          <div className="form-grid">
            {F({label:"PBG Expiry Date", field:"pbg_expiry_date", type:"date"})}
            {F({label:"PBG Issuing Bank", field:"pbg_bank"})}
          </div>
          {/* EMD */}
          <div style={{fontSize:11,fontWeight:700,color:C.navy,margin:"14px 0 10px",paddingBottom:6,borderBottom:`1px solid ${C.border}`,textTransform:"uppercase",letterSpacing:".06em"}}>💰 EMD Details</div>
          <div className="form-grid">
            {F({label:"EMD Amount (₹ Lakhs)", field:"emd_amount_lakhs", type:"number"})}
            {F({label:"EMD Reference No.", field:"emd_reference"})}
          </div>
          <div className="form-grid">
            {F({label:"EMD Date", field:"emd_date", type:"date"})}
            {F({label:"Mobilization Advance (₹ Lakhs)", field:"mobilization_advance_lakhs", type:"number"})}
          </div>
          {/* Payments */}
          <div style={{fontSize:11,fontWeight:700,color:C.navy,margin:"14px 0 10px",paddingBottom:6,borderBottom:`1px solid ${C.border}`,textTransform:"uppercase",letterSpacing:".06em"}}>💳 Payments</div>
          <div className="form-grid">
            {F({label:"Total Payments Made (₹ Lakhs)", field:"payments_made_lakhs", type:"number"})}
            {F({label:"Last Payment Date", field:"last_payment_date", type:"date"})}
          </div>
          <div className="form-grid">
            {F({label:"Last RA Bill No.", field:"last_ra_bill_no"})}
            {F({label:"Retention Money (₹ Lakhs)", field:"retention_money_lakhs", type:"number"})}
          </div>
          <div style={{display:"flex",gap:10,marginTop:14,alignItems:"center",flexWrap:"wrap"}}>
            <button className="btn-primary" onClick={saveEdit} disabled={saving}>{saving?"Saving…":"✓ Save Changes"}</button>
            <button className="btn-ghost" onClick={()=>{setShowEditModal(false);setSaveError(null);}} disabled={saving}>Cancel</button>
            {saveError&&showEditModal&&<span style={{color:C.red,fontSize:12,fontWeight:600}}>{saveError}</span>}
          </div>
        </Modal>
      )}
    </div>
  );
}
