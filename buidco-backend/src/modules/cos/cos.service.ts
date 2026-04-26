import { db } from "../../db";
import { changeOfScope, extensionOfTime } from "../../db/schema";
import { sql, eq } from "drizzle-orm";
import { ApiError } from "../../utils/ApiError";
import { CreateCosInput } from "./cos.schema";

export async function getCosEotTimeline(projectId?: number) {
  const where = projectId
    ? sql`WHERE project_id = ${projectId}`
    : sql``;
  return db.execute(sql`SELECT * FROM v_project_cos_eot_timeline ${where}`);
}

export async function getCosEotSummary() {
  return db.execute(sql`
    SELECT
      COUNT(*)                            AS total_cos,
      SUM(cos_amount)                     AS total_cos_amount,
      SUM(eot_days_granted)               AS total_eot_days,
      COUNT(*) FILTER (WHERE is_time_linked) AS time_linked_count
    FROM v_project_cos_eot_timeline
    WHERE cos_id IS NOT NULL
  `);
}

export async function createCosEot(input: CreateCosInput) {
  const today = new Date().toISOString().slice(0, 10);

  // Fetch current cost to compute cost_before_cos
  let costBefore = input.cost_before_cos ?? 0;
  if (!costBefore) {
    const cost = await db.execute(
      sql`SELECT COALESCE(current_sanctioned_cost, sanctioned_cost, 0) AS val FROM project_cost WHERE project_id = ${input.project_id}`
    );
    costBefore = Number((cost[0] as Record<string, unknown>)?.val ?? 0);
  }

  const cosAmountNum   = Number(input.cos_amount ?? 0);
  const costBeforeNum  = Number(costBefore);
  const costAfterCos   = costBeforeNum + cosAmountNum;
  const cosPctVariation = costBeforeNum > 0
    ? Math.round((cosAmountNum / costBeforeNum) * 10000) / 100
    : 0;

  const [cos] = await db.insert(changeOfScope).values({
    projectId:         input.project_id,
    cosNumber:         input.cos_number,
    cosDate:           input.cos_date || today,
    cosCategory:       input.cos_category,
    cosDescription:    input.cos_description || "",
    costBeforeCos:     String(costBeforeNum),
    cosAmount:         String(cosAmountNum),
    costAfterCos:      String(costAfterCos),
    cosPctVariation:   String(cosPctVariation),
    approvalAuthority: input.approval_authority || "MD",
    approvalOrderNo:   input.approval_order_no || "N/A",
    isTimeLinked:      input.is_time_linked ?? false,
    remarks:           input.remarks ?? null,
  }).returning();

  if (input.is_time_linked && input.eot_number && input.eot_days_granted) {
    const dateFrom = input.date_from || today;
    const daysGranted = input.eot_days_granted ?? 0;
    // Compute revised_end_date since Drizzle column is not GENERATED
    const computedRevised = input.new_end_date || (() => {
      const d = new Date(dateFrom);
      d.setDate(d.getDate() + daysGranted);
      return d.toISOString().slice(0, 10);
    })();
    await db.insert(extensionOfTime).values({
      projectId:         input.project_id,
      cosId:             cos.cosId,
      eotNumber:         input.eot_number,
      eotCategory:       input.eot_category || "SCOPE_CHANGE",
      eotReason:         input.eot_reason || `Linked to ${input.cos_number}`,
      eotDaysSought:     input.eot_days_sought ?? daysGranted,
      eotDaysGranted:    daysGranted,
      dateFrom,
      revisedEndDate:    computedRevised,
      approvalAuthority: input.approval_authority_eot || input.approval_authority || "MD",
      approvalOrderNo:   input.approval_order_no_eot || input.approval_order_no || "N/A",
      eotApprovalDate:   input.eot_approval_date || today,
    });
  }

  // Return full timeline rows for the project
  return getCosEotTimeline(input.project_id);
}

export async function updateCosEot(cosId: number, input: Partial<CreateCosInput>) {
  const existing = await db.select().from(changeOfScope).where(eq(changeOfScope.cosId, cosId));
  if (!existing.length) throw new ApiError(404, `CoS ${cosId} not found`);

  const updates: Record<string, unknown> = {};
  if (input.cos_date)           updates.cosDate = input.cos_date;
  if (input.cos_category)       updates.cosCategory = input.cos_category;
  if (input.cos_description)    updates.cosDescription = input.cos_description;
  if (input.cos_amount != null) updates.cosAmount = String(input.cos_amount);
  if (input.remarks != null)    updates.remarks = input.remarks;
  if (input.is_time_linked != null) updates.isTimeLinked = input.is_time_linked;
  if (input.approval_authority) updates.approvalAuthority = input.approval_authority;
  if (input.approval_order_no)  updates.approvalOrderNo = input.approval_order_no;

  if (Object.keys(updates).length) {
    updates.updatedAt = new Date();
    await db.update(changeOfScope).set(updates as never).where(eq(changeOfScope.cosId, cosId));
  }

  return getCosEotTimeline(existing[0].projectId ?? undefined);
}

export async function deleteCosEot(cosId: number) {
  const existing = await db.select().from(changeOfScope).where(eq(changeOfScope.cosId, cosId));
  if (!existing.length) throw new ApiError(404, `CoS ${cosId} not found`);
  await db.delete(changeOfScope).where(eq(changeOfScope.cosId, cosId));
}
