import { db } from "../../db";
import { sql } from "drizzle-orm";

export async function getPortfolioKpis() {
  const rows = await db.execute(sql`SELECT * FROM v_portfolio_kpis`);
  return rows[0] ?? {};
}

export async function getSectorKpis() {
  return db.execute(sql`SELECT * FROM v_sector_kpis ORDER BY sector_name`);
}

export async function getStatusBreakdown() {
  return db.execute(sql`SELECT * FROM v_status_breakdown ORDER BY status`);
}
