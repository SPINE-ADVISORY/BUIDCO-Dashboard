import { Router } from "express";
import * as ctrl from "./cos.controller";
import { requireCanEdit } from "../../middleware/rbac";

const router = Router();

router.get("/timeline", ctrl.getTimeline);
router.get("/summary",  ctrl.getSummary);
router.post("/",        requireCanEdit, ctrl.addCosEot);
router.put("/:id",      requireCanEdit, ctrl.editCosEot);
router.delete("/:id",   requireCanEdit, ctrl.removeCosEot);

export default router;
