import { Router } from "express";
import { sql } from "drizzle-orm";
import { db } from "../db/client.js";

export const sectorsRouter = Router();

/** Sector cards — v_sector_kpis */
sectorsRouter.get("/kpis", async (_req, res, next) => {
  try {
    const rows = await db.execute(sql`SELECT * FROM v_sector_kpis ORDER BY sector_code`);
    res.json({ data: rows.rows });
  } catch (e) {
    next(e);
  }
});
