import { COLORS as C } from "../../config/theme";

// ─── MODAL FILTER ROW (for modal table headers) ──────────────────────────────
export function ModalFilterRow({ columns, filterFields, data, modalFilters, setModalFilters }) {
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
