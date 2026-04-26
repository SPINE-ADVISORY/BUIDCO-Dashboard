import { Request, Response, NextFunction } from "express";
import { db } from "../db";
import { sql } from "drizzle-orm";

// Valid roles
const VALID_ROLES = ["MD", "DC", "PMU_ENGINEER", "FINANCE", "READ_ONLY"] as const;
type Role = (typeof VALID_ROLES)[number];

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userRole: Role;
      userId: number;
    }
  }
}

/**
 * Reads role from x-user-role header (dev mode).
 * In production, replace with JWT decode.
 */
export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const roleHeader = (req.headers["x-user-role"] as string)?.toUpperCase();
  const userIdHeader = req.headers["x-user-id"] as string;

  const role: Role = VALID_ROLES.includes(roleHeader as Role)
    ? (roleHeader as Role)
    : "READ_ONLY";

  const userId = parseInt(userIdHeader || "0", 10) || 0;

  req.userRole = role;
  req.userId   = userId;

  // Set PostgreSQL session variables for RLS
  try {
    await db.execute(sql`SELECT set_config('app.role', ${role}, true)`);
    if (userId) {
      await db.execute(sql`SELECT set_config('app.user_id', ${String(userId)}, true)`);
    }
  } catch {
    // RLS config is best-effort; don't block the request if DB isn't ready
  }

  next();
}
