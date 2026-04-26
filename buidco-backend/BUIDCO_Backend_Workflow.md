# BUIDCO Project Monitoring System — Backend Workflow & Folder Structure

---

## 📁 Complete Folder Structure

```
buidco-api/
│
├── drizzle/
│   ├── migrations/                        # ← Drizzle AUTO-GENERATES these (never edit manually)
│   │   ├── 0001_initial_tables.sql        # First migration (tables, indexes, FKs)
│   │   ├── 0002_add_new_column.sql        # Future schema change
│   │   └── meta/
│   │       └── _journal.json             # Drizzle tracks what's been applied
│   │
│   └── manual/                            # ← YOU write & own these
│       ├── functions.sql                  # fmt_lakh, fmt_cr, fn_audit, fn_cos, fn_eot...
│       ├── triggers.sql                   # All 5 triggers (DROP IF EXISTS → CREATE)
│       ├── views.sql                      # All 6 KPI views (CREATE OR REPLACE)
│       └── rls_policies.sql              # Row Level Security policies
│
├── src/
│   ├── db/
│   │   ├── schema/                        # Drizzle TypeScript table definitions
│   │   │   ├── master.ts                  # sector, ulb, vendor, funding_scheme, department
│   │   │   ├── core.ts                    # project, project_cost, project_milestone
│   │   │   ├── cos-eot.ts                 # change_of_scope, extension_of_time, revised_date_log
│   │   │   ├── financial.ts               # fund_release, contractor_bill, security_instrument
│   │   │   ├── operations.ts              # clearance_noc, quality_test, project_flag
│   │   │   ├── progress.ts                # progress, milestone_progress
│   │   │   └── auth.ts                    # app_user, role_permission, project_audit_log
│   │   └── index.ts                       # DB connection pool (postgres.js + drizzle)
│   │
│   ├── modules/
│   │   ├── dashboard/
│   │   │   ├── dashboard.routes.ts
│   │   │   ├── dashboard.controller.ts
│   │   │   └── dashboard.service.ts       # Queries v_portfolio_kpis, v_sector_kpis, etc.
│   │   │
│   │   ├── projects/
│   │   │   ├── projects.routes.ts
│   │   │   ├── projects.controller.ts
│   │   │   ├── projects.service.ts
│   │   │   └── projects.schema.ts         # Zod validation schemas
│   │   │
│   │   ├── cos/                           # Change of Scope
│   │   │   ├── cos.routes.ts
│   │   │   ├── cos.controller.ts
│   │   │   ├── cos.service.ts
│   │   │   └── cos.schema.ts
│   │   │
│   │   ├── eot/                           # Extension of Time
│   │   │   ├── eot.routes.ts
│   │   │   ├── eot.controller.ts
│   │   │   ├── eot.service.ts
│   │   │   └── eot.schema.ts
│   │   │
│   │   ├── progress/
│   │   │   ├── progress.routes.ts
│   │   │   ├── progress.controller.ts
│   │   │   └── progress.service.ts
│   │   │
│   │   ├── finance/
│   │   │   ├── finance.routes.ts
│   │   │   ├── finance.controller.ts
│   │   │   └── finance.service.ts
│   │   │
│   │   ├── flags/
│   │   │   ├── flags.routes.ts
│   │   │   ├── flags.controller.ts
│   │   │   └── flags.service.ts
│   │   │
│   │   └── master/                        # Sectors, ULBs, Vendors
│   │       ├── master.routes.ts
│   │       ├── master.controller.ts
│   │       └── master.service.ts
│   │
│   ├── middleware/
│   │   ├── auth.ts                        # JWT decode + set app.role / app.user_id for RLS
│   │   ├── rbac.ts                        # Role gate (MD only, PMU only, etc.)
│   │   └── errorHandler.ts               # Global error handler
│   │
│   ├── utils/
│   │   ├── asyncHandler.ts               # Wraps async route handlers
│   │   ├── ApiError.ts                   # Custom error class
│   │   └── ApiResponse.ts                # Standard response shape
│   │
│   └── app.ts                             # Express app setup, route registration
│
├── scripts/
│   ├── migrate.ts                         # Master migration runner (Drizzle + manual SQL)
│   └── seed.ts                            # Sample data for development
│
├── .env                                   # DATABASE_URL, JWT_SECRET, PORT
├── .env.example                           # Committed to git (no secrets)
├── drizzle.config.ts                      # Drizzle Kit configuration
├── tsconfig.json
├── package.json
└── README.md
```

---

## ⚙️ Ownership Rules (Most Important Concept)

```
┌─────────────────────────────────────────────────────────────┐
│                   WHO OWNS WHAT                             │
├───────────────────────────┬─────────────────────────────────┤
│  Drizzle ORM Owns         │  You Own (manual SQL)           │
├───────────────────────────┼─────────────────────────────────┤
│  Tables                   │  Triggers                       │
│  Indexes                  │  Views                          │
│  Foreign Keys             │  Functions                      │
│  Check Constraints        │  RLS Policies                   │
│  Unique Constraints       │  Seed Data                      │
└───────────────────────────┴─────────────────────────────────┘

RULE: If Drizzle can generate it → schema.ts
      If Drizzle cannot generate it → drizzle/manual/*.sql
```

---

## 🔄 Developer Workflows

### Workflow A — Adding a New Table or Column
> Example: You need to add a `geo_location` column to `project`

```
1. Edit src/db/schema/core.ts
   └── Add the new column definition

2. Run: npm run db:generate
   └── Drizzle reads schema.ts
   └── Compares with _journal.json
   └── Creates drizzle/migrations/0003_add_geo_location.sql

3. Review the generated SQL file
   └── Make sure it looks correct

4. Run: npm run db:migrate
   └── migrate.ts applies ONLY the new migration
   └── Re-applies all manual/ SQL files (safe, idempotent)

5. Done — DB is in sync, no manual psql needed
```

---

### Workflow B — Changing a Trigger or View
> Example: You need to update `v_portfolio_kpis` to add a new KPI

```
1. Edit drizzle/manual/views.sql
   └── Modify the CREATE OR REPLACE VIEW v_portfolio_kpis AS ...

2. Run: npm run db:migrate
   └── No new Drizzle migration (tables didn't change)
   └── Script re-applies views.sql → new view is live

3. Done
```

---

### Workflow C — First Time Setup (Fresh Machine / New Dev)
> Clone repo → run one command → DB is fully ready

```
1. git clone <repo>
2. cp .env.example .env   (fill in DATABASE_URL)
3. npm install
4. npm run db:migrate      ← single command does everything:
                              ✓ Creates all tables
                              ✓ Applies all indexes & constraints
                              ✓ Creates all functions
                              ✓ Creates all triggers
                              ✓ Creates all views
                              ✓ Applies RLS policies
5. npm run db:seed         ← optional: loads sample data
6. npm run dev             ← server is running
```

---

### Workflow D — Production Deployment

```
1. Push code to main branch
2. CI/CD pipeline runs:
   └── npm run build
   └── npm run db:migrate   ← safe to run in prod (only applies new migrations)
   └── npm start

IMPORTANT: db:migrate is ALWAYS idempotent — safe to run multiple times
           Drizzle skips already-applied migrations via _journal.json
           manual/ files use CREATE OR REPLACE — no duplicate errors
```

---

## 🛠️ NPM Scripts Reference

```json
{
  "scripts": {
    "dev":          "tsx watch src/app.ts",
    "build":        "tsc",
    "start":        "node dist/app.js",

    "db:generate":  "drizzle-kit generate",
    "db:migrate":   "tsx scripts/migrate.ts",
    "db:studio":    "drizzle-kit studio",
    "db:seed":      "tsx scripts/seed.ts"
  }
}
```

| Command | When to Use |
|---|---|
| `db:generate` | After editing any `schema.ts` file |
| `db:migrate` | Always — applies everything (tables + manual SQL) |
| `db:studio` | Debugging — visual DB browser on localhost:3000 |
| `db:seed` | Development only — loads sample projects |

---

## 🔐 RLS + Auth Flow

```
HTTP Request
    │
    ▼
auth.ts middleware
    │  1. Decode JWT → extract { role, userId }
    │  2. Run: SET app.role = 'PMU_ENGINEER'
    │          SET app.user_id = '42'
    ▼
Route Handler
    │
    ▼
Drizzle Query → PostgreSQL
    │  Postgres RLS policies fire automatically:
    │  - MD / DC → sees ALL projects
    │  - PMU_ENGINEER → sees ONLY their ULB's projects
    ▼
Response
```

---

## 🗃️ Manual SQL Files — Key Rules

### functions.sql
```sql
-- Always use CREATE OR REPLACE
CREATE OR REPLACE FUNCTION fn_cos_updates_cost()
RETURNS TRIGGER AS $$ ... $$ LANGUAGE plpgsql;
```

### triggers.sql
```sql
-- Triggers cannot use OR REPLACE — use DROP IF EXISTS first
DROP TRIGGER IF EXISTS trg_cos_updates_cost ON change_of_scope;
CREATE TRIGGER trg_cos_updates_cost
AFTER INSERT OR UPDATE ON change_of_scope
FOR EACH ROW EXECUTE FUNCTION fn_cos_updates_cost();
```

### views.sql
```sql
-- Always use CREATE OR REPLACE
CREATE OR REPLACE VIEW v_portfolio_kpis AS
SELECT ...;
```

### rls_policies.sql
```sql
-- DROP before recreate (policies can't be replaced)
DROP POLICY IF EXISTS project_md_dc ON project;
CREATE POLICY project_md_dc ON project
  FOR ALL TO PUBLIC
  USING (current_setting('app.role', TRUE) IN ('MD','DC','FINANCE','READ_ONLY'));
```

---

## 🚦 When to Open psql / pgAdmin

```
✅ ALLOWED:   Debugging — running SELECT queries to investigate data
✅ ALLOWED:   Production emergency hotfix (then immediately backport to repo)

❌ NEVER:     Creating or altering tables directly
❌ NEVER:     Creating triggers or views directly
❌ NEVER:     Running schema SQL manually as standard workflow

RULE: If your DB has something that isn't in your repo → your repo is wrong.
      The repo is the single source of truth. The DB is just the output.
```

---

## 📦 Key Dependencies

```json
{
  "dependencies": {
    "drizzle-orm":   "latest",
    "postgres":      "latest",
    "express":       "latest",
    "zod":           "latest",
    "jsonwebtoken":  "latest"
  },
  "devDependencies": {
    "drizzle-kit":   "latest",
    "drizzle-zod":   "latest",
    "tsx":           "latest",
    "typescript":    "latest",
    "@types/express":"latest",
    "@types/node":   "latest"
  }
}
```

---

## ✅ Quick Decision Cheat Sheet

```
Q: I need a new table?
A: Edit schema.ts → db:generate → db:migrate

Q: I need a new column?
A: Edit schema.ts → db:generate → db:migrate

Q: I need to update a view?
A: Edit drizzle/manual/views.sql → db:migrate

Q: I need to fix a trigger?
A: Edit drizzle/manual/triggers.sql → db:migrate

Q: First time setup on new machine?
A: npm install → db:migrate → db:seed → dev

Q: Deploying to production?
A: build → db:migrate → start

Q: Should I write SQL directly in psql?
A: NO. Edit the file. Run db:migrate.
```

---

*Last Updated: April 2026 | BUIDCO PMU Backend Team*
