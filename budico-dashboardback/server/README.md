# BUIDCO API (Express + Drizzle + PostgreSQL)

## Prerequisites

- Node.js 18+
- PostgreSQL 14+ (schema uses `EXECUTE FUNCTION` in triggers — supported on PG14+)

## Setup

1. Create database:

   ```bash
   createdb buidco
   ```

2. Copy environment:

   ```bash
   cp .env.example .env
   ```

   Edit `DATABASE_URL` to match your Postgres user/password/host.

3. Install and migrate:

   ```bash
   npm install
   npm run db:migrate
   ```

   Migrations live in `drizzle/`. The initial migration is generated from `Read.md` (BUIDCO schema v2).

4. Start API:

   ```bash
   npm run dev
   ```

   Server: `http://localhost:3001`

## API routes (`/api/v1`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Liveness |
| GET | `/portfolio/kpis` | View `v_portfolio_kpis` |
| GET | `/sectors/kpis` | View `v_sector_kpis` |
| GET | `/projects` | View `v_project_kpis` (query: `sectorCode`, `district`, `ulb`, `status`, `q`, `limit`, `offset`) |
| GET | `/projects/meta/status-breakdown` | Count by `project.status` |
| GET | `/projects/:id` | Single project KPI row |
| GET | `/cos-eot/timeline` | View `v_project_cos_eot_timeline` (`projectId` optional) |
| GET | `/cos-eot/summary` | CoS/EoT aggregates |
| GET | `/flags/dc-action` | View `v_dc_action_panel` |
| GET | `/flags/open` | Open flags (management tab) |
| GET | `/flags/meta/severity-counts` | Flag counts by severity |
| GET | `/reference/sectors` | `sector` rows |
| GET | `/reference/ulbs` | `ulb` rows |
| GET | `/reference/role-permissions` | `role_permission` rows |

Connections set `app.role = MD` on pool connect so Row Level Security policies allow full read access (see `Read.md`).

## Regenerating migrations from SQL

If you update `Read.md`, copy it to `drizzle/0000_buidco_schema.sql` (or add a new numbered migration) and update `drizzle/meta/_journal.json` accordingly, or use `drizzle-kit generate` after editing `src/db/schema.ts`.
