-- ============================================================
-- BUIDCO PROJECT MONITORING SYSTEM — PostgreSQL Schema v2
-- Includes: CoS, EoT, Revised Date Log, all triggers & views
-- Run order: execute this file top-to-bottom in one shot
-- ============================================================

-- ── EXTENSIONS ──────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── DROP (for re-runs in dev) ────────────────────────────────
DROP TABLE IF EXISTS
  revised_date_log, extension_of_time, change_of_scope,
  project_flag, quality_test, clearance_noc,
  security_instrument, contractor_bill, fund_release,
  milestone_progress, project_milestone, progress,
  project_cost, project,
  app_user, department, funding_scheme, ulb, sector, vendor
CASCADE;

-- ============================================================
-- LOOKUP / MASTER TABLES
-- ============================================================

CREATE TABLE sector (
  sector_id     SERIAL PRIMARY KEY,
  sector_code   VARCHAR(20) UNIQUE NOT NULL,
  sector_name   VARCHAR(100) NOT NULL,
  sector_icon   VARCHAR(5),
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);

CREATE TABLE ulb (
  ulb_id           SERIAL PRIMARY KEY,
  ulb_code         VARCHAR(10) UNIQUE NOT NULL,
  ulb_name         VARCHAR(120) NOT NULL,
  ulb_type         VARCHAR(30) CHECK (ulb_type IN ('Nagar_Nigam','Nagar_Parishad','Nagar_Panchayat')),
  district_name    VARCHAR(80) NOT NULL,
  district_code    VARCHAR(10),
  division         VARCHAR(80),
  population_lakh  NUMERIC(6,2),
  created_at       TIMESTAMP DEFAULT NOW(),
  updated_at       TIMESTAMP DEFAULT NOW()
);

CREATE TABLE vendor (
  vendor_id          SERIAL PRIMARY KEY,
  vendor_code        VARCHAR(20) UNIQUE,
  vendor_type        VARCHAR(20) CHECK (vendor_type IN ('CONTRACTOR','CONSULTANT','OM_AGENCY')),
  contractor_name    VARCHAR(200) NOT NULL,
  company_name       VARCHAR(200),
  pan                VARCHAR(10),
  gstin              VARCHAR(15),
  phone_number       VARCHAR(15) NOT NULL,
  email_id           VARCHAR(100),
  is_blacklisted     BOOLEAN DEFAULT FALSE,
  blacklist_reason   TEXT,
  performance_rating INT CHECK (performance_rating BETWEEN 1 AND 5),
  created_at         TIMESTAMP DEFAULT NOW(),
  updated_at         TIMESTAMP DEFAULT NOW()
);

CREATE TABLE funding_scheme (
  scheme_id      SERIAL PRIMARY KEY,
  scheme_code    VARCHAR(20) UNIQUE NOT NULL,
  scheme_name    VARCHAR(200) NOT NULL,
  fund_source    VARCHAR(30) CHECK (fund_source IN (
                   'AMRUT','STATE_BUDGET','JNNURM','SMART_CITY',
                   'ADB','WORLD_BANK','HUDCO','PPP_VGF')),
  nodal_ministry VARCHAR(150),
  start_fy       VARCHAR(7),
  end_fy         VARCHAR(7),
  is_active      BOOLEAN DEFAULT TRUE
);

CREATE TABLE department (
  dept_id        SERIAL PRIMARY KEY,
  dept_code      VARCHAR(20) UNIQUE NOT NULL,
  dept_name      VARCHAR(150) NOT NULL,
  dept_type      VARCHAR(30) CHECK (dept_type IN (
                   'STATE_DEPT','UTILITY','ULB','CENTRAL','RAILWAYS')),
  nodal_officer  VARCHAR(120),
  contact_phone  VARCHAR(15),
  contact_email  VARCHAR(100)
);

CREATE TABLE app_user (
  user_id      SERIAL PRIMARY KEY,
  username     VARCHAR(80) UNIQUE NOT NULL,
  full_name    VARCHAR(150) NOT NULL,
  designation  VARCHAR(100),
  role         VARCHAR(20) CHECK (role IN ('MD','DC','PMU_ENGINEER','FINANCE','READ_ONLY')),
  ulb_scope    TEXT,    -- comma-separated ulb_ids; NULL = all
  sector_scope TEXT,    -- comma-separated sector_ids; NULL = all
  email        VARCHAR(120),
  phone        VARCHAR(15),
  is_active    BOOLEAN DEFAULT TRUE,
  last_login   TIMESTAMP
);

-- ============================================================
-- CORE TABLES
-- ============================================================

CREATE TABLE project (
  project_id              SERIAL PRIMARY KEY,
  project_code            VARCHAR(30) UNIQUE NOT NULL,
  project_name            VARCHAR(300) NOT NULL,
  sector_id               INT REFERENCES sector(sector_id),
  ulb_id                  INT REFERENCES ulb(ulb_id),
  district_id             INT,  -- derived from ulb_id via app logic
  scheme_id               INT REFERENCES funding_scheme(scheme_id),
  procurement_mode        VARCHAR(10) CHECK (procurement_mode IN ('HAM','BOT','EPC','TOT')),
  contractor_id           INT REFERENCES vendor(vendor_id),
  consultant_id           INT REFERENCES vendor(vendor_id),
  status                  VARCHAR(20) CHECK (status IN (
                            'DPR_STAGE','TENDERING','AWARDED','IN_PROGRESS',
                            'STALLED','COMPLETED','HANDED_OVER','CANCELLED')),
  scheduled_start_date    DATE NOT NULL,
  actual_start_date       DATE,
  planned_end_date        DATE NOT NULL,
  revised_end_date        DATE,   -- auto-maintained by trigger from revised_date_log
  actual_end_date         DATE,
  -- CoS / EoT summary fields (maintained by triggers)
  total_cos_count         INT DEFAULT 0,
  total_eot_days          INT DEFAULT 0,
  -- Computed KPIs (updated by triggers / nightly job)
  delay_days              INT DEFAULT 0,  -- maintained by trigger
  is_delayed              BOOLEAN DEFAULT FALSE,  -- maintained by trigger
  dc_attention_flag       BOOLEAN DEFAULT FALSE,
  status_on_commencement  VARCHAR(50),
  created_at              TIMESTAMP DEFAULT NOW(),
  updated_at              TIMESTAMP DEFAULT NOW()
);

CREATE TABLE project_cost (
  cost_id                SERIAL PRIMARY KEY,
  project_id             INT UNIQUE REFERENCES project(project_id),
  sanctioned_cost        NUMERIC(14,2) NOT NULL,
  revised_cost_1         NUMERIC(14,2),
  revised_cost_1_date    DATE,
  revised_cost_1_reason  VARCHAR(200),
  revised_cost_2         NUMERIC(14,2),
  revised_cost_2_date    DATE,
  -- current_sanctioned_cost = latest CoS total (maintained by trigger)
  current_sanctioned_cost NUMERIC(14,2),
  total_expenditure       NUMERIC(14,2) DEFAULT 0,
  financial_progress_pct  NUMERIC(5,2) GENERATED ALWAYS AS (
                             CASE WHEN current_sanctioned_cost > 0
                             THEN ROUND(total_expenditure / current_sanctioned_cost * 100, 2)
                             ELSE 0 END
                           ) STORED,
  balance_to_spend        NUMERIC(14,2) GENERATED ALWAYS AS (
                             COALESCE(current_sanctioned_cost, sanctioned_cost) - COALESCE(total_expenditure,0)
                           ) STORED,
  created_at              TIMESTAMP DEFAULT NOW(),
  updated_at              TIMESTAMP DEFAULT NOW()
);

CREATE TABLE project_milestone (
  milestone_id   SERIAL PRIMARY KEY,
  project_id     INT REFERENCES project(project_id),
  milestone_name VARCHAR(200) NOT NULL,
  weight_pct     NUMERIC(5,2) NOT NULL CHECK (weight_pct > 0 AND weight_pct <= 100),
  appointed_date DATE,
  planned_date   DATE NOT NULL,
  actual_date    DATE,
  milestone_delay_days INT DEFAULT 0,  -- maintained by trigger
  created_at     TIMESTAMP DEFAULT NOW(),
  updated_at     TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- ★ TABLE 18 — CHANGE OF SCOPE (CoS)
-- ============================================================

CREATE TABLE change_of_scope (
  cos_id             SERIAL PRIMARY KEY,
  project_id         INT NOT NULL REFERENCES project(project_id),
  cos_number         VARCHAR(20) NOT NULL,   -- e.g. CoS-01
  cos_date           DATE NOT NULL,
  cos_category       VARCHAR(50) NOT NULL CHECK (cos_category IN (
                       'SCOPE_ADDITION','SCOPE_REDUCTION',
                       'DESIGN_CHANGE','QUANTITY_VARIATION','EXTRA_ITEM')),
  cos_description    TEXT NOT NULL,
  cost_before_cos    NUMERIC(14,2) NOT NULL,
  cos_amount         NUMERIC(14,2) NOT NULL,  -- positive=addition, negative=reduction
  cost_after_cos     NUMERIC(14,2) GENERATED ALWAYS AS (cost_before_cos + cos_amount) STORED,
  cos_pct_variation  NUMERIC(6,2)  GENERATED ALWAYS AS (
                       CASE WHEN cost_before_cos > 0
                       THEN ROUND((cos_amount / cost_before_cos) * 100, 2)
                       ELSE 0 END
                     ) STORED,
  approval_authority VARCHAR(100) NOT NULL,
  approval_order_no  VARCHAR(80) NOT NULL,
  is_time_linked     BOOLEAN DEFAULT FALSE,  -- TRUE if this CoS also needs an EoT
  remarks            TEXT,
  created_at         TIMESTAMP DEFAULT NOW(),
  updated_at         TIMESTAMP DEFAULT NOW(),
  UNIQUE (project_id, cos_number)
);

-- ============================================================
-- ★ TABLE 19 — EXTENSION OF TIME (EoT)
-- ============================================================

CREATE TABLE extension_of_time (
  eot_id             SERIAL PRIMARY KEY,
  project_id         INT NOT NULL REFERENCES project(project_id),
  cos_id             INT REFERENCES change_of_scope(cos_id),   -- FK → CoS if scope-driven
  clearance_id       INT,                                        -- FK → clearance_noc (added below)
  eot_number         VARCHAR(20) NOT NULL,   -- e.g. EoT-01
  eot_category       VARCHAR(50) NOT NULL CHECK (eot_category IN (
                       'SCOPE_CHANGE','FORCE_MAJEURE','UTILITY_NOC','LAND_ISSUE',
                       'DESIGN_CHANGE','COURT_STAY','FUNDING','SEASONAL','OTHER')),
  eot_reason         TEXT NOT NULL,
  eot_days_sought    INT NOT NULL,
  eot_days_granted   INT NOT NULL,
  date_from          DATE NOT NULL,  -- extension starts from here
  revised_end_date   DATE GENERATED ALWAYS AS (date_from + eot_days_granted) STORED,
  approval_authority VARCHAR(100) NOT NULL,
  approval_order_no  VARCHAR(80) NOT NULL,
  eot_approval_date  DATE NOT NULL,
  is_final           BOOLEAN DEFAULT FALSE,
  remarks            TEXT,
  created_at         TIMESTAMP DEFAULT NOW(),
  updated_at         TIMESTAMP DEFAULT NOW(),
  UNIQUE (project_id, eot_number)
);

-- ============================================================
-- ★ TABLE 20 — REVISED DATE LOG (Single source of truth)
-- ============================================================

CREATE TABLE revised_date_log (
  revision_id        SERIAL PRIMARY KEY,
  project_id         INT NOT NULL REFERENCES project(project_id),
  revision_number    INT NOT NULL,   -- auto-set by trigger
  eot_id             INT REFERENCES extension_of_time(eot_id),
  cos_id             INT REFERENCES change_of_scope(cos_id),
  previous_end_date  DATE NOT NULL,
  new_end_date       DATE NOT NULL,
  days_extended      INT GENERATED ALWAYS AS (new_end_date - previous_end_date) STORED,
  revision_reason    VARCHAR(50) CHECK (revision_reason IN (
                       'EoT_GRANTED','CoS_APPROVED','FORCE_MAJEURE',
                       'COURT_ORDER','FUNDING_DELAY','OTHER')),
  revision_date      DATE NOT NULL,
  approval_authority VARCHAR(100) NOT NULL,
  approval_order_no  VARCHAR(80) NOT NULL,
  is_current         BOOLEAN DEFAULT FALSE,  -- only one row per project = TRUE
  remarks            TEXT,
  created_at         TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- FINANCIAL TABLES
-- ============================================================

CREATE TABLE fund_release (
  release_id          SERIAL PRIMARY KEY,
  project_id          INT REFERENCES project(project_id),
  release_date        DATE NOT NULL,
  release_level       VARCHAR(20) CHECK (release_level IN (
                        'GOI_TO_STATE','STATE_TO_BUIDCO','BUIDCO_TO_ULB')),
  release_amount      NUMERIC(14,2) NOT NULL,
  uc_submitted        BOOLEAN DEFAULT FALSE,
  uc_date             DATE,
  uc_pending_days     INT GENERATED ALWAYS AS (
                        CASE WHEN uc_submitted = FALSE
                        THEN CURRENT_DATE - release_date
                        ELSE 0 END
                      ) STORED,
  remarks             TEXT
);

CREATE TABLE contractor_bill (
  bill_id           SERIAL PRIMARY KEY,
  project_id        INT REFERENCES project(project_id),
  vendor_id         INT REFERENCES vendor(vendor_id),
  bill_no           VARCHAR(50) NOT NULL,
  bill_date         DATE NOT NULL,
  bill_type         VARCHAR(20) CHECK (bill_type IN (
                      'RA_BILL','FINAL_BILL','MOBILISATION','SECURED_ADVANCE')),
  gross_amount      NUMERIC(14,2) NOT NULL,
  deductions        NUMERIC(14,2) DEFAULT 0,
  net_payable       NUMERIC(14,2) GENERATED ALWAYS AS (gross_amount - deductions) STORED,
  payment_status    VARCHAR(20) CHECK (payment_status IN (
                      'PENDING','SUBMITTED','UNDER_REVIEW','APPROVED','PAID','REJECTED')),
  approved_date     DATE,
  payment_date      DATE,
  pending_days      INT GENERATED ALWAYS AS (
                      CASE WHEN payment_status NOT IN ('PAID','REJECTED')
                      THEN CURRENT_DATE - bill_date
                      ELSE 0 END
                    ) STORED,
  escalation_flag   BOOLEAN GENERATED ALWAYS AS (
                      CASE WHEN payment_status NOT IN ('PAID','REJECTED')
                           AND (CURRENT_DATE - bill_date) > 60
                      THEN TRUE ELSE FALSE END
                    ) STORED,
  remarks           TEXT
);

CREATE TABLE security_instrument (
  instrument_id   SERIAL PRIMARY KEY,
  project_id      INT REFERENCES project(project_id),
  vendor_id       INT REFERENCES vendor(vendor_id),
  instrument_type VARCHAR(20) CHECK (instrument_type IN ('EMD','PBG','SD','RETENTION')),
  bank_name       VARCHAR(100),
  bg_number       VARCHAR(80),
  amount          NUMERIC(14,2) NOT NULL,
  issue_date      DATE NOT NULL,
  expiry_date     DATE NOT NULL,
  days_to_expiry  INT GENERATED ALWAYS AS (expiry_date - CURRENT_DATE) STORED,
  expiry_alert    VARCHAR(30) GENERATED ALWAYS AS (
                    CASE WHEN expiry_date < CURRENT_DATE THEN 'EXPIRED — ACT NOW'
                         WHEN expiry_date - CURRENT_DATE <= 30 THEN 'RENEW NOW'
                         ELSE 'OK'
                    END
                  ) STORED,
  is_extended     BOOLEAN DEFAULT FALSE,
  is_encashed     BOOLEAN DEFAULT FALSE,
  remarks         TEXT
);

-- ============================================================
-- OPERATIONS TABLES
-- ============================================================

CREATE TABLE clearance_noc (
  clearance_id       SERIAL PRIMARY KEY,
  project_id         INT REFERENCES project(project_id),
  clearance_type     VARCHAR(80) NOT NULL,
  dept_responsible   VARCHAR(100) NOT NULL,
  responsible_officer VARCHAR(120),
  contact_phone      VARCHAR(15),
  applied_date       DATE,
  status             VARCHAR(20) CHECK (status IN (
                       'NOT_REQUIRED','PENDING','APPLIED','RECEIVED','REFUSED')),
  received_date      DATE,
  pending_days       INT GENERATED ALWAYS AS (
                       CASE WHEN status IN ('NOT_REQUIRED','RECEIVED') THEN 0
                       ELSE CURRENT_DATE - COALESCE(applied_date, CURRENT_DATE)
                       END
                     ) STORED,
  is_blocking_work   BOOLEAN DEFAULT TRUE,
  dc_escalation_needed BOOLEAN GENERATED ALWAYS AS (
                       CASE WHEN status NOT IN ('NOT_REQUIRED','RECEIVED')
                            AND (CURRENT_DATE - COALESCE(applied_date, CURRENT_DATE)) > 15
                            AND is_blocking_work = TRUE
                       THEN TRUE ELSE FALSE END
                     ) STORED,
  remarks            TEXT
);

-- Add FK from eot back to clearance now that table exists
ALTER TABLE extension_of_time
  ADD CONSTRAINT fk_eot_clearance
  FOREIGN KEY (clearance_id) REFERENCES clearance_noc(clearance_id);

CREATE TABLE quality_test (
  test_id         SERIAL PRIMARY KEY,
  project_id      INT REFERENCES project(project_id),
  test_date       DATE NOT NULL,
  component_name  VARCHAR(150) NOT NULL,
  test_type       VARCHAR(80) NOT NULL,
  specification   VARCHAR(100),
  actual_value    VARCHAR(80),
  lab_name        VARCHAR(150),
  result          VARCHAR(15) CHECK (result IN ('PASS','FAIL','CONDITIONAL')),
  pass_fail       BOOLEAN GENERATED ALWAYS AS (
                    CASE WHEN result = 'PASS' THEN TRUE ELSE FALSE END
                  ) STORED,
  remarks         TEXT
);

CREATE TABLE project_flag (
  flag_id             SERIAL PRIMARY KEY,
  project_id          INT REFERENCES project(project_id),
  flag_date           DATE NOT NULL DEFAULT CURRENT_DATE,
  severity            VARCHAR(10) CHECK (severity IN ('LOW','MEDIUM','HIGH','CRITICAL')),
  flag_status         VARCHAR(15) CHECK (flag_status IN ('OPEN','IN_PROGRESS','ESCALATED','RESOLVED')),
  flag_category       VARCHAR(80) CHECK (flag_category IN (
                        'Contractor_Default','NOC_Delay','Budget_Shortfall','Legal_Stay',
                        'Land_Issue','Bill_Pendency','BG_Expiry','DPR_Delay','CoS_Pending','EoT_Overdue')),
  flag_description    TEXT NOT NULL,
  action_required     TEXT NOT NULL,
  responsible_dept    VARCHAR(100) NOT NULL,
  responsible_officer VARCHAR(120),
  contact_phone       VARCHAR(15),
  deadline_date       DATE,
  days_open           INT GENERATED ALWAYS AS (CURRENT_DATE - flag_date) STORED,
  is_dc_flag          BOOLEAN DEFAULT FALSE,
  is_md_flag          BOOLEAN DEFAULT FALSE,
  resolved_date       DATE,
  resolved_by         VARCHAR(80),
  resolution_notes    TEXT,
  created_by          VARCHAR(80) NOT NULL,
  created_at          TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- PROGRESS TABLES
-- ============================================================

CREATE TABLE progress (
  progress_id                    SERIAL PRIMARY KEY,
  project_id                     INT REFERENCES project(project_id),
  snap_month                     DATE NOT NULL,   -- first day of reporting month
  payments_released_goi_state    NUMERIC(14,2),
  payments_released_to_contractor NUMERIC(14,2),
  scheduled_financial_pct        NUMERIC(5,2) NOT NULL,
  actual_financial_pct           NUMERIC(5,2),   -- computed from project_cost
  scheduled_physical_pct         NUMERIC(5,2) NOT NULL,
  actual_physical_pct            NUMERIC(5,2),   -- computed from milestone_progress
  physical_deviation             NUMERIC(5,2) GENERATED ALWAYS AS (
                                   actual_physical_pct - scheduled_physical_pct
                                 ) STORED,
  financial_deviation            NUMERIC(5,2) GENERATED ALWAYS AS (
                                   actual_financial_pct - scheduled_financial_pct
                                 ) STORED,
  payment_status                 VARCHAR(20) CHECK (payment_status IN (
                                   'PENDING','SUBMITTED','UNDER_REVIEW','APPROVED','PAID')),
  physical_status                VARCHAR(20) GENERATED ALWAYS AS (
                                   CASE
                                     WHEN actual_physical_pct - scheduled_physical_pct < -10 THEN 'CRITICAL_BEHIND'
                                     WHEN actual_physical_pct - scheduled_physical_pct < 0   THEN 'BEHIND'
                                     WHEN actual_physical_pct - scheduled_physical_pct = 0   THEN 'ON_TRACK'
                                     ELSE 'AHEAD'
                                   END
                                 ) STORED,
  delay_reason                   VARCHAR(50) CHECK (delay_reason IN (
                                   'LAND','UTILITY_NOC','CONTRACTOR_DEFAULT','COURT_STAY',
                                   'FUNDING','DESIGN_CHANGE','SEASONAL','OTHER')),
  delay_details                  TEXT,
  work_done_this_month           TEXT,
  submitted_by                   VARCHAR(80) NOT NULL,
  created_at                     TIMESTAMP DEFAULT NOW(),
  updated_at                     TIMESTAMP DEFAULT NOW(),
  UNIQUE (project_id, snap_month)
);

CREATE TABLE milestone_progress (
  mp_id                 SERIAL PRIMARY KEY,
  milestone_id          INT REFERENCES project_milestone(milestone_id),
  project_id            INT REFERENCES project(project_id),
  snap_month            DATE NOT NULL,
  progress_pct          NUMERIC(5,2) NOT NULL CHECK (progress_pct BETWEEN 0 AND 100),
  weighted_contribution NUMERIC(6,3),  -- populated by trigger: progress_pct × weight_pct / 100
  created_at            TIMESTAMP DEFAULT NOW(),
  UNIQUE (milestone_id, snap_month)
);

-- ============================================================
-- TRIGGERS
-- ============================================================

-- 1. Revised Date Log → sync project.revised_end_date
CREATE OR REPLACE FUNCTION fn_sync_revised_end_date()
RETURNS TRIGGER AS $$
BEGIN
  -- Only one row per project can be current
  UPDATE revised_date_log
     SET is_current = FALSE
   WHERE project_id = NEW.project_id
     AND revision_id <> NEW.revision_id;

  -- Push the new date to project table
  UPDATE project
     SET revised_end_date = NEW.new_end_date,
         updated_at       = NOW()
   WHERE project_id = NEW.project_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_revised_date_sync
AFTER INSERT ON revised_date_log
FOR EACH ROW
WHEN (NEW.is_current = TRUE)
EXECUTE FUNCTION fn_sync_revised_end_date();

-- 2. Revised Date Log — auto-set revision_number
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

CREATE TRIGGER trg_revision_number
BEFORE INSERT ON revised_date_log
FOR EACH ROW EXECUTE FUNCTION fn_set_revision_number();

-- 3. EoT → auto-create revised_date_log entry
CREATE OR REPLACE FUNCTION fn_eot_creates_date_log()
RETURNS TRIGGER AS $$
DECLARE
  v_prev_date DATE;
BEGIN
  -- Get current revised_end_date (or planned_end_date if first EoT)
  SELECT COALESCE(revised_end_date, planned_end_date)
    INTO v_prev_date
    FROM project
   WHERE project_id = NEW.project_id;

  -- Insert the date revision record
  INSERT INTO revised_date_log (
    project_id, eot_id, previous_end_date, new_end_date,
    revision_reason, revision_date, approval_authority,
    approval_order_no, is_current
  ) VALUES (
    NEW.project_id, NEW.eot_id, v_prev_date, NEW.revised_end_date,
    'EoT_GRANTED', NEW.eot_approval_date, NEW.approval_authority,
    NEW.approval_order_no, TRUE
  );

  -- Update project.total_eot_days
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

CREATE TRIGGER trg_eot_auto_date_log
AFTER INSERT ON extension_of_time
FOR EACH ROW EXECUTE FUNCTION fn_eot_creates_date_log();

-- 4. CoS → update project_cost.current_sanctioned_cost + project.total_cos_count
CREATE OR REPLACE FUNCTION fn_cos_updates_cost()
RETURNS TRIGGER AS $$
BEGIN
  -- Update current_sanctioned_cost to latest CoS cost_after_cos
  UPDATE project_cost
     SET current_sanctioned_cost = NEW.cost_after_cos,
         updated_at = NOW()
   WHERE project_id = NEW.project_id;

  -- Update CoS count on project
  UPDATE project
     SET total_cos_count = (
           SELECT COUNT(*) FROM change_of_scope WHERE project_id = NEW.project_id
         ),
         updated_at = NOW()
   WHERE project_id = NEW.project_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_cos_updates_cost
AFTER INSERT OR UPDATE ON change_of_scope
FOR EACH ROW EXECUTE FUNCTION fn_cos_updates_cost();

-- 5. Milestone Progress → compute weighted_contribution
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

CREATE TRIGGER trg_milestone_weighted
BEFORE INSERT OR UPDATE ON milestone_progress
FOR EACH ROW EXECUTE FUNCTION fn_weighted_contribution();

-- ============================================================
-- DASHBOARD KPI VIEWS
-- ============================================================

-- Portfolio-level header cards
CREATE OR REPLACE VIEW v_portfolio_kpis AS
SELECT
  COUNT(*) FILTER (WHERE p.status NOT IN ('CANCELLED','COMPLETED'))                AS active_projects,
  COUNT(*) FILTER (WHERE p.delay_days > 30)                                        AS delayed_projects,
  ROUND(SUM(pc.current_sanctioned_cost) / 100, 2)                                 AS total_sanctioned_cr,
  ROUND(SUM(pc.total_expenditure) / 100, 2)                                        AS total_spent_cr,
  ROUND(SUM(pc.total_expenditure) / NULLIF(SUM(pc.current_sanctioned_cost),0)*100,2) AS financial_utilisation_pct,
  COUNT(*) FILTER (WHERE p.is_delayed = TRUE)                                      AS is_delayed_count,
  SUM(p.total_cos_count)                                                           AS total_cos_events,
  SUM(p.total_eot_days)                                                            AS total_eot_days_portfolio
FROM project p
LEFT JOIN project_cost pc ON pc.project_id = p.project_id;

-- Sector-level cards
CREATE OR REPLACE VIEW v_sector_kpis AS
SELECT
  s.sector_id, s.sector_code, s.sector_name, s.sector_icon,
  COUNT(p.project_id)                                                               AS total_projects,
  ROUND(AVG(pr.actual_physical_pct), 2)                                            AS avg_physical_pct,
  ROUND(SUM(pc.current_sanctioned_cost), 2)                                        AS total_sanctioned_lakhs,
  ROUND(SUM(pc.total_expenditure) / NULLIF(SUM(pc.current_sanctioned_cost),0)*100,2) AS financial_utilisation_pct,
  COUNT(*) FILTER (WHERE p.delay_days > 30)                                        AS delayed_count,
  COUNT(*) FILTER (WHERE pf.flag_status = 'OPEN' AND pf.is_dc_flag = TRUE)        AS dc_flag_count
FROM sector s
LEFT JOIN project p     ON p.sector_id = s.sector_id
LEFT JOIN project_cost pc ON pc.project_id = p.project_id
LEFT JOIN progress pr   ON pr.project_id = p.project_id
  AND pr.snap_month = (SELECT MAX(snap_month) FROM progress WHERE project_id = p.project_id)
LEFT JOIN project_flag pf ON pf.project_id = p.project_id
GROUP BY s.sector_id, s.sector_code, s.sector_name, s.sector_icon;

-- Project-level KPI row (main dashboard table)
CREATE OR REPLACE VIEW v_project_kpis AS
SELECT
  p.project_id, p.project_code, p.project_name,
  p.status, p.delay_days, p.is_delayed,
  p.planned_end_date,
  p.revised_end_date,
  p.total_cos_count,
  p.total_eot_days,
  s.sector_name, s.sector_icon,
  u.ulb_name,
  v.contractor_name,
  pc.current_sanctioned_cost,
  pc.total_expenditure,
  pc.financial_progress_pct,
  pr.actual_physical_pct,
  pr.scheduled_physical_pct,
  pr.physical_deviation,
  pr.physical_status,
  ROUND(
    COUNT(*) FILTER (WHERE qt.pass_fail = TRUE)::numeric
    / NULLIF(COUNT(qt.test_id),0) * 100, 1
  )                                                           AS qc_pass_rate_pct,
  MAX(cb.pending_days) FILTER (WHERE cb.payment_status <> 'PAID') AS max_bill_pending_days
FROM project p
JOIN sector s           ON s.sector_id = p.sector_id
JOIN ulb u              ON u.ulb_id = p.ulb_id
JOIN vendor v           ON v.vendor_id = p.contractor_id
LEFT JOIN project_cost pc  ON pc.project_id = p.project_id
LEFT JOIN progress pr      ON pr.project_id = p.project_id
  AND pr.snap_month = (SELECT MAX(snap_month) FROM progress WHERE project_id = p.project_id)
LEFT JOIN quality_test qt  ON qt.project_id = p.project_id
LEFT JOIN contractor_bill cb ON cb.project_id = p.project_id
GROUP BY
  p.project_id, p.project_code, p.project_name, p.status, p.delay_days, p.is_delayed,
  p.planned_end_date, p.revised_end_date, p.total_cos_count, p.total_eot_days,
  s.sector_name, s.sector_icon, u.ulb_name, v.contractor_name,
  pc.current_sanctioned_cost, pc.total_expenditure, pc.financial_progress_pct,
  pr.actual_physical_pct, pr.scheduled_physical_pct, pr.physical_deviation, pr.physical_status;

-- CoS + EoT + Date revision linked view (project detail drilldown)
CREATE OR REPLACE VIEW v_project_cos_eot_timeline AS
SELECT
  p.project_id, p.project_code, p.project_name,
  p.planned_end_date          AS original_end_date,
  p.revised_end_date          AS current_end_date,
  p.total_eot_days,
  p.total_cos_count,
  -- CoS summary
  cos.cos_id, cos.cos_number, cos.cos_date, cos.cos_category,
  cos.cos_amount, cos.cos_pct_variation, cos.cost_after_cos,
  cos.is_time_linked,
  -- Linked EoT
  eot.eot_id, eot.eot_number, eot.eot_category,
  eot.eot_days_granted, eot.revised_end_date  AS eot_revised_date,
  -- Linked date log
  rdl.revision_number, rdl.previous_end_date, rdl.new_end_date,
  rdl.days_extended, rdl.is_current
FROM project p
LEFT JOIN change_of_scope cos   ON cos.project_id = p.project_id
LEFT JOIN extension_of_time eot ON eot.cos_id = cos.cos_id
LEFT JOIN revised_date_log rdl  ON rdl.eot_id = eot.eot_id
ORDER BY p.project_id, cos.cos_date, eot.eot_approval_date;

-- DC Action panel (all open flags needing attention)
CREATE OR REPLACE VIEW v_dc_action_panel AS
SELECT
  pf.flag_id, pf.severity, pf.days_open, pf.flag_category,
  pf.flag_description, pf.action_required,
  pf.responsible_dept, pf.responsible_officer, pf.contact_phone,
  pf.deadline_date,
  p.project_code, p.project_name, p.delay_days,
  s.sector_name, u.ulb_name
FROM project_flag pf
JOIN project p  ON p.project_id = pf.project_id
JOIN sector s   ON s.sector_id = p.sector_id
JOIN ulb u      ON u.ulb_id = p.ulb_id
WHERE pf.flag_status IN ('OPEN','IN_PROGRESS','ESCALATED')
  AND pf.is_dc_flag = TRUE
ORDER BY
  CASE pf.severity WHEN 'CRITICAL' THEN 1 WHEN 'HIGH' THEN 2
                   WHEN 'MEDIUM' THEN 3 ELSE 4 END,
  pf.days_open DESC;

-- BG / Security expiry alerts
CREATE OR REPLACE VIEW v_bg_expiry_alerts AS
SELECT
  si.instrument_id, si.instrument_type, si.bg_number, si.bank_name,
  si.amount, si.expiry_date, si.days_to_expiry, si.expiry_alert,
  p.project_code, p.project_name, v.contractor_name
FROM security_instrument si
JOIN project p ON p.project_id = si.project_id
JOIN vendor v  ON v.vendor_id = si.vendor_id
WHERE si.is_encashed = FALSE
  AND si.days_to_expiry <= 30
ORDER BY si.days_to_expiry;

-- ============================================================
-- INDEXES (for dashboard query performance)
-- ============================================================
CREATE INDEX idx_project_sector    ON project(sector_id);
CREATE INDEX idx_project_ulb       ON project(ulb_id);
CREATE INDEX idx_project_status    ON project(status);
CREATE INDEX idx_project_delay     ON project(delay_days);
CREATE INDEX idx_cos_project       ON change_of_scope(project_id);
CREATE INDEX idx_eot_project       ON extension_of_time(project_id);
CREATE INDEX idx_eot_cos           ON extension_of_time(cos_id);
CREATE INDEX idx_rdl_project       ON revised_date_log(project_id);
CREATE INDEX idx_rdl_current       ON revised_date_log(project_id) WHERE is_current = TRUE;
CREATE INDEX idx_progress_month    ON progress(project_id, snap_month);
CREATE INDEX idx_flag_open_dc      ON project_flag(project_id) WHERE is_dc_flag = TRUE AND flag_status = 'OPEN';
CREATE INDEX idx_bill_pending      ON contractor_bill(project_id) WHERE payment_status <> 'PAID';

-- ============================================================
-- SEED DATA — 10 BUIDCO Sectors
-- ============================================================
INSERT INTO sector (sector_code, sector_name, sector_icon) VALUES
  ('WATER',  '24×7 Water Supply',         '💧'),
  ('SEW',    'Sewerage & STP',             '🏗'),
  ('DRAIN',  'Storm Water Drainage',       '🌧'),
  ('SWM',    'Solid Waste Management',     '♻'),
  ('TRAN',   'Urban Transport',            '🚌'),
  ('HOUSE',  'Affordable Housing',         '🏘'),
  ('RIVER',  'Riverfront Development',     '🌊'),
  ('LIGHT',  'Urban Street Lighting',      '💡'),
  ('MARKET', 'Commercial Markets',         '🏪'),
  ('BEAUTY', 'Urban Beautification',       '🌳');

-- ============================================================
-- END OF SCHEMA
-- ============================================================

-- ============================================================
-- v5 ADDITIONS: ACCESS CONTROL + AUDIT LOG
-- ============================================================

-- Role-based permissions table (mirrors frontend ROLE_PERMISSIONS)
CREATE TABLE IF NOT EXISTS role_permission (
  role          VARCHAR(20) PRIMARY KEY CHECK (role IN ('MD','DC','PMU_ENGINEER','FINANCE','READ_ONLY')),
  can_view_all  BOOLEAN DEFAULT TRUE,
  can_edit      BOOLEAN DEFAULT FALSE,
  can_add       BOOLEAN DEFAULT FALSE,
  description   TEXT
);

INSERT INTO role_permission VALUES
  ('MD',           TRUE,  TRUE,  TRUE,  'Managing Director — full unrestricted access'),
  ('DC',           TRUE,  FALSE, FALSE, 'District Collector — full view, no writes'),
  ('PMU_ENGINEER', TRUE,  TRUE,  FALSE, 'PMU Engineer — edit assigned projects, no add'),
  ('FINANCE',      TRUE,  FALSE, FALSE, 'Finance — view cost/CoS/EoT tabs only'),
  ('READ_ONLY',    TRUE,  FALSE, FALSE, 'Read-only viewer — overview and sectors only')
ON CONFLICT (role) DO NOTHING;

-- Project audit log — every edit is tracked
CREATE TABLE IF NOT EXISTS project_audit_log (
  audit_id     SERIAL PRIMARY KEY,
  project_id   INT REFERENCES project(project_id),
  changed_by   INT REFERENCES app_user(user_id),
  changed_at   TIMESTAMP DEFAULT NOW(),
  field_name   VARCHAR(80) NOT NULL,
  old_value    TEXT,
  new_value    TEXT,
  change_type  VARCHAR(20) CHECK (change_type IN ('INSERT','UPDATE','DELETE'))
);
CREATE INDEX IF NOT EXISTS idx_audit_project ON project_audit_log(project_id);
CREATE INDEX IF NOT EXISTS idx_audit_user    ON project_audit_log(changed_by);

-- Trigger: auto-log project updates
CREATE OR REPLACE FUNCTION fn_audit_project_changes()
RETURNS TRIGGER AS $$
DECLARE col TEXT; old_val TEXT; new_val TEXT;
BEGIN
  FOREACH col IN ARRAY ARRAY['project_name','status','revised_end_date','contractor_id',
    'dc_attention_flag','status_on_commencement']
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

DROP TRIGGER IF EXISTS trg_audit_project ON project;
CREATE TRIGGER trg_audit_project
AFTER UPDATE ON project
FOR EACH ROW EXECUTE FUNCTION fn_audit_project_changes();

-- RLS not enabled — policies omitted (add later if needed)

DROP VIEW IF EXISTS v_project_with_permissions;
CREATE OR REPLACE VIEW v_project_with_permissions AS
SELECT
  p.*,
  TRUE::boolean AS can_edit,
  TRUE::boolean AS can_add
FROM project p;

-- ============================================================
-- CURRENCY FORMATTING NOTE (for API responses)
-- ============================================================
-- All monetary values stored internally in ₹ Lakhs (NUMERIC(14,2))
-- Format for display using:
--   Lakh:  TO_CHAR(amount, 'FM99,99,99,99,990.00') || ' L'
--   Crore: TO_CHAR(amount/100, 'FM9,99,990.0') || ' Cr'
-- Example: 182400 → ₹ 1,82,400.00 L  OR  ₹ 1,824.0 Cr

CREATE OR REPLACE FUNCTION fmt_lakh(v NUMERIC)
RETURNS TEXT AS $$
SELECT '₹ ' || TO_CHAR(v, 'FM99,99,99,99,990.00') || ' L';
$$ LANGUAGE SQL IMMUTABLE;

CREATE OR REPLACE FUNCTION fmt_cr(v NUMERIC)
RETURNS TEXT AS $$
SELECT '₹ ' || TO_CHAR(v/100, 'FM9,99,990.0') || ' Cr';
$$ LANGUAGE SQL IMMUTABLE;

-- ============================================================
-- END OF v5 ADDITIONS
-- ============================================================
