import { db } from "../../db";
import { sql } from "drizzle-orm";

export async function getProjectInstruments(projectId: number) {
  return db.execute(sql`SELECT * FROM security_instrument WHERE project_id = ${projectId}`);
}

export async function getExpiryAlerts() {
  return db.execute(sql`SELECT * FROM v_bg_expiry_alerts`);
}

export async function getProjectBills(projectId: number) {
  return db.execute(sql`SELECT * FROM contractor_bill WHERE project_id = ${projectId} ORDER BY bill_date`);
}
