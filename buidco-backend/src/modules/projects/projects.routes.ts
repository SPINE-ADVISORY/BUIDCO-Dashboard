import { Router } from "express";
import * as ctrl from "./projects.controller";
import { requireCanEdit, requireCanAdd } from "../../middleware/rbac";

const router = Router();

router.get("/",      ctrl.listProjects);
router.get("/:id",   ctrl.getProject);
router.post("/",     requireCanAdd, ctrl.addProject);
router.put("/:id",   requireCanEdit, ctrl.editProject);
router.delete("/:id",requireCanAdd, ctrl.removeProject);

export default router;
