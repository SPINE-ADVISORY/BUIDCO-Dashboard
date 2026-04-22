/** Map DB status to dashboard “phase” band (for tenders / filters) */
export function statusToPhase(status) {
  const m = {
    DPR_STAGE: "Conceptualization",
    TENDERING: "Tender",
    AWARDED: "Post-Tender",
    IN_PROGRESS: "Construction",
    STALLED: "Construction",
    COMPLETED: "Completed",
    HANDED_OVER: "Completed",
    CANCELLED: "Completed",
  };
  return m[status] || "Construction";
}

/** Normalise API / v_project_kpis row → dashboard project shape */
export function mapApiProjectRow(r) {
  const n = (x) => (x === null || x === undefined ? 0 : Number(x));
  return {
    project_id: n(r.project_id),
    project_code: r.project_code,
    project_name: r.project_name,
    sector_code: r.sector_code ?? "",
    sector_name: r.sector_name ?? "",
    sector_icon: r.sector_icon ?? "",
    district: r.district ?? "",
    ulb_name: r.ulb_name ?? "",
    contractor_name: r.contractor_name ?? "",
    current_sanctioned_cost: n(r.current_sanctioned_cost),
    financial_progress_pct: n(r.financial_progress_pct),
    actual_physical_pct: n(r.actual_physical_pct),
    scheduled_physical_pct: n(r.scheduled_physical_pct),
    delay_days: n(r.delay_days),
    planned_end_date: r.planned_end_date,
    revised_end_date: r.revised_end_date,
    total_cos_count: n(r.total_cos_count),
    total_eot_days: n(r.total_eot_days),
    phase: r.phase || statusToPhase(r.status),
    delay_reason: r.delay_reason ?? null,
    dept_stuck: null,
    latitude: null,
    longitude: null,
    chainage: null,
    status: r.status,
  };
}

export function mapSectorKpiRow(r) {
  const n = (x) => (x === null || x === undefined ? 0 : Number(x));
  return {
    sector_code: r.sector_code,
    sector_name: r.sector_name,
    sector_icon: r.sector_icon ?? "",
    total_projects: n(r.total_projects),
    avg_physical_pct: n(r.avg_physical_pct),
    financial_utilisation_pct: n(r.financial_utilisation_pct),
    total_sanctioned_lakhs: n(r.total_sanctioned_lakhs),
    delayed_count: n(r.delayed_count),
    dc_flag_count: n(r.dc_flag_count),
  };
}

export function mapFlagApiRow(r) {
  return {
    flag_id: r.flag_id,
    severity: r.severity,
    days_open: Number(r.days_open ?? 0),
    flag_category: String(r.flag_category ?? "").replace(/_/g, " "),
    flag_description: r.flag_description,
    action_required: r.action_required,
    responsible_dept: r.responsible_dept,
    project_code: r.project_code,
    project_name: r.project_name,
    sector_name: r.sector_name,
    ulb_name: r.ulb_name,
    is_pre_monsoon: Boolean(r.is_pre_monsoon),
  };
}

/** CoS category: DB uses SCOPE_ADDITION → UI uses “SCOPE ADDITION” style */
export function normalizeCosCategory(cat) {
  if (!cat) return "";
  return String(cat).replace(/_/g, " ");
}

/** Timeline / flat CoS row for CoS / EoT tab */
export function mapCosTimelineRow(r) {
  const n = (x) => (x === null || x === undefined ? 0 : Number(x));
  return {
    project_id: n(r.project_id),
    project_code: r.project_code,
    project_name: r.project_name,
    cos_number: r.cos_number,
    cos_date: r.cos_date,
    cos_category: normalizeCosCategory(r.cos_category),
    cos_amount: n(r.cos_amount),
    cos_pct_variation: n(r.cos_pct_variation),
    is_time_linked: Boolean(r.is_time_linked),
    eot_number: r.eot_number ?? null,
    eot_days_granted: n(r.eot_days_granted),
    original_end_date: r.previous_end_date ?? r.original_end_date ?? null,
    new_end_date: r.new_end_date ?? r.eot_revised_date ?? null,
  };
}

export function buildProjVariation(cosRows) {
  const o = {};
  cosRows.forEach((d) => {
    const id = d.project_id;
    if (!o[id]) o[id] = 0;
    o[id] += Number(d.cos_amount ?? 0);
  });
  return o;
}
