import { useState, useEffect, useRef } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const C = {
  bg:"#F4F6FB", surface:"#FFFFFF", surfaceAlt:"#F8F9FC",
  border:"#E2E6EF", borderStrong:"#CBD2E0",
  navy:"#0D2137", navyMid:"#1B3A5C",
  blue:"#1A5CFF", blueSoft:"#EEF3FF",
  teal:"#0891B2", tealSoft:"#EFF9FB",
  green:"#0A7540", greenSoft:"#EDFAF3",
  amber:"#B45309", amberSoft:"#FEF7EC",
  red:"#C0392B", redSoft:"#FEF0EF",
  orange:"#C2530B", orangeSoft:"#FEF3EE",
  purple:"#5B21B6", purpleSoft:"#F3EFFE",
  text1:"#0D2137", text2:"#374151", text3:"#6B7280", text4:"#9CA3AF",
  white:"#FFFFFF",
};

const PHASE_COLOR = {
  "Conceptualization":C.purple,"Pre-Tender":C.blue,"Tender":C.teal,
  "Post-Tender":"#0E7490","Construction":C.amber,"O&M":C.green,"Completed":C.text3,
};
const SEV_COLOR = { CRITICAL:C.red, HIGH:C.orange, MEDIUM:C.amber, LOW:C.text3 };

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const fmtCr = v => {
  const cr = v / 100;
  return "₹\u2009" + cr.toLocaleString("en-IN",{minimumFractionDigits:1,maximumFractionDigits:1}) + "\u2009Cr";
};
const fmtLakh = v => "₹\u2009" + Number(v).toLocaleString("en-IN",{minimumFractionDigits:2,maximumFractionDigits:2}) + "\u2009L";
const fmtLakhInt = v => "₹\u2009" + Number(v).toLocaleString("en-IN") + "\u2009L";
const pctColor = v => v >= 75 ? C.green : v >= 50 ? C.amber : C.red;
const pctBg    = v => v >= 75 ? C.greenSoft : v >= 50 ? C.amberSoft : C.redSoft;

// ─── DATA ─────────────────────────────────────────────────────────────────────
const SECTORS = [
  {sector_code:"WATER", sector_name:"Water Supply",    sector_icon:"💧",total_projects:8, avg_physical_pct:62,financial_utilisation_pct:54,delayed_count:2,dc_flag_count:3,total_sanctioned_lakhs:145200},
  {sector_code:"SEW",   sector_name:"Sewerage & STP",  sector_icon:"🏗",total_projects:7, avg_physical_pct:41,financial_utilisation_pct:38,delayed_count:3,dc_flag_count:5,total_sanctioned_lakhs:118600},
  {sector_code:"DRAIN", sector_name:"Storm Drainage",  sector_icon:"🌧",total_projects:7, avg_physical_pct:55,financial_utilisation_pct:47,delayed_count:2,dc_flag_count:2,total_sanctioned_lakhs:62100},
  {sector_code:"SWM",   sector_name:"Solid Waste",     sector_icon:"♻",total_projects:6, avg_physical_pct:78,financial_utilisation_pct:71,delayed_count:1,dc_flag_count:0,total_sanctioned_lakhs:39800},
  {sector_code:"TRAN",  sector_name:"Urban Transport", sector_icon:"🚌",total_projects:7, avg_physical_pct:33,financial_utilisation_pct:29,delayed_count:4,dc_flag_count:4,total_sanctioned_lakhs:96400},
  {sector_code:"HOUSE", sector_name:"Housing",         sector_icon:"🏘",total_projects:8, avg_physical_pct:69,financial_utilisation_pct:63,delayed_count:2,dc_flag_count:1,total_sanctioned_lakhs:132700},
  {sector_code:"RIVER", sector_name:"Riverfront",      sector_icon:"🌊",total_projects:6, avg_physical_pct:22,financial_utilisation_pct:18,delayed_count:3,dc_flag_count:2,total_sanctioned_lakhs:48200},
  {sector_code:"LIGHT", sector_name:"Street Lighting", sector_icon:"💡",total_projects:6, avg_physical_pct:84,financial_utilisation_pct:79,delayed_count:0,dc_flag_count:0,total_sanctioned_lakhs:18400},
  {sector_code:"MARKET",sector_name:"Markets",         sector_icon:"🏪",total_projects:6, avg_physical_pct:57,financial_utilisation_pct:51,delayed_count:1,dc_flag_count:1,total_sanctioned_lakhs:28700},
  {sector_code:"BEAUTY",sector_name:"Beautification",  sector_icon:"🌳",total_projects:6, avg_physical_pct:91,financial_utilisation_pct:87,delayed_count:0,dc_flag_count:0,total_sanctioned_lakhs:11200},
  {sector_code:"ROAD",  sector_name:"Road & Bridges",  sector_icon:"🛣",total_projects:8, avg_physical_pct:47,financial_utilisation_pct:41,delayed_count:3,dc_flag_count:3,total_sanctioned_lakhs:84600},
];

const PROJECT_PHASES = ["Conceptualization","Pre-Tender","Tender","Post-Tender","Construction","O&M","Completed"];
const ACTIVE_TENDER_PHASES = ["Conceptualization","Pre-Tender","Tender","Post-Tender"];
// Role permissions: MD can edit+add, DC can view only, PMU_ENGINEER can edit only
const ROLE_PERMISSIONS = {
  MD:           { can_edit:true,  can_add:true  },
  DC:           { can_edit:false, can_add:false },
  PMU_ENGINEER: { can_edit:true,  can_add:false },
  FINANCE:      { can_edit:false, can_add:false },
  READ_ONLY:    { can_edit:false, can_add:false },
};

const DISTRICTS = [
  "Patna","Muzaffarpur","Gaya","Bhagalpur","Darbhanga","Begusarai",
  "Purnia","Ara","Samastipur","Munger","Chapra","Sitamarhi","Madhubani","Supaul","Saharsa"
];

let _nextId = 76;
const PROJECTS_INIT = [
  // WATER (8)
  {project_id:1, project_code:"BU/WATER/PAT/2021/07",project_name:"Patna 24×7 Water Supply",         sector_code:"WATER",sector_name:"Water Supply",   sector_icon:"💧",district:"Patna",      ulb_name:"Patna",      contractor_name:"L&T Construction",       current_sanctioned_cost:91000,financial_progress_pct:71.2,actual_physical_pct:74,scheduled_physical_pct:70,delay_days:0,  planned_end_date:"2026-09-30",revised_end_date:null,        total_cos_count:1,total_eot_days:0,  phase:"Construction",delay_reason:null,           dept_stuck:null,               latitude:25.5941,longitude:85.1376,chainage:null,         status:"IN_PROGRESS"},
  {project_id:2, project_code:"BU/WATER/GAY/2025/01",project_name:"Gaya Water Treatment Plant",       sector_code:"WATER",sector_name:"Water Supply",   sector_icon:"💧",district:"Gaya",       ulb_name:"Gaya",       contractor_name:"TBD",                     current_sanctioned_cost:31000,financial_progress_pct:0,    actual_physical_pct:0, scheduled_physical_pct:0, delay_days:0,  planned_end_date:"2028-03-31",revised_end_date:null,        total_cos_count:0,total_eot_days:0,  phase:"Conceptualization",delay_reason:null,       dept_stuck:null,               latitude:24.8000,longitude:85.0100,chainage:null,         status:"DPR_STAGE"},
  {project_id:3, project_code:"BU/WATER/MUZ/2023/04",project_name:"Muzaffarpur Water Supply Aug.",    sector_code:"WATER",sector_name:"Water Supply",   sector_icon:"💧",district:"Muzaffarpur",ulb_name:"Muzaffarpur",contractor_name:"Dilip Buildcon Ltd",      current_sanctioned_cost:54200,financial_progress_pct:44.1,actual_physical_pct:47,scheduled_physical_pct:55,delay_days:18, planned_end_date:"2026-03-31",revised_end_date:"2026-06-30",total_cos_count:1,total_eot_days:31,  phase:"Construction",delay_reason:"Land acquisition pending",dept_stuck:"Revenue Dept",    latitude:26.1197,longitude:85.3910,chainage:null,         status:"IN_PROGRESS"},
  {project_id:4, project_code:"BU/WATER/BGS/2022/02",project_name:"Begusarai OHT & Dist. Network",    sector_code:"WATER",sector_name:"Water Supply",   sector_icon:"💧",district:"Begusarai",  ulb_name:"Begusarai",  contractor_name:"PNC Infratech",           current_sanctioned_cost:38700,financial_progress_pct:62.5,actual_physical_pct:65,scheduled_physical_pct:62,delay_days:0,  planned_end_date:"2026-12-31",revised_end_date:null,        total_cos_count:0,total_eot_days:0,  phase:"Construction",delay_reason:null,           dept_stuck:null,               latitude:25.4182,longitude:86.1272,chainage:null,         status:"IN_PROGRESS"},
  {project_id:5, project_code:"BU/WATER/DSB/2024/03",project_name:"Darbhanga Piped Water Project",    sector_code:"WATER",sector_name:"Water Supply",   sector_icon:"💧",district:"Darbhanga",  ulb_name:"Darbhanga",  contractor_name:"Tata Projects",           current_sanctioned_cost:42800,financial_progress_pct:18.2,actual_physical_pct:20,scheduled_physical_pct:25,delay_days:12, planned_end_date:"2027-06-30",revised_end_date:"2027-09-30",total_cos_count:0,total_eot_days:30,  phase:"Pre-Tender",  delay_reason:"Utility NOC pending",  dept_stuck:"BSPHCL",           latitude:26.1542,longitude:85.9000,chainage:null,         status:"IN_PROGRESS"},
  {project_id:6, project_code:"BU/WATER/BHG/2021/05",project_name:"Bhagalpur Water Supply Phase-I",   sector_code:"WATER",sector_name:"Water Supply",   sector_icon:"💧",district:"Bhagalpur",  ulb_name:"Bhagalpur",  contractor_name:"Afcons Infrastructure",   current_sanctioned_cost:68400,financial_progress_pct:85.3,actual_physical_pct:88,scheduled_physical_pct:85,delay_days:0,  planned_end_date:"2026-06-30",revised_end_date:null,        total_cos_count:2,total_eot_days:0,  phase:"O&M",         delay_reason:null,           dept_stuck:null,               latitude:25.2425,longitude:86.9842,chainage:null,         status:"IN_PROGRESS"},
  {project_id:7, project_code:"BU/WATER/PUR/2023/06",project_name:"Purnia Water Supply Aug.",          sector_code:"WATER",sector_name:"Water Supply",   sector_icon:"💧",district:"Purnia",     ulb_name:"Purnia",     contractor_name:"NCC Ltd",                 current_sanctioned_cost:29100,financial_progress_pct:31.4,actual_physical_pct:33,scheduled_physical_pct:40,delay_days:22, planned_end_date:"2026-09-30",revised_end_date:"2026-12-31",total_cos_count:1,total_eot_days:90,  phase:"Construction",delay_reason:"Contractor default",    dept_stuck:"PMU Purnia",       latitude:25.7771,longitude:87.4753,chainage:null,         status:"IN_PROGRESS"},
  {project_id:8, project_code:"BU/WATER/SMH/2024/07",project_name:"Sitamarhi Water Grid Phase-I",     sector_code:"WATER",sector_name:"Water Supply",   sector_icon:"💧",district:"Sitamarhi",  ulb_name:"Sitamarhi",  contractor_name:"TBD",                     current_sanctioned_cost:33500,financial_progress_pct:0,    actual_physical_pct:0, scheduled_physical_pct:0, delay_days:0,  planned_end_date:"2028-12-31",revised_end_date:null,        total_cos_count:0,total_eot_days:0,  phase:"Tender",      delay_reason:null,           dept_stuck:null,               latitude:26.5940,longitude:85.4900,chainage:null,         status:"TENDERING"},
  // SEW (7)
  {project_id:9, project_code:"BU/SEW/MUZ/2022/03", project_name:"Muzaffarpur STP Phase-II",          sector_code:"SEW",  sector_name:"Sewerage & STP",sector_icon:"🏗",district:"Muzaffarpur",ulb_name:"Muzaffarpur",contractor_name:"M/s XYZ Infra Pvt Ltd",   current_sanctioned_cost:48200,financial_progress_pct:58.4,actual_physical_pct:52,scheduled_physical_pct:65,delay_days:47, planned_end_date:"2025-12-31",revised_end_date:"2026-03-31",total_cos_count:2,total_eot_days:90,  phase:"Construction",delay_reason:"Contractor demobilised",dept_stuck:"PMU Muzaffarpur",  latitude:26.1197,longitude:85.3910,chainage:null,         status:"STALLED"},
  {project_id:10,project_code:"BU/SEW/PAT/2025/02", project_name:"Patna Sewerage Trunk Main",          sector_code:"SEW",  sector_name:"Sewerage & STP",sector_icon:"🏗",district:"Patna",      ulb_name:"Patna",      contractor_name:"TBD",                     current_sanctioned_cost:74000,financial_progress_pct:0,    actual_physical_pct:0, scheduled_physical_pct:0, delay_days:0,  planned_end_date:"2028-09-30",revised_end_date:null,        total_cos_count:0,total_eot_days:0,  phase:"Pre-Tender",  delay_reason:null,           dept_stuck:null,               latitude:25.6000,longitude:85.1200,chainage:null,         status:"DPR_STAGE"},
  {project_id:11,project_code:"BU/SEW/GAY/2022/04", project_name:"Gaya STP & Sewer Network",           sector_code:"SEW",  sector_name:"Sewerage & STP",sector_icon:"🏗",district:"Gaya",       ulb_name:"Gaya",       contractor_name:"Shapoorji Pallonji",       current_sanctioned_cost:56400,financial_progress_pct:49.2,actual_physical_pct:43,scheduled_physical_pct:60,delay_days:31, planned_end_date:"2026-03-31",revised_end_date:"2026-06-30",total_cos_count:1,total_eot_days:60,  phase:"Construction",delay_reason:"Forest NOC pending",   dept_stuck:"Forest Dept",      latitude:24.7914,longitude:85.0002,chainage:null,         status:"IN_PROGRESS"},
  {project_id:12,project_code:"BU/SEW/BHG/2023/05", project_name:"Bhagalpur UGD Interceptor Sewer",    sector_code:"SEW",  sector_name:"Sewerage & STP",sector_icon:"🏗",district:"Bhagalpur",  ulb_name:"Bhagalpur",  contractor_name:"Hindustan Construction",   current_sanctioned_cost:38900,financial_progress_pct:27.1,actual_physical_pct:25,scheduled_physical_pct:35,delay_days:18, planned_end_date:"2027-03-31",revised_end_date:"2027-06-30",total_cos_count:0,total_eot_days:90,  phase:"Construction",delay_reason:"EoT applied",          dept_stuck:null,               latitude:25.2425,longitude:86.9842,chainage:null,         status:"IN_PROGRESS"},
  {project_id:13,project_code:"BU/SEW/DSB/2024/06", project_name:"Darbhanga Sewerage Phase-I",          sector_code:"SEW",  sector_name:"Sewerage & STP",sector_icon:"🏗",district:"Darbhanga",  ulb_name:"Darbhanga",  contractor_name:"TBD",                     current_sanctioned_cost:45100,financial_progress_pct:0,    actual_physical_pct:0, scheduled_physical_pct:0, delay_days:0,  planned_end_date:"2028-06-30",revised_end_date:null,        total_cos_count:0,total_eot_days:0,  phase:"Tender",      delay_reason:null,           dept_stuck:null,               latitude:26.1542,longitude:85.9000,chainage:null,         status:"TENDERING"},
  {project_id:14,project_code:"BU/SEW/BGS/2021/01", project_name:"Begusarai Sewerage & STP",            sector_code:"SEW",  sector_name:"Sewerage & STP",sector_icon:"🏗",district:"Begusarai",  ulb_name:"Begusarai",  contractor_name:"L&T ECC",                 current_sanctioned_cost:61200,financial_progress_pct:78.4,actual_physical_pct:81,scheduled_physical_pct:80,delay_days:0,  planned_end_date:"2026-06-30",revised_end_date:null,        total_cos_count:1,total_eot_days:0,  phase:"O&M",         delay_reason:null,           dept_stuck:null,               latitude:25.4182,longitude:86.1272,chainage:null,         status:"IN_PROGRESS"},
  {project_id:15,project_code:"BU/SEW/ARA/2023/07", project_name:"Ara Town Sewerage Network",            sector_code:"SEW",  sector_name:"Sewerage & STP",sector_icon:"🏗",district:"Ara",        ulb_name:"Ara",        contractor_name:"NCC Ltd",                 current_sanctioned_cost:28200,financial_progress_pct:35.6,actual_physical_pct:31,scheduled_physical_pct:45,delay_days:25, planned_end_date:"2026-09-30",revised_end_date:"2026-12-31",total_cos_count:0,total_eot_days:90,  phase:"Construction",delay_reason:"EoT pending",          dept_stuck:"PMU Ara",          latitude:25.5624,longitude:84.6651,chainage:null,         status:"IN_PROGRESS"},
  // DRAIN (7)
  {project_id:16,project_code:"BU/DRAIN/GAY/2023/01",project_name:"Gaya Storm Drain Network",           sector_code:"DRAIN",sector_name:"Storm Drainage",sector_icon:"🌧",district:"Gaya",       ulb_name:"Gaya",       contractor_name:"Dilip Buildcon Ltd",      current_sanctioned_cost:23400,financial_progress_pct:38.1,actual_physical_pct:35,scheduled_physical_pct:50,delay_days:22, planned_end_date:"2026-06-30",revised_end_date:"2026-07-31",total_cos_count:0,total_eot_days:31,  phase:"Construction",delay_reason:"BG expiry risk",       dept_stuck:"Finance Section",  latitude:24.7914,longitude:85.0002,chainage:null,         status:"IN_PROGRESS"},
  {project_id:17,project_code:"BU/DRAIN/PAT/2022/02",project_name:"Patna Central Drain Upgradation",    sector_code:"DRAIN",sector_name:"Storm Drainage",sector_icon:"🌧",district:"Patna",      ulb_name:"Patna",      contractor_name:"L&T Construction",        current_sanctioned_cost:38900,financial_progress_pct:65.4,actual_physical_pct:68,scheduled_physical_pct:65,delay_days:0,  planned_end_date:"2026-09-30",revised_end_date:null,        total_cos_count:1,total_eot_days:0,  phase:"Construction",delay_reason:null,           dept_stuck:null,               latitude:25.5941,longitude:85.1376,chainage:null,         status:"IN_PROGRESS"},
  {project_id:18,project_code:"BU/DRAIN/MUZ/2023/03",project_name:"Muzaffarpur Drainage Master Plan",   sector_code:"DRAIN",sector_name:"Storm Drainage",sector_icon:"🌧",district:"Muzaffarpur",ulb_name:"Muzaffarpur",contractor_name:"Afcons Infrastructure",   current_sanctioned_cost:29100,financial_progress_pct:42.1,actual_physical_pct:40,scheduled_physical_pct:55,delay_days:28, planned_end_date:"2026-03-31",revised_end_date:"2026-06-30",total_cos_count:1,total_eot_days:90,  phase:"Construction",delay_reason:"Design change",        dept_stuck:null,               latitude:26.1197,longitude:85.3910,chainage:null,         status:"IN_PROGRESS"},
  {project_id:19,project_code:"BU/DRAIN/BHG/2024/04",project_name:"Bhagalpur Stormwater Channel",       sector_code:"DRAIN",sector_name:"Storm Drainage",sector_icon:"🌧",district:"Bhagalpur",  ulb_name:"Bhagalpur",  contractor_name:"TBD",                     current_sanctioned_cost:19800,financial_progress_pct:0,    actual_physical_pct:0, scheduled_physical_pct:0, delay_days:0,  planned_end_date:"2027-12-31",revised_end_date:null,        total_cos_count:0,total_eot_days:0,  phase:"Tender",      delay_reason:null,           dept_stuck:null,               latitude:25.2425,longitude:86.9842,chainage:null,         status:"TENDERING"},
  {project_id:20,project_code:"BU/DRAIN/DSB/2022/05",project_name:"Darbhanga Urban Flood Management",   sector_code:"DRAIN",sector_name:"Storm Drainage",sector_icon:"🌧",district:"Darbhanga",  ulb_name:"Darbhanga",  contractor_name:"Hindustan Construction",   current_sanctioned_cost:41200,financial_progress_pct:57.8,actual_physical_pct:61,scheduled_physical_pct:60,delay_days:0,  planned_end_date:"2026-12-31",revised_end_date:null,        total_cos_count:2,total_eot_days:0,  phase:"Construction",delay_reason:null,           dept_stuck:null,               latitude:26.1542,longitude:85.9000,chainage:null,         status:"IN_PROGRESS"},
  {project_id:21,project_code:"BU/DRAIN/BGS/2023/06",project_name:"Begusarai Drain Network Phase-I",    sector_code:"DRAIN",sector_name:"Storm Drainage",sector_icon:"🌧",district:"Begusarai",  ulb_name:"Begusarai",  contractor_name:"NCC Ltd",                 current_sanctioned_cost:21400,financial_progress_pct:29.6,actual_physical_pct:27,scheduled_physical_pct:35,delay_days:15, planned_end_date:"2026-09-30",revised_end_date:"2026-12-31",total_cos_count:0,total_eot_days:60,  phase:"Construction",delay_reason:"Funding delay",        dept_stuck:null,               latitude:25.4182,longitude:86.1272,chainage:null,         status:"IN_PROGRESS"},
  {project_id:22,project_code:"BU/DRAIN/PUR/2024/07",project_name:"Purnia Drain Rehabilitation",        sector_code:"DRAIN",sector_name:"Storm Drainage",sector_icon:"🌧",district:"Purnia",     ulb_name:"Purnia",     contractor_name:"TBD",                     current_sanctioned_cost:14200,financial_progress_pct:0,    actual_physical_pct:0, scheduled_physical_pct:0, delay_days:0,  planned_end_date:"2028-06-30",revised_end_date:null,        total_cos_count:0,total_eot_days:0,  phase:"Conceptualization",delay_reason:null,       dept_stuck:null,               latitude:25.7771,longitude:87.4753,chainage:null,         status:"DPR_STAGE"},
  // SWM (6)
  {project_id:23,project_code:"BU/SWM/PAT/2022/01",  project_name:"Patna SWM Integrated System",        sector_code:"SWM",  sector_name:"Solid Waste",   sector_icon:"♻",district:"Patna",      ulb_name:"Patna",      contractor_name:"Ramky Enviro",            current_sanctioned_cost:52400,financial_progress_pct:73.1,actual_physical_pct:76,scheduled_physical_pct:74,delay_days:0,  planned_end_date:"2026-09-30",revised_end_date:null,        total_cos_count:1,total_eot_days:0,  phase:"Construction",delay_reason:null,           dept_stuck:null,               latitude:25.5941,longitude:85.1376,chainage:null,         status:"IN_PROGRESS"},
  {project_id:24,project_code:"BU/SWM/MUZ/2022/02",  project_name:"Muzaffarpur Waste Processing Plant",  sector_code:"SWM",  sector_name:"Solid Waste",   sector_icon:"♻",district:"Muzaffarpur",ulb_name:"Muzaffarpur",contractor_name:"IL&FS Environmental",     current_sanctioned_cost:38100,financial_progress_pct:68.4,actual_physical_pct:71,scheduled_physical_pct:70,delay_days:0,  planned_end_date:"2026-06-30",revised_end_date:null,        total_cos_count:0,total_eot_days:0,  phase:"O&M",         delay_reason:null,           dept_stuck:null,               latitude:26.1197,longitude:85.3910,chainage:null,         status:"IN_PROGRESS"},
  {project_id:25,project_code:"BU/SWM/GAY/2023/03",  project_name:"Gaya SWM Collection & Transport",     sector_code:"SWM",  sector_name:"Solid Waste",   sector_icon:"♻",district:"Gaya",       ulb_name:"Gaya",       contractor_name:"Ecogreen Energy",         current_sanctioned_cost:24800,financial_progress_pct:82.1,actual_physical_pct:85,scheduled_physical_pct:84,delay_days:0,  planned_end_date:"2026-03-31",revised_end_date:null,        total_cos_count:0,total_eot_days:0,  phase:"O&M",         delay_reason:null,           dept_stuck:null,               latitude:24.7914,longitude:85.0002,chainage:null,         status:"IN_PROGRESS"},
  {project_id:26,project_code:"BU/SWM/BHG/2023/04",  project_name:"Bhagalpur Urban Waste Management",    sector_code:"SWM",  sector_name:"Solid Waste",   sector_icon:"♻",district:"Bhagalpur",  ulb_name:"Bhagalpur",  contractor_name:"Antony Waste Handling",   current_sanctioned_cost:31200,financial_progress_pct:52.3,actual_physical_pct:55,scheduled_physical_pct:60,delay_days:12, planned_end_date:"2026-09-30",revised_end_date:"2026-12-31",total_cos_count:0,total_eot_days:60,  phase:"Construction",delay_reason:"Seasonal delay",       dept_stuck:null,               latitude:25.2425,longitude:86.9842,chainage:null,         status:"IN_PROGRESS"},
  {project_id:27,project_code:"BU/SWM/DSB/2024/05",  project_name:"Darbhanga Sanitation Improvement",    sector_code:"SWM",  sector_name:"Solid Waste",   sector_icon:"♻",district:"Darbhanga",  ulb_name:"Darbhanga",  contractor_name:"TBD",                     current_sanctioned_cost:18900,financial_progress_pct:0,    actual_physical_pct:0, scheduled_physical_pct:0, delay_days:0,  planned_end_date:"2027-12-31",revised_end_date:null,        total_cos_count:0,total_eot_days:0,  phase:"Tender",      delay_reason:null,           dept_stuck:null,               latitude:26.1542,longitude:85.9000,chainage:null,         status:"TENDERING"},
  {project_id:28,project_code:"BU/SWM/BGS/2022/06",  project_name:"Begusarai SWM Project",               sector_code:"SWM",  sector_name:"Solid Waste",   sector_icon:"♻",district:"Begusarai",  ulb_name:"Begusarai",  contractor_name:"Ramky Enviro",            current_sanctioned_cost:27800,financial_progress_pct:61.4,actual_physical_pct:64,scheduled_physical_pct:65,delay_days:0,  planned_end_date:"2026-12-31",revised_end_date:null,        total_cos_count:0,total_eot_days:0,  phase:"Construction",delay_reason:null,           dept_stuck:null,               latitude:25.4182,longitude:86.1272,chainage:null,         status:"IN_PROGRESS"},
  // TRAN (7)
  {project_id:29,project_code:"BU/TRAN/BHG/2022/05", project_name:"Bhagalpur Bus Depot Complex",         sector_code:"TRAN", sector_name:"Urban Transport",sector_icon:"🚌",district:"Bhagalpur",  ulb_name:"Bhagalpur",  contractor_name:"PNC Infratech",           current_sanctioned_cost:36800,financial_progress_pct:22.3,actual_physical_pct:19,scheduled_physical_pct:40,delay_days:78, planned_end_date:"2025-09-30",revised_end_date:"2026-06-30",total_cos_count:3,total_eot_days:270, phase:"Construction",delay_reason:"3rd EoT — 270 days delay",dept_stuck:"PMU Bhagalpur", latitude:25.2425,longitude:86.9842,chainage:null,         status:"STALLED"},
  {project_id:30,project_code:"BU/TRAN/PAT/2021/01", project_name:"Patna Urban Transport Hub",           sector_code:"TRAN", sector_name:"Urban Transport",sector_icon:"🚌",district:"Patna",      ulb_name:"Patna",      contractor_name:"L&T Construction",        current_sanctioned_cost:84200,financial_progress_pct:44.1,actual_physical_pct:47,scheduled_physical_pct:55,delay_days:22, planned_end_date:"2026-06-30",revised_end_date:"2026-09-30",total_cos_count:1,total_eot_days:90,  phase:"Construction",delay_reason:"ROW clearance",        dept_stuck:"Revenue Dept",     latitude:25.5941,longitude:85.1376,chainage:null,         status:"IN_PROGRESS"},
  {project_id:31,project_code:"BU/TRAN/MUZ/2023/06", project_name:"Muzaffarpur BRTS Phase-I",            sector_code:"TRAN", sector_name:"Urban Transport",sector_icon:"🚌",district:"Muzaffarpur",ulb_name:"Muzaffarpur",contractor_name:"Afcons Infrastructure",   current_sanctioned_cost:52100,financial_progress_pct:12.4,actual_physical_pct:10,scheduled_physical_pct:30,delay_days:41, planned_end_date:"2026-12-31",revised_end_date:"2027-03-31",total_cos_count:1,total_eot_days:90,  phase:"Pre-Tender",  delay_reason:"Forest NOC pending",  dept_stuck:"Forest Department",latitude:26.1197,longitude:85.3910,chainage:null,         status:"IN_PROGRESS"},
  {project_id:32,project_code:"BU/TRAN/GAY/2024/07", project_name:"Gaya Multimodal Transit Centre",      sector_code:"TRAN", sector_name:"Urban Transport",sector_icon:"🚌",district:"Gaya",       ulb_name:"Gaya",       contractor_name:"TBD",                     current_sanctioned_cost:41800,financial_progress_pct:0,    actual_physical_pct:0, scheduled_physical_pct:0, delay_days:0,  planned_end_date:"2028-06-30",revised_end_date:null,        total_cos_count:0,total_eot_days:0,  phase:"Tender",      delay_reason:null,           dept_stuck:null,               latitude:24.7914,longitude:85.0002,chainage:null,         status:"TENDERING"},
  {project_id:33,project_code:"BU/TRAN/DSB/2023/08", project_name:"Darbhanga Auto-Rickshaw Stand",       sector_code:"TRAN", sector_name:"Urban Transport",sector_icon:"🚌",district:"Darbhanga",  ulb_name:"Darbhanga",  contractor_name:"Hindustan Construction",   current_sanctioned_cost:18400,financial_progress_pct:62.4,actual_physical_pct:65,scheduled_physical_pct:64,delay_days:0,  planned_end_date:"2026-06-30",revised_end_date:null,        total_cos_count:0,total_eot_days:0,  phase:"O&M",         delay_reason:null,           dept_stuck:null,               latitude:26.1542,longitude:85.9000,chainage:null,         status:"IN_PROGRESS"},
  {project_id:34,project_code:"BU/TRAN/BGS/2022/09", project_name:"Begusarai Truck Terminal",            sector_code:"TRAN", sector_name:"Urban Transport",sector_icon:"🚌",district:"Begusarai",  ulb_name:"Begusarai",  contractor_name:"NCC Ltd",                 current_sanctioned_cost:28900,financial_progress_pct:31.2,actual_physical_pct:28,scheduled_physical_pct:40,delay_days:31, planned_end_date:"2026-09-30",revised_end_date:"2026-12-31",total_cos_count:0,total_eot_days:60,  phase:"Construction",delay_reason:"Funding delay",        dept_stuck:null,               latitude:25.4182,longitude:86.1272,chainage:null,         status:"IN_PROGRESS"},
  {project_id:35,project_code:"BU/TRAN/PUR/2024/10", project_name:"Purnia City Bus Depot",               sector_code:"TRAN", sector_name:"Urban Transport",sector_icon:"🚌",district:"Purnia",     ulb_name:"Purnia",     contractor_name:"TBD",                     current_sanctioned_cost:22100,financial_progress_pct:0,    actual_physical_pct:0, scheduled_physical_pct:0, delay_days:0,  planned_end_date:"2027-12-31",revised_end_date:null,        total_cos_count:0,total_eot_days:0,  phase:"Conceptualization",delay_reason:null,       dept_stuck:null,               latitude:25.7771,longitude:87.4753,chainage:null,         status:"DPR_STAGE"},
  // HOUSE (8)
  {project_id:36,project_code:"BU/HOUSE/PAT/2021/01",project_name:"Patna PMAY Urban Housing Phase-II",  sector_code:"HOUSE",sector_name:"Housing",       sector_icon:"🏘",district:"Patna",      ulb_name:"Patna",      contractor_name:"Shapoorji Pallonji",       current_sanctioned_cost:184200,financial_progress_pct:71.2,actual_physical_pct:74,scheduled_physical_pct:72,delay_days:0,  planned_end_date:"2026-09-30",revised_end_date:null,        total_cos_count:2,total_eot_days:0,  phase:"Construction",delay_reason:null,           dept_stuck:null,               latitude:25.5941,longitude:85.1376,chainage:null,         status:"IN_PROGRESS"},
  {project_id:37,project_code:"BU/HOUSE/MUZ/2022/02",project_name:"Muzaffarpur EWS Housing Colony",     sector_code:"HOUSE",sector_name:"Housing",       sector_icon:"🏘",district:"Muzaffarpur",ulb_name:"Muzaffarpur",contractor_name:"L&T Realty",              current_sanctioned_cost:94100,financial_progress_pct:63.4,actual_physical_pct:67,scheduled_physical_pct:65,delay_days:0,  planned_end_date:"2026-12-31",revised_end_date:null,        total_cos_count:1,total_eot_days:0,  phase:"Construction",delay_reason:null,           dept_stuck:null,               latitude:26.1197,longitude:85.3910,chainage:null,         status:"IN_PROGRESS"},
  {project_id:38,project_code:"BU/HOUSE/GAY/2022/03",project_name:"Gaya Affordable Housing Scheme",     sector_code:"HOUSE",sector_name:"Housing",       sector_icon:"🏘",district:"Gaya",       ulb_name:"Gaya",       contractor_name:"Prestige Group",          current_sanctioned_cost:72400,financial_progress_pct:58.1,actual_physical_pct:60,scheduled_physical_pct:62,delay_days:14, planned_end_date:"2026-06-30",revised_end_date:"2026-09-30",total_cos_count:0,total_eot_days:60,  phase:"Construction",delay_reason:"Design revision",      dept_stuck:null,               latitude:24.7914,longitude:85.0002,chainage:null,         status:"IN_PROGRESS"},
  {project_id:39,project_code:"BU/HOUSE/BHG/2023/04",project_name:"Bhagalpur LIG Housing Complex",     sector_code:"HOUSE",sector_name:"Housing",       sector_icon:"🏘",district:"Bhagalpur",  ulb_name:"Bhagalpur",  contractor_name:"NCC Ltd",                 current_sanctioned_cost:58700,financial_progress_pct:44.6,actual_physical_pct:48,scheduled_physical_pct:50,delay_days:8,  planned_end_date:"2026-09-30",revised_end_date:"2026-12-31",total_cos_count:0,total_eot_days:30,  phase:"Construction",delay_reason:"Minor EoT applied",    dept_stuck:null,               latitude:25.2425,longitude:86.9842,chainage:null,         status:"IN_PROGRESS"},
  {project_id:40,project_code:"BU/HOUSE/DSB/2023/05",project_name:"Darbhanga Urban Housing Project",   sector_code:"HOUSE",sector_name:"Housing",       sector_icon:"🏘",district:"Darbhanga",  ulb_name:"Darbhanga",  contractor_name:"Hindustan Construction",   current_sanctioned_cost:64800,financial_progress_pct:52.3,actual_physical_pct:55,scheduled_physical_pct:54,delay_days:0,  planned_end_date:"2027-03-31",revised_end_date:null,        total_cos_count:0,total_eot_days:0,  phase:"Construction",delay_reason:null,           dept_stuck:null,               latitude:26.1542,longitude:85.9000,chainage:null,         status:"IN_PROGRESS"},
  {project_id:41,project_code:"BU/HOUSE/BGS/2022/06",project_name:"Begusarai MIG Housing Scheme",      sector_code:"HOUSE",sector_name:"Housing",       sector_icon:"🏘",district:"Begusarai",  ulb_name:"Begusarai",  contractor_name:"Tata Housing",            current_sanctioned_cost:48200,financial_progress_pct:76.4,actual_physical_pct:79,scheduled_physical_pct:78,delay_days:0,  planned_end_date:"2026-06-30",revised_end_date:null,        total_cos_count:1,total_eot_days:0,  phase:"O&M",         delay_reason:null,           dept_stuck:null,               latitude:25.4182,longitude:86.1272,chainage:null,         status:"IN_PROGRESS"},
  {project_id:42,project_code:"BU/HOUSE/PUR/2024/07",project_name:"Purnia Slum Rehabilitation Housing",sector_code:"HOUSE",sector_name:"Housing",       sector_icon:"🏘",district:"Purnia",     ulb_name:"Purnia",     contractor_name:"TBD",                     current_sanctioned_cost:42100,financial_progress_pct:0,    actual_physical_pct:0, scheduled_physical_pct:0, delay_days:0,  planned_end_date:"2028-03-31",revised_end_date:null,        total_cos_count:0,total_eot_days:0,  phase:"Tender",      delay_reason:null,           dept_stuck:null,               latitude:25.7771,longitude:87.4753,chainage:null,         status:"TENDERING"},
  {project_id:43,project_code:"BU/HOUSE/SMH/2024/08",project_name:"Sitamarhi PMAY Housing Block A",    sector_code:"HOUSE",sector_name:"Housing",       sector_icon:"🏘",district:"Sitamarhi",  ulb_name:"Sitamarhi",  contractor_name:"TBD",                     current_sanctioned_cost:36800,financial_progress_pct:0,    actual_physical_pct:0, scheduled_physical_pct:0, delay_days:0,  planned_end_date:"2028-06-30",revised_end_date:null,        total_cos_count:0,total_eot_days:0,  phase:"Conceptualization",delay_reason:null,       dept_stuck:null,               latitude:26.5940,longitude:85.4900,chainage:null,         status:"DPR_STAGE"},
  // RIVER (6)
  {project_id:44,project_code:"BU/RIVER/PAT/2021/01",project_name:"Patna Ganga Riverfront Phase-I",    sector_code:"RIVER",sector_name:"Riverfront",    sector_icon:"🌊",district:"Patna",      ulb_name:"Patna",      contractor_name:"Gammon India",            current_sanctioned_cost:182400,financial_progress_pct:18.4,actual_physical_pct:20,scheduled_physical_pct:35,delay_days:62, planned_end_date:"2025-12-31",revised_end_date:"2026-06-30",total_cos_count:2,total_eot_days:180, phase:"Construction",delay_reason:"Court stay order",    dept_stuck:"PMU Patna",        latitude:25.5941,longitude:85.1376,chainage:null,         status:"STALLED"},
  {project_id:45,project_code:"BU/RIVER/BHG/2022/02",project_name:"Bhagalpur Ganga Ghats Development", sector_code:"RIVER",sector_name:"Riverfront",    sector_icon:"🌊",district:"Bhagalpur",  ulb_name:"Bhagalpur",  contractor_name:"Afcons Infrastructure",   current_sanctioned_cost:74200,financial_progress_pct:14.2,actual_physical_pct:12,scheduled_physical_pct:30,delay_days:45, planned_end_date:"2026-06-30",revised_end_date:"2026-09-30",total_cos_count:1,total_eot_days:90,  phase:"Construction",delay_reason:"ROW dispute",          dept_stuck:"Revenue Dept",     latitude:25.2425,longitude:86.9842,chainage:null,         status:"IN_PROGRESS"},
  {project_id:46,project_code:"BU/RIVER/MUZ/2023/03",project_name:"Muzaffarpur Burhi Gandak Riverfront",sector_code:"RIVER",sector_name:"Riverfront",   sector_icon:"🌊",district:"Muzaffarpur",ulb_name:"Muzaffarpur",contractor_name:"TBD",                     current_sanctioned_cost:38400,financial_progress_pct:0,    actual_physical_pct:0, scheduled_physical_pct:0, delay_days:0,  planned_end_date:"2028-03-31",revised_end_date:null,        total_cos_count:0,total_eot_days:0,  phase:"Tender",      delay_reason:null,           dept_stuck:null,               latitude:26.1197,longitude:85.3910,chainage:null,         status:"TENDERING"},
  {project_id:47,project_code:"BU/RIVER/GAY/2023/04",project_name:"Gaya Falgu Riverfront Development", sector_code:"RIVER",sector_name:"Riverfront",    sector_icon:"🌊",district:"Gaya",       ulb_name:"Gaya",       contractor_name:"Shapoorji Pallonji",       current_sanctioned_cost:64200,financial_progress_pct:22.1,actual_physical_pct:20,scheduled_physical_pct:35,delay_days:38, planned_end_date:"2026-09-30",revised_end_date:"2026-12-31",total_cos_count:1,total_eot_days:90,  phase:"Construction",delay_reason:"Forest NOC",          dept_stuck:"Forest Dept",      latitude:24.7914,longitude:85.0002,chainage:null,         status:"IN_PROGRESS"},
  {project_id:48,project_code:"BU/RIVER/DSB/2024/05",project_name:"Darbhanga Bagmati Riverfront",      sector_code:"RIVER",sector_name:"Riverfront",    sector_icon:"🌊",district:"Darbhanga",  ulb_name:"Darbhanga",  contractor_name:"TBD",                     current_sanctioned_cost:44800,financial_progress_pct:0,    actual_physical_pct:0, scheduled_physical_pct:0, delay_days:0,  planned_end_date:"2028-09-30",revised_end_date:null,        total_cos_count:0,total_eot_days:0,  phase:"Conceptualization",delay_reason:null,       dept_stuck:null,               latitude:26.1542,longitude:85.9000,chainage:null,         status:"DPR_STAGE"},
  {project_id:49,project_code:"BU/RIVER/BGS/2023/06",project_name:"Begusarai Burhi Gandak Riverfront", sector_code:"RIVER",sector_name:"Riverfront",    sector_icon:"🌊",district:"Begusarai",  ulb_name:"Begusarai",  contractor_name:"NCC Ltd",                 current_sanctioned_cost:56400,financial_progress_pct:12.8,actual_physical_pct:11,scheduled_physical_pct:25,delay_days:28, planned_end_date:"2026-12-31",revised_end_date:"2027-03-31",total_cos_count:0,total_eot_days:60,  phase:"Construction",delay_reason:"Land dispute",         dept_stuck:"Revenue Dept",     latitude:25.4182,longitude:86.1272,chainage:null,         status:"IN_PROGRESS"},
  // LIGHT (6)
  {project_id:50,project_code:"BU/LIGHT/DSB/2024/02",project_name:"Darbhanga LED Street Lighting",     sector_code:"LIGHT",sector_name:"Street Lighting",sector_icon:"💡",district:"Darbhanga",  ulb_name:"Darbhanga",  contractor_name:"Tata Projects",           current_sanctioned_cost:8900, financial_progress_pct:88.6,actual_physical_pct:92,scheduled_physical_pct:90,delay_days:0,  planned_end_date:"2026-06-30",revised_end_date:null,        total_cos_count:0,total_eot_days:0,  phase:"O&M",         delay_reason:null,           dept_stuck:null,               latitude:26.1542,longitude:85.9000,chainage:null,         status:"IN_PROGRESS"},
  {project_id:51,project_code:"BU/LIGHT/PAT/2022/01",project_name:"Patna City LED Street Lighting",    sector_code:"LIGHT",sector_name:"Street Lighting",sector_icon:"💡",district:"Patna",      ulb_name:"Patna",      contractor_name:"Philips (Signify)",       current_sanctioned_cost:42100,financial_progress_pct:84.2,actual_physical_pct:87,scheduled_physical_pct:86,delay_days:0,  planned_end_date:"2026-03-31",revised_end_date:null,        total_cos_count:1,total_eot_days:0,  phase:"O&M",         delay_reason:null,           dept_stuck:null,               latitude:25.5941,longitude:85.1376,chainage:null,         status:"IN_PROGRESS"},
  {project_id:52,project_code:"BU/LIGHT/MUZ/2023/03",project_name:"Muzaffarpur LED Lighting Phase-I",  sector_code:"LIGHT",sector_name:"Street Lighting",sector_icon:"💡",district:"Muzaffarpur",ulb_name:"Muzaffarpur",contractor_name:"Tata Projects",           current_sanctioned_cost:18400,financial_progress_pct:78.4,actual_physical_pct:81,scheduled_physical_pct:80,delay_days:0,  planned_end_date:"2026-06-30",revised_end_date:null,        total_cos_count:0,total_eot_days:0,  phase:"O&M",         delay_reason:null,           dept_stuck:null,               latitude:26.1197,longitude:85.3910,chainage:null,         status:"IN_PROGRESS"},
  {project_id:53,project_code:"BU/LIGHT/GAY/2023/04",project_name:"Gaya Heritage Zone Lighting",       sector_code:"LIGHT",sector_name:"Street Lighting",sector_icon:"💡",district:"Gaya",       ulb_name:"Gaya",       contractor_name:"IL&FS Engineering",       current_sanctioned_cost:14200,financial_progress_pct:72.1,actual_physical_pct:75,scheduled_physical_pct:74,delay_days:0,  planned_end_date:"2026-09-30",revised_end_date:null,        total_cos_count:0,total_eot_days:0,  phase:"O&M",         delay_reason:null,           dept_stuck:null,               latitude:24.7914,longitude:85.0002,chainage:null,         status:"IN_PROGRESS"},
  {project_id:54,project_code:"BU/LIGHT/BHG/2024/05",project_name:"Bhagalpur Smart Street Lighting",   sector_code:"LIGHT",sector_name:"Street Lighting",sector_icon:"💡",district:"Bhagalpur",  ulb_name:"Bhagalpur",  contractor_name:"Havells India",           current_sanctioned_cost:22400,financial_progress_pct:38.1,actual_physical_pct:40,scheduled_physical_pct:45,delay_days:0,  planned_end_date:"2027-03-31",revised_end_date:null,        total_cos_count:0,total_eot_days:0,  phase:"Construction",delay_reason:null,           dept_stuck:null,               latitude:25.2425,longitude:86.9842,chainage:null,         status:"IN_PROGRESS"},
  {project_id:55,project_code:"BU/LIGHT/BGS/2024/06",project_name:"Begusarai LED Lighting Upgrade",    sector_code:"LIGHT",sector_name:"Street Lighting",sector_icon:"💡",district:"Begusarai",  ulb_name:"Begusarai",  contractor_name:"TBD",                     current_sanctioned_cost:12800,financial_progress_pct:0,    actual_physical_pct:0, scheduled_physical_pct:0, delay_days:0,  planned_end_date:"2027-12-31",revised_end_date:null,        total_cos_count:0,total_eot_days:0,  phase:"Tender",      delay_reason:null,           dept_stuck:null,               latitude:25.4182,longitude:86.1272,chainage:null,         status:"TENDERING"},
  // MARKET (6)
  {project_id:56,project_code:"BU/MARKET/PAT/2022/01",project_name:"Patna Modern Vegetable Market",    sector_code:"MARKET",sector_name:"Markets",      sector_icon:"🏪",district:"Patna",      ulb_name:"Patna",      contractor_name:"Hindustan Construction",   current_sanctioned_cost:28400,financial_progress_pct:61.4,actual_physical_pct:65,scheduled_physical_pct:64,delay_days:0,  planned_end_date:"2026-06-30",revised_end_date:null,        total_cos_count:0,total_eot_days:0,  phase:"O&M",         delay_reason:null,           dept_stuck:null,               latitude:25.5941,longitude:85.1376,chainage:null,         status:"IN_PROGRESS"},
  {project_id:57,project_code:"BU/MARKET/MUZ/2022/02",project_name:"Muzaffarpur Wholesale Market",     sector_code:"MARKET",sector_name:"Markets",      sector_icon:"🏪",district:"Muzaffarpur",ulb_name:"Muzaffarpur",contractor_name:"NCC Ltd",                 current_sanctioned_cost:38400,financial_progress_pct:52.3,actual_physical_pct:55,scheduled_physical_pct:58,delay_days:14, planned_end_date:"2026-09-30",revised_end_date:"2026-12-31",total_cos_count:1,total_eot_days:60,  phase:"Construction",delay_reason:"Utility shifting",    dept_stuck:"BSPHCL",           latitude:26.1197,longitude:85.3910,chainage:null,         status:"IN_PROGRESS"},
  {project_id:58,project_code:"BU/MARKET/GAY/2023/03",project_name:"Gaya Heritage Craft Market",       sector_code:"MARKET",sector_name:"Markets",      sector_icon:"🏪",district:"Gaya",       ulb_name:"Gaya",       contractor_name:"Prestige Contracts",      current_sanctioned_cost:18900,financial_progress_pct:44.1,actual_physical_pct:47,scheduled_physical_pct:48,delay_days:0,  planned_end_date:"2026-12-31",revised_end_date:null,        total_cos_count:0,total_eot_days:0,  phase:"Construction",delay_reason:null,           dept_stuck:null,               latitude:24.7914,longitude:85.0002,chainage:null,         status:"IN_PROGRESS"},
  {project_id:59,project_code:"BU/MARKET/BHG/2023/04",project_name:"Bhagalpur Silk Market Complex",    sector_code:"MARKET",sector_name:"Markets",      sector_icon:"🏪",district:"Bhagalpur",  ulb_name:"Bhagalpur",  contractor_name:"Afcons Infrastructure",   current_sanctioned_cost:42800,financial_progress_pct:38.6,actual_physical_pct:40,scheduled_physical_pct:50,delay_days:21, planned_end_date:"2026-09-30",revised_end_date:"2026-12-31",total_cos_count:0,total_eot_days:90,  phase:"Construction",delay_reason:"EoT pending",          dept_stuck:null,               latitude:25.2425,longitude:86.9842,chainage:null,         status:"IN_PROGRESS"},
  {project_id:60,project_code:"BU/MARKET/DSB/2024/05",project_name:"Darbhanga Weekly Market Upgrade",  sector_code:"MARKET",sector_name:"Markets",      sector_icon:"🏪",district:"Darbhanga",  ulb_name:"Darbhanga",  contractor_name:"TBD",                     current_sanctioned_cost:12400,financial_progress_pct:0,    actual_physical_pct:0, scheduled_physical_pct:0, delay_days:0,  planned_end_date:"2027-12-31",revised_end_date:null,        total_cos_count:0,total_eot_days:0,  phase:"Tender",      delay_reason:null,           dept_stuck:null,               latitude:26.1542,longitude:85.9000,chainage:null,         status:"TENDERING"},
  {project_id:61,project_code:"BU/MARKET/BGS/2023/06",project_name:"Begusarai APMC Market",            sector_code:"MARKET",sector_name:"Markets",      sector_icon:"🏪",district:"Begusarai",  ulb_name:"Begusarai",  contractor_name:"IL&FS Engineering",       current_sanctioned_cost:21200,financial_progress_pct:55.2,actual_physical_pct:58,scheduled_physical_pct:57,delay_days:0,  planned_end_date:"2026-06-30",revised_end_date:null,        total_cos_count:0,total_eot_days:0,  phase:"Construction",delay_reason:null,           dept_stuck:null,               latitude:25.4182,longitude:86.1272,chainage:null,         status:"IN_PROGRESS"},
  // BEAUTY (6)
  {project_id:62,project_code:"BU/BEAUTY/PAT/2021/01",project_name:"Patna City Park & Promenade",      sector_code:"BEAUTY",sector_name:"Beautification",sector_icon:"🌳",district:"Patna",     ulb_name:"Patna",      contractor_name:"Tata Projects",           current_sanctioned_cost:24100,financial_progress_pct:91.2,actual_physical_pct:94,scheduled_physical_pct:92,delay_days:0,  planned_end_date:"2026-06-30",revised_end_date:null,        total_cos_count:0,total_eot_days:0,  phase:"O&M",         delay_reason:null,           dept_stuck:null,               latitude:25.5941,longitude:85.1376,chainage:null,         status:"IN_PROGRESS"},
  {project_id:63,project_code:"BU/BEAUTY/MUZ/2022/02",project_name:"Muzaffarpur Urban Greenery",       sector_code:"BEAUTY",sector_name:"Beautification",sector_icon:"🌳",district:"Muzaffarpur",ulb_name:"Muzaffarpur",contractor_name:"Shapoorji Pallonji",       current_sanctioned_cost:14800,financial_progress_pct:84.1,actual_physical_pct:87,scheduled_physical_pct:86,delay_days:0,  planned_end_date:"2026-03-31",revised_end_date:null,        total_cos_count:0,total_eot_days:0,  phase:"O&M",         delay_reason:null,           dept_stuck:null,               latitude:26.1197,longitude:85.3910,chainage:null,         status:"IN_PROGRESS"},
  {project_id:64,project_code:"BU/BEAUTY/GAY/2022/03",project_name:"Gaya Heritage Zone Beautification",sector_code:"BEAUTY",sector_name:"Beautification",sector_icon:"🌳",district:"Gaya",      ulb_name:"Gaya",       contractor_name:"L&T Construction",        current_sanctioned_cost:18400,financial_progress_pct:88.4,actual_physical_pct:91,scheduled_physical_pct:90,delay_days:0,  planned_end_date:"2026-06-30",revised_end_date:null,        total_cos_count:0,total_eot_days:0,  phase:"O&M",         delay_reason:null,           dept_stuck:null,               latitude:24.7914,longitude:85.0002,chainage:null,         status:"IN_PROGRESS"},
  {project_id:65,project_code:"BU/BEAUTY/BHG/2023/04",project_name:"Bhagalpur Waterfront Beautification",sector_code:"BEAUTY",sector_name:"Beautification",sector_icon:"🌳",district:"Bhagalpur",ulb_name:"Bhagalpur",contractor_name:"NCC Ltd",                current_sanctioned_cost:12200,financial_progress_pct:72.1,actual_physical_pct:75,scheduled_physical_pct:74,delay_days:0,  planned_end_date:"2026-09-30",revised_end_date:null,        total_cos_count:0,total_eot_days:0,  phase:"Construction",delay_reason:null,           dept_stuck:null,               latitude:25.2425,longitude:86.9842,chainage:null,         status:"IN_PROGRESS"},
  {project_id:66,project_code:"BU/BEAUTY/DSB/2024/05",project_name:"Darbhanga Urban Landscape",         sector_code:"BEAUTY",sector_name:"Beautification",sector_icon:"🌳",district:"Darbhanga",  ulb_name:"Darbhanga",  contractor_name:"TBD",                     current_sanctioned_cost:9400, financial_progress_pct:0,    actual_physical_pct:0, scheduled_physical_pct:0, delay_days:0,  planned_end_date:"2027-12-31",revised_end_date:null,        total_cos_count:0,total_eot_days:0,  phase:"Tender",      delay_reason:null,           dept_stuck:null,               latitude:26.1542,longitude:85.9000,chainage:null,         status:"TENDERING"},
  {project_id:67,project_code:"BU/BEAUTY/BGS/2023/06",project_name:"Begusarai City Centre Beautification",sector_code:"BEAUTY",sector_name:"Beautification",sector_icon:"🌳",district:"Begusarai",ulb_name:"Begusarai",contractor_name:"Prestige Contracts",      current_sanctioned_cost:13200,financial_progress_pct:81.4,actual_physical_pct:84,scheduled_physical_pct:83,delay_days:0,  planned_end_date:"2026-06-30",revised_end_date:null,        total_cos_count:0,total_eot_days:0,  phase:"O&M",         delay_reason:null,           dept_stuck:null,               latitude:25.4182,longitude:86.1272,chainage:null,         status:"IN_PROGRESS"},
  // ROAD (8)
  {project_id:68,project_code:"BU/ROAD/MUZ/2024/01", project_name:"Muzaffarpur Ring Road Upgradation",  sector_code:"ROAD", sector_name:"Road & Bridges",sector_icon:"🛣",district:"Muzaffarpur",ulb_name:"Muzaffarpur",contractor_name:"Afcons Infrastructure",   current_sanctioned_cost:52000,financial_progress_pct:12.0,actual_physical_pct:8, scheduled_physical_pct:30,delay_days:35, planned_end_date:"2026-12-31",revised_end_date:"2027-03-31",total_cos_count:1,total_eot_days:90,  phase:"Pre-Tender",  delay_reason:"Forest NOC pending",  dept_stuck:"Forest Department",latitude:26.1300,longitude:85.4100,chainage:"Km 0+000 to Km 18+500",status:"IN_PROGRESS"},
  {project_id:69,project_code:"BU/ROAD/PAT/2022/02",  project_name:"Patna ROB & Approach Roads",         sector_code:"ROAD", sector_name:"Road & Bridges",sector_icon:"🛣",district:"Patna",      ulb_name:"Patna",      contractor_name:"L&T Construction",        current_sanctioned_cost:142400,financial_progress_pct:58.4,actual_physical_pct:62,scheduled_physical_pct:60,delay_days:0,  planned_end_date:"2026-09-30",revised_end_date:null,        total_cos_count:2,total_eot_days:0,  phase:"Construction",delay_reason:null,           dept_stuck:null,               latitude:25.5941,longitude:85.1376,chainage:"Km 0+000 to Km 6+200",status:"IN_PROGRESS"},
  {project_id:70,project_code:"BU/ROAD/GAY/2023/03",  project_name:"Gaya Ring Road Phase-I",             sector_code:"ROAD", sector_name:"Road & Bridges",sector_icon:"🛣",district:"Gaya",       ulb_name:"Gaya",       contractor_name:"Dilip Buildcon Ltd",      current_sanctioned_cost:84200,financial_progress_pct:38.6,actual_physical_pct:41,scheduled_physical_pct:55,delay_days:28, planned_end_date:"2026-03-31",revised_end_date:"2026-06-30",total_cos_count:1,total_eot_days:90,  phase:"Construction",delay_reason:"Utility shifting",    dept_stuck:"BSPHCL",           latitude:24.7914,longitude:85.0002,chainage:"Km 0+000 to Km 22+400",status:"IN_PROGRESS"},
  {project_id:71,project_code:"BU/ROAD/BHG/2022/04",  project_name:"Bhagalpur City Road Network",        sector_code:"ROAD", sector_name:"Road & Bridges",sector_icon:"🛣",district:"Bhagalpur",  ulb_name:"Bhagalpur",  contractor_name:"PNC Infratech",           current_sanctioned_cost:62100,financial_progress_pct:72.1,actual_physical_pct:75,scheduled_physical_pct:73,delay_days:0,  planned_end_date:"2026-06-30",revised_end_date:null,        total_cos_count:0,total_eot_days:0,  phase:"Construction",delay_reason:null,           dept_stuck:null,               latitude:25.2425,longitude:86.9842,chainage:"Km 0+000 to Km 14+100",status:"IN_PROGRESS"},
  {project_id:72,project_code:"BU/ROAD/DSB/2023/05",  project_name:"Darbhanga Bypass Road",              sector_code:"ROAD", sector_name:"Road & Bridges",sector_icon:"🛣",district:"Darbhanga",  ulb_name:"Darbhanga",  contractor_name:"NCC Ltd",                 current_sanctioned_cost:78400,financial_progress_pct:31.4,actual_physical_pct:29,scheduled_physical_pct:45,delay_days:42, planned_end_date:"2026-09-30",revised_end_date:"2026-12-31",total_cos_count:1,total_eot_days:90,  phase:"Construction",delay_reason:"Land acquisition",    dept_stuck:"Revenue Dept",     latitude:26.1542,longitude:85.9000,chainage:"Km 0+000 to Km 28+600",status:"IN_PROGRESS"},
  {project_id:73,project_code:"BU/ROAD/BGS/2023/06",  project_name:"Begusarai Industrial Road Link",     sector_code:"ROAD", sector_name:"Road & Bridges",sector_icon:"🛣",district:"Begusarai",  ulb_name:"Begusarai",  contractor_name:"Hindustan Construction",   current_sanctioned_cost:48200,financial_progress_pct:44.2,actual_physical_pct:47,scheduled_physical_pct:50,delay_days:14, planned_end_date:"2026-12-31",revised_end_date:"2027-03-31",total_cos_count:0,total_eot_days:60,  phase:"Construction",delay_reason:"ROW pending",          dept_stuck:"Revenue Dept",     latitude:25.4182,longitude:86.1272,chainage:"Km 0+000 to Km 11+800",status:"IN_PROGRESS"},
  {project_id:74,project_code:"BU/ROAD/PUR/2024/07",  project_name:"Purnia City Roads Improvement",      sector_code:"ROAD", sector_name:"Road & Bridges",sector_icon:"🛣",district:"Purnia",     ulb_name:"Purnia",     contractor_name:"TBD",                     current_sanctioned_cost:28400,financial_progress_pct:0,    actual_physical_pct:0, scheduled_physical_pct:0, delay_days:0,  planned_end_date:"2028-03-31",revised_end_date:null,        total_cos_count:0,total_eot_days:0,  phase:"Tender",      delay_reason:null,           dept_stuck:null,               latitude:25.7771,longitude:87.4753,chainage:null,         status:"TENDERING"},
  {project_id:75,project_code:"BU/ROAD/SMH/2024/08",  project_name:"Sitamarhi Road Connectivity",        sector_code:"ROAD", sector_name:"Road & Bridges",sector_icon:"🛣",district:"Sitamarhi",  ulb_name:"Sitamarhi",  contractor_name:"TBD",                     current_sanctioned_cost:24200,financial_progress_pct:0,    actual_physical_pct:0, scheduled_physical_pct:0, delay_days:0,  planned_end_date:"2028-06-30",revised_end_date:null,        total_cos_count:0,total_eot_days:0,  phase:"Conceptualization",delay_reason:null,       dept_stuck:null,               latitude:26.5940,longitude:85.4900,chainage:null,         status:"DPR_STAGE"},
];

const COS_EOT_DATA = [
  {project_id:9, project_code:"BU/SEW/MUZ/2022/03", cos_number:"CoS-01",cos_date:"2023-08-15",cos_category:"SCOPE ADDITION",  cos_amount:320,cos_pct_variation:7.1,is_time_linked:true, eot_number:"EoT-01",eot_days_granted:60, original_end_date:"2025-12-31",new_end_date:"2026-02-28"},
  {project_id:9, project_code:"BU/SEW/MUZ/2022/03", cos_number:"CoS-02",cos_date:"2024-03-22",cos_category:"DESIGN CHANGE",   cos_amount:180,cos_pct_variation:3.7,is_time_linked:true, eot_number:"EoT-02",eot_days_granted:30, original_end_date:"2026-02-28",new_end_date:"2026-03-31"},
  {project_id:29,project_code:"BU/TRAN/BHG/2022/05",cos_number:"CoS-01",cos_date:"2023-05-10",cos_category:"QTY VARIATION",   cos_amount:210,cos_pct_variation:6.1,is_time_linked:true, eot_number:"EoT-01",eot_days_granted:90, original_end_date:"2025-09-30",new_end_date:"2025-12-31"},
  {project_id:29,project_code:"BU/TRAN/BHG/2022/05",cos_number:"CoS-02",cos_date:"2023-12-01",cos_category:"FORCE MAJEURE",   cos_amount:95, cos_pct_variation:2.6,is_time_linked:true, eot_number:"EoT-02",eot_days_granted:90, original_end_date:"2025-12-31",new_end_date:"2026-03-31"},
  {project_id:29,project_code:"BU/TRAN/BHG/2022/05",cos_number:"CoS-03",cos_date:"2024-07-15",cos_category:"SCOPE ADDITION",  cos_amount:145,cos_pct_variation:4.1,is_time_linked:true, eot_number:"EoT-03",eot_days_granted:90, original_end_date:"2026-03-31",new_end_date:"2026-06-30"},
  {project_id:68,project_code:"BU/ROAD/MUZ/2024/01",cos_number:"CoS-01",cos_date:"2025-01-10",cos_category:"SCOPE ADDITION",  cos_amount:420,cos_pct_variation:8.1,is_time_linked:true, eot_number:"EoT-01",eot_days_granted:90, original_end_date:"2026-12-31",new_end_date:"2027-03-31"},
  {project_id:44,project_code:"BU/RIVER/PAT/2021/01",cos_number:"CoS-01",cos_date:"2023-11-20",cos_category:"SCOPE ADDITION",  cos_amount:480,cos_pct_variation:9.2,is_time_linked:true, eot_number:"EoT-01",eot_days_granted:90, original_end_date:"2025-06-30",new_end_date:"2025-09-30"},
  {project_id:44,project_code:"BU/RIVER/PAT/2021/01",cos_number:"CoS-02",cos_date:"2024-06-15",cos_category:"COURT ORDER",    cos_amount:0,  cos_pct_variation:0,  is_time_linked:true, eot_number:"EoT-02",eot_days_granted:90, original_end_date:"2025-09-30",new_end_date:"2025-12-31"},
];

const projVariation = {};
COS_EOT_DATA.forEach(d=>{ if(!projVariation[d.project_id]) projVariation[d.project_id]=0; projVariation[d.project_id]+=d.cos_amount; });

const MANAGEMENT_FLAGS = [
  {flag_id:1,severity:"CRITICAL",days_open:47,flag_category:"Contractor Default",    flag_description:"Contractor demobilised — no activity on site for 47 days",                     action_required:"Issue NCN immediately. Explore invocation of PBG.",              responsible_dept:"PMU Muzaffarpur",   project_code:"BU/SEW/MUZ/2022/03",  project_name:"Muzaffarpur STP Phase-II",       sector_name:"Sewerage & STP", ulb_name:"Muzaffarpur",is_pre_monsoon:false},
  {flag_id:2,severity:"HIGH",    days_open:31,flag_category:"NOC Delay",            flag_description:"Forest NOC pending with Bihar Forest Dept — blocking 3.2km pipeline",            action_required:"Write to PCCF immediately. Escalate to MD for follow-up.",       responsible_dept:"Forest Department", project_code:"BU/WATER/PAT/2021/07", project_name:"Patna 24×7 Water Supply",        sector_name:"Water Supply",   ulb_name:"Patna",      is_pre_monsoon:false},
  {flag_id:3,severity:"HIGH",    days_open:78,flag_category:"EoT Overdue",          flag_description:"3rd EoT sought by contractor — total delay now 270 days",                        action_required:"Review EoT justification. MD approval required for >180 days.",  responsible_dept:"PMU Bhagalpur",     project_code:"BU/TRAN/BHG/2022/05", project_name:"Bhagalpur Bus Depot Complex",     sector_name:"Urban Transport",ulb_name:"Bhagalpur",  is_pre_monsoon:false},
  {flag_id:4,severity:"MEDIUM",  days_open:18,flag_category:"BG Expiry",            flag_description:"PBG worth ₹92 Lakhs expiring in 12 days — contractor not renewing",               action_required:"Issue 7-day notice. Prepare for encashment if no renewal.",      responsible_dept:"Finance Section",   project_code:"BU/DRAIN/GAY/2023/01", project_name:"Gaya Storm Drain Network",        sector_name:"Storm Drainage", ulb_name:"Gaya",       is_pre_monsoon:false},
  {flag_id:5,severity:"CRITICAL",days_open:5, flag_category:"Pre-Monsoon Risk",     flag_description:"Open drain excavation across 4.2 km — heavy rain forecast, flood risk",          action_required:"Immediate backfilling or shoring. Emergency contractor meeting.", responsible_dept:"PMU Gaya",          project_code:"BU/DRAIN/GAY/2023/01", project_name:"Gaya Storm Drain Network",        sector_name:"Storm Drainage", ulb_name:"Gaya",       is_pre_monsoon:true},
  {flag_id:6,severity:"HIGH",    days_open:8, flag_category:"Pre-Monsoon Risk",     flag_description:"STP earthwork exposed — monsoon may cause slope failure",                         action_required:"Deploy waterproofing cover. Inspect slope stability.",           responsible_dept:"PMU Muzaffarpur",   project_code:"BU/SEW/MUZ/2022/03",  project_name:"Muzaffarpur STP Phase-II",       sector_name:"Sewerage & STP", ulb_name:"Muzaffarpur",is_pre_monsoon:true},
  {flag_id:7,severity:"HIGH",    days_open:3, flag_category:"Pre-Monsoon Risk",     flag_description:"Ring road cutting unstabilised — 650m stretch vulnerable to erosion",             action_required:"Deploy stone pitching / retaining walls before June 15.",        responsible_dept:"PMU Muzaffarpur",   project_code:"BU/ROAD/MUZ/2024/01", project_name:"Muzaffarpur Ring Road Upgradation",sector_name:"Road & Bridges", ulb_name:"Muzaffarpur",is_pre_monsoon:true},
  {flag_id:8,severity:"CRITICAL",days_open:62,flag_category:"Progress Stalled",     flag_description:"Ganga Riverfront — zero physical progress for 60+ days. Court stay.",            action_required:"Legal team review. Explore DPR modification to bypass stay.",    responsible_dept:"PMU Patna",         project_code:"BU/RIVER/PAT/2021/01", project_name:"Patna Ganga Riverfront Phase-I",  sector_name:"Riverfront",     ulb_name:"Patna",      is_pre_monsoon:false},
];

// ─── PRIMITIVES ───────────────────────────────────────────────────────────────
const Bar2 = ({ value, color }) => (
  <div style={{background:"#E8EBF2",borderRadius:3,height:5,overflow:"hidden",width:"100%",minWidth:60}}>
    <div style={{width:`${Math.min(value,100)}%`,height:"100%",background:color||pctColor(value),borderRadius:3,transition:"width .5s"}}/>
  </div>
);

const Badge = ({ children, color=C.text3 }) => (
  <span style={{display:"inline-flex",alignItems:"center",gap:3,background:color+"18",color,border:`1px solid ${color}30`,borderRadius:4,padding:"2px 8px",fontSize:11,fontWeight:600,whiteSpace:"nowrap",letterSpacing:".02em"}}>{children}</span>
);

const Pill = ({ children, color }) => (
  <span style={{background:color+"15",color,border:`1px solid ${color}30`,borderRadius:20,padding:"3px 10px",fontSize:11,fontWeight:700,whiteSpace:"nowrap"}}>{children}</span>
);

const Logo = ({ size=38 }) => (
  <svg width={size} height={size} viewBox="0 0 38 38" fill="none">
    <rect width="38" height="38" rx="9" fill={C.navy}/>
    <rect x="7"  y="18" width="9"  height="13" rx="1" fill="white" fillOpacity=".95"/>
    <rect x="9"  y="13" width="5"  height="5"  rx=".5" fill="white" fillOpacity=".7"/>
    <rect x="17" y="22" width="5"  height="9"  rx="1" fill="white" fillOpacity=".95"/>
    <rect x="23" y="15" width="8"  height="16" rx="1" fill="white" fillOpacity=".95"/>
    <rect x="25" y="10" width="4"  height="5"  rx=".5" fill="white" fillOpacity=".7"/>
    <polygon points="25,10 27,7 29,10" fill="white" fillOpacity=".9"/>
    <rect x="5"  y="31" width="28" height="1.5" rx=".5" fill="white" fillOpacity=".4"/>
  </svg>
);

const KpiCard = ({ label, value, sub, accent, icon, onClick, badge }) => (
  <div onClick={onClick} style={{background:C.surface,border:`1px solid ${C.border}`,borderTop:`3px solid ${accent}`,borderRadius:10,padding:"18px 20px",cursor:onClick?"pointer":"default",transition:"all .18s",position:"relative",boxShadow:"0 1px 4px rgba(13,33,55,.06)"}}
    onMouseEnter={e=>{if(onClick){e.currentTarget.style.boxShadow="0 6px 20px rgba(13,33,55,.12)";e.currentTarget.style.transform="translateY(-2px)";}}}
    onMouseLeave={e=>{e.currentTarget.style.boxShadow="0 1px 4px rgba(13,33,55,.06)";e.currentTarget.style.transform="translateY(0)";}}>
    {badge&&<div style={{position:"absolute",top:14,right:14,background:C.red,color:"white",fontSize:9,fontWeight:700,borderRadius:10,padding:"2px 7px",letterSpacing:".04em"}}>{badge}</div>}
    <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between"}}>
      <div>
        <div style={{fontSize:11,color:C.text3,fontWeight:600,letterSpacing:".06em",textTransform:"uppercase",marginBottom:8}}>{label}</div>
        <div style={{fontSize:26,fontWeight:700,color:C.text1,lineHeight:1,fontFamily:"'DM Serif Display',Georgia,serif"}}>{value}</div>
        {sub&&<div style={{fontSize:11,color:C.text3,marginTop:5}}>{sub}</div>}
      </div>
      <div style={{fontSize:26,opacity:.15,marginTop:2}}>{icon}</div>
    </div>
    {onClick&&<div style={{marginTop:10,fontSize:10,color:accent,fontWeight:600,letterSpacing:".04em"}}>VIEW DETAILS →</div>}
  </div>
);

const Modal = ({ title, subtitle, onClose, children, width=940 }) => (
  <div style={{position:"fixed",inset:0,background:"rgba(13,33,55,.45)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:24}} onClick={onClose}>
    <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:14,width:"100%",maxWidth:width,maxHeight:"90vh",overflow:"auto",boxShadow:"0 24px 64px rgba(13,33,55,.2)"}} onClick={e=>e.stopPropagation()}>
      <div style={{padding:"20px 28px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"flex-start",position:"sticky",top:0,background:C.surface,zIndex:10}}>
        <div>
          <div style={{fontSize:16,fontWeight:700,color:C.text1}}>{title}</div>
          {subtitle&&<div style={{fontSize:12,color:C.text3,marginTop:3}}>{subtitle}</div>}
        </div>
        <button onClick={onClose} style={{background:"none",border:`1px solid ${C.border}`,color:C.text3,borderRadius:6,padding:"5px 14px",cursor:"pointer",fontSize:12,fontWeight:600,marginLeft:20}}>Close ✕</button>
      </div>
      <div style={{padding:"20px 28px"}}>{children}</div>
    </div>
  </div>
);

// ─── SORTABLE / FILTERABLE TABLE HEADER ──────────────────────────────────────
function TH({ label, field, filters, setFilters, sortField, setSortField, sortDir, setSortDir, options }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const active = filters[field] && filters[field] !== "ALL";
  const sorted = sortField === field;

  useEffect(()=>{
    const h = e => { if(ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  },[]);

  const handleSort = () => {
    if(sortField===field) setSortDir(d=>d==="asc"?"desc":"asc");
    else { setSortField(field); setSortDir("asc"); }
  };

  return (
    <th style={{padding:"10px 14px",textAlign:"left",background:C.surfaceAlt,borderBottom:`2px solid ${C.border}`,whiteSpace:"nowrap",position:"sticky",top:0,zIndex:5}}>
      <div style={{display:"flex",alignItems:"center",gap:4}} ref={ref}>
        <span onClick={handleSort} style={{cursor:"pointer",fontSize:11,fontWeight:700,color:sorted?C.blue:C.text2,letterSpacing:".05em",textTransform:"uppercase",userSelect:"none"}}>
          {label}{sorted?(sortDir==="asc"?" ↑":" ↓"):" ⇅"}
        </span>
        {options&&(
          <span style={{position:"relative"}}>
            <span onClick={()=>setOpen(o=>!o)} style={{cursor:"pointer",fontSize:13,color:active?C.blue:C.text4,fontWeight:700,padding:"0 3px",display:"inline-block"}}>
              {active?"▼":"⌄"}
            </span>
            {open&&(
              <div style={{position:"absolute",top:"100%",left:0,background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,minWidth:160,boxShadow:"0 8px 24px rgba(13,33,55,.15)",zIndex:100,marginTop:4,maxHeight:240,overflowY:"auto"}}>
                {["ALL",...options].map(opt=>(
                  <div key={opt} onClick={e=>{e.stopPropagation();setFilters(f=>({...f,[field]:opt}));setOpen(false);}}
                    style={{padding:"8px 14px",fontSize:12,cursor:"pointer",color:(filters[field]||"ALL")===opt?C.blue:C.text2,background:(filters[field]||"ALL")===opt?C.blueSoft:"transparent",fontWeight:(filters[field]||"ALL")===opt?600:400}}>
                    {opt==="ALL"?"All":opt}
                  </div>
                ))}
              </div>
            )}
          </span>
        )}
        {active&&<span onClick={()=>setFilters(f=>({...f,[field]:"ALL"}))} style={{fontSize:9,cursor:"pointer",color:C.red,fontWeight:700,padding:"1px 4px",background:C.redSoft,borderRadius:3}}>✕</span>}
      </div>
    </th>
  );
}

// ─── TABLE ENGINE ─────────────────────────────────────────────────────────────
function useTableControls(data, searchFields) {
  const [filters, setFilters] = useState({});
  const [sortField, setSortField] = useState(null);
  const [sortDir, setSortDir] = useState("asc");
  const [search, setSearch] = useState("");

  const filtered = data.filter(row => {
    const searchOk = !search || searchFields.some(f=>String(row[f]||"").toLowerCase().includes(search.toLowerCase()));
    const filterOk = Object.entries(filters).every(([k,v])=>!v||v==="ALL"||String(row[k]||"")===String(v));
    return searchOk && filterOk;
  });

  const sorted = sortField ? [...filtered].sort((a,b)=>{
    const av=a[sortField]??"", bv=b[sortField]??"";
    const cmp = typeof av==="number" ? av-bv : String(av).localeCompare(String(bv));
    return sortDir==="asc"?cmp:-cmp;
  }) : filtered;

  return {rows:sorted,filters,setFilters,sortField,setSortField,sortDir,setSortDir,search,setSearch};
}


// ─── MODAL FILTER ROW (for modal table headers) ──────────────────────────────
function ModalFilterRow({ columns, filterFields, data, modalFilters, setModalFilters }) {
  return (
    <tr style={{background:C.surfaceAlt}}>
      {columns.map((col, i) => {
        const field = filterFields[i];
        const opts = field ? [...new Set(data.map(r=>String(r[field]||"")).filter(Boolean))].sort() : [];
        const active = field && modalFilters[field] && modalFilters[field]!=="ALL";
        return (
          <th key={col} style={{padding:"8px 14px",textAlign:"left",fontSize:11,fontWeight:700,color:C.text2,letterSpacing:".05em",textTransform:"uppercase",borderBottom:`2px solid ${C.border}`,whiteSpace:"nowrap"}}>
            <div style={{display:"flex",alignItems:"center",gap:4}}>
              <span>{col}</span>
              {opts.length>0&&(
                <select
                  value={modalFilters[field]||"ALL"}
                  onChange={e=>setModalFilters(f=>({...f,[field]:e.target.value}))}
                  style={{background:active?C.blueSoft:"transparent",border:`1px solid ${active?C.blue:C.border}`,borderRadius:4,color:active?C.blue:C.text3,fontSize:10,padding:"1px 4px",cursor:"pointer",maxWidth:90}}>
                  <option value="ALL">All</option>
                  {opts.map(o=><option key={o} value={o}>{o}</option>)}
                </select>
              )}
            </div>
          </th>
        );
      })}
    </tr>
  );
}

// ─── PROJECTS TABLE ───────────────────────────────────────────────────────────
function ProjectsTable({ projects, onSelect, onEdit, canEdit, filters={}, setFilters=()=>{}, sortField=null, setSortField=()=>{}, sortDir="asc", setSortDir=()=>{} }) {
  const sectorOptions  = [...new Set(PROJECTS_INIT.map(p=>p.sector_name))].sort();
  const districtOptions= [...new Set(PROJECTS_INIT.map(p=>p.district))].sort();
  const ulbOptions     = [...new Set(PROJECTS_INIT.map(p=>p.ulb_name))].sort();
  const phaseOptions   = PROJECT_PHASES;
  const statusOptions  = [...new Set(PROJECTS_INIT.map(p=>p.status))].sort();
  const contractorOptions = [...new Set(PROJECTS_INIT.map(p=>p.contractor_name))].sort();

  const thP = {filters,setFilters,sortField,setSortField,sortDir,setSortDir};

  return (
    <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,overflow:"auto",boxShadow:"0 1px 4px rgba(13,33,55,.05)"}}>
      <table style={{minWidth:1200}}>
        <thead>
          <tr>
            <TH label="Project Name"  field="project_name"  options={null}             {...thP}/>
            <TH label="Code"          field="project_code"  options={null}             {...thP}/>
            <TH label="Sector"        field="sector_name"   options={sectorOptions}    {...thP}/>
            <TH label="District"      field="district"      options={districtOptions}  {...thP}/>
            <TH label="ULB"           field="ulb_name"      options={ulbOptions}       {...thP}/>
            <TH label="Contractor"    field="contractor_name" options={contractorOptions} {...thP}/>
            <TH label="Phase"         field="phase"         options={phaseOptions}     {...thP}/>
            <TH label="Status"        field="status"        options={statusOptions}    {...thP}/>
            <TH label="Physical %"    field="actual_physical_pct" options={null}       {...thP}/>
            <TH label="Financial %"   field="financial_progress_pct" options={null}    {...thP}/>
            <TH label="Sanctioned"    field="current_sanctioned_cost" options={null}   {...thP}/>
            <TH label="Delay (days)"  field="delay_days"    options={null}             {...thP}/>
            {canEdit&&<th style={{padding:"10px 14px",background:C.surfaceAlt,borderBottom:`2px solid ${C.border}`,fontSize:11,fontWeight:700,color:C.text2,textTransform:"uppercase",letterSpacing:".05em"}}>Action</th>}
          </tr>
        </thead>
        <tbody>
          {projects.map(p=>(
            <tr key={p.project_id} style={{cursor:"pointer"}} onClick={()=>onSelect(p)}>
              <td>
                <div style={{fontSize:13,fontWeight:600,color:C.text1,maxWidth:200}}>{p.project_name}</div>
              </td>
              <td style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:C.text4,whiteSpace:"nowrap"}}>{p.project_code}</td>
              <td><Badge color={C.teal}>{p.sector_icon} {p.sector_name}</Badge></td>
              <td style={{fontSize:12,color:C.text2}}>{p.district}</td>
              <td style={{fontSize:12,color:C.text2}}>{p.ulb_name}</td>
              <td style={{fontSize:11,color:C.text3,maxWidth:140}}>{p.contractor_name}</td>
              <td><Pill color={PHASE_COLOR[p.phase]||C.text3}>{p.phase}</Pill></td>
              <td>
                <span style={{background:p.status==="STALLED"?C.redSoft:p.status==="IN_PROGRESS"?C.blueSoft:p.status==="COMPLETED"?C.greenSoft:C.surfaceAlt,
                  color:p.status==="STALLED"?C.red:p.status==="IN_PROGRESS"?C.blue:p.status==="COMPLETED"?C.green:C.text3,
                  fontSize:10,fontWeight:600,padding:"2px 8px",borderRadius:4,whiteSpace:"nowrap"}}>{p.status}</span>
              </td>
              <td>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <Bar2 value={p.actual_physical_pct}/>
                  <span style={{fontFamily:"'DM Mono',monospace",fontSize:12,color:pctColor(p.actual_physical_pct),fontWeight:600,minWidth:34}}>{p.actual_physical_pct}%</span>
                </div>
              </td>
              <td><span style={{fontFamily:"'DM Mono',monospace",fontSize:12,color:pctColor(p.financial_progress_pct),fontWeight:600}}>{p.financial_progress_pct}%</span></td>
              <td style={{fontFamily:"'DM Mono',monospace",fontSize:12,color:C.purple,fontWeight:600,whiteSpace:"nowrap"}}>{fmtCr(p.current_sanctioned_cost)}</td>
              <td>{p.delay_days>0?<Pill color={C.red}>{p.delay_days}d late</Pill>:<Pill color={C.green}>On time</Pill>}</td>
              {canEdit&&<td onClick={e=>e.stopPropagation()}><button onClick={()=>onEdit(p)} style={{background:"none",border:`1px solid ${C.border}`,color:C.text2,borderRadius:6,padding:"4px 12px",cursor:"pointer",fontSize:12}}>✏ Edit</button></td>}
            </tr>
          ))}
          {projects.length===0&&<tr><td colSpan={13} style={{textAlign:"center",color:C.text4,padding:30}}>No projects match current filters</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

// ─── PROJECT DETAIL ───────────────────────────────────────────────────────────
function ProjectDetail({ project:p, onBack, onEdit, canEdit }) {
  const cos = COS_EOT_DATA.filter(d=>d.project_id===p.project_id);
  return (
    <div>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:22}}>
        <button className="btn-ghost" onClick={onBack}>← Back to Projects</button>
        <span style={{color:C.text4}}>›</span>
        <span style={{fontSize:16,fontWeight:700,color:C.text1}}>{p.project_name}</span>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18,marginBottom:18}}>
        <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:"22px 24px",boxShadow:"0 1px 3px rgba(13,33,55,.05)"}}>
          <div style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:C.text4}}>{p.project_code}</div>
          <div style={{fontSize:18,fontWeight:700,color:C.text1,margin:"6px 0 12px",fontFamily:"'DM Serif Display',serif"}}>{p.project_name}</div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:16}}>
            <Badge color={C.teal}>{p.sector_icon} {p.sector_name}</Badge>
            <Pill color={PHASE_COLOR[p.phase]||C.text3}>{p.phase}</Pill>
            <Pill color={p.delay_days>0?C.red:C.green}>{p.delay_days>0?`${p.delay_days}d late`:"On time"}</Pill>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
            {[["Planned End",p.planned_end_date],["Revised End",p.revised_end_date||"—"],["CoS Events",p.total_cos_count],["Total EoT",`${p.total_eot_days} days`],["Sanctioned",fmtCr(p.current_sanctioned_cost)],["CoS Variation",projVariation[p.project_id]?`+₹\u2009${projVariation[p.project_id]}\u2009L`:"—"]].map(([l,v])=>(
              <div key={l} style={{background:C.surfaceAlt,border:`1px solid ${C.border}`,borderRadius:8,padding:"10px 14px"}}>
                <div style={{fontSize:10,color:C.text3,fontWeight:600,textTransform:"uppercase",letterSpacing:".05em"}}>{l}</div>
                <div style={{fontSize:13,fontWeight:700,color:C.text1,fontFamily:"'DM Mono',monospace",marginTop:4}}>{v}</div>
              </div>
            ))}
          </div>
          {p.latitude&&<div style={{background:C.surfaceAlt,border:`1px solid ${C.border}`,borderRadius:8,padding:"10px 14px",marginBottom:10}}><div style={{fontSize:10,color:C.text3,fontWeight:600,textTransform:"uppercase",marginBottom:5}}>Location</div><div style={{fontSize:12,fontFamily:"'DM Mono',monospace",color:C.text2}}>📍 {p.latitude}°N, {p.longitude}°E</div>{p.chainage&&<div style={{fontSize:12,fontFamily:"'DM Mono',monospace",color:C.text2,marginTop:4}}>📏 {p.chainage}</div>}</div>}
          {p.delay_reason&&<div style={{background:C.redSoft,border:`1px solid ${C.red}20`,borderRadius:8,padding:"10px 14px",marginBottom:10}}><div style={{fontSize:10,color:C.red,fontWeight:600,textTransform:"uppercase",marginBottom:4}}>Delay Reason</div><div style={{fontSize:13,color:C.text1}}>{p.delay_reason}</div>{p.dept_stuck&&<div style={{fontSize:11,color:C.text3,marginTop:4}}>Stuck at: <span style={{color:C.orange,fontWeight:600}}>{p.dept_stuck}</span></div>}</div>}
          {canEdit&&<button className="btn-primary" onClick={()=>onEdit(p)} style={{width:"100%",marginTop:4}}>✏ Edit Project Details</button>}
        </div>
        <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:"22px 24px",boxShadow:"0 1px 3px rgba(13,33,55,.05)"}}>
          <div style={{fontSize:13,fontWeight:700,color:C.text1,marginBottom:18}}>Progress Overview</div>
          {[["Physical Progress",p.actual_physical_pct,p.scheduled_physical_pct],["Financial Progress",p.financial_progress_pct,null]].map(([label,val,plan])=>(
            <div key={label} style={{marginBottom:20}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}><span style={{fontSize:13,color:C.text2,fontWeight:500}}>{label}</span><span style={{fontFamily:"'DM Mono',monospace",fontSize:13,color:pctColor(val),fontWeight:700}}>{val}%{plan?` / ${plan}% planned`:""}</span></div>
              <div style={{background:"#E8EBF2",borderRadius:6,height:10,overflow:"hidden"}}><div style={{width:`${Math.min(val,100)}%`,height:"100%",background:pctColor(val),borderRadius:6,transition:"width .6s"}}/></div>
            </div>
          ))}
        </div>
      </div>
      <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:"22px 24px",boxShadow:"0 1px 3px rgba(13,33,55,.05)"}}>
        <div style={{fontSize:13,fontWeight:700,color:C.text1,marginBottom:16}}>CoS → EoT → Revised Date Timeline</div>
        {cos.length===0?<div style={{textAlign:"center",padding:30,color:C.text3,fontSize:13}}>No CoS / EoT events recorded for this project</div>:cos.map((d,i)=>(
          <div key={i} style={{display:"flex",gap:16,marginBottom:18,paddingBottom:18,borderBottom:i<cos.length-1?`1px solid ${C.border}`:"none"}}>
            <div style={{display:"flex",flexDirection:"column",alignItems:"center"}}>
              <div style={{width:30,height:30,borderRadius:"50%",background:C.blueSoft,border:`2px solid ${C.blue}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:C.blue,flexShrink:0}}>{i+1}</div>
              {i<cos.length-1&&<div style={{width:2,flex:1,background:C.border,minHeight:20}}/>}
            </div>
            <div style={{flex:1}}>
              <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:10,flexWrap:"wrap"}}>
                <Pill color={C.purple}>{d.cos_number}</Pill><Badge color={C.teal}>{d.cos_category}</Badge>
                <span style={{fontSize:11,color:C.text4,fontFamily:"'DM Mono',monospace"}}>{d.cos_date}</span>
                {d.is_time_linked&&<Badge color={C.amber}>EoT Linked</Badge>}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
                {[["CoS Amount",`+₹\u2009${d.cos_amount}\u2009L`,C.amber],["Variation",`${d.cos_pct_variation}%`,d.cos_pct_variation>10?C.red:C.amber],["EoT Granted",`${d.eot_days_granted}d (${d.eot_number})`,C.blue],["Revised Date",d.new_end_date,C.red]].map(([l,v,col])=>(
                  <div key={l} style={{background:C.surfaceAlt,border:`1px solid ${C.border}`,borderRadius:8,padding:"10px 14px"}}>
                    <div style={{fontSize:10,color:C.text3,fontWeight:600,textTransform:"uppercase",letterSpacing:".05em"}}>{l}</div>
                    <div style={{fontSize:13,fontWeight:700,color:col,fontFamily:"'DM Mono',monospace",marginTop:4}}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── MAIN DASHBOARD ───────────────────────────────────────────────────────────
export default function BuidcoDashboard() {
  const [projects, setProjects] = useState(PROJECTS_INIT);
  const [activeTab, setActiveTab]           = useState("overview");
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedSector, setSelectedSector]   = useState(null);
  const [tick, setTick]                       = useState(0);
  const [userRole, setUserRole]               = useState("MD");
  const perms = ROLE_PERMISSIONS[userRole] || ROLE_PERMISSIONS.READ_ONLY;
  const [searchQuery, setSearchQuery]         = useState("");
  const [searchFocus, setSearchFocus]         = useState(false);

  const [showActiveModal, setShowActiveModal]   = useState(false);
  const [showTendersModal, setShowTendersModal] = useState(false);
  const [showMonsoonModal, setShowMonsoonModal]       = useState(false);
  const [showExpenditureModal, setShowExpenditureModal] = useState(false);
  const [showFinUtilModal, setShowFinUtilModal]         = useState(false);
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

  const projTable  = useTableControls(projects, ["project_name","project_code","ulb_name","district"]);
  const activeModal= useTableControls(projects, ["project_name","project_code","ulb_name"]);
  const [activeDelayFilter, setActiveDelayFilter] = useState("ALL");

  useEffect(()=>{ const id=setInterval(()=>setTick(t=>t+1),1000); return()=>clearInterval(id); },[]);

  const now     = new Date();
  const timeStr = now.toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",second:"2-digit"});
  const dateStr = now.toLocaleDateString("en-IN",{weekday:"short",day:"numeric",month:"short",year:"numeric"});

  const activeTenderProjects = projects.filter(p=>ACTIVE_TENDER_PHASES.includes(p.phase));
  const preMonsoonFlags      = MANAGEMENT_FLAGS.filter(f=>f.is_pre_monsoon);
  const cosCategories        = [...new Set(COS_EOT_DATA.map(d=>d.cos_category))];
  const filteredCos = COS_EOT_DATA.filter(d=>{
    const pm = cosProjectFilter==="ALL" || d.project_id===parseInt(cosProjectFilter);
    const cm = cosCategoryFilter==="ALL" || d.cos_category===cosCategoryFilter;
    return pm && cm;
  });
  const totalVar = filteredCos.reduce((s,d)=>s+d.cos_amount,0);

  const totalCost  = projects.reduce((a,p)=>a+p.current_sanctioned_cost,0);
  const totalSpent = projects.reduce((a,p)=>a+(p.current_sanctioned_cost*p.financial_progress_pct/100),0);
  const finPct     = Math.round(totalSpent/totalCost*100);
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
  const filteredTenderProjects = activeTenderProjects.filter(p=>
    Object.entries(tenderFilters).every(([k,v])=>!v||v==="ALL"||String(p[k]||"")===v)
  );
  const filteredMgmtFlags = MANAGEMENT_FLAGS.filter(f=>
    Object.entries(mgmtFilters).every(([k,v])=>!v||v==="ALL"||String(f[k]||"")===v)
  );

  const sectorChartData = SECTORS.map(s=>({name:s.sector_icon+" "+s.sector_code,physical:s.avg_physical_pct,financial:s.financial_utilisation_pct}));

  // Status breakdown for donut
  const statusMap = {};
  projects.forEach(p=>{ statusMap[p.status]=(statusMap[p.status]||0)+1; });
  const DONUT_COLORS = ["#1A5CFF","#C2530B","#0A7540","#5B21B6","#C0392B","#0891B2","#B45309","#0D2137","#7C3AED"];
  const flagPieData = Object.entries(statusMap).map(([k,v],i)=>({name:k,value:v,color:DONUT_COLORS[i%DONUT_COLORS.length]}));

  const openAddModal = () => {
    if(!perms.can_add){ alert("Access Denied: Only MD can add new projects."); return; }
    setAddForm({sector_code:"WATER",phase:"Conceptualization",status:"DPR_STAGE",district:"Patna",planned_end_date:"2027-12-31"});
    setShowAddModal(true);
  };
  const saveAdd = () => {
    if(!addForm.project_name||!addForm.project_code) return alert("Project Code and Name are required.");
    const sec = SECTORS.find(s=>s.sector_code===addForm.sector_code);
    setProjects(prev=>[...prev,{
      project_id:_nextId++,
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

  const tabs = [
    {id:"overview",    label:"Overview"},
    {id:"sectors",     label:"Sectors"},
    {id:"projects",    label:"Projects"},
    {id:"districts",   label:"Districts"},
    {id:"cos_eot",     label:"CoS / EoT"},
    {id:"mgmt_action", label:"Management Action"},
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
              {t.id==="mgmt_action"&&<span style={{marginLeft:5,background:C.red,color:"white",fontSize:9,borderRadius:10,padding:"1px 5px",fontWeight:700}}>{MANAGEMENT_FLAGS.length}</span>}
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
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16,marginBottom:28}}>
              <KpiCard label="Active Tenders"           value={activeTenderProjects.length}    sub="Conceptualization to Post-Tender"  accent={C.teal}   icon="📄" onClick={()=>setShowTendersModal(true)}/>
              <KpiCard label="Pre-Monsoon Preparations" value={preMonsoonFlags.length}         sub="urgent flags requiring action"    accent={C.red}    icon="⛈" badge={`${preMonsoonFlags.filter(f=>f.severity==="CRITICAL").length} CRITICAL`} onClick={()=>setShowMonsoonModal(true)}/>
              <KpiCard label="Districts Active"         value={districts.length}               sub="Click Districts tab for details"  accent={C.orange} icon="📍" onClick={()=>setActiveTab("districts")}/>
            </div>

            <div onClick={()=>setShowFinUtilModal(true)} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:"20px 24px",marginBottom:28,boxShadow:"0 1px 4px rgba(13,33,55,.05)",cursor:"pointer",transition:"box-shadow .15s"}}
              onMouseEnter={e=>e.currentTarget.style.boxShadow="0 6px 20px rgba(13,33,55,.12)"}
              onMouseLeave={e=>e.currentTarget.style.boxShadow="0 1px 4px rgba(13,33,55,.05)"}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
                <span style={{fontSize:13,fontWeight:600,color:C.text1}}>Portfolio Financial Utilisation <span style={{fontSize:11,color:C.blue,fontWeight:400}}>(click for district & sector breakup)</span></span>
                <span style={{fontFamily:"'DM Mono',monospace",fontSize:15,color:C.green,fontWeight:600}}>{finPct}%</span>
              </div>
              <div style={{background:"#E8EBF2",borderRadius:6,height:10,overflow:"hidden"}}>
                <div style={{width:`${finPct}%`,height:"100%",background:`linear-gradient(90deg,${C.blue},${C.green})`,borderRadius:6,transition:"width .8s"}}/>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",marginTop:6}}>
                <span style={{fontSize:11,color:C.text4}}>₹ 0</span>
                <span style={{fontSize:11,color:C.text4}}>{fmtCr(totalCost)} (Target)</span>
              </div>
            </div>

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
              {SECTORS.map(s=>(
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
          const sec=SECTORS.find(s=>s.sector_code===selectedSector);
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
              <ProjectsTable projects={secProjects} onSelect={p=>{setSelectedProject(p);setActiveTab("projects")}} onEdit={p=>{setEditProject(p);setEditForm({...p});setShowEditModal(true)}} canEdit={perms.can_edit}/>
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
              <KpiCard label="Total CoS Events"  value={COS_EOT_DATA.length}                                   accent={C.purple} icon="📝"/>
              <KpiCard label="Total EoT Days"    value={`${COS_EOT_DATA.reduce((a,d)=>a+d.eot_days_granted,0)}d`} accent={C.amber}  icon="⏱"/>
              <KpiCard label="CoS Linked to EoT" value={`${COS_EOT_DATA.filter(d=>d.is_time_linked).length}`} accent={C.red}    icon="🔗"/>
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
              <p style={{fontSize:13,color:C.text3,marginTop:4}}>{MANAGEMENT_FLAGS.length} open flags — sorted by severity and urgency</p>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:24}}>
              {[["CRITICAL",C.red],["HIGH",C.orange],["MEDIUM",C.amber],["LOW",C.text3]].map(([sev,col])=>(
                <div key={sev} style={{background:C.surface,border:`1px solid ${C.border}`,borderTop:`3px solid ${col}`,borderRadius:10,padding:"16px 18px"}}>
                  <div style={{fontSize:11,color:C.text3,fontWeight:600,textTransform:"uppercase",letterSpacing:".06em",marginBottom:8}}>{sev}</div>
                  <div style={{fontSize:28,fontWeight:700,color:col,fontFamily:"'DM Serif Display',serif"}}>{MANAGEMENT_FLAGS.filter(f=>f.severity===sev).length}</div>
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
                  {[...new Set(MANAGEMENT_FLAGS.map(f=>f.flag_category))].map(c=><option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:5}}>
                <label style={{fontSize:11,color:C.text3,fontWeight:600,textTransform:"uppercase",letterSpacing:".05em"}}>Sector</label>
                <select value={mgmtFilters.sector_name||"ALL"} onChange={e=>setMgmtFilters(f=>({...f,sector_name:e.target.value}))}>
                  <option value="ALL">All Sectors</option>
                  {[...new Set(MANAGEMENT_FLAGS.map(f=>f.sector_name))].map(s=><option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:5}}>
                <label style={{fontSize:11,color:C.text3,fontWeight:600,textTransform:"uppercase",letterSpacing:".05em"}}>ULB</label>
                <select value={mgmtFilters.ulb_name||"ALL"} onChange={e=>setMgmtFilters(f=>({...f,ulb_name:e.target.value}))}>
                  <option value="ALL">All ULBs</option>
                  {[...new Set(MANAGEMENT_FLAGS.map(f=>f.ulb_name))].map(u=><option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              {Object.values(mgmtFilters).some(v=>v&&v!=="ALL")&&<button className="btn-ghost" onClick={()=>setMgmtFilters({})}>✕ Clear</button>}
              <div style={{marginLeft:"auto",fontSize:12,color:C.text3}}>{filteredMgmtFlags.length} of {MANAGEMENT_FLAGS.length} flags shown</div>
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
        <Modal title={`Active Tenders — ${activeTenderProjects.length} Projects`} subtitle="Projects in pre-construction phases" onClose={()=>setShowTendersModal(false)}>
          <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
            {ACTIVE_TENDER_PHASES.map(ph=>(
              <div key={ph} style={{background:PHASE_COLOR[ph]+"15",border:`1px solid ${PHASE_COLOR[ph]}30`,borderRadius:20,padding:"4px 14px",fontSize:12,color:PHASE_COLOR[ph],fontWeight:600}}>
                {ph}: {activeTenderProjects.filter(p=>p.phase===ph).length}
              </div>
            ))}
          </div>
          <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,overflow:"auto"}}>
            <table>
              <thead>
                <ModalFilterRow
                  columns={["Project","Sector","District","Phase","Sanctioned Cost","Planned End"]}
                  filterFields={[null,"sector_name","district","phase",null,null]}
                  data={activeTenderProjects} modalFilters={tenderFilters} setModalFilters={setTenderFilters}
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
        const sectorExp = SECTORS.map(s=>{
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
                {SECTORS.map(s=>{
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
            <F label="Sector" field="sector_code" options={SECTORS.map(s=>({v:s.sector_code,l:`${s.sector_icon} ${s.sector_name}`}))}/>
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
