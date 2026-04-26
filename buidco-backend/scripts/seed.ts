/**
 * Seed script — loads sample data for development.
 * Run AFTER db:migrate.
 */
import * as dotenv from "dotenv";
dotenv.config();

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { sql } from "drizzle-orm";
import * as schema from "../src/db/schema";

const DATABASE_URL = process.env.DATABASE_URL!;

async function main() {
  const client = postgres(DATABASE_URL, { max: 1 });
  const db = drizzle(client, { schema });

  console.log("── Seeding sectors…");
  await db.execute(sql`
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
      ('BEAUTY', 'Urban Beautification',       '🌳'),
      ('ROAD',   'Urban Roads',                '🛣')
    ON CONFLICT (sector_code) DO NOTHING
  `);

  console.log("── Seeding ULBs…");
  const districts = [
    "Patna", "Muzaffarpur", "Gaya", "Bhagalpur", "Darbhanga",
    "Begusarai", "Purnia", "Ara", "Samastipur", "Munger",
    "Chapra", "Sitamarhi", "Madhubani", "Supaul", "Saharsa",
  ];
  for (let i = 0; i < districts.length; i++) {
    const d = districts[i];
    await db.execute(sql`
      INSERT INTO ulb (ulb_code, ulb_name, ulb_type, district_name)
      VALUES (${`ULB${String(i + 1).padStart(3, "0")}`}, ${d + " Nagar Nigam"}, 'Nagar_Nigam', ${d})
      ON CONFLICT (ulb_code) DO NOTHING
    `);
  }

  console.log("── Seeding vendors…");
  await db.execute(sql`
    INSERT INTO vendor (vendor_code, vendor_type, contractor_name, phone_number) VALUES
      ('VEND-001', 'CONTRACTOR', 'Bihar Infrastructure Ltd.',      '9999000001'),
      ('VEND-002', 'CONTRACTOR', 'Patna Civil Works Pvt. Ltd.',    '9999000002'),
      ('VEND-003', 'CONTRACTOR', 'National Urban Builders Ltd.',   '9999000003')
    ON CONFLICT (vendor_code) DO NOTHING
  `);

  console.log("── Seeding role permissions…");
  await db.execute(sql`
    INSERT INTO role_permission (role, can_view_all, can_edit, can_add, description) VALUES
      ('MD',           TRUE, TRUE,  TRUE,  'Managing Director — full unrestricted access'),
      ('DC',           TRUE, FALSE, FALSE, 'District Collector — full view, no writes'),
      ('PMU_ENGINEER', TRUE, TRUE,  FALSE, 'PMU Engineer — edit assigned projects, no add'),
      ('FINANCE',      TRUE, FALSE, FALSE, 'Finance — view cost/CoS/EoT tabs only'),
      ('READ_ONLY',    TRUE, FALSE, FALSE, 'Read-only viewer')
    ON CONFLICT (role) DO NOTHING
  `);

  // ── Resolve FK IDs ──────────────────────────────────────────────────────────
  const sid = async (code: string) => {
    const r = await db.execute(sql`SELECT sector_id FROM sector WHERE sector_code = ${code} LIMIT 1`);
    return (r[0] as Record<string, number>).sector_id;
  };
  const uid = async (dist: string) => {
    const r = await db.execute(sql`SELECT ulb_id FROM ulb WHERE district_name = ${dist} LIMIT 1`);
    return (r[0] as Record<string, number>).ulb_id;
  };
  const vid = async (code: string) => {
    const r = await db.execute(sql`SELECT vendor_id FROM vendor WHERE vendor_code = ${code} LIMIT 1`);
    return (r[0] as Record<string, number>).vendor_id;
  };

  const pid = async (code: string) => {
    const r = await db.execute(sql`SELECT project_id FROM project WHERE project_code = ${code} LIMIT 1`);
    if (!r.length) return null;
    return (r[0] as Record<string, number>).project_id;
  };

  // ── Projects ────────────────────────────────────────────────────────────────
  console.log("── Seeding projects…");

  const projects: Array<{
    code: string; name: string; sector: string; district: string; vendor: string;
    status: string; phase: string; start: string; planned: string; revised?: string;
    cost: number; spent: number; latitude?: number; longitude?: number;
  }> = [
    {
      code: "BU/WATER/PAT/2024/01",
      name: "Patna 24×7 Water Supply Augmentation Phase-I",
      sector: "WATER", district: "Patna", vendor: "VEND-001",
      status: "IN_PROGRESS", phase: "Construction",
      start: "2024-01-15", planned: "2026-12-31",
      cost: 18500, spent: 7400,
      latitude: 25.5941, longitude: 85.1376,
    },
    {
      code: "BU/SEW/GAY/2023/01",
      name: "Gaya Sewerage Network & STP Phase-I",
      sector: "SEW", district: "Gaya", vendor: "VEND-002",
      status: "IN_PROGRESS", phase: "Construction",
      start: "2023-06-01", planned: "2025-12-31", revised: "2026-06-30",
      cost: 12200, spent: 9100,
      latitude: 24.7955, longitude: 85.0002,
    },
    {
      code: "BU/ROAD/MUZ/2024/01",
      name: "Muzaffarpur Urban Road Package-II",
      sector: "ROAD", district: "Muzaffarpur", vendor: "VEND-003",
      status: "IN_PROGRESS", phase: "Construction",
      start: "2024-03-01", planned: "2025-09-30",
      cost: 8750, spent: 3000,
      latitude: 26.1209, longitude: 85.3647,
    },
    {
      code: "BU/SWM/BHA/2023/01",
      name: "Bhagalpur Solid Waste Management Facility",
      sector: "SWM", district: "Bhagalpur", vendor: "VEND-001",
      status: "STALLED", phase: "Construction",
      start: "2023-04-01", planned: "2024-12-31", revised: "2026-03-31",
      cost: 5600, spent: 1800,
      latitude: 25.2447, longitude: 87.0095,
    },
    {
      code: "BU/LIGHT/DAR/2024/01",
      name: "Darbhanga Smart Street Lighting Project",
      sector: "LIGHT", district: "Darbhanga", vendor: "VEND-002",
      status: "AWARDED", phase: "Post-Tender",
      start: "2024-08-01", planned: "2025-12-31",
      cost: 3200, spent: 0,
      latitude: 26.1542, longitude: 85.8918,
    },
  ];

  for (const p of projects) {
    const sectorId = await sid(p.sector);
    const ulbId    = await uid(p.district);
    const vendorId = await vid(p.vendor);
    await db.execute(sql`
      INSERT INTO project (
        project_code, project_name, sector_id, ulb_id, contractor_id,
        status, phase, scheduled_start_date, planned_end_date, revised_end_date,
        latitude, longitude,
        agreement_number, agreement_date, appointed_date
      ) VALUES (
        ${p.code}, ${p.name}, ${sectorId}, ${ulbId}, ${vendorId},
        ${p.status}, ${p.phase}, ${p.start}, ${p.planned}, ${p.revised ?? null},
        ${p.latitude ?? null}, ${p.longitude ?? null},
        ${"AGR-" + p.code.slice(-6)}, ${p.start}, ${p.start}
      ) ON CONFLICT (project_code) DO NOTHING
    `);
    await db.execute(sql`
      INSERT INTO project_cost (project_id, sanctioned_cost, current_sanctioned_cost, total_expenditure)
      SELECT p.project_id, ${p.cost}, ${p.cost}, ${p.spent}
      FROM project p WHERE p.project_code = ${p.code}
      ON CONFLICT (project_id) DO NOTHING
    `);
  }

  // ── Progress records ─────────────────────────────────────────────────────────
  console.log("── Seeding progress records…");

  const progressData: Array<{
    code: string; month: string; sched_fin: number; act_fin: number;
    sched_phys: number; act_phys: number;
  }> = [
    { code: "BU/WATER/PAT/2024/01", month: "2025-01-01", sched_fin: 25, act_fin: 22, sched_phys: 20, act_phys: 18 },
    { code: "BU/WATER/PAT/2024/01", month: "2025-03-01", sched_fin: 35, act_fin: 38, sched_phys: 30, act_phys: 32 },
    { code: "BU/WATER/PAT/2024/01", month: "2025-06-01", sched_fin: 40, act_fin: 40, sched_phys: 38, act_phys: 37 },
    { code: "BU/SEW/GAY/2023/01",   month: "2025-01-01", sched_fin: 60, act_fin: 58, sched_phys: 55, act_phys: 52 },
    { code: "BU/SEW/GAY/2023/01",   month: "2025-03-01", sched_fin: 72, act_fin: 70, sched_phys: 68, act_phys: 65 },
    { code: "BU/SEW/GAY/2023/01",   month: "2025-06-01", sched_fin: 80, act_fin: 74, sched_phys: 75, act_phys: 70 },
    { code: "BU/ROAD/MUZ/2024/01",  month: "2025-03-01", sched_fin: 20, act_fin: 18, sched_phys: 18, act_phys: 15 },
    { code: "BU/ROAD/MUZ/2024/01",  month: "2025-06-01", sched_fin: 35, act_fin: 34, sched_phys: 32, act_phys: 30 },
    { code: "BU/SWM/BHA/2023/01",   month: "2025-06-01", sched_fin: 50, act_fin: 32, sched_phys: 45, act_phys: 28 },
  ];

  for (const pr of progressData) {
    const projectId = await pid(pr.code);
    if (!projectId) continue;
    await db.execute(sql`
      INSERT INTO progress (
        project_id, snap_month,
        scheduled_financial_pct, actual_financial_pct,
        scheduled_physical_pct, actual_physical_pct,
        payment_status, physical_status, submitted_by
      ) VALUES (
        ${projectId}, ${pr.month},
        ${pr.sched_fin}, ${pr.act_fin},
        ${pr.sched_phys}, ${pr.act_phys},
        'ON_TRACK', 'ON_TRACK', 'system'
      ) ON CONFLICT (project_id, snap_month) DO NOTHING
    `);
  }

  // ── CoS / EoT records ────────────────────────────────────────────────────────
  console.log("── Seeding CoS/EoT records…");

  const cosData: Array<{
    code: string; cosNo: string; cosDate: string; category: string;
    description: string; costBefore: number; cosAmount: number;
    isTimeLinked: boolean; eotNo?: string; eotDays?: number; dateFrom?: string;
  }> = [
    {
      code: "BU/SEW/GAY/2023/01", cosNo: "COS/GAY/01", cosDate: "2024-09-01",
      category: "SCOPE_ADDITION", description: "Additional 3 km sewer network in Ward 12-15",
      costBefore: 12200, cosAmount: 1800, isTimeLinked: true,
      eotNo: "EOT/GAY/01", eotDays: 180, dateFrom: "2024-09-15",
    },
    {
      code: "BU/WATER/PAT/2024/01", cosNo: "COS/PAT/01", cosDate: "2025-02-01",
      category: "DESIGN_CHANGE", description: "Change in pipe material from DI to HDPE",
      costBefore: 18500, cosAmount: 500, isTimeLinked: false,
    },
    {
      code: "BU/SWM/BHA/2023/01", cosNo: "COS/BHA/01", cosDate: "2024-06-15",
      category: "FORCE_MAJEURE", description: "Flood damage to partially completed works",
      costBefore: 5600, cosAmount: 800, isTimeLinked: true,
      eotNo: "EOT/BHA/01", eotDays: 270, dateFrom: "2024-06-20",
    },
  ];

  for (const c of cosData) {
    const projectId = await pid(c.code);
    if (!projectId) continue;
    const costAfter = c.costBefore + c.cosAmount;
    const cosPct = Math.round((c.cosAmount / c.costBefore) * 10000) / 100;

    const cosOrderNo = `MD/ORDER/${c.cosNo}`;
    await db.execute(sql`
      INSERT INTO change_of_scope (
        project_id, cos_number, cos_date, cos_category, cos_description,
        cost_before_cos, cos_amount, cost_after_cos, cos_pct_variation,
        approval_authority, approval_order_no, is_time_linked
      ) VALUES (
        ${projectId}, ${c.cosNo}, ${c.cosDate}, ${c.category}, ${c.description},
        ${c.costBefore}, ${c.cosAmount}, ${costAfter}, ${cosPct},
        'MD', ${cosOrderNo}, ${c.isTimeLinked}
      ) ON CONFLICT DO NOTHING
    `);

    if (c.isTimeLinked && c.eotNo && c.eotDays && c.dateFrom) {
      const cosRow = await db.execute(sql`SELECT cos_id FROM change_of_scope WHERE cos_number = ${c.cosNo} LIMIT 1`);
      if (!cosRow.length) continue;
      const cosId = (cosRow[0] as Record<string, number>).cos_id;
      const d = new Date(c.dateFrom);
      d.setDate(d.getDate() + c.eotDays);
      const revisedEnd = d.toISOString().slice(0, 10);
      const eotReason   = `Linked to ${c.cosNo}`;
      const eotOrderNo  = `MD/ORDER/${c.eotNo}`;
      await db.execute(sql`
        INSERT INTO extension_of_time (
          project_id, cos_id, eot_number, eot_category, eot_reason,
          eot_days_sought, eot_days_granted, date_from, revised_end_date,
          approval_authority, approval_order_no, eot_approval_date
        ) VALUES (
          ${projectId}, ${cosId}, ${c.eotNo}, 'SCOPE_CHANGE', ${eotReason},
          ${c.eotDays}, ${c.eotDays}, ${c.dateFrom}, ${revisedEnd},
          'MD', ${eotOrderNo}, ${c.cosDate}
        ) ON CONFLICT DO NOTHING
      `);
    }
  }

  // ── Project flags ────────────────────────────────────────────────────────────
  console.log("── Seeding project flags…");

  const flagData: Array<{
    code: string; severity: string; category: string; description: string;
    action: string; dept: string; isDc: boolean; isMd: boolean; isPreMon: boolean;
  }> = [
    {
      code: "BU/SEW/GAY/2023/01", severity: "CRITICAL",
      category: "LAND_ACQUISITION", description: "3 plots in Ward 14 still not acquired; contractor stalled",
      action: "DC to issue acquisition notice within 7 days",
      dept: "Revenue", isDc: true, isMd: true, isPreMon: false,
    },
    {
      code: "BU/SWM/BHA/2023/01", severity: "HIGH",
      category: "CONTRACTOR_PERFORMANCE", description: "Contractor mobilisation < 40%, work behind schedule by 8 months",
      action: "MD review — consider termination if no improvement in 30 days",
      dept: "PMU", isDc: false, isMd: true, isPreMon: false,
    },
    {
      code: "BU/ROAD/MUZ/2024/01", severity: "MEDIUM",
      category: "PRE_MONSOON_READINESS", description: "Drain crossings incomplete — risk of flooding before June",
      action: "Complete all RCC drain crossings before 31-May",
      dept: "Engineering", isDc: true, isMd: false, isPreMon: true,
    },
    {
      code: "BU/WATER/PAT/2024/01", severity: "LOW",
      category: "PAYMENT_DELAY", description: "RA Bill #4 pending approval for 45 days",
      action: "Finance to process within this week",
      dept: "Finance", isDc: false, isMd: false, isPreMon: false,
    },
  ];

  for (const f of flagData) {
    const projectId = await pid(f.code);
    if (!projectId) continue;
    await db.execute(sql`
      INSERT INTO project_flag (
        project_id, severity, flag_status, flag_category,
        flag_description, action_required, responsible_dept,
        is_dc_flag, is_md_flag, is_pre_monsoon, created_by
      ) VALUES (
        ${projectId}, ${f.severity}, 'OPEN', ${f.category},
        ${f.description}, ${f.action}, ${f.dept},
        ${f.isDc}, ${f.isMd}, ${f.isPreMon}, 'system'
      ) ON CONFLICT DO NOTHING
    `);
  }

  await client.end();
  console.log("\n✅ Seed complete");
}

main().catch((e) => {
  console.error("Seed failed:", e);
  process.exit(1);
});
