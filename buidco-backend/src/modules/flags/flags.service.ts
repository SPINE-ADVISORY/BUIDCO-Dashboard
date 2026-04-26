import { db } from "../../db";
import { projectFlag } from "../../db/schema";
import { sql, eq } from "drizzle-orm";
import { ApiError } from "../../utils/ApiError";

export async function getOpenFlags() {
  return db.execute(sql`SELECT * FROM v_open_flags`);
}

export async function getDcActionFlags() {
  return db.execute(sql`SELECT * FROM v_dc_action_panel`);
}

export async function getFlagSeverityCounts() {
  return db.execute(sql`
    SELECT severity, COUNT(*) AS count
    FROM project_flag
    WHERE flag_status IN ('OPEN','IN_PROGRESS','ESCALATED')
    GROUP BY severity
    ORDER BY CASE severity WHEN 'CRITICAL' THEN 1 WHEN 'HIGH' THEN 2 WHEN 'MEDIUM' THEN 3 ELSE 4 END
  `);
}

export async function createFlag(input: Record<string, unknown>) {
  const rows = await db.execute(sql`
    INSERT INTO project_flag (
      project_id, severity, flag_status, flag_category,
      flag_description, action_required, responsible_dept,
      responsible_officer, deadline_date,
      is_dc_flag, is_md_flag, is_pre_monsoon, created_by
    ) VALUES (
      ${Number(input.project_id)},
      ${String(input.severity ?? "MEDIUM")},
      'OPEN',
      ${input.flag_category ? String(input.flag_category) : null},
      ${String(input.flag_description ?? "")},
      ${String(input.action_required ?? "")},
      ${String(input.responsible_dept ?? "")},
      ${input.responsible_officer ? String(input.responsible_officer) : null},
      ${input.deadline_date ? String(input.deadline_date) : null},
      ${Boolean(input.is_dc_flag ?? false)},
      ${Boolean(input.is_md_flag ?? false)},
      ${Boolean(input.is_pre_monsoon ?? false)},
      ${String(input.created_by ?? "system")}
    ) RETURNING *
  `);
  return rows[0];
}

export async function updateFlag(flagId: number, input: Record<string, unknown>) {
  const existing = await db.select().from(projectFlag).where(eq(projectFlag.flagId, flagId));
  if (!existing.length) throw new ApiError(404, `Flag ${flagId} not found`);

  const updates: Record<string, unknown> = {};
  const allowed = [
    "severity", "flag_status", "flag_category", "flag_description",
    "action_required", "responsible_dept", "responsible_officer",
    "deadline_date", "is_dc_flag", "is_md_flag",
  ];
  const camelMap: Record<string, string> = {
    flag_status: "flagStatus", flag_category: "flagCategory",
    flag_description: "flagDescription", action_required: "actionRequired",
    responsible_dept: "responsibleDept", responsible_officer: "responsibleOfficer",
    deadline_date: "deadlineDate", is_dc_flag: "isDcFlag", is_md_flag: "isMdFlag",
  };
  for (const k of allowed) {
    if (k in input) updates[camelMap[k] ?? k] = input[k];
  }

  if (Object.keys(updates).length) {
    await db.update(projectFlag).set(updates as never).where(eq(projectFlag.flagId, flagId));
  }
  const rows = await db.execute(sql`SELECT * FROM project_flag WHERE flag_id = ${flagId}`);
  return rows[0];
}

export async function resolveFlag(flagId: number) {
  const existing = await db.select().from(projectFlag).where(eq(projectFlag.flagId, flagId));
  if (!existing.length) throw new ApiError(404, `Flag ${flagId} not found`);
  await db.update(projectFlag)
    .set({ flagStatus: "RESOLVED", resolvedDate: new Date().toISOString().slice(0, 10) } as never)
    .where(eq(projectFlag.flagId, flagId));
}

export async function deleteFlag(flagId: number) {
  const existing = await db.select().from(projectFlag).where(eq(projectFlag.flagId, flagId));
  if (!existing.length) throw new ApiError(404, `Flag ${flagId} not found`);
  await db.delete(projectFlag).where(eq(projectFlag.flagId, flagId));
}
