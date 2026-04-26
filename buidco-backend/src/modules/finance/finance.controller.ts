import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok } from "../../utils/ApiResponse";
import * as svc from "./finance.service";

export const getInstruments = asyncHandler(async (req: Request, res: Response) => {
  ok(res, await svc.getProjectInstruments(Number(req.params.projectId)));
});

export const getAlerts = asyncHandler(async (_req: Request, res: Response) => {
  ok(res, await svc.getExpiryAlerts());
});

export const getBills = asyncHandler(async (req: Request, res: Response) => {
  ok(res, await svc.getProjectBills(Number(req.params.projectId)));
});
