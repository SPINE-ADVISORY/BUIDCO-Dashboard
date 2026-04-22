-- ============================================================
-- BUIDCO PROJECT MONITORING SYSTEM — Simplified PostgreSQL Schema
-- Basic tables without generated columns for easier setup
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
  financial_progress_pct  NUMERIC(5,2) DEFAULT 0,  -- maintained by trigger
  balance_to_spend        NUMERIC(14,2) DEFAULT 0,  -- maintained by trigger
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
-- CHANGE OF SCOPE (CoS)
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
  cost_after_cos     NUMERIC(14,2) DEFAULT 0,  -- maintained by trigger
  cos_pct_variation  NUMERIC(6,2) DEFAULT 0,   -- maintained by trigger
  approval_authority VARCHAR(100) NOT NULL,
  approval_order_no  VARCHAR(80) NOT NULL,
  is_time_linked     BOOLEAN DEFAULT FALSE,  -- TRUE if this CoS also needs an EoT
  remarks            TEXT,
  created_at         TIMESTAMP DEFAULT NOW(),
  updated_at         TIMESTAMP DEFAULT NOW(),
  UNIQUE (project_id, cos_number)
);

-- ============================================================
-- EXTENSION OF TIME (EoT)
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
  revised_end_date   DATE,  -- maintained by trigger
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
-- REVISED DATE LOG
-- ============================================================

CREATE TABLE revised_date_log (
  revision_id        SERIAL PRIMARY KEY,
  project_id         INT NOT NULL REFERENCES project(project_id),
  revision_number    INT NOT NULL,   -- auto-set by trigger
  eot_id             INT REFERENCES extension_of_time(eot_id),
  previous_end_date  DATE NOT NULL,
  new_end_date       DATE NOT NULL,
  revision_reason    TEXT NOT NULL,
  approval_reference VARCHAR(100),
  created_at         TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- ADDITIONAL TABLES (simplified)
-- ============================================================

CREATE TABLE project_flag (
  flag_id          SERIAL PRIMARY KEY,
  project_id       INT REFERENCES project(project_id),
  flag_type        VARCHAR(50) NOT NULL,
  flag_date        DATE NOT NULL,
  severity         VARCHAR(20) CHECK (severity IN ('LOW','MEDIUM','HIGH','CRITICAL')),
  description      TEXT NOT NULL,
  raised_by        VARCHAR(100),
  assigned_to      VARCHAR(100),
  status           VARCHAR(20) DEFAULT 'OPEN' CHECK (status IN ('OPEN','IN_PROGRESS','RESOLVED','CLOSED')),
  resolution       TEXT,
  resolution_date  DATE,
  days_open        INT DEFAULT 0,  -- maintained by trigger
  created_at       TIMESTAMP DEFAULT NOW(),
  updated_at       TIMESTAMP DEFAULT NOW()
);

-- Insert some basic data
INSERT INTO sector (sector_code, sector_name, sector_icon) VALUES
('WAT', 'Water Supply', '💧'),
('SEW', 'Sewerage', '🚽'),
('DRA', 'Drainage', '🌊'),
('SWM', 'Solid Waste Management', '🗑️'),
('TRA', 'Transport', '🚗'),
('HOU', 'Housing', '🏠'),
('RIV', 'Riverfront Development', '🌉'),
('LIG', 'Street Lighting', '💡'),
('MAR', 'Markets', '🏪'),
('BEA', 'Beautification', '🌸'),
('ROA', 'Roads', '🛣️');

INSERT INTO ulb (ulb_code, ulb_name, ulb_type, district_name) VALUES
('PATNA_MN', 'Patna Municipal Corporation', 'Nagar_Nigam', 'Patna'),
('GAYA_MN', 'Gaya Municipal Corporation', 'Nagar_Nigam', 'Gaya'),
('BHAGALPUR_MN', 'Bhagalpur Municipal Corporation', 'Nagar_Nigam', 'Bhagalpur'),
('MUZAFFARPUR_MN', 'Muzaffarpur Municipal Corporation', 'Nagar_Nigam', 'Muzaffarpur'),
('DARBHANGA_MN', 'Darbhanga Municipal Corporation', 'Nagar_Nigam', 'Darbhanga'),
('BIHARSHARIF_NP', 'Bihar Sharif Nagar Parishad', 'Nagar_Parishad', 'Nalanda'),
('CHAPRA_NP', 'Chapra Nagar Parishad', 'Nagar_Parishad', 'Saran'),
('HAJIPUR_NP', 'Hajipur Nagar Parishad', 'Nagar_Parishad', 'Vaishali'),
('MADHUBANI_NP', 'Madhubani Nagar Parishad', 'Nagar_Parishad', 'Madhubani'),
('SAMASTIPUR_NP', 'Samastipur Nagar Parishad', 'Nagar_Parishad', 'Samastipur'),
('SITAMARHI_NP', 'Sitamarhi Nagar Parishad', 'Nagar_Parishad', 'Sitamarhi'),
('SIWAN_NP', 'Siwan Nagar Parishad', 'Nagar_Parishad', 'Siwan'),
('BEGUSARAI_NP', 'Begusarai Nagar Parishad', 'Nagar_Parishad', 'Begusarai'),
('KATIHAR_NP', 'Katihar Nagar Parishad', 'Nagar_Parishad', 'Katihar'),
('ARRAH_NP', 'Arrah Nagar Parishad', 'Nagar_Parishad', 'Bhojpur');

INSERT INTO funding_scheme (scheme_code, scheme_name, fund_source, is_active) VALUES
('AMRUT', 'Atal Mission for Rejuvenation and Urban Transformation', 'AMRUT', true),
('STATE', 'State Government Budget', 'STATE_BUDGET', true),
('JNNURM', 'Jawaharlal Nehru National Urban Renewal Mission', 'JNNURM', false),
('SMART', 'Smart City Mission', 'SMART_CITY', true);

INSERT INTO app_user (username, full_name, role, is_active) VALUES
('admin', 'System Administrator', 'MD', true),
('dc_patna', 'District Collector Patna', 'DC', true),
('pmu_eng1', 'PMU Engineer 1', 'PMU_ENGINEER', true),
('finance1', 'Finance Officer 1', 'FINANCE', true),
('readonly1', 'Read Only User 1', 'READ_ONLY', true);
