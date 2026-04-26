import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok, created, noContent } from "../../utils/ApiResponse";
import { CreateProjectSchema, UpdateProjectSchema } from "./projects.schema";
import * as svc from "./projects.service";

export const listProjects = asyncHandler(async (req: Request, res: Response) => {
  const data = await svc.getProjects({
    limit:       Number(req.query.limit ?? 500),
    offset:      Number(req.query.offset ?? 0),
    sector_code: req.query.sector_code as string,
    district:    req.query.district as string,
    status:      req.query.status as string,
    search:      req.query.search as string,
  });
  ok(res, data);
});

export const getProject = asyncHandler(async (req: Request, res: Response) => {
  const data = await svc.getProjectById(Number(req.params.id));
  ok(res, data);
});

export const addProject = asyncHandler(async (req: Request, res: Response) => {
  const input = CreateProjectSchema.parse(req.body);
  const data  = await svc.createProject(input);
  created(res, data);
});

export const editProject = asyncHandler(async (req: Request, res: Response) => {
  const input = UpdateProjectSchema.parse(req.body);
  const data  = await svc.updateProject(Number(req.params.id), input);
  ok(res, data);
});

export const removeProject = asyncHandler(async (req: Request, res: Response) => {
  await svc.deleteProject(Number(req.params.id));
  noContent(res);
});
