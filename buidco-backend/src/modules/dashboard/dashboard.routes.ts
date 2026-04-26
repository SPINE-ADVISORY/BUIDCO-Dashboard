import { Router } from "express";
import * as ctrl from "./dashboard.controller";

const router = Router();

router.get("/portfolio/kpis",            ctrl.getPortfolioKpis);
router.get("/sectors/kpis",              ctrl.getSectorKpis);
router.get("/projects/meta/status-breakdown", ctrl.getStatusBreakdown);

export default router;
