import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok } from "../../utils/ApiResponse";
import * as svc from "./dashboard.service";

export const getPortfolioKpis = asyncHandler(async (_req: Request, res: Response) => {
  const data = await svc.getPortfolioKpis();
  ok(res, data);
});

export const getSectorKpis = asyncHandler(async (_req: Request, res: Response) => {
  const data = await svc.getSectorKpis();
  ok(res, data);
});

export const getStatusBreakdown = asyncHandler(async (_req: Request, res: Response) => {
  const data = await svc.getStatusBreakdown();
  ok(res, data);
});
