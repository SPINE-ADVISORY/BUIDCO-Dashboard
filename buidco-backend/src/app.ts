import * as dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import { authMiddleware } from "./middleware/auth";
import { errorHandler } from "./middleware/errorHandler";

import dashboardRoutes  from "./modules/dashboard/dashboard.routes";
import projectRoutes    from "./modules/projects/projects.routes";
import cosRoutes        from "./modules/cos/cos.routes";
import flagRoutes       from "./modules/flags/flags.routes";
import masterRoutes     from "./modules/master/master.routes";
import progressRoutes   from "./modules/progress/progress.routes";
import financeRoutes    from "./modules/finance/finance.routes";

const app = express();

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(authMiddleware);

// ── Routes ────────────────────────────────────────────────────────────────────
const v1 = "/api/v1";
app.use(v1,             dashboardRoutes);   // /portfolio/kpis, /sectors/kpis, /projects/meta/*
app.use(`${v1}/projects`,  projectRoutes); // /projects CRUD
app.use(`${v1}/cos-eot`,   cosRoutes);     // /cos-eot/timeline, CRUD
app.use(`${v1}/flags`,     flagRoutes);    // /flags/open, /dc-action, CRUD
app.use(`${v1}/reference`, masterRoutes);  // /reference/sectors, /ulbs, /role-permissions
app.use(`${v1}/progress`,  progressRoutes);
app.use(`${v1}/finance`,   financeRoutes);

// ── Health ────────────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => res.json({ status: "ok", ts: new Date().toISOString() }));

// ── Error handler ─────────────────────────────────────────────────────────────
app.use(errorHandler);

const PORT = Number(process.env.PORT ?? 3001);
app.listen(PORT, () => {
  console.log(`BUIDCO API running on http://localhost:${PORT}`);
});

export default app;
