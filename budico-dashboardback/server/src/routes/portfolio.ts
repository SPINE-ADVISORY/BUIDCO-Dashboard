import { Router } from "express";
import { sql } from "drizzle-orm";
import { db } from "../db/client.js";

export const portfolioRouter = Router();

/** Dashboard header cards — maps to view v_portfolio_kpis */
portfolioRouter.get("/kpis", async (_req, res, next) => {
  try {
    const rows = await db.execute(sql`SELECT * FROM v_portfolio_kpis`);
    const row = rows.rows[0] ?? null;
    res.json({ data: row });
  } catch (e) {
    next(e);
  }
});
