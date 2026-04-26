import { Router } from "express";
import * as ctrl from "./finance.controller";

const router = Router();

router.get("/instruments/:projectId", ctrl.getInstruments);
router.get("/expiry-alerts",          ctrl.getAlerts);
router.get("/bills/:projectId",       ctrl.getBills);

export default router;
