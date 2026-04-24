# BUIDCO Backend Database Setup Guide

## ✅ Database Status: READY

**Database Name:** `buidco`  
**Total Tables:** 22  
**Status:** All tables created and configured

---

## 📋 Tables Structure

### Master/Lookup Tables (7)
- `sector` - 10 BUIDCO sectors (Water, Sewerage, Drainage, etc.)
- `ulb` - Urban Local Bodies / Districts
- `vendor` - Contractors, Consultants, OM Agencies
- `funding_scheme` - AMRUT, Smart City, JNNURM, etc.
- `department` - State departments responsible for projects
- `app_user` - Dashboard users with roles
- `role_permission` - Role-based access control (MD, DC, PMU_ENGINEER, FINANCE, READ_ONLY)

### Core Project Tables (4)
- `project` - Main project records with status tracking
- `project_cost` - Financial tracking (sanctioned, revised, spent)
- `project_milestone` - Project milestones with weights
- `project_audit_log` - Change tracking for compliance

### Financial Tables (4)
- `fund_release` - GOI → State → BUIDCO → ULB fund flows
- `contractor_bill` - RA Bills, Final Bills, Mobilization
- `security_instrument` - EMD, PBG, SD, Retention bonds
- `clearance_noc` - Environmental, Forest, Heritage clearances

### CoS/EoT/Timeline Tables (3)
- `change_of_scope` - Scope additions/reductions with cost impact
- `extension_of_time` - Time extensions with reasons
- `revised_date_log` - Single source of truth for deadline changes

### Operations & Quality (2)
- `project_flag` - Critical issues needing DC/MD attention
- `quality_test` - Lab test results (PASS/FAIL)

### Progress Tracking (2)
- `progress` - Monthly project status (physical %, financial %)
- `milestone_progress` - Milestone-wise progress tracking

---

## 🚀 Initial Setup (First Time Only)

### 1. Create Schema & Tables
```bash
npm run db:setup
```

This command:
- ✓ Creates all 22 tables in `buidco` database
- ✓ Adds 10 sectors (Water, Sewerage, Drainage, SWM, Transport, Housing, Riverfront, Lighting, Markets, Beautification)
- ✓ Adds 5 user roles with permissions (MD, DC, PMU_ENGINEER, FINANCE, READ_ONLY)
- ✓ Clears Drizzle migration history to prevent conflicts

### 2. Verify Tables (Optional)
```bash
npm run db:studio
```
Opens Drizzle Studio on http://localhost:3000 to view schema visually

---

## 🔧 Hybrid Database Management Strategy

This project uses a **Hybrid Approach**:

| Operation | Method | File |
|-----------|--------|------|
| Initial Schema | Manual SQL | `drizzle/0000_buidco_schema_fixed.sql` |
| Type-Safe Queries | Drizzle ORM | `src/db/schema.ts` |
| New Tables | Drizzle Generate | `npm run db:generate` |
| Schema Changes | Manual SQL | `drizzle/` folder |

### Why This Approach?
- ✅ Full control over complex triggers and views
- ✅ Mature schema already tested in production
- ✅ Type-safe queries through Drizzle for app code
- ✅ Avoids migration conflicts
- ✅ Easy to audit schema changes

---

## 📝 Adding New Tables/Migrations

### For Simple Changes:
```bash
# After modifying schema.ts:
npm run db:generate

# Review the generated SQL file
# Then apply it manually to buidco database
```

### For Complex Changes:
1. Edit `drizzle/0000_buidco_schema_fixed.sql` directly
2. Apply manually:
   ```bash
   psql -U postgres -d buidco -f drizzle/0000_buidco_schema_fixed.sql
   ```

---

## 🔗 Database Connection

```
Host: localhost
Port: 5432
User: postgres
Password: shriyam
Database: buidco
```

Connection String in `.env`:
```
DATABASE_URL=postgresql://postgres:shriyam@localhost:5432/buidco
```

---

## 📊 Schema Highlights

### Key Features
- **Generated Columns**: Financial progress, balance to spend (computed in app)
- **Indexes**: On high-query fields (sector_id, ulb_id, status, project_id)
- **Check Constraints**: ENUM-like validations (status, role, etc.)
- **Foreign Keys**: Referential integrity across all tables
- **Unique Constraints**: Prevents duplicate records

### Business Logic
- CoS (Change of Scope) tracks cost variations
- EoT (Extension of Time) links to CoS and creates date revisions
- revised_date_log maintains audit trail of all date changes
- project_flag escalates to DC/MD automatically based on rules
- role_permission enforces dashboard access levels

---

## ✨ Next Steps

1. **Start Development Server**
   ```bash
   npm run dev
   ```

2. **Build for Production**
   ```bash
   npm run build
   npm start
   ```

3. **Seed Sample Data**
   Create a `seed.js` script to populate initial projects:
   ```javascript
   // Insert sample projects into buidco database
   INSERT INTO project (...) VALUES (...);
   ```

---

## 🆘 Troubleshooting

### Error: "relation already exists"
```bash
# Reset and recreate:
npm run db:setup
```

### Can't connect to database?
- Check PostgreSQL is running: `psql -U postgres -c "SELECT 1"`
- Verify `.env` DATABASE_URL
- Confirm buidco database exists: `psql -U postgres -l | grep buidco`

### Need to view schema visually?
```bash
npm run db:studio
```

---

## 📚 Files Reference

| File | Purpose |
|------|---------|
| `drizzle/0000_buidco_schema_fixed.sql` | Complete 22-table schema |
| `src/db/schema.ts` | Drizzle TypeScript definitions |
| `setup-db.js` | Initialize database script |
| `clear-migrations.js` | Bypass Drizzle migrations |
| `.env` | Database connection config |

---

## 📞 Support

For schema changes or questions:
1. Review `0000_buidco_schema_fixed.sql` comments
2. Check Drizzle ORM docs: https://orm.drizzle.team
3. Consult business rules in BUIDCO documentation

---

**Last Updated:** April 23, 2026  
**Status:** ✅ Production Ready
