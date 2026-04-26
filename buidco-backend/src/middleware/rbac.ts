import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/ApiError";

type Role = "MD" | "DC" | "PMU_ENGINEER" | "FINANCE" | "READ_ONLY";

export function requireRole(...allowed: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!allowed.includes(req.userRole as Role)) {
      return next(new ApiError(403, `Requires one of: ${allowed.join(", ")}`));
    }
    next();
  };
}

export function requireCanEdit(req: Request, _res: Response, next: NextFunction) {
  if (!["MD", "PMU_ENGINEER"].includes(req.userRole)) {
    return next(new ApiError(403, "Edit access denied"));
  }
  next();
}

export function requireCanAdd(req: Request, _res: Response, next: NextFunction) {
  if (req.userRole !== "MD") {
    return next(new ApiError(403, "Only MD can add new records"));
  }
  next();
}
