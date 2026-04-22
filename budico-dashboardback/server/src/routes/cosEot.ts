import { Router } from "express";
import { sql } from "drizzle-orm";
import { db } from "../db/client.js";
import { pool } from "../db/client.js";

export const cosEotRouter = Router();

/** Timeline view — v_project_cos_eot_timeline */
cosEotRouter.get("/timeline", async (req, res, next) => {
  try {
    const projectId = req.query.projectId as string | undefined;
    if (projectId) {
      const rows = await db.execute(sql`
        SELECT * FROM v_project_cos_eot_timeline
        WHERE project_id = ${Number(projectId)}
        ORDER BY cos_date NULLS LAST, eot_id NULLS LAST
      `);
      return res.json({ data: rows.rows });
    }
    const rows = await db.execute(sql`
      SELECT * FROM v_project_cos_eot_timeline
      ORDER BY project_id, cos_date NULLS LAST
      LIMIT 2000
    `);
    res.json({ data: rows.rows });
  } catch (e) {
    next(e);
  }
});

/** CoS / EoT summary KPIs for dashboard tab */
cosEotRouter.get("/summary", async (_req, res, next) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        (SELECT COUNT(*)::int FROM change_of_scope) AS total_cos_events,
        (SELECT COALESCE(SUM(eot_days_granted),0)::int FROM extension_of_time) AS total_eot_days,
        (SELECT COUNT(*)::int FROM change_of_scope WHERE is_time_linked = TRUE) AS cos_linked_eot,
        (SELECT COALESCE(SUM(cos_amount),0)::numeric FROM change_of_scope) AS total_variation_lakh
    `);
    res.json({ data: rows[0] ?? {} });
  } catch (e) {
    next(e);
  }
});
