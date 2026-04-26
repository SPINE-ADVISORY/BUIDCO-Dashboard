import { db } from "../../db";
import { sql } from "drizzle-orm";
import { ApiError } from "../../utils/ApiError";
import { CreateProjectInput, UpdateProjectInput } from "./projects.schema";

// ── Queries ───────────────────────────────────────────────────────────────────

export async function getProjects(params: {
  limit?: number; offset?: number;
  sector_code?: string; district?: string; status?: string; search?: string;
}) {
  const { limit = 500, offset = 0, sector_code, district, status, search } = params;

  const conditions: Array<ReturnType<typeof sql>> = [];
  if (sector_code) conditions.push(sql`sector_code = ${sector_code}`);
  if (district)    conditions.push(sql`district ILIKE ${"%" + district + "%"}`);
  if (status)      conditions.push(sql`status = ${status}`);
  if (search)      conditions.push(sql`(project_name ILIKE ${"%" + search + "%"} OR project_code ILIKE ${"%" + search + "%"})`);

  const where = conditions.length
    ? sql`WHERE ${sql.join(conditions, sql` AND `)}`
    : sql``;

  return db.execute(sql`
    SELECT * FROM v_project_kpis ${where}
    ORDER BY project_name
    LIMIT ${limit} OFFSET ${offset}
  `);
}

export async function getProjectById(projectId: number) {
  const rows = await db.execute(
    sql`SELECT * FROM v_project_kpis WHERE project_id = ${projectId}`
  );
  if (!rows.length) throw new ApiError(404, `Project ${projectId} not found`);
  return rows[0];
}

export async function createProject(input: CreateProjectInput) {
  const [proj] = await db.execute(sql`
    INSERT INTO project (
      project_code, project_name, status, phase,
      scheduled_start_date, planned_end_date,
      revised_end_date, actual_start_date,
      sector_id, ulb_id, contractor_id, consultant_id, scheme_id,
      procurement_mode, agreement_number, agreement_date, appointed_date,
      latitude, longitude, chainage, dept_stuck, delay_reason
    ) VALUES (
      ${input.project_code}, ${input.project_name},
      ${input.status ?? "DPR_STAGE"}, ${input.phase ?? null},
      ${input.scheduled_start_date}, ${input.planned_end_date},
      ${input.revised_end_date ?? null}, ${input.actual_start_date ?? null},
      ${input.sector_id ?? null}, ${input.ulb_id ?? null},
      ${input.contractor_id ?? null}, ${input.consultant_id ?? null},
      ${input.scheme_id ?? null}, ${input.procurement_mode ?? null},
      ${input.agreement_number ?? null}, ${input.agreement_date ?? null},
      ${input.appointed_date ?? null},
      ${input.latitude ?? null}, ${input.longitude ?? null},
      ${input.chainage ?? null}, ${input.dept_stuck ?? null},
      ${input.delay_reason ?? null}
    ) RETURNING project_id
  `);

  const projectId = (proj as { project_id: number }).project_id;
  const sanctioned = input.current_sanctioned_cost ?? 0;

  await db.execute(sql`
    INSERT INTO project_cost (
      project_id, sanctioned_cost, current_sanctioned_cost, total_expenditure,
      contract_value_lakhs, mobilization_advance_lakhs,
      mobilization_advance_recovered_lakhs, payments_made_lakhs,
      last_payment_date, last_ra_bill_no, retention_money_lakhs
    ) VALUES (
      ${projectId}, ${sanctioned}, ${sanctioned}, ${0},
      ${input.contract_value_lakhs ?? null},
      ${input.mobilization_advance_lakhs ?? null},
      ${input.mobilization_advance_recovered_lakhs ?? null},
      ${input.payments_made_lakhs ?? null},
      ${input.last_payment_date ?? null},
      ${input.last_ra_bill_no ?? null},
      ${input.retention_money_lakhs ?? null}
    ) ON CONFLICT (project_id) DO NOTHING
  `);

  return getProjectById(projectId);
}

export async function updateProject(projectId: number, input: UpdateProjectInput) {
  const existing = await db.execute(sql`SELECT project_id FROM project WHERE project_id = ${projectId}`);
  if (!existing.length) throw new ApiError(404, `Project ${projectId} not found`);

  // Build dynamic SET pairs for project table
  const projPairs: Array<ReturnType<typeof sql>> = [];
  if (input.project_code       !== undefined) projPairs.push(sql`project_code = ${input.project_code}`);
  if (input.project_name       !== undefined) projPairs.push(sql`project_name = ${input.project_name}`);
  if (input.status             !== undefined) projPairs.push(sql`status = ${input.status}`);
  if (input.phase              !== undefined) projPairs.push(sql`phase = ${input.phase}`);
  if (input.planned_end_date   !== undefined) projPairs.push(sql`planned_end_date = ${input.planned_end_date}`);
  if (input.revised_end_date   !== undefined) projPairs.push(sql`revised_end_date = ${input.revised_end_date}`);
  if (input.actual_start_date  !== undefined) projPairs.push(sql`actual_start_date = ${input.actual_start_date}`);
  if (input.sector_id          !== undefined) projPairs.push(sql`sector_id = ${input.sector_id}`);
  if (input.ulb_id             !== undefined) projPairs.push(sql`ulb_id = ${input.ulb_id}`);
  if (input.contractor_id      !== undefined) projPairs.push(sql`contractor_id = ${input.contractor_id}`);
  if (input.scheme_id          !== undefined) projPairs.push(sql`scheme_id = ${input.scheme_id}`);
  if (input.procurement_mode   !== undefined) projPairs.push(sql`procurement_mode = ${input.procurement_mode}`);
  if (input.agreement_number   !== undefined) projPairs.push(sql`agreement_number = ${input.agreement_number}`);
  if (input.agreement_date     !== undefined) projPairs.push(sql`agreement_date = ${input.agreement_date}`);
  if (input.appointed_date     !== undefined) projPairs.push(sql`appointed_date = ${input.appointed_date}`);
  if (input.latitude           !== undefined) projPairs.push(sql`latitude = ${input.latitude}`);
  if (input.longitude          !== undefined) projPairs.push(sql`longitude = ${input.longitude}`);
  if (input.chainage           !== undefined) projPairs.push(sql`chainage = ${input.chainage}`);
  if (input.dept_stuck         !== undefined) projPairs.push(sql`dept_stuck = ${input.dept_stuck}`);
  if (input.delay_reason       !== undefined) projPairs.push(sql`delay_reason = ${input.delay_reason}`);

  if (projPairs.length) {
    await db.execute(sql`
      UPDATE project SET ${sql.join(projPairs, sql`, `)}, updated_at = NOW()
      WHERE project_id = ${projectId}
    `);
  }

  // Build dynamic SET pairs for project_cost table
  const costPairs: Array<ReturnType<typeof sql>> = [];
  if (input.current_sanctioned_cost                   !== undefined) costPairs.push(sql`current_sanctioned_cost = ${input.current_sanctioned_cost}`);
  if (input.contract_value_lakhs                      !== undefined) costPairs.push(sql`contract_value_lakhs = ${input.contract_value_lakhs}`);
  if (input.mobilization_advance_lakhs                !== undefined) costPairs.push(sql`mobilization_advance_lakhs = ${input.mobilization_advance_lakhs}`);
  if (input.mobilization_advance_recovered_lakhs      !== undefined) costPairs.push(sql`mobilization_advance_recovered_lakhs = ${input.mobilization_advance_recovered_lakhs}`);
  if (input.payments_made_lakhs                       !== undefined) costPairs.push(sql`payments_made_lakhs = ${input.payments_made_lakhs}`);
  if (input.last_payment_date                         !== undefined) costPairs.push(sql`last_payment_date = ${input.last_payment_date}`);
  if (input.last_ra_bill_no                           !== undefined) costPairs.push(sql`last_ra_bill_no = ${input.last_ra_bill_no}`);
  if (input.retention_money_lakhs                     !== undefined) costPairs.push(sql`retention_money_lakhs = ${input.retention_money_lakhs}`);

  if (costPairs.length) {
    const hasCost = await db.execute(sql`SELECT cost_id FROM project_cost WHERE project_id = ${projectId}`);
    if (hasCost.length) {
      await db.execute(sql`
        UPDATE project_cost SET ${sql.join(costPairs, sql`, `)}, updated_at = NOW()
        WHERE project_id = ${projectId}
      `);
    } else {
      await db.execute(sql`
        INSERT INTO project_cost (project_id, sanctioned_cost, current_sanctioned_cost, total_expenditure)
        VALUES (${projectId}, 0, 0, 0)
      `);
      await db.execute(sql`
        UPDATE project_cost SET ${sql.join(costPairs, sql`, `)}, updated_at = NOW()
        WHERE project_id = ${projectId}
      `);
    }
  }

  return getProjectById(projectId);
}

export async function deleteProject(projectId: number) {
  const existing = await db.execute(sql`SELECT project_id FROM project WHERE project_id = ${projectId}`);
  if (!existing.length) throw new ApiError(404, `Project ${projectId} not found`);
  // Delete dependent records before removing the project
  await db.execute(sql`DELETE FROM project_audit_log   WHERE project_id = ${projectId}`);
  await db.execute(sql`DELETE FROM project_flag        WHERE project_id = ${projectId}`);
  await db.execute(sql`DELETE FROM milestone_progress  WHERE project_id = ${projectId}`);
  await db.execute(sql`DELETE FROM progress            WHERE project_id = ${projectId}`);
  await db.execute(sql`DELETE FROM quality_test        WHERE project_id = ${projectId}`);
  await db.execute(sql`DELETE FROM clearance_noc       WHERE project_id = ${projectId}`);
  await db.execute(sql`DELETE FROM fund_release        WHERE project_id = ${projectId}`);
  await db.execute(sql`DELETE FROM contractor_bill     WHERE project_id = ${projectId}`);
  await db.execute(sql`DELETE FROM security_instrument WHERE project_id = ${projectId}`);
  await db.execute(sql`DELETE FROM revised_date_log    WHERE project_id = ${projectId}`);
  await db.execute(sql`DELETE FROM extension_of_time   WHERE project_id = ${projectId}`);
  await db.execute(sql`DELETE FROM change_of_scope     WHERE project_id = ${projectId}`);
  await db.execute(sql`DELETE FROM project_milestone   WHERE project_id = ${projectId}`);
  await db.execute(sql`DELETE FROM project_cost        WHERE project_id = ${projectId}`);
  await db.execute(sql`DELETE FROM project             WHERE project_id = ${projectId}`);
}
