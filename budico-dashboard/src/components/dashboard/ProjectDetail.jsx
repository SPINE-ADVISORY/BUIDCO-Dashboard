import { COLORS as C } from "../../config/theme";
import { PHASE_COLORS as PHASE_COLOR } from "../../config/theme";
import { fmtCr, pctColor } from "../../utils/formatters";
import { COS_EOT_DATA, projVariation } from "../../data/buidcoMockData";
import { Badge, Pill } from "./DashboardPrimitives";

// ─── PROJECT DETAIL ───────────────────────────────────────────────────────────
export function ProjectDetail({ project:p, onBack, onEdit, canEdit }) {
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
