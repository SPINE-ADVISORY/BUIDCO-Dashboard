import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok, created, noContent } from "../../utils/ApiResponse";
import * as svc from "./flags.service";

export const listOpenFlags = asyncHandler(async (_req: Request, res: Response) => {
  ok(res, await svc.getOpenFlags());
});

export const listDcFlags = asyncHandler(async (_req: Request, res: Response) => {
  ok(res, await svc.getDcActionFlags());
});

export const listSeverityCounts = asyncHandler(async (_req: Request, res: Response) => {
  ok(res, await svc.getFlagSeverityCounts());
});

export const addFlag = asyncHandler(async (req: Request, res: Response) => {
  created(res, await svc.createFlag(req.body));
});

export const editFlag = asyncHandler(async (req: Request, res: Response) => {
  ok(res, await svc.updateFlag(Number(req.params.id), req.body));
});

export const resolveFlag = asyncHandler(async (req: Request, res: Response) => {
  await svc.resolveFlag(Number(req.params.id));
  noContent(res);
});

export const removeFlag = asyncHandler(async (req: Request, res: Response) => {
  await svc.deleteFlag(Number(req.params.id));
  noContent(res);
});
