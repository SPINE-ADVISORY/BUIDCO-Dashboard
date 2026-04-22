import { Router } from "express";
import { sql } from "drizzle-orm";
import { db } from "../db/client.js";
import { pool } from "../db/client.js";

export const flagsRouter = Router();

/** DC action panel view */
flagsRouter.get("/dc-action", async (_req, res, next) => {
  try {
    const rows = await db.execute(sql`SELECT * FROM v_dc_action_panel`);
    res.json({ data: rows.rows });
  } catch (e) {
    next(e);
  }
});

/**
 * All open / in-progress flags (matches dashboard “Management Action” tab)
 */
flagsRouter.get("/open", async (_req, res, next) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        pf.flag_id,
        pf.severity,
        pf.days_open,
        pf.flag_category,
        pf.flag_description,
        pf.action_required,
        pf.responsible_dept,
        p.project_code,
        p.project_name,
        p.delay_days,
        s.sector_name,
        u.ulb_name,
        (pf.flag_description ILIKE '%monsoon%'
          OR pf.flag_category::text ILIKE '%monsoon%') AS is_pre_monsoon
      FROM project_flag pf
      JOIN project p ON p.project_id = pf.project_id
      JOIN sector s ON s.sector_id = p.sector_id
      JOIN ulb u ON u.ulb_id = p.ulb_id
      WHERE pf.flag_status IN ('OPEN', 'IN_PROGRESS', 'ESCALATED')
      ORDER BY
        CASE pf.severity
          WHEN 'CRITICAL' THEN 1
          WHEN 'HIGH' THEN 2
          WHEN 'MEDIUM' THEN 3
          ELSE 4
        END,
        pf.days_open DESC NULLS LAST
    `);
    res.json({ data: rows });
  } catch (e) {
    next(e);
  }
});

/** Severity counts for management tab header */
flagsRouter.get("/meta/severity-counts", async (_req, res, next) => {
  try {
    const { rows } = await pool.query(`
      SELECT pf.severity AS name, COUNT(*)::int AS value
      FROM project_flag pf
      WHERE pf.flag_status IN ('OPEN', 'IN_PROGRESS', 'ESCALATED')
      GROUP BY pf.severity
    `);
    res.json({ data: rows });
  } catch (e) {
    next(e);
  }
});
