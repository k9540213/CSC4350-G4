import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthRequest } from "../middleware/requireAuth";
import { COOKIE_NAME } from "../lib/jwt";

export const usersRouter = Router();
usersRouter.use(requireAuth);

const updateMeSchema = z.object({
  name: z.string().min(1).optional(),
  ghostedThresholdDays: z.number().int().min(1).max(365).optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8),
});

usersRouter.patch("/me", async (req: Request, res: Response) => {
  const { userId } = req as AuthRequest;
  const parsed = updateMeSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message });
    return;
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: parsed.data,
  });

  res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    hasPassword: Boolean(user.passwordHash),
    gmailConnected: user.gmailConnected,
    ghostedThresholdDays: user.ghostedThresholdDays,
    createdAt: user.createdAt,
  });
});

usersRouter.patch("/me/password", async (req: Request, res: Response) => {
  const { userId } = req as AuthRequest;
  const parsed = changePasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message });
    return;
  }
  const { currentPassword, newPassword } = parsed.data;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  if (user.passwordHash) {
    if (!currentPassword) {
      res.status(400).json({ error: "Current password is required" });
      return;
    }
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Current password is incorrect" });
      return;
    }
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  res.json({ ok: true });
});

usersRouter.delete("/me", async (req: Request, res: Response) => {
  const { userId } = req as AuthRequest;
  await prisma.user.delete({ where: { id: userId } });
  res.clearCookie(COOKIE_NAME);
  res.json({ ok: true });
});
