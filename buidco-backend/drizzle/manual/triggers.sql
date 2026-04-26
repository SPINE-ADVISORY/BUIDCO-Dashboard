-- ============================================================
-- BUIDCO — Triggers (DROP IF EXISTS + CREATE — idempotent)
-- ============================================================

-- 1. Revised Date Log → sync project.revised_end_date
DROP TRIGGER IF EXISTS trg_revised_date_sync ON revised_date_log;
CREATE TRIGGER trg_revised_date_sync
AFTER INSERT ON revised_date_log
FOR EACH ROW
WHEN (NEW.is_current = TRUE)
EXECUTE FUNCTION fn_sync_revised_end_date();

-- 2. Revised Date Log — auto-set revision_number
DROP TRIGGER IF EXISTS trg_revision_number ON revised_date_log;
CREATE TRIGGER trg_revision_number
BEFORE INSERT ON revised_date_log
FOR EACH ROW EXECUTE FUNCTION fn_set_revision_number();

-- 3. EoT → auto-create revised_date_log entry
DROP TRIGGER IF EXISTS trg_eot_auto_date_log ON extension_of_time;
CREATE TRIGGER trg_eot_auto_date_log
AFTER INSERT ON extension_of_time
FOR EACH ROW EXECUTE FUNCTION fn_eot_creates_date_log();

-- 4. CoS → update project_cost.current_sanctioned_cost + project.total_cos_count
DROP TRIGGER IF EXISTS trg_cos_updates_cost ON change_of_scope;
CREATE TRIGGER trg_cos_updates_cost
AFTER INSERT OR UPDATE ON change_of_scope
FOR EACH ROW EXECUTE FUNCTION fn_cos_updates_cost();

-- 5. Milestone Progress → compute weighted_contribution
DROP TRIGGER IF EXISTS trg_milestone_weighted ON milestone_progress;
CREATE TRIGGER trg_milestone_weighted
BEFORE INSERT OR UPDATE ON milestone_progress
FOR EACH ROW EXECUTE FUNCTION fn_weighted_contribution();

-- 6. Audit log on project updates
DROP TRIGGER IF EXISTS trg_audit_project ON project;
CREATE TRIGGER trg_audit_project
AFTER UPDATE ON project
FOR EACH ROW EXECUTE FUNCTION fn_audit_project_changes();
