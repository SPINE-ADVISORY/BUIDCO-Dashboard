import { Router } from "express";
import * as ctrl from "./flags.controller";
import { requireCanEdit } from "../../middleware/rbac";

const router = Router();

router.get("/open",                  ctrl.listOpenFlags);
router.get("/dc-action",             ctrl.listDcFlags);
router.get("/meta/severity-counts",  ctrl.listSeverityCounts);
router.post("/",                     requireCanEdit, ctrl.addFlag);
router.put("/:id",                   requireCanEdit, ctrl.editFlag);
router.patch("/:id/resolve",         requireCanEdit, ctrl.resolveFlag);
router.delete("/:id",                requireCanEdit, ctrl.removeFlag);

export default router;
