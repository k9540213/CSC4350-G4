import { Request, Response, NextFunction } from "express";
import { verifyToken, COOKIE_NAME } from "../lib/jwt";

export interface AuthRequest extends Request {
  userId: string;
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies[COOKIE_NAME];
  if (!token) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  try {
    const payload = verifyToken(token);
    (req as AuthRequest).userId = payload.userId;
    next();
  } catch {
    res.status(401).json({ error: "Session expired" });
  }
}
