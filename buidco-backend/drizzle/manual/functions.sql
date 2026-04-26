-- ============================================================
-- BUIDCO — Manual SQL Functions (CREATE OR REPLACE — idempotent)
-- ============================================================

CREATE OR REPLACE FUNCTION fn_sync_revised_end_date()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE revised_date_log
     SET is_current = FALSE
   WHERE project_id = NEW.project_id
     AND revision_id <> NEW.revision_id;

  UPDATE project
     SET revised_end_date = NEW.new_end_date,
         updated_at       = NOW()
   WHERE project_id = NEW.project_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION fn_set_revision_number()
RETURNS TRIGGER AS $$
BEGIN
  SELECT COALESCE(MAX(revision_number), 0) + 1
    INTO NEW.revision_number
    FROM revised_date_log
   WHERE project_id = NEW.project_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION fn_eot_creates_date_log()
RETURNS TRIGGER AS $$
DECLARE
  v_prev_date DATE;
BEGIN
  SELECT COALESCE(revised_end_date, planned_end_date)
    INTO v_prev_date
    FROM project
   WHERE project_id = NEW.project_id;

  INSERT INTO revised_date_log (
    project_id, eot_id, previous_end_date, new_end_date,
    revision_reason, revision_date, approval_authority,
    approval_order_no, is_current
  ) VALUES (
    NEW.project_id, NEW.eot_id, v_prev_date,
    -- Compute revised end date: date_from + eot_days_granted (works even if revised_end_date column is NULL)
    COALESCE(NEW.revised_end_date, NEW.date_from + NEW.eot_days_granted),
    'EoT_GRANTED', NEW.eot_approval_date, NEW.approval_authority,
    NEW.approval_order_no, TRUE
  );

  UPDATE project
     SET total_eot_days = (
           SELECT COALESCE(SUM(eot_days_granted), 0)
             FROM extension_of_time
            WHERE project_id = NEW.project_id
         ),
         updated_at = NOW()
   WHERE project_id = NEW.project_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION fn_cos_updates_cost()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE project_cost
     SET current_sanctioned_cost = NEW.cost_after_cos,
         updated_at = NOW()
   WHERE project_id = NEW.project_id;

  UPDATE project
     SET total_cos_count = (
           SELECT COUNT(*) FROM change_of_scope WHERE project_id = NEW.project_id
         ),
         updated_at = NOW()
   WHERE project_id = NEW.project_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION fn_weighted_contribution()
RETURNS TRIGGER AS $$
DECLARE
  v_weight NUMERIC(5,2);
BEGIN
  SELECT weight_pct INTO v_weight
    FROM project_milestone
   WHERE milestone_id = NEW.milestone_id;

  NEW.weighted_contribution := ROUND(NEW.progress_pct * v_weight / 100, 3);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION fn_audit_project_changes()
RETURNS TRIGGER AS $$
DECLARE col TEXT; old_val TEXT; new_val TEXT;
BEGIN
  FOREACH col IN ARRAY ARRAY['project_name','status','phase',
    'planned_end_date','revised_end_date','contractor_id','dept_stuck','delay_reason']
  LOOP
    EXECUTE format('SELECT ($1).%I::TEXT', col) USING OLD INTO old_val;
    EXECUTE format('SELECT ($1).%I::TEXT', col) USING NEW INTO new_val;
    IF old_val IS DISTINCT FROM new_val THEN
      INSERT INTO project_audit_log(project_id, field_name, old_value, new_value, change_type)
      VALUES (NEW.project_id, col, old_val, new_val, 'UPDATE');
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION fmt_lakh(v NUMERIC)
RETURNS TEXT AS $$
SELECT '₹ ' || TO_CHAR(v, 'FM99,99,99,99,990.00') || ' L';
$$ LANGUAGE SQL IMMUTABLE;

CREATE OR REPLACE FUNCTION fmt_cr(v NUMERIC)
RETURNS TEXT AS $$
SELECT '₹ ' || TO_CHAR(v/100, 'FM9,99,990.0') || ' Cr';
$$ LANGUAGE SQL IMMUTABLE;
