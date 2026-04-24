-- ============================================================
-- BUIDCO PROJECT MONITORING SYSTEM — PostgreSQL Schema (Fixed)
-- 22 Tables with all core features
-- Run order: execute this file top-to-bottom in one shot
-- ============================================================

-- ── EXTENSIONS ──────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── DROP (for re-runs in dev) ────────────────────────────────
DROP TABLE IF EXISTS
  revised_date_log, extension_of_time, change_of_scope,
  project_flag, quality_test, clearance_noc,
  security_instrument, contractor_bill, fund_release,
  milestone_progress, progress,
  project_audit_log, project_milestone, project_cost, project,
  app_user, department, funding_scheme, ulb, sector, vendor,
  role_permission
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
  ulb_type         VARCHAR(30),
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
  vendor_type        VARCHAR(20),
  contractor_name    VARCHAR(200) NOT NULL,
  company_name       VARCHAR(200),
  pan                VARCHAR(10),
  gstin              VARCHAR(15),
  phone_number       VARCHAR(15) NOT NULL,
  email_id           VARCHAR(100),
  is_blacklisted     BOOLEAN DEFAULT FALSE,
  blacklist_reason   TEXT,
  performance_rating INT,
  created_at         TIMESTAMP DEFAULT NOW(),
  updated_at         TIMESTAMP DEFAULT NOW()
);

CREATE TABLE funding_scheme (
  scheme_id      SERIAL PRIMARY KEY,
  scheme_code    VARCHAR(20) UNIQUE NOT NULL,
  scheme_name    VARCHAR(200) NOT NULL,
  fund_source    VARCHAR(30),
  nodal_ministry VARCHAR(150),
  start_fy       VARCHAR(7),
  end_fy         VARCHAR(7),
  is_active      BOOLEAN DEFAULT TRUE
);

CREATE TABLE department (
  dept_id        SERIAL PRIMARY KEY,
  dept_code      VARCHAR(20) UNIQUE NOT NULL,
  dept_name      VARCHAR(150) NOT NULL,
  dept_type      VARCHAR(30),
  nodal_officer  VARCHAR(120),
  contact_phone  VARCHAR(15),
  contact_email  VARCHAR(100)
);

CREATE TABLE app_user (
  user_id      SERIAL PRIMARY KEY,
  username     VARCHAR(80) UNIQUE NOT NULL,
  full_name    VARCHAR(150) NOT NULL,
  designation  VARCHAR(100),
  role         VARCHAR(20),
  ulb_scope    TEXT,
  sector_scope TEXT,
  email        VARCHAR(120),
  phone        VARCHAR(15),
  is_active    BOOLEAN DEFAULT TRUE,
  last_login   TIMESTAMP
);

CREATE TABLE role_permission (
  role          VARCHAR(20) PRIMARY KEY,
  can_view_all  BOOLEAN DEFAULT TRUE,
  can_edit      BOOLEAN DEFAULT FALSE,
  can_add       BOOLEAN DEFAULT FALSE,
  description   TEXT
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
  district_id             INT,
  scheme_id               INT REFERENCES funding_scheme(scheme_id),
  procurement_mode        VARCHAR(10),
  contractor_id           INT REFERENCES vendor(vendor_id),
  consultant_id           INT REFERENCES vendor(vendor_id),
  status                  VARCHAR(20),
  scheduled_start_date    DATE NOT NULL,
  actual_start_date       DATE,
  planned_end_date        DATE NOT NULL,
  revised_end_date        DATE,
  actual_end_date         DATE,
  total_cos_count         INT DEFAULT 0,
  total_eot_days          INT DEFAULT 0,
  delay_days              INT DEFAULT 0,
  is_delayed              BOOLEAN DEFAULT FALSE,
  dc_attention_flag       BOOLEAN DEFAULT FALSE,
  status_on_commencement  VARCHAR(50),
  created_at              TIMESTAMP DEFAULT NOW(),
  updated_at              TIMESTAMP DEFAULT NOW()
);

CREATE TABLE project_cost (
  cost_id                 SERIAL PRIMARY KEY,
  project_id              INT UNIQUE REFERENCES project(project_id),
  sanctioned_cost         NUMERIC(14,2) NOT NULL,
  revised_cost_1          NUMERIC(14,2),
  revised_cost_1_date     DATE,
  revised_cost_1_reason   VARCHAR(200),
  revised_cost_2          NUMERIC(14,2),
  revised_cost_2_date     DATE,
  current_sanctioned_cost NUMERIC(14,2),
  total_expenditure       NUMERIC(14,2) DEFAULT 0,
  financial_progress_pct  NUMERIC(5,2) DEFAULT 0,
  balance_to_spend        NUMERIC(14,2) DEFAULT 0,
  created_at              TIMESTAMP DEFAULT NOW(),
  updated_at              TIMESTAMP DEFAULT NOW()
);

CREATE TABLE project_milestone (
  milestone_id       SERIAL PRIMARY KEY,
  project_id         INT REFERENCES project(project_id),
  milestone_name     VARCHAR(200) NOT NULL,
  weight_pct         NUMERIC(5,2) NOT NULL,
  appointed_date     DATE,
  planned_date       DATE NOT NULL,
  actual_date        DATE,
  milestone_delay_days INT DEFAULT 0,
  created_at         TIMESTAMP DEFAULT NOW(),
  updated_at         TIMESTAMP DEFAULT NOW()
);

CREATE TABLE project_audit_log (
  audit_id     SERIAL PRIMARY KEY,
  project_id   INT REFERENCES project(project_id),
  changed_by   INT REFERENCES app_user(user_id),
  changed_at   TIMESTAMP DEFAULT NOW(),
  field_name   VARCHAR(80) NOT NULL,
  old_value    TEXT,
  new_value    TEXT,
  change_type  VARCHAR(20)
);

-- ============================================================
-- CHANGE OF SCOPE & EXTENSION OF TIME
-- ============================================================

CREATE TABLE change_of_scope (
  cos_id             SERIAL PRIMARY KEY,
  project_id         INT NOT NULL REFERENCES project(project_id),
  cos_number         VARCHAR(20) NOT NULL,
  cos_date           DATE NOT NULL,
  cos_category       VARCHAR(50) NOT NULL,
  cos_description    TEXT NOT NULL,
  cost_before_cos    NUMERIC(14,2) NOT NULL,
  cos_amount         NUMERIC(14,2) NOT NULL,
  cost_after_cos     NUMERIC(14,2) DEFAULT 0,
  cos_pct_variation  NUMERIC(6,2) DEFAULT 0,
  approval_authority VARCHAR(100) NOT NULL,
  approval_order_no  VARCHAR(80) NOT NULL,
  is_time_linked     BOOLEAN DEFAULT FALSE,
  remarks            TEXT,
  created_at         TIMESTAMP DEFAULT NOW(),
  updated_at         TIMESTAMP DEFAULT NOW(),
  UNIQUE (project_id, cos_number)
);

CREATE TABLE extension_of_time (
  eot_id             SERIAL PRIMARY KEY,
  project_id         INT NOT NULL REFERENCES project(project_id),
  cos_id             INT REFERENCES change_of_scope(cos_id),
  clearance_id       INT,
  eot_number         VARCHAR(20) NOT NULL,
  eot_category       VARCHAR(50) NOT NULL,
  eot_reason         TEXT NOT NULL,
  eot_days_sought    INT NOT NULL,
  eot_days_granted   INT NOT NULL,
  date_from          DATE NOT NULL,
  revised_end_date   DATE,
  approval_authority VARCHAR(100) NOT NULL,
  approval_order_no  VARCHAR(80) NOT NULL,
  eot_approval_date  DATE NOT NULL,
  is_final           BOOLEAN DEFAULT FALSE,
  remarks            TEXT,
  created_at         TIMESTAMP DEFAULT NOW(),
  updated_at         TIMESTAMP DEFAULT NOW(),
  UNIQUE (project_id, eot_number)
);

CREATE TABLE revised_date_log (
  revision_id        SERIAL PRIMARY KEY,
  project_id         INT NOT NULL REFERENCES project(project_id),
  revision_number    INT NOT NULL,
  eot_id             INT REFERENCES extension_of_time(eot_id),
  cos_id             INT REFERENCES change_of_scope(cos_id),
  previous_end_date  DATE NOT NULL,
  new_end_date       DATE NOT NULL,
  days_extended      INT DEFAULT 0,
  revision_reason    TEXT NOT NULL,
  approval_reference VARCHAR(100),
  is_current         BOOLEAN DEFAULT FALSE,
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
  release_level       VARCHAR(20),
  release_amount      NUMERIC(14,2) NOT NULL,
  uc_submitted        BOOLEAN DEFAULT FALSE,
  uc_date             DATE,
  uc_pending_days     INT DEFAULT 0,
  remarks             TEXT
);

CREATE TABLE contractor_bill (
  bill_id           SERIAL PRIMARY KEY,
  project_id        INT REFERENCES project(project_id),
  vendor_id         INT REFERENCES vendor(vendor_id),
  bill_no           VARCHAR(50) NOT NULL,
  bill_date         DATE NOT NULL,
  bill_type         VARCHAR(20),
  gross_amount      NUMERIC(14,2) NOT NULL,
  deductions        NUMERIC(14,2) DEFAULT 0,
  net_payable       NUMERIC(14,2) DEFAULT 0,
  payment_status    VARCHAR(20),
  approved_date     DATE,
  payment_date      DATE,
  pending_days      INT DEFAULT 0,
  escalation_flag   BOOLEAN DEFAULT FALSE,
  remarks           TEXT
);

CREATE TABLE security_instrument (
  instrument_id   SERIAL PRIMARY KEY,
  project_id      INT REFERENCES project(project_id),
  vendor_id       INT REFERENCES vendor(vendor_id),
  instrument_type VARCHAR(20),
  bank_name       VARCHAR(100),
  bg_number       VARCHAR(80),
  amount          NUMERIC(14,2) NOT NULL,
  issue_date      DATE NOT NULL,
  expiry_date     DATE NOT NULL,
  days_to_expiry  INT DEFAULT 0,
  expiry_alert    VARCHAR(30),
  is_extended     BOOLEAN DEFAULT FALSE,
  is_encashed     BOOLEAN DEFAULT FALSE,
  remarks         TEXT
);

CREATE TABLE clearance_noc (
  clearance_id          SERIAL PRIMARY KEY,
  project_id            INT REFERENCES project(project_id),
  clearance_type        VARCHAR(80) NOT NULL,
  dept_responsible      VARCHAR(100) NOT NULL,
  responsible_officer   VARCHAR(120),
  contact_phone         VARCHAR(15),
  applied_date          DATE,
  status                VARCHAR(20),
  received_date         DATE,
  pending_days          INT DEFAULT 0,
  is_blocking_work      BOOLEAN DEFAULT TRUE,
  dc_escalation_needed  BOOLEAN DEFAULT FALSE,
  remarks               TEXT
);

-- ============================================================
-- OPERATIONS & QUALITY
-- ============================================================

CREATE TABLE quality_test (
  test_id         SERIAL PRIMARY KEY,
  project_id      INT REFERENCES project(project_id),
  test_date       DATE NOT NULL,
  component_name  VARCHAR(150) NOT NULL,
  test_type       VARCHAR(80) NOT NULL,
  specification   VARCHAR(100),
  actual_value    VARCHAR(80),
  lab_name        VARCHAR(150),
  result          VARCHAR(15),
  pass_fail       BOOLEAN DEFAULT FALSE,
  remarks         TEXT
);

CREATE TABLE project_flag (
  flag_id             SERIAL PRIMARY KEY,
  project_id          INT REFERENCES project(project_id),
  flag_date           DATE NOT NULL,
  severity            VARCHAR(10),
  flag_status         VARCHAR(15),
  flag_category       VARCHAR(80),
  flag_description    TEXT NOT NULL,
  action_required     TEXT NOT NULL,
  responsible_dept    VARCHAR(100) NOT NULL,
  responsible_officer VARCHAR(120),
  contact_phone       VARCHAR(15),
  deadline_date       DATE,
  days_open           INT DEFAULT 0,
  is_dc_flag          BOOLEAN DEFAULT FALSE,
  is_md_flag          BOOLEAN DEFAULT FALSE,
  resolved_date       DATE,
  resolved_by         VARCHAR(80),
  resolution_notes    TEXT,
  created_by          VARCHAR(80) NOT NULL,
  created_at          TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- PROGRESS TRACKING
-- ============================================================

CREATE TABLE progress (
  progress_id                    SERIAL PRIMARY KEY,
  project_id                     INT REFERENCES project(project_id),
  snap_month                     DATE NOT NULL,
  payments_released_goi_state    NUMERIC(14,2),
  payments_released_to_contractor NUMERIC(14,2),
  scheduled_financial_pct        NUMERIC(5,2) NOT NULL,
  actual_financial_pct           NUMERIC(5,2),
  scheduled_physical_pct         NUMERIC(5,2) NOT NULL,
  actual_physical_pct            NUMERIC(5,2),
  physical_deviation             NUMERIC(5,2) DEFAULT 0,
  financial_deviation            NUMERIC(5,2) DEFAULT 0,
  payment_status                 VARCHAR(20),
  physical_status                VARCHAR(20),
  delay_reason                   VARCHAR(50),
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
  progress_pct          NUMERIC(5,2) NOT NULL,
  weighted_contribution NUMERIC(6,3),
  created_at            TIMESTAMP DEFAULT NOW(),
  UNIQUE (milestone_id, snap_month)
);

-- ============================================================
-- INDEXES (for dashboard query performance)
-- ============================================================
CREATE INDEX idx_project_sector    ON project(sector_id);
CREATE INDEX idx_project_ulb       ON project(ulb_id);
CREATE INDEX idx_project_status    ON project(status);
CREATE INDEX idx_cos_project       ON change_of_scope(project_id);
CREATE INDEX idx_eot_project       ON extension_of_time(project_id);
CREATE INDEX idx_rdl_project       ON revised_date_log(project_id);
CREATE INDEX idx_progress_month    ON progress(project_id, snap_month);
CREATE INDEX idx_flag_project      ON project_flag(project_id);
CREATE INDEX idx_audit_project     ON project_audit_log(project_id);

-- ============================================================
-- SEED DATA
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
  ('BEAUTY', 'Urban Beautification',       '🌳')
ON CONFLICT DO NOTHING;

INSERT INTO role_permission (role, can_view_all, can_edit, can_add, description) VALUES
  ('MD',           TRUE,  TRUE,  TRUE,  'Managing Director — full unrestricted access'),
  ('DC',           TRUE,  FALSE, FALSE, 'District Collector — full view, no writes'),
  ('PMU_ENGINEER', TRUE,  TRUE,  FALSE, 'PMU Engineer — edit assigned projects, no add'),
  ('FINANCE',      TRUE,  FALSE, FALSE, 'Finance — view cost/CoS/EoT tabs only'),
  ('READ_ONLY',    TRUE,  FALSE, FALSE, 'Read-only viewer — overview and sectors only')
ON CONFLICT DO NOTHING;

-- ============================================================
-- END OF SCHEMA
-- ============================================================
