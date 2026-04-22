import { COLORS as C } from "../../config/theme";
import { getPercentageColor as pctColor } from "../../utils/formatters";

// ─── PRIMITIVES ───────────────────────────────────────────────────────────────
export const Bar2 = ({ value, color }) => (
  <div style={{background:"#E8EBF2",borderRadius:3,height:5,overflow:"hidden",width:"100%",minWidth:60}}>
    <div style={{width:`${Math.min(value,100)}%`,height:"100%",background:color||pctColor(value),borderRadius:3,transition:"width .5s"}}/>
  </div>
);

export const Badge = ({ children, color=C.text3 }) => (
  <span style={{display:"inline-flex",alignItems:"center",gap:3,background:color+"18",color,border:`1px solid ${color}30`,borderRadius:4,padding:"2px 8px",fontSize:11,fontWeight:600,whiteSpace:"nowrap",letterSpacing:".02em"}}>{children}</span>
);

export const Pill = ({ children, color }) => (
  <span style={{background:color+"15",color,border:`1px solid ${color}30`,borderRadius:20,padding:"3px 10px",fontSize:11,fontWeight:700,whiteSpace:"nowrap"}}>{children}</span>
);

export const Logo = ({ size=38 }) => (
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

export const KpiCard = ({ label, value, sub, accent, icon, onClick, badge }) => (
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

export const Modal = ({ title, subtitle, onClose, children, width=940 }) => (
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
