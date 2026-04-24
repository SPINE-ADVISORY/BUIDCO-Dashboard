/* eslint-disable react/prop-types */
import { useState, useEffect } from "react";
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

const STAGE_ORDER = [
  "Conceptualization",
  "Pre-Tender",
  "Tender",
  "Post-Tender",
  "Construction",
  "O&M",
  "Completed",
];

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
  const [showPhysProgressModal, setShowPhysProgressModal] = useState(false);
  const [showFinanceModal, setShowFinanceModal] = useState(false);
  const [modalFilters, setModalFilters]                 = useState({});
  const [tenderFilters, setTenderFilters]               = useState({});
  const [mgmtFilters, setMgmtFilters]                   = useState({});
  const [showAddModal, setShowAddModal]         = useState(false);
  const [showEditModal, setShowEditModal]       = useState(false);
  const [editProject, setEditProject]           = useState(null);
  const [editForm, setEditForm]                 = useState({});
  const [addForm, setAddForm]                   = useState({});

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
    setShowAddModal(true);
  };
  const saveAdd = () => {
    if(!addForm.project_name||!addForm.project_code) return alert("Project Code and Name are required.");
    const sec = sectorCards.find(s=>s.sector_code===addForm.sector_code);
    setProjects(prev=>[...prev,{
      project_id:takeNextProjectId(),
      project_code:addForm.project_code,
      project_name:addForm.project_name,
      sector_code:addForm.sector_code,
      sector_name:sec?.sector_name||"",
      sector_icon:sec?.sector_icon||"",
      district:addForm.district||"Patna",
      ulb_name:addForm.ulb_name||addForm.district||"",
      contractor_name:addForm.contractor_name||"TBD",
      current_sanctioned_cost:parseFloat(addForm.current_sanctioned_cost)||0,
      financial_progress_pct:0,actual_physical_pct:0,scheduled_physical_pct:0,
      delay_days:0,planned_end_date:addForm.planned_end_date||"2027-12-31",revised_end_date:null,
      total_cos_count:0,total_eot_days:0,
      phase:addForm.phase||"Conceptualization",
      delay_reason:null,dept_stuck:null,
      latitude:null,longitude:null,chainage:null,
      status:addForm.status||"DPR_STAGE",
    }]);
    setShowAddModal(false);
  };
  const saveEdit = () => {
    setProjects(prev=>prev.map(p=>p.project_id===editProject.project_id?{...p,...editForm}:p));
    setShowEditModal(false);
  };

  const saveMdInputForm = () => {
    if (!mdInputProject) return;
    setProjects((prev) =>
      prev.map((p) =>
        p.project_id === mdInputProject.project_id ? { ...p, ...mdInputForm } : p
      )
    );
    setMdInputSaved(true);
    setTimeout(() => setMdInputSaved(false), 1500);
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
                        <span style={{fontSize:11,color:C.text3,marginLeft:8}}>All {projects.length} projects</span>
                      </div>
                      <span style={{fontSize:10,color:C.blue,fontWeight:500,letterSpacing:".02em"}}>STAGE DISTRIBUTION</span>
                    </div>
                    <div style={{fontSize:10,color:C.text4,marginBottom:14}}>Click a stage card to filter in Projects tab</div>
                    <div style={{display:"flex",gap:10,alignItems:"stretch"}}>
                      {stageData.map(d=>{
                        const pal  = STAGE_PALETTE[d.stage] || STAGE_PALETTE["Completed"];
                        return (
                          <div key={d.stage}
                            onClick={()=>{ setActiveTab("projects"); projTable.setSearch(""); projTable.setFilters({ phase: d.stage }); }}
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
                  <div onClick={()=>setShowFinUtilModal(true)} style={{cursor:"pointer",marginBottom:22}}>
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

                  <div onClick={()=>setShowPhysProgressModal(true)} style={{cursor:"pointer"}}>
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
              const totalContract = projects.reduce((a,p)=>a+(Number(p.contract_value_lakhs)||0),0);
              const totalPaid     = projects.reduce((a,p)=>a+(Number(p.payments_made_lakhs)||0),0);
              const paidPct       = totalContract>0?Math.round(totalPaid/totalContract*100):0;
              const alertCount    = projects.filter(p=>p.pbg_expiry_date && p.pbg_amount_lakhs>0).length;
              return (
                <div style={{background:"linear-gradient(135deg,#EFF9FB 0%,#F3EFFE 100%)",border:`1px solid ${C.border}`,borderRadius:16,padding:"20px 24px",marginBottom:28,boxShadow:"0 1px 6px rgba(13,33,55,.06)"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <span style={{background:C.teal,color:"white",borderRadius:8,padding:"3px 12px",fontSize:11,fontWeight:700}}>🏦 Finance &amp; Payments</span>
                      <span style={{fontSize:11,color:C.text3}}>{projects.filter(p=>Number(p.payments_made_lakhs||0)>0).length} projects with payment data</span>
                    </div>
                    <div style={{display:"flex",gap:8,alignItems:"center"}}>
                      {alertCount>0&&(
                        <span style={{background:C.redSoft,color:C.red,border:`1px solid ${C.red}30`,borderRadius:6,padding:"3px 10px",fontSize:11,fontWeight:700}}>
                          ⚠ Review PBG/EMD/Payments
                        </span>
                      )}
                      <button onClick={()=>setShowFinanceModal(true)} style={{padding:"5px 14px",fontSize:11,fontWeight:600,borderRadius:8,cursor:"pointer",border:`1px solid ${C.teal}`,background:C.teal,color:"white"}}>
                        Full Detail →
                      </button>
                    </div>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
                    {[
                      ["Contract Value (₹ L)", totalContract, C.purple],
                      ["Paid to Date (₹ L)", totalPaid, C.green],
                      ["Paid %", paidPct, pctColor(paidPct)],
                      ["Projects w/ PBG", projects.filter(p=>Number(p.pbg_amount_lakhs||0)>0).length, C.amber],
                    ].map(([label,val,col])=>(
                      <div key={label} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:"14px 18px"}}>
                        <div style={{fontSize:10,color:C.text3,fontWeight:600,textTransform:"uppercase",letterSpacing:".07em",marginBottom:6}}>{label}</div>
                        <div style={{fontFamily:"'DM Mono',monospace",fontSize:17,fontWeight:700,color:col,lineHeight:1}}>
                          {label==="Paid %"?`${val}%`:fmtLakhInt(val)}
                        </div>
                      </div>
                    ))}
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
              <ProjectsTable projects={secProjects} allProjectsForFilters={projects} onSelect={p=>{setSelectedProject(p);setActiveTab("projects")}} onEdit={p=>{setEditProject(p);setEditForm({...p});setShowEditModal(true)}} canEdit={perms.can_edit}/>
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
              onEdit={p=>{setEditProject(p);setEditForm({...p});setShowEditModal(true)}}
              canEdit={perms.can_edit}
              filters={projTable.filters} setFilters={projTable.setFilters}
              sortField={projTable.sortField} setSortField={projTable.setSortField}
              sortDir={projTable.sortDir} setSortDir={projTable.setSortDir}
            />
          </div>
        )}

        {activeTab==="projects"&&selectedProject&&(
          <ProjectDetail project={selectedProject} onBack={()=>setSelectedProject(null)} onEdit={p=>{setEditProject(p);setEditForm({...p});setShowEditModal(true)}} canEdit={perms.can_edit}/>
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
                              <button className="btn-primary" style={{padding:"5px 14px",fontSize:12}} onClick={()=>{setMdInputProject(p);setMdInputForm({...p});}}>✏ Edit</button>
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

                const removeCosRow = uid => setMdCosData(prev => prev.filter(c => c._uid !== uid));

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
                      <button className="btn-primary" style={{padding:"9px 22px",fontSize:13,whiteSpace:"nowrap",flexShrink:0}} onClick={saveMdInputForm}>✓ Save All Changes</button>
                      <button className="btn-ghost" style={{whiteSpace:"nowrap",flexShrink:0}} onClick={()=>{setMdInputProject(null);setMdInputForm({});}}>✕ Cancel</button>
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
                          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
                            <CosField label="Original End Date" fkey="original_end_date" type="date" row={cos} onChange={(k,v)=>updateCos(cos._uid,k,v)}/>
                            <CosField label="New End Date (after EoT)" fkey="new_end_date" type="date" row={cos} onChange={(k,v)=>updateCos(cos._uid,k,v)}/>
                            <CosField label="Revised Date (if different)" fkey="revised_date" type="date" row={cos} onChange={(k,v)=>updateCos(cos._uid,k,v)}/>
                          </div>
                        </div>
                      ))}

                      <div style={{display:"flex",gap:14,alignItems:"center",padding:"20px 0 10px"}}>
                        <button className="btn-primary" style={{padding:"12px 36px",fontSize:14}} onClick={saveMdInputForm}>✓ Save All Changes</button>
                        <button className="btn-ghost" style={{padding:"12px 22px"}} onClick={()=>{setMdInputProject(null);setMdInputForm({});}}>Cancel</button>
                        {mdInputSaved&&<span style={{color:C.green,fontSize:13,fontWeight:600}}>✓ Saved</span>}
                      </div>
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
        const sectorRows = sectorCards.map(s=>{
          const ps = projects.filter(p=>p.sector_code===s.sector_code);
          const avgAct = ps.length?Math.round(ps.reduce((a,p)=>a+p.actual_physical_pct,0)/ps.length):0;
          const avgSch = ps.length?Math.round(ps.reduce((a,p)=>a+p.scheduled_physical_pct,0)/ps.length):0;
          return { ...s, count: ps.length, avgAct, avgSch, gap: avgSch-avgAct };
        }).sort((a,b)=>b.gap-a.gap);
        const distRows = districts.map(d=>{
          const ps = projects.filter(p=>p.district===d.name);
          const avgAct = ps.length?Math.round(ps.reduce((a,p)=>a+p.actual_physical_pct,0)/ps.length):0;
          const avgSch = ps.length?Math.round(ps.reduce((a,p)=>a+p.scheduled_physical_pct,0)/ps.length):0;
          return { ...d, avgAct, avgSch, gap: avgSch-avgAct, count: ps.length };
        }).sort((a,b)=>b.gap-a.gap);
        return (
          <Modal title="Portfolio Physical Progress" subtitle="Actual vs scheduled (averages) by sector and district" onClose={()=>setShowPhysProgressModal(false)} width={1100}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
              <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,overflow:"hidden"}}>
                <div style={{padding:"12px 16px",borderBottom:`1px solid ${C.border}`,fontSize:12,fontWeight:700,color:C.text1}}>By Sector</div>
                <table>
                  <thead><tr style={{background:C.surfaceAlt}}>
                    {["Sector","Projects","Actual %","Scheduled %","Gap"].map(h=>(
                      <th key={h} style={{padding:"10px 14px",textAlign:"left",fontSize:11,fontWeight:700,color:C.text2,letterSpacing:".05em",textTransform:"uppercase",borderBottom:`2px solid ${C.border}`,whiteSpace:"nowrap"}}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {sectorRows.map(r=>(
                      <tr key={r.sector_code}>
                        <td style={{fontWeight:700,color:C.text1}}>{r.sector_icon} {r.sector_name}</td>
                        <td><Badge color={C.blue}>{r.count}</Badge></td>
                        <td style={{fontFamily:"'DM Mono',monospace",color:pctColor(r.avgAct),fontWeight:700}}>{r.avgAct}%</td>
                        <td style={{fontFamily:"'DM Mono',monospace",color:C.blue,fontWeight:700}}>{r.avgSch}%</td>
                        <td style={{fontFamily:"'DM Mono',monospace",color:r.gap>0?C.red:C.green,fontWeight:800}}>{r.gap>0?`-${r.gap}%`:`+${Math.abs(r.gap)}%`}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,overflow:"hidden"}}>
                <div style={{padding:"12px 16px",borderBottom:`1px solid ${C.border}`,fontSize:12,fontWeight:700,color:C.text1}}>By District</div>
                <table>
                  <thead><tr style={{background:C.surfaceAlt}}>
                    {["District","Projects","Actual %","Scheduled %","Gap"].map(h=>(
                      <th key={h} style={{padding:"10px 14px",textAlign:"left",fontSize:11,fontWeight:700,color:C.text2,letterSpacing:".05em",textTransform:"uppercase",borderBottom:`2px solid ${C.border}`,whiteSpace:"nowrap"}}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {distRows.map(r=>(
                      <tr key={r.name}>
                        <td style={{fontWeight:700,color:C.text1}}>📍 {r.name}</td>
                        <td><Badge color={C.blue}>{r.count}</Badge></td>
                        <td style={{fontFamily:"'DM Mono',monospace",color:pctColor(r.avgAct),fontWeight:700}}>{r.avgAct}%</td>
                        <td style={{fontFamily:"'DM Mono',monospace",color:C.blue,fontWeight:700}}>{r.avgSch}%</td>
                        <td style={{fontFamily:"'DM Mono',monospace",color:r.gap>0?C.red:C.green,fontWeight:800}}>{r.gap>0?`-${r.gap}%`:`+${Math.abs(r.gap)}%`}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Modal>
        );
      })()}

      {showFinanceModal&&(
        <Modal title="Finance & Payments" subtitle="Portfolio-level contract / payment / security fields (editable via MD Input Sheet)" onClose={()=>setShowFinanceModal(false)} width={1200}>
          <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,overflow:"auto"}}>
            <table style={{minWidth:1100}}>
              <thead>
                <tr style={{background:C.surfaceAlt}}>
                  {["Project","Contract (₹ L)","Paid (₹ L)","Balance (₹ L)","PBG (₹ L)","PBG Expiry","EMD (₹ L)"].map(h=>(
                    <th key={h} style={{padding:"10px 14px",textAlign:"left",fontSize:11,fontWeight:700,color:C.text2,letterSpacing:".05em",textTransform:"uppercase",borderBottom:`2px solid ${C.border}`,whiteSpace:"nowrap"}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {projects.map(p=>{
                  const contract = Number(p.contract_value_lakhs||0);
                  const paid = Number(p.payments_made_lakhs||0);
                  const bal = Math.max(0, contract-paid);
                  return (
                    <tr key={p.project_id}>
                      <td>
                        <div style={{fontSize:10,color:C.text4,fontFamily:"'DM Mono',monospace"}}>{p.project_code}</div>
                        <div style={{fontSize:12,fontWeight:700,color:C.text1,marginTop:2,maxWidth:260}}>{p.project_name}</div>
                      </td>
                      <td style={{fontFamily:"'DM Mono',monospace",color:C.purple,fontWeight:700}}>{contract?fmtLakhInt(contract):"—"}</td>
                      <td style={{fontFamily:"'DM Mono',monospace",color:C.green,fontWeight:800}}>{paid?fmtLakhInt(paid):"—"}</td>
                      <td style={{fontFamily:"'DM Mono',monospace",color:C.amber,fontWeight:700}}>{contract?fmtLakhInt(bal):"—"}</td>
                      <td style={{fontFamily:"'DM Mono',monospace",color:C.teal,fontWeight:700}}>{p.pbg_amount_lakhs?fmtLakhInt(p.pbg_amount_lakhs):"—"}</td>
                      <td style={{fontFamily:"'DM Mono',monospace",color:C.text3,fontWeight:600}}>{p.pbg_expiry_date||"—"}</td>
                      <td style={{fontFamily:"'DM Mono',monospace",color:C.orange,fontWeight:700}}>{p.emd_amount_lakhs?fmtLakhInt(p.emd_amount_lakhs):"—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Modal>
      )}

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
        const distExp = districts.map(d=>{
          const dProjs  = projects.filter(p=>p.district===d.name);
          const spent   = dProjs.reduce((a,p)=>a+(p.current_sanctioned_cost*p.financial_progress_pct/100),0);
          const pct     = d.cost>0?Math.round(spent/d.cost*100):0;
          return {...d, spent:Math.round(spent), pct};
        }).sort((a,b)=>b.pct-a.pct);
        return (
          <Modal title="Financial Utilisation — District & Sector Breakup" subtitle="Sanctioned cost vs expenditure drill-down by district" onClose={()=>setShowFinUtilModal(false)} width={960}>
            <div style={{background:C.amberSoft,border:`1px solid ${C.amber}30`,borderRadius:8,padding:"10px 16px",marginBottom:16,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{fontSize:13,color:C.amber,fontWeight:600}}>Overall Portfolio Utilisation</span>
              <span style={{fontFamily:"'DM Mono',monospace",fontSize:18,color:C.amber,fontWeight:700}}>{finPct}%</span>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
              <div>
                <div style={{fontSize:12,fontWeight:700,color:C.text1,marginBottom:12,paddingBottom:8,borderBottom:`1px solid ${C.border}`}}>District-wise Utilisation</div>
                {distExp.map(d=>(
                  <div key={d.name} style={{marginBottom:10}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                      <span style={{fontSize:12,color:C.text1}}>📍 {d.name}</span>
                      <span style={{fontSize:11,fontFamily:"'DM Mono',monospace",color:pctColor(d.pct),fontWeight:700}}>{d.pct}% — {fmtCr(d.spent)} / {fmtCr(d.cost)}</span>
                    </div>
                    <div style={{background:"#E8EBF2",borderRadius:3,height:6,overflow:"hidden"}}>
                      <div style={{width:`${Math.min(d.pct,100)}%`,height:"100%",background:pctColor(d.pct),borderRadius:3}}/>
                    </div>
                  </div>
                ))}
              </div>
              <div>
                <div style={{fontSize:12,fontWeight:700,color:C.text1,marginBottom:12,paddingBottom:8,borderBottom:`1px solid ${C.border}`}}>Sector-wise Utilisation</div>
                {sectorCards.map(s=>{
                  const sProjs = projects.filter(p=>p.sector_code===s.sector_code);
                  const spent  = sProjs.reduce((a,p)=>a+(p.current_sanctioned_cost*p.financial_progress_pct/100),0);
                  const pct    = s.total_sanctioned_lakhs>0?Math.round(spent/s.total_sanctioned_lakhs*100):0;
                  return (
                    <div key={s.sector_code} style={{marginBottom:10}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                        <span style={{fontSize:12,color:C.text1}}>{s.sector_icon} {s.sector_name}</span>
                        <span style={{fontSize:11,fontFamily:"'DM Mono',monospace",color:pctColor(pct),fontWeight:700}}>{pct}% — {fmtCr(Math.round(spent))}</span>
                      </div>
                      <div style={{background:"#E8EBF2",borderRadius:3,height:6,overflow:"hidden"}}>
                        <div style={{width:`${Math.min(pct,100)}%`,height:"100%",background:pctColor(pct),borderRadius:3}}/>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Modal>
        );
      })()}
      {/* ADD PROJECT MODAL */}
      {showAddModal&&(
        <Modal title="Add New Project" subtitle="Fill in project details to add to the BUIDCO portfolio" onClose={()=>setShowAddModal(false)} width={700}>
          <div className="form-grid">
            <F label="Project Code *" field="project_code"/>
            <F label="Project Name *" field="project_name"/>
          </div>
          <div className="form-grid">
            <F label="Sector" field="sector_code" options={sectorCards.map(s=>({v:s.sector_code,l:`${s.sector_icon} ${s.sector_name}`}))}/>
            <F label="District" field="district" options={DISTRICTS}/>
          </div>
          <div className="form-grid">
            <F label="ULB / City" field="ulb_name"/>
            <F label="Contractor" field="contractor_name"/>
          </div>
          <div className="form-grid">
            <F label="Sanctioned Cost (₹ Lakhs)" field="current_sanctioned_cost" type="number"/>
            <F label="Phase" field="phase" options={PROJECT_PHASES}/>
          </div>
          <div className="form-grid">
            <F label="Planned End Date" field="planned_end_date" type="date"/>
            <F label="Status" field="status" options={["DPR_STAGE","TENDERING","AWARDED","IN_PROGRESS","STALLED","COMPLETED"]}/>
          </div>
          <div style={{display:"flex",gap:10,marginTop:8}}>
            <button className="btn-primary" onClick={saveAdd}>✓ Add Project</button>
            <button className="btn-ghost" onClick={()=>setShowAddModal(false)}>Cancel</button>
          </div>
        </Modal>
      )}

      {/* EDIT PROJECT MODAL */}
      {showEditModal&&editProject&&(
        <Modal title="Edit Project Details" subtitle={editProject.project_code} onClose={()=>setShowEditModal(false)} width={700}>
          <div className="form-grid">
            <F label="Project Name" field="project_name"/>
            <F label="Contractor" field="contractor_name"/>
          </div>
          <div className="form-grid">
            <F label="Physical Progress %" field="actual_physical_pct" type="number"/>
            <F label="Financial Progress %" field="financial_progress_pct" type="number"/>
          </div>
          <div className="form-grid">
            <F label="Delay Days" field="delay_days" type="number"/>
            <F label="Revised End Date" field="revised_end_date" type="date"/>
          </div>
          <div className="form-grid">
            <F label="Phase" field="phase" options={PROJECT_PHASES}/>
            <F label="Status" field="status" options={["DPR_STAGE","TENDERING","AWARDED","IN_PROGRESS","STALLED","COMPLETED","CANCELLED"]}/>
          </div>
          <div className="form-grid">
            <F label="Delay Reason" field="delay_reason"/>
            <F label="Dept Stuck At" field="dept_stuck"/>
          </div>
          <div style={{display:"flex",gap:10,marginTop:8}}>
            <button className="btn-primary" onClick={saveEdit}>✓ Save Changes</button>
            <button className="btn-ghost" onClick={()=>setShowEditModal(false)}>Cancel</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
