-- ============================================================
-- BUIDCO — Dashboard KPI Views (CREATE OR REPLACE — idempotent)
-- ============================================================

-- Portfolio header cards
CREATE OR REPLACE VIEW v_portfolio_kpis AS
SELECT
  COUNT(*) FILTER (WHERE p.status NOT IN ('CANCELLED','COMPLETED'))          AS active_projects,
  COUNT(*) FILTER (WHERE p.delay_days > 30)                                  AS delayed_projects,
  ROUND(SUM(pc.current_sanctioned_cost) / 100, 2)                           AS total_sanctioned_cr,
  ROUND(SUM(pc.total_expenditure) / 100, 2)                                  AS total_spent_cr,
  ROUND(SUM(pc.total_expenditure) / NULLIF(SUM(pc.current_sanctioned_cost),0)*100,2) AS financial_utilisation_pct,
  COUNT(*) FILTER (WHERE p.delay_days > 0)                                   AS is_delayed_count,
  SUM(p.total_cos_count)                                                     AS total_cos_events,
  SUM(p.total_eot_days)                                                      AS total_eot_days_portfolio
FROM project p
LEFT JOIN project_cost pc ON pc.project_id = p.project_id;

-- ─────────────────────────────────────────────────────────────
-- Sector-level KPI cards
CREATE OR REPLACE VIEW v_sector_kpis AS
SELECT
  s.sector_id, s.sector_code, s.sector_name, s.sector_icon,
  COUNT(p.project_id)                                                         AS total_projects,
  ROUND(AVG(pr.actual_physical_pct), 2)                                      AS avg_physical_pct,
  ROUND(SUM(pc.current_sanctioned_cost), 2)                                  AS total_sanctioned_lakhs,
  ROUND(SUM(pc.total_expenditure) / NULLIF(SUM(pc.current_sanctioned_cost),0)*100,2) AS financial_utilisation_pct,
  COUNT(*) FILTER (WHERE p.delay_days > 30)                                  AS delayed_count,
  COUNT(*) FILTER (WHERE pf.flag_status = 'OPEN' AND pf.is_dc_flag = TRUE)  AS dc_flag_count
FROM sector s
LEFT JOIN project p      ON p.sector_id = s.sector_id
LEFT JOIN project_cost pc ON pc.project_id = p.project_id
LEFT JOIN progress pr    ON pr.project_id = p.project_id
  AND pr.snap_month = (SELECT MAX(snap_month) FROM progress WHERE project_id = p.project_id)
LEFT JOIN project_flag pf ON pf.project_id = p.project_id
GROUP BY s.sector_id, s.sector_code, s.sector_name, s.sector_icon;

-- ─────────────────────────────────────────────────────────────
-- Project-level KPI row (main dashboard list)
DROP VIEW IF EXISTS v_project_kpis CASCADE;
CREATE VIEW v_project_kpis AS
SELECT
  p.project_id,
  p.project_code,
  p.project_name,
  p.status,
  p.phase,
  GREATEST(0, CURRENT_DATE - COALESCE(p.revised_end_date, p.planned_end_date)) AS delay_days,
  p.planned_end_date,
  p.revised_end_date,
  p.total_cos_count,
  p.total_eot_days,
  p.agreement_number,
  p.agreement_date,
  p.appointed_date,
  p.latitude,
  p.longitude,
  p.chainage,
  p.dept_stuck,
  p.delay_reason,
  s.sector_code,
  s.sector_name,
  s.sector_icon,
  u.district_name              AS district,
  u.ulb_name,
  v.contractor_name,
  pc.current_sanctioned_cost,
  pc.total_expenditure,
  ROUND(pc.total_expenditure / NULLIF(pc.current_sanctioned_cost, 0) * 100, 2) AS financial_progress_pct,
  pc.contract_value_lakhs,
  pc.mobilization_advance_lakhs,
  pc.mobilization_advance_recovered_lakhs,
  pc.payments_made_lakhs,
  pc.last_payment_date,
  pc.last_ra_bill_no,
  pc.retention_money_lakhs,
  pr.actual_physical_pct,
  pr.scheduled_physical_pct,
  pr.physical_deviation,
  pr.physical_status,
  -- PBG
  pbg.bg_number                AS pbg_number,
  pbg.amount                   AS pbg_amount_lakhs,
  pbg.expiry_date              AS pbg_expiry_date,
  pbg.bank_name                AS pbg_bank,
  -- EMD
  emd.amount                   AS emd_amount_lakhs,
  emd.bg_number                AS emd_reference,
  emd.issue_date               AS emd_date,
  ROUND(
    COUNT(*) FILTER (WHERE qt.pass_fail = TRUE)::numeric
    / NULLIF(COUNT(qt.test_id),0) * 100, 1
  )                            AS qc_pass_rate_pct,
  MAX(cb.pending_days) FILTER (WHERE cb.payment_status <> 'PAID') AS max_bill_pending_days
FROM project p
LEFT JOIN sector s           ON s.sector_id = p.sector_id
LEFT JOIN ulb u              ON u.ulb_id = p.ulb_id
LEFT JOIN vendor v           ON v.vendor_id = p.contractor_id
LEFT JOIN project_cost pc    ON pc.project_id = p.project_id
LEFT JOIN progress pr        ON pr.project_id = p.project_id
  AND pr.snap_month = (SELECT MAX(snap_month) FROM progress WHERE project_id = p.project_id)
LEFT JOIN security_instrument pbg ON pbg.project_id = p.project_id
  AND pbg.instrument_type = 'PBG' AND pbg.is_encashed = FALSE
LEFT JOIN security_instrument emd ON emd.project_id = p.project_id
  AND emd.instrument_type = 'EMD'
LEFT JOIN quality_test qt    ON qt.project_id = p.project_id
LEFT JOIN contractor_bill cb ON cb.project_id = p.project_id
GROUP BY
  p.project_id, p.project_code, p.project_name, p.status, p.phase,
  p.planned_end_date, p.revised_end_date, p.total_cos_count, p.total_eot_days,
  p.agreement_number, p.agreement_date, p.appointed_date,
  p.latitude, p.longitude, p.chainage, p.dept_stuck, p.delay_reason,
  s.sector_code, s.sector_name, s.sector_icon, u.district_name, u.ulb_name,
  v.contractor_name, pc.current_sanctioned_cost, pc.total_expenditure,
  pc.contract_value_lakhs,
  pc.mobilization_advance_lakhs, pc.mobilization_advance_recovered_lakhs,
  pc.payments_made_lakhs, pc.last_payment_date, pc.last_ra_bill_no,
  pc.retention_money_lakhs,
  pr.actual_physical_pct, pr.scheduled_physical_pct, pr.physical_deviation, pr.physical_status,
  pbg.bg_number, pbg.amount, pbg.expiry_date, pbg.bank_name,
  emd.amount, emd.bg_number, emd.issue_date;

-- ─────────────────────────────────────────────────────────────
-- CoS + EoT timeline (project detail drilldown)
DROP VIEW IF EXISTS v_project_cos_eot_timeline CASCADE;
CREATE VIEW v_project_cos_eot_timeline AS
SELECT
  p.project_id, p.project_code, p.project_name,
  p.planned_end_date  AS original_end_date,
  p.revised_end_date  AS current_end_date,
  p.total_eot_days,
  p.total_cos_count,
  cos.cos_id, cos.cos_number, cos.cos_date, cos.cos_category,
  cos.cos_amount,
  COALESCE(cos.cos_pct_variation,
    ROUND(cos.cos_amount / NULLIF(cos.cost_before_cos, 0) * 100, 2)) AS cos_pct_variation,
  COALESCE(cos.cost_after_cos,
    cos.cost_before_cos + cos.cos_amount)                             AS cost_after_cos,
  cos.is_time_linked,
  eot.eot_id, eot.eot_number, eot.eot_category,
  eot.eot_days_granted, eot.revised_end_date  AS eot_revised_date,
  rdl.revision_number, rdl.previous_end_date, rdl.new_end_date,
  rdl.days_extended, rdl.is_current
FROM project p
LEFT JOIN change_of_scope cos   ON cos.project_id = p.project_id
LEFT JOIN extension_of_time eot ON eot.cos_id = cos.cos_id
LEFT JOIN revised_date_log rdl  ON rdl.eot_id = eot.eot_id
ORDER BY p.project_id, cos.cos_date, eot.eot_approval_date;

-- ─────────────────────────────────────────────────────────────
-- DC Action panel
CREATE OR REPLACE VIEW v_dc_action_panel AS
SELECT
  pf.flag_id, pf.severity, pf.days_open, pf.flag_category,
  pf.flag_description, pf.action_required,
  pf.responsible_dept, pf.responsible_officer, pf.contact_phone,
  pf.deadline_date, pf.is_pre_monsoon,
  p.project_code, p.project_name,
  GREATEST(0, CURRENT_DATE - COALESCE(p.revised_end_date, p.planned_end_date)) AS delay_days,
  s.sector_name, u.ulb_name
FROM project_flag pf
JOIN project p     ON p.project_id = pf.project_id
LEFT JOIN sector s ON s.sector_id = p.sector_id
LEFT JOIN ulb u    ON u.ulb_id = p.ulb_id
WHERE pf.flag_status IN ('OPEN','IN_PROGRESS','ESCALATED')
  AND pf.is_dc_flag = TRUE
ORDER BY
  CASE pf.severity WHEN 'CRITICAL' THEN 1 WHEN 'HIGH' THEN 2 WHEN 'MEDIUM' THEN 3 ELSE 4 END,
  pf.days_open DESC;

-- ─────────────────────────────────────────────────────────────
-- Open flags (all, not just DC flags)
CREATE OR REPLACE VIEW v_open_flags AS
SELECT
  pf.flag_id, pf.severity, pf.days_open, pf.flag_category,
  pf.flag_description, pf.action_required,
  pf.responsible_dept, pf.is_pre_monsoon,
  p.project_code, p.project_name,
  s.sector_name, u.ulb_name
FROM project_flag pf
JOIN project p     ON p.project_id = pf.project_id
LEFT JOIN sector s ON s.sector_id = p.sector_id
LEFT JOIN ulb u    ON u.ulb_id = p.ulb_id
WHERE pf.flag_status IN ('OPEN','IN_PROGRESS','ESCALATED')
ORDER BY
  CASE pf.severity WHEN 'CRITICAL' THEN 1 WHEN 'HIGH' THEN 2 WHEN 'MEDIUM' THEN 3 ELSE 4 END,
  pf.days_open DESC;

-- ─────────────────────────────────────────────────────────────
-- Status breakdown (for Projects tab filter)
CREATE OR REPLACE VIEW v_status_breakdown AS
SELECT status, COUNT(*) AS project_count
FROM project
GROUP BY status;

-- ─────────────────────────────────────────────────────────────
-- BG / Security expiry alerts
CREATE OR REPLACE VIEW v_bg_expiry_alerts AS
SELECT
  si.instrument_id, si.instrument_type, si.bg_number, si.bank_name,
  si.amount, si.expiry_date,
  (si.expiry_date - CURRENT_DATE)            AS days_to_expiry,
  CASE
    WHEN si.expiry_date < CURRENT_DATE THEN 'EXPIRED — ACT NOW'
    WHEN si.expiry_date - CURRENT_DATE <= 30 THEN 'RENEW NOW'
    ELSE 'OK'
  END                                         AS expiry_alert,
  p.project_code, p.project_name, v.contractor_name
FROM security_instrument si
LEFT JOIN project p ON p.project_id = si.project_id
LEFT JOIN vendor v  ON v.vendor_id = si.vendor_id
WHERE si.is_encashed = FALSE
  AND (si.expiry_date - CURRENT_DATE) <= 30
ORDER BY si.expiry_date;
