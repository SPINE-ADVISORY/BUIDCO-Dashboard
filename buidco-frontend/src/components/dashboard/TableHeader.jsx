import { useState, useEffect, useRef } from "react";
import { COLORS as C } from "../../config/theme";

// ─── SORTABLE / FILTERABLE TABLE HEADER ──────────────────────────────────────
export function TH({ label, field, filters, setFilters, sortField, setSortField, sortDir, setSortDir, options }) {
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
