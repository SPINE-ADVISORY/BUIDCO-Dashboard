import { Response } from "express";

export function ok<T>(res: Response, data: T, meta?: Record<string, unknown>) {
  res.json({ data, ...(meta ? { meta } : {}) });
}

export function created<T>(res: Response, data: T) {
  res.status(201).json({ data });
}

export function noContent(res: Response) {
  res.status(204).end();
}
