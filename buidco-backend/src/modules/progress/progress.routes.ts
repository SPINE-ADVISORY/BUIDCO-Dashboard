import { Router } from "express";
import * as ctrl from "./progress.controller";
import { requireCanEdit } from "../../middleware/rbac";

const router = Router();

router.get("/:projectId",            ctrl.getProjectProgress);
router.post("/:projectId",           requireCanEdit, ctrl.saveProgress);

export default router;
