-- ============================================================
-- BUIDCO — Row Level Security Policies
-- DROP before recreate (policies cannot be OR REPLACED)
-- ============================================================

ALTER TABLE project ENABLE ROW LEVEL SECURITY;

-- MD, DC, FINANCE, READ_ONLY → see all rows
DROP POLICY IF EXISTS project_md_dc ON project;
CREATE POLICY project_md_dc ON project
  FOR ALL TO PUBLIC
  USING (
    current_setting('app.role', TRUE) IN ('MD','DC','FINANCE','READ_ONLY')
  );

-- PMU_ENGINEER → sees only their assigned ULBs
DROP POLICY IF EXISTS project_pmu ON project;
CREATE POLICY project_pmu ON project
  FOR ALL TO PUBLIC
  USING (
    current_setting('app.role', TRUE) = 'PMU_ENGINEER'
    AND ulb_id = ANY(
      SELECT unnest(string_to_array(
        (SELECT ulb_scope FROM app_user WHERE user_id = current_setting('app.user_id', TRUE)::INT),
        ','
      ))::INT
    )
  );

-- Helper view: project with role-aware edit flag
CREATE OR REPLACE VIEW v_project_with_permissions AS
SELECT
  p.*,
  CASE
    WHEN current_setting('app.role', TRUE) IN ('MD','PMU_ENGINEER') THEN TRUE
    ELSE FALSE
  END AS can_edit,
  CASE
    WHEN current_setting('app.role', TRUE) = 'MD' THEN TRUE
    ELSE FALSE
  END AS can_add
FROM project p;
