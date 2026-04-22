import { Router } from "express";
import { sql } from "drizzle-orm";
import { db } from "../db/client.js";

export const referenceRouter = Router();

referenceRouter.get("/sectors", async (_req, res, next) => {
  try {
    const rows = await db.execute(
      sql`SELECT sector_id, sector_code, sector_name, sector_icon FROM sector ORDER BY sector_code`
    );
    res.json({ data: rows.rows });
  } catch (e) {
    next(e);
  }
});

referenceRouter.get("/ulbs", async (_req, res, next) => {
  try {
    const rows = await db.execute(
      sql`SELECT ulb_id, ulb_code, ulb_name, district_name FROM ulb ORDER BY district_name, ulb_name`
    );
    res.json({ data: rows.rows });
  } catch (e) {
    next(e);
  }
});

referenceRouter.get("/role-permissions", async (_req, res, next) => {
  try {
    const rows = await db.execute(
      sql`SELECT role, can_view_all, can_edit, can_add, description FROM role_permission ORDER BY role`
    );
    res.json({ data: rows.rows });
  } catch (e) {
    next(e);
  }
});
