import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok } from "../../utils/ApiResponse";
import * as svc from "./progress.service";

export const getProjectProgress = asyncHandler(async (req: Request, res: Response) => {
  ok(res, await svc.getProgress(Number(req.params.projectId)));
});

export const saveProgress = asyncHandler(async (req: Request, res: Response) => {
  const { snap_month, ...rest } = req.body;
  ok(res, await svc.upsertProgress(Number(req.params.projectId), snap_month, rest));
});
