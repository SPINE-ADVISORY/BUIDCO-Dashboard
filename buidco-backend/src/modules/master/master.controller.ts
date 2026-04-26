import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok } from "../../utils/ApiResponse";
import * as svc from "./master.service";

export const listSectors = asyncHandler(async (_req: Request, res: Response) => {
  ok(res, await svc.getReferenceSectors());
});

export const listUlbs = asyncHandler(async (_req: Request, res: Response) => {
  ok(res, await svc.getReferenceUlbs());
});

export const listRolePermissions = asyncHandler(async (_req: Request, res: Response) => {
  ok(res, await svc.getRolePermissions());
});
