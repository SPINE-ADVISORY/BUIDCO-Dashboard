import { COLORS as C } from "../../config/theme";
import { PHASE_COLORS as PHASE_COLOR } from "../../config/theme";
import { fmtCr, pctColor } from "../../utils/formatters";
import { PROJECT_PHASES } from "../../config/constants";
import { Bar2, Badge, Pill } from "./DashboardPrimitives";
import { TH } from "./TableHeader";

// ─── PROJECTS TABLE ───────────────────────────────────────────────────────────
export function ProjectsTable({ projects, allProjectsForFilters, onSelect, onEdit, canEdit, filters={}, setFilters=()=>{}, sortField=null, setSortField=()=>{}, sortDir="asc", setSortDir=()=>{} }) {
  const src = allProjectsForFilters ?? projects;
  const sectorOptions  = [...new Set(src.map(p=>p.sector_name))].sort();
  const districtOptions= [...new Set(src.map(p=>p.district))].sort();
  const ulbOptions     = [...new Set(src.map(p=>p.ulb_name))].sort();
  const phaseOptions   = PROJECT_PHASES;
  const statusOptions  = [...new Set(src.map(p=>p.status))].sort();
  const contractorOptions = [...new Set(src.map(p=>p.contractor_name))].sort();

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
