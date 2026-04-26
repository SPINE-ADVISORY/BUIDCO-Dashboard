import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok, created, noContent } from "../../utils/ApiResponse";
import { CreateCosSchema, UpdateCosSchema } from "./cos.schema";
import * as svc from "./cos.service";

export const getTimeline = asyncHandler(async (req: Request, res: Response) => {
  const projectId = req.query.projectId ? Number(req.query.projectId) : undefined;
  const data = await svc.getCosEotTimeline(projectId);
  ok(res, data);
});

export const getSummary = asyncHandler(async (_req: Request, res: Response) => {
  const data = await svc.getCosEotSummary();
  ok(res, data);
});

export const addCosEot = asyncHandler(async (req: Request, res: Response) => {
  const input = CreateCosSchema.parse(req.body);
  const data  = await svc.createCosEot(input);
  created(res, data);
});

export const editCosEot = asyncHandler(async (req: Request, res: Response) => {
  const input = UpdateCosSchema.parse(req.body);
  const data  = await svc.updateCosEot(Number(req.params.id), input);
  ok(res, data);
});

export const removeCosEot = asyncHandler(async (req: Request, res: Response) => {
  await svc.deleteCosEot(Number(req.params.id));
  noContent(res);
});
