import { Router } from "express";
import { sql } from "drizzle-orm";
import { db, pool } from "../db/client.js";

export const projectsRouter = Router();

const projectSelect = `
SELECT
  v.*,
  s.sector_code,
  u.district_name AS district,
  CASE v.status
    WHEN 'DPR_STAGE' THEN 'Conceptualization'
    WHEN 'TENDERING' THEN 'Tender'
    WHEN 'AWARDED' THEN 'Post-Tender'
    WHEN 'IN_PROGRESS' THEN 'Construction'
    WHEN 'STALLED' THEN 'Construction'
    WHEN 'COMPLETED' THEN 'Completed'
    WHEN 'HANDED_OVER' THEN 'Completed'
    WHEN 'CANCELLED' THEN 'Completed'
    ELSE 'Construction'
  END AS phase
FROM v_project_kpis v
JOIN project pr ON pr.project_id = v.project_id
JOIN sector s ON s.sector_id = pr.sector_id
JOIN ulb u ON u.ulb_id = pr.ulb_id
`;

/** Pie chart — must be registered before /:id */
projectsRouter.get("/meta/status-breakdown", async (_req, res, next) => {
  try {
    const rows = await db.execute(sql`
      SELECT status AS name, COUNT(*)::int AS value
      FROM project
      GROUP BY status
      ORDER BY value DESC
    `);
    res.json({ data: rows.rows });
  } catch (e) {
    next(e);
  }
});

projectsRouter.get("/", async (req, res, next) => {
  try {
    const sectorCode = (req.query.sectorCode as string) || null;
    const districtName = (req.query.district as string) || null;
    const ulbName = (req.query.ulb as string) || null;
    const status = (req.query.status as string) || null;
    const q = (req.query.q as string) || null;
    const limit = Math.min(parseInt(String(req.query.limit ?? "500"), 10) || 500, 2000);
    const offset = parseInt(String(req.query.offset ?? "0"), 10) || 0;

    const search = q ? `%${q}%` : null;

    const { rows } = await pool.query(
      `SELECT x.* FROM (${projectSelect}) x
       WHERE ($1::text IS NULL OR x.sector_code = $1)
         AND ($2::text IS NULL OR x.district = $2)
         AND ($3::text IS NULL OR x.ulb_name = $3)
         AND ($4::text IS NULL OR x.status = $4)
         AND ($5::text IS NULL OR x.project_name ILIKE $5 OR x.project_code ILIKE $5)
       ORDER BY x.project_code
       LIMIT $6 OFFSET $7`,
      [sectorCode, districtName, ulbName, status, search, limit, offset]
    );

    res.json({ data: rows, meta: { limit, offset } });
  } catch (e) {
    next(e);
  }
});

projectsRouter.get("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      res.status(400).json({ error: "Invalid project id" });
      return;
    }
    const { rows } = await pool.query(
      `SELECT * FROM (${projectSelect}) q WHERE q.project_id = $1 LIMIT 1`,
      [id]
    );
    const row = rows[0];
    if (!row) {
      res.status(404).json({ error: "Project not found" });
      return;
    }
    res.json({ data: row });
  } catch (e) {
    next(e);
  }
});
