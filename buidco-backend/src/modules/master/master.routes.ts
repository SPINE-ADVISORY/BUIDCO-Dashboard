import { Router } from "express";
import * as ctrl from "./master.controller";

const router = Router();

router.get("/sectors",          ctrl.listSectors);
router.get("/ulbs",             ctrl.listUlbs);
router.get("/role-permissions", ctrl.listRolePermissions);

export default router;
