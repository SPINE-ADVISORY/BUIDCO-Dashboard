-- ============================================================
-- BUIDCO PROJECT MONITORING SYSTEM — Simplified PostgreSQL Schema
-- ============================================================

-- ── DROP (for re-runs in dev) ────────────────────────────────
DROP TABLE IF EXISTS project_flag CASCADE;
DROP TABLE IF EXISTS revised_date_log CASCADE;
DROP TABLE IF EXISTS extension_of_time CASCADE;
DROP TABLE IF EXISTS change_of_scope CASCADE;
DROP TABLE IF EXISTS project_milestone CASCADE;
DROP TABLE IF EXISTS project_cost CASCADE;
DROP TABLE IF EXISTS project CASCADE;
DROP TABLE IF EXISTS app_user CASCADE;
DROP TABLE IF EXISTS department CASCADE;
DROP TABLE IF EXISTS funding_scheme CASCADE;
DROP TABLE IF EXISTS vendor CASCADE;
DROP TABLE IF EXISTS ulb CASCADE;
DROP TABLE IF EXISTS sector CASCADE;

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
  cost_id                SERIAL PRIMARY KEY,
  project_id             INT UNIQUE REFERENCES project(project_id),
  sanctioned_cost        NUMERIC(14,2) NOT NULL,
  revised_cost_1         NUMERIC(14,2),
  revised_cost_1_date    DATE,
  revised_cost_1_reason  VARCHAR(200),
  revised_cost_2         NUMERIC(14,2),
  revised_cost_2_date    DATE,
  current_sanctioned_cost NUMERIC(14,2),
  total_expenditure       NUMERIC(14,2) DEFAULT 0,
  financial_progress_pct  NUMERIC(5,2) DEFAULT 0,
  balance_to_spend        NUMERIC(14,2) DEFAULT 0,
  created_at              TIMESTAMP DEFAULT NOW(),
  updated_at              TIMESTAMP DEFAULT NOW()
);

CREATE TABLE project_milestone (
  milestone_id   SERIAL PRIMARY KEY,
  project_id     INT REFERENCES project(project_id),
  milestone_name VARCHAR(200) NOT NULL,
  weight_pct     NUMERIC(5,2) NOT NULL,
  appointed_date DATE,
  planned_date   DATE NOT NULL,
  actual_date    DATE,
  milestone_delay_days INT DEFAULT 0,
  created_at     TIMESTAMP DEFAULT NOW(),
  updated_at     TIMESTAMP DEFAULT NOW()
);

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
  previous_end_date  DATE NOT NULL,
  new_end_date       DATE NOT NULL,
  revision_reason    TEXT NOT NULL,
  approval_reference VARCHAR(100),
  created_at         TIMESTAMP DEFAULT NOW()
);

CREATE TABLE project_flag (
  flag_id          SERIAL PRIMARY KEY,
  project_id       INT REFERENCES project(project_id),
  flag_type        VARCHAR(50) NOT NULL,
  flag_date        DATE NOT NULL,
  severity         VARCHAR(20),
  description      TEXT NOT NULL,
  raised_by        VARCHAR(100),
  assigned_to      VARCHAR(100),
  status           VARCHAR(20) DEFAULT 'OPEN',
  resolution       TEXT,
  resolution_date  DATE,
  days_open        INT DEFAULT 0,
  created_at       TIMESTAMP DEFAULT NOW(),
  updated_at       TIMESTAMP DEFAULT NOW()
);
