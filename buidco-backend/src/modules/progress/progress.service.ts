import { db } from "../../db";
import { progress } from "../../db/schema";
import { sql, eq, and } from "drizzle-orm";
import { ApiError } from "../../utils/ApiError";

export async function getProgress(projectId: number) {
  return db.execute(sql`SELECT * FROM progress WHERE project_id = ${projectId} ORDER BY snap_month`);
}

export async function upsertProgress(projectId: number, snapMonth: string, input: Record<string, unknown>) {
  const existing = await db.select().from(progress)
    .where(and(eq(progress.projectId, projectId), eq(progress.snapMonth, snapMonth)));

  const values = {
    projectId,
    snapMonth,
    scheduledPhysicalPct:    String(input.scheduled_physical_pct ?? 0),
    actualPhysicalPct:       input.actual_physical_pct != null ? String(input.actual_physical_pct) : null,
    scheduledFinancialPct:   String(input.scheduled_financial_pct ?? 0),
    actualFinancialPct:      input.actual_financial_pct != null ? String(input.actual_financial_pct) : null,
    delayReason:             input.delay_reason as string ?? null,
    delayDetails:            input.delay_details as string ?? null,
    workDoneThisMonth:       input.work_done_this_month as string ?? null,
    submittedBy:             (input.submitted_by as string) ?? "system",
    updatedAt:               new Date(),
  };

  if (existing.length) {
    await db.update(progress)
      .set(values as never)
      .where(and(eq(progress.projectId, projectId), eq(progress.snapMonth, snapMonth)));
  } else {
    await db.insert(progress).values(values as never);
  }

  return getProgress(projectId);
}
